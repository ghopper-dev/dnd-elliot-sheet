/**
 * Behavioural smoke test for the ported sheet.
 *
 * Unit tests cover the persistence functions; this covers the things that only
 * break in a real browser — caret behaviour in the contenteditable notes
 * editor, the debounced write actually reaching localStorage, and an existing
 * static-sheet save loading intact.
 *
 * Not wired into `npm test`: it needs a browser and a running server, and this
 * project is played on, not shipped on a schedule. Run it before merging
 * anything that touches state or the notes editor.
 *
 *   npm run build && npm run preview -- --port 4173 &
 *   npm i -D playwright-core          # or: npm i -D playwright && npx playwright install chromium
 *   URL=http://localhost:4173/ node e2e/smoke.mjs
 *
 * CHROME=/path/to/chrome overrides browser discovery, which is needed on any
 * machine where Playwright cannot install its own.
 */

import { chromium } from 'playwright-core';

const URL = process.env.URL ?? 'http://localhost:4173/';
const KEY = 'elliot-sheet-v1';

const launchOptions = { args: ['--no-sandbox'] };
if (process.env.CHROME) launchOptions.executablePath = process.env.CHROME;

const browser = await chromium.launch(launchOptions);
let pass = 0;
let fail = 0;

function check(name, ok, detail = '') {
	if (ok) {
		pass++;
		console.log(`  ✓ ${name}`);
	} else {
		fail++;
		console.log(`  ✗ ${name} ${detail}`);
	}
}

async function newPage(seed) {
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const page = await ctx.newPage();
	page.on('pageerror', (e) => {
		fail++;
		console.log(`  ✗ PAGE ERROR: ${e.message}`);
	});
	if (seed) {
		await page.addInitScript(([k, v]) => window.localStorage.setItem(k, v), [KEY, JSON.stringify(seed)]);
	}
	await page.goto(URL, { waitUntil: 'networkidle' });
	await page.waitForTimeout(400);
	return { ctx, page };
}

const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);

// ── 1. An existing static-sheet save loads untouched ───────────────────────
// The premise of doing the UI port before sync: a real browser already holds a
// sheet under this key, and it has to survive the move.
console.log('\n1. Legacy localStorage blob from the static sheet');
{
	const { ctx, page } = await newPage({
		CharacterName: 'Elliot',
		HPCurrent: '31',
		HPMax: '64',
		Gold: '1420',
		items: [{ name: 'Rope, hempen', qty: '2' }],
		notes: [{ title: '2026-07-27', body: '<b>the drake spoke</b>' }],
		skills: [{ name: 'Stealth', ab: 'DEX', val: '9', prof: true }]
	});

	check('current HP restored', (await page.inputValue('#HPCurrent')) === '31');
	check('gold restored', (await page.inputValue('#Gold')) === '1420');
	check('untouched field keeps its default', (await page.inputValue('#SpellDC')) === '15');

	await page.click('#tabbtn-bag');
	await page.waitForTimeout(200);
	check(
		'saved item restored',
		(await page.inputValue('#tab-bag table input[aria-label="Item name"]')) === 'Rope, hempen'
	);

	await page.click('#tabbtn-notes');
	await page.waitForTimeout(300);
	check(
		'saved note body restored as rich text',
		(await page.innerHTML('.note-editor')).includes('<b>the drake spoke</b>')
	);

	await page.click('#tabbtn-char');
	await page.waitForTimeout(200);
	check(
		'saved skills array replaces defaults',
		(await page.textContent('#tab-char .card:nth-child(2) .skill .name'))?.includes('Stealth')
	);
	await ctx.close();
}

// ── 2. Edits persist across a reload ──────────────────────────────────────
console.log('\n2. Editing and persistence');
{
	const { ctx, page } = await newPage();

	await page.fill('#CharacterName', 'Nyx Duskwalker');
	await page.waitForTimeout(700);
	check('title tracks the name field', (await page.textContent('h1')) === 'Nyx Duskwalker');
	check('written to localStorage', (await saved(page))?.CharacterName === 'Nyx Duskwalker');

	await page.reload({ waitUntil: 'networkidle' });
	await page.waitForTimeout(500);
	check('survives a reload', (await page.inputValue('#CharacterName')) === 'Nyx Duskwalker');
	await ctx.close();
}

