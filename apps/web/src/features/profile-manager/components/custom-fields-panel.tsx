import { Button } from "@hono_homework_2/ui/components/console/button";
import { Icon } from "@hono_homework_2/ui/components/console/icon";
import { Panel } from "@hono_homework_2/ui/components/console/panel";
import { useToast } from "@hono_homework_2/ui/components/console/toast";
import { useCallback, useState } from "react";

import type { CustomField } from "../types";

import { AddFieldCard } from "./add-field-card";
import { CustomFieldRow } from "./custom-field-row";

interface CustomFieldsPanelProps {
	fields: readonly CustomField[];
	onAdd: (draft: Omit<CustomField, "id">) => void;
	onRemove: (id: string) => void;
}

export function CustomFieldsPanel({
	fields,
	onAdd,
	onRemove,
}: CustomFieldsPanelProps) {
	const { showToast } = useToast();
	const [adding, setAdding] = useState(false);

	const handleAdd = useCallback(
		(draft: Omit<CustomField, "id">) => {
			onAdd(draft);
			setAdding(false);
			showToast(`成功新增自定义字段: ${draft.key}`);
		},
		[onAdd, showToast]
	);

	const handleRemove = useCallback(
		(field: CustomField) => {
			onRemove(field.id);
			showToast("已移除该扩展字段");
		},
		[onRemove, showToast]
	);

	const toggleAdding = useCallback(() => setAdding((open) => !open), []);
	const closeAdding = useCallback(() => setAdding(false), []);

	return (
		<div className="flex flex-col gap-space-md xl:col-span-7">
			<Panel className="flex h-full flex-col">
				{/* Header */}
				<div className="flex flex-col justify-between gap-space-sm pb-space-md sm:flex-row sm:items-center">
					<div>
						<div className="flex items-center gap-space-xs">
							<Icon className="text-primary" name="data_object" size={22} />
							<h3 className="font-display text-headline-sm text-on-surface">
								附加自定义字段 (Custom Metadata & Tags)
							</h3>
						</div>
						<p className="mt-1 text-body-sm text-on-surface-variant">
							支持自由添加、编辑或删除个人档案附加字段，方便同步至内部团队花名册、SSO
							目录或构建管道。
						</p>
					</div>
					<Button
						aria-expanded={adding}
						className="self-start shadow-sm sm:self-center"
						icon={adding ? "close" : "add"}
						onClick={toggleAdding}
						variant="primary"
					>
						{adding ? "收起" : "新增字段"}
					</Button>
				</div>

				{adding ? (
					<AddFieldCard
						onAdd={handleAdd}
						onCancel={closeAdding}
						onInvalid={showToast}
					/>
				) : null}

				{/* Table */}
				<div className="flex flex-1 flex-col overflow-hidden rounded-panel bg-surface-container-lowest shadow-inner">
					<div className="eyebrow grid grid-cols-12 bg-surface-container-high px-space-md py-2.5">
						<div className="col-span-4 sm:col-span-3">字段键名 (Key)</div>
						<div className="col-span-2 hidden sm:block">类型 (Type)</div>
						<div className="col-span-6 sm:col-span-5">字段数值 (Value)</div>
						<div className="col-span-2 text-right">操作</div>
					</div>

					{fields.length > 0 ? (
						<div className="divide-y divide-surface-container">
							{fields.map((field) => (
								<CustomFieldRow
									field={field}
									key={field.id}
									onRemove={handleRemove}
								/>
							))}
						</div>
					) : (
						<div className="flex flex-1 flex-col items-center justify-center gap-space-xs px-space-md py-space-xl text-center text-outline">
							<Icon name="dataset" size={28} />
							<span className="font-code text-label-code-sm">
								暂无扩展字段，点击「新增字段」开始添加
							</span>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between pt-space-md font-code text-label-code-sm text-outline">
					<div className="flex items-center gap-1.5">
						<Icon name="info" size={16} />
						<span>
							当前已载入{" "}
							<span className="font-semibold text-on-surface">
								{fields.length}
							</span>{" "}
							项扩展属性
						</span>
					</div>
					<span>自动持久化至内部存储</span>
				</div>
			</Panel>
		</div>
	);
}
