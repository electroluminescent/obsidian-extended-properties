# Extended Properties — roadmap

**Status: v3.7.0.** The original feature roadmap (milestones 1–6) is fully
implemented, and forward-roadmap items **L1 (history & safe sync, v3.1.0)**,
**G2 (inline charts & sparklines, v3.2.0)** and **M1 (accessibility completion,
v3.6.0)** have shipped. Releases v3.3.0–v3.5.5 added the 3D-dice presentation plus
a run of roll, mobile and robustness polish (see *Dice presentation & polish*
below). v3.7.0 was a quality pass rather than a feature release — see
*Hardening pass (v3.7.0)* below — and its findings seed the new items in
**Milestone 11** further down. This document is consolidated: it records what
shipped — without the original per-feature planning notes or challenge analysis
— and lays out the remaining forward-looking roadmap.

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

### Hardening pass (v3.7.0) ✅

A codebase audit (build/tests, dead code, settings validation, test coverage)
turned up a real perf risk and a couple of gaps, all now fixed. **PropertyIndex
caching:** every cross-note `sum()/avg()/prop()` reference used to trigger a
fresh `vault.getMarkdownFiles()` scan of the *entire vault* on every sidebar
render; `PropertyIndex` now keeps a per-file frontmatter snapshot cache, built
lazily and kept in sync via `metadataCache.changed` / `vault.delete` /
`vault.rename`, so a render only pays the full-scan cost once per file change
rather than once per render. This is the first half of N1 below — the cache
removes the redundant re-scanning, but aggregates are still recomputed on every
read rather than memoized, which is what N1 now tracks. **Settings validation:**
`inlineEntries` (the data backing `ep-sheet` note blocks) was the one settings
field with no shape-check on load; it's now validated the same way every other
typed field is. **Test coverage:** added unit tests for the three pure modules
that had none — `utils/formula.ts`, `utils/color.ts`, `core/layout-ops.ts` (34
new tests, 160/160 passing). Everything else the audit checked — dead code,
TODOs, i18n coverage, the deprecation state below — came back clean.

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

#### N1 — Property-index incrementalization & scale ◑

- **What.** Memoize cross-note aggregates with dependency tracking; optionally
  move heavy expression/aggregation work to a worker for very large vaults.
- **Shipped in v3.7.0:** the per-file dirty-marking half of this item —
  `PropertyIndex` now caches a frontmatter snapshot per file and invalidates it
  on `metadataCache.changed` / `vault.delete` / `vault.rename`, so a vault is
  scanned once per file change rather than once per render (see *Hardening pass*
  above). **Remaining:** every `sum()/avg()/count()` call still re-filters and
  re-reduces the full cached snapshot set on every read — for a type with many
  notes and several derived aggregates on screen at once, that's still repeated
  work the cache doesn't remove.
- **Considerations.** Cache aggregates keyed by `(type, key, fn)` with dirty
  flags driven off the same invalidation events the snapshot cache already
  uses — no new event wiring needed, just a second cache layer keyed off it. A
  worker can't touch the Obsidian API, so it only ever receives plain serialized
  data.
- **Barriers.** Cache-invalidation correctness is the classic hard part —
  an aggregate over `(type, key)` must invalidate whenever *any* note of that
  type changes `key` OR its `Type` list, which is a broader dependency than the
  per-file cache tracks today. Worker serialization can cost more than it saves
  on small vaults — gate it behind a size threshold.
- **Touchpoints.** `core/property-index.ts` (aggregate cache alongside the
  snapshot cache); `core/expr.ts` (aggregate call sites); build config (optional
  worker entry).
- **Steps.** Aggregate memoization keyed by `(type, key, fn)`, invalidated by the
  existing file-change events → benchmark fixture (large synthetic vault) →
  optional worker behind a vault-size threshold.

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

### Milestone 11 — Quality deepening (seeded by the v3.7.0 audit)

