import type { ReactNode } from "react";

import { AppSidebar, type RateLimitInfo } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

interface ConsoleShellProps {
	breadcrumb: readonly string[];
	children: ReactNode;
	connectedToken: string;
	headerActions?: ReactNode;
	rateLimit: RateLimitInfo;
}

/** Fixed sidebar + translucent top bar + scrolling main canvas. */
export function ConsoleShell({
	breadcrumb,
	connectedToken,
	headerActions,
	rateLimit,
	children,
}: ConsoleShellProps) {
	return (
		<div className="min-h-screen bg-surface text-on-surface">
			<AppSidebar rateLimit={rateLimit} />
			<div className="flex min-h-screen flex-col lg:pl-72">
				<AppTopbar
					actions={headerActions}
					breadcrumb={breadcrumb}
					connectedToken={connectedToken}
				/>
				<main className="w-full flex-1 bg-surface px-space-lg pt-16 pb-space-lg">
					{children}
				</main>
			</div>
		</div>
	);
}
