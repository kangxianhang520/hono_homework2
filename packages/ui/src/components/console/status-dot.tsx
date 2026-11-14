import { cx } from "@hono_homework_2/ui/lib/cx";

const SIZE_CLASSES = {
	sm: "size-2",
	md: "size-2.5",
} as const;

const TONE_CLASSES = {
	primary: "bg-primary",
	tertiary: "bg-tertiary",
} as const;

interface StatusDotProps {
	className?: string;
	pulse?: boolean;
	size?: keyof typeof SIZE_CLASSES;
	tone?: keyof typeof TONE_CLASSES;
}

export function StatusDot({
	size = "sm",
	tone = "primary",
	pulse = false,
	className,
}: StatusDotProps) {
	return (
		<span
			aria-hidden="true"
			className={cx(
				"inline-block shrink-0 rounded-full",
				SIZE_CLASSES[size],
				TONE_CLASSES[tone],
				pulse && "animate-pulse",
				className
			)}
		/>
	);
}
