# Extended Properties — feature roadmap and forward architecture

Original assessment as of v2.10.4; **status updated as of v2.28.0** (see the Status section immediately below). Each feature below is structured as: **What** (the feature), **Considerations** (design decisions and why), **Challenges** (what will bite), **Touchpoints** (files/modules to modify or create), and **Steps** (a discrete implementation path). A suggested milestone sequencing closes the document.

The codebase's assets to protect throughout: the registry system (`src/core/registry.ts`) that decouples value types, entry kinds, cluster addons, derivations, templates and presets from the shell; the generic influence engine (`src/core/influences.ts`); feature modules that self-register and self-migrate; and the pure-function split (`src/utils/*`, most of `src/core/*`) that keeps Obsidian out of the math.

---

## Status (v2.48.0)

Legend: ✅ done · ◑ partial · ○ planned.

### Completed

- ✅ **A1 — Expression engine.** Derivations, the `formula` type and influences evaluate through `core/expr.ts`; references by name/short form, a function library, explicit cycle detection.
- ✅ **A2 — Full dice notation + roll AST** (`utils/dice-expr.ts`): keep/drop, explode, reroll, success counting and property references; one AST behind both the roller chips and free-text.
- ✅ **A3 — Saved roll macros.** Settings-stored, listed on the roll menu and registered as commands.
- ✅ **A4 — Persistent roll history.** Plugin-level `HistoryService`, tail panel, current-note filter, Markdown export.
- ✅ **B1 — Inline rolls & properties.** `roll:` / `prop:` / `val:` / `vals:` and the `ep-sheet` block, in **both reading mode and Live Preview**. (`val:` is a chip; `vals:` renders the full sidebar value-type card with a right-click *Configure* menu.)
- ✅ **C3 — Richer value types.** `rating`, `link`, `unit`, `datetime`, plus `today()`/`days()` expression functions and unit/date stripping for references.
- ✅ **F1 — Test harness.** Vitest over the pure modules + a golden settings-migration fixture.
- ✅ **B2 — Cross-note references & aggregation.** `[[Note]].Prop` / `[[Note]].prop.s`, `this.Prop`, `prop("LinkProp", "Key")`, and `sum`/`avg`/`count`/`min`/`max("Type", "Key")` aggregates in expressions — via a `PropertyIndex`-backed vault accessor threaded into the engine, with a settings kill-switch. (Aggregates are an expression feature; dice notation still takes single references. Cross-note reads use raw values, so no cross-note cycles; lazy index invalidation remains a future perf optimisation.)
- ✅ **E2 — Mobile refinements.** Long-press → context menu on chips, `vals:` cards, entry rows and roll buttons; bottom-sheet option/colour modals on mobile; font-relative squeeze slack.
- ✅ **C1 — Validation & constraints.** Pure `core/validate.ts` (required, numeric range, regex pattern, allowed values; list element-wise) with tests; per-entry constraint editors in entry options; non-blocking invalid styling on values; optional clamp-on-commit for numbers.
- ✅ **D1 — Export / import of types & sections.** Pure `core/transfer.ts` — a versioned snippet (`schema` + plugin stamp) carrying the layout/section plus a dependency manifest of only the derivation blocks it references, with id-remap on import and a reference audit — round-trip tested. *Export* on each type (settings) and *Export section…* on the section menu copy a shareable JSON snippet to the clipboard; an import dialog pastes (or auto-reads the clipboard), lists missing derivation building blocks, offers to create them, and appends the section(s) to a chosen type with freshly-generated ids (collision-free).
- ✅ **F3 — CI, repo & release.** CI (typecheck → test → build), a tag-triggered draft-release workflow, one-command versioning (`npm version` → `version-bump.mjs` syncs manifest/versions), `LICENSE`, `.gitignore`, README/install pass, a clean innerHTML/console audit, and a `RELEASING.md` runbook with the ready-to-paste `community-plugins.json` entry + review checklist. The repo URL is set (`electroluminescent/obsidian-extended-properties`) in `manifest.json` `authorUrl` and the submission entry. *Operational remainder (run by the maintainer, scripted in `RELEASING.md`):* push the repo public, run a BRAT beta round, open the `obsidian-releases` PR.
- ✅ **C2 — Conditional visibility.** `showWhen` on entries and sections — a boolean expression over the note's values (`Class == "Wizard"`, `Level >= 5`, with `&&`/`||`/`!`). The shared expression engine is now string-aware (case-insensitive equality, string/number truthiness) with a tested `evalCondition` entry point; entries/sections are hidden outside edit mode and shown dimmed inside it (so the condition stays reachable), and the view's empty-signature now folds in condition outcomes so a value that flips a condition re-renders precisely. Condition inputs with live parse feedback live in the entry and section options.
- ✅ **B3 — Type table view.** A workspace view (`src/ui/table-view.ts`; "Open type table" command + ribbon) listing every note of a chosen type as rows with chosen properties as columns: type picker, column pick-list, text filter, click-to-sort headers (asc → desc → none), and drag-to-resize, persisted column widths. Rows click through to the note; cells render a compact, type-aware widget (checkbox, rating pips, colour swatch, internal link, image thumbnail, right-aligned numbers, list chips) and edit in place on double-click via `processFrontMatter`; rollable columns get a die button that rolls the cell value through the plugin roll service. Rows virtualize above 150 so a type with thousands of notes stays responsive. Column sets, sort and widths persist per type in `settings.tableLayouts`.
- ✅ **D4 — Write batching & conflict handling.** Frontmatter writes are coalesced per file and debounced (~300ms, with a 1s max-wait so a held slider drag still flushes), replacing the per-`set` burst writes; the queue flushes on note-switch and view close. An mtime conflict guard snapshots the file's modification time when a batch begins and, if the note changed on disk (sync, another pane) before the write lands, shows a sticky *Keep mine / Take theirs* notice instead of clobbering — on both the view path (`NoteModel`) and the inline path (`NoteFacade`), each with echo-suppression so our own writes never self-trigger. Setting: *Guard against edit conflicts* (on by default). (Also fixed in passing: `tableLayouts`/`tableLastType` are now preserved by `normalizeSettings`, so B3 column choices persist across restarts.)
- ✅ **D3 — Versioned migration table + backups.** `settings.schemaVersion` plus an ordered, idempotent migration runner (`runSchemaMigrations`, pure and unit-tested) that runs each step at most once and stamps the version; `normalizeSettings` still handles legacy shape-coercion ahead of it. Before persisting any upgrade the pre-migration `data.json` is snapshotted to `…/plugins/extended-properties/backups/` (last 5 kept) — cheap insurance on the plugin's most dangerous path; a fresh vault is stamped without a backup. The existing per-module `migrate()` hooks still run inside the same gated pass (converting each into a registered version step is an incremental follow-up).
- ✅ **F2 — Performance hardening.** The sidebar's width-responsive pass (which hides type hints → dice tags → chains → toggles → modifier badges as rows tighten) now (1) early-exits any section whose signature — width, laid-out row count, edit mode — is unchanged since the last pass, so resize storms, collapse animations and value-refresh echoes stop re-measuring stable sections; and (2) measures **tier-major** (read which rows are tight, then squeeze that tier on all of them) so forced reflows drop from O(rows × tiers) to O(tiers). Squeezing is row-local, so the batched reads give identical results; the cache is dropped on render and value refresh so it can't go stale. Row virtualization (step 3) was judged unnecessary — B3's table covers large tabular data and per-section sheets stay bounded.
- ✅ **E3 — Theming surface.** Plugin surfaces read their colours and sizes from `--ep-*` variables that fall back to the current Obsidian theme value, so themes and the Style Settings plugin can restyle Extended Properties without `!important`. A bundled Style Settings panel (`/* @settings */` in `styles.css`) exposes section accent, rating colour, chip background, section background, corner radius, section gap and a *Flat sections* toggle; the full variable set (sections, chips, ratings, typography) is documented in the README. Every token is wired as `var(--ep-x, <current value>)`, so an untouched theme renders identically.
- ✅ **F4 — i18n as data.** Every UI dictionary is now a JSON data file — `src/i18n/locales/en.json` (core, 488 keys) and `src/features/<mod>/strings.json` (per module, 139 keys) — loaded through thin typed `.ts` shims, so strings can be diffed and translated without touching code. A `scripts/i18n-check.mjs` parity checker (run in CI and via `npm run i18n`) validates the English schema (balanced `{placeholder}` tokens, no stray braces) and diffs any added `<code>.json` locale against it: missing keys, unknown keys, placeholder drift. `CONTRIBUTING.md` documents the add-a-language workflow. (Also finished the German removal: the feature modules still registered a partial `de` dictionary — those registrations and the dead German feature strings are gone, shrinking the bundle.)

