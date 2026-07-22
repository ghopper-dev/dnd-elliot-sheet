# Elliot — D&D 5e Character Sheet

A single-file, offline-first D&D 5e character sheet that runs in any browser. No accounts, no database, no install — just open the page and play.

👉 **Live sheet:** https://ghopper-dev.github.io/dnd-elliot-sheet/

This one is built for Elliot (a Level 9 Drakewarden Ranger), but it's plain HTML — fork the repo and swap in your own character in minutes (see *Make it yours* below).

---

## What it does

- **Tabs:** Elliot · 🐉 Drake Companion · 📖 Spellbook · 🎒 Bag · 📝 Session Notes
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

This is just one HTML file. To run your own character:

1. Fork / copy the repo.
2. Open `index.html` and edit the `DEFAULTS` object near the bottom of the `<script>` — character name, stats, HP, spells, features, gold, etc. Every `DEFAULTS` key needs a matching element `id` in the HTML, so add new fields carefully.
3. For a different companion, duplicate the `drake` tab block and prefix new data keys (e.g. `DrakeName` → `WolfName`).
4. Push to your own GitHub repo and enable **Pages** (Settings → Pages → deploy from `main` / root) to get a shareable link.

Theme is forest-green glow, defined in the `:root` CSS variables at the top — change those to re-skin it.

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

- Single `index.html`, no build step, no dependencies
- `state` is a flat object; `localStorage` key `elliot-sheet-v1`
- Tabs toggle `<div>` visibility; list features (bag, notes) rebuild from `state` on render
- Hosted free on GitHub Pages

Built by Ghopper for Kate. Fork freely.
