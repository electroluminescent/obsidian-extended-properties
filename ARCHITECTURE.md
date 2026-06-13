# Architecture

This document explains how the plugin is structured, why it is structured
that way, and exactly what to touch when extending it.

## Design goals

1. **Modularity.** The core renders *layouts of entries*; it has no idea what
   a "saving throw" is. Everything domain-specific is a feature module that
   plugs into registries. Deleting `src/features/dnd5e/` (and its one line in
   `main.ts`) removes all D&D functionality without breaking anything.
2. **Consistent, configurable UI language.** Every user-visible string flows
   through one i18n service. Users pick a locale and can override any
   individual string in settings.
3. **Stable persisted data.** `data.json` written by v1 loads unchanged;
   feature modules persist extra entry fields without widening core types.

## Layer map

```
src/
├── main.ts                  Plugin entry. Wiring only: builds services,
│                            registers view/commands, assembles registries.
├── core/                    No UI. No Obsidian view code. No feature knowledge.
│   ├── model.ts             Persisted shapes: Entry, Section, Layout, EPSettings.
│   ├── settings.ts          Defaults + migration of any historical data.json.
│   ├── registry.ts          Extension points (see below) + ServiceHub.
│   ├── influences.ts        The influence engine: user-editable modifier math
│   │                        (derivation blocks, toggles, short forms).
│   ├── context.ts           ViewCtx & friends — the contracts renderers use.
│   ├── note-model.ts        Frontmatter state: read/write, echo suppression,
│   │                        session undo for edit mode.
│   ├── layout-ops.ts        Pure structural mutations (move/swap/reorder,
│   │                        grid rows & columns). No persistence, no DOM.
│   ├── property-index.ts    Vault-wide property queries.
│   └── hide-service.ts      Hiding properties from Obsidian's panel (CSS).
├── i18n/
│   ├── i18n.ts              t(key, vars): override → locale → en → humanized.
│   └── locales/en.ts, de.ts Core dictionaries (features bring their own).
├── ui/
│   ├── view.ts              SidebarView. Orchestration + ViewCtx implementation.
│   ├── render/
│   │   ├── section-renderer.ts  Section chrome, layout modes, cluster flags.
│   │   ├── entry-renderer.ts    Entry shell; dispatches to entry kinds.
│   │   ├── cluster.ts           Aligned control strip ([slots][−][value][+][slots]).
│   │   ├── modifier-addon.ts    Influence UI: denotation badge, toggles, editor.
│   │   ├── value-types/         text, numeric, derived, basic (checkbox/list/
│   │   │                        color), media (image/iframe) + core registration.
│   │   └── entry-kinds/         prop, blank, toc.
│   ├── components/          suggest, inline-edit, links, popups, setting rows.
│   ├── menus/               entry, section, and Obsidian-panel context menus.
│   ├── modals/              dialogs, color/icon pickers, image viewer,
│   │                        entry-options, section-options.
│   ├── drag.ts              Drag & drop → layout-ops. FLIP animations.
│   └── settings-tab.ts      Settings incl. language, derivation blocks,
│                            short forms and string overrides.
└── features/
    ├── rolling/             Dice model & UI, roll service & log panel, the
    │                        roll-button addon, the legacy "skills" type
    │                        (with conversion to derived properties).
    └── dnd5e/               5e data: skill presets, section templates built
                             on derived entries, layout preset, migrations.
```

Dependency rules (enforced by review, worth keeping):

- `core/` imports nothing from `ui/` or `features/` (types in `context.ts`
  are interfaces only).
- `ui/` imports `core/` and `i18n/`, never `features/`.
- `features/*` import `core/` and `i18n/` (and Obsidian). They reach the UI
  exclusively through registry contracts.
- `main.ts` is the only file that knows which features exist.

## Extension points (`core/registry.ts`)

| Registry            | Contract             | Adds…                                            |
| ------------------- | -------------------- | ------------------------------------------------ |
| `valueTypes`        | `ValueTypeDef`       | How a property value renders/edits ("color", …)  |
| `entryKinds`        | `EntryKindDef`       | Non-property widgets ("toc", roll panel, …)      |
| `clusterAddons`     | `ClusterAddon`       | Extra cells on numeric rows (mod badge, roll)    |
| `derivations`       | `DerivationDef`      | Modifier math blocks (compiled from settings)    |
| `sectionTemplates`  | `SectionTemplateDef` | One-click sections in the edit toolbar           |
| `layoutPresets`     | `LayoutPresetDef`    | Full default layouts for new note types          |
| `skillPresets`      | `SkillPresetDef`     | Record sets for the legacy "skills" value type   |

The core's own value types and entry kinds register through the same
interfaces (`ui/render/value-types/index.ts`) — there is no privileged path,
so anything the built-ins can do, a feature can do.

### The influence engine (`core/influences.ts`)

Any numeric entry (including the read-only "derived" value type) can carry
`mods: Influence[]` — a list of terms summed into its modifier. Each term
is built from user-editable blocks:

- **source** — a property key, referenced by name (unset = the entry's own
  property). Templates that rely on sources declare them
  (`SectionTemplateDef.sources`), so applying e.g. the Skills template also
  creates any missing source properties as real entries.
