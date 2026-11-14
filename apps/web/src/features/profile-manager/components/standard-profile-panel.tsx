import { Chip } from "@hono_homework_2/ui/components/console/chip";
import {
	Field,
	TextArea,
	TextInput,
} from "@hono_homework_2/ui/components/console/field";
import { Icon } from "@hono_homework_2/ui/components/console/icon";
import {
	Panel,
	PanelHeader,
} from "@hono_homework_2/ui/components/console/panel";
import { type FormEvent, useCallback } from "react";

import type { EditableProfileKey, StandardProfile } from "../types";

interface StandardProfilePanelProps {
	onChange: (key: EditableProfileKey, value: string) => void;
	onSubmit: () => void;
	profile: StandardProfile;
}

const FORM_ID = "standard-profile-form";

export function StandardProfilePanel({
	profile,
	onChange,
	onSubmit,
}: StandardProfilePanelProps) {
	const bind = (key: EditableProfileKey) => ({
		id: `profile-${key}`,
		name: key,
		value: profile[key],
		onChange: (
			event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => onChange(key, event.target.value),
	});

	const handleSubmit = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			onSubmit();
		},
		[onSubmit]
	);

	return (
		<div className="flex flex-col gap-space-md xl:col-span-5">
			<Panel className="flex h-full flex-col">
				<PanelHeader
					action={<Chip tone="ghost">Schema: core</Chip>}
					description="对应 GitHub API 原生用户数据结构"
					icon="account_box"
					title="标准档案字段"
				/>

				<form
					className="flex-1 space-y-space-md"
					id={FORM_ID}
					onSubmit={handleSubmit}
				>
					<Field
						hint={
							<span className="flex items-center gap-1 text-outline">
								<Icon name="lock" size={13} />
								只读主键
							</span>
						}
						htmlFor="profile-login"
						label="用户名 (Username)"
					>
						<TextInput
							disabled
							id="profile-login"
							name="login"
							readOnly
							value={profile.login}
						/>
					</Field>

					<Field htmlFor="profile-name" label="显示姓名 (Display Name)">
						<TextInput {...bind("name")} autoComplete="name" type="text" />
					</Field>

					<Field htmlFor="profile-email" label="公开电子邮箱 (Public Email)">
						<TextInput {...bind("email")} autoComplete="email" type="email" />
					</Field>

					<Field
						hint="支持 Markdown"
						htmlFor="profile-bio"
						label="个人简介 (Bio)"
					>
						<TextArea {...bind("bio")} rows={3} />
					</Field>

					<Field htmlFor="profile-blog" label="个人主页/博客 (Blog / Website)">
						<TextInput {...bind("blog")} leadingIcon="link" type="url" />
					</Field>

					<Field htmlFor="profile-company" label="所在公司 / 组织 (Company)">
						<TextInput
							{...bind("company")}
							autoComplete="organization"
							type="text"
						/>
					</Field>

					<div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
						<Field htmlFor="profile-location" label="地理位置 (Location)">
							<TextInput {...bind("location")} type="text" />
						</Field>
						<Field htmlFor="profile-twitter_username" label="Twitter 账号">
							<TextInput {...bind("twitter_username")} type="text" />
						</Field>
					</div>
				</form>
			</Panel>
		</div>
	);
}
