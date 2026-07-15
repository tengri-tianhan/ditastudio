# DITA Studio — Source Code Guide

This document explains how to run, build, navigate, and extend the DITA
Studio source code. For end-user instructions, see `README.md`; for release
history, see `CHANGELOG.md`.

- **Stack**: Electron 31 (Chromium + Node.js), Monaco Editor, `marked`,
  vanilla JavaScript — no framework, no bundler, no build step for the
  renderer.
- **License**: Apache 2.0. Modify, rebrand, redistribute, and use commercially as
  you wish.

---

## 1. Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | 18 or newer (20/22 recommended) | `node -v` to check |
| npm | 9+ | ships with Node |
| OS for running | Windows / macOS / Linux | Electron is cross-platform |
| OS for packaging | Windows exe: any (Linux needs wine, see §3) · macOS dmg: **macOS only** | |

No global installs are needed; everything is a local dev dependency.

## 2. Getting started

```bash
# 1. unzip the source archive, then:
cd dita-studio

# 2. install dependencies (Electron ~100 MB, Monaco ~15 MB, marked, electron-builder)
npm install

# 3. run in development mode
npm start
```

`npm start` launches the app directly from source. There is **no compile
step**: the renderer is plain HTML/CSS/JS loaded from `renderer/`, so the
edit–reload loop is just *save file → Ctrl+R in the app window* (or restart
`npm start` when you change `main.js` or `preload.js`, which only load once
per process).

Tip: to open DevTools for the renderer while developing, add
`win.webContents.openDevTools()` after the `loadFile` call in `main.js`.

## 3. Building distributables

```bash
npm run dist        # Windows: NSIS installer + portable exe  -> release/
npm run dist:mac    # macOS:   .dmg (arm64 + x64) + .zip      -> release/  (run on a Mac)
```

Platform notes:

- **Windows targets on Windows** — works out of the box.
- **Windows targets on Linux** — cross-building works but the NSIS step
  executes the installer stub, which requires **wine (32- and 64-bit)** and a
  display. On a headless box:
  `sudo dpkg --add-architecture i386 && sudo apt install wine64 wine32:i386 xvfb`,
  then `xvfb-run -a npm run dist`.
- **macOS `.app`/zip on Linux** — cross-builds fine.
- **macOS `.dmg`** — can only be produced **on macOS** (the `dmg-builder`
  toolchain needs Apple's `hdiutil` and the darwin-only `dmg-license`
  package). The configuration is already in `package.json`; on any Mac,
  `npm run dist:mac` yields the dmg directly.
- None of the outputs are code-signed by default. To sign, follow
  electron-builder's `win.certificateFile` / macOS notarization docs and add
  your credentials — no source changes required.

## 4. Repository layout

```
dita-studio/
├── main.js                 Electron MAIN process (Node context)
├── preload.js              contextBridge: the only API surface the UI can use
├── renderer/               Electron RENDERER (browser context)
│   ├── index.html          all markup: menubar, panes, every <dialog>
│   ├── style.css           all styling (CSS custom properties at the top)
│   ├── app.js              application logic (~3000 lines, section-banded)
│   └── lib/
│       ├── templates.js    new-file templates (DITA 1.3, LwDITA, MD, DITAVAL…)
│       ├── ditaToHtml.js   DITA 1.3 -> HTML transformer (+ media, keyref, DITAVAL)
│       ├── deps.js         reference extractor / dependency graph builder
│       └── lint.js         syntax rules + auto-fix transforms (pure functions)
├── sample-project/         demo content exercising keyref/conref/DITAVAL/links
├── package.json            deps + electron-builder config (win/mac targets)
├── README.md               end-user guide (also rendered in-app: Help ▸ User guide)
├── CHANGELOG.md            release history (in-app: Help ▸ What's new)
└── DEVELOPMENT.md          this file
```

### Process model

```
┌───────────────────────────────┐        ipcRenderer.invoke / handle
│ renderer (index.html, app.js) │ ◄────────────────────────────────┐
│  - no Node access             │                                  │
│  - talks only to window.api   │        ┌───────────────────────┐ │
└───────────────┬───────────────┘        │ main.js (Node)        │ │
                │ contextBridge          │  - filesystem          │◄┘
        ┌───────▼────────┐               │  - dialogs             │
        │ preload.js     │──────────────►│  - printToPDF          │
        │ exposes        │               │  - DITA-OT spawn       │
        │ window.api.*   │               │  - AI HTTP calls       │
        └────────────────┘               └───────────────────────┘
```

