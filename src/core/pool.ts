/**
 * The autofill "pool" of a property (the `.p` pool suffix feature).
 *
 * A property's pool is what autocomplete offers for it: every value found in
 * the vault plus user-added extras persisted in `settings.poolExtras`. The
 * pool editor (ui/components/popups.ts) lets the user add extras and remove
 * options; removing also scrubs the value from every note that carries it
 * (that part lives in the UI layer, since it writes files).
 *
 * Pure module - unit-tested in tests/pool.test.ts.
 */

import type { EPSettings } from "./model";

/** The pool for `key`: vault values + extras, deduplicated, sorted. */
export function poolFor(settings: EPSettings, vaultValues: string[], key: string): string[] {
  const extras = settings.poolExtras?.[key.toLowerCase()] ?? [];
  const seen = new Set(vaultValues.map((v) => v.toLowerCase()));
  const out = [...vaultValues];
  for (const e of extras) {
    const el = e.toLowerCase();
    if (!seen.has(el)) {
      seen.add(el);
      out.push(e);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** Whether `value` is a user-added extra for `key`. */
export function isPoolExtra(settings: EPSettings, key: string, value: string): boolean {
  return (settings.poolExtras?.[key.toLowerCase()] ?? []).some((e) => e.toLowerCase() === value.toLowerCase());
}

/** Add an extra option to `key`'s pool. Returns true when settings changed. */
export function addPoolExtra(settings: EPSettings, key: string, value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const kl = key.toLowerCase();
  const extras = settings.poolExtras?.[kl] ?? [];
  if (extras.some((e) => e.toLowerCase() === v.toLowerCase())) return false;
  if (!settings.poolExtras) settings.poolExtras = {};
  settings.poolExtras[kl] = [...extras, v];
  return true;
}

/** Remove an extra option from `key`'s pool. Returns true when settings changed. */
export function removePoolExtra(settings: EPSettings, key: string, value: string): boolean {
  const kl = key.toLowerCase();
  const extras = settings.poolExtras?.[kl];
  if (!extras) return false;
  const next = extras.filter((e) => e.toLowerCase() !== value.toLowerCase());
  if (next.length === extras.length) return false;
  if (next.length) settings.poolExtras![kl] = next;
  else delete settings.poolExtras![kl];
  return true;
}
