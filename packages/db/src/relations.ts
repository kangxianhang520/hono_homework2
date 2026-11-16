import { defineRelations } from "drizzle-orm";

// biome-ignore lint/performance/noNamespaceImport: defineRelations needs every table as one object
import * as schema from "./schema";

export const relations = {
	...defineRelations(schema),
	...schema.authRelations,
};
