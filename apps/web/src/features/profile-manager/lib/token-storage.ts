export const TOKEN_STORAGE_KEY = "gh-inspector:pat";

const MASK_VISIBLE_HEAD = 4;
const MASK_VISIBLE_TAIL = 4;
const MASK_MIN_LENGTH = MASK_VISIBLE_HEAD + MASK_VISIBLE_TAIL + 4;
const MASK_PLACEHOLDER = "••••••••";

export function loadToken(): string | null {
	try {
		return globalThis.sessionStorage.getItem(TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function saveToken(token: string): void {
	try {
		globalThis.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
	} catch {
		// Storage unavailable (private mode / quota): token simply won't persist.
	}
}

export function clearToken(): void {
	try {
		globalThis.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
	} catch {
		// Nothing to clear when storage is unavailable.
	}
}

export function maskToken(token: string): string {
	if (token.length < MASK_MIN_LENGTH) {
		return MASK_PLACEHOLDER;
	}
	return `${token.slice(0, MASK_VISIBLE_HEAD)}${MASK_PLACEHOLDER}${token.slice(-MASK_VISIBLE_TAIL)}`;
}