The v3.7.0 hardening pass fixed everything that was a straight defect; what it
*surfaced* were structural gaps that need design work rather than a patch — the
perf risk was found by reading code, not by measurement, and the seam between
the pure modules and the Obsidian API is only hand-tested. The first two items
close those gaps. The remaining four collect the deferred extensions recorded
inline in the shipped entries above (G2, L1, M1 and the dice AA lock-out) into
actionable items so they stop living as footnotes.

#### N2 — Performance benchmark & regression harness ○

- **What.** A reproducible large-vault benchmark: a synthetic fixture generator
  (N notes × M types, cross-note references, aggregates) plus timed runs of the
  index build, snapshot reads and aggregate evaluation — runnable locally and as
  an optional CI job, so a regression like the pre-3.7.0 full-vault re-scan is
  caught by a failing number instead of a code audit.
- **Considerations.** The measured paths are already pure (`core/property-index.ts`,
  `core/expr.ts`), so no Obsidian API is needed. Vitest's `bench` mode or a plain
  script both work. The fixture generator doubles as the test bed N1's aggregate
  memoization needs to prove itself against.
- **Barriers.** CI runner noise makes absolute wall-clock thresholds flaky —
  assert on *scaling* (e.g. a render-path read must not grow with vault size)
  and on call counts rather than milliseconds; keeping the synthetic vault
  representative of real frontmatter shapes.
- **Touchpoints.** New `tests/bench/`; `core/property-index.ts`; `vitest.config.ts`;
  `.github/workflows/test.yml` (optional job).
- **Steps.** Fixture generator → benchmark the index build / read / aggregate
  paths → scaling assertions → optional CI job → use as the acceptance gate for
  N1's memoization.

#### F6 — Integration tests over the Obsidian seam ○

- **What.** The pure modules sit at 160 unit tests after v3.7.0, but the seam
  code — write batching, the three-way merge, settings load and the corrupt
  `data.json` fallback — is verified only by hand. Grow `tests/stubs/obsidian.ts`
  into a fuller fake (vault files, metadata cache, change events) so whole flows
  run under Vitest: edit → batch write → re-read; external edit → merge or
  conflict prompt; corrupt file → defaults + backup.
- **Considerations.** A stub already exists — extend it per flow rather than
  building an emulator. Prioritize the data-loss-risk paths first, since those
  are exactly the ones the audit could only check by reading. Assert on
  observable outcomes (file contents, settings state), not on stub internals.
- **Barriers.** Fake fidelity vs. maintenance cost; DOM-heavy render flows would
  need jsdom (keep those to a later smoke-test step); the classic risk of
  testing the stub instead of the plugin.
- **Touchpoints.** `tests/stubs/obsidian.ts`; `vitest.config.ts`;
  `core/note-model.ts`, `core/merge.ts`, `core/settings.ts`.
- **Steps.** Extend the stub (vault + metadata events) → batch-write and merge
  flow tests → settings load / corrupt-file tests → optional jsdom render smoke
  tests.

#### G3 — Chart cells in the table view ○ (G2's deferral)

- **What.** Per-column display configuration in the type table view so a numeric
  column can render as a sparkline, bar or progress cell — the follow-up G2
  explicitly deferred for lack of per-column type config.
- **Considerations.** The geometry (`utils/chart.ts`) and renderer
  (`ui/render/charts.ts`) already exist and are pure/cheap SVG, which matters
  because virtualized rows re-render often. Column display config persists
  alongside the existing sort/filter persistence. Doing this is also the natural
  forcing function for extracting the shared cell renderers G1 (query blocks)
  needs — do the extraction once, use it twice.
- **Barriers.** Config UI surface in the column header menu; chart legibility at
  cell heights; keeping cell render cost flat under row virtualization.
- **Touchpoints.** `ui/table-view.ts` (column model + cell render);
  `ui/render/charts.ts`; `core/settings.ts` (persisted column display).
- **Steps.** Column display model → header-menu config UI → sparkline / progress
  cell renderers → persistence → share the extracted renderer with G1.

#### L2 — Value history & richer conflict handling ○ (L1's extensions)

