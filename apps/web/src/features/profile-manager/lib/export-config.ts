import type { CustomField, StandardProfile } from "../types";

import { toExportValue } from "./field-value";

export function buildConfig(
	profile: StandardProfile,
	fields: readonly CustomField[]
) {
	return {
		profile,
		custom_fields: Object.fromEntries(
			fields.map((field) => [field.key, toExportValue(field)])
		),
		exported_at: new Date().toISOString(),
	};
}

export function downloadJson(data: unknown, filename: string): void {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
