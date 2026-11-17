import type { GithubUser } from "@hono_homework_2/api/github/schemas";

import { PLACEHOLDER } from "@/components/layout/placeholder";

export interface IdentityView {
	avatarUrl: string | null;
	bio: string | null;
	facts: { icon: string; label: string; value: string }[];
	kindLabel: string;
	login: string;
	name: string;
	profileUrl: string;
	stats: { label: string; value: string }[];
}

const COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});
const GITHUB_ORIGIN = "https://github.com";

/** 1400 -> "1.4k"; locale fixed to en-US and lowercased for stable output. */
export function formatCompactNumber(n: number): string {
	return COMPACT_FORMATTER.format(n).toLowerCase();
}

/** ISO timestamp -> YYYY-MM-DD (UTC); invalid input falls back to the placeholder. */
export function formatDate(iso: string): string {
	const time = Date.parse(iso);
	if (Number.isNaN(time)) {
		return PLACEHOLDER;
	}
	return new Date(time).toISOString().slice(0, 10);
}

export function kindLabel(
	type: string | null | undefined,
	siteAdmin: boolean | null | undefined
): string {
	if (siteAdmin) {
		return "Site Admin";
	}
	return type === "Organization" ? "Organization" : "User";
}

function formatCount(n: number | null | undefined): string {
	return typeof n === "number" ? formatCompactNumber(n) : PLACEHOLDER;
}

function textOrPlaceholder(value: string | null | undefined): string {
	const trimmed = value?.trim();
	return trimmed ? trimmed : PLACEHOLDER;
}

function createdAtLabel(iso: string | null | undefined): string {
	if (!iso) {
		return PLACEHOLDER;
	}
	return formatDate(iso);
}

export function toIdentityView(user: GithubUser): IdentityView {
	const bio = user.bio?.trim();
	return {
		avatarUrl: user.avatar_url ?? null,
		name: user.name?.trim() || user.login,
		login: user.login,
		bio: bio ? bio : null,
		kindLabel: kindLabel(user.type, user.site_admin),
		profileUrl: user.html_url ?? `${GITHUB_ORIGIN}/${user.login}`,
		stats: [
			{ label: "Public Repos", value: formatCount(user.public_repos) },
			{ label: "Followers", value: formatCount(user.followers) },
			{ label: "Following", value: formatCount(user.following) },
		],
		facts: [
			{ icon: "domain", label: "组织", value: textOrPlaceholder(user.company) },
			{
				icon: "location_on",
				label: "位置",
				value: textOrPlaceholder(user.location),
			},
			{
				icon: "schedule",
				label: "建号时间",
				value: createdAtLabel(user.created_at),
			},
		],
	};
}
