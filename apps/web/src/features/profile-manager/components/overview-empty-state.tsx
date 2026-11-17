import { Icon } from "@hono_homework_2/ui/components/console/icon";
import { Panel } from "@hono_homework_2/ui/components/console/panel";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@hono_homework_2/ui/components/empty";

export function OverviewEmptyState() {
	return (
		<Panel className="lg:col-span-12">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Icon className="text-outline" name="sync" size={24} />
					</EmptyMedia>
					<EmptyTitle>尚未同步 GitHub 档案</EmptyTitle>
					<EmptyDescription>
						输入 Token 并同步，即可查看账号档案与遥测指标。
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</Panel>
	);
}
