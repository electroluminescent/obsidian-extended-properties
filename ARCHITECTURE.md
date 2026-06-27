# Architecture & public API

Extended Properties is a generic shell around a set of **registries**. The
sidebar never hard-codes what a property *is*; it looks up value types, entry
kinds, cluster addons, derivations, section templates and layout presets in
`src/core/registry.ts`. A **feature module** bundles registrations plus locale
strings, so a domain (dice, D&D 5e, inline rolls) lives entirely in
`src/features/<id>/` and can be toggled in settings without the core knowing it
exists.

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
