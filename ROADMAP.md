# Extended Properties — roadmap

**Status: v3.0.0.** The original feature roadmap (milestones 1–6) is fully
implemented. This document is now consolidated: it records what shipped — without
the original per-feature planning notes or challenge analysis — and lays out a
forward-looking roadmap for what comes next.

Legend: ✅ done · ◑ partial · ○ planned.

The architecture to protect throughout (unchanged): the registry system
(`src/core/registry.ts`) that decouples value types, entry kinds, cluster addons,
derivations, templates and presets from the shell; the generic influence /
expression engine (`src/core/influences.ts`, `src/core/expr.ts`); feature modules
that self-register and self-migrate; and the pure-function split (`src/utils/*`,
most of `src/core/*`) that keeps Obsidian out of the math and under unit test. See
[ARCHITECTURE.md](ARCHITECTURE.md).

---

## Shipped (milestones 1–6) ✅

A consolidated summary; see the git history and releases for detail.

- **Engine & expressions** — A1 expression engine (references by name / short
  form, function library, explicit cycle detection); C1 validation & constraints;
  C2 conditional visibility (`showWhen` / `evalCondition`); B2 cross-note
  references & aggregates (`[[Note]].Prop`, `prop()`, `sum/avg/count/min/max`)
  over a `PropertyIndex`, with a settings kill-switch.
- **Rolling** — A2 full dice notation + roll AST (keep/drop, explode, reroll,
  success counting, property references); A3 saved roll macros (palette commands,
  per-type scope); A4 persistent roll history (panel, current-note filter,
  Markdown export); per-category sound effects + configurable roll animation.
- **Notes integration** — B1 inline rolls & properties (`roll:` / `prop:` /
  `val:` / `vals:` and the `ep-sheet` block, in reading mode and Live Preview);
  E2 mobile refinements; `[[`-triggered note autocomplete in text / list inputs.
- **Value types & data** — C3 rating / link / unit / datetime value types plus
  `today()` / `days()`; D1 export / import of types & sections; D4 write batching
  + mtime conflict guard.
- **Scale & UI** — B3 type table view (sort / filter / persist, in-cell edit and
  rolls, row virtualization); F2 performance hardening (signature-cached
  responsive pass, tier-major batched reads).
- **Platform** — F1 test harness (Vitest over the pure modules); F3 CI + release
  automation + community-submission runbook; E3 theming surface (`--ep-*` +
  Style Settings); F4 i18n as data (JSON dictionaries + parity checker); F5
  public module API (`src/api.ts`, `apiVersion` 1); D2 layouts as vault files;
  E1 keyboard navigation & screen-reader support; D3 versioned settings
  migrations + pre-upgrade backups.

### Cross-version durability (v3.0.0) ✅

User customizations carry across upgrades intact. `normalizeSettings` now
preserves unknown / forward-compatible keys — settings written by a newer
version, or top-level keys saved by a third-party module through the public API —
instead of dropping them on a load → save round-trip. Settings carry an
`appVersion` stamp, and any version change snapshots `data.json` to the plugin's
`backups/` folder even when the schema is unchanged, so a release can always be
rolled back. Together with D3's migration table and D2's vault-file layouts, this
makes the data path safe to evolve.

## Deprecations

- **German locale (`de`) — removed in v2.41.** English-only; the locale
  *mechanism* (the `register` API and the per-string override editor) is kept, so
  a community-maintained dictionary can be slotted back in under F4. Any vault
  still set to `de` resolves entirely through the English fallback.
- **Legacy `skills` value type — deprecated (F5).** The one-click *Convert to
  property entries* converter ships and the type shows a deprecation notice.
  Removal (with a read-only fallback for unconverted data) is reserved for a
  future major and is explicitly gated on the cross-version durability guarantee
  above, so no data is lost.

## Shipped beyond the original plan

Per-property unique short forms with name↔short-form interchangeability and
autocomplete; the dotted modifier suffix (`INT.s`, `[[Note]].intelligence.s`,
configurable); the inline `vals:` card that reuses the sidebar value-type
renderers with a per-reference options store; and `[[`-note autocomplete across
sidebar, inline and table inputs.

---

## Forward-looking roadmap

The original roadmap is delivered, so this is a fresh forward plan based on what
the plugin can already do. Each item keeps the original structure — **What ·
Considerations · Barriers · Touchpoints · Steps** — and is grouped into suggested
milestones. Nothing here is committed; it is a design backlog.

