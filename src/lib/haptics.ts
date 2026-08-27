/** Silent no-op on desktop and anywhere the API is absent. No sound, ever. */
export function tap(pattern: number | number[] = 12): void {
	if (typeof navigator === 'undefined') return;
	if (typeof navigator.vibrate !== 'function') return;
	try {
		navigator.vibrate(pattern);
	} catch {
		// vibrate throws on some engines when the document is not focused
	}
}

export const SELECT = 12;
export const BACK = 8;
export const REVEAL = [18, 40, 26];
