import {
	Button,
	IconButton,
} from "@hono_homework_2/ui/components/console/button";
import { Chip } from "@hono_homework_2/ui/components/console/chip";
import { TextInput } from "@hono_homework_2/ui/components/console/field";
import { Icon } from "@hono_homework_2/ui/components/console/icon";
import { Panel } from "@hono_homework_2/ui/components/console/panel";
import { ProgressBar } from "@hono_homework_2/ui/components/console/progress-bar";
import { StatusDot } from "@hono_homework_2/ui/components/console/status-dot";
import { useToast } from "@hono_homework_2/ui/components/console/toast";
import { useTimedAction } from "@hono_homework_2/ui/hooks/use-timed-action";
import { type ChangeEvent, useCallback, useState } from "react";

import { RATE_LIMIT, SESSION } from "../data";

const SYNC_DURATION_MS = 1200;
const numberFormat = new Intl.NumberFormat("en-US");

export function TokenSyncPanel() {
	const { showToast } = useToast();
	const [pat, setPat] = useState<string>(SESSION.initialPat);
	const [revealed, setRevealed] = useState(false);
	const { pending: syncing, run: runSync } = useTimedAction(SYNC_DURATION_MS);

	const quotaPercent = (RATE_LIMIT.remaining / RATE_LIMIT.limit) * 100;

	const handlePatChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => setPat(event.target.value),
		[]
	);
	const toggleReveal = useCallback(() => setRevealed((value) => !value), []);

	const handleSync = useCallback(() => {
		if (!pat.trim()) {
			showToast("请先输入 Personal Access Token");
			return;
		}
		runSync(() => showToast("已同步最新 GitHub 账户配置与 Rate Limit 状态"));
	}, [pat, runSync, showToast]);

	return (
		<Panel
			as="section"
			className="relative mb-space-lg overflow-hidden"
			shadow="xl"
		>
			{/* Ambient emerald glow */}
			<div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-primary/5 blur-3xl" />

			<div className="relative z-10 flex flex-col items-start justify-between gap-space-lg xl:flex-row xl:items-center">
				<div className="flex max-w-xl flex-col gap-space-xs">
					<div className="flex items-center gap-space-xs">
						<StatusDot pulse />
						<span className="font-code text-label-code-sm text-primary uppercase tracking-wider">
							REST API v3 Realtime Session
						</span>
						<span className="mx-1 text-outline">•</span>
						<span className="font-code text-label-code-sm text-on-surface-variant">
							Host: {SESSION.host}
						</span>
					</div>
					<h2 className="font-display text-headline-sm text-on-surface">
						Personal Access Token 验证与数据同步
					</h2>
					<p className="text-body-sm text-on-surface-variant">
						配置拥有{" "}
						<code className="rounded-chip bg-surface-container-highest px-1.5 py-0.5 font-code text-label-code-sm text-primary">
							user
						</code>{" "}
						读写权限的 PAT，即可一键实时拉取并在本地管理自定义扩展属性。
					</p>
				</div>

				{/* PAT input row */}
				<div className="flex w-full flex-col items-stretch gap-space-sm sm:flex-row sm:items-center xl:w-auto">
					<div className="flex-1 sm:w-80">
						<TextInput
							aria-label="Personal Access Token"
							autoComplete="off"
							controlSize="lg"
							leadingIcon="key"
							onChange={handlePatChange}
							spellCheck={false}
							trailing={
								<IconButton
									icon={revealed ? "visibility" : "visibility_off"}
									label="显示/隐藏 Token"
									onClick={toggleReveal}
								/>
							}
							type={revealed ? "text" : "password"}
							value={pat}
						/>
					</div>
					<Button
						disabled={syncing}
						icon="sync"
						iconClassName={syncing ? "animate-spin" : undefined}
						onClick={handleSync}
						pending={syncing}
						size="tall"
						variant="primary"
					>
						{syncing ? "正在请求 API..." : "获取/同步数据"}
					</Button>
				</div>
			</div>

			{/* Scopes & quota */}
			<div className="mt-space-md grid grid-cols-1 items-center gap-space-md rounded-panel bg-surface-container-lowest/60 p-space-md md:grid-cols-12">
				<div className="flex flex-wrap items-center gap-space-xs md:col-span-7">
					<span className="mr-space-xs font-code text-label-code-sm text-outline uppercase">
						Granted Scopes:
					</span>
					{SESSION.scopes.map((scope) => (
						<Chip key={scope}>{scope}</Chip>
					))}
					<Chip className="flex items-center gap-1" tone="success">
						<Icon name="verified" size={14} />
						Active
					</Chip>
				</div>
				<div className="flex flex-col gap-1 md:col-span-5">
					<div className="flex items-center justify-between font-code text-label-code-sm">
						<span className="text-outline">API 配额调用余量:</span>
						<span className="font-medium text-primary">
							{numberFormat.format(RATE_LIMIT.remaining)} /{" "}
							{numberFormat.format(RATE_LIMIT.limit)} ({quotaPercent.toFixed(1)}
							%)
						</span>
					</div>
					<ProgressBar value={quotaPercent} />
				</div>
			</div>

			{/* Sync status */}
			<div className="mt-space-sm flex items-center gap-space-sm rounded-control bg-primary/10 px-space-md py-space-xs text-body-sm text-primary">
				<Icon name="check_circle" size={18} />
				<span>
					数据已通过 GitHub REST API v3
					成功同步，可在下方查看账户基本信息并自由增加或删除附加字段属性。
				</span>
			</div>
		</Panel>
	);
}