- **What.** Extend L1 from configuration to *data*: a capped per-note history of
  property-value writes with a restore picker; a real merge UI for the conflicts
  that today fall back to the keep-mine / take-theirs prompt; and decryption
  support for the inline `prop:` / `val:` chips (the sidebar masks and unlocks
  today, the chips do not).
- **Considerations.** The D4 write queue already sees every value write — journal
  per-note diffs from there, capped and compacted, rather than adding a second
  write path. The merge UI can reuse the field list the conflict guard already
  computes. Chip decryption reuses the existing `core/secure.ts` session unlock;
  no new key handling.
- **Barriers.** History storage growth (cap + compaction policy); encrypted
  values must be journaled as envelopes, never plaintext; merge-UI scope creep —
  it only needs to handle the keys both sides changed.
- **Touchpoints.** `core/note-model.ts` (write journal); `core/snapshot-store.ts`;
  `core/merge.ts` plus a new modal in `ui/modals/`;
  `features/inline/inline-render.ts` + `core/secure.ts`.
- **Steps.** Capped write journal → per-note history panel + restore → merge
  modal for both-sides conflicts → inline chip unlock.

#### R1 — 3D dice anti-aliasing, second attempt ○

- **What.** Re-approach the anti-aliasing that shipped in v3.5.0 and was locked
  off in v3.5.2: the 2× supersample distorted the dice under CSS 3D. Goal: smooth
  face edges without geometry distortion, then re-enable the settings toggle.
- **Considerations.** Candidate approaches, roughly cheapest first: a subtle
  same-colour border / edge inset on each face polygon to soften the silhouette;
  uniform `scale3d` supersampling with corrected perspective (the v3.5.1 lesson —
  any transform must scale *all three* axes and compensate the perspective
  origin); or pre-rendering the solid to canvas. Prototype behind a dev flag and
  compare screenshots before committing to one.
- **Barriers.** CSS 3D + supersampling interact with z-depth and perspective in
  ways that broke twice already — this needs visual regression screenshots, not
  just eyeballing; GPU cost on mobile; the reduced-motion path must stay
  untouched.
- **Touchpoints.** `features/rolling/dice-styles.ts`, `dice-anim.ts`;
  `utils/polyhedra.ts` (per-face insets if that route wins); `styles.css`.
- **Steps.** Prototype 2–3 approaches behind a dev flag → screenshot comparison →
  pick (possibly per-platform) → re-enable the toggle → note the outcome here.

#### M2 — Dense-sheet keyboard composite & high-contrast preset ○ (M1's extensions)

- **What.** The two items M1 left as future work: a roving-tabindex composite
  inside an entry cluster (arrow keys move within a cluster, Tab moves between
  clusters) so dense sheets stop costing one Tab stop per control, and a bundled
  high-contrast theme preset over the `--ep-*` variable surface.
- **Considerations.** Follow the ARIA toolbar/grid composite patterns; build on
  the existing helpers in `utils/a11y.ts`. The preset ships as a Style Settings
  profile — no new theming machinery.
- **Barriers.** Roving tabindex must coexist with the virtualized table view and
  Obsidian's own focus handling; needs a screen-reader pass (update the
  ACCESSIBILITY.md checklist) rather than just keyboard testing.
- **Touchpoints.** `ui/render/section-renderer.ts`, `ui/render/entry-renderer.ts`;
  `utils/a11y.ts`; `styles.css`; ACCESSIBILITY.md.
- **Steps.** Composite prototype in the sidebar → extend to the table view →
  high-contrast preset → re-run and update the manual a11y checklist.

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
- **Milestone 11** (N2, F6, G3, L2, R1, M2): do **N2 and F6 first** — they are
  cheap, they de-risk everything else (N2 is the acceptance gate for N1's
  memoization and therefore for G1/H1 at scale; F6 protects exactly the data
  paths L2 will touch), and they pay for themselves on the next audit. G3 pairs
  naturally with G1's renderer extraction. R1 and M2 are independent polish that
  can slot in anywhere.
