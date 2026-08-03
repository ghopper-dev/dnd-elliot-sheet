/**
 * The live sheet: reactive state plus every mutation the UI performs.
 *
 * Held in context rather than as a module singleton. Today the store is only
 * ever populated in the browser, so a singleton would be harmless — but v1 adds
 * accounts and a server, and a module-level `$state` on a long-lived Node
 * process is shared by every request that touches it. Context scopes it to one
 * render, which is the difference between "works" and "shows another player's
 * character sheet".
 */

import { getContext, setContext } from 'svelte';
import { browser } from '$app/environment';
import { STORAGE_KEY, type AbilityId, type SheetState } from '$lib/data/defaults';
import { clearState, createDefaultState, loadState, saveState } from './persistence';
import { htmlToPlainText } from '$lib/notes/html';

/** Matches the static sheet's debounce. Network push is a v1 concern and wants
 *  a longer window (~1.5s per ROADMAP §5); a local write does not. */
const SAVE_DEBOUNCE_MS = 400;
const TOAST_MS = 1200;
const DEFAULT_TOAST = '✓ saved';

export class SheetStore {
	data = $state<SheetState>(createDefaultState());
	toast = $state({ text: DEFAULT_TOAST, visible: false });

	#saveTimer: ReturnType<typeof setTimeout> | undefined;
	#toastTimer: ReturnType<typeof setTimeout> | undefined;

	/** Pull the saved sheet in. Browser-only: there is no storage during SSR,
	 *  and the sheet must render identically whether or not a save exists. */
	hydrate() {
		if (!browser) return;
		this.data = loadState(window.localStorage);
	}

	/** Persist, debounced. `immediate` is the Save button — it should feel like
	 *  a button, not like a setting that eventually takes. */
	save(immediate = false) {
		if (!browser) return;
		clearTimeout(this.#saveTimer);
		this.#saveTimer = setTimeout(
			() => {
				saveState(window.localStorage, $state.snapshot(this.data) as SheetState);
				this.flash();
			},
			immediate ? 0 : SAVE_DEBOUNCE_MS
		);
	}

	/** Show the corner status pill, then fade it back to its default text. */
	flash(text: string = DEFAULT_TOAST, ms: number = TOAST_MS) {
		clearTimeout(this.#toastTimer);
		this.toast = { text, visible: true };
		this.#toastTimer = setTimeout(() => {
			this.toast = { text: DEFAULT_TOAST, visible: false };
		}, ms);
	}

	/** Clamped to 0..HPMax, as in the static sheet. A missing or unparseable
	 *  max falls back to 999 rather than pinning current HP to zero. */
	adjustHP(delta: number) {
		const current = parseInt(this.data.HPCurrent) || 0;
		const max = parseInt(this.data.HPMax) || 999;
		this.data.HPCurrent = String(Math.min(max, Math.max(0, current + delta)));
		this.save();
	}

	adjustGold(delta: number) {
		this.data.Gold = String(Math.max(0, (parseInt(this.data.Gold) || 0) + delta));
		this.save();
	}

	toggleSaveProficiency(id: AbilityId) {
		const at = this.data.saveProf.indexOf(id);
		if (at >= 0) this.data.saveProf.splice(at, 1);
		else this.data.saveProf.push(id);
		this.save();
	}

	toggleSkillProficiency(index: number) {
		const skill = this.data.skills[index];
		if (!skill) return;
		skill.prof = !skill.prof;
		this.save();
	}

	addItem(name: string, qty: string) {
		const trimmed = name.trim();
		if (!trimmed) return false;
		this.data.items.push({ name: trimmed, qty: qty.trim() || '1' });
		this.save();
		return true;
	}

	removeItem(index: number) {
		this.data.items.splice(index, 1);
		this.save();
	}

	/** New notes go to the top, titled with today's date — the title field is a
	 *  free-text box, so an ISO date is a starting point, not a schema. */
	addNote() {
		this.data.notes.unshift({ title: new Date().toISOString().slice(0, 10), body: '' });
		this.save();
	}

	removeNote(index: number) {
		this.data.notes.splice(index, 1);
		this.save();
	}

	/** Wipe the save and reload, so defaults are rebuilt by the normal path. */
	reset() {
		if (!browser) return;
		if (!confirm('Reset the sheet back to the defaults from your PDF? This wipes your saved edits.'))
			return;
		clearState(window.localStorage);
		location.reload();
	}

	/** Download the whole blob. Doubles as the manual backup for anyone who wants
	 *  their sheet somewhere other than one browser's storage — which, until sync
	 *  lands, is the only place it exists. */
	exportJSON() {
		if (!browser) return;
		const blob = new Blob([JSON.stringify($state.snapshot(this.data), null, 2)], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `elliot-sheet-backup-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	/** Flatten every note to plain text for pasting elsewhere. */
	async copyNotes() {
		if (!browser) return;
		const text = this.data.notes
			.map((n) => `${n.title || 'Untitled'}\n${htmlToPlainText(n.body)}`.trim())
			.join('\n\n---\n\n');

		try {
			await navigator.clipboard.writeText(text);
			this.flash('📋 notes copied', 1400);
		} catch {
			alert('Copy blocked by browser — select the text and copy manually.');
		}
	}
}

const SHEET_KEY = Symbol(STORAGE_KEY);

export function setSheetContext(): SheetStore {
	return setContext(SHEET_KEY, new SheetStore());
}

export function getSheet(): SheetStore {
	return getContext<SheetStore>(SHEET_KEY);
}
