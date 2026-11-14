import type { RateLimitInfo } from "@/components/layout/app-sidebar";

import type { CustomField, FieldType, StandardProfile } from "./types";

/** Mock account snapshot (stands in for the GitHub REST API response). */
export const ACCOUNT = {
	avatarUrl:
		"https://lh3.googleusercontent.com/aida-public/AB6AXuAb2a_nHY520MPy5INl7FGvQkxbEZWsnknB3jUNp--6ymBpXuj8rDfjfzeojaA5OdJi5U4O-E9L1P_bFwTWHqAh9Sl-i2_x7wwMiwPFFHK5qc05a2iNaAWisD9vU4zyelsoO7DywKod76v0sKCcC5ARiZ2BdE2S9yX_5C1eQf4-x7JBmNC1NC37bcUDxlWNPbDGSXxlVAiv3d7cNFDrWNm7vHJNkJE6N3PHfijXtg",
	name: "Alex Chen",
	login: "octo-coder",
	role: "Core Contributor",
	bio: "Full-stack Architect & Open Source Enthusiast. Building resilient distributed systems and developer tooling.",
	profileUrl: "https://github.com/octo-coder",
	stats: [
		{ label: "Public Repos", value: "64" },
		{ label: "Followers", value: "1.4k" },
		{ label: "Following", value: "280" },
	],
	facts: [
		{ icon: "domain", label: "组织", value: "Acme Corp Labs" },
		{ icon: "location_on", label: "位置", value: "San Francisco, CA" },
		{ icon: "schedule", label: "建号时间", value: "2018-04-12" },
	],
} as const;

export const SESSION = {
	host: "api.github.com",
	connectedToken: "github_pat_11A***",
	initialPat: "ghp_v98Fj2389KLasdf08213mklAsdf8231",
	scopes: ["read:user", "user:email", "repo", "workflow"],
	breadcrumb: ["GitHub", "Account Inspector", "Profile & Fields"],
} as const;

export const RATE_LIMIT: RateLimitInfo = {
	remaining: 4982,
	limit: 5000,
	resetsIn: "42m",
	resource: "Core API",
};

export const TELEMETRY = {
	changesLast30Days: 284,
	avgResponseMs: 112,
	axis: ["Day 01", "Day 08", "Day 15", "Day 22", "Today"],
	metrics: [
		{ label: "Sync Latency", value: "84ms", highlight: false },
		{ label: "Metadata Schema", value: "v2.1 Validated", highlight: true },
		{ label: "GraphQL Node", value: "MDQ6VXNlcjU4MzI=", highlight: false },
	],
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
