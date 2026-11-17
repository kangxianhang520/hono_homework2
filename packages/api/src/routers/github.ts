import { TRPCError } from "@trpc/server";

import { githubRequest } from "../github/client";
import { githubUserSchema } from "../github/schemas";
import { githubProcedure, router } from "../index";

export const githubRouter = router({
	sync: githubProcedure.mutation(async ({ ctx }) => {
		const { data, meta } = await githubRequest<unknown>(
			ctx.githubToken,
			"/user"
		);
		const parsed = githubUserSchema.safeParse(data);
		if (!parsed.success) {
			throw new TRPCError({
				code: "BAD_GATEWAY",
				message: "GITHUB_UPSTREAM_ERROR",
			});
		}
		return {
			profile: parsed.data,
			scopes: meta.scopes,
			rateLimit: meta.rateLimit,
			latencyMs: meta.latencyMs,
			syncedAt: new Date().toISOString(),
		};
	}),
});
