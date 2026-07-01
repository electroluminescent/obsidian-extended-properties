# Architecture & public API

Extended Properties is a generic shell around a set of **registries**. The
sidebar never hard-codes what a property *is*; it looks up value types, entry
kinds, cluster addons, derivations, section templates and layout presets in
`src/core/registry.ts`. A **feature module** bundles registrations plus locale
strings, so a domain (dice, D&D 5e, inline rolls) lives entirely in
`src/features/<id>/` and can be toggled in settings without the core knowing it
exists.

Two principles run through the code:

1. **Keep Obsidian out of the math.** The data model, expression/influence
   engine, dice engine, validation, conditions, transfer and settings migrations
   are pure modules (`src/core/*`, `src/utils/*`) with no `obsidian` import, so
   they are unit-tested directly under Vitest. UI code (`src/ui/*`) is the only
   layer that touches the Obsidian API.
2. **Everything domain-specific is a module.** The core knows nothing about dice
   or D&D; those are feature modules that register into the same tables a
   third-party plugin would use (see *Public API* below).

## Layout of the codebase

| Path | Responsibility |
| --- | --- |
| `src/core/` | Data model (`model.ts`), registries (`registry.ts`), the influence engine (`influences.ts`), expression engine (`expr.ts`), validation (`validate.ts`), export/import (`transfer.ts`), note I/O (`note-model.ts`), three-way merge (`merge.ts`), vault-file layouts (`layout-store.ts`), config snapshots (`snapshot-store.ts`), value encryption (`secure.ts`), settings normalize + migrations (`settings.ts`). No UI, no feature knowledge. |
| `src/ui/` | The sidebar `ItemView` (`view.ts`), the type table view (`table-view.ts`), renderers (`render/*`), menus (`menus/*`), settings tab (`settings-tab.ts`), and reusable components (`components/*`, including the popup helpers and the `[[`-autocomplete `suggest.ts`). |
| `src/features/` | Optional modules — `rolling/` (dice + history + macros, plus the modular roll-animation styles and the 3D-polyhedra dice: `dice-styles.ts`, `dice-anim.ts`), `dnd5e/` (character-sheet templates/presets), `inline/` (`roll:` / `prop:` / `val:` / `vals:` and the `ep-sheet` block). Each owns a `strings.json`. |
| `src/i18n/` | The localization service plus JSON dictionaries loaded through thin typed shims (`locales/en.json`). |
| `src/utils/` | Obsidian-free helpers: `dice.ts`, `dice-expr.ts`, colour math, formula parsing, `sound.ts`, `a11y.ts`, chart geometry (`chart.ts`), and the 3D-dice polyhedra geometry (`polyhedra.ts`, unit-tested). |
| `src/api.ts` | The frozen public surface (see below). |
| `scripts/i18n-check.mjs` | Locale key-parity checker (CI + `npm run i18n`). |
| `tests/` | Vitest specs over the pure modules + a golden settings-migration fixture. |

## Registries — the extension spine

`src/core/registry.ts` holds the tables every layout is resolved against:

- **Value types** — how a property renders and edits (text, number, decimal,
  derived, formula, list, checkbox, colour, image, iframe, rating, link, unit,
  datetime, and the legacy skills type).
- **Entry kinds** — non-property rows (blank spacer, table-of-contents, the roll
  panel).
- **Cluster addons** — extra cells appended to numeric rows (roll buttons,
  modifier badges).
- **Derivations** — named modifier-math blocks, also user-editable in settings.
- **Section templates** and **layout presets** — one-click section presets and
  full default layouts.

A `FeatureModule.register(ctx)` adds to these tables through `ctx.registries`;
the registry can be rebuilt (on a settings change or an external registration)
and open views refresh. Built-in module ids are reserved.

## The influence & expression engine

A numeric or derived entry carries a list of *influences*; each term resolves a
source property (by name or short form), optionally maps it through a derivation
block or formula, and is summed with a sign and an optional per-note toggle.
`src/core/expr.ts` is a small, string-aware expression evaluator shared by
derivations, the `formula` value type, `showWhen` conditions (`evalCondition`)
and cross-note aggregates. It detects reference cycles explicitly (a typo or a
loop degrades to "—" with a tooltip, never an exception), and it is the single
place dice notation references resolve too. Cross-note reads (`[[Note]].Prop`,
`prop()`, `sum/avg/count/min/max("Type","Key")`) go through a `PropertyIndex`
-backed accessor threaded into the engine, using raw stored values so there are
no cross-note cycles.

## Note I/O — reads, batched writes, conflicts, vault-file layouts

