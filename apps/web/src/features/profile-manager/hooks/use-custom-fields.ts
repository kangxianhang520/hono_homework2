import { useCallback, useEffect, useState } from "react";

import { INITIAL_CUSTOM_FIELDS } from "../data";
import { type CustomField, FIELD_TYPES } from "../types";

const STORAGE_KEY = "gh-inspector:custom-fields";

function isCustomField(value: unknown): value is CustomField {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const v = value as Record<string, unknown>;
	return (
		typeof v.id === "string" &&
		typeof v.key === "string" &&
		typeof v.value === "string" &&
		FIELD_TYPES.includes(v.type as CustomField["type"])
	);
}

function loadFields(): CustomField[] {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed: unknown = JSON.parse(raw);
			if (Array.isArray(parsed) && parsed.every(isCustomField)) {
				return parsed;
			}
		}
	} catch {
		// Storage unavailable or corrupted — fall back to defaults.
	}
	return [...INITIAL_CUSTOM_FIELDS];
}

/** Custom metadata list, persisted to localStorage ("自动持久化至内部存储"). */
export function useCustomFields() {
	const [fields, setFields] = useState<CustomField[]>(loadFields);

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
		} catch {
			// Ignore quota / privacy-mode failures; state still lives in memory.
		}
	}, [fields]);

	const addField = useCallback((draft: Omit<CustomField, "id">) => {
		setFields((prev) => [...prev, { ...draft, id: crypto.randomUUID() }]);
	}, []);

	const removeField = useCallback((id: string) => {
		setFields((prev) => prev.filter((field) => field.id !== id));
	}, []);

	const resetFields = useCallback(() => {
		try {
			window.localStorage.removeItem(STORAGE_KEY);
		} catch {
			// Ignore.
		}
		setFields([...INITIAL_CUSTOM_FIELDS]);
	}, []);

	return { fields, addField, removeField, resetFields } as const;
}
