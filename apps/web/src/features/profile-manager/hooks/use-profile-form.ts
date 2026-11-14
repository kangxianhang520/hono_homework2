import { useCallback, useMemo, useState } from "react";

import { INITIAL_PROFILE } from "../data";
import type { EditableProfileKey, StandardProfile } from "../types";

/** Standard profile form with a saved baseline for reset / dirty tracking. */
export function useProfileForm() {
	const [saved, setSaved] = useState<StandardProfile>(INITIAL_PROFILE);
	const [draft, setDraft] = useState<StandardProfile>(INITIAL_PROFILE);

	const updateField = useCallback((key: EditableProfileKey, value: string) => {
		setDraft((prev) => ({ ...prev, [key]: value }));
	}, []);

	const reset = useCallback(() => setDraft(saved), [saved]);
	const commit = useCallback(() => setSaved(draft), [draft]);

	const dirty = useMemo(
		() =>
			(Object.keys(saved) as Array<keyof StandardProfile>).some(
				(key) => saved[key] !== draft[key]
			),
		[saved, draft]
	);

	return { profile: draft, dirty, updateField, reset, commit } as const;
}
