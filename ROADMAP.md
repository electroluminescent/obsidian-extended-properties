# Extended Properties — roadmap

**Status: v3.8.0.** The original feature roadmap (milestones 1–6) is fully
implemented, and forward-roadmap items **L1 (history & safe sync, v3.1.0)**,
**G2 (inline charts & sparklines, v3.2.0)** and **M1 (accessibility completion,
v3.6.0)** have shipped. Releases v3.3.0–v3.5.5 added the 3D-dice presentation plus
a run of roll, mobile and robustness polish (see *Dice presentation & polish*
below). v3.7.0–v3.8.0 were quality passes over a codebase audit (see *Hardening
pass* and *Audit fixes* below); their findings drove a re-planning of the
forward roadmap into **milestones 12–17** — sequenced by dependency, with
sizes, risks and done-when criteria — at the bottom of this document. This
document is consolidated: it records what shipped — without the original
per-feature planning notes — and lays out the sequenced forward plan.

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

### Audit fixes (v3.7.1–v3.8.0) ✅

The deep-read audit that followed v3.7.0 found eight concrete gaps; all shipped
across two releases. **v3.7.1 — the table view joins the safe paths:** cell and
checkbox edits write through a single plugin-wide `NoteFacade` (batched,
conflict-guarded, three-way-merged) instead of raw `processFrontMatter`; rows
are served from the `PropertyIndex` snapshot cache — no vault re-scan per
render or filter keystroke — with refreshes scoped to files that are (or were)
rows of the shown type; and pending inline/table writes flush on plugin unload
(`NoteFacade.flushAll`), closing a small data-loss window. **v3.8.0 — quality
pass:** edit-session undo awaits its writes and surfaces failures; settings
load structurally validates `types` and `layouts` (the shape-checking
`inlineEntries` got in v3.7.0, now with tests); the type table became
keyboard-accessible (header sort is a real button with `aria-sort`, cells edit
with Enter/Space, resize grips are focusable separators — see
ACCESSIBILITY.md); a new `ClusterAddon.onRename` hook moved the last
feature-owned field knowledge out of the core view; `showWhen` conditions
evaluate once per refresh pass; and roll history moved out of `data.json` into
its own `roll-history.json` (one-time migration), so a settings save no longer
reserializes hundreds of roll records.

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

**Re-planned after v3.8.0.** Milestones 7–11 (the first forward plan) are
superseded by **milestones 12–17** below. Every item id carries over — nothing
was dropped — but items are regrouped by *dependency* rather than by theme,
and each milestone now states a goal, a done-when, and per-item sizes.
Nothing here is committed; it is a design backlog in build order.

Item format stays **What · Considerations · Barriers · Touchpoints · Steps**.
Sizes are rough: **S** fits a patch/point release, **M** a minor release,
**L** spans releases.

### Dependencies (why this order)

- **Milestone 12 — Foundations** gates everything that touches performance or
  the data path: N2's benchmark is the acceptance gate for N1's memoization,
  and F6's seam tests protect exactly the write paths L2 and H1 will modify.
  It is also the cheapest milestone — it pays for itself at the next audit.
- **Milestone 13 — Query & visualize** needs N1's aggregate scale (12) and
  produces the shared cell renderer its own G3 — and later work — reuses.
- **Milestone 14 — Relationships & authoring** builds on the index layers
  from 12/13 (relation edges are a third consumer of the same invalidation
  seam).
- **Milestone 15 — Value history & conflicts** extends the write seam F6 has
  pinned down; doing it before F6 would mean modifying an untested data path.
- **Milestone 16 — Interaction polish** is independent; slot into any release.
- **Milestone 17 — Ecosystem & listing** is ongoing; the directory submission
  (P1) makes sense once 12 has landed (a stability story to tell reviewers)
  and does not need to wait for 13.

### Release mapping (indicative, not committed)

- **v3.9.x** — Milestone 12 (N2, F6, N1 completion).
- **v4.0.0** — Milestone 13 (G1 query blocks + G3 chart cells) — the flagship
  release; the shared-renderer extraction is the largest internal refactor
  since the registry split, which is what earns the major.
