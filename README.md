# Elliot — D&D 5e Character Sheet

A single-file, offline-first D&D 5e character sheet that runs in any browser. No accounts, no database, no install — just open the page and play.

👉 **Live sheet:** https://ghopper-dev.github.io/dnd-elliot-sheet/

This one is built for Elliot (a Level 9 Drakewarden Ranger), but it's plain HTML — fork the repo and swap in your own character in minutes (see *Make it yours* below).

---

## What it does

- **Tabs:** Elliot · Drake Companion · Spellbook · Bag · Session Notes, with pixel-art icons
- **HP tracker** pinned to the top with big −/+ buttons (clamped 0–max)
- **Auto-saves** everything to your browser as you type (the ✓ saved tag flashes)
- **Spellbook** with 2024-rule notes where they differ from legacy text
- **Bag** with editable equipment (name + qty) and gold/silver/copper quick-adjust
- **Session Notes** — dated, collapsible entries (click the title bar to expand/collapse); newest on top; long notes scroll inside their own box
- **📋 Copy all notes** — dumps every session note to your clipboard as one block, ready to paste into a chat/recap
- **⤓ Export JSON** — downloads a full backup of the sheet to your computer (your off-browser safety net)

## How to use it

1. Open the live link (or `index.html` directly in a browser).
2. Edit anything — it saves automatically.
3. Need a fresh start? **↺ Reset to defaults** wipes your saved edits back to the starter values.
4. Want a copy of your data? Hit **⤓ Export JSON** and keep the file somewhere safe.

Session notes tip: hit **+ Add session note** after each game. The title pre-fills with today's date — rename it to "Session 14" or whatever. Click the title bar to collapse a note you're done reading.

---

## Make it yours (fork it)

This is plain HTML/CSS/JS. To run your own character:

1. Fork / copy the repo.
2. Open `app.js` and edit the `DEFAULTS` object — character name, stats, HP, spells, features, gold, etc. Every `DEFAULTS` key needs a matching element `id` in the HTML, so add new fields carefully.
3. For a different companion, duplicate the `drake` tab block and prefix new data keys (e.g. `DrakeName` → `WolfName`).
4. Push to your own GitHub repo and enable **Pages** (Settings → Pages → deploy from `main` / root) to get a shareable link.

Theme is forest-green glow, defined in the `:root` CSS variables at the top — change those to re-skin it.

---

## Swapping in your own hand-drawn icons

Every icon lives in `icons/` and is referenced once, from `index.html`. To
replace one, drop your artwork in with the same filename — no CSS changes
needed.

| File | Where it appears | Source size |
|---|---|---|
| `icons/bow.png` | Elliot tab + favicon | 32×32 |
| `icons/heart.png` | HP tracker | 32×32 |
| `icons/save.png` | Save button | 64×64 |
| `icons/bag.png` | Bag tab | 64×64 |
| `icons/spellbook.png` | Spells tab | 64×64 |
| `icons/notes.png` | Notes tab | 64×64 |
| `icons/drake.png` | Drake tab | 64×64 |
| `icons/tab-frame.png` | Border around unselected tabs | 46×22 |

**Rules for replacements — these are what keep the set looking like a set:**

1. **Export PNG with a transparent background, never JPEG.** JPEG has no
   alpha channel, so the icon arrives with an opaque rectangle baked in,
   and its compression smears the hard edges pixel art depends on. This
   was the original cause of the icons looking "off".
2. **Square canvas** (32×32 or 64×64). The CSS sizes icons with
   `object-fit: contain`, so a square export is never cropped or stretched.
3. **Draw at 1× and let the browser scale up.** `image-rendering: pixelated`
   keeps the blocks crisp; a pre-scaled blurry export cannot be un-blurred.
4. **Keep the file extension honest.** A JPEG named `.png` still behaves
   like a JPEG — browsers read the file's magic bytes, not its name.

Every icon in the set is now hand-drawn pixel art — no library placeholders
left.

`tab-frame.png` is the odd one out: it's a CSS `border-image`, not an `<img>`.
It must be **cropped tight to the artwork** with no transparent margin,
because `border-image-slice` measures in from the file's edges — a
centred drawing on a padded canvas would slice mostly empty space. The
slice is `6`, matching the corner motif; if you redraw it with bigger
corners, raise that number to match in `style.css`.

---

## How it stores data (read this)

Everything lives in your browser's **localStorage**, tied to the page URL:

- ✅ Works offline, even with no signal
- ✅ Survives closing the tab / restarting
- ⚠️ **Per-device, per-browser** — notes on your laptop won't show on your phone
- ⚠️ **Wiped if you clear site data** (clearing cookies takes the sheet with it)
- ⚠️ **Gone in private/incognito mode** when you close the window

That's why the **⤓ Export JSON** button exists — until cloud sync arrives, that export is your only backup. Use it after sessions.

## Planned: cross-device sync

The next step is wiring the sheet to a **Google Sheet as a backend** (the page becomes a "fancy UI for a spreadsheet"): same `state` shape, just a different save target, so notes follow you across devices and back themselves up automatically. Not built yet — the localStorage version is the working prototype.

---

## Tech notes

- Static `index.html` + `style.css` + `app.js`, no build step, no runtime dependencies
- `state` is a flat object; `localStorage` key `elliot-sheet-v1`
- Tabs follow the ARIA tabs pattern — `role="tablist"`, `aria-selected`,
  roving `tabindex`, arrow-key navigation — and toggle panels with `hidden`
- Dynamic rows are built with `createElement`/`textContent` rather than
  `innerHTML`, since character data round-trips through localStorage
- Layout is derived from the Figma frame *Desktop View* (node `1:27`);
  design tokens live in `:root` in `style.css` and are named after it
- Body text is Lato (Google Fonts, degrades to a system sans); headings,
  the character name and HP numerals use a Palatino stack
- All icons are original hand-drawn pixel art (64×64 / 32×32 RGBA PNG)
- Hosted free on GitHub Pages

Built by Ghopper for Kate. Fork freely.
