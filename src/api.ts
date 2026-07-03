/**
 * Public, versioned API for third-party feature modules (roadmap F5).
 *
 * Other plugins can extend Extended Properties without forking it by
 * registering a {@link FeatureModule} - the same contract the built-in dice,
 * D&D 5e and inline modules use. A module can add value types, entry kinds,
 * cluster addons, derivations, section templates, layout presets and locale
 * strings through the registries handed to its `register(ctx)`.
 *
 * Access the API after Extended Properties has loaded:
 *
 *   const ep = window.ExtendedProperties
 *     ?? app.plugins.plugins["extended-properties"]?.api;
 *   if (ep && ep.apiVersion >= 1) ep.register(myModule);
 *
 * Only the names in this file (and the `FeatureModule` / registry types it
 * re-exports) are stable. Everything else is internal and may change without a
 * major-version bump; `apiVersion` is bumped on any breaking change here.
 */
import type { FeatureModule } from "./core/registry";

/**
 * Bumped only on a breaking change to the published surface below.
 * v2 (plugin v4.0.0): the legacy skills preset registry (skillPresets,
 * SkillPresetDef, SkillRecord) was removed from the registry surface.
 */
export const API_VERSION = 2;

export interface ExtendedPropertiesApi {
  /** Stable version of the published API surface. */
  readonly apiVersion: number;
  /** Running plugin version (informational). */
  readonly version: string;
  /**
   * Register a feature module. Idempotent by `module.id` (built-in ids are
   * reserved). Registrations apply immediately and survive registry rebuilds;
   * open views refresh. A thrown error in the module is caught and logged.
   */
  register(module: FeatureModule): void;
  /** Translate a key through the plugin's i18n table (read-only). */
  t(key: string, vars?: Record<string, string | number>): string;
}

export type { FeatureModule };