Also shipped: subtle Web Audio sound effects (clicks, dice rolls, crit/fail), with a master toggle, volume and per-category (UI / dice / crit) toggles; a configurable roll-animation duration with staggered dice/modifiers; a custom scroll-safe slider; and a default d20 for `roll:` with no dice term.

### Deprecations

- **German locale (`de`) — removed in v2.41.0.** The plugin is now English-only. The German dictionary (`src/i18n/locales/de.ts`) and its registration in `main.ts` are gone; any vault still set to `language: "de"` resolves entirely through the English fallback (override → active locale → **English** → humanized key), so nothing breaks. The locale *mechanism* — the `register` API and the per-string override editor — is deliberately kept intact, so a community-maintained dictionary can be slotted back in under F4 (“i18n as data”). *Rationale:* a single maintainer can't keep a second hand-written dictionary in sync with a fast-moving English reference; the override system already lets any user retranslate any individual string. Phases delivered: freeze + picker label (v2.40.0) → core dictionary removed (v2.41.0) → feature-module `de` registrations removed (v2.48.0, alongside F4).

### Planned

- ○ **D2** Layouts as vault files
- ○ **E1** Keyboard & screen-reader support
- ○ **F5** Public module API + legacy deprecation

### Shipped beyond the original plan

Per-property unique short forms with name↔short-form interchangeability and autocomplete; the dotted modifier suffix (`INT.s`, `[[Note]].intelligence.s`, configurable); the inline `vals:` card that reuses the sidebar value-type renderers with a per-reference options store; and `[[`-triggered note autocomplete in text/list value inputs (sidebar text edits, inline `val:`/`vals:`, the list value pickers and table cells) that inserts `[[Note]]` links.

### Milestone sequencing — progress

- **Milestone 1 — Foundations:** ✅ (F1, D3, D4 ✅)
- **Milestone 2 — Expressions:** ✅ (A1, C1, C2 ✅)
- **Milestone 3 — Rolling depth:** ✅ (A2, A3, A4)
- **Milestone 4 — Notes integration:** ✅ (B1 incl. Live Preview, E2)
- **Milestone 5 — Scale:** ✅ (B2, B3, F2 ✅)
- **Milestone 6 — Ecosystem:** ◑ (C3, D1, F3, E3, F4 ✅; D2, F5 ○) · German locale removed (English-only; see Deprecations)

---

## A. Engine

### A1. Expression engine for derivations

**What.** Replace single-input derivation building blocks and flat influence sums with real expressions: `floor((STR + DEX) / 2) + max(PB, 2)`, usable anywhere a derivation or formula appears today.

