import z from "zod";

export const githubUserSchema = z.object({
	login: z.string(),
	id: z.number().nullish(),
	name: z.string().nullish(),
	email: z.string().nullish(),
	bio: z.string().nullish(),
	company: z.string().nullish(),
	location: z.string().nullish(),
	blog: z.string().nullish(),
	twitter_username: z.string().nullish(),
	avatar_url: z.string().nullish(),
	html_url: z.string().nullish(),
	public_repos: z.number().nullish(),
	followers: z.number().nullish(),
	following: z.number().nullish(),
	created_at: z.string().nullish(),
	type: z.string().nullish(),
	site_admin: z.boolean().nullish(),
	node_id: z.string().nullish(),
});

export type GithubUser = z.infer<typeof githubUserSchema>;
