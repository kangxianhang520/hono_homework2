import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs `onDone` after `delayMs`, exposing a pending flag in between.
 * Used for the design's simulated in-flight states (sync spinner, save dimming).
 * The pending timer is cleared on unmount so no state is set afterwards.
 */
export function useTimedAction(delayMs: number) {
	const [pending, setPending] = useState(false);
	const timerRef = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(timerRef.current), []);

	const run = useCallback(
		(onDone: () => void) => {
			if (timerRef.current !== undefined) {
				return;
			}
			setPending(true);
			timerRef.current = window.setTimeout(() => {
				timerRef.current = undefined;
				setPending(false);
				onDone();
			}, delayMs);
		},
		[delayMs]
	);

	return { pending, run } as const;
}
