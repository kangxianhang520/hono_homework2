import type { CustomField } from "../types";

const TAG_SEPARATOR = /[,，]/;
const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

export function splitTags(value: string): string[] {
	return value
		.split(TAG_SEPARATOR)
		.map((tag) => tag.trim())
		.filter(Boolean);
}

/** Only http(s) links are rendered as anchors (blocks javascript: URLs). */
export function toSafeUrl(value: string): string | null {
	try {
		const url = new URL(value);
		return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
	} catch {
		return null;
	}
}

/** Returns an error message, or null when the draft is valid. */
export function validateField(field: Omit<CustomField, "id">): string | null {
	if (!(field.key && field.value)) {
		return "请填写完整的字段键名与字段数值";
	}
	if (field.type === "Number" && !Number.isFinite(Number(field.value))) {
		return "Number 类型的字段值必须是数字";
	}
	if (field.type === "URL" && !toSafeUrl(field.value)) {
		return "URL 类型的字段值必须是 http(s) 链接";
	}
	return null;
}

export function toExportValue(field: CustomField): string | number | string[] {
	if (field.type === "Tags") {
		return splitTags(field.value);
	}
	if (field.type === "Number") {
		return Number(field.value);
	}
	return field.value;
}
