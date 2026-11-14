/**
 * Joins truthy class names.
 *
 * Deliberately does NOT merge/dedupe like tailwind-merge: the design tokens use
 * custom `text-*` font-size utilities (text-label-ui, text-label-code …) that a
 * merger would mistake for text colors and silently drop.
 */
export function cx(
	...classes: Array<string | false | null | undefined>
): string {
	return classes.filter(Boolean).join(" ");
}