### Milestone 7 — Query & visualize

#### G1 — Query blocks (`ep-query`) ○

- **What.** A code block that queries notes by type and property predicates and
  renders the result as a table, list or cards — `from "Character" where Level >= 5
  sort by Dexterity desc`. Columns are properties; cells use the same type-aware
  widgets as the table view and edit in place.
- **Considerations.** Reuse the parts already built: `evalCondition` for the
  `where` clause, the `PropertyIndex` for the candidate set, the table view's
  cell renderers for output, and the aggregate functions for summary rows. A
  small declarative block schema (a few keys) beats inventing a full query
  language. Live-refresh on the metadata cache.
- **Barriers.** Performance over large vaults (depends on N1's incremental
  index); query-language scope creep; re-render thrash on every vault change
  (debounce, diff); overlap with Dataview — differentiate on *typed, editable*
  cells rather than read-only output.
- **Touchpoints.** New `src/features/query/`; extract the table cell renderers out
  of `ui/table-view.ts` into a shared module; `core/property-index.ts`;
  `core/expr.ts`.
- **Steps.** Extract shared cell renderer → define the block schema → index-backed
  executor (filter → sort → group) → render modes (table / list / cards) →
  debounced live refresh → reuse the cross-note kill-switch.

#### G2 — Inline charts & sparklines ○

- **What.** Lightweight visualizations of numeric / derived properties: an
  `ep-chart` block, inline `spark:` / `bar:` chips, and a radar/hex chart for a
  section of related numbers (e.g. the six ability scores). Optional chart cells
  in the table view.
- **Considerations.** Inline visuals are pure inline SVG (no dependency, themed
  through `--ep-*`); only the block form needs a richer renderer. Everything reads
  through the existing value resolver so cross-note and modifier references work.
- **Barriers.** Bundle size if a chart library is added (plugins can't pull from a
  CDN at runtime — keep it inline SVG, or vendor a minimal renderer); mobile
  sizing; accessibility (every chart needs a table/text fallback and an
  `aria-label`).
- **Touchpoints.** New `src/utils/chart.ts` (pure SVG generators, unit-testable);
  `src/features/inline/` (new tokens); `ui/table-view.ts` (chart cell).
- **Steps.** Pure SVG sparkline/bar util + tests → inline tokens → section radar →
  `ep-chart` block → table chart cell → a11y fallbacks.

### Milestone 8 — Relationships & authoring

#### H1 — Typed relations & backlinks ○

- **What.** A first-class `relation` value type: a link property with a declared
  inverse, plus expression accessors — `backlinks()`, `relatedTo("Faction")` — and
  derived "referenced by" counts/lists, so a note can compute over the notes that
  point at it.
- **Considerations.** Store relations as ordinary link properties (portable, no
  hidden state). Maintain the inverse *lazily* through the index rather than
  writing both sides on every edit. Reuse the expression engine's cycle detection
  for relation chains.
- **Barriers.** Eager inverse writes would cause write storms — any optional
  inverse maintenance must ride the D4 batch queue with echo-suppression; index
  cost and correctness on rename/delete; keeping cross-note reads cycle-free.
- **Touchpoints.** `core/property-index.ts` (relation edges); `core/expr.ts`
  (relation functions); new `relation` value type in the registry;
  `core/note-model.ts` (opt-in inverse writes).
- **Steps.** Relation value type → index relation edges → expression accessors →
  backlink-derived properties → optional (opt-in) inverse maintenance.

#### H2 — Note scaffolding from types ○

- **What.** A *New <Type> note* command that creates a note pre-stamped with the
  type's properties (empty, hidden from Obsidian's panel) and an optional per-type
  body template — extending the existing "template section writes empty hidden
  props" behaviour to whole-note creation.
- **Considerations.** Per-type body template stored either in settings or as a
  pointer to a vault template file; if core Templates / Templater is present,
  insert into the flow rather than fight it; configurable target folder and naming.
- **Barriers.** Overlap and ordering conflicts with existing template plugins;
  where the body template lives (vault file vs. settings blob); frontmatter key
  ordering on creation.
- **Touchpoints.** `core/settings.ts` (per-type template ref); `main.ts` (command +
  palette); `core/note-model.ts` (create + initial write).
- **Steps.** Per-type template config → create-note command → write hidden props →
  optional body insert → folder / naming options.