- **v4.1.x** — Milestone 14 (H1, H2).
- **v4.2.x** — Milestone 15 (L2).
- Milestone 16 items (M2, R1) ride whichever train has room; Milestone 17
  runs continuously, with P1 targeted right after v3.9.

### Risk register (cross-cutting)

Likelihood/impact: L low · M medium · H high.

| Risk | Where it bites | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| Private Obsidian APIs drift (`metadataTypeManager`, `commands.removeCommand`) | property-type detection, macro commands | M | M | Both call sites are try/catch-guarded and degrade gracefully; F6's stub pins the expected shapes so a break becomes a failing test, not a user report. |
| Committed `main.js` drifts from `src/` | manual + BRAT installs ship stale code | M | M | Happened twice before v3.7.1 (bundle lagged a release). N2 adds a CI guard that rebuilds and diffs the bundle. |
| Performance claims stay unmeasured | N1, G1, any large vault | M | H | N2 lands first; assert on scaling and call counts, never wall-clock in CI. |
| Cache-invalidation bugs | N1 aggregate cache, N1 type buckets, H1 relation edges | M | H | Every cache hangs off the one existing invalidation seam (`invalidateFile`/`invalidatePath`); the `crossNote` kill-switch stays the user-facing escape hatch; fixture tests per cache layer. |
| Data loss at the write seam | D4 queue, three-way merge, unload flushes, L2 journal, history migration | L | H | All writes funnel through `NoteModel`/`NoteFacade` since v3.7.1 — one seam to test; F6 covers it before L2 builds on it. |
| G1 scope creep ("a query language") | Milestone 13 | H | M | Declarative block schema with a handful of keys, no free grammar; differentiate on *typed, editable* cells (Dataview owns read-only queries); grouping is explicitly out of v1. |
| a11y regressions | every UI release | M | M | ACCESSIBILITY.md manual checklist per release; M2 extends coverage; F6's jsdom smoke step can pin roles/labels later. |
| Community-review friction | P1 | M | M | Pre-submission self-review: the `window.ExtendedProperties` global, the two private-API call sites and command naming are the likely flags — prepare rationale or alternatives before submitting. |
| Single-locale i18n debt | non-English users | L | L | The locale *mechanism* and parity checker are kept (F4); community dictionaries can slot back in without code changes. |

### Milestone 12 — Foundations: measure, test, finish the index ○ (target v3.9)

**Goal.** Turn the two things the v3.7.0–v3.8.0 audits could only check by
reading code — performance and the Obsidian seam — into things a failing check
catches automatically, then finish N1 against that gate.
**Done when.** The benchmark suite runs in CI with scaling assertions; the
data-loss-risk flows run under Vitest against the vault fake; aggregate reads
no longer re-reduce the full snapshot set on the benchmark fixture; CI fails
on a stale `main.js`.

#### N2 — Performance benchmark & regression harness ○ (S)

