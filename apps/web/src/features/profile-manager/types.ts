export const FIELD_TYPES = ["Text", "Tags", "URL", "Number"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface CustomField {
	id: string;
	key: string;
	type: FieldType;
	/** Raw value; for `Tags` this is a comma-separated list. */
	value: string;
}

export interface StandardProfile {
	bio: string;
	blog: string;
	company: string;
	email: string;
	location: string;
	login: string;
	name: string;
	twitter_username: string;
}

export type EditableProfileKey = Exclude<keyof StandardProfile, "login">;
