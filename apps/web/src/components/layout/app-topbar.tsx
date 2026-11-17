import { Icon } from "@hono_homework_2/ui/components/console/icon";
import { StatusDot } from "@hono_homework_2/ui/components/console/status-dot";
import { Fragment, type ReactNode } from "react";

import { PLACEHOLDER } from "./placeholder";

interface AppTopbarProps {
	/** Right-side toolbar buttons (before the avatar). */
	actions?: ReactNode;
	/** Breadcrumb segments; the last one is highlighted. */
	breadcrumb: readonly string[];
	/** Masked token label shown in the connection pill. */
	connectedToken: string | null;
}

export function AppTopbar({
	breadcrumb,
	connectedToken,
	actions,
}: AppTopbarProps) {
	const [root, ...rest] = breadcrumb;
	const lastIndex = rest.length - 1;

	return (
		<header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-surface/80 px-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-72">
			<div className="flex min-w-0 items-center gap-space-md">
				<nav
					aria-label="Breadcrumb"
					className="flex items-center gap-space-xs truncate font-code text-label-code text-on-surface-variant"
				>
					<span className="font-semibold text-on-surface">{root}</span>
					{rest.map((segment, index) => (
						<Fragment key={segment}>
							<span className="text-outline">/</span>
							<span
								className={
									index === lastIndex ? "font-medium text-primary" : undefined
								}
							>
								{segment}
							</span>
						</Fragment>
					))}
				</nav>
				<div className="hidden h-4 w-px bg-surface-container-high md:block" />
				<div className="hidden items-center gap-space-xs rounded-pill bg-surface-container-high px-space-sm py-0.5 font-code text-label-code-sm text-primary md:inline-flex">
					<StatusDot />
					<span>Token Connected: {connectedToken ?? PLACEHOLDER}</span>
				</div>
			</div>

			<div className="flex items-center gap-space-sm">
				{actions}
				<div className="mx-space-xs h-5 w-px bg-surface-container-high" />
				<div className="flex size-8 items-center justify-center rounded-pill bg-primary">
					<Icon className="text-on-primary" name="person" size={18} />
				</div>
			</div>
		</header>
	);
}
