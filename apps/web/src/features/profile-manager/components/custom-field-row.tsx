import { IconButton } from "@hono_homework_2/ui/components/console/button";
import {
	Chip,
	type ChipTone,
} from "@hono_homework_2/ui/components/console/chip";
import { cx } from "@hono_homework_2/ui/lib/cx";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CustomField, FieldType } from "../types";

import { FieldValueCell } from "./field-value-cell";

const EXIT_DURATION_MS = 200;

const TYPE_TONE: Record<FieldType, ChipTone> = {
	Text: "muted",
	Tags: "primary",
	URL: "secondary",
	Number: "tertiary",
};

interface CustomFieldRowProps {
	field: CustomField;
	onRemove: (field: CustomField) => void;
}

export function CustomFieldRow({ field, onRemove }: CustomFieldRowProps) {
	const [leaving, setLeaving] = useState(false);
	// Keep the latest callback without restarting the exit timer on re-render.
	const onRemoveRef = useRef(onRemove);
	onRemoveRef.current = onRemove;

	const startLeaving = useCallback(() => setLeaving(true), []);

	// Fade the row out first, then actually remove it from state.
	useEffect(() => {
		if (!leaving) {
			return;
		}
		const timer = window.setTimeout(
			() => onRemoveRef.current(field),
			EXIT_DURATION_MS
		);
		return () => window.clearTimeout(timer);
	}, [leaving, field]);

	return (
		<div
			className={cx(
				"fade-in grid animate-in grid-cols-12 items-center px-space-md py-3 transition-[background-color,opacity] duration-200 hover:bg-surface-container-low",
				leaving && "pointer-events-none opacity-0"
			)}
		>
			<div className="col-span-4 truncate font-code font-medium text-label-code text-on-surface sm:col-span-3">
				{field.key}
			</div>
			<div className="col-span-2 hidden sm:block">
				<Chip tone={TYPE_TONE[field.type]}>{field.type}</Chip>
			</div>
			<FieldValueCell field={field} />
			<div className="col-span-2 flex items-center justify-end gap-1">
				<IconButton
					icon="delete"
					label={`删除字段 ${field.key} (Delete)`}
					onClick={startLeaving}
					tone="danger"
				/>
			</div>
		</div>
	);
}
