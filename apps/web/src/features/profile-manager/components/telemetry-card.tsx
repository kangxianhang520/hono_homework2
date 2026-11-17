import { Panel } from "@hono_homework_2/ui/components/console/panel";
import { StatusDot } from "@hono_homework_2/ui/components/console/status-dot";
import { Skeleton } from "@hono_homework_2/ui/components/skeleton";
import { cx } from "@hono_homework_2/ui/lib/cx";
import { useEffect, useState } from "react";

import { PLACEHOLDER } from "@/components/layout/placeholder";

import {
	formatQuotaPercent,
	formatRelativeTime,
	type LatencyTone,
	latencyTone,
} from "../lib/telemetry-view";

const TICK_MS = 1000;
const SKELETON_METRIC_KEYS = ["latency", "synced", "quota", "node"] as const;

const TONE_CLASS: Record<LatencyTone, string> = {
	primary: "text-primary",
	tertiary: "text-tertiary",
	error: "text-error",
};

interface TelemetryCardProps {
	latencyMs: number | null;
	nodeId: string | null;
	rateLimit: { limit: number; remaining: number } | null;
	syncedAt: string | null;
}

interface MetricProps {
	label: string;
	value: string;
	valueClassName?: string;
}

function Metric({ label, value, valueClassName }: MetricProps) {
	return (
		<div className="min-w-0 rounded-control bg-surface-container p-space-sm">
			<span className="block text-outline">{label}</span>
			<span
				className={cx(
					"block truncate font-semibold text-[14px]",
					valueClassName ?? "text-on-surface"
				)}
				title={value}
			>
				{value}
			</span>
		</div>
	);
}

function useNow(active: boolean): number {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!active) {
			return;
		}
		setNow(Date.now());
		const id = setInterval(() => setNow(Date.now()), TICK_MS);
		return () => clearInterval(id);
	}, [active]);
	return now;
}

export function TelemetryCard({
	latencyMs,
	syncedAt,
	rateLimit,
	nodeId,
}: TelemetryCardProps) {
	const now = useNow(syncedAt !== null);
	const relative = formatRelativeTime(syncedAt, now);
	const quota = formatQuotaPercent(rateLimit);

	return (
		<Panel className="flex flex-col gap-space-md lg:col-span-8">
			<div className="flex items-center justify-between">
				<div>
					<span className="eyebrow">Telemetry Insights</span>
					<h4 className="mt-0.5 font-display text-headline-sm text-on-surface">
						本次同步即时指标
					</h4>
				</div>
				<div className="flex items-center gap-space-xs rounded-control bg-surface-container px-space-sm py-1 font-code text-label-code-sm">
					<StatusDot />
					<span className="text-on-surface">Live</span>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-space-md font-code text-label-code-sm sm:grid-cols-2">
				<Metric
					label="Sync Latency"
					value={latencyMs === null ? PLACEHOLDER : `${latencyMs}ms`}
					valueClassName={
						latencyMs === null ? undefined : TONE_CLASS[latencyTone(latencyMs)]
					}
				/>
				<Metric label="Last Synced" value={relative ?? PLACEHOLDER} />
				<Metric label="Quota Remaining" value={quota ?? PLACEHOLDER} />
				<Metric label="GraphQL Node" value={nodeId ?? PLACEHOLDER} />
			</div>
		</Panel>
	);
}

export function TelemetryCardSkeleton() {
	return (
		<Panel
			aria-busy="true"
			aria-label="Loading telemetry"
			className="flex flex-col gap-space-md lg:col-span-8"
		>
			<Skeleton className="h-10 w-1/2" />
			<div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
				{SKELETON_METRIC_KEYS.map((key) => (
					<Skeleton className="h-14 w-full" key={key} />
				))}
			</div>
		</Panel>
	);
}
