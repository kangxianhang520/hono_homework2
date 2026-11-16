import type { Session } from "@hono_homework_2/auth";
import type { Database } from "@hono_homework_2/db";

// biome-ignore lint/style/useConsistentTypeDefinitions: tRPC/Hono createContext needs an implicit index signature, which interfaces lack
export type Context = {
	db: Database;
	session: Session | null;
};