### Milestone 9 — Trust, scale & polish

#### N1 — Property-index incrementalization & scale ○

- **What.** Make the `PropertyIndex` incremental (per-file dirty marking on
  metadata-cache change) and memoize cross-note aggregates with dependency
  tracking; optionally move heavy expression/aggregation work to a worker for very
  large vaults.
- **Considerations.** Invalidate only the changed file's contribution; cache
  aggregates keyed by `(type, key)` with dirty flags; a worker can't touch the
  Obsidian API, so it only ever receives plain serialized data.
- **Barriers.** Cache-invalidation correctness is the classic hard part; worker
  serialization can cost more than it saves on small vaults — gate it behind a
  size threshold; must stay correct under rename/move/delete.
- **Touchpoints.** `core/property-index.ts`; `core/expr.ts` (aggregate cache);
  build config (optional worker entry).
- **Steps.** Per-file dirty index → aggregate memoization + invalidation →
  benchmark fixture → optional worker behind a vault-size threshold.

#### M1 — Accessibility completion ○

- **What.** Finish what E1 started: exhaustive ARIA roles/labels on every stepper,
  slider and toggle; full keyboard *editing* (not just opening the context menu);
  `prefers-reduced-motion` honoured by the dice animation; high-contrast theme
  tokens.
- **Considerations.** Builds directly on E1's roving focus and live region; map
  each custom control to a native role/name; reduced-motion simply skips the
  animation and commits immediately.
- **Barriers.** No screen reader in CI — needs a documented manual pass; Obsidian's
  own embedded controls have their own a11y quirks to work around.
- **Touchpoints.** `ui/render/*`; `features/rolling/*`; `utils/a11y.ts`;
  `styles.css`.
- **Steps.** ARIA audit pass → keyboard inline-edit → reduced-motion gate →
  high-contrast tokens → manual screen-reader checklist.

#### L1 — History & safe sync ○

- **What.** Layout and value history snapshots in the vault folder; upgrade the D4
  conflict guard from *Keep mine / Take theirs* to an optional field-level 3-way
  merge; opt-in encryption for properties marked sensitive.
- **Considerations.** Reuse the D2 vault-file folder for layout snapshots;
  field-level auto-merge only where edits don't overlap, falling back to the
  existing prompt on a true conflict; encryption is per-property, opt-in, with a
  user-supplied key — never silent.
- **Barriers.** Snapshot storage growth (needs retention caps); merge UX and
  correctness; encryption key management and lockout risk (must warn loudly).
- **Touchpoints.** `core/layout-store.ts` (snapshots); `core/note-model.ts`
  (merge); new `core/secure.ts`.
- **Steps.** Layout snapshot + restore → field-level auto-merge → conflict
  fallback → opt-in property encryption with explicit warnings.

### Milestone 10 — Ecosystem (ongoing)

#### K1 — API v2 & module ecosystem ○

- **What.** Grow the public API into richer contribution points: module-supplied
  settings panels, palette commands, inline tokens and value-type editors; a
  module template repo; and more bundled optional modules (other RPG systems,
  habit / fitness / recipe trackers).
- **Considerations.** Additive `apiVersion` 2 that never breaks v1; declarative
  contribution points so modules describe what they add; the registry already
  isolates module errors and reserves built-in ids.
- **Barriers.** Balancing API stability against growth; Obsidian does not sandbox
  plugin code, so third-party modules run with full trust (document this clearly);
  maintenance burden of every bundled module.
- **Touchpoints.** `src/api.ts`; `core/registry.ts`; `ui/settings-tab.ts` (module
  panels); docs.
- **Steps.** Settings-panel + command contribution points → inline-token hook →
  value-type editor hook → bump `apiVersion` to 2 (back-compatible) → publish a
  module template repo.

### Suggested sequencing

- **Milestone 7** first (G1, G2): highest visible value and built almost entirely
  on what already exists (the index, the table cell renderers, the expression
  engine).
- **Milestone 8** (H1, H2) depends on a solid index — pull N1's per-file dirty
  marking forward if target vaults are large.
- **Milestone 9** (N1, M1, L1): trust and scale — N1 underpins G1/H1 at scale, M1
  finishes E1, L1 hardens D2/D4.
- **Milestone 10** (K1) is ongoing; API v2 is purely additive over `apiVersion` 1.
