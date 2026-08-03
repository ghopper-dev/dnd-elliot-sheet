/**
 * Loading and saving the sheet blob.
 *
 * Deliberately free of Svelte and of `window`: these are plain functions over a
 * storage-shaped object, so they can be unit-tested without a DOM and, when v1's
 * sync layer arrives, reused against a server payload instead of localStorage.
 */

import {
	ABILITIES,
	DEFAULTS,
	SAVES,
	SAVE_PROF,
	SKILLS,
	STORAGE_KEY,
	type AbilityId,
	type Item,
	type Note,
	type SheetState,
	type Skill
} from '$lib/data/defaults';

/** The slice of the Storage API this module needs. */
export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

/** A fresh sheet, exactly as the static app builds one on first run. */
export function createDefaultState(): SheetState {
	const abilities = {} as Record<AbilityId, string>;
	for (const a of ABILITIES) abilities[a.id] = a.mod;

	return {
		...DEFAULTS,
		abilities,
		saves: { ...SAVES },
		saveProf: [...SAVE_PROF],
		skills: SKILLS.map((s): Skill => ({ ...s })),
		items: [],
		notes: []
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merge a parsed save over a default sheet.
 *
 * This is a *shallow* merge, matching the static app's `Object.assign(state, s)`
 * exactly — a saved `abilities` object replaces the default outright rather than
 * being merged key-by-key. Anything else would silently change what an existing
 * save loads as, which is precisely what the port must not do.
 *
 * The collection guards go further than the original, which only checked `items`
 * and `notes`. A save with a corrupt `skills` value used to throw during render
 * and leave a blank page; falling back to defaults can only improve on that, and
 * cannot affect a well-formed save.
 */
export function mergeSaved(base: SheetState, raw: unknown): SheetState {
	const merged: SheetState = isRecord(raw) ? { ...base, ...(raw as Partial<SheetState>) } : base;

	if (!isRecord(merged.abilities)) merged.abilities = createDefaultState().abilities;
	if (!isRecord(merged.saves)) merged.saves = createDefaultState().saves;
	if (!Array.isArray(merged.saveProf)) merged.saveProf = [...SAVE_PROF];
	if (!Array.isArray(merged.skills)) merged.skills = SKILLS.map((s): Skill => ({ ...s }));
	if (!Array.isArray(merged.items)) merged.items = [] as Item[];
	if (!Array.isArray(merged.notes)) merged.notes = [] as Note[];

	return merged;
}

/**
 * Read the saved sheet, or return defaults.
 *
 * Never throws. A save that is missing, empty, truncated or not JSON at all
 * yields a default sheet — the alternative is a blank page at the table.
 */
export function loadState(storage: StorageLike | null | undefined): SheetState {
	const base = createDefaultState();
	if (!storage) return base;

	let parsed: unknown;
	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (!raw) return base;
		parsed = JSON.parse(raw);
	} catch {
		return base;
	}

	return mergeSaved(base, parsed);
}

/** Write the sheet back. Returns false if storage rejected it (quota, private mode). */
export function saveState(storage: StorageLike | null | undefined, state: SheetState): boolean {
	if (!storage) return false;
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(state));
		return true;
	} catch {
		return false;
	}
}

/** Drop the save entirely, returning the sheet to defaults on next load. */
export function clearState(storage: StorageLike | null | undefined): void {
	try {
		storage?.removeItem(STORAGE_KEY);
	} catch {
		/* nothing useful to do — the caller reloads either way */
	}
}
