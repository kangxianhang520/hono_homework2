export interface NavItem {
	icon: string;
	id: string;
	label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
	{
		id: "profile-overview",
		icon: "badge",
		label: "个人账户概览 (Profile Overview)",
	},
	{
		id: "token-and-auth",
		icon: "key",
		label: "Token 授权与配置 (Token & Auth)",
	},
	{
		id: "custom-fields",
		icon: "data_object",
		label: "动态字段管理 (Custom Fields)",
	},
	{
		id: "request-logs",
		icon: "monitoring",
		label: "API 请求日志 (Request Logs)",
	},
] as const;
