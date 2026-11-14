import type { Session } from "@hono_homework_2/auth";
import type { Database } from "@hono_homework_2/db";

export type Context = {
	session: Session | null;
	db: Database;
};
