import { Icon } from "@hono_homework_2/ui/components/console/icon";

import { cx } from "@hono_homework_2/ui/lib/cx";
import type { ComponentProps, ReactNode } from "react";

interface FieldProps {
	children: ReactNode;
	/** Optional right-aligned hint next to the label (e.g. "支持 Markdown"). */
	hint?: ReactNode;
	htmlFor: string;
	label: ReactNode;
}

/** Label + control stack used by the standard profile form. */
export function Field({ label, hint, htmlFor, children }: FieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<label
					className="font-display text-label-ui text-on-surface"
					htmlFor={htmlFor}
				>
					{label}
				</label>
				{hint ? (
					<span className="flex items-center gap-1 font-code text-label-code-sm text-on-surface-variant">
						{hint}
					</span>
				) : null}
			</div>
			{children}
		</div>
	);
}

interface CompactFieldProps {
	children: ReactNode;
	htmlFor: string;
	label: ReactNode;
}

/** Small monospaced label above a control (add-field card). */
export function CompactField({ label, htmlFor, children }: CompactFieldProps) {
	return (
		<div>
			<label
				className="mb-1 block font-code text-label-code-sm text-outline"
				htmlFor={htmlFor}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

const CONTROL_SIZE = {
	sm: "h-8 px-space-sm",
	md: "h-9 px-space-md",
	lg: "h-10 px-space-md",
} as const;

interface TextInputProps extends Omit<ComponentProps<"input">, "size"> {
	controlSize?: keyof typeof CONTROL_SIZE;
	/** Leading Material Symbols icon rendered inside the control. */
	leadingIcon?: string;
	/** Trailing slot (e.g. a reveal toggle) positioned inside the control. */
	trailing?: ReactNode;
}

export function TextInput({
	leadingIcon,
	trailing,
	controlSize = "md",
	className,
	...props
}: TextInputProps) {
	const input = (
		<input
			className={cx(
				"field-control",
				CONTROL_SIZE[controlSize],
				leadingIcon ? "pl-9" : undefined,
				trailing ? "pr-10" : undefined,
				className
			)}
			{...props}
		/>
	);

	if (!(leadingIcon || trailing)) {
		return input;
	}

	return (
		<div className="relative w-full">
			{leadingIcon ? (
				<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
					<Icon name={leadingIcon} size={controlSize === "lg" ? 18 : 16} />
				</span>
			) : null}
			{input}
			{trailing ? (
				<span className="absolute inset-y-0 right-0 flex items-center pr-3">
					{trailing}
				</span>
			) : null}
		</div>
	);
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
	return (
		<textarea
			className={cx("field-control resize-none p-space-sm", className)}
			{...props}
		/>
	);
}

export function Select({ className, ...props }: ComponentProps<"select">) {
	return (
		<select
			className={cx("field-control h-8 px-space-xs", className)}
			{...props}
		/>
	);
}
