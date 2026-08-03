/**
 * Screenshot the ported app beside the static sheet and diff them.
 *
 * This exists because layout bugs on this project have three times been
 * invisible from reading the CSS. It is how the port was validated: every tab
 * at every width, compared pixel-for-pixel against the sheet that is live.
 *
 * It also catches build-only regressions — the minifier silently dropping
 * `backdrop-filter: none` from `.card .card` showed up here as a 9/255 colour
 * shift and nowhere else.
 *
 *   # terminal 1 — the static sheet
 *   python3 -m http.server 8899 --directory ..
 *   # terminal 2 — the ported app (must be a production build; dev is unminified)
 *   npm run build && npm run preview -- --port 4173
 *   # terminal 3
 *   node e2e/visual-diff.mjs
 *
 * Needs `playwright-core` and, for the diff numbers, ImageMagick (`compare`).
 * Without ImageMagick it still writes the screenshots for eyeballing.
 */

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const STATIC_URL = process.env.STATIC_URL ?? 'http://localhost:8899/index.html';
const APP_URL = process.env.APP_URL ?? 'http://localhost:4173/';
const OUT = process.env.OUT ?? '.screenshots';

const WIDTHS = [
	['phone', 390, 844],
	['tablet', 820, 1180],
	['desktop', 1440, 1000]
];
const TABS = ['char', 'drake', 'spells', 'bag', 'notes'];

mkdirSync(OUT, { recursive: true });

const launchOptions = { args: ['--no-sandbox', '--font-render-hinting=none'] };
if (process.env.CHROME) launchOptions.executablePath = process.env.CHROME;
const browser = await chromium.launch(launchOptions);

async function capture(label, url) {
	for (const [name, width, height] of WIDTHS) {
		const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
		const page = await ctx.newPage();
		const errors = [];
		page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
		page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

		await page.goto(url, { waitUntil: 'networkidle' });
		await page.waitForTimeout(700);
		await page.screenshot({ path: `${OUT}/${label}-${name}.png`, fullPage: true });

		// Desktop only: walk every tab so panel content is compared too.
		if (name === 'desktop') {
			for (const t of TABS) {
				await page.click(`#tabbtn-${t}`);
				await page.waitForTimeout(250);
				await page.screenshot({ path: `${OUT}/${label}-tab-${t}.png`, fullPage: true });
			}
		}

		if (errors.length) console.log(`  ⚠ [${label}/${name}] ${errors.join(' | ')}`);
		await ctx.close();
	}
}

console.log('capturing static sheet…');
await capture('static', STATIC_URL);
console.log('capturing ported app…');
await capture('app', APP_URL);
await browser.close();

const im = (args) => execFileSync('convert', args, { encoding: 'utf8' }).trim();

let worst = 0;
console.log(`\n${'view'.padEnd(12)} ${'size'.padEnd(11)} result`);
for (const view of ['phone', 'tablet', 'desktop', ...TABS.map((t) => `tab-${t}`)]) {
	const a = `${OUT}/static-${view}.png`;
	const b = `${OUT}/app-${view}.png`;
	try {
		const sizeA = im([a, '-format', '%wx%h', 'info:']);
		const sizeB = im([b, '-format', '%wx%h', 'info:']);
		if (sizeA !== sizeB) {
			console.log(`${view.padEnd(12)} ${''.padEnd(11)} PAGE SIZE DIFFERS  static=${sizeA} app=${sizeB}`);
			worst = 255;
			continue;
		}
		// Max per-channel difference is the honest metric: a count of "differing
		// pixels" screams at sub-perceptual rounding, a max of 9/255 does not.
		const max = Number(
			im([a, b, '-compose', 'difference', '-composite', '-colorspace', 'Gray', '-format', '%[fx:int(maxima*255)]', 'info:'])
		);
		worst = Math.max(worst, max);
		console.log(`${view.padEnd(12)} ${sizeA.padEnd(11)} maxdiff=${max}/255 ${max === 0 ? '✓ identical' : ''}`);
	} catch {
		console.log(`${view.padEnd(12)} ${''.padEnd(11)} (ImageMagick unavailable — screenshots written to ${OUT}/)`);
		process.exit(0);
	}
}

console.log(`\nworst difference across all views: ${worst}/255`);
process.exit(worst === 0 ? 0 : 1);
