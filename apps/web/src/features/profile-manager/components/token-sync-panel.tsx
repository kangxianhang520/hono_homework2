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
import { type ChangeEvent, useCallback, useState } from "react";

import { SESSION } from "../data";
import { useCountdown } from "../hooks/use-countdown";
import type {
	GithubSyncError,
	GithubSyncStatus,
} from "../hooks/use-github-sync";
import { loadToken } from "../lib/token-storage";

const numberFormat = new Intl.NumberFormat("en-US");
const PERCENT = 100;
const TOKENS_URL = "https://github.com/settings/tokens";

export interface TokenSyncPanelProps {
	error: GithubSyncError | null;
	onSync: (token: string) => void;
	rateLimit: { limit: number; remaining: number; resetEpoch: number } | null;
	/** null = not synced yet or fine-grained token (no X-OAuth-Scopes header). */
	scopes: string[] | null;
	status: GithubSyncStatus;
	synced: boolean;
}

function ErrorBanner({
	error,
	resetIn,
}: {
	error: GithubSyncError;
	resetIn: string | null;
}) {
	let content: React.ReactNode;
	switch (error.message) {
		case "GITHUB_TOKEN_INVALID":
			content = (
				<>
					Token 无效或已过期，请前往{" "}
					<a
						className="underline"
						href={TOKENS_URL}
						rel="noopener noreferrer"
						target="_blank"
					>
						GitHub Token 设置
					</a>{" "}
					重新生成。
				</>
			);
			break;
		case "GITHUB_RATE_LIMITED":
			content = `API 配额已耗尽${resetIn ? `，将在 ${resetIn} 后重置` : ""}。`;
			break;
		case "GITHUB_FORBIDDEN":
			content = "Token 权限不足（403），请检查所授予的 scopes。";
			break;
		case "UNAUTHORIZED":
			content = "请先输入 Personal Access Token。";
			break;
		default:
			content = "GitHub 服务暂时不可用，请稍后重试。";
	}
	return (
		<div
			className="mt-space-sm flex items-center gap-space-sm rounded-control bg-error/10 px-space-md py-space-xs text-body-sm text-error"
			role="alert"
		>
			<Icon name="error" size={18} />
			<span>{content}</span>
		</div>
	);
}

export function TokenSyncPanel({
	error,
	onSync,
	rateLimit,
	scopes,
	status,
	synced,
}: TokenSyncPanelProps) {
	const { showToast } = useToast();
	const [pat, setPat] = useState<string>(() => loadToken() ?? "");
	const [revealed, setRevealed] = useState(false);
	const syncing = status === "pending";
	// A rate-limit error carries the authoritative reset time; prefer it over
	// a possibly stale (or absent) rateLimit from the last successful sync.
	const resetIn = useCountdown(error?.resetEpoch ?? rateLimit?.resetEpoch);

	const quotaPercent = rateLimit
		? (rateLimit.remaining / rateLimit.limit) * PERCENT
		: 0;

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
		onSync(pat.trim());
	}, [pat, onSync, showToast]);

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
					{scopes?.map((scope) => (
						<Chip key={scope}>{scope}</Chip>
					))}
					{synced && scopes === null && (
						<span className="text-body-sm text-on-surface-variant">
							Fine-grained Token 不返回 scopes，权限以实际调用结果为准
						</span>
					)}
					{!synced && <span className="text-outline">—</span>}
					{synced ? (
						<Chip className="flex items-center gap-1" tone="success">
							<Icon name="verified" size={14} />
							Active
						</Chip>
					) : null}
				</div>
				<div className="flex flex-col gap-1 md:col-span-5">
					<div className="flex items-center justify-between font-code text-label-code-sm">
						<span className="text-outline">API 配额调用余量:</span>
						<span className="font-medium text-primary">
							{rateLimit
								? `${numberFormat.format(rateLimit.remaining)} / ${numberFormat.format(rateLimit.limit)} (${quotaPercent.toFixed(1)}%)${resetIn ? ` · 重置 ${resetIn}` : ""}`
								: "—"}
						</span>
					</div>
					<ProgressBar value={quotaPercent} />
				</div>
			</div>

			{error ? <ErrorBanner error={error} resetIn={resetIn} /> : null}
			{!error && synced ? (
				<div className="mt-space-sm flex items-center gap-space-sm rounded-control bg-primary/10 px-space-md py-space-xs text-body-sm text-primary">
					<Icon name="check_circle" size={18} />
					<span>
						数据已通过 GitHub REST API v3
						成功同步，可在下方查看账户基本信息并自由增加或删除附加字段属性。
					</span>
				</div>
			) : null}
		</Panel>
	);
}
