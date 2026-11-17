import { describe, expect, it } from "vitest";

import { GithubApiError } from "../github/errors";
import { mapGithubError } from "../index";

const rateLimit = (remaining: number) => ({
	limit: 5000,
	remaining,
	resetEpoch: 1_700_000_000,
});

describe("mapGithubError", () => {
	it("maps 401 to UNAUTHORIZED", () => {
		const mapped = mapGithubError(new GithubApiError(401, "Bad credentials"));
		expect(mapped.code).toBe("UNAUTHORIZED");
		expect(mapped.message).toBe("GITHUB_TOKEN_INVALID");
	});

	it.each([403, 429])("maps %i with remaining 0 to rate limited", (status) => {
		const mapped = mapGithubError(
			new GithubApiError(status, "limit", rateLimit(0))
		);
		expect(mapped.code).toBe("TOO_MANY_REQUESTS");
		expect(mapped.message).toBe("GITHUB_RATE_LIMITED");
	});

	it("maps 403 with quota left to FORBIDDEN", () => {
		const mapped = mapGithubError(
			new GithubApiError(403, "nope", rateLimit(10))
		);
		expect(mapped.code).toBe("FORBIDDEN");
		expect(mapped.message).toBe("GITHUB_FORBIDDEN");
	});

	it("maps 403 without rate limit headers to FORBIDDEN", () => {
		expect(mapGithubError(new GithubApiError(403, "nope")).code).toBe(
			"FORBIDDEN"
		);
	});

	it.each([0, 500, 502])("maps status %i to BAD_GATEWAY", (status) => {
		const mapped = mapGithubError(new GithubApiError(status, "boom"));
		expect(mapped.code).toBe("BAD_GATEWAY");
		expect(mapped.message).toBe("GITHUB_UPSTREAM_ERROR");
	});
});
