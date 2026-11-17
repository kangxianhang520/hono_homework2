import { GithubApiError } from "./errors";
import type { GithubRateLimit } from "./headers";
import { parseRateLimit, parseScopes } from "./headers";

const GITHUB_API_BASE = "https://api.github.com";
const NETWORK_ERROR_MESSAGE = "Failed to reach GitHub";
const FALLBACK_ERROR_MESSAGE = "GitHub API request failed";
const MISSING_RATE_LIMIT_MESSAGE = "GitHub response missing rate limit headers";
const INVALID_BODY_MESSAGE = "GitHub response body could not be parsed";
const BAD_GATEWAY_STATUS = 502;

export interface GithubCallMeta {
	latencyMs: number;
	rateLimit: GithubRateLimit;
	/** null = response had no X-OAuth-Scopes (fine-grained token) */
	scopes: string[] | null;
}

const readErrorMessage = async (response: Response): Promise<string> => {
	try {
		const body: unknown = await response.json();
		if (
			typeof body === "object" &&
			body !== null &&
			"message" in body &&
			typeof body.message === "string"
		) {
			return body.message;
		}
	} catch {
		// non-JSON body: fall through to the generic message
	}
	return FALLBACK_ERROR_MESSAGE;
};

export const githubRequest = async <T>(
	token: string,
	path: string,
	init?: RequestInit
): Promise<{ data: T; meta: GithubCallMeta }> => {
	const headers = new Headers(init?.headers);
	headers.set("Accept", "application/vnd.github+json");
	headers.set("X-GitHub-Api-Version", "2022-11-28");
	headers.set("User-Agent", "github-inspector");
	headers.set("Authorization", `Bearer ${token}`);

	const startedAt = performance.now();
	let response: Response;
	try {
		response = await fetch(`${GITHUB_API_BASE}${path}`, { ...init, headers });
	} catch (error) {
		// fetch errors carry no request headers, so the token is not in the cause.
		// biome-ignore lint/style/useErrorCause: cause passed via custom constructor arg
		throw new GithubApiError(0, NETWORK_ERROR_MESSAGE, null, error);
	}
	const latencyMs = Math.round(performance.now() - startedAt);
	const rateLimit = parseRateLimit(response.headers);

	if (!response.ok) {
		throw new GithubApiError(
			response.status,
			await readErrorMessage(response),
			rateLimit
		);
	}
	if (rateLimit === null) {
		throw new GithubApiError(BAD_GATEWAY_STATUS, MISSING_RATE_LIMIT_MESSAGE);
	}

	let data: T;
	try {
		data = (await response.json()) as T;
	} catch (error) {
		// malformed/truncated body: route through the same upstream-error mapping
		// biome-ignore lint/style/useErrorCause: cause passed via custom constructor arg
		throw new GithubApiError(
			BAD_GATEWAY_STATUS,
			INVALID_BODY_MESSAGE,
			rateLimit,
			error
		);
	}
	return {
		data,
		meta: {
			scopes: parseScopes(response.headers.get("x-oauth-scopes")),
			rateLimit,
			latencyMs,
		},
	};
};
