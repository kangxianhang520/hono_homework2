const PRIMARY_LATENCY_MAX_MS = 300;
const TERTIARY_LATENCY_MAX_MS = 500;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const PERCENT = 100;

export type LatencyTone = "primary" | "tertiary" | "error";

/** <300ms primary, 300-500ms tertiary, >500ms error (NFR target is 500ms). */
export function latencyTone(latencyMs: number): LatencyTone {
	if (latencyMs < PRIMARY_LATENCY_MAX_MS) {
		return "primary";
	}
	if (latencyMs <= TERTIARY_LATENCY_MAX_MS) {
		return "tertiary";
	}
	return "error";
}

/** Relative time such as `12s ago`; null for missing/invalid input. */
export function formatRelativeTime(
	iso: string | null | undefined,
	nowMs: number
): string | null {
	if (!iso) {
		return null;
	}
	const time = Date.parse(iso);
	if (Number.isNaN(time)) {
		return null;
	}
	const seconds = Math.max(0, Math.floor((nowMs - time) / MS_PER_SECOND));
	if (seconds < SECONDS_PER_MINUTE) {
		return `${seconds}s ago`;
	}
	if (seconds < SECONDS_PER_HOUR) {
		return `${Math.floor(seconds / SECONDS_PER_MINUTE)}m ago`;
	}
	if (seconds < SECONDS_PER_DAY) {
		return `${Math.floor(seconds / SECONDS_PER_HOUR)}h ago`;
	}
	return `${Math.floor(seconds / SECONDS_PER_DAY)}d ago`;
}

/** Remaining quota as a whole percentage; null when limit is unknown/zero. */
export function formatQuotaPercent(
	rateLimit: { limit: number; remaining: number } | null | undefined
): string | null {
	if (!rateLimit || rateLimit.limit <= 0) {
		return null;
	}
	const percent = Math.round((rateLimit.remaining / rateLimit.limit) * PERCENT);
	return `${Math.min(PERCENT, Math.max(0, percent))}%`;
}