**Considerations.** One engine should serve derived properties, the existing `formula` value type (`src/utils/formula.ts`), future conditional visibility (E2), and future validation messages — write it once, generically. References should resolve by property name and by short form (via `abbrFor`). Existing `mode`/`formula` influences must compile onto the engine so no user data breaks; keep the old fields working for one major version. The engine must be a pure module with zero Obsidian imports so it is trivially unit-testable.

**Challenges.** Cycle handling: today a depth cap silently truncates; an expression graph needs explicit cycle detection with a visible per-entry error badge, keeping the depth cap only as a backstop. Name resolution ambiguity (alias vs key vs abbreviation, case sensitivity, properties with spaces — needs a quoting syntax like `[Skill Proficiencies]`). Precision rules (when to floor, integer vs decimal display) must be explicit, not incidental. Error UX: a typo in a formula must degrade to "—" with a tooltip, never break the render pass.

**Touchpoints.** New `src/core/expr.ts` (tokenizer, Pratt parser, AST, evaluator, dependency extractor). Modify `src/core/influences.ts` (evaluate influences through the engine; expose dependency lists), `src/core/model.ts` (Influence gains `expr?: string`), `src/utils/formula.ts` (delegate to the engine), `src/ui/settings-tab.ts` (derivation editor becomes an expression editor with live validation), `src/ui/render/modifier-addon.ts` (denotation text for expression terms), feature `migrate()` in `src/features/rolling/index.ts` and `src/features/dnd5e/index.ts`, locales.

**Steps.**
1. Build `expr.ts` standalone: tokens, parser, evaluator over a `(name) => number | undefined` resolver, function library (floor, ceil, round, min, max, clamp, abs, if), and `deps(ast)`.
2. Add unit tests for the parser/evaluator (see H1) before wiring anything.
3. Add a per-note evaluation context in `influences.ts`: build the dependency graph for the layout once per render, topologically sort, memoize values, mark cycles.
4. Add `expr` to `Influence`; when present it wins over `mode`/`formula`; denotation renders the expression's short-form text.
5. Extend the settings derivation editor and the per-entry modifier editor with an expression field plus inline parse-error display.
6. Write the migration that rewrites stock `mode` values into equivalent expressions; keep reading legacy fields for one major version.
7. Surface cycle errors as a badge on the affected entry; remove reliance on `modDepth` except as backstop.

### A2. Full dice notation and a roll AST

**What.** One textual/structural representation for any roll: `2d6kh1 + 1d8 + DEX + 3`, with keep/drop (`kh`/`kl`/`dh`/`dl`), exploding dice (`!`), reroll-below (`r1`), success counting (`>=5`), and property references.

**Considerations.** The roller widget (`roller.ts`) already builds chains structurally; power users will type them — both should produce the same AST. Advantage/disadvantage becomes sugar for "+1 die, drop highest/lowest", which v2.10 already implements mechanically in `roll-service.ts`; unifying removes a special case. Property references inside dice expressions reuse A1's resolver. The animation already supports labeled parts and dropped dice; it generalizes to one dice row per dice term.

**Challenges.** The animation's visual cap (MAX_DICE_SHOWN) and sequential settling need to scale across multiple dice groups without taking forever — settle groups in parallel, dice within a group sequentially. The roll log format must stay readable for complex rolls. Keep/drop semantics interact with crit/fail tone detection (tone should evaluate over kept dice of the primary group only — current behavior, but it must be specified). Backward compatibility: persisted `dice: "2d6"` strings must parse as a trivial AST.

**Touchpoints.** New `src/utils/dice-expr.ts` (parser → RollAst; evaluator → RollResult with per-group faces, kept/dropped indices, parts). Modify `src/features/rolling/roll-service.ts` (accept RollAst; keep the simple-spec overload), `src/features/rolling/dice-anim.ts` (render N groups), `src/features/rolling/roller.ts` (chips ⇄ AST, plus a free-text input that round-trips), `src/features/rolling/numeric-addon.ts` and `skills-type.ts` (unchanged call sites via the overload), `src/utils/dice.ts` (becomes the leaf layer), `src/ui/settings-tab.ts` (crit rules, step 7), locales.

**Steps.**
1. Implement `dice-expr.ts` with tests: parse, evaluate with injectable RNG, serialize back to canonical text.
2. Add `RollService.rollAst(label, ast, opts)`; reimplement `roll()` as a wrapper building a trivial AST; map adv/dis onto keep/drop nodes.
3. Generalize `dice-anim.ts`: job carries groups `{spec, faces, dropped[]}`; chain renders group by group; dropped dice reuse the existing dim/strike styling.
4. Extend the roller widget: chips edit AST nodes; add a text field that parses on Enter and rebuilds chips; invalid input keeps the old AST and shows the error.
5. Migrate per-entry `dice` strings lazily (parse on read; no data rewrite needed).
6. Update log/`Notice` formatting for multi-group results.
7. Add configurable crit rules (crit range per die size, fail rule) in settings; tone evaluation reads them.

### A3. Saved roll macros

**What.** Named, reusable rolls ("Greatsword +5", "Stealth with guidance") available from the roller widget, the right-click roll menu, and the command palette.

**Considerations.** A macro is just a label + RollAst (+ optional note-type scope). Storing them in settings makes them vault-global; per-type scoping covers character-specific macros. Exposing each macro as an Obsidian command enables hotkeys.

**Challenges.** Property references inside a macro need a note context — rolling from the palette must resolve against the active note and fail gracefully if a reference is missing. Command registration must update when macros change (re-register on settings save).

**Touchpoints.** `src/core/model.ts` (settings.macros), `src/ui/settings-tab.ts` (macro list editor), `src/features/rolling/dice-ui.ts` (roll menu section listing macros), `src/features/rolling/roller.ts` ("save as macro" button), `src/main.ts` (dynamic commands), locales.

