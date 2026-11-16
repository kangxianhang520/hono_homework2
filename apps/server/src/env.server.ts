import z from "zod";

import { ENV as VARLOCK_ENV } from "./env";

/**
 * Server env accessor.
 *
 * - Local / Node: varlock resolves `.env.schema` + `.env*` at boot (needs the
 *   varlock CLI and schema files on disk).
 * - AWS Lambda: neither is shipped in the bundle, so values come straight from
 *   `process.env` (set by `template.yaml` and `lambda-secrets.ts`) and are
 *   validated here with the same rules as `.env.schema`.
 */
const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

if (!isLambda) {
	await import("varlock/auto-load");
}

const lambdaEnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.url(),
	CORS_ORIGIN: z.url(),
	DATABASE_URL: z.string().min(1),
});

export const ENV: Readonly<z.infer<typeof lambdaEnvSchema>> = isLambda
	? lambdaEnvSchema.parse(process.env)
	: VARLOCK_ENV;
