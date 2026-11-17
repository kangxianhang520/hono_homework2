export interface GithubRateLimit {
	limit: number;
	remaining: number;
	resetEpoch: number;
}

const SCOPE_SEPARATOR = ",";

/**
 * Parse `X-OAuth-Scopes`. Returns null when the header is absent
 * (e.g. fine-grained tokens), and [] when present but empty.
 */
export const parseScopes = (value: string | null): string[] | null => {
	if (value === null) {
		return null;
	}
	return value
		.split(SCOPE_SEPARATOR)
		.map((scope) => scope.trim())
		.filter((scope) => scope.length > 0);
};

const parseNonNegativeInt = (value: string | null): number | null => {
	if (value === null || value.trim() === "") {
		return null;
	}
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

/**
 * Parse `X-RateLimit-*` headers. Returns null if any is missing or malformed.
 */
export const parseRateLimit = (headers: Headers): GithubRateLimit | null => {
	const limit = parseNonNegativeInt(headers.get("x-ratelimit-limit"));
	const remaining = parseNonNegativeInt(headers.get("x-ratelimit-remaining"));
	const resetEpoch = parseNonNegativeInt(headers.get("x-ratelimit-reset"));
	if (limit === null || remaining === null || resetEpoch === null) {
		return null;
	}
	return { limit, remaining, resetEpoch };
};
