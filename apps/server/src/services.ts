import { createAuth } from "@hono_homework_2/auth";
import { createDb } from "@hono_homework_2/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