**Steps.**
1. Add `macros: {id, name, expr, typeKey?}[]` to settings with normalize/migrate defaults.
2. Roller gains "Save as macro" (prompts for a name, serializes the current AST).
3. Settings tab gains a macros section (rename, edit expression with validation, delete).
4. Roll menu (`openRollMenu`) lists applicable macros above the mode chips.
5. Register one command per macro on load and on settings change; commands resolve against the active note via NoteModel.

### A4. Persistent roll history

**What.** Replace the per-view, six-entry, note-scoped log with a durable history: timestamp, note, label, expression, faces, total, mode; the panel shows the tail; a command exports a session to a note.

**Considerations.** History belongs to the plugin, not the view — move ownership from the per-view ServiceHub to a plugin-level service the views subscribe to; the existing `RollService` keeps its per-view mode but delegates record-keeping. Cap stored entries (e.g. 500, configurable) and prune FIFO. Storage in `data.json` is simplest; a vault markdown log ("Rolls.md" append) is a user-visible alternative worth offering as an option (ties into D2).

**Challenges.** Settings writes on every roll would thrash sync — batch/debounce history persistence (flush on interval and on unload). Multi-window vaults (desktop popouts) share the plugin instance, which actually simplifies this — but guard against double-subscription leaks in `rolls-panel.ts` (the self-cleaning subscription pattern already exists).

**Touchpoints.** New `src/features/rolling/history.ts` (HistoryService owned by the plugin). Modify `src/main.ts` (instantiate, flush on unload, export command), `src/features/rolling/roll-service.ts` (commit() appends to history), `src/features/rolling/rolls-panel.ts` (render from history, "clear" button, filter to current note toggle), `src/core/model.ts` (settings.rollHistory, settings.rollHistoryLimit), locales.

**Steps.**
1. Create HistoryService: append, query (by note/limit), prune, debounced persist, subscribe.
2. Wire `commit()` in roll-service to append a full record (AST text included).
3. Rework rolls-panel: tail render, current-note filter toggle, clear-history action.
4. Add "Export roll history to note" command (markdown table).
5. Settings: history limit slider, on/off toggle (off = legacy in-memory behavior).

---

## B. Notes integration

### B1. Inline rolls and properties in note bodies

**What.** Reading-mode rendering of `` `roll: 2d6+DEX` `` as a clickable roll chip and `` `prop: Strength` `` as a live, optionally editable value — the sidebar's engine projected into the note.

**Considerations.** This is the single highest-leverage missing feature; it is the path to statblocks-in-notes. Implementation should be thin adapters over existing pieces: NoteModel for values, RollService/A2 for rolls, the dice icons for chips. Use one inline post-processor (backtick spans with a prefix) plus one code-block processor (`ep-sheet`) that can render a whole section inline later. Live Preview support requires a CM6 ViewPlugin — defer it; reading mode first.

