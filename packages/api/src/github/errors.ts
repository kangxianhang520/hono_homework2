import type { GithubRateLimit } from "./headers";

/**
 * Error raised for non-2xx GitHub responses or network failures.
 * Never carries the token (message is GitHub's own message only).
 * status = 0 means the request never got an HTTP response.
 */
export class GithubApiError extends Error {
	readonly status: number;
	readonly rateLimit: GithubRateLimit | null;

	constructor(
		status: number,
		message: string,
		rateLimit: GithubRateLimit | null = null,
		cause?: unknown
	) {
		super(message, { cause });
		this.name = "GithubApiError";
		this.status = status;
		this.rateLimit = rateLimit;
	}
}
