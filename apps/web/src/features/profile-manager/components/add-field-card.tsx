import { Button } from "@hono_homework_2/ui/components/console/button";
import {
	CompactField,
	Select,
	TextInput,
} from "@hono_homework_2/ui/components/console/field";
import { Icon } from "@hono_homework_2/ui/components/console/icon";
import {
	type ChangeEvent,
	type FormEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";

import { FIELD_TYPE_LABELS } from "../data";
import { validateField } from "../lib/field-value";
import { type CustomField, FIELD_TYPES, type FieldType } from "../types";

interface AddFieldCardProps {
	onAdd: (draft: Omit<CustomField, "id">) => void;
	onCancel: () => void;
	onInvalid: (message: string) => void;
}

/** Collapsible inline form for creating a custom metadata field. */
export function AddFieldCard({
	onAdd,
	onCancel,
	onInvalid,
}: AddFieldCardProps) {
	const idPrefix = useId();
	const keyInputRef = useRef<HTMLInputElement>(null);
	const [key, setKey] = useState("");
	const [type, setType] = useState<FieldType>("Text");
	const [value, setValue] = useState("");

	// Focus the key input when the card opens.
	useEffect(() => {
		keyInputRef.current?.focus();
	}, []);

	const handleKeyChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => setKey(event.target.value),
		[]
	);
	const handleTypeChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) =>
			setType(event.target.value as FieldType),
		[]
	);
	const handleValueChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value),
		[]
	);

	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const draft = { key: key.trim(), type, value: value.trim() };
			const error = validateField(draft);
			if (error) {
				onInvalid(error);
				return;
			}
			onAdd(draft);
		},
		[key, type, value, onAdd, onInvalid]
	);

	return (
		<form
			className="fade-in slide-in-from-top-2 mb-space-md flex animate-in flex-col gap-space-sm rounded-panel bg-surface-container p-space-md duration-300"
			onSubmit={handleSubmit}
		>
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-1 font-display font-semibold text-label-ui text-primary">
					<Icon name="playlist_add" size={16} />
					新建扩展字段属性
				</span>
				<span className="font-code text-label-code-sm text-outline">
					自动加入本地状态
				</span>
			</div>

			<div className="grid grid-cols-1 gap-space-sm sm:grid-cols-12">
				<div className="sm:col-span-4">
					<CompactField htmlFor={`${idPrefix}-key`} label="字段名 (Key)">
						<TextInput
							controlSize="sm"
							id={`${idPrefix}-key`}
							onChange={handleKeyChange}
							placeholder="例如: GPG Key ID"
							ref={keyInputRef}
							value={key}
						/>
					</CompactField>
				</div>
				<div className="sm:col-span-3">
					<CompactField htmlFor={`${idPrefix}-type`} label="类型 (Type)">
						<Select
							id={`${idPrefix}-type`}
							onChange={handleTypeChange}
							value={type}
						>
							{FIELD_TYPES.map((option) => (
								<option key={option} value={option}>
									{FIELD_TYPE_LABELS[option]}
								</option>
							))}
						</Select>
					</CompactField>
				</div>
				<div className="sm:col-span-5">
					<CompactField htmlFor={`${idPrefix}-value`} label="字段值 (Value)">
						<TextInput
							controlSize="sm"
							id={`${idPrefix}-value`}
							onChange={handleValueChange}
							placeholder={
								type === "Tags"
									? "用逗号分隔，例如: Go, Rust"
									: "例如: 4A82F9108E2101BC"
							}
							value={value}
						/>
					</CompactField>
				</div>
			</div>

			<div className="flex items-center justify-end gap-space-sm pt-space-xs">
				<Button onClick={onCancel} size="xs" variant="muted">
					取消
				</Button>
				<Button icon="check" size="xs" type="submit" variant="primary">
					确认添加
				</Button>
			</div>
		</form>
	);
}
