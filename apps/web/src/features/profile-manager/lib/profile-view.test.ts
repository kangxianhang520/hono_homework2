import type { GithubUser } from "@hono_homework_2/api/github/schemas";
import { describe, expect, it } from "vitest";

import { PLACEHOLDER } from "@/components/layout/placeholder";

import {
	formatCompactNumber,
	formatDate,
	kindLabel,
	toIdentityView,
} from "./profile-view";

const BASE_USER: GithubUser = {
	login: "octocat",
	name: "The Octocat",
	bio: "Hello",
	company: "GitHub",
	location: "San Francisco",
	avatar_url: "https://avatars.githubusercontent.com/u/1",
	html_url: "https://github.com/octocat",
	public_repos: 8,
	followers: 1400,
	following: 9,
	created_at: "2011-01-25T18:44:36Z",
	type: "User",
	site_admin: false,
};

describe("formatCompactNumber", () => {
	it.each([
		[0, "0"],
		[999, "999"],
		[1000, "1k"],
		[1400, "1.4k"],
		[12_345, "12.3k"],
		[1_500_000, "1.5m"],
	])("formats %d as %s", (input, expected) => {
		expect(formatCompactNumber(input)).toBe(expected);
	});
});

describe("formatDate", () => {
	it("formats an ISO timestamp as UTC YYYY-MM-DD", () => {
		expect(formatDate("2011-01-25T18:44:36Z")).toBe("2011-01-25");
	});

	it("uses the UTC date near midnight boundaries", () => {
		expect(formatDate("2020-12-31T23:59:59Z")).toBe("2020-12-31");
	});

	it("falls back to the placeholder for invalid input", () => {
		expect(formatDate("not-a-date")).toBe(PLACEHOLDER);
	});
});

describe("kindLabel", () => {
	it("returns Site Admin when site_admin is true regardless of type", () => {
		expect(kindLabel("Organization", true)).toBe("Site Admin");
	});

	it("returns Organization for organization accounts", () => {
		expect(kindLabel("Organization", false)).toBe("Organization");
	});

	it("returns User for user accounts", () => {
		expect(kindLabel("User", false)).toBe("User");
	});

	it("defaults to User when type and site_admin are missing", () => {
		expect(kindLabel(null, undefined)).toBe("User");
	});
});

describe("toIdentityView", () => {
	it("maps a fully populated user", () => {
		const view = toIdentityView(BASE_USER);
		expect(view.name).toBe("The Octocat");
		expect(view.kindLabel).toBe("User");
		expect(view.profileUrl).toBe("https://github.com/octocat");
		expect(view.stats.map((s) => s.value)).toEqual(["8", "1.4k", "9"]);
		expect(view.facts.map((f) => f.value)).toEqual([
			"GitHub",
			"San Francisco",
			"2011-01-25",
		]);
	});

	it("falls back for null and blank fields", () => {
		const view = toIdentityView({
			login: "ghost",
			name: null,
			bio: "   ",
			company: "  ",
			location: null,
			avatar_url: null,
			html_url: null,
			public_repos: null,
			followers: undefined,
			following: null,
			created_at: null,
			type: null,
			site_admin: null,
		});
		expect(view.name).toBe("ghost");
		expect(view.bio).toBeNull();
		expect(view.avatarUrl).toBeNull();
		expect(view.profileUrl).toBe("https://github.com/ghost");
		expect(view.kindLabel).toBe("User");
		expect(view.stats.map((s) => s.value)).toEqual([
			PLACEHOLDER,
			PLACEHOLDER,
			PLACEHOLDER,
		]);
		expect(view.facts.map((f) => f.value)).toEqual([
			PLACEHOLDER,
			PLACEHOLDER,
			PLACEHOLDER,
		]);
	});

	it("keeps zero counts instead of treating them as missing", () => {
		const view = toIdentityView({ ...BASE_USER, followers: 0 });
		expect(view.stats[1]?.value).toBe("0");
	});

	it("falls back to login when name is whitespace", () => {
		expect(toIdentityView({ ...BASE_USER, name: "  " }).name).toBe("octocat");
	});
});
