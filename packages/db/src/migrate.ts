import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Applies the drizzle-kit migrations in `migrationsFolder` to the database.
 * Used by the migration Lambda (runs inside the VPC, next to RDS).
 */
export async function runMigrations(
	databaseUrl: string,
	migrationsFolder: string
): Promise<void> {
	const pool = new Pool({ connectionString: databaseUrl, max: 1 });
	try {
		await migrate(drizzle({ client: pool }), { migrationsFolder });
	} finally {
		await pool.end();
	}
}
