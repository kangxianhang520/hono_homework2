import type { CustomField, FieldType, StandardProfile } from "./types";

export const SESSION = {
	host: "api.github.com",
	breadcrumb: ["GitHub", "Account Inspector", "Profile & Fields"],
} as const;

export const INITIAL_PROFILE: StandardProfile = {
	login: "octo-coder",
	name: "Alex Chen",
	email: "alex.chen@devtools.io",
	bio: "Full-stack Architect & Open Source Enthusiast. Focused on high-throughput backend services and compiler toolchains.",
	blog: "https://blog.alexchen.dev",
	company: "@AcmeCorp-Labs",
	location: "San Francisco, CA",
	twitter_username: "@alexchen_dev",
};

export const INITIAL_CUSTOM_FIELDS: readonly CustomField[] = [
	{
		id: "gpg-key-id",
		key: "GPG Key ID",
		type: "Text",
		value: "4A82F9108E2101BC",
	},
	{
		id: "tech-stack",
		key: "Tech Stack",
		type: "Tags",
		value: "TypeScript, Rust, React, GraphQL",
	},
	{ id: "discord", key: "Discord Handle", type: "Text", value: "alexc#4092" },
	{
		id: "sponsorship",
		key: "Sponsorship Link",
		type: "URL",
		value: "https://github.com/sponsors/octo-coder",
	},
	{
		id: "timezone",
		key: "Preferred Timezone",
		type: "Text",
		value: "UTC-7 (Pacific Time)",
	},
];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
	Text: "Text (文本)",
	Tags: "Tags (标签组)",
	URL: "URL (链接)",
	Number: "Number (数值)",
};
