# DITA Studio 2.1 — User Guide

## Feature overview (current)

Authoring: DITA 1.3 + LwDITA + Markdown + MDX templates (incl. project
templates with placeholders) · Monaco editor with tabs, folding, multi-cursor
· **visual (WYSIWYG) editing mode** for DITA topics and Markdown/MDX ·
"/" insert menu, element & keyref completion · visual table builder ·
**math formulas (LaTeX/KaTeX) and a categorized symbol picker** · media
insertion (images, mp4/mp3, online embeds) · **AI writing assistant** (free
local models or keyed APIs) · first-class CJK authoring (font stacks,
IME-safe editing, full-width-character lint).
Structure: map/bookmap browser with drag-and-drop and 5-level nesting ·
tree-to-map drag · key space with keyref/conref resolution · DITAVAL
conditional filtering.
Quality: live validation with fix suggestions and auto-fix (MD/DITA/XML/HTML)
· dependency queries with backlinks · rename/move with reference rewrite ·
project search.
Publishing: styled HTML/PDF (7 style packs + custom CSS, page numbers, cover)
· responsive documentation site with TOC, refine-by search (Chinese included,
single-character queries work), PDF download, and a checkbox front-page
designer · DITA-OT integration · **knowledge-base sync & search against
Supabase or any PostgREST backend**.
Safety: configurable autosave (default 3 min) with snapshot diff/restore.

DITA Studio is a lightweight desktop workbench for authoring DITA 1.3,
Lightweight DITA (XDITA/MDITA), Markdown, and MDX. It gives you a project
tree, a Monaco-based code editor with tabs, a drag-and-drop map/bookmap
manager, live preview, built-in HTML/PDF publishing, optional DITA-OT
publishing, dependency queries, live validation, and timed local snapshots —
without Java, without a license fee, and with sub-second startup.

---

## 1. Installation

DITA Studio runs on **Windows and macOS**. Pick the build for your platform:

| File | Platform | What it is |
| --- | --- | --- |
| `DITA-Studio-Setup-<version>.exe` | Windows x64 | NSIS installer. Lets you choose the install directory and creates a desktop shortcut. |
| `DITA-Studio-Portable-<version>.exe` | Windows x64 | Single-file portable build. Run it from anywhere (USB stick, network share); no installation. |
| `DITA-Studio-<version>-macOS-arm64.zip` | macOS (Apple Silicon) | Unzip, then drag **DITA Studio.app** into `/Applications` (or run it from anywhere). |
| `DITA Studio-<version>.dmg` | macOS | Disk image with the usual drag-to-Applications window. Produced by running `npm run dist:mac` from the source on any Mac (the dmg format itself can only be packaged on macOS); arm64 and Intel x64 are both configured. |

### 1.1 "Windows protected your PC" (SmartScreen)

The executables are **not code-signed** (code-signing certificates are a paid
service; nothing about the warning indicates malware). Windows will therefore
show a blue SmartScreen dialog the first time you run a downloaded copy. Three
ways past it — any one is enough:

