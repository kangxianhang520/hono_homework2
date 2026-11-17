import { useEffect, useState } from "react";

const TICK_MS = 1000;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_ONLY_THRESHOLD_SECONDS = 10 * SECONDS_PER_MINUTE;

export function formatRemaining(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	if (seconds >= MINUTES_ONLY_THRESHOLD_SECONDS) {
		return `${Math.ceil(seconds / SECONDS_PER_MINUTE)}m`;
	}
	if (seconds >= SECONDS_PER_MINUTE) {
		return `${Math.floor(seconds / SECONDS_PER_MINUTE)}m ${seconds % SECONDS_PER_MINUTE}s`;
	}
	return `${seconds}s`;
}

/** Counts down to a unix epoch (seconds); returns null when no target. */
export function useCountdown(epoch: number | null | undefined) {
	const resetEpoch = epoch ?? null;
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (resetEpoch === null) {
			return;
		}
		setNow(Date.now());
		const id = globalThis.setInterval(() => setNow(Date.now()), TICK_MS);
		return () => globalThis.clearInterval(id);
	}, [resetEpoch]);

	if (resetEpoch === null) {
		return null;
	}
	return formatRemaining(resetEpoch - now / MS_PER_SECOND);
}
