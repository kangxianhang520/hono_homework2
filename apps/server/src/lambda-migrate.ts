import { fileURLToPath } from "node:url";

import { runMigrations } from "@hono_homework_2/db/migrate";

import { resolveDatabaseUrl } from "./lambda-secrets";

// tsdown copies packages/db/src/migrations next to this bundle.
const MIGRATIONS_FOLDER = fileURLToPath(
	new URL("./migrations", import.meta.url)
);

/**
 * Migration Lambda: runs inside the VPC (RDS is not reachable from CI) and is
 * invoked by the deploy workflow right after `sam deploy`.
 */
export const handler = async (): Promise<{ status: "ok" }> => {
	await runMigrations(await resolveDatabaseUrl(), MIGRATIONS_FOLDER);
	return { status: "ok" };
};
