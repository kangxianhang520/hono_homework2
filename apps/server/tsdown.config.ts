import { defineConfig, type UserConfig } from "tsdown";

/** Shared settings for self-contained AWS Lambda bundles deployed by SAM. */
const lambdaBundle: UserConfig = {
	format: "esm",
	platform: "node",
	target: "node22",
	clean: true,
	deps: {
		// Bundle everything except the AWS SDK v3 (provided by the runtime).
		alwaysBundle: [/^(?!@aws-sdk\/).*/],
	},
};

export default defineConfig([
	{
		// Node server (local / container): npm deps stay external.
		entry: "./src/index.ts",
		format: "esm",
		outDir: "./dist",
		clean: true,
		deps: {
			alwaysBundle: [/@hono_homework_2\/.*/],
		},
	},
	{
		// API Lambda (template.yaml: ApiFunction).
		...lambdaBundle,
		entry: "./src/lambda.ts",
		outDir: "./dist-lambda",
	},
	{
		// Migration Lambda (template.yaml: MigrateFunction).
		...lambdaBundle,
		entry: "./src/lambda-migrate.ts",
		outDir: "./dist-lambda-migrate",
		copy: [
			{
				from: "../../packages/db/src/migrations",
				to: "./dist-lambda-migrate",
			},
		],
	},
]);
