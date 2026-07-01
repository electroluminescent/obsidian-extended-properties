# Extended Properties — roadmap

**Status: v3.6.0.** The original feature roadmap (milestones 1–6) is fully
implemented, and forward-roadmap items **L1 (history & safe sync, v3.1.0)**,
**G2 (inline charts & sparklines, v3.2.0)** and **M1 (accessibility completion,
v3.6.0)** have shipped. Releases v3.3.0–v3.5.5 added the 3D-dice presentation plus
a run of roll, mobile and robustness polish (see *Dice presentation & polish*
below). This document is consolidated: it records what shipped — without the
original per-feature planning notes or challenge analysis — and lays out the
remaining forward-looking roadmap.

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

### Trust & safe sync (v3.1.0) ✅

L1 shipped three data-safety features. **Config history snapshots** write a
timestamped JSON of your types, layouts, derivations and settings to a
`snapshots/` subfolder — a manual command, an optional daily auto-snapshot, a
retention cap, and a restore picker that backs up the current settings first.
**Field-level three-way merge** upgrades the D4 conflict guard: when an external
edit and your edits touch *different* frontmatter keys they merge automatically,
and the *Keep mine / Take theirs* prompt is reserved for keys both sides changed
differently (now listed by name). **Opt-in value encryption** (`core/secure.ts`)
encrypts a sensitive text property with AES-256-GCM under a session passphrase;
the value is stored as a self-describing envelope, shown masked until unlocked,
and a wrong passphrase fails closed — decryption is always non-destructive.

### Visualization (v3.2.0) ✅

G2 added lightweight charts. Pure SVG geometry (`utils/chart.ts`, unit-tested)
feeds a DOM renderer (`ui/render/charts.ts`) that themes through `--ep-*` and is
accessible (every chart is `role="img"` with an `aria-label` and a visually-hidden
text fallback). Four inline tokens render in reading mode and Live Preview —
`` `spark: a, b, c` ``, `` `bar: …` ``, `` `radar: STR, DEX, CON, INT, WIS, CHA` ``
and `` `progress: HP / MaxHP` `` — and an `ep-chart` code block takes a small
`type` / `props` / `max` / `title` config for a larger chart. All references
resolve through the existing engine, so short forms, modifier suffixes and
cross-note references work. *Deferred:* a chart cell in the type table view
(needs per-column type config) remains a follow-up.

### Dice presentation & polish (v3.3.0–v3.5.5) ✅

The 3D dice roll grew from an idea into real geometry. `utils/polyhedra.ts`
(pure, unit-tested) builds the standard solids — tetrahedron (d4), cube (d6),
octahedron (d8), pentagonal trapezohedron (d10), dodecahedron (d12) and
icosahedron (d20) — via convex-hull face extraction, emitting per-face
`place` / `land` / `clip` matrices so a die lands with the result face front and
upright. The roll animation is **modular** (`features/rolling/dice-styles.ts`):
classic cycling numbers, a spinning icon, or the 3D solid, selectable in
Settings → Dice. The 3D die plays **one continuous decelerating spin on a single
axis** that overshoots the landing slightly (a bounce) before settling, and
honours `prefers-reduced-motion`.

Alongside it: rolls resolve in an on-screen **dialog** that *replaces* the result
Notice while enabled (history and the a11y announce are kept); on mobile the roll
cards **wrap into as many columns as fit the screen and scroll vertically**
instead of one horizontal row, and the numeric `−`/`+` steppers get a wider grid
column so the larger mobile touch targets no longer overlap. A supersampling
anti-alias path for the 3D dice exists but is currently **disabled** (it distorted
the dice under CSS 3D; the toggle is locked off pending a different approach).
Robustness passes hardened the data path — a corrupt `data.json` now falls back to
defaults and is backed up rather than bricking load, snapshot / inline-render
parsing is guarded, and vault-local `data.json` is no longer tracked in git or
shipped in release zips, so an update can never overwrite live settings.

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

#### G2 — Inline charts & sparklines ✅ (shipped in v3.2.0)

Delivered: pure SVG geometry + renderer, the `spark:` / `bar:` / `radar:` /
`progress:` inline tokens (reading mode + Live Preview), and the `ep-chart` block
— all themed by `--ep-*` and accessible (see the *Visualization* entry above).
*Future extension:* a chart cell in the type table view, which needs per-column
type configuration in `ui/table-view.ts`.

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

#### M1 — Accessibility completion ✅ (shipped in v3.6.0)

Delivered every step. **ARIA audit:** each custom control maps to a native role
and name — editable value cells are focusable `role="button"`s, the rating is a
`role="slider"` (arrow keys + Home/End), the custom slider keeps its slider
value semantics, native checkboxes carry accessible names, list chips expose a
labelled *Remove* button, section titles are `aria-expanded` disclosures, and the
entry `⋯` menu, steppers and roll buttons are labelled. **Keyboard editing:**
values open with Enter/Space (not only via the context menu), the checkbox toggles
from the keyboard even in locked mode, and rating/slider adjust with the arrows.
**Reduced motion:** honoured across the roll / spin / collapse animations (the 3D
die lands without the spin). **High contrast:** a `forced-colors: active` block
plus broader `:focus-visible` rings ensure no state is conveyed by colour alone
under Windows High Contrast. **Manual pass:** the screen-reader / keyboard test
checklist lives in [ACCESSIBILITY.md](ACCESSIBILITY.md). *Future:* an in-entry
arrow-key composite (fewer Tab stops on dense sheets) and a full high-contrast
theme preset.

#### L1 — History & safe sync ✅ (shipped in v3.1.0)

Delivered: config history snapshots + restore, field-level three-way merge for
the conflict guard, and opt-in AES-256-GCM encryption of sensitive values (see
the *Trust & safe sync* entry above). *Future extensions:* snapshotting note
*values* (not just configuration); a full merge UI for the conflicts that today
fall back to the keep-mine/take-theirs prompt; and decryption coverage for the
inline `prop:`/`val:` chips (the sidebar masks/reveals today).

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

- **Milestone 7** (G1, G2): **G2 shipped in v3.2.0**; G1 (query blocks) remains —
  highest visible value and built almost entirely on what already exists (the
  index, the table cell renderers, the expression engine).
- **Milestone 8** (H1, H2) depends on a solid index — pull N1's per-file dirty
  marking forward if target vaults are large.
- **Milestone 9** (N1, M1, L1): trust and scale — **L1 shipped in v3.1.0** and
  **M1 (accessibility completion) shipped in v3.6.0**; N1 (index scale) underpins
  G1/H1 and remains the open item.
- **Milestone 10** (K1) is ongoing; API v2 is purely additive over `apiVersion` 1.
