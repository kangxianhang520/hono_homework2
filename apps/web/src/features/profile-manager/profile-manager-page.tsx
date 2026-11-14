import { Button } from "@hono_homework_2/ui/components/console/button";
import { useToast } from "@hono_homework_2/ui/components/console/toast";
import { useTimedAction } from "@hono_homework_2/ui/hooks/use-timed-action";
import { useCallback } from "react";
import { ConsoleShell } from "@/components/layout/console-shell";

import { ActionBar } from "./components/action-bar";
import { CustomFieldsPanel } from "./components/custom-fields-panel";
import { IdentityCard } from "./components/identity-card";
import { StandardProfilePanel } from "./components/standard-profile-panel";
import { TelemetryCard } from "./components/telemetry-card";
import { TokenSyncPanel } from "./components/token-sync-panel";
import { RATE_LIMIT, SESSION } from "./data";
import { useCustomFields } from "./hooks/use-custom-fields";
import { useProfileForm } from "./hooks/use-profile-form";
import { buildConfig, downloadJson } from "./lib/export-config";

const SAVE_DURATION_MS = 600;

export function ProfileManagerPage() {
	const { showToast } = useToast();
	const profileForm = useProfileForm();
	const customFields = useCustomFields();
	const { pending: saving, run: runSave } = useTimedAction(SAVE_DURATION_MS);

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
		showToast("已清除本地缓存，自定义字段已恢复默认");
	}, [resetFields, showToast]);

	return (
		<ConsoleShell
			breadcrumb={SESSION.breadcrumb}
			connectedToken={SESSION.connectedToken}
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
			rateLimit={RATE_LIMIT}
		>
			<div className="flex w-full flex-col pb-24">
				<TokenSyncPanel />

				<section className="mb-space-lg grid grid-cols-1 gap-space-lg lg:grid-cols-12">
					<IdentityCard />
					<TelemetryCard />
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