Security posture: `contextIsolation: true`, `nodeIntegration: false`. The
renderer can only do what `preload.js` explicitly exposes. **If you add a
capability that needs Node (fs, child_process, network), add an
`ipcMain.handle` in `main.js` and a matching function in `preload.js`** —
never re-enable nodeIntegration.

## 5. Subsystem tour (where things live in `app.js`)

`app.js` is organized into banded sections (search for the
`=== v1.x additions ===` banners). The important state object is `S` at the
top (project root, tree, current file, key space, DITAVAL filter, caches) and
`TABS` (open editor tabs, each holding a Monaco model).

| Subsystem | Look for | Notes |
| --- | --- | --- |
| Editor & tabs | `monacoEd`, `TABS`, `openFile`, `activateTab`, `closeTab` | one Monaco instance, model-per-tab; the `editor` object is a thin adapter (`editor.value` get/set goes through the undo stack) |
| Project tree | `renderTree`, `buildNodes`, `moveFileWithRefs` | expansion state persists in `S.expandedDirs`; file drops onto maps/folders handled per-row |
| Map browser | `refreshMapModel`, `buildMapNodes`, `attachDnD`, `serializeXml` | the map is a live XML `Document`; drag/drop mutates it, then it is pretty-serialized back into the editor |
| Key space / conref | `buildKeyspace`, `resolveConrefs`, `keyspaceFor` | first key definition wins; conref resolution is a pre-pass on the parsed doc (depth ≤ 3) |
| DITAVAL | `refreshDitavalList`, `loadDitaval` + `excluded()` in `ditaToHtml.js` | include/flag overrides exclude |
| Validation & fixes | `runValidation` + `renderer/lib/lint.js` | DOM-based DITA rules live in `runValidation`; pure text rules/fixers live in `lint.js`; problems become Monaco markers + pane rows with Fix buttons |
| Preview & publish | `buildBodyHtml`, `assembleMap`, `publishCss`, `STYLE_PACKS` | one pipeline feeds preview, HTML export, and PDF |
| Documentation site | `exportWebHelp`, `whNavFromMap`, `whPage`, `whLanding`, `WH_CSS`, `WH_JS`, `WH_PACKS` | fully static output; `wh*` helpers build nav, rewrite links, copy media, emit the search index |
| PDF | `export:pdf` / `export:pdfFile` in `main.js` | Chromium `printToPDF` with page-number footers; the site PDF adds cover + contents |
| DITA-OT | `ditaot:run` in `main.js`, `btnPublishOT` handler | spawns `bin/dita(.bat)`, streams the log over IPC |
| Menus | `MENUBAR`, `renderMenuItems`, `showContextMenu` | declarative definitions; items compute `disabled` at open time |
| Command palette / quick open | `openQuickOpen(mode)` | one component, three modes: `files`, `commands`, `link` |
| AI assistant | `AI_PROVIDERS`, `AI_ACTIONS`, `runAi` + `ai:chat` in `main.js` | two adapters: OpenAI-compatible and Anthropic; requests run in main (no CORS) |
| Autosave / versions | `autosaveTick`, `autosave:*` in `main.js`, `openVersionDiff` | snapshots in `<project>/.autosave/`, 30 per file; diff via Monaco DiffEditor |

## 6. Extension recipes

**Add a new-file template** — edit `renderer/lib/templates.js`: add a
`T.mykind = (id, title) => \`…\`` function and one entry in
`window.TEMPLATES.kinds`. It appears in the New file dialog automatically.

**Add a style pack** — three places share the pack key: `STYLE_PACKS`
(single-doc HTML/PDF, in `app.js`), `WH_PACKS` (site-scoped variant, selectors
prefixed with `.wh-article`), and the two `<select>` option lists in
`index.html` (`#setStylePack`, `#siteStylePack`).

**Add a lint rule / auto-fix** — pure text rules go in
`renderer/lib/lint.js` (add to `checkMarkdown`/`checkXmlRaw`/`checkHtml`, and
register the fixer in the `*_FIXES` map with a `fixId`). DITA rules that need
the parsed DOM or the filesystem go in `runValidation` in `app.js`; attach an
inline `fix: { label, apply(text) => text }`. Fixes must be **idempotent** —
Fix-all applies each unique fix once. Add a test to the pattern shown in §7.

