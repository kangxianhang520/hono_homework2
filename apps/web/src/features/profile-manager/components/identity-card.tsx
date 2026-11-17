import { Icon } from "@hono_homework_2/ui/components/console/icon";
import { Panel } from "@hono_homework_2/ui/components/console/panel";
import { useCallback, useState } from "react";
import { PLACEHOLDER } from "@/components/layout/placeholder";

import type { IdentityView } from "../lib/profile-view";

const HTTPS_PROTOCOL = "https:";

function isHttpsUrl(url: string | null): url is string {
	if (!url) {
		return false;
	}
	try {
		return new URL(url).protocol === HTTPS_PROTOCOL;
	} catch {
		return false;
	}
}

function Avatar({ alt, url }: { alt: string; url: string | null }) {
	const [failed, setFailed] = useState(false);
	const handleError = useCallback(() => setFailed(true), []);

	return (
		<div className="relative mb-space-md">
			<div className="flex size-24 items-center justify-center overflow-hidden rounded-pill bg-surface-container-highest shadow-md">
				{failed || !isHttpsUrl(url) ? (
					<Icon className="text-outline" name="person" size={48} />
				) : (
					// biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is a load-failure fallback, not a user interaction
					<img
						alt={alt}
						className="size-full object-cover"
						height={96}
						onError={handleError}
						src={url ?? undefined}
						width={96}
					/>
				)}
			</div>
			<span
				className="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-pill bg-primary text-surface-container-lowest"
				title="Authenticated via PAT"
			>
				<Icon className="font-bold" name="done" size={14} />
			</span>
		</div>
	);
}

export function IdentityCard({ view }: { view: IdentityView }) {
	return (
		<Panel className="relative flex flex-col justify-between overflow-hidden lg:col-span-4">
			<div className="flex flex-col items-center text-center">
				<Avatar
					alt={`${view.name} avatar`}
					key={view.avatarUrl}
					url={view.avatarUrl}
				/>
				<h3 className="font-display text-headline-lg text-on-surface">
					{view.name}
				</h3>
				<div className="mt-1 flex items-center gap-space-xs">
					<span className="font-code text-label-code text-primary">
						@{view.login}
					</span>
					<span className="text-outline">•</span>
					<span className="rounded-pill bg-surface-container-high px-2 py-0.5 font-display text-label-ui text-on-surface-variant">
						{view.kindLabel}
					</span>
				</div>
				<p className="mt-space-sm line-clamp-2 text-center text-body-md text-on-surface-variant">
					{view.bio ?? PLACEHOLDER}
				</p>
			</div>

			{/* Quick metrics */}
			<dl className="my-space-md grid grid-cols-3 gap-space-xs rounded-panel bg-surface-container-lowest/80 p-space-sm text-center">
				{view.stats.map((stat, index) => (
					<div
						className={
							index === 1
								? "flex flex-col border-surface-container-high border-x py-1"
								: "flex flex-col py-1"
						}
						key={stat.label}
					>
						<dt className="order-last font-code text-label-code-sm text-outline">
							{stat.label}
						</dt>
						<dd className="font-code font-semibold text-label-code text-on-surface">
							{stat.value}
						</dd>
					</div>
				))}
			</dl>

			<div className="flex flex-col gap-space-xs font-code text-label-code-sm text-on-surface-variant">
				{view.facts.map((fact) => (
					<div className="flex items-center justify-between" key={fact.label}>
						<span className="flex items-center gap-1.5 text-outline">
							<Icon name={fact.icon} size={16} />
							{fact.label}
						</span>
						<span className="font-medium text-on-surface">{fact.value}</span>
					</div>
				))}
				<a
					className="mt-space-sm inline-flex items-center justify-center gap-1 font-display text-label-ui text-primary hover:underline"
					href={view.profileUrl}
					rel="noopener noreferrer"
					target="_blank"
				>
					<span>访问公开 GitHub 主页</span>
					<Icon name="open_in_new" size={14} />
				</a>
			</div>
		</Panel>
	);
}
