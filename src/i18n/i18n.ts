/**
 * Internationalization service.
 *
 * Every user-visible string in the plugin flows through {@link I18n.t}.
 * Resolution order: user override → active locale → English → humanized key.
 *
 * Dictionaries are *open*: core registers its strings at startup and feature
 * modules merge their own keys into any locale (`register`). This keeps
 * wording consistent and lets the user (a) switch language and (b) override
 * any individual string from the settings tab.
 *
 * Keys are namespaced with dots, e.g. `entry.menu.remove`. Placeholders use
 * `{name}` syntax: `t("note.noType", { note: file.basename })`.
 */

export type StringDict = Record<string, string>;

/** A locale's identity. The display name is shown in the language dropdown. */
export interface LocaleInfo { code: string; name: string }

export class I18n {
  private dicts = new Map<string, StringDict>();
  private names = new Map<string, string>();
  private locale = "en";
  private overrides: StringDict = {};

  /**
   * Merge `dict` into the dictionary for `locale`. Later registrations win,
   * so feature modules can refine core strings if they must (discouraged).
   */
  register(locale: string, dict: StringDict, displayName?: string): void {
    const existing = this.dicts.get(locale) ?? {};
    this.dicts.set(locale, { ...existing, ...dict });
    if (displayName) this.names.set(locale, displayName);
  }

  /** Switch the active locale. Unknown codes silently fall back to English. */
  setLocale(code: string): void {
    this.locale = code;
  }

  getLocale(): string {
    return this.locale;
  }

  /** Install the user's per-string overrides (from settings). */
  setOverrides(overrides: StringDict): void {
    this.overrides = overrides ?? {};
  }

  /** All locales that have at least one registered dictionary. */
  availableLocales(): LocaleInfo[] {
    return [...this.dicts.keys()].sort().map((code) => ({ code, name: this.names.get(code) ?? code }));
  }

  /** Every known string key (union over all locales) — used by the override editor. */
  keys(): string[] {
    const all = new Set<string>();
    for (const d of this.dicts.values()) for (const k of Object.keys(d)) all.add(k);
    return [...all].sort();
  }

  /** The string a key resolves to *ignoring* user overrides (for the editor UI). */
  baseText(key: string): string {
    return this.dicts.get(this.locale)?.[key] ?? this.dicts.get("en")?.[key] ?? humanize(key);
  }

  /** Translate `key`, substituting `{placeholders}` from `vars`. */
  t(key: string, vars?: Record<string, string | number>): string {
    const raw =
      this.overrides[key] ??
      this.dicts.get(this.locale)?.[key] ??
      this.dicts.get("en")?.[key] ??
      humanize(key);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? String(vars[name]) : m));
  }
}

/** Last-resort fallback: turn `section.menu.moveUp` into "Move up". */
function humanize(key: string): string {
  const tail = key.split(".").pop() ?? key;
  const words = tail.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
