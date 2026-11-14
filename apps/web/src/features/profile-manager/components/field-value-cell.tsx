import { Icon } from "@hono_homework_2/ui/components/console/icon";

import { splitTags, toSafeUrl } from "../lib/field-value";
import type { CustomField } from "../types";

const CELL_CLASSES =
	"col-span-6 truncate pr-2 font-code text-label-code text-on-surface-variant sm:col-span-5";

/** Renders a custom field value according to its type (text / tags / link). */
export function FieldValueCell({ field }: { field: CustomField }) {
	if (field.type === "Tags") {
		return (
			<div className="col-span-6 flex flex-wrap gap-1 pr-2 sm:col-span-5">
				{splitTags(field.value).map((tag) => (
					<span
						className="rounded-chip bg-surface-container px-1.5 font-code text-label-code-sm text-on-surface"
						key={tag}
					>
						{tag}
					</span>
				))}
			</div>
		);
	}

	const href = field.type === "URL" ? toSafeUrl(field.value) : null;
	if (href) {
		return (
			<div className={`${CELL_CLASSES} text-primary`}>
				<a
					className="flex items-center gap-1 hover:underline"
					href={href}
					rel="noopener noreferrer"
					target="_blank"
				>
					<span className="truncate">{field.value}</span>
					<Icon className="shrink-0" name="north_east" size={13} />
				</a>
			</div>
		);
	}

	return (
		<div className={CELL_CLASSES} title={field.value}>
			{field.value}
		</div>
	);
}
