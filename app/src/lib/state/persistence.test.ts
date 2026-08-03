import { describe, expect, it } from 'vitest';
import {
	clearState,
	createDefaultState,
	loadState,
	mergeSaved,
	saveState,
	type StorageLike
} from './persistence';
import { STORAGE_KEY, type SheetState } from '$lib/data/defaults';

/** An in-memory stand-in for `localStorage`. */
function fakeStorage(seed: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
	const data = new Map(Object.entries(seed));
	return {
		data,
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => void data.set(k, v),
		removeItem: (k) => void data.delete(k)
	};
}

/** A storage that refuses writes, as a full or private-mode browser would. */
function hostileStorage(): StorageLike {
	return {
		getItem: () => null,
		setItem: () => {
			throw new DOMException('QuotaExceededError');
		},
		removeItem: () => {
			throw new DOMException('SecurityError');
		}
	};
}

describe('createDefaultState', () => {
	it('seeds the sheet from the defaults', () => {
		const state = createDefaultState();
		expect(state.CharacterName).toBe('Elliot');
		expect(state.HPMax).toBe('64');
		expect(state.abilities.DEX).toBe('+4');
		expect(state.saves.WIS).toBe('6');
		expect(state.saveProf).toEqual(['DEX', 'WIS']);
		expect(state.skills).toHaveLength(18);
		expect(state.items).toEqual([]);
		expect(state.notes).toEqual([]);
	});

	it('hands out independent copies, so editing one sheet cannot touch another', () => {
		const a = createDefaultState();
		const b = createDefaultState();

		a.saveProf.push('STR');
		a.skills[0].prof = true;
		a.abilities.STR = '+99';

		expect(b.saveProf).toEqual(['DEX', 'WIS']);
		expect(b.skills[0].prof).toBe(false);
		expect(b.abilities.STR).toBe('+1');
	});
});

describe('mergeSaved', () => {
	it('overlays saved fields and keeps the rest at defaults', () => {
		const merged = mergeSaved(createDefaultState(), { CharacterName: 'Nyx', HPCurrent: '12' });
		expect(merged.CharacterName).toBe('Nyx');
		expect(merged.HPCurrent).toBe('12');
		expect(merged.HPMax).toBe('64');
		expect(merged.ProfBonus).toBe('+4');
	});

	it('replaces nested objects wholesale, matching the static sheet Object.assign', () => {
		// This is the behaviour an existing save depends on: a stored `abilities`
		// object wins outright rather than being merged key-by-key.
		const merged = mergeSaved(createDefaultState(), { abilities: { STR: '+7' } });
		expect(merged.abilities).toEqual({ STR: '+7' });
	});

	it('keeps saved collections intact', () => {
		const merged = mergeSaved(createDefaultState(), {
			items: [{ name: 'Rope', qty: '1' }],
			notes: [{ title: '2026-08-03', body: '<p>we met a drake</p>' }]
		});
		expect(merged.items).toEqual([{ name: 'Rope', qty: '1' }]);
		expect(merged.notes[0].body).toBe('<p>we met a drake</p>');
	});

	it.each([
		['items', { items: 'not an array' }],
		['notes', { notes: 42 }],
		['skills', { skills: null }],
		['saveProf', { saveProf: { DEX: true } }],
		['abilities', { abilities: [] }],
		['saves', { saves: 'broken' }]
	])('falls back to defaults when saved %s is the wrong shape', (_field, raw) => {
		const merged = mergeSaved(createDefaultState(), raw);
		expect(Array.isArray(merged.items)).toBe(true);
		expect(Array.isArray(merged.notes)).toBe(true);
		expect(Array.isArray(merged.skills)).toBe(true);
		expect(Array.isArray(merged.saveProf)).toBe(true);
		expect(Array.isArray(merged.abilities)).toBe(false);
		expect(typeof merged.saves).toBe('object');
	});

	it('ignores a save that is not an object at all', () => {
		expect(mergeSaved(createDefaultState(), 'nonsense').CharacterName).toBe('Elliot');
		expect(mergeSaved(createDefaultState(), null).CharacterName).toBe('Elliot');
		expect(mergeSaved(createDefaultState(), [1, 2, 3]).CharacterName).toBe('Elliot');
	});
});

describe('loadState', () => {
	it('returns defaults when nothing has been saved', () => {
		expect(loadState(fakeStorage()).CharacterName).toBe('Elliot');
	});

	it('returns defaults rather than throwing on a corrupt save', () => {
		const storage = fakeStorage({ [STORAGE_KEY]: '{"CharacterName":' });
		expect(loadState(storage).CharacterName).toBe('Elliot');
	});

	it('returns defaults when there is no storage at all (SSR)', () => {
		expect(loadState(null).CharacterName).toBe('Elliot');
		expect(loadState(undefined).HPMax).toBe('64');
	});

	it('reads from the static sheet key, so an existing save loads untouched', () => {
		// The whole point of porting the UI before adding sync: Ghopper's real
		// browser already holds a sheet under this exact key.
		const legacy = {
			CharacterName: 'Elliot',
			HPCurrent: '31',
			Gold: '1420',
			items: [{ name: 'Whisper', qty: '1' }],
			notes: [{ title: '2026-07-27', body: '<b>the drake spoke</b>' }]
		};
		const storage = fakeStorage({ 'elliot-sheet-v1': JSON.stringify(legacy) });

		const loaded = loadState(storage);
		expect(loaded.HPCurrent).toBe('31');
		expect(loaded.Gold).toBe('1420');
		expect(loaded.items).toEqual([{ name: 'Whisper', qty: '1' }]);
		expect(loaded.notes[0].body).toBe('<b>the drake spoke</b>');
		// Untouched fields still come from the defaults.
		expect(loaded.SpellDC).toBe('15');
	});
});

describe('saveState', () => {
	it('round-trips the whole sheet without loss', () => {
		const storage = fakeStorage();
		const state = createDefaultState();
		state.CharacterName = 'Nyx';
		state.items.push({ name: 'Torch', qty: '10' });
		state.notes.push({ title: 'Session 4', body: '<ul><li>ambush</li></ul>' });
		state.skills[0].prof = true;

		expect(saveState(storage, state)).toBe(true);
		expect(loadState(storage)).toEqual(state);
	});

	it('writes under the static sheet key', () => {
		const storage = fakeStorage();
		saveState(storage, createDefaultState());
		expect(storage.data.has('elliot-sheet-v1')).toBe(true);
	});

	it('reports failure instead of throwing when storage rejects the write', () => {
		expect(saveState(hostileStorage(), createDefaultState())).toBe(false);
		expect(saveState(null, createDefaultState())).toBe(false);
	});
});

describe('clearState', () => {
	it('removes the save so the next load is defaults', () => {
		const storage = fakeStorage();
		const state = createDefaultState();
		state.CharacterName = 'Nyx';
		saveState(storage, state);

		clearState(storage);

		expect(storage.data.has(STORAGE_KEY)).toBe(false);
		expect(loadState(storage).CharacterName).toBe('Elliot');
	});

	it('does not throw when storage refuses', () => {
		expect(() => clearState(hostileStorage())).not.toThrow();
		expect(() => clearState(null)).not.toThrow();
	});
});

describe('the sheet blob is JSON-safe', () => {
	it('survives a stringify/parse cycle with no undefined holes', () => {
		const state: SheetState = createDefaultState();
		const cycled = JSON.parse(JSON.stringify(state)) as SheetState;
		expect(cycled).toEqual(state);
	});
});
