import { Icon } from "@hono_homework_2/ui/components/console/icon";
import { ProgressBar } from "@hono_homework_2/ui/components/console/progress-bar";
import { cx } from "@hono_homework_2/ui/lib/cx";
import { type MouseEvent, useCallback, useState } from "react";

import { NAV_ITEMS } from "./nav-items";

export interface RateLimitInfo {
	limit: number;
	remaining: number;
	resetsIn: string;
	resource: string;
}

interface AppSidebarProps {
	defaultActiveId?: string;
	rateLimit: RateLimitInfo;
}

const numberFormat = new Intl.NumberFormat("en-US");

export function AppSidebar({
	rateLimit,
	defaultActiveId = "custom-fields",
}: AppSidebarProps) {
	const [activeId, setActiveId] = useState(defaultActiveId);
	const handleSelect = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		const { navId } = event.currentTarget.dataset;
		if (navId) {
			setActiveId(navId);
		}
	}, []);
	const percent = (rateLimit.remaining / rateLimit.limit) * 100;

	return (
		<aside className="fixed top-0 left-0 z-50 hidden h-full w-72 flex-col justify-between bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
			<div className="flex flex-col">
				{/* Brand */}
				<div className="flex h-16 items-center gap-space-sm px-space-lg">
					<div className="flex size-8 items-center justify-center rounded-control bg-surface-container-high text-primary">
						<Icon name="terminal" size={20} />
					</div>
					<div className="flex flex-col">
						<span className="font-display text-headline-sm text-on-surface leading-none tracking-tight">
							GitHub Inspector
						</span>
						<span className="mt-0.5 font-code text-label-code-sm text-outline">
							v2.4.0-edge
						</span>
					</div>
				</div>

				<div className="px-space-md py-space-sm">
					<div className="eyebrow px-space-sm py-space-xs">
						Developer Scopes
					</div>
				</div>

				<nav aria-label="主导航" className="flex flex-col gap-1 px-space-md">
					{NAV_ITEMS.map((item) => {
						const active = item.id === activeId;
						return (
							<button
								aria-current={active ? "page" : undefined}
								className={cx(
									"flex items-center gap-space-sm rounded-control px-space-md py-space-sm text-left transition-colors",
									active
										? "bg-surface-container-high font-bold text-primary"
										: "font-display text-label-ui text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
								)}
								data-nav-id={item.id}
								key={item.id}
								onClick={handleSelect}
								type="button"
							>
								<Icon name={item.icon} size={18} />
								<span>{item.label}</span>
							</button>
						);
					})}
				</nav>
			</div>

			{/* Rate limit widget */}
			<div className="m-space-md flex flex-col gap-space-xs rounded-panel bg-surface-container-lowest p-space-md">
				<div className="flex items-center justify-between">
					<span className="font-display text-label-ui text-on-surface-variant">
						Rate Limit
					</span>
					<span className="font-code text-label-code-sm text-primary">
						{numberFormat.format(rateLimit.remaining)} /{" "}
						{numberFormat.format(rateLimit.limit)}
					</span>
				</div>
				<ProgressBar value={percent} />
				<div className="flex items-center justify-between pt-space-xs">
					<span className="font-code text-label-code-sm text-outline">
						Resets in {rateLimit.resetsIn}
					</span>
					<span className="font-code text-label-code-sm text-on-surface-variant">
						{rateLimit.resource}
					</span>
				</div>
			</div>
		</aside>
	);
}