1. **On the dialog itself**: click the small **More info** link in the body
   text. A **Run anyway** button appears at the bottom; click it. (If you only
   see "Don't run", you haven't clicked More info yet.)
2. **Unblock the file once, permanently**: right-click the `.exe` →
   **Properties** → on the **General** tab, tick the **Unblock** checkbox at
   the bottom → **OK**. The checkbox exists because downloaded files carry a
   "Mark of the Web" flag; unblocking removes it, and the SmartScreen dialog
   never appears again for that file. PowerShell equivalent:
   `Unblock-File -Path "C:\path\to\DITA-Studio-Portable-2.1.0.exe"`
3. **Build it yourself**: run `npm install && npm run dist` from the source
   zip on your own machine. Locally built binaries carry no download flag.

### 1.2 "App can't be opened" on macOS (Gatekeeper)

The macOS build is likewise unsigned and not notarized, so the first launch of
a downloaded copy is blocked by Gatekeeper. Any one of these gets you in:

1. **Right-click (or Control-click) `DITA Studio.app` → Open**, then click
   **Open** in the dialog. macOS remembers the choice; from then on it opens
   normally. (A plain double-click only shows a dialog without an Open
   button — the right-click route is the one that offers it.)
2. On newer macOS versions where the Open button doesn't appear: **System
   Settings → Privacy & Security**, scroll to the message about DITA Studio
   being blocked, and click **Open Anyway**.
3. Terminal equivalent — remove the quarantine flag once:
   `xattr -dr com.apple.quarantine "/Applications/DITA Studio.app"`
4. Or build it yourself on your Mac (`npm run dist:mac`); locally built apps
   carry no quarantine flag.

### 1.3 Where settings live

Settings (editor preferences, style pack, AI provider keys, DITA-OT path) and
per-project state (root map, DITAVAL choice, open tabs, expanded folders) are
stored in the standard Electron user profile — `%APPDATA%\dita-studio` on
Windows, `~/Library/Application Support/dita-studio` on macOS. Note that this
applies to the **Windows portable build too** — moving the portable exe to
another machine does not carry your settings with it.

---

## 2. Quick start

1. Click **Open folder** and select your documentation project root (or just
   try the `sample-project/` folder shipped in the source zip).
2. Single-click any file in the tree to open it in a tab. The right pane shows
   a live preview as you type.
3. Open a `.ditamap` / `.bookmap` — the right pane switches to the **Map**
   view where you can drag rows to restructure it.
4. Press **Ctrl+P** anytime to fuzzy-search and open any project file.

On the next launch, DITA Studio reopens your last project and its tabs
automatically.

---

## 3. The workspace

```
┌ Toolbar: Open folder · New file · Save · Export HTML/PDF · DITA-OT ·
│          Dependencies · Versions · Set root map · DITAVAL · Settings
├──────────────┬──────────────────────────┬───────────────────────────┐
│ Project tree │ Editor (tabs, Monaco)    │ Preview / Map / Deps /    │
│              │                          │ Problems / Outline /      │
│              │ status bar: Ln, Col,     │ Search                    │
│              │ words, chars, type       │                           │
└──────────────┴──────────────────────────┴───────────────────────────┘
```

### 3.1 Editor

The editor is the Monaco engine (the same component that powers VS Code), so
the muscle memory transfers: multi-cursor with **Alt+Click**, **Ctrl+D** to
select the next occurrence, **Ctrl+F** find/replace with regex, code folding
on sections and elements, bracket/tag pair highlighting, and a minimap.
XML and Markdown syntax highlighting is picked automatically by file type.

Files open in **tabs**. A dot on the tab marks unsaved changes; middle-click
or the × closes a tab (you are asked whether to save). Each tab keeps its own
undo history, cursor, and scroll position.

Typing `>` after an opening tag auto-inserts the closing tag (toggle in
Settings). This is disabled during IME composition, so Chinese/Japanese/Korean
input is never interrupted.

Authoring helpers in the Edit menu (and the editor's right-click menu):
**Insert table…** opens a visual builder — sweep the grid with the mouse to
pick rows × columns (or type exact numbers), toggle the header row, and for
DITA choose simpletable or CALS output. **Insert image…**, **Insert
video/audio file…** (mp4, webm, mp3, wav and friends), and **Embed online
video/audio…** (paste a YouTube / Bilibili / Vimeo link — it converts to the
proper player embed) all generate the right markup for the current file type.
Local media plays in the preview and is copied into HTML and Doc Site output;
clicking an image, video, or audio file in the project tree previews it in
the right pane.

Content completion: type `/` at the start of a line for an insert menu of
common blocks (note, steps, simpletable, codeblock, xref, fig… — Markdown
files get their own set: code fence, table, link, front matter). Typing `<`
in a DITA file suggests element names, and inside `keyref="…"` the suggestions
come straight from your root map's key space. In Markdown/preview workflows,
the preview pane scrolls in step with the editor.

Validation problems appear as squiggly underlines in the text (red for
XML/HTML structure errors, yellow for style and link issues) — hover for the
message, or use the **Problems** pane for the clickable list. Checks cover
**Markdown** (trailing whitespace, hard tabs, heading level jumps, missing
space after `#`, unclosed code fences, runs of blank lines, broken links),
**DITA/XML** (well-formedness with tag-mismatch location, unescaped `&`,
missing root id, duplicate ids, untyped notes, images without `<alt>`,
broken href/conref/data targets with nearest-file suggestions, undefined
keys), and **HTML** files (tag structure, duplicate ids, images without alt).
Many problems come with a **Fix** button that applies a suggested repair, and
a **Fix all auto-fixable** button at the top of the pane applies every safe
repair at once — all fixes go through the undo stack, so Ctrl+Z reverts.

### 3.2 Right-pane views

- **Preview** — the published look, refreshed ~350 ms after you stop typing.
  DITA renders through a built-in DITA 1.3 transformer; `.md` renders as
  GitHub-flavored Markdown; `.mdx` renders its Markdown fully with JSX
  components shown as labeled placeholders. Previewing a map assembles every
  referenced local topic in navigation order. The ☾/☀ button toggles a
  light/dark preview theme.
- **Map** — structural view of the open map with drag-and-drop (see §5).
- **Deps** — what this file references, and what references it (see §8).
- **Problems** — the live validation list; click an entry to jump to it.
- **Outline** — DITA title hierarchy or Markdown headings; click to navigate.
- **Search** — project-wide find with DITA/Markdown scope and case toggle.

---

## 4. Creating files

**New file** (or **Ctrl+N**) opens a dialog where you pick a template, type a
file name and title, and choose the save location — the location field is
editable and has a **Browse…** button, so you decide where the file lives at
creation time.

Built-in templates (DITA 1.3 doctypes per the OASIS spec):
concept · task · reference · generic topic · glossentry · troubleshooting ·
API reference preset · **LwDITA XDITA topic** · **LwDITA MDITA topic** ·
map · bookmap · **DITAVAL filter** · Markdown · MDX · FAQ preset.

The DITAVAL template ships with commented examples of `exclude`, `include`,
and `flag` rules; once saved it appears in the toolbar's DITAVAL dropdown
(which turns amber while a filter is active). Include rules override broader
excludes, per the DITA conditional-processing rules.

If a map is open, tick **"Also add a reference to the open map"** and the new
topic is wired into that map in the same step.

**Project templates**: put any `.dita/.md/.mdx/.ditamap` file inside a
`.templates/` (or `templates/`) folder in your project and it appears in the
New file dialog under "Project templates". `${TITLE}` and `${ID}` placeholders
in the template body are substituted at creation.

---

## 5. Working with maps and bookmaps

### 5.1 Adding topics to a map

Three ways, pick whichever fits the moment:

1. **Drag in the tree** — drag a `.dita/.md/.mdx/.ditamap` file from the
   project tree and drop it **onto a map or bookmap node in the tree**. The
   file becomes included content of that map, even if the map isn't open.
2. **Drag into the Map pane** — with a map open, drag a file from the tree
   into the right-hand Map view. Drop on a row's **upper half** to place it
   before, **lower half** after, **center-right** to nest it as a child; drop
   on empty space to append at the root.
3. **Right-click** — right-click any content file → **Add to map…** (chooser
   listing every map in the project) or **Add to current map**.

Reference semantics are handled for you: dropping into a bookmap's top level
creates a `<chapter>`, maps become `<mapref>`, Markdown/MDITA gets
`format="markdown"`, MDX gets `format="mdx"`.

### 5.2 Restructuring and nesting

In the Map pane, drop zones are: the **top quarter** of a row places before
it, the **bottom quarter** after it, and the **middle** nests as a child. You
can build hierarchies this way — drop file 2 onto file 1, file 3 onto file 2,
and so on, up to **5 levels deep** (the limit is enforced with a message, and
applies to both new drops and re-nesting existing branches).
Right-click a row for **Open target**, **New child topic…** (creates a file
from a template *and* inserts its reference as a child — one step),
**Add child topicref…**, **Move up/down**, and **Remove from map**. Every
change is written back to the editor as cleanly indented XML, undoable with
Ctrl+Z.

### 5.3 Moving files

Dragging a file onto a **folder** node moves it there. Both moving and
renaming scan the project for inbound references and offer to rewrite them to
the new path (shown with a count before anything is touched).

---

## 6. Keys, conref, and conditional text

- **Root map / key space**: open your master map and click **Set root map**
  (or right-click it in the tree). Keys defined anywhere in that map,
  including nested `mapref`s, are collected — first definition wins, per DITA
  key precedence. From then on, `keyref`/`conkeyref` resolve in preview,
  export, and validation. The status bar shows the active root map and key
  count.
- **conref transclusion**: `conref` and `conkeyref` content is pulled into
  preview and published output (up to 3 levels deep). Unresolved references
  are flagged inline in orange.
- **DITAVAL filtering**: put a `.ditaval` file in the project and pick it in
  the toolbar dropdown. `exclude` rules on `audience` / `platform` /
  `product` / `props` / `otherprops` apply to both preview and export.

---

## 7. Publishing

- **Export HTML / Export PDF** — publishes the current topic, or an entire
  map/bookmap (all referenced local topics assembled in navigation order), to
  a styled standalone HTML file or an A4 PDF. No Java or DITA-OT required.
- **Style packs** — choose one of seven packs — Default, Docs portal, Ledger
  (fintech blue), Handbook (serif), Terminal (mono), Print/report, Compact —
  in Settings; the pack styles both the preview and exports. You can additionally
  point Settings at a **custom .css** which is appended after the pack — handy
  for matching your product's docs branding.
- **Doc Site** — the Doc Site toolbar button turns the current map/bookmap
  (or a single topic/Markdown file) into a responsive multi-page documentation
  site. Before generating you choose one of seven **style packs**, an optional **custom stylesheet** appended after the
  pack, whether to include a **downloadable PDF** of the whole publication
  (rendered in reading order, linked from a PDF button in every page header),
  and whether that PDF opens with a **cover page** (title + date). Every
  output format carries a table of contents: the site has the TOC sidebar,
  single-HTML map exports get a linked Contents box, and the publication PDF
  now opens with its own anchored Contents list; all PDFs carry page-number
  footers. A **Front page** section in the dialog lets you compose the site's
  index with checkboxes: title & tagline (editable), search box, "Start
  reading" button, section cards for top-level chapters (with topic counts),
  the full table of contents, and an optional footer line — your choices are
  remembered for the next publish.
  The site itself has: one page per topic, a collapsible hierarchical TOC
  mirroring the map structure with the current page highlighted, previous/next
  navigation, breadcrumbs, a light/dark theme toggle, a mobile layout with an
  off-canvas menu, and **search with refine-by filters** — as you type, the
  results panel offers Type (Task / Concept / Reference / Troubleshooting /
  Glossary / Article) and Section chips with live counts so you can narrow
  large result sets. Cross-topic `xref`s become page links, referenced images
  are copied into the site, and conref/keyref resolution and the active
  DITAVAL filter all apply. `keydef` and `processing-role="resource-only"`
  references never become pages, per DITA processing rules. The output is
  fully static — open `index.html` locally or host it anywhere.
- **DITA-OT** — for DTD-validated, spec-complete output, install
  [DITA Open Toolkit](https://www.dita-ot.org/) anywhere on disk, point
  Settings → "DITA-OT install folder" at it (the folder containing `bin/`),
  pick a transtype (html5, pdf, xhtml, markdown, or normalized dita), and use
  the **DITA-OT** toolbar button. You'll be asked for an output folder; the
  build log streams live and can be cancelled.

---

## 8. Dependencies, validation, and search

- **Dependencies** — one click indexes the project and shows, for the current
  file, every outgoing reference (`href`, `conref`, `conkeyref`, `keyref`,
  `mapref`, Markdown links and images, MDX imports — with missing-target
  flags) and every file that references it ("none — safe to move or rename"
  when clear). Click any entry to open it.
- **Problems** — live checks: XML well-formedness, duplicate IDs, broken
  href/conref targets, keys not defined in the root map, broken Markdown
  links. Squiggles in the editor mirror the list.
- **Search** (**Ctrl+Shift+F**) — project-wide text search, scoped to DITA or
  Markdown files if you like, case toggle, click-to-open at the matching line.

---

## 9. Autosave and versions

While files are open, a snapshot of every modified tab is written on the
autosave interval (default **3 minutes**, configurable in Settings) to
`<project>/.autosave/`. The newest 30 snapshots per file are kept.

**Versions** lists the snapshots for the current file with two actions:

- **Compare** — opens a side-by-side diff (snapshot ↔ current editor
  content) so you can see exactly what changed before doing anything.
- **Load** — replaces the editor content with the snapshot. This goes through
  the undo stack, so **Ctrl+Z** reverts it; press **Ctrl+S** to keep it.

Tip: add `.autosave/` to your `.gitignore`.

---

## 10. Keyboard shortcuts

On macOS, use **Cmd** wherever **Ctrl** is listed.

| Shortcut | Action |
| --- | --- |
| Ctrl+P | Quick open (fuzzy file search) |
| Ctrl+Shift+P | Command palette (every action, searchable) |
| Ctrl+K | Insert link — pick a file, get an `<xref>` or Markdown link |
| Ctrl+B | Toggle the project sidebar |
| Ctrl+N | New file |
| Ctrl+S | Save |
| Ctrl+W | Close tab |
| Ctrl+Shift+F | Find in files |
| Ctrl+F | Find/replace in the current file (Monaco) |
| Ctrl+D | Select next occurrence (Monaco) |
| Alt+Click | Add cursor (Monaco) |
| Ctrl+Z / Ctrl+Y | Undo / redo (per tab) |

---

## 11. New in 2.1

### 11.1 Visual (WYSIWYG) editing

Press **Ctrl+Shift+V** (or View → Visual editing mode) on any DITA/LwDITA
topic or Markdown/MDX file. You get a formatted, directly editable page with
a toolbar: bold/italic/underline, inline code, lists, section headings,
links, tables, images, math, and symbols. Press the **Source** button or
Ctrl+Shift+V again to return; your changes are serialized back into clean
source. Saving (Ctrl+S) while in visual mode serializes first, so nothing
is lost.

Blocks that cannot be safely round-tripped — content pulled in by
`conref`/`conkeyref`/`keyref`, equations, task steps, and any complex or
unknown element — appear as **locked chips (🔒)**. They are preserved
verbatim in the file and can be edited in source view. Maps and bookmaps
have no visual mode (use the Map browser instead). For MDX, JSX components
pass through untouched; glance at the source before committing.

### 11.2 Math formulas and symbols

* **Edit → Insert math formula…** takes LaTeX with a live preview. In
  Markdown it inserts `$inline$` or `$$block$$`; in DITA it inserts
  `<equation-inline>/<equation-block>` with a `<mathphrase>`. Formulas are
  rendered by KaTeX in the preview, HTML and PDF exports, and doc sites
  (fonts are copied into the site's `assets/katex/` automatically).
* **Edit → Insert symbol…** opens a categorized picker: Greek, math
  operators, arrows, sub/superscripts, units, currency, and CJK punctuation.

### 11.3 Knowledge base (Supabase / PostgREST)

**Tools → Knowledge base (Supabase)…** connects the current project to your
own backend, so published knowledge stays queryable outside the app. Create
the table once in the Supabase SQL editor:

```sql
create table documents (
  id text primary key, title text, format text,
  content text, updated_at timestamptz
);
```

Then paste your project URL and API key, **Test connection**, and **Sync
project to knowledge base** — every authoring file is upserted (id = its
project-relative path), so re-syncing updates rather than duplicates.
The search box queries titles and content (Chinese included); clicking a
result opens the local file. Any PostgREST-compatible endpoint works, not
just Supabase. The key is stored locally and unencrypted — prefer a
row-level-security anon key over a service-role key.

### 11.4 Chinese authoring

CJK font stacks are applied in the editor, preview, HTML/PDF exports, and
doc sites. Site search accepts single-character Chinese queries, and pages
get `lang="zh"` when the site title is Chinese. A dedicated lint rule
catches full-width quotes/equals typed inside XML tags by an IME (＂ ” ＝)
and fixes them with one click — body-text quotes are left alone.

## 12. Notes and caveats

- **Unsigned binaries**: see §1.1 (Windows SmartScreen) and §1.2 (macOS
  Gatekeeper). This is cosmetic, not a defect, but if you distribute the tool
  to a team, either have everyone unblock/approve once or build from source
  on a trusted machine.
- **Settings are per-machine** even for the portable build (§1.2).
- **The built-in DITA renderer is a pragmatic subset** of DITA 1.3 — the
  commonly used elements render faithfully; unknown elements fall through
  (children still render). It does not run DTD validation or Schematron. When
  you need strict, spec-complete output, publish through DITA-OT (§7).
- **MDX preview is presentational**: JSX components show as labeled
  placeholder boxes; the Markdown content renders fully. Real component
  rendering would require a bundler and React runtime.
- **Rename/move reference rewriting is string-based** (it replaces the old
  relative path text in referencing files). It is precise for normal projects,
  but review the change in Git before committing if your project has unusual
  path strings.
- **Key precedence** is "first definition wins" from the root map downward,
  matching the DITA spec. If a key resolves unexpectedly, check for an earlier
  definition.
- **`.autosave/` lives inside the project** so snapshots follow the project —
  exclude it from version control and from DITA-OT input if you point OT at
  the raw folder.
- **Preview images** resolve relative to the topic file; exported HTML embeds
  a `file://` base, so images display locally but won't travel with a single
  HTML file — publish through DITA-OT html5 when you need a portable site.

---

## 13. Running and building from source

```bash
npm install
npm start          # run in development
npm run dist       # build Windows installer + portable into release/
```

Cross-building the Windows targets from Linux requires wine (32- and 64-bit)
and an X display (xvfb works). Building on Windows itself needs nothing extra.

---

## 14. Version history

The full changelog also ships inside the app: **Help → What's new**. Current
release: **2.1** — visual (WYSIWYG) editing mode for DITA/LwDITA topics and
Markdown/MDX with protected round-trip of conref/keyref and complex
structures; LaTeX math (KaTeX) rendered in preview, HTML, PDF, and doc sites,
plus an Insert-symbol picker (Greek, math, arrows, sub/superscripts, units,
currency, CJK punctuation); knowledge-base sync & search to Supabase or any
PostgREST endpoint; Chinese authoring support (CJK font stacks in all
outputs, single-character Chinese search in doc sites, full-width-character
lint with one-click fix); faster cold start (window shown when ready,
deferred project restore) and general performance work (preview repaint
skipping, parallel site writes); fixed the AI provider selector that ignored
selection; licensing switched to Apache 2.0 with NOTICE and contact details.

- **2.0** — AI writing assistant (free local models via Ollama/LM Studio, or
  keyed APIs: Anthropic, OpenAI, DeepSeek, Moonshot Kimi, OpenRouter incl.
  its zero-cost ":free" models); in-app user guide & changelog viewer;
  smoothness pass (persistent tree expansion, cached project reads, ranked
  quick-open, dirty-save indicator); macOS build support (`npm run dist:mac`
  → .dmg + .zip).

- **1.9** — syntax checking with fix suggestions and one-click auto-fix for
  Markdown, DITA/XML, and HTML (per-problem Fix buttons plus Fix-all); visual
  table builder for Markdown and DITA (simpletable/CALS); image/video/audio
  preview from the project tree; local media insertion and online video
  embedding (YouTube/Bilibili/Vimeo) that plays in preview, HTML, and Doc
  Site output; anchored Contents in the publication PDF; checkbox-driven
  front-page designer for the documentation site.
- **1.8** — menu bar (File/Edit/View/Publish/Tools/Help) replaces the button
  row, with a DITAVAL submenu, recent-projects submenu, and shortcut hints;
  three new style packs (Ledger, Handbook, Terminal) across HTML, PDF, and
  site exports; PDF cover page option and page-number footers; linked Contents
  box in single-HTML map exports; active-filter chip in the status bar;
  keyboard-shortcut sheet in Help.
- **1.7** — Doc Site export upgrades: pre-publish options dialog with style
  pack and custom stylesheet selection, whole-publication PDF generation with
  a download button in the site header, search results refinable by Type and
  Section chips with live counts, and a fix for the export button passing its
  click event as the output path.
- **1.6** — responsive documentation-site export (multi-page site with TOC, search,
  prev/next, breadcrumbs, theming, mobile layout), easier map nesting (middle
  of a row = nest) with a 5-level depth limit, DITAVAL include-over-exclude
  fix carried into the site export, and a fix for the New file dialog's Cancel button
  being blocked by field validation.
- **1.5** — DITAVAL creation from New file (with include/exclude/flag examples;
  include now correctly overrides exclude), Notion-style `/` insert menu,
  DITA element and keyref completions, Ctrl+Shift+P command palette, Ctrl+K
  insert-link picker, Ctrl+B sidebar toggle, welcome screen with recent
  projects, backlinks count in the status bar, editor↔preview scroll sync,
  decluttered toolbar (status moved to the status bar), Reveal in File
  Explorer.
- **1.4** — Monaco editor core (syntax highlighting, multi-cursor, folding,
  find/replace, minimap), multi-tab editing with per-tab undo and session
  restore of open tabs, validation squiggles in the editor, side-by-side diff
  against autosave snapshots, Ctrl+W close tab, English user guide.
- **1.3** — tree-to-map drag (drop a topic on a map node to include it), drop
  on folder = move with reference rewrite, "Add to map…" chooser, "New child
  topic…" on map rows, file-first New dialog with Browse, Ctrl+P quick open,
  status bar, session restore of the last project.
- **1.2** — drag from tree into the Map pane, LwDITA (XDITA/MDITA) templates,
  right-click menus (tree/editor/map), DITA-OT integration, editor settings,
  style packs + custom CSS, project templates with placeholders.
- **1.1** — key space + keyref/conkeyref resolution, conref transclusion,
  Problems panel, rename-updates-references, find in files, outline, DITAVAL
  filtering, tag auto-close (IME-safe), preview light/dark theme.
- **1.0** — DITA 1.3 templates, project tree, map/bookmap browser with
  drag-and-drop ordering, live preview, HTML/PDF export, dependency queries,
  3-minute autosave with version history, NSIS installer + portable builds.

---

## 15. License and contact

DITA Studio is free software, released under the **Apache License 2.0** —
you may use, modify, and redistribute it, including commercially, provided
you keep the license text and the NOTICE attribution (see the `LICENSE` and
`NOTICE` files shipped with the app and in the repository).

* Author: **Han Fengyan (Galano Han)**
* Contact: **tengriih@gmail.com** — bug reports, feature requests, and
  collaboration are all welcome.
* Project home: <https://github.com/tengri-tianhan/ditastudio>

In-app: **Help → License & contact**.