// ── 3. HP arithmetic and clamping ─────────────────────────────────────────
console.log('\n3. HP controls');
{
	const { ctx, page } = await newPage({ HPCurrent: '10', HPMax: '12' });

	await page.click('[aria-label="Add 1 hit point"]');
	await page.waitForTimeout(100);
	check('+ increments', (await page.inputValue('#HPCurrent')) === '11');

	for (let i = 0; i < 5; i++) await page.click('[aria-label="Add 1 hit point"]');
	await page.waitForTimeout(100);
	check('clamps at max', (await page.inputValue('#HPCurrent')) === '12');

	for (let i = 0; i < 20; i++) await page.click('[aria-label="Remove 1 hit point"]');
	await page.waitForTimeout(600);
	check('clamps at zero', (await page.inputValue('#HPCurrent')) === '0');
	check('HP persisted', (await saved(page))?.HPCurrent === '0');
	await ctx.close();
}

// ── 4. Proficiency toggles ────────────────────────────────────────────────
console.log('\n4. Proficiency dots');
{
	const { ctx, page } = await newPage();
	const dot = page.locator('[aria-label="Acrobatics proficiency"]');
	check('starts unpressed', (await dot.getAttribute('aria-pressed')) === 'false');

	await dot.click();
	await page.waitForTimeout(600);
	check('toggles on', (await dot.getAttribute('aria-pressed')) === 'true');
	check(
		'persisted to storage',
		(await saved(page))?.skills?.find((x) => x.name === 'Acrobatics')?.prof === true
	);

	await page.locator('[aria-label="STR save proficiency"]').click();
	await page.waitForTimeout(600);
	check('save proficiency persisted', (await saved(page))?.saveProf?.includes('STR') === true);
	await ctx.close();
}

// ── 5. Inventory + gold ───────────────────────────────────────────────────
console.log('\n5. Bag');
{
	const { ctx, page } = await newPage();
	await page.click('#tabbtn-bag');
	await page.waitForTimeout(200);

	await page.fill('[aria-label="New item name"]', 'Torch');
	await page.fill('[aria-label="New item quantity"]', '10');
	await page.click('button:has-text("+ Add")');
	await page.waitForTimeout(600);

	let s = await saved(page);
	check('item added', s?.items?.[0]?.name === 'Torch' && s?.items?.[0]?.qty === '10');
	check('name field cleared after add', (await page.inputValue('[aria-label="New item name"]')) === '');

	await page.fill('[aria-label="New item name"]', 'Rope');
	await page.press('[aria-label="New item name"]', 'Enter');
	await page.waitForTimeout(600);
	s = await saved(page);
	check('Enter adds an item', s?.items?.length === 2);
	check('blank qty defaults to 1', s?.items?.[1]?.qty === '1');

	await page.fill('[aria-label="New item name"]', '   ');
	await page.click('button:has-text("+ Add")');
	await page.waitForTimeout(400);
	check('whitespace-only name rejected', (await saved(page))?.items?.length === 2);

	await page.click('[aria-label="Remove Torch"]');
	await page.waitForTimeout(600);
	s = await saved(page);
	check('item removed', s?.items?.length === 1 && s?.items?.[0]?.name === 'Rope');

	const gold0 = await page.inputValue('#Gold');
	await page.click('button:has-text("+100")');
	await page.waitForTimeout(500);
	check('gold +100', Number(await page.inputValue('#Gold')) === Number(gold0) + 100);
	await ctx.close();
}

