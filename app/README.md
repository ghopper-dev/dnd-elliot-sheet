# D&D Companion — app (v1 spike)

The static sheet in the repo root, ported to SvelteKit + TypeScript with its
behaviour and its pixels unchanged.

**This is not live yet.** https://ghopper-dev.github.io/dnd-elliot-sheet/ still
serves the static sheet from the repo root, untouched. Nothing here is on the
critical path for game night until someone deliberately cuts over.

See [`../ROADMAP.md`](../ROADMAP.md) for where this is going and why.

---

## Why this exists

ROADMAP §4: *"Port the vanilla UI to components in v1 — at 384 lines, not at
5,000. The imperative `render()` / `renderItems()` / `renderNotes()` pattern
cannot carry derived values plus sync."*

This is that port and **only** that port. No accounts, no server, no database,
no sync. State still lives in `localStorage` under the same key, in the same
shape. That is deliberate: it makes the port verifiable against the thing it
replaces, which is the only reason we can be confident it's correct.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (`adapter-node` → `build/`) |
| `npm run preview` | Serve the production build |
| `npm run check` | `svelte-check` — types + a11y. Currently 0 errors, 0 warnings |
| `npm test` | Vitest unit tests for state persistence |

**Verify against a production build, not `npm run dev`.** See *The minifier
trap* below.

---

## How it's laid out

```
src/
  app.css                        the design system — one token layer in :root
  app.html                       document shell (favicon, Lato, meta)
  lib/
    data/defaults.ts             DEFAULTS, abilities, skills, tabs + the types
    state/
      persistence.ts             load/merge/save — pure, no Svelte, no window
      persistence.test.ts        22 unit tests
      sheet.svelte.ts            SheetStore: reactive state + every mutation
    notes/html.ts                note-body HTML handling (see Security)
    components/
      SheetHeader.svelte         identity block, toolbar, HP cluster
      TabRail.svelte             ARIA tabs pattern, roving tabindex
      SkillRow.svelte            shared by saving throws and skills
      tabs/{Character,Drake,Spells,Bag,Notes}Tab.svelte
  routes/
    +layout.svelte               imports app.css
    +page.svelte                 assembles the sheet, owns the active tab
    +page.ts                     prerender = true
static/icons, static/assets      copies of the root icons/ and assets/
e2e/                             browser smoke test + visual diff
```

### Decisions worth knowing

**`adapter-node`, not `adapter-auto`.** ROADMAP §4 settles on one container
beside Postgres, so the target is already known. `adapter-auto` infers from CI
environment variables and falls back with a warning locally.

**State lives in context, not a module singleton.** Today the store is only
populated in the browser, so a singleton would be harmless. But v1 adds accounts
and a server, and a module-level `$state` on a long-lived Node process is shared
by every request that touches it. Context scopes it to one render. Getting this
wrong later means showing one player another player's character sheet.

**`persistence.ts` knows nothing about Svelte or `window`.** It takes a
storage-shaped object. That makes it unit-testable without a DOM, and reusable
against a server payload when sync lands.

**The merge is shallow, on purpose.** `mergeSaved` mirrors the static app's
`Object.assign(state, saved)` exactly — a stored `abilities` object replaces the
default outright rather than merging key-by-key. Anything "smarter" would change
what an existing save loads as, which is the one thing a port must not do.

**All five panels stay mounted, toggled with `hidden`.** Same as the static
sheet: one source of truth for visibility, hidden panels stay out of the
accessibility tree, and switching tabs never discards a half-typed item row.

---

## Verification

The port is verified two ways, because neither alone is enough.

### Pixels

`e2e/visual-diff.mjs` screenshots both versions at phone (390), tablet (820) and
desktop (1440) widths, plus every tab, and diffs them.

**Result: 8/8 views identical — 0 differing pixels, maxdiff 0/255.**

This is not ceremony. Layout bugs on this project have three times been
invisible from reading the CSS, and this run caught a real one — see below.

### Behaviour

`e2e/smoke.mjs` drives a real browser: 42 checks over persistence, HP clamping,
proficiency toggles, the bag, the notes editor, keyboard tab navigation, and
recovery from a corrupt save. **Result: 42/42.**

The two that matter most:

- **An existing `elliot-sheet-v1` blob loads intact** — HP, gold, items, note
  bodies and a saved `skills` array all survive. That's the whole premise.
