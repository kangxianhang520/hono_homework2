import { Button } from "@hono_homework_2/ui/components/console/button";
import { StatusDot } from "@hono_homework_2/ui/components/console/status-dot";

interface ActionBarProps {
	dirty: boolean;
	onExport: () => void;
	onReset: () => void;
	onSave: () => void;
	saving: boolean;
}

/** Sticky bottom toolbar with the page's global actions. */
export function ActionBar({
	dirty,
	saving,
	onReset,
	onExport,
	onSave,
}: ActionBarProps) {
	return (
		<div className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-between bg-surface-container-low/95 px-space-lg py-space-sm shadow-2xl backdrop-blur-md lg:left-72">
			<div className="flex items-center gap-space-sm">
				<StatusDot size="md" tone={dirty ? "tertiary" : "primary"} />
				<span className="hidden font-code text-label-code-sm text-on-surface-variant sm:inline">
					{dirty ? "工作区有未保存的修改" : "工作区就绪 • 无未保存冲突"}
				</span>
			</div>
			<div className="flex items-center gap-space-sm">
				<Button
					icon="restart_alt"
					onClick={onReset}
					size="lg"
					variant="secondary"
				>
					重置<span className="hidden sm:inline">修改</span>
				</Button>
				<Button
					icon="data_object"
					onClick={onExport}
					size="lg"
					variant="secondary"
				>
					<span className="hidden sm:inline">导出配置为</span> JSON
				</Button>
				<Button
					className="font-semibold"
					disabled={saving}
					icon="cloud_done"
					onClick={onSave}
					pending={saving}
					size="xl"
					variant="primary"
				>
					保存<span className="hidden sm:inline">档案与自定义字段</span>
				</Button>
			</div>
		</div>
	);
}
