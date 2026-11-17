import { describe, expect, it } from "vitest";

import { parseRateLimit, parseScopes } from "../github/headers";

describe("parseScopes", () => {
	it("returns null when header is absent", () => {
		expect(parseScopes(null)).toBeNull();
	});

	it("returns empty array for empty header", () => {
		expect(parseScopes("")).toEqual([]);
	});

	it("splits and trims scopes", () => {
		expect(parseScopes("repo, read:user ,gist")).toEqual([
			"repo",
			"read:user",
			"gist",
		]);
	});
});

describe("parseRateLimit", () => {
	it("parses valid headers", () => {
		const headers = new Headers({
			"x-ratelimit-limit": "5000",
			"x-ratelimit-remaining": "4999",
			"x-ratelimit-reset": "1700000000",
		});
		expect(parseRateLimit(headers)).toEqual({
			limit: 5000,
			remaining: 4999,
			resetEpoch: 1_700_000_000,
		});
	});

	it("returns null when a header is missing", () => {
		const headers = new Headers({
			"x-ratelimit-limit": "5000",
			"x-ratelimit-remaining": "1",
		});
		expect(parseRateLimit(headers)).toBeNull();
	});

	it("returns null for malformed values", () => {
		const headers = new Headers({
			"x-ratelimit-limit": "abc",
			"x-ratelimit-remaining": "-1",
			"x-ratelimit-reset": "1.5",
		});
		expect(parseRateLimit(headers)).toBeNull();
	});
});
