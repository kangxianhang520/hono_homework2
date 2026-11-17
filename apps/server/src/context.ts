import type { Context as ApiContext } from "@hono_homework_2/api/context";
import type { Context as HonoContext } from "hono";
import { auth, db } from "./services";

export interface CreateContextOptions {
	context: HonoContext;
}

export async function createContext({
	context,
}: CreateContextOptions): Promise<ApiContext> {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	const githubToken = context.req.header("X-GitHub-Token")?.trim() || null;
	return {
		db,
		githubToken,
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
