import { Icon } from "@hono_homework_2/ui/components/console/icon";

import { cx } from "@hono_homework_2/ui/lib/cx";
import type { ComponentProps } from "react";

const VARIANT_CLASSES = {
	primary:
		"bg-primary text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-95",
	secondary:
		"bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest",
	muted:
		"bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest",
	toolbar:
		"bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface",
} as const;

const SIZE_CLASSES = {
	xs: "gap-1 px-space-md py-1",
	sm: "gap-space-xs px-space-sm py-1.5",
	md: "gap-space-xs px-space-md py-1.5",
	lg: "gap-1.5 px-space-md py-2",
	xl: "gap-1.5 px-space-lg py-2",
	tall: "h-10 gap-space-xs px-space-md",
} as const;

const ICON_SIZE: Record<keyof typeof SIZE_CLASSES, number> = {
	xs: 16,
	sm: 16,
	md: 16,
	lg: 18,
	xl: 18,
	tall: 18,
};

export type ButtonVariant = keyof typeof VARIANT_CLASSES;
export type ButtonSize = keyof typeof SIZE_CLASSES;

interface ButtonProps extends ComponentProps<"button"> {
	/** Leading Material Symbols icon. */
	icon?: string;
	/** Extra classes for the icon (e.g. animate-spin). */
	iconClassName?: string;
	/** When true the button dims, like the design's in-flight state. */
	pending?: boolean;
	size?: ButtonSize;
	variant?: ButtonVariant;
}

export function Button({
	variant = "toolbar",
	size = "md",
	icon,
	iconClassName,
	pending = false,
	className,
	children,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			aria-busy={pending || undefined}
			className={cx(
				"inline-flex items-center justify-center whitespace-nowrap rounded-control font-display text-label-ui disabled:cursor-not-allowed",
				VARIANT_CLASSES[variant],
				SIZE_CLASSES[size],
				pending && "opacity-75",
				className
			)}
			type={type}
			{...props}
		>
			{icon ? (
				<Icon className={iconClassName} name={icon} size={ICON_SIZE[size]} />
			) : null}
			{children}
		</button>
	);
}

interface IconButtonProps extends ComponentProps<"button"> {
	icon: string;
	/** Accessible name; also used as the tooltip. */
	label: string;
	tone?: "neutral" | "danger";
}

export function IconButton({
	icon,
	label,
	tone = "neutral",
	className,
	...props
}: IconButtonProps) {
	return (
		<button
			aria-label={label}
			className={cx(
				"flex items-center rounded-control text-outline transition-colors",
				tone === "danger"
					? "p-1.5 hover:bg-error/10 hover:text-error"
					: "hover:text-on-surface",
				className
			)}
			title={label}
			type="button"
			{...props}
		>
			<Icon name={icon} size={18} />
		</button>
	);
}