- **Typing in a note doesn't reset the caret.** See below.

Neither e2e script is wired into `npm test` — they need a browser and a running
server. Run them before merging anything that touches state or the notes editor.

---

## Traps found while porting

### The minifier trap ⚠

`app.css` is the static `style.css` verbatim, but the build broke one rule:

```
source                            what actually shipped
.card .card {                     .card .card{
  backdrop-filter: none;            -webkit-backdrop-filter:none;
  -webkit-backdrop-filter: none;    /* ← standard property deleted */
```

The CSS minifier treats an unprefixed property and its `-webkit-` alias as
duplicates and keeps only the **last** one. `.card` writes `-webkit-` first and
standard last, so both survive; `.card .card` had them the other way round, so
`backdrop-filter: none` was deleted and the spell cards stacked blur on blur.

Invisible in `npm run dev` (no minification), invisible in code review (the
source is correct), and invisible in devtools unless you read the built asset.
**Keep `-webkit-` first and the standard property last, always.**

The static sheet is unaffected — it has no build step — so `../style.css` is
correct as it stands and was not touched.

### The caret trap ⚠

Note bodies are HTML, and `contenteditable` owns its own DOM. In Svelte, an
attachment re-runs whenever state it *reads* changes — so naively loading
`current.body` into the editor means every keystroke rewrites the DOM under the
caret and drops it to position zero.

Two guards in `NotesTab.svelte`, and both are needed:

- `{#key current}` keys on the note **object identity**, not the index.
  Switching or deleting notes swaps the object → editor rebuilds. Typing mutates
  `.body` on the same object → identity holds → no rebuild.
- `untrack(() => current?.body)` reads the body without subscribing to it, so
  the attachment can't be woken by the thing it writes.

`e2e/smoke.mjs` types a sentence character-by-character and asserts it comes out
in order. Don't remove that test.

### Svelte trims whitespace

`<small> {sub}</small>` renders as `Acrobatics(DEX)` — Svelte strips whitespace
at element edges. The space has to be inside the expression:
`<small>{' ' + sub}</small>`.

---

## Security: note bodies are unsanitised HTML ⚠

ROADMAP §6. Note bodies are stored and rendered as raw HTML, which is correct
**only** while a note never leaves the browser that typed it. That is true today
and stops being true the moment sync or campaign sharing lands, at which point
it becomes stored XSS between players.

**Sanitising is deliberately not done here.** Applied to note bodies that
already exist, an allowlist would silently rewrite real session notes — data
loss buried inside a port, where nobody would be looking for it. It belongs in
the PR that adds sync, tested against the payloads it actually defends.

All note HTML routes through `lib/notes/html.ts` so that fix is one function:

```js
const clean = DOMPurify.sanitize(html);   // ← the line to add
const doc = new DOMParser().parseFromString(clean, 'text/html');
```

The toolbar's `document.execCommand` calls are deprecated and want replacing at
the same time.

---

## Not done here

Scoped out on purpose, each for a stated reason:

- **Accounts, server, sync, Postgres.** ROADMAP's first slice is the UI port
  alone. Backend starts once this is clean.
- **The mobile-first rework.** ROADMAP §4 wants it, but doing it *inside* the
  port would make the diff unverifiable — you could not tell a port bug from a
  redesign. It also needs the mobile Figma frame that §8 lists as outstanding.
  The CSS is carried over verbatim and verified at 390px; the rework is its own
  PR.
- **Note sanitisation.** Above.
- **Self-hosting Lato.** Still a Google Fonts request, exactly as the static
  sheet does it. ROADMAP §8 open decision, raised twice, undecided — and
  changing it here would be a redesign smuggled into a port.
- **Prettier / ESLint.** Not configured. `svelte-check` covers types and a11y.
  Adding a formatter would reformat everything and drown the diff.

## Known duplication

`static/icons/` and `static/assets/` are **copies** of the repo-root `icons/`
and `assets/`, because the root copies are what the live GitHub Pages sheet
serves and they cannot move yet. Symlinks were considered and rejected: if one
fails to resolve the icons vanish silently, and this project has already lost an
afternoon to icons that were the wrong thing while looking approximately right.

At cutover, delete the root copies along with `index.html`, `app.js` and
`style.css`.
