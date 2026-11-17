import { protectedProcedure, publicProcedure, router } from "../index";
import { githubRouter } from "./github";
import { todoRouter } from "./todo";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	privateData: protectedProcedure.query(({ ctx }) => ({
		message: "This is private",
		user: ctx.session.user,
	})),
	github: githubRouter,
	todo: todoRouter,
});
export type AppRouter = typeof appRouter;