- **What.** A reproducible large-vault benchmark: a synthetic fixture
  generator (N notes × M types, cross-note references, aggregates) plus timed
  runs of the index build, snapshot reads and aggregate evaluation — runnable
  locally and as a CI job, so the next regression like the pre-v3.7.0
  full-vault re-scan (or the table view's copy of it, fixed in v3.7.1) is a
  failing number instead of a code-reading find.
- **Considerations.** The measured paths are pure (`core/property-index.ts`,
  `core/expr.ts`, `core/influences.ts`) — no Obsidian API needed. Vitest's
  `bench` mode or a plain script both work. The fixture doubles as the
  acceptance gate for N1's memoization, and later for G1's executor.
- **Barriers.** CI runner noise makes absolute wall-clock thresholds flaky —
  assert on *scaling* (a render-path read must not grow with vault size) and
  on call counts, never milliseconds; keeping the synthetic vault
  representative of real frontmatter shapes.
- **Touchpoints.** New `tests/bench/`; `vitest.config.ts`;
  `.github/workflows/test.yml`.
- **Steps.** Fixture generator → benchmark the index build / read / aggregate
  paths → scaling assertions → CI job → also in CI: rebuild `main.js` and
  fail when the committed bundle differs (it drifted a release behind twice
  before v3.7.1).

#### F6 — Integration tests over the Obsidian seam ○ (M)

- **What.** The pure modules sit at 162 unit tests, but the seam — the write
  queue, the three-way merge, settings load, the unload flushes, the
  roll-history migration — is verified only by hand, and v3.7.1/v3.8.0 grew
  it. Extend `tests/stubs/obsidian.ts` into a fuller fake (vault files,
  metadata cache, change events) so whole flows run under Vitest.
- **Considerations.** Extend the stub per flow, not into an emulator.
  Priority order = data-loss risk: batch write → merge/conflict; corrupt
  `data.json` → defaults + backup; `flushAll`/`flushPending` on unload; the
  one-time roll-history migration; `revertUndo`. Assert on observable
  outcomes (file contents, settings state), never on stub internals.
- **Barriers.** Fake fidelity vs. maintenance cost; DOM-heavy render flows
  need jsdom — keep those to a later smoke step; the classic risk of testing
  the stub instead of the plugin.
- **Touchpoints.** `tests/stubs/obsidian.ts`; `vitest.config.ts`;
  `core/note-model.ts`, `core/merge.ts`, `core/settings.ts`,
  `features/rolling/history.ts`.
- **Steps.** Stub vault + metadata events → batch-write & merge flow tests →
  corrupt-load tests → unload-flush tests → history-migration test →
  optional jsdom render smoke.

#### N1 — Aggregate memoization & large-vault scale ◑ (M)

- **What.** Memoize cross-note aggregates with dependency tracking, add
  per-type file buckets, and optionally move heavy aggregation to a worker
  for very large vaults.
- **Shipped so far.** The per-file frontmatter snapshot cache (v3.7.0) and
  its second consumer, the table view's `rowsByType` (v3.7.1). **Remaining:**
  every `sum()/avg()/count()` call still re-filters and re-reduces the full
  snapshot set on every read, and `rowsByType` scans all snapshots rather
  than a type bucket.
- **Considerations.** Two layers riding the same invalidation events the
  snapshot cache already uses: a type → files bucket index (serves
  `rowsByType` and aggregate candidate sets) and an aggregate cache keyed
  `(type, key, fn)` with dirty flags. N2's fixture is the acceptance gate. A
  worker can't touch the Obsidian API, so it only ever receives plain
  serialized data — gate it behind a vault-size threshold.
- **Barriers.** Invalidation breadth is the classic hard part: an aggregate
  over `(type, key)` must invalidate when any note of that type changes `key`
  *or* its `Type` list — bucket moves are the subtle case (a note gaining or
  losing a type must dirty both buckets). Worker serialization can cost more
  than it saves on small vaults.
- **Touchpoints.** `core/property-index.ts` (buckets + aggregate cache);
  `core/influences.ts` (aggregate call sites); build config (optional worker
  entry).
- **Steps.** Type buckets → aggregate cache + invalidation → verify on the N2
  fixture → optional worker behind a threshold.

### Milestone 13 — Query & visualize ○ (target v4.0)

**Goal.** The flagship: vault data as live, *editable* views inside notes.
**Done when.** An `ep-query` block filters, sorts and renders notes of a type
with type-aware, in-place-editable cells; table columns can render charts;
both reuse a single shared cell-renderer module; render cost on the N2
fixture is bound by the index, not by vault size.

#### G1 — Query blocks (`ep-query`) ○ (L)

- **What.** A code block that queries notes by type and property predicates and
  renders the result as a table, list or cards — `from "Character" where Level >= 5
  sort by Dexterity desc`. Columns are properties; cells use the same type-aware
  widgets as the table view and edit in place.
- **Considerations.** Almost every part now exists: `evalCondition` for the
  `where` clause, `PropertyIndex.rowsByType()` (v3.7.1) for the candidate set
  (N1's type buckets make it cheap), the table view's cell renderers for
  output, the shared `NoteFacade` for in-place edits, and the aggregate
  functions for summary rows. A small declarative block schema — a handful of
  keys — beats inventing a query language. For live refresh, generalize the
  table view's scoped-refresh pattern (v3.7.1): skip the rebuild unless the
  changed file is, or was, in the result set.
- **Barriers.** Scope creep is the top risk (see register): the v1 line is
  filter → sort → render, no grouping. Re-render thrash on vault events
  (debounce + the scoped check). Overlap with Dataview — differentiate on
  *typed, editable* cells rather than read-only output. Performance is gated
  on N1 (Milestone 12).
- **Touchpoints.** New `src/features/query/`; extract `renderValue` and its
  helpers out of `ui/table-view.ts` into a shared `ui/render/cells.ts`;
  `core/property-index.ts`; `core/expr.ts`.
- **Steps.** Extract the shared cell renderer (G3 shares this step) → block
  schema (`from` / `where` / `columns` / `sort` / `render`) → index-backed
  executor → render modes (table / list / cards) → in-place edit through the
  facade → scoped live refresh → respect the cross-note kill-switch.

#### G3 — Chart cells in the table view ○ (S)

- **What.** Per-column display configuration in the type table so a numeric
  column can render as a sparkline, bar or progress cell — the follow-up G2
  explicitly deferred for lack of per-column type config.
- **Considerations.** The geometry (`utils/chart.ts`) and renderer
  (`ui/render/charts.ts`) are pure, cheap SVG — that matters because
  virtualized rows re-render on every scroll window. Persist the choice in
  `TableLayout` (a `display` map beside `widths`), riding the existing
  per-type persistence.
- **Barriers.** Config surface in the header menu; chart legibility at ~29 px
  row height; keeping cell cost flat under row virtualization.
- **Touchpoints.** `ui/table-view.ts` (column model); the shared cell module
  from G1; `core/model.ts` (`TableLayout.display`).
- **Steps.** Column display model → header-menu config → sparkline / progress
  cell renderers in the shared module → persistence.

*G2 — inline charts & sparklines — shipped in v3.2.0 (see the Visualization
entry above); G3 is its recorded deferral.*

### Milestone 14 — Relationships & authoring ○ (target v4.1)

**Goal.** Notes that know about each other, and one-command note creation from
a type.
**Done when.** A `relation` value type with a lazily maintained inverse works
through the index; `backlinks()` / `relatedTo()` resolve in expressions; a
*New \<Type\> note* command scaffolds a note with the type's properties and an
optional body template.

#### H1 — Typed relations & backlinks ○ (L)

- **What.** A first-class `relation` value type: a link property with a declared
  inverse, plus expression accessors — `backlinks()`, `relatedTo("Faction")` — and
  derived "referenced by" counts/lists, so a note can compute over the notes that
  point at it.
- **Considerations.** Store relations as ordinary link properties (portable, no
  hidden state). Maintain the inverse *lazily* through the index: relation
  edges live beside the frontmatter snapshot cache and invalidate through the
  same `invalidateFile` / `invalidatePath` seam — a third consumer of the
  wiring N1's buckets already share, no new events. Reuse the expression
  engine's cycle detection for relation chains.
- **Barriers.** Eager inverse writes would cause write storms — optional
  inverse maintenance must ride the shared `NoteFacade` batch queue with its
  echo suppression (v3.7.1 made that queue plugin-wide); edge correctness on
  rename/delete (the invalidation seam already handles both); cross-note
  reads stay cycle-free because they read raw stored values.
- **Touchpoints.** `core/property-index.ts` (edge map); `core/expr.ts`
  (relation functions); new `relation` value type in the registry;
  `core/note-model.ts` (opt-in inverse writes).
- **Steps.** Relation value type → index relation edges → expression accessors →
  backlink-derived properties → optional (opt-in) inverse maintenance.

#### H2 — Note scaffolding from types ○ (M)

- **What.** A *New \<Type\> note* command that creates a note pre-stamped with the
  type's properties (empty, hidden from Obsidian's panel) and an optional per-type
  body template — extending the existing "template section writes empty hidden
  props" behaviour to whole-note creation.
- **Considerations.** Per-type body template stored either in settings or as a
  pointer to a vault template file (the D2 layout-store folder is a natural
  home); if core Templates / Templater is present, insert into the flow rather
  than fight it; configurable target folder and naming.
- **Barriers.** Overlap and ordering conflicts with existing template plugins;
  where the body template lives (vault file vs. settings blob); frontmatter key
  ordering on creation.
- **Touchpoints.** `core/settings.ts` (per-type template ref); `main.ts` (command +
  palette); `core/note-model.ts` (create + initial write).
- **Steps.** Per-type template config → create-note command → write hidden props →
  optional body insert → folder / naming options.

### Milestone 15 — Value history & richer conflicts ○ (target v4.2)

**Goal.** Extend L1's trust story from *configuration* to *data*.
**Done when.** Every property write can be traced and restored per note
(capped journal); conflicts both sides changed get a real merge UI instead of
only keep-mine / take-theirs; inline chips decrypt via the session unlock.

#### L2 — Value history & richer conflict handling ○ (L)

- **What.** A capped per-note history of property-value writes with a restore
  picker; a real merge UI for the conflicts that today fall back to the
  keep-mine / take-theirs prompt; and decryption support for the inline
  `prop:` / `val:` chips (the sidebar masks and unlocks today, the chips do
  not).
- **Considerations.** Since v3.7.1 every value write funnels through
  `NoteModel`/`NoteFacade` and both flush on unload — journal per-note diffs
  from that one seam (capped and compacted) rather than adding a second write
  path, and the journal can't lose tail writes. The merge UI reuses the field
  list the conflict guard already computes. Chip decryption reuses the
  existing `core/secure.ts` session unlock; no new key handling. Build only
  after F6 (Milestone 12) has the seam under test.
- **Barriers.** History storage growth (cap + compaction policy — and it
  belongs in its own file, following the v3.8.0 roll-history precedent, not in
  `data.json`); encrypted values must be journaled as envelopes, never
  plaintext; merge-UI scope creep — it only needs the keys both sides changed.
- **Touchpoints.** `core/note-model.ts` (write journal); `core/snapshot-store.ts`;
  `core/merge.ts` plus a new modal in `ui/modals/`;
  `features/inline/inline-render.ts` + `core/secure.ts`.
- **Steps.** Capped write journal (own file) → per-note history panel +
  restore → merge modal for both-sides conflicts → inline chip unlock.

*L1 — history & safe sync — shipped in v3.1.0 (see Trust & safe sync above);
its recorded future extensions are exactly this milestone.*

### Milestone 16 — Interaction polish ○ (any release)

**Goal.** Finish M1's two deferrals and unlock the disabled dice AA.
**Done when.** Dense sheets navigate with one Tab stop per entry (arrows move
within); a bundled high-contrast preset ships; the 3D-dice anti-alias toggle
is re-enabled with an approach that survives CSS 3D.

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

#### M2 — Dense-sheet keyboard composite & high-contrast preset ○ (M)

- **What.** The two items M1 left as future work: a roving-tabindex composite
  *inside* an entry's control cluster (arrow keys move within a cluster, Tab
  moves between entries) so dense sheets stop costing one Tab stop per
  control, and a bundled high-contrast theme preset over the `--ep-*`
  variable surface. (The type table got its separate keyboard pass in v3.8.0
  — this item is now purely the sidebar composite plus the preset.)
