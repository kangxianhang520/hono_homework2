import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

/**
 * Creates the Drizzle client backed by a node-postgres connection pool
 * (AWS RDS / Aurora PostgreSQL). TLS settings come from `DATABASE_URL`
 * (e.g. `sslmode=verify-full`, with the RDS CA bundle provided via
 * `NODE_EXTRA_CA_CERTS`).
 */
export function createDb(env: DatabaseConfig) {
	const pool = new Pool({ connectionString: env.DATABASE_URL });
	return drizzle({ client: pool, relations });
}

export type Database = ReturnType<typeof createDb>;
