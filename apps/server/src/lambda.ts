import { handle } from "hono/aws-lambda";

import { loadSecretsIntoEnv } from "./lambda-secrets";

// Secrets must be in process.env before the app module creates the DB pool
// and Better Auth instance, hence the dynamic import after loading them.
await loadSecretsIntoEnv();
const { app } = await import("./app");

export const handler = handle(app);
