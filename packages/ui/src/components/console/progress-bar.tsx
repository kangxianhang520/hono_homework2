interface ProgressBarProps {
	/** 0–100 */
	value: number;
}

const MAX_PERCENT = 100;

/**
 * Thin usage bar. Decorative: every usage in the design already prints the
 * exact numbers next to it, so it is hidden from assistive tech.
 */
export function ProgressBar({ value }: ProgressBarProps) {
	const clamped = Math.min(MAX_PERCENT, Math.max(0, value));

	return (
		<div
			aria-hidden="true"
			className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high"
		>
			<div
				className="h-full rounded-full bg-primary transition-all duration-500"
				style={{ width: `${clamped}%` }}
			/>
		</div>
	);
}
