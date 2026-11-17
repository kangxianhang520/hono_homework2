import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { GithubApiError } from "./github/errors";

export const t = initTRPC.context<Context>().create({
	errorFormatter({ shape, error }) {
		const resetEpoch =
			error.cause instanceof GithubApiError
				? (error.cause.rateLimit?.resetEpoch ?? null)
				: null;
		return {
			...shape,
			data: {
				...shape.data,
				resetEpoch: error.message === "GITHUB_RATE_LIMITED" ? resetEpoch : null,
			},
		};
	},
});

export const { router } = t;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;

/** Map a GithubApiError to a TRPCError whose message is a stable code. Never includes the token. */
export function mapGithubError(error: GithubApiError): TRPCError {
	const { status, rateLimit } = error;
	if (status === HTTP_UNAUTHORIZED) {
		return new TRPCError({
			code: "UNAUTHORIZED",
			message: "GITHUB_TOKEN_INVALID",
			cause: error,
		});
	}
	const exhausted = rateLimit?.remaining === 0;
	if (
		(status === HTTP_FORBIDDEN || status === HTTP_TOO_MANY_REQUESTS) &&
		exhausted
	) {
		return new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "GITHUB_RATE_LIMITED",
			cause: error,
		});
	}
	if (status === HTTP_FORBIDDEN) {
		return new TRPCError({
			code: "FORBIDDEN",
			message: "GITHUB_FORBIDDEN",
			cause: error,
		});
	}
	return new TRPCError({
		code: "BAD_GATEWAY",
		message: "GITHUB_UPSTREAM_ERROR",
		cause: error,
	});
}

export const githubProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.githubToken) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "GITHUB_TOKEN_MISSING",
		});
	}
	const result = await next({
		ctx: { ...ctx, githubToken: ctx.githubToken },
	});
	if (!result.ok && result.error.cause instanceof GithubApiError) {
		throw mapGithubError(result.error.cause);
	}
	return result;
});