// ── 6. Notes: the caret trap ──────────────────────────────────────────────
// If the editor's content is reassigned on every keystroke the caret jumps to
// the start and typed text comes out reversed. This is the test that catches it.
console.log('\n6. Notes editor');
{
	const { ctx, page } = await newPage();
	await page.click('#tabbtn-notes');
	await page.waitForTimeout(200);
	check('empty state shown', (await page.textContent('.note-empty'))?.includes('No notes yet'));

	await page.click('button:has-text("+ Add session note")');
	await page.waitForTimeout(400);
	check('editor appears', await page.isVisible('.note-editor'));

	await page.click('.note-editor');
	await page.keyboard.type('goblins ambushed us at the ford', { delay: 25 });
	await page.waitForTimeout(700);
	check(
		'typed text is in order (caret did not reset)',
		(await page.textContent('.note-editor')) === 'goblins ambushed us at the ford'
	);
	check('note body persisted', (await saved(page))?.notes?.[0]?.body?.includes('goblins ambushed'));

	await page.click('button:has-text("+ Add session note")');
	await page.waitForTimeout(400);
	await page.click('.note-editor');
	await page.keyboard.type('we found the shrine', { delay: 25 });
	await page.waitForTimeout(700);

	const rows = page.locator('.notes-side .nrow');
	check('two notes in sidebar', (await rows.count()) === 2);

	await rows.nth(1).click();
	await page.waitForTimeout(400);
	check(
		'switching notes loads the other body',
		(await page.textContent('.note-editor')) === 'goblins ambushed us at the ford'
	);

	await rows.nth(0).click();
	await page.waitForTimeout(400);
	check(
		'switching back loads the first body',
		(await page.textContent('.note-editor')) === 'we found the shrine'
	);

	await page.click('.note-editor');
	await page.keyboard.press('Control+A');
	await page.click('[aria-label="Bold"]');
	await page.waitForTimeout(600);
	check('bold applied and saved', /<b>|<strong>/i.test((await saved(page))?.notes?.[0]?.body ?? ''));

	await page.locator('.notes-side .nrow .ndel').nth(0).click();
	await page.waitForTimeout(600);
	check('note deleted', (await saved(page))?.notes?.length === 1);
	check('sidebar updated', (await page.locator('.notes-side .nrow').count()) === 1);
	await ctx.close();
}

// ── 7. Tab keyboard navigation ────────────────────────────────────────────
console.log('\n7. Tabs (ARIA pattern)');
{
	const { ctx, page } = await newPage();
	await page.focus('#tabbtn-char');

	await page.keyboard.press('ArrowRight');
	await page.waitForTimeout(200);
	check('ArrowRight moves to Drake', (await page.getAttribute('#tabbtn-drake', 'aria-selected')) === 'true');
	check('drake panel visible', await page.isVisible('#tab-drake'));
	check('char panel hidden', !(await page.isVisible('#tab-char')));

	await page.keyboard.press('End');
	await page.waitForTimeout(200);
	check('End jumps to last tab', (await page.getAttribute('#tabbtn-notes', 'aria-selected')) === 'true');

	await page.keyboard.press('ArrowRight');
	await page.waitForTimeout(200);
	check('wraps around to first', (await page.getAttribute('#tabbtn-char', 'aria-selected')) === 'true');

	const roving = await page.evaluate(() =>
		[...document.querySelectorAll('.tab')].map((b) => b.getAttribute('tabindex'))
	);
	check('roving tabindex: one 0, rest -1', roving.filter((t) => t === '0').length === 1);
	await ctx.close();
}

// ── 8. A corrupt save must not white-screen at the table ──────────────────
console.log('\n8. Resilience');
{
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	await page.addInitScript((k) => window.localStorage.setItem(k, '{"CharacterName":'), KEY);
	await page.goto(URL, { waitUntil: 'networkidle' });
	await page.waitForTimeout(400);
	check('corrupt JSON falls back to defaults', (await page.inputValue('#CharacterName')) === 'Elliot');
	check('sheet still renders', await page.isVisible('.sheet-stage'));
	await ctx.close();
}

console.log(`\n${'='.repeat(46)}\n  ${pass} passed, ${fail} failed\n${'='.repeat(46)}`);
await browser.close();
process.exit(fail ? 1 : 0);