- **Considerations.** Follow the ARIA toolbar/grid composite patterns; build
  on `utils/a11y.ts` and E1's existing *entry-level* roving tabindex — the
  new composite nests inside it (entry level ↔ control level), and that
  nesting is the design risk to prototype first. The preset ships as a Style
  Settings profile — no new theming machinery.
- **Barriers.** Nested roving focus coexisting with Obsidian's own focus
  handling and the virtualized table view; needs a screen-reader pass
  (update the ACCESSIBILITY.md checklist), not just keyboard testing.
- **Touchpoints.** `ui/render/section-renderer.ts`, `ui/render/entry-renderer.ts`,
  `ui/render/cluster.ts`; `utils/a11y.ts`; `styles.css`; ACCESSIBILITY.md.
- **Steps.** Composite prototype in the sidebar → extend across entry kinds →
  high-contrast preset → re-run and update the manual a11y checklist.

#### R1 — 3D dice anti-aliasing, second attempt ○ (S–M)

- **What.** Re-approach the anti-aliasing that shipped in v3.5.0 and was
  locked off in v3.5.2: the 2× supersample distorted the dice under CSS 3D.
  Goal: smooth face edges without geometry distortion, then re-enable the
  settings toggle.
- **Considerations.** Candidate approaches, roughly cheapest first: a subtle
  same-colour border / edge inset on each face polygon to soften the
  silhouette; uniform `scale3d` supersampling with corrected perspective (the
  v3.5.1 lesson — every axis must scale and the perspective origin must
  compensate); or pre-rendering the solid to canvas. Prototype behind a dev
  flag and compare screenshots before committing.