**Add an AI provider** — one entry in `AI_PROVIDERS` (`app.js`): pick
`style: 'openai'` for any OpenAI-compatible endpoint or `style: 'anthropic'`
for the Messages API, set `baseUrl`, a default `model`, `keyNeeded`, the
console URL for the "Get key" button, and a one-line `hint`.

**Add a menu item or command** — append to the relevant `MENUBAR` section
and/or `buildCommands()` (command palette). Items are plain objects:
`{ label, hint?, disabled?, checked?, run, sub? }`.

**Extend the DITA renderer** — add a `case 'elementname':` to the switch in
`renderer/lib/ditaToHtml.js`. Unknown elements already fall through
transparently (children render), so only add cases that need specific HTML.

**Add an IPC capability** — `ipcMain.handle('ns:name', async (_e, …) => …)`
in `main.js`, expose it in `preload.js` as `window.api.something`, call it
from `app.js`. Keep argument types serializable (structured clone).

## 7. Tests

There is no test framework dependency; targeted checks run with plain Node
(plus `jsdom` for DOM-dependent modules):

```bash
npm install --no-save jsdom          # only needed for the DOM-based suites

# lint rules & fixers (pure functions — no jsdom needed)
node - <<'EOF'
const fs = require('fs'); global.window = {};
eval(fs.readFileSync('renderer/lib/lint.js', 'utf8'));
const L = global.window.LINT;
console.log(L.checkMarkdown('#Bad\n')[0]);            // -> missing-space problem
console.log(L.fixes['md-heading-space'].apply('#Bad')); // -> "# Bad"
EOF
```

The same eval-into-`window` pattern works for `ditaToHtml.js` and `deps.js`
under jsdom (`global.DOMParser = dom.window.DOMParser`). When you change
`lint.js`, `ditaToHtml.js`, or `deps.js`, run their checks; when you change
`main.js`/`preload.js`, at minimum do a boot smoke test:

```bash
# headless boot smoke (Linux; on Windows/macOS just run npm start)
xvfb-run -a npx electron . --no-sandbox --enable-logging=stderr
# then grep the output for "Uncaught" / "CONSOLE ... error"
```

## 8. Conventions and gotchas

- **Paths**: the renderer never uses Node's `path` directly — it uses the
  `P` alias exposed by preload (`window.api.path`). Href values written into
  documents are always forward-slash (`.split(P.sep).join('/')`).
- **Editor writes** go through `editor.value = …` (full-range
  `pushEditOperations`) or `insertAtCaret` so **everything stays undoable**.
  Never call `model.setValue()` — it destroys the undo stack.
- **`window.api` is frozen** by contextBridge; you cannot monkeypatch it
  (e.g. in tests). Design functions to accept injected parameters instead
  (see `exportWebHelp(forcedOutDir, opts)`).
- **DOM-based click handlers**: never assign a parameter-taking function
  directly (`el.onclick = fn`) — the MouseEvent becomes the first argument.
  Wrap it: `el.onclick = () => fn()`. (This exact bug shipped once — v1.7.)
- **IME safety**: any editor key handling must ignore composition events
  (`e.isComposing`) or Chinese/Japanese/Korean input breaks. Monaco handles
  this internally; custom document-level handlers must check it themselves.
- **Monaco under `file://`**: workers need the absolute-URL data-proxy set up
  in `index.html` (`MonacoEnvironment.getWorkerUrl`). Don't remove it.
- **Ignored directories** (`node_modules`, `.git`, `.autosave`, `temp`) are
  defined once in `IGNORED_DIRS` in `main.js`.
- **User-facing strings** live in `index.html`, the `MENUBAR` definitions,
  and toasts — there is no i18n layer yet; grep before renaming features.

## 9. Dependency inventory

Runtime: `marked` (Markdown), `monaco-editor` (editor). Everything else in
the app is hand-written. Dev/build: `electron`, `electron-builder`. The
packaged app bundles only `main.js`, `preload.js`, `renderer/**`,
`README.md`, `CHANGELOG.md`, and the two runtime deps (see the `files` array
in `package.json`) — keep that list updated when you add runtime files.

## 10. Suggested repo hygiene (if publishing)

```gitignore
node_modules/
release/
.autosave/
*.log
```

CI note: a GitHub Actions matrix of `windows-latest` (`npm run dist`) and
`macos-latest` (`npm run dist:mac`) covers all shipped artifacts, including
the macOS-only `.dmg` step.
