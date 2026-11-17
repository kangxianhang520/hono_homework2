import { Panel } from "@hono_homework_2/ui/components/console/panel";
import { Skeleton } from "@hono_homework_2/ui/components/skeleton";

const SKELETON_STAT_KEYS = ["repos", "followers", "following"] as const;
const SKELETON_FACT_KEYS = ["company", "location", "created"] as const;

export function IdentityCardSkeleton() {
	return (
		<Panel
			aria-busy="true"
			aria-label="Loading profile"
			className="relative flex flex-col justify-between overflow-hidden lg:col-span-4"
		>
			<div className="flex flex-col items-center gap-space-sm">
				<Skeleton className="size-24 rounded-pill" />
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-4 w-28" />
				<Skeleton className="h-10 w-full" />
			</div>
			<div className="my-space-md grid grid-cols-3 gap-space-xs">
				{SKELETON_STAT_KEYS.map((key) => (
					<Skeleton className="h-12 w-full" key={key} />
				))}
			</div>
			<div className="flex flex-col gap-space-xs">
				{SKELETON_FACT_KEYS.map((key) => (
					<Skeleton className="h-4 w-full" key={key} />
				))}
			</div>
		</Panel>
	);
}
