import { defineConfig } from "vitest/config";

/**
 * Unit-test config kept separate from vite.config.ts so tests do not load
 * the varlock / router / tailwind plugins (pure logic only, node env).
 */
export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
