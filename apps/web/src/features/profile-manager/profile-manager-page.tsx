import { Button } from "@hono_homework_2/ui/components/console/button";
import { useToast } from "@hono_homework_2/ui/components/console/toast";
import { useTimedAction } from "@hono_homework_2/ui/hooks/use-timed-action";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { ConsoleShell } from "@/components/layout/console-shell";

import { ActionBar } from "./components/action-bar";
import { CustomFieldsPanel } from "./components/custom-fields-panel";
import { IdentityCard } from "./components/identity-card";
import { IdentityCardSkeleton } from "./components/identity-card-skeleton";
import { OverviewEmptyState } from "./components/overview-empty-state";
import { StandardProfilePanel } from "./components/standard-profile-panel";
import {
	TelemetryCard,
	TelemetryCardSkeleton,
} from "./components/telemetry-card";
import { TokenSyncPanel } from "./components/token-sync-panel";
import { SESSION } from "./data";
import { useCountdown } from "./hooks/use-countdown";
import { useCustomFields } from "./hooks/use-custom-fields";
import { useGithubSync } from "./hooks/use-github-sync";
import { useProfileForm } from "./hooks/use-profile-form";
import { buildConfig, downloadJson } from "./lib/export-config";
import { toIdentityView } from "./lib/profile-view";

const SAVE_DURATION_MS = 600;
const RATE_LIMIT_RESOURCE = "Core API";

export function ProfileManagerPage() {
	const { showToast } = useToast();
	const profileForm = useProfileForm();
	const customFields = useCustomFields();
	const githubSync = useGithubSync();
	const { pending: saving, run: runSave } = useTimedAction(SAVE_DURATION_MS);

	const [panelKey, setPanelKey] = useState(0);
	const { clear: clearGithubSession } = githubSync;
	const syncedRateLimit = githubSync.data?.rateLimit ?? null;
	const resetsIn = useCountdown(syncedRateLimit?.resetEpoch);
	const shellRateLimit = useMemo(
		() =>
			syncedRateLimit
				? {
						limit: syncedRateLimit.limit,
						remaining: syncedRateLimit.remaining,
						resetsIn,
						resource: RATE_LIMIT_RESOURCE,
					}
				: null,
		[syncedRateLimit, resetsIn]
	);
	const maskedToken = githubSync.data?.maskedToken ?? null;

	const { profile } = profileForm;
	const { fields } = customFields;

	const handleExport = useCallback(() => {
		downloadJson(
			buildConfig(profile, fields),
			`github-profile-${profile.login}-${Date.now()}.json`
		);
		showToast("配置 JSON 已成功导出下载");
	}, [profile, fields, showToast]);

	const { reset: resetProfile, commit: commitProfile } = profileForm;
	const { resetFields } = customFields;

	const handleReset = useCallback(() => {
		resetProfile();
		showToast("已重置标准档案更改");
	}, [resetProfile, showToast]);

	const handleSave = useCallback(() => {
		runSave(() => {
			commitProfile();
			showToast("档案信息及自定义字段已成功同步并持久化！");
		});
	}, [runSave, commitProfile, showToast]);

	const handleClearCache = useCallback(() => {
		resetFields();
		clearGithubSession();
		setPanelKey((key) => key + 1);
		showToast("已清除本地缓存，Token 与同步数据已清除，自定义字段已恢复默认");
	}, [resetFields, clearGithubSession, showToast]);

	let overview: ReactNode;
	if (githubSync.status === "pending") {
		overview = (
			<>
				<IdentityCardSkeleton />
				<TelemetryCardSkeleton />
			</>
		);
	} else if (githubSync.data) {
		overview = (
			<>
				<IdentityCard view={toIdentityView(githubSync.data.profile)} />
				<TelemetryCard
					latencyMs={githubSync.data.latencyMs}
					nodeId={githubSync.data.profile.node_id ?? null}
					rateLimit={githubSync.data.rateLimit}
					syncedAt={githubSync.data.syncedAt}
				/>
			</>
		);
	} else {
		overview = <OverviewEmptyState />;
	}

	return (
		<ConsoleShell
			breadcrumb={SESSION.breadcrumb}
			connectedToken={maskedToken}
			headerActions={
				<>
					<Button
						aria-label="Export JSON"
						icon="file_download"
						onClick={handleExport}
						size="sm"
					>
						<span className="hidden sm:inline">Export JSON</span>
					</Button>
					<Button
						aria-label="Clear Cache"
						icon="delete_sweep"
						onClick={handleClearCache}
						size="sm"
					>
						<span className="hidden sm:inline">Clear Cache</span>
					</Button>
				</>
			}
			rateLimit={shellRateLimit}
		>
			<div className="flex w-full flex-col pb-24">
				<TokenSyncPanel
					error={githubSync.error}
					key={panelKey}
					onSync={githubSync.sync}
					rateLimit={githubSync.data?.rateLimit ?? null}
					scopes={githubSync.data?.scopes ?? null}
					status={githubSync.status}
					synced={githubSync.data !== null}
				/>

				<section className="mb-space-lg grid grid-cols-1 gap-space-lg lg:grid-cols-12">
					{overview}
				</section>

				<section className="grid grid-cols-1 gap-space-lg xl:grid-cols-12">
					<StandardProfilePanel
						onChange={profileForm.updateField}
						onSubmit={handleSave}
						profile={profile}
					/>
					<CustomFieldsPanel
						fields={fields}
						onAdd={customFields.addField}
						onRemove={customFields.removeField}
					/>
				</section>
			</div>

			<ActionBar
				dirty={profileForm.dirty}
				onExport={handleExport}
				onReset={handleReset}
				onSave={handleSave}
				saving={saving}
			/>
		</ConsoleShell>
	);
}
