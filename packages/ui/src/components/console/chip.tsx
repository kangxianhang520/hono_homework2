import { cx } from "@hono_homework_2/ui/lib/cx";
import type { ReactNode } from "react";

const TONE_CLASSES = {
	/** Default scope / metadata pill. */
	default: "bg-surface-container-high text-on-surface",
	muted: "bg-surface-container-high text-on-surface-variant",
	primary: "bg-surface-container-high text-primary",
	secondary: "bg-surface-container-high text-secondary-fixed-dim",
	tertiary: "bg-surface-container-high text-tertiary",
	/** Emerald-tinted active state (10% fill). */
	success: "bg-primary/10 text-primary",
	/** Subtle schema label. */
	ghost: "bg-surface-container text-outline",
} as const;

export type ChipTone = keyof typeof TONE_CLASSES;

interface ChipProps {
	children: ReactNode;
	className?: string;
	tone?: ChipTone;
}

export function Chip({ children, tone = "default", className }: ChipProps) {
	return (
		<span className={cx("chip", TONE_CLASSES[tone], className)}>
			{children}
		</span>
	);
}
