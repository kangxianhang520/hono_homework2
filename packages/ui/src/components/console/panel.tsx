import { Icon } from "@hono_homework_2/ui/components/console/icon";

import { cx } from "@hono_homework_2/ui/lib/cx";
import type { ReactNode } from "react";

const SHADOW_CLASSES = {
	lg: "shadow-lg",
	xl: "shadow-xl",
} as const;

interface PanelProps {
	as?: "div" | "section";
	children: ReactNode;
	className?: string;
	shadow?: keyof typeof SHADOW_CLASSES;
}

/** Level-1 surface card used by every section of the console. */
export function Panel({
	as: Tag = "div",
	shadow = "lg",
	children,
	className,
}: PanelProps) {
	return (
		<Tag className={cx("panel", SHADOW_CLASSES[shadow], className)}>
			{children}
		</Tag>
	);
}

interface PanelHeaderProps {
	/** Right-hand slot (badge, button …). */
	action?: ReactNode;
	className?: string;
	description?: ReactNode;
	icon: string;
	title: ReactNode;
}

/** Icon + title + description header shared by the form panels. */
export function PanelHeader({
	icon,
	title,
	description,
	action,
	className,
}: PanelHeaderProps) {
	return (
		<div
			className={cx("flex items-center justify-between pb-space-md", className)}
		>
			<div className="flex items-center gap-space-xs">
				<Icon className="text-primary" name={icon} size={22} />
				<div>
					<h3 className="font-display text-headline-sm text-on-surface">
						{title}
					</h3>
					{description ? (
						<p className="text-body-sm text-on-surface-variant">
							{description}
						</p>
					) : null}
				</div>
			</div>
			{action}
		</div>
	);
}
