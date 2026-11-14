import { todo } from "@hono_homework_2/db/schema/todo";
import { eq } from "drizzle-orm";
import z from "zod";

import { publicProcedure, router } from "../index";

export const todoRouter = router({
	getAll: publicProcedure.query(
		async ({ ctx }) => await ctx.db.select().from(todo)
	),

	create: publicProcedure.input(z.object({ text: z.string().min(1) })).mutation(
		async ({ input, ctx }) =>
			await ctx.db.insert(todo).values({
				text: input.text,
			})
	),

	toggle: publicProcedure
		.input(z.object({ id: z.number(), completed: z.boolean() }))
		.mutation(
			async ({ input, ctx }) =>
				await ctx.db
					.update(todo)
					.set({ completed: input.completed })
					.where(eq(todo.id, input.id))
		),

	delete: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(
			async ({ input, ctx }) =>
				await ctx.db.delete(todo).where(eq(todo.id, input.id))
		),
});