`src/core/note-model.ts` owns frontmatter access. Writes are **coalesced per
file and debounced** (~300 ms, 1 s max-wait so a held slider drag still flushes)
and flushed on note-switch and view close, replacing per-`set` burst writes. An
optional **mtime conflict guard** snapshots a file's modification time when a
batch begins; if the note changed on disk before the write lands it raises a
*Keep mine / Take theirs* notice instead of clobbering. Both the view path
(`NoteModel`) and the inline path (`NoteFacade`) run through this, each with
echo-suppression so the plugin's own writes never self-trigger.

`src/core/layout-store.ts` is the opt-in **vault-file layout** mode: each type's
layout is mirrored to one JSON file in a configurable folder. `settings.layouts`
stays the in-memory source of truth; the files load asynchronously before first
render and **win**, while `data.json` keeps a backup copy — so a sync conflict is
an ordinary file conflict, not a silent `data.json` overwrite. A debounced,
echo-suppressed vault watcher reloads on external edits and skips a corrupt file
with a notice rather than failing the plugin.

The conflict path is a **field-level three-way merge** (`core/merge.ts`, pure and
tested): each batch snapshots the ancestor frontmatter, so when the write lands
against an externally-changed file only the keys both sides changed *differently*
are real conflicts — everything else merges automatically and the prompt is the
fallback, not the default. `core/snapshot-store.ts` writes timestamped
configuration snapshots (types, layouts, derivations, settings) to a `snapshots/`
folder for rollback, and `core/secure.ts` provides opt-in AES-256-GCM encryption
of sensitive values: a pure crypto core (envelope + PBKDF2 + GCM, unit-tested
under Node's Web Crypto) plus a session `SecretStore` that holds the passphrase
in memory and caches decrypted values for synchronous, masked-until-unlocked
display. Decryption always fails closed, so it can never corrupt a value.

## Settings, migrations & i18n

`src/core/settings.ts` runs two passes on load: `normalizeSettings` coerces
legacy shapes, then `runSchemaMigrations` applies an ordered, idempotent,
version-stamped migration table (each step runs at most once). The pre-migration
`data.json` is snapshotted to `…/plugins/extended-properties/backups/` (last 5)
before any upgrade persists. Feature modules additionally self-migrate their own
persisted settings via `FeatureModule.migrate`.

i18n is **data, not code**: dictionaries are JSON (`src/i18n/locales/en.json`
and a `strings.json` per feature module) loaded through typed shims, validated
by `scripts/i18n-check.mjs`. Resolution order at runtime is per-string override →
active locale → English → humanized key, so a partial locale never breaks the
UI.

## Public API (F5)

The same `FeatureModule` contract is published for third-party plugins, so they
can extend Extended Properties without forking it. The stable surface is
`src/api.ts`:

```ts
interface ExtendedPropertiesApi {
  readonly apiVersion: number;                 // bumped on breaking changes
  readonly version: string;                    // plugin version
  register(module: FeatureModule): void;       // idempotent by module.id
  t(key: string, vars?: Record<string, string | number>): string;
}
```

Access it after Extended Properties has loaded (it is set during `onload` on
both `window.ExtendedProperties` and the plugin instance's `.api`):

```ts
const ep = window.ExtendedProperties
  ?? this.app.plugins.plugins["extended-properties"]?.api;
if (ep && ep.apiVersion >= 1) ep.register(myModule);
```

Registrations apply immediately and survive registry rebuilds; open views
refresh. Built-in module ids are reserved, and a module that declares an
`apiVersion` newer than the host's is rejected (the user is told to update).
**Only the names in `src/api.ts` and the registry types it re-exports are
stable** — everything else is internal.

### Example module (~20 lines)

```ts
import type { FeatureModule } from "extended-properties"; // or copy src/api.ts types

const moodType: FeatureModule = {
  id: "mood",
  name: () => "Mood",
  description: () => "A simple emoji mood value type.",
  register(ctx) {
    ctx.i18n.register("en", { "mood.name": "Mood" });
    ctx.registries.valueTypes.add({
      id: "mood",
      name: (i18n) => i18n.t("mood.name"),
      render(rctx) {
        const v = rctx.view.note.str(rctx.entry.key ?? "");
        rctx.head.createSpan({ text: { happy: "😀", sad: "😢" }[v] ?? "🙂" });
      },
    });
  },
};

// in your plugin's onload, after Extended Properties has loaded:
window.ExtendedProperties?.register(moodType);
```

The value type then appears in the data-type dropdown for any property.

## Stability

`apiVersion` starts at **1**. Internal refactors that don't change `src/api.ts`
or the re-exported registry types don't bump it; a breaking change to those does.
Feature modules also self-migrate persisted settings via `FeatureModule.migrate`
(see D3's versioned migration table).