**Challenges.** Post-processors run per block and re-run often: renderers must be cheap and must not leak subscriptions (use the element's disconnect as teardown). The note context comes from the processor's `ctx.sourcePath`, not the active view — values must resolve against that file. Editable inline props writing frontmatter must reuse NoteModel's debounced write path to avoid conflicts. Roll chips in notes need the plugin-level history/animation (A4) since there may be no sidebar view open.

**Touchpoints.** New `src/features/inline/index.ts` (+ `inline-render.ts`). Modify `src/main.ts` (register processors, feature module entry), `src/core/note-model.ts` (a lightweight read/write facade keyed by file path), `src/features/rolling/roll-service.ts` (callable without a view), locales, `styles.css`.

**Steps.**
1. Extract a `NoteFacade` from NoteModel: `get(file, key)`, `set(file, key, value)` with the existing debounce/processFrontMatter path.
2. Implement the inline post-processor for `prop:` (read-only first) and `roll:`.
3. Route inline rolls through a plugin-level RollService instance (mode = normal unless suffixed, e.g. `roll(adv):`).
4. Add click-to-edit for inline props (reuse `inline-edit.ts` components).
5. Add the `ep-sheet` code block rendering a named section for the current note via the section renderer.
6. (Later) CM6 ViewPlugin for Live Preview parity.

### B2. Cross-note references and aggregation

**What.** Influences and formulas that read other notes: a `note` qualifier on a source ("Mount.Speed"), and aggregate functions over all notes of a type (`sum(type:"Party member", "HP")`).

**Considerations.** `src/core/property-index.ts` already exists as the place for vault-wide property knowledge — extend it rather than adding a second index. Build lazily: only index types/keys actually referenced by some layout. Link-typed properties (C3) provide the natural join: "the note linked in my `Mount` property".

**Challenges.** Invalidation: metadataCache events fire per file; the index must map file → dependents cheaply or renders will cascade. Circularity now spans notes — the cycle detection from A1 needs note-qualified node ids. Unresolved references (note renamed/deleted) must degrade visibly but harmlessly. Performance on large vaults demands the lazy build plus event-driven incremental updates, never full rescans on change.

**Touchpoints.** `src/core/property-index.ts` (typed index, subscriptions, incremental updates), `src/core/expr.ts` (note-qualified references, aggregate functions), `src/core/influences.ts` (resolver passes through the index), `src/core/note-model.ts` (resolve link properties to files), `src/main.ts` (index lifecycle), settings-tab (an "advanced" toggle to disable cross-note features wholesale).

**Steps.**
1. Extend property-index: `valuesByType(typeKey, propKey)`, `valueOf(path, propKey)`, change events, lazy activation per (type, key).
2. Add `[[Note]].Prop`, `this.Prop`, and `prop("Mount").Prop` reference forms plus `sum/avg/count/min/max(type, key)` to the expression grammar.
3. Thread a vault resolver into the evaluation context; sidebar re-renders subscribe to index changes for the keys they use.
4. Extend cycle detection with note-qualified ids; cap cross-note depth separately.
5. Document the performance model in README; add the kill-switch toggle.

### B3. Type table view

> ✅ **Implemented in v2.42.0** (`src/ui/table-view.ts`). All five steps below are done — read-only projection, sort + filter, inline editing, in-cell roll buttons, and persisted per-type layouts with column-width drag — plus compact type-aware cells and row virtualization. The "compact mode flag" was realised as dedicated compact cell widgets in the table rather than threading a flag through every sidebar renderer (which would have required a per-file `ViewCtx`/`NoteModel` for every cell).

**What.** A workspace view listing every note of a chosen type as rows with chosen properties as columns — sortable, with inline editing and roll buttons.

**Considerations.** Reuses B2's index for data and the value-type renderers for cells; it is a projection, not a new data system. Column set = a stored "table layout" per type (reuse Section/Entry structures in transposed form to inherit options handling).

**Challenges.** Virtualization for hundreds of rows; cell renderers were written for the sidebar's width assumptions — they need a compact mode flag; editing writes to many different files (route through NoteFacade with per-file debounce).

**Touchpoints.** New `src/ui/table-view.ts` + `src/ui/render/table-renderer.ts`. Modify `src/main.ts` (view registration, "Open type table" command), `src/core/model.ts` (settings.tableLayouts), value-type renderers (compact flag), locales, `styles.css`.

**Steps.**
1. Read-only MVP: pick type, pick columns, render from the index, click row opens note.
2. Sorting and a text filter.
3. Inline editing via NoteFacade.
4. Roll buttons in cells (plugin-level RollService).
5. Persist per-type table layouts; add column width drag.

---

## C. Property model

### C1. Validation and constraints

**What.** Optional per-entry constraints — numeric range (enforced, not just slider bounds), regex/allowed values for text, required flags — with non-blocking inline error styling.

**Considerations.** Constraints belong on the layout entry (they are per-sheet policy, not per-note data). Enforcement should warn by default and clamp only when the user opts in, because frontmatter is shared with other tools.

**Challenges.** List properties and multi-value types need element-wise validation; the mixed-value multi-edit path (`section-options.ts` proxy diff) must treat constraint fields like any other shared option; errors must not block saving the note (Obsidian users expect frontmatter to be freeform).

**Touchpoints.** `src/core/model.ts` (EntryBase.constraints), new `src/core/validate.ts` (pure checks), `src/ui/components/inline-edit.ts` and `src/ui/render/value-types/*` (error state rendering), `src/ui/modals/entry-options.ts` (constraint editors per datatype), locales, `styles.css`.

**Steps.**
1. Define the constraint schema and pure validators with tests.
2. Render invalid state (border + tooltip) in the numeric and text editors.
3. Constraint editors in entry options, shown per resolved datatype.
4. Optional clamp-on-commit toggle per entry.
5. Surface a per-section count of invalid values in edit mode.

### C2. Conditional visibility

**What.** Show/hide entries and sections from an expression over the note's values: "show Spell Slots when Class is Wizard"; replaces blunt `hideIfEmpty` for advanced cases.

**Considerations.** `src/core/hide-service.ts` already centralizes hiding — extend it to consult an expression. Use A1's engine with boolean operators; string equality needs adding to the grammar (`Class == "Wizard"`).

**Challenges.** Visibility changes alter layout → must integrate with the existing emptySig/re-render decision in `view.ts` so toggling a value re-renders when visibility flips but only then. Edit mode must always show everything (dimmed), or users cannot reach the entry to fix its condition.

**Touchpoints.** `src/core/expr.ts` (comparisons, boolean ops, string literals), `src/core/hide-service.ts`, `src/core/model.ts` (EntryBase.showWhen, Section.showWhen), `src/ui/view.ts` (signature includes visibility results), `src/ui/modals/entry-options.ts` and `section-options.ts` (condition field with validation), locales.

**Steps.**
1. Extend the grammar with comparisons/boolean ops and string literals; tests.
2. hide-service evaluates `showWhen` against the note; edit mode bypasses with dimming.
3. Include visibility outcomes in the render signature to trigger re-renders precisely.
4. Options UI: condition input with parse feedback and a "preview against current note" hint.

### C3. Richer value types: units, duration/date, link, rating

**What.** A unit-aware number (store canonical, display converted: kg/lb, gp/sp), a duration/date type with simple math (days until), a first-class link type (renders as internal link, drives B2 joins), and a rating type (stars/pips) as a cheap win.

**Considerations.** Each is just a ValueTypeDef registration — the architecture needs no change, which is the point of the registries. Units should be a user-editable conversion table in settings (building-block philosophy), not a hard-coded list.

**Challenges.** Unit storage format in frontmatter (number + unit suffix string vs canonical number) affects interop with other plugins — store what the user typed, normalize for math. Date math must respect locale formats; lean on `Intl` and ISO storage. Link type must handle renames (metadataCache resolved links) without writing to the note.

**Touchpoints.** New files under `src/ui/render/value-types/` (units.ts, datetime.ts, link.ts, rating.ts), registered in `value-types/index.ts`. `src/core/model.ts` (per-entry unit config), `src/ui/settings-tab.ts` (conversion tables), `src/core/expr.ts` (unit-stripping for references), locales.

**Steps.**
1. Rating type (smallest, validates the pattern end-to-end).
2. Link type with suggester, click-through, and unresolved styling.
3. Unit type: settings conversion table, entry option for display unit, expression integration.
4. Duration/date type with `today()`/`days(a,b)` expression functions.

---

## D. Persistence, portability, safety

### D1. Export/import of types, sections, templates

> ✅ **Implemented in v2.40.0.** `core/transfer.ts` (pure, round-trip tested) packs a type or section into a versioned snippet with a dependency manifest of referenced derivations; the section menu and per-type settings expose Export (clipboard), and an import dialog audits missing derivations, offers to create them, and appends with fresh ids. Steps 1–4 below are done; "file" snippets default to the clipboard.

**What.** Any note type, section, or template exportable as a JSON snippet (clipboard or file) and importable into another vault — the sharing primitive for a community library.

**Considerations.** The registries and Section/Entry structures already serialize cleanly; the work is collision handling and versioning, not serialization. Stamp exports with a schema version and the plugin version.

**Challenges.** Imports referencing properties/derivations that don't exist in the target vault: import must list unresolved references and offer to create stub derivations (reuse the template `sources()` machinery, which already solves this for D&D templates). Id collisions need re-generation on import while preserving internal cross-references.

**Touchpoints.** New `src/core/transfer.ts` (pack/unpack, id remap, reference audit). `src/ui/menus/section-menu.ts` ("Export section…"), `src/ui/settings-tab.ts` (type export/import buttons), `src/ui/modals/dialogs.ts` (import preview dialog), locales.

**Steps.**
1. `pack(section|type)` → versioned JSON with dependency manifest; `audit(json, settings)` → missing refs.
2. Export actions in section menu and settings.
3. Import dialog: paste/file, audit results, "create missing sources" checkbox, id remap on apply.
4. Round-trip tests with golden files (F1).

### D2. Layouts as vault files (optional)

**What.** An opt-in mode storing layouts/types as JSON files in a vault folder so configuration syncs, diffs and shares with the vault; `data.json` keeps only plugin-level settings.

**Considerations.** Opt-in, never forced: many users want config invisible. On enable, write current layouts out; on load, vault files win over `data.json` copies. Sync conflicts become the user's familiar file-conflict problem instead of silent data.json clobbering — that is a feature.

**Challenges.** Load order: layouts must be available before the first view render; vault files load async after `onload` — render must wait or re-render once loaded. External edits to layout files (sync, git) need a vault watcher with debounce and a "reload layouts" affordance. Partial corruption (hand-edited JSON) must fail per-file with a notice, not kill the plugin.

**Touchpoints.** `src/core/settings.ts` (split layout store behind an interface: MemoryStore | VaultStore), `src/main.ts` (async load, watcher, migration command), `src/ui/settings-tab.ts` (mode toggle + folder picker), `src/ui/view.ts` (loading state).

**Steps.**
1. Extract a LayoutStore interface; route all reads/writes in settings/view through it.
2. Implement VaultStore (one file per type) with debounced writes and per-file validation.
3. Enable/disable migration commands (export-to-vault / reabsorb).
4. Vault watcher → store reload → view re-render.
5. Document conflict behavior.

### D3. Versioned migration table and automatic backups

> ✅ **Implemented in v2.45.0** (`src/core/settings.ts`, `src/main.ts`). `schemaVersion` + a pure, unit-tested `runSchemaMigrations` (ordered steps, stamp-once); timestamped `data.json` backups to the plugin `backups/` folder (last 5) before any upgrade is persisted. Steps 1, 3 and 4 are done. Step 2 (folding each module's `migrate()` into the version table) is partial: the hooks still run within the gated pass — converting them is an incremental, low-risk follow-up since they're idempotent.

**What.** Replace ad-hoc per-module `migrate()` sniffing with `settings.schemaVersion` and an ordered, tested migration list; snapshot `data.json` to a timestamped backup before any migration runs.

**Considerations.** Module-owned migrations are good — keep them, but have them register `{fromVersion, run}` steps into one table executed by the core. Backups are cheap insurance for the single most dangerous code path in the plugin.

**Challenges.** Establishing the initial schemaVersion for existing installs (absent field = "pre-versioning", run legacy sniffing once, then stamp). Backup retention (keep last N, prune).

**Touchpoints.** `src/core/settings.ts` (runner, version stamp), `src/core/registry.ts` (FeatureModule.migrations registration), `src/main.ts` (backup write before run), each `src/features/*/index.ts` (convert existing migrate()).

**Steps.**
1. Add schemaVersion + runner executing ordered steps once, stamping after success.
2. Wrap existing module migrations as version steps; legacy sniff becomes step 0.
3. Pre-migration backup to `.obsidian/plugins/extended-properties/backups/`, keep last 5.
4. Golden-file tests: real captured data.json in → expected out (F1).

### D4. Write batching and conflict handling

> ✅ **Implemented in v2.43.0** (`src/core/note-model.ts`). All four steps below are done: `queueWrite` coalesces per file, every value-type commit routes through `NoteModel.set`/`setMany` → the queue, an mtime snapshot at batch start drives the keep-mine/take-theirs notice, and the queue flushes on file-switch (`load`) and view close. `NoteFacade` (inline) gained the same guard.

**What.** Debounce frontmatter writes (slider drags currently burst), queue writes per file, and detect external modification during an inline edit, surfacing a conflict instead of overwriting.

**Considerations.** NoteModel already distinguishes light/full changes; the write side needs the same care as the read side. A simple "file mtime changed since edit began → show keep-mine/take-theirs notice" covers the realistic sync race.

**Challenges.** Obsidian's `processFrontMatter` is async and serialized per call — interleaving with the user typing in the editor pane is the real hazard; the debounce window must be short (~300ms) to feel live while still coalescing drags.

**Touchpoints.** `src/core/note-model.ts` (write queue, debounce, mtime guard), `src/ui/render/value-types/numeric.ts` (drag commits become queued), `src/ui/components/inline-edit.ts`, locales (conflict notice).

**Steps.**
1. Central `queueWrite(file, mutator)` in NoteModel with per-file coalescing.
2. Route all value-type commits through it.
3. mtime snapshot at edit start; on conflict, notice with two actions.
4. Flush queue on unload/file-switch.

---

## E. UX and accessibility

### E1. Keyboard navigation and screen-reader support

**What.** Full keyboard operation (tab/arrows between entries, Enter to edit, Escape consistent everywhere, visible focus rings) and ARIA semantics (roles on toggles, labels bound to inputs, `aria-live` announcement of roll totals).

**Considerations.** The custom popups (`popups.ts`, `dice-ui.ts`) need focus traps; Obsidian's own Menu already behaves. Roll announcements via a single polite live region on the roll layer cover all cards.

**Challenges.** The cluster grid is visually a table but structurally per-row spans — roving tabindex is the right pattern, not tabbing every cell. Drag-and-drop needs a keyboard alternative (move up/down already exists in menus — ensure it is reachable).

**Touchpoints.** `src/ui/view.ts` / `entry-renderer.ts` (roving tabindex, key handlers), `src/ui/components/popups.ts` and `src/features/rolling/dice-ui.ts` (traps, Escape), `src/ui/render/modifier-addon.ts` (toggle roles/labels), `src/features/rolling/dice-anim.ts` (live region), `styles.css` (focus styles).

**Steps.**
1. Focus styles + Escape audit across popups/modals.
2. Roving tabindex over entries; Enter/Space activate the focused control.
3. ARIA roles/labels on toggles, sliders, roll buttons.
4. Live region for roll resolution.
5. Keyboard reachability pass over menus (no mouse-only affordance).

### E2. Mobile refinements

**What.** Bottom-sheet presentation for options modals, larger touch targets in dense clusters, font-relative squeeze slack, and a long-press alternative for every right-click menu (roll menu, roll cards, chips).

**Considerations.** Long-press is the only blocker for feature parity on phones — right-click menus (roll modes, card copy/reroll) currently have no touch path. The 24px slack should become `1.5em`-derived to respect user font scaling.

**Challenges.** Long-press vs scroll vs drag disambiguation (the pointer-drag work from v2.3 already has the pattern: movement threshold + timer). Bottom sheets in Obsidian mobile are custom CSS on Modal, not an API.

**Touchpoints.** `src/ui/modals/*` (sheet styling on `Platform.isMobile`), `src/features/rolling/numeric-addon.ts`, `dice-anim.ts`, `roller.ts` (long-press handlers), `src/ui/view.ts` (slack computation), `styles.css`.

**Steps.**
1. Shared `onLongPress(el, fn)` util consistent with the drag thresholds.
2. Attach to every contextmenu site.
3. Mobile modal styling (sheet, larger paddings).
4. Slack from computed font size; verify squeeze tiers on a narrow viewport.

### E3. Theming surface

> ✅ **Implemented in v2.47.0** (`styles.css`, `README.md`). A `--ep-*` token layer (section accent/control/bg/border/title-bg/radius/gap/padding, chip bg/fg/radius, rating colour, plus the existing typography tokens), each consumed as `var(--ep-x, <current value>)` so defaults are unchanged; a Style Settings `@settings` block with colour/size controls and a *Flat sections* class-toggle; and a README variable-reference table. Steps 1–4 done. The codebase already used Obsidian theme vars almost everywhere, so few literal colours remained to extract.

**What.** Every hard-coded size/color behind `--ep-*` CSS variables with documented defaults, so themes and Style Settings can restyle without `!important` battles.

**Considerations.** A `--ep-` block at `.ep-root` level, consumed throughout; the existing typography settings (label size etc.) should write these variables instead of inline styles where possible.

**Challenges.** The squeeze/measure pass reads computed widths — variable-driven sizing must not break measurement assumptions (it doesn't, as long as measurement stays post-layout, which it is).

**Touchpoints.** `styles.css` (variable extraction), `src/ui/settings-tab.ts` (typography writes variables on the view root), README (variable reference table).

**Steps.**
1. Inventory hard-coded values; define the variable set.
2. Replace in CSS; set defaults on `.ep-root`.
3. Style Settings manifest comment block.
4. Document.

---

## F. Quality and infrastructure

### F1. Test harness

**What.** Vitest over the pure modules: dice math, expression engine, influences, migrations, transfer pack/unpack — plus golden files from real `data.json` captures.

**Considerations.** The pure-function split makes this cheap; the esbuild obsidian alias stub already proves the seam. Property-based tests fit dice semantics ("sum of kept = total − modifier", "adv ≥ normal in expectation", drop-index correctness).

**Challenges.** None technical; the discipline is keeping Obsidian imports out of testable modules — enforce with an eslint boundary rule.

**Touchpoints.** `package.json` (vitest, scripts), new `tests/`, `tsconfig` test config, optional `.eslintrc` (import boundary), CI (F3).

**Steps.**
1. Vitest setup + first tests for `utils/dice.ts` and the v2.10 drop semantics in a pure helper (extract the drop logic from roll-service into `utils/dice.ts` to make it testable).
2. Migration golden tests (D3 step 4).
3. Expression/dice-expr suites as A1/A2 land (test-first).
4. CI gate.

### F2. Performance hardening

> ✅ **Implemented in v2.46.0** (`src/ui/view.ts`). Steps 1–2 done: a per-section (width | row count | edit mode) signature early-exits unchanged sections, and the tier loop is now tier-major (batched read→write), cutting forced reflows to O(tiers). Step 3 (profiling → windowing) concluded windowing is unnecessary: B3's table handles large tabular data and per-section sheets are bounded. Note-model write batching landed separately in D4.

**What.** Skip responsive passes when section widths are unchanged; batch DOM reads before writes in the pass; virtualize very long sections; cap updater work on light changes.

**Considerations.** Current scale is fine; this is debt to schedule before B3 (tables) and large vaults arrive. The pass already runs synchronously without paint flicker — the remaining cost is forced reflows per row.

**Challenges.** Width-signature caching must invalidate on content changes (entry add/remove, label edit) — key it on (clientWidth, entry count, edit mode). Virtualization conflicts with measurement-based alignment; only virtualize beyond a threshold and align per visible window.

**Touchpoints.** `src/ui/view.ts` (signature cache; read-then-write split), `src/ui/render/section-renderer.ts` (windowing hooks), `src/core/note-model.ts` (already covered by D4).

**Steps.**
1. Per-section width+count signature; early-exit the pass.
2. Restructure the tier loop: gather all measurements per iteration, then apply classes.
3. Profile with a 200-entry sheet; decide whether windowing is needed at all.

### F3. CI, repository, community release

**What.** GitHub repo with Actions (tsc, tests, build, release artifact), LICENSE, real `manifest.json` author/repo fields, BRAT-compatible releases, community plugin submission.

**Considerations.** Releases must attach `main.js`, `manifest.json`, `styles.css` (BRAT/community convention). The existing zip ritual maps directly onto a release workflow. Community review will flag: innerHTML usage (audit — the codebase builds DOM via helpers, likely clean), `isDesktopOnly` correctness, and console noise.

**Challenges.** None beyond process; version tags must match `manifest.json` exactly.

**Touchpoints.** Repo scaffolding (`.github/workflows/`, LICENSE, `.gitignore`), `manifest.json`, README (install section), `versions.json` discipline (already maintained).

**Steps.**
1. Repo + license + CI running tsc/tests/build on push.
2. Release workflow on tag: build, attach the three files + full zip.
3. BRAT beta round.
4. Community submission PR; address review feedback.

### F4. i18n as data + community translations

> ✅ **Implemented in v2.48.0** (`src/i18n/locales/en.json`, `src/features/*/strings.json`, `scripts/i18n-check.mjs`, `CONTRIBUTING.md`). Dictionaries are JSON loaded via thin typed shims (`resolveJsonModule`); a key-parity checker runs in CI and as `npm run i18n`; the translation workflow is documented. Steps 1–3 done. Plural rules remain deferred (no current string needs them; adopt `Intl.PluralRules` lazily if one ever does).

**What.** Locale dictionaries as JSON files (per module or merged at build), a documented key list, and a contribution path for new languages.

**Considerations.** The i18n registry already merges module dictionaries at runtime; only the source format changes. A build step can type-check key parity between locales (en as schema).

**Challenges.** Plural rules are absent (current strings avoid them); adopt `Intl.PluralRules` lazily when first needed rather than a framework.

**Touchpoints.** `src/i18n/i18n.ts` (loader), `src/i18n/locales/*` (convert to JSON), `src/features/*/strings.ts` (same), build script (parity check), CONTRIBUTING note.

**Steps.**
1. Convert dictionaries to JSON imported via esbuild.
2. Key-parity check script in CI.
3. Document the translation workflow.

### F5. Public module API and legacy deprecation

**What.** A documented, versioned API for third-party feature modules (`window.ExtendedProperties.register(module)` or a plugin-to-plugin handshake), plus the formal deprecation of the record-based skills type and the dead `dnd5e` stubs.

**Considerations.** The internal FeatureModule contract is already the right shape; publishing it means freezing names and adding an `apiVersion` gate so internal refactors do not break externals. Skills deprecation already has the converter (`skills-type.ts convertToProperties`) — the remaining work is a prompt and a removal timeline.

**Challenges.** API stability commitments constrain refactoring — publish the minimum surface (registries + i18n + ViewCtx read-only) and mark everything else internal. Removing the legacy type must never strand data: the converter must run or the type must keep rendering read-only.

**Touchpoints.** `src/core/registry.ts` (apiVersion, narrow public types), `src/main.ts` (exposure, third-party module loading order), `ARCHITECTURE.md` (public API docs), `src/features/rolling/skills-type.ts` (deprecation banner + prompt), `src/features/dnd5e/*` stubs (delete).

**Steps.**
1. Delete the dead dnd5e stub files (tsc-verified unused).
2. Skills type: deprecation notice in its options + one-click convert; document removal in two majors.
3. Define and freeze the public types; add apiVersion checks.
4. Expose registration post-`onload`; write a 20-line example module in the docs.
5. Remove the skills type at the announced version, leaving a read-only fallback renderer for unconverted data.

---

## G. Suggested sequencing

**Milestone 1 — Foundations (no visible features, everything else depends on it):** F1 harness + extracted-pure drop logic; D3 migration table + backups; D4 write batching. Low risk, immediately protective.

**Milestone 2 — Expressions:** A1 engine (test-first), C2 conditional visibility (cheap once A1 exists), C1 validation. One settings-UI wave covers all three.

**Milestone 3 — Rolling depth:** A2 dice AST (test-first), A3 macros, A4 persistent history. The animation generalization is the only risky render work here.

**Milestone 4 — Notes integration:** B1 inline rendering (reading mode), then E2 long-press (mobile parity for the new chips), then B1's Live Preview pass.

**Milestone 5 — Scale:** B2 cross-note index, B3 table view, F2 performance work in the same wave (they stress the same paths).

**Milestone 6 — Ecosystem:** D1 export/import, D2 vault-file layouts, E3 theming, F4 i18n-as-data, F3 release/CI (can start any time; gate community submission on Milestones 1–3 being stable), F5 public API last — freeze surfaces only after the internal refactors above have settled.

**Continuous:** E1 accessibility items should ride along with every UI wave rather than batch at the end; each milestone ends with a README/ARCHITECTURE update, the version bump, and the zip ritual.
