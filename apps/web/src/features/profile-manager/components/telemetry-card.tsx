import { Panel } from "@hono_homework_2/ui/components/console/panel";
import { StatusDot } from "@hono_homework_2/ui/components/console/status-dot";
import { cx } from "@hono_homework_2/ui/lib/cx";

import { TELEMETRY } from "../data";

import { ActivitySparkline } from "./activity-sparkline";

export function TelemetryCard() {
	return (
		<Panel className="flex flex-col justify-between lg:col-span-8">
			<div className="flex items-center justify-between pb-space-sm">
				<div>
					<span className="eyebrow">Telemetry Insights</span>
					<h4 className="mt-0.5 font-display text-headline-sm text-on-surface">
						代码提交与 API 同步热度
					</h4>
				</div>
				<div className="flex items-center gap-space-xs rounded-control bg-surface-container px-space-sm py-1 font-code text-label-code-sm">
					<StatusDot />
					<span className="text-on-surface">
						近 30 天 {TELEMETRY.changesLast30Days} 次修改
					</span>
				</div>
			</div>

			<div className="my-space-md flex flex-col gap-space-sm rounded-panel bg-surface-container-lowest p-space-md">
				<div className="flex items-center justify-between font-code text-label-code-sm text-outline">
					<span>Monthly API Activity Density</span>
					<span>Avg response: {TELEMETRY.avgResponseMs}ms</span>
				</div>
				<div className="flex h-24 w-full items-end">
					<ActivitySparkline />
				</div>
				<div className="flex justify-between px-1 font-code text-label-code-sm text-outline">
					{TELEMETRY.axis.map((tick) => (
						<span key={tick}>{tick}</span>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-space-md pt-space-xs font-code text-label-code-sm sm:grid-cols-3">
				{TELEMETRY.metrics.map((metric) => (
					<div
						className="rounded-control bg-surface-container p-space-sm"
						key={metric.label}
					>
						<span className="block text-outline">{metric.label}</span>
						<span
							className={cx(
								"font-semibold text-[14px]",
								metric.highlight ? "text-primary" : "text-on-surface"
							)}
						>
							{metric.value}
						</span>
					</div>
				))}
			</div>
		</Panel>
	);
}
