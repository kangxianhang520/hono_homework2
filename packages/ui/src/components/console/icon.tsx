import { cx } from "@hono_homework_2/ui/lib/cx";

interface IconProps {
	className?: string;
	/** Material Symbols ligature name, e.g. "terminal", "delete". */
	name: string;
	/** Glyph size in px. */
	size?: number;
}

export function Icon({ name, size = 18, className }: IconProps) {
	return (
		<span
			aria-hidden="true"
			className={cx("icon-glyph", className)}
			style={{ fontSize: size }}
		>
			{name}
		</span>
	);
}