- **Barriers.** CSS 3D + supersampling interact with z-depth and perspective
  in ways that broke twice already — this needs visual-regression
  screenshots, not eyeballing; GPU cost on mobile; the reduced-motion path
  must stay untouched.
- **Touchpoints.** `features/rolling/dice-styles.ts`, `dice-anim.ts`;
  `utils/polyhedra.ts` (per-face insets if that route wins); `styles.css`.
- **Steps.** Prototype 2–3 approaches behind a dev flag → screenshot
  comparison → pick (possibly per-platform) → re-enable the toggle → record
  the outcome here.

### Milestone 17 — Ecosystem & community listing ○ (ongoing)

**Goal.** Make the plugin easy to discover and easy to extend.
**Done when.** The plugin is listed in Obsidian's community directory, and a
third-party module can contribute a settings panel, a command and a value-type
editor without forking.

#### P1 — Community plugin directory listing ○ (M)

- **What.** Submit to `obsidianmd/obsidian-releases` per the runbook in
  [RELEASING.md](RELEASING.md) §4: public repo, published (non-draft) release
  with the three assets, then the `community-plugins.json` PR and review.
- **Considerations.** BRAT already serves beta users, so there is no urgency
  pressure — but review queues run weeks to months, so submit early relative
  to Milestone 13 rather than waiting for the flagship. Target right after
  Milestone 12: the stability story (bench + seam tests + the v3.7.x/3.8.0
  hardening run) is the best reviewer-facing evidence. Split the README
  (~30 KB single file) into a quick start and a reference before submitting —
  reviewers and new users both benefit.
