import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Context } from "../context";
import { t } from "../index";
import { githubRouter } from "../routers/github";

const TOKEN = "ghp_SECRET_TOKEN_1234567890";

const createCaller = t.createCallerFactory(githubRouter);

const makeCaller = (githubToken: string | null) =>
	createCaller({ db: {}, githubToken, session: null } as unknown as Context);

const rateHeaders = (remaining: number): Record<string, string> => ({
	"x-ratelimit-limit": "5000",
	"x-ratelimit-remaining": String(remaining),
	"x-ratelimit-reset": "1700000000",
});

const mockFetch = vi.fn<typeof fetch>();

const jsonResponse = (
	body: unknown,
	status: number,
	headers: Record<string, string>
) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});

const catchError = async (promise: Promise<unknown>): Promise<Error> => {
	try {
		await promise;
	} catch (error) {
		return error as Error;
	}
	throw new Error("expected promise to reject");
};

beforeEach(() => {
	vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
	mockFetch.mockReset();
	vi.unstubAllGlobals();
});

describe("github.sync", () => {
	it("returns profile, scopes and rate limit on 200", async () => {
		mockFetch.mockResolvedValue(
			jsonResponse({ login: "octocat", id: 1 }, 200, {
				...rateHeaders(4999),
				"x-oauth-scopes": "repo, read:user",
			})
		);

		const result = await makeCaller(TOKEN).sync();

		expect(result.profile.login).toBe("octocat");
		expect(result.scopes).toEqual(["repo", "read:user"]);
		expect(result.rateLimit).toEqual({
			limit: 5000,
			remaining: 4999,
			resetEpoch: 1_700_000_000,
		});
		expect(result.latencyMs).toBeGreaterThanOrEqual(0);
		expect(Number.isNaN(Date.parse(result.syncedAt))).toBe(false);

		const [url, init] = mockFetch.mock.calls[0] ?? [];
		expect(url).toBe("https://api.github.com/user");
		expect(new Headers(init?.headers).get("authorization")).toBe(
			`Bearer ${TOKEN}`
		);
	});

	it("returns null scopes for fine-grained tokens", async () => {
		mockFetch.mockResolvedValue(
			jsonResponse({ login: "octocat" }, 200, rateHeaders(10))
		);
		const result = await makeCaller(TOKEN).sync();
		expect(result.scopes).toBeNull();
	});

	it("rejects with UNAUTHORIZED when token is missing", async () => {
		const error = await catchError(makeCaller(null).sync());
		expect(error.message).toBe("GITHUB_TOKEN_MISSING");
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("maps 401 to GITHUB_TOKEN_INVALID without leaking the token", async () => {
		mockFetch.mockResolvedValue(
			jsonResponse({ message: "Bad credentials" }, 401, rateHeaders(60))
		);
		const error = await catchError(makeCaller(TOKEN).sync());
		expect(error).toMatchObject({
			code: "UNAUTHORIZED",
			message: "GITHUB_TOKEN_INVALID",
		});
		expect(
			JSON.stringify(error, Object.getOwnPropertyNames(error))
		).not.toContain(TOKEN);
		expect(String(error.cause)).not.toContain(TOKEN);
	});

	it("maps 403 with exhausted quota to GITHUB_RATE_LIMITED", async () => {
		mockFetch.mockResolvedValue(
			jsonResponse({ message: "API rate limit exceeded" }, 403, rateHeaders(0))
		);
		const error = await catchError(makeCaller(TOKEN).sync());
		expect(error).toMatchObject({
			code: "TOO_MANY_REQUESTS",
			message: "GITHUB_RATE_LIMITED",
		});
		expect(String(error.cause)).not.toContain(TOKEN);
	});

	it("maps 403 with quota left to GITHUB_FORBIDDEN", async () => {
		mockFetch.mockResolvedValue(
			jsonResponse({ message: "Forbidden" }, 403, rateHeaders(100))
		);
		const error = await catchError(makeCaller(TOKEN).sync());
		expect(error.message).toBe("GITHUB_FORBIDDEN");
	});

	it("maps network failure to GITHUB_UPSTREAM_ERROR without leaking the token", async () => {
		mockFetch.mockRejectedValue(new TypeError("fetch failed"));
		const error = await catchError(makeCaller(TOKEN).sync());
		expect(error.message).toBe("GITHUB_UPSTREAM_ERROR");
		expect(error.message).not.toContain(TOKEN);
	});

	it("maps an invalid profile payload to GITHUB_UPSTREAM_ERROR", async () => {
		mockFetch.mockResolvedValue(jsonResponse({ id: 1 }, 200, rateHeaders(10)));
		const error = await catchError(makeCaller(TOKEN).sync());
		expect(error.message).toBe("GITHUB_UPSTREAM_ERROR");
	});
});