- **mode** — a *derivation*: "value", a named formula block from settings
  (`settings.derivations`, seeded with "Ability modifier" and "Proficiency
  bonus"; all editable in the settings tab), or a per-influence custom
  formula in `x`.
- **weight** — adds or subtracts the term.
- **toggle** — a list property that switches the term per note (the generic
  form of proficiency): the term applies while the entry's key or alias is
  in that list; the row gets a checkbox bound to the list.

The denotation shown next to values is the sum of the sources' *short
forms* ("INT + DEX − AGE"). A short form defaults to the capitalized first
three letters of the source property and can be overridden per property
(`settings.sourceAbbrs`, editable inline and in the settings tab).

UI lives in `ui/render/modifier-addon.ts` (badge, toggles, influence
editor) and `ui/render/value-types/derived.ts` (computed values such as
proficiency bonus, initiative, saves and skills — all ordinary entries,
no bespoke widgets).

### The render pipeline

```
SidebarView.render()
└─ section-renderer (per section)
   ├─ computeFlags(): union of ClusterNeeds over all entries
   │    └─ EntryKindDef.clusterNeeds → ValueTypeDef.clusterNeeds → ClusterAddon.needs
   └─ entry-renderer (per entry)
      ├─ shell: wrapper, grip, icon, ⋯ menu, context menu, drag wiring
      └─ EntryKindDef.render(ctx)
           └─ "prop" → ValueTypeDef.render(ctx)
                └─ numeric types → ClusterAddon.fillSlots(...)
```

`ClusterFlags` exist so every numeric row in a section shares one grid
template — values align vertically even when only some rows have steppers,
modifier badges, or roll buttons. Entries that skip a slot still render an
empty cell of the same width.

### Refresh strategy

Renderers register *updaters* (`view.registerUpdater`) that re-read state and
patch their DOM in place. External frontmatter edits run the updaters; the
view fully re-renders only when entry *visibility* would change (it tracks an
"empty signature" of all bound keys), when the structure changed, or on note
switch. `NoteModel` stamps its own writes and swallows the echo events
Obsidian fires for them.

### Per-view services (`ServiceHub`)

Features sometimes need shared state inside one view — the roll mode is used
by roll buttons (addon), computed entries and save/skill blocks.
`view.hub.get(key, factory)` lazily creates such a service; `onFileChange()`
lets it react to note switches. Renderers never hold references to each other.

Roll **history**, by contrast, belongs to the plugin, not a view: it must
survive note switches and be shared across windows (popouts share the one
plugin instance). `HistoryService` (`features/rolling/history.ts`) is owned by
`main.ts`, exposed on `ViewCtx` as `view.history`, and persisted (debounced)
into `settings.rollHistory`. The per-view `RollService` only appends records
and is constructed with the history plus the `App` (to attribute each record
to the active note). Saved roll **macros** live in `settings.macros`; one
command is registered per macro and kept in sync on settings save.

## i18n

`I18n.t(key, vars)` resolves: user override → active locale → English →
humanized key (so a missing key degrades gracefully, never crashes).
Locales are open dictionaries: `i18n.register("en", dict)` merges, which is
how feature modules ship their own strings (`features/dnd5e/strings.ts`).
The settings tab exposes a locale dropdown plus a searchable per-string
override editor backed by `settings.stringOverrides`.

Conventions: keys are dot-namespaced by surface (`entry.menu.*`,
`sectionOptions.*`, `dnd.*`); placeholders use `{name}`; English text uses
sentence case and the fixed vocabulary *property / section / entry / sidebar*.

## Persisted data

`EPSettings` (see `core/model.ts`) is written verbatim to `data.json`.
Compatibility rules:

- `Entry` keeps an open index signature; feature fields (e.g. `roll`,
  `mods`, `dice`) stay flat exactly as earlier versions wrote them. Features
  read them through the `ext<T>(entry)` helper for typing.
- `normalizeSettings` migrates the v1 single-layout shape and fills any new
  fields with defaults. Never remove that path.
- Section/template ids ("vitals", "skills", …) are stable — "reset this
  template section" matches by id.
- Module `migrate()` hooks upgrade layouts: rolling converts the v2 roll
  fields (`roll: "abilityMod"`, `rollSource`) to influence lists; dnd5e
  converts "computed" and the v2.0 "saves"/"skills" kinds to derived
  property entries.

## How to: add a feature module

1. Create `src/features/<id>/` with an `index.ts` exporting a
   `FeatureModule` (`id`, `name`, `description`, `register`).
2. In `register(ctx)`, add entry kinds / value types / addons / templates /
   presets to `ctx.registries`, and merge locale dicts into `ctx.i18n`.
3. List the module in `FEATURE_MODULES` in `src/main.ts` (order matters
   only when one module builds on another's types, as dnd5e does on
   rolling's skills type).
4. Optionally implement `migrate(settings)` to upgrade data persisted by
   older versions (dnd5e converts its legacy saves/skills entry kinds).

The module automatically appears as a toggle under Settings → Features.
Disabled modules simply don't register: their entry kinds render as an
"Unavailable" stub and their templates disappear, while layouts and note
properties stay untouched.

## How to: add a value type

Implement `ValueTypeDef` (render + optional `clusterNeeds`, `renderOptions`,
`menuItems`) and register it — from `registerCore` for built-ins or from a
feature module. It immediately shows up in every data-type dropdown.

## How to: add a locale

Create `src/i18n/locales/<code>.ts` exporting a `StringDict`, register it in
`main.ts` (`i18n.register("<code>", dict, "Display name")`), and add the
feature-module strings for that locale if desired. Missing keys fall back to
English.

## Build

```
npm install
npm run build    # esbuild: src/main.ts → main.js (CJS, bundled)
npx tsc --noEmit # typecheck (strictNullChecks, noUnusedLocals)
```
