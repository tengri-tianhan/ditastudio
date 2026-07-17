# DITA Studio — Changelog

## 2.1.0 — 2026-07-17

### Added
- **Visual (WYSIWYG) editing mode** (Ctrl+Shift+V) for DITA/LwDITA topics and
  Markdown/MDX: formatted editable page with a formatting toolbar; clean
  round-trip serialization back to source. Content that cannot be safely
  round-tripped (conref/conkeyref/keyref, equations, complex elements) is
  preserved verbatim as locked chips and remains editable in source view.
- **Math formulas**: Edit → Insert math formula… (LaTeX, live preview).
  Rendered by KaTeX in preview, HTML export, PDF, and doc sites; KaTeX assets
  are copied into site exports automatically when math is present.
- **Symbol picker**: Edit → Insert symbol… with Greek, math, arrows,
  sub/superscripts, units, currency, and CJK punctuation categories.
- **Knowledge base**: Tools → Knowledge base (Supabase)… — test, sync
  (batched upsert keyed by project-relative path), and search (Chinese
  supported) against Supabase or any PostgREST endpoint; results open the
  local file.
- **Chinese support**: CJK font stacks in editor, preview, HTML/PDF, and doc
  sites; single-character Chinese queries in site search; lang="zh" on sites
  with Chinese titles; new lint rule fixing full-width quotes/equals inside
  XML tags (body text untouched).
- **License & contact**: Apache 2.0 LICENSE and NOTICE ship with the app;
  Help → License & contact; author contact tengriih@gmail.com.

### Fixed
- **AI provider selector ignored selection.** Root cause: leftover duplicate
  markup (a phantom AI pane, a phantom dialog, and a twin toolbar button)
  created duplicate element ids, so options and event handlers were bound to
  a hidden orphan element while the visible selector stayed inert. The
  duplicates were removed and the pane mode list normalized; switching
  providers now updates model, key field, and hint immediately.

### Performance
- Faster cold start: the window is created hidden and shown on ready-to-show
  (no white flash); restoring the last project is deferred until the window
  is idle. Measured renderer boot ~0.7 s in CI environment.
- Preview repaints are skipped when the content signature is unchanged.
- Doc-site export writes files in parallel batches.

## 2.0
- **AI writing assistant** (View → AI assistant): improve, fix grammar, translate (EN/中文), summarize to shortdesc, continue writing, or run any custom instruction on the selection or whole document — output is reviewed first, then inserted or replaced (undoable). Providers: **free local models** via Ollama or LM Studio (no account, fully private), and keyed APIs — Anthropic Claude, OpenAI, DeepSeek, Moonshot Kimi, and OpenRouter (which includes zero-cost ":free" models) — each with a "Get key" link to its console, editable model name, and locally stored key.
- **Help menu** now opens the full **User guide** and **What's new (changelog)** inside the app.
- **Smoothness pass**: the project tree remembers which folders are expanded (per project) and no longer collapses when you switch tabs; project-wide reads (search, dependency index) are cached for 15 s; quick-open results are ranked (filename prefix > filename substring > path match, shallower paths first); the Save button shows a dot when there are unsaved changes; validation no longer rebuilds the file list per broken link.
- **macOS builds**: `npm run dist:mac` produces a .dmg (+ .zip) on a Mac; mac build configuration ships in the repo.

## 1.9
- Syntax checking with fix suggestions and one-click auto-fix for Markdown, DITA/XML, and HTML (per-problem Fix buttons plus Fix-all; all fixes undoable).
- Visual table builder (mouse-sweep grid) for Markdown and DITA (simpletable/CALS).
- Image/video/audio preview from the project tree; local media insertion; online video embedding (YouTube/Bilibili/Vimeo) playing in preview, HTML, and Doc Site output.
- Anchored Contents in the publication PDF; checkbox-driven front-page designer for the documentation site.

## 1.8
- Menu bar (File/Edit/View/Publish/Tools/Help) replaces the button row, with DITAVAL and recent-project submenus and shortcut hints.
- Three new style packs (Ledger, Handbook, Terminal) across HTML, PDF, and site exports; PDF cover page option and page-number footers; linked Contents box in single-HTML map exports; active-filter chip in the status bar; keyboard-shortcut sheet.

## 1.7
- Doc Site pre-publish options: style pack + custom stylesheet selection; whole-publication PDF with a download button in the site header; search results refinable by Type and Section chips with live counts; fixed the export button passing its click event as the output path.

## 1.6
- Responsive documentation-site export: one page per topic, hierarchical TOC, client-side search, prev/next, breadcrumbs, light/dark theme, mobile off-canvas menu; conref/keyref/DITAVAL applied; keydef and resource-only refs excluded.
- Easier map nesting (middle of a row = nest) with a 5-level depth limit; DITAVAL include-over-exclude; fixed New file dialog Cancel being blocked by validation.

## 1.5
- DITAVAL creation from New file (include/exclude/flag examples); Notion-style "/" insert menu; DITA element and keyref completions; Ctrl+Shift+P command palette; Ctrl+K insert-link picker; Ctrl+B sidebar toggle; welcome screen with recent projects; backlinks count; editor↔preview scroll sync; decluttered toolbar.

## 1.4
- Monaco editor core (highlighting, multi-cursor, folding, find/replace, minimap); multi-tab editing with per-tab undo and session restore; validation squiggles; side-by-side diff against autosave snapshots; Ctrl+W; English user guide.

## 1.3
- Tree-to-map drag (drop a topic on a map node to include it); drop on folder = move with reference rewrite; "Add to map…" chooser; "New child topic…" on map rows; file-first New dialog with Browse; Ctrl+P quick open; status bar; last-project restore.

## 1.2
- Drag from tree into the Map pane; LwDITA (XDITA/MDITA) templates; right-click menus (tree/editor/map); DITA-OT integration; editor settings; style packs + custom CSS; project templates with placeholders.

## 1.1
- Key space + keyref/conkeyref resolution; conref transclusion; Problems panel; rename-updates-references; find in files; outline; DITAVAL filtering; IME-safe tag auto-close; preview light/dark theme.

## 1.0
- DITA 1.3 templates; project tree; map/bookmap browser with drag-and-drop ordering; live preview; HTML/PDF export; dependency queries; 3-minute autosave with version history; NSIS installer + portable builds.
