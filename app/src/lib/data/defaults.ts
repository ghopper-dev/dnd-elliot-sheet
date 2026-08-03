/**
 * The seed sheet, lifted verbatim from the static app's `app.js`.
 *
 * These values are Elliot's, hard-coded, because v1 has no character builder —
 * users type their own stats over the top (ROADMAP §3). When the builder lands
 * in v3 this file becomes one seed among many, not the only shape a sheet has.
 */

export const DEFAULTS = {
	CharacterName: 'Elliot',
	CharLevel: '9',
	PlayerName: 'Elliot',
	ClassLevel: 'Ranger (Drakewarden) 9',
	Background: 'XXXXX',
	Race: 'XXXXX',
	ProfBonus: '+4',
	Inspiration: '0',
	AC: '17',
	Initiative: '+4',
	Speed: '30 ft',
	HPMax: '64',
	HPCurrent: '64',
	HPTemp: '0',
	HDTotal: '9',
	HD: '9',
	SpellDC: '15',
	PassiveWis: '12',
	Wpn1Name: 'Whisper',
	Wpn1Atk: '+10',
	Wpn1Dmg: '2d4+5 +1d6 (hidden, psychic optional) · Elven Accuracy',
	Wpn2Name: 'Longbow +1',
	Wpn2Atk: '+9',
	Wpn2Dmg: '1d8+5',
	Wpn3Name: 'Shortsword',
	Wpn3Atk: '+6',
	Wpn3Dmg: '1d6+4',
	Features:
		"Whisper — Perfect Hide (1/day): while in cover, Elliot can hide flawlessly. While hidden, Whisper's attacks deal an extra 1d6 damage and Elliot can choose for it to be psychic. After hitting an enemy, Elliot can use a bonus action to slip back into hiding. Hidden attacks can also deliver Vicious Mockery — on a crit the target has disadvantage on its attacks. If the Vicious Mockery save fails, the target's next attack against Elliot has disadvantage.\n\nElven Accuracy (feat): whenever Elliot has advantage on an attack roll using Dexterity — e.g. attacking while hidden — Elliot can reroll ONE of the dice once (roll 3d20, keep best 2). Works with Whisper, the Longbow +1, and the Shortsword; it's what makes hiding before every shot so deadly (~14% crit chance per shot).\n\nLongbow +1.",
	Slots1: '4',
	Slots1Left: '4',
	Slots2: '3',
	Slots2Left: '3',
	Slots3: '2',
	Slots3Left: '2',
	DrakeName: 'Drake',
	DrakeEssence: 'fire',
	DrakeAC: '18',
	DrakeHP: '50',
	DrakeSpeed: '40 ft, fly 40 ft',
	DrakeBiteName: 'Bite',
	DrakeBiteAtk: '+7',
	DrakeBiteDmg: '1d6+4 piercing + 1d6 essence',
	DrakeInfused: '+1d6 essence dmg',
	DrakeNotes: '',
	Spells:
		"Cantrip: Thaumaturgy\n1st: Cure Wounds, Speak with Animals, Hunter's Mark\n2nd: Pass without Trace\n3rd: Nondetection — 8h, can't be detected by divination magic or scrying",
	Gold: '1000',
	Silver: '0',
	Copper: '0'
} as const;

/** Every flat, single-value field on the sheet. */
export type ScalarField = keyof typeof DEFAULTS;

export const SCALAR_FIELDS = Object.keys(DEFAULTS) as ScalarField[];

export type AbilityId = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export const ABILITIES: ReadonlyArray<{ id: AbilityId; mod: string }> = [
	{ id: 'STR', mod: '+1' },
	{ id: 'DEX', mod: '+4' },
	{ id: 'CON', mod: '+3' },
	{ id: 'INT', mod: '-1' },
	{ id: 'WIS', mod: '+2' },
	{ id: 'CHA', mod: '-1' }
];

export const SAVES: Readonly<Record<AbilityId, string>> = {
	STR: '1',
	DEX: '6',
	CON: '3',
	INT: '-1',
	WIS: '6',
	CHA: '-1'
};

export const SAVE_PROF: ReadonlyArray<AbilityId> = ['DEX', 'WIS'];

export interface Skill {
	name: string;
	ab: AbilityId;
	val: string;
	prof: boolean;
}

export const SKILLS: ReadonlyArray<Skill> = [
	{ name: 'Acrobatics', ab: 'DEX', val: '4', prof: false },
	{ name: 'Animal Handling', ab: 'WIS', val: '2', prof: false },
	{ name: 'Arcana', ab: 'INT', val: '-1', prof: false },
	{ name: 'Athletics', ab: 'STR', val: '1', prof: false },
	{ name: 'Deception', ab: 'CHA', val: '-1', prof: false },
	{ name: 'History', ab: 'INT', val: '-1', prof: false },
	{ name: 'Insight', ab: 'WIS', val: '5', prof: true },
	{ name: 'Intimidation', ab: 'CHA', val: '-1', prof: false },
	{ name: 'Investigation', ab: 'INT', val: '-1', prof: false },
	{ name: 'Medicine', ab: 'WIS', val: '1', prof: false },
	{ name: 'Nature', ab: 'INT', val: '1', prof: false },
	{ name: 'Perception', ab: 'WIS', val: '5', prof: true },
	{ name: 'Performance', ab: 'CHA', val: '0', prof: false },
	{ name: 'Persuasion', ab: 'CHA', val: '0', prof: false },
	{ name: 'Religion', ab: 'INT', val: '1', prof: false },
	{ name: 'Sleight of Hand', ab: 'DEX', val: '4', prof: false },
	{ name: 'Stealth', ab: 'DEX', val: '7', prof: true },
	{ name: 'Survival', ab: 'WIS', val: '5', prof: true }
];

export interface Item {
	name: string;
	qty: string;
}

export interface Note {
	title: string;
	body: string;
}

/**
 * The whole sheet. Deliberately one flat object, mirroring the static app's
 * `state` — the roadmap's data model stores it as a single `data jsonb` column,
 * so the migration is a straight lift rather than a reshape.
 */
export type SheetState = Record<ScalarField, string> & {
	abilities: Record<AbilityId, string>;
	saves: Record<AbilityId, string>;
	saveProf: AbilityId[];
	skills: Skill[];
	items: Item[];
	notes: Note[];
};

export const TABS = ['char', 'drake', 'spells', 'bag', 'notes'] as const;

export type TabId = (typeof TABS)[number];

export const TAB_META: ReadonlyArray<{ id: TabId; label: string; icon: string }> = [
	{ id: 'char', label: 'Elliot', icon: '/icons/bow.png' },
	{ id: 'drake', label: 'Drake', icon: '/icons/drake.png' },
	{ id: 'spells', label: 'Spells', icon: '/icons/spellbook.png' },
	{ id: 'bag', label: 'Bag', icon: '/icons/bag.png' },
	{ id: 'notes', label: 'Notes', icon: '/icons/notes.png' }
];

/**
 * The localStorage key. Unchanged from the static sheet on purpose: an existing
 * save must load into the ported app untouched, which is the whole point of
 * doing the UI port before sync exists.
 */
export const STORAGE_KEY = 'elliot-sheet-v1';
