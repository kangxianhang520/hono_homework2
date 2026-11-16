import {
	GetSecretValueCommand,
	SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

interface RdsMasterSecret {
	password: string;
	username: string;
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

async function readSecret(
	client: SecretsManagerClient,
	secretId: string
): Promise<string> {
	const result = await client.send(
		new GetSecretValueCommand({ SecretId: secretId })
	);
	if (!result.SecretString) {
		throw new Error(`Secret has no string value: ${secretId}`);
	}
	return result.SecretString;
}

/**
 * Builds `DATABASE_URL` from the RDS-managed master secret
 * (`DB_SECRET_ARN`, JSON `{ username, password }`) plus `DB_HOST` / `DB_PORT` /
 * `DB_NAME`. Reading it at cold start keeps working after RDS rotates the
 * managed password.
 */
export async function resolveDatabaseUrl(
	client: SecretsManagerClient = new SecretsManagerClient({})
): Promise<string> {
	const dbSecret = JSON.parse(
		await readSecret(client, requireEnv("DB_SECRET_ARN"))
	) as RdsMasterSecret;
	const host = requireEnv("DB_HOST");
	const port = process.env.DB_PORT ?? "5432";
	const name = requireEnv("DB_NAME");
	const user = encodeURIComponent(dbSecret.username);
	const password = encodeURIComponent(dbSecret.password);
	return `postgresql://${user}:${password}@${host}:${port}/${name}?sslmode=verify-full`;
}

/**
 * Resolves the API's runtime secrets from AWS Secrets Manager into
 * `process.env` before the app (and its DB / auth clients) is initialised:
 * `DATABASE_URL` (see `resolveDatabaseUrl`) and `BETTER_AUTH_SECRET`
 * (plain-string secret `AUTH_SECRET_ARN`).
 */
export async function loadSecretsIntoEnv(): Promise<void> {
	const client = new SecretsManagerClient({});
	const [databaseUrl, authSecret] = await Promise.all([
		resolveDatabaseUrl(client),
		readSecret(client, requireEnv("AUTH_SECRET_ARN")),
	]);
	process.env.DATABASE_URL = databaseUrl;
	process.env.BETTER_AUTH_SECRET = authSecret;
}