- **Barriers.** Guideline review will likely flag: the
  `window.ExtendedProperties` global (needed for the cross-plugin API —
  prepare the rationale; an `app.plugins`-based access path already exists as
  the documented alternative), the two guarded private-API call sites
  (`metadataTypeManager`, `commands.removeCommand`), and mobile behaviour —
  `isDesktopOnly: false` claims phone support, so a real mobile QA pass is a
  prerequisite, not a nice-to-have.
- **Touchpoints.** README (split); `manifest.json` (optional `fundingUrl`);
  `.github/workflows/release.yml` (already tag-triggered);
  `community-plugins.json` PR.
- **Steps.** Self-review against the plugin guidelines → mobile QA pass on a
  phone vault → README split → publish a non-draft release → submit the PR →
  respond to review (expect at least one round).

#### K1 — API v2 & module ecosystem ○ (L, ongoing)

- **What.** Grow the public API into richer contribution points: module-supplied
  settings panels, palette commands, inline tokens and value-type editors; a
  module template repo; and more bundled optional modules (other RPG systems,
  habit / fitness / recipe trackers).
- **Considerations.** v3.8.0's `ClusterAddon.onRename` is the working pattern:
  optional members on existing contracts grow the API *without* bumping
  `apiVersion`. Keep accreting that way and reserve the v2 bump for a
  genuinely breaking change. Contribution points stay declarative (modules
  describe what they add); the registry already isolates module errors and
  reserves built-in ids.
- **Barriers.** Balancing API stability against growth; Obsidian does not sandbox
  plugin code, so third-party modules run with full trust (document this
  loudly); maintenance burden of every bundled module.
- **Touchpoints.** `src/api.ts`; `core/registry.ts`; `ui/settings-tab.ts` (module
  panels); docs.
- **Steps.** Settings-panel + command contribution points → inline-token hook →
  value-type editor hook → publish a module template repo → bump `apiVersion`
  to 2 only when a breaking change forces it.

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
