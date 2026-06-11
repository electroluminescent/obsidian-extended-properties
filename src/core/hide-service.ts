/**
 * Hiding properties from Obsidian's own properties panel.
 *
 * Two sources decide what is hidden:
 * 1. `settings.manualHide` — explicit, vault-wide hides.
 * 2. Sidebar entries — when `settings.hideShown` is on, every property shown
 *    in a sidebar layout is hidden from Obsidian unless the entry opts out
 *    via `showInObsidian`.
 *
 * Hiding is implemented with an injected `<style>` element so it applies to
 * every properties panel without patching Obsidian internals.
 */

import type { EPSettings } from "./model";

const HIDE_STYLE_ID = "ep-hide-properties";

/** Host hooks: persistence and view refresh are owned by the plugin. */
export interface HideServiceHost {
  settings: EPSettings;
  save(): void;
  refreshViews(): void;
}

export class HideService {
  private styleEl: HTMLStyleElement | null = null;

  constructor(private host: HideServiceHost) {}

  /** Create the style element. Returns a disposer for `Plugin.register`. */
  install(): () => void {
    this.styleEl = document.head.createEl("style", { attr: { id: HIDE_STYLE_ID } });
    this.update();
    return () => this.styleEl?.remove();
  }

  /** Recompute the CSS from current settings. Call after every save. */
  update(): void {
    if (!this.styleEl) return;
    const s = this.host.settings;
    const keys = new Set<string>();
    if (s.hideShown) {
      for (const lk of Object.keys(s.layouts))
        for (const sec of s.layouts[lk].sections)
          for (const e of sec.entries)
            if (e.kind === "prop" && e.key && !e.showInObsidian) keys.add(e.key.toLowerCase());
    }
    for (const k of s.manualHide || []) keys.add(k.toLowerCase());
    const esc = (k: string) => k.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    this.styleEl.textContent = [...keys]
      .map((k) => `.metadata-property[data-property-key="${esc(k)}"]{display:none!important;}`)
      .join("\n");
  }

  /** Whether `key` is currently hidden (manual or via a sidebar entry). */
  isHidden(key: string): boolean {
    const s = this.host.settings;
    if (s.manualHide.some((k) => k.toLowerCase() === key.toLowerCase())) return true;
    if (!s.hideShown) return false;
    for (const lk of Object.keys(s.layouts))
      for (const sec of s.layouts[lk].sections)
        for (const en of sec.entries)
          if (en.kind === "prop" && en.key && en.key.toLowerCase() === key.toLowerCase() && !en.showInObsidian)
            return true;
    return false;
  }

  /** All hidden keys with their origin, sorted. `manual` = explicit hide. */
  hiddenKeys(): { key: string; manual: boolean }[] {
    const s = this.host.settings;
    const out = new Map<string, boolean>();
    for (const k of s.manualHide) out.set(k, true);
    if (s.hideShown)
      for (const lk of Object.keys(s.layouts))
        for (const sec of s.layouts[lk].sections)
          for (const e of sec.entries)
            if (e.kind === "prop" && e.key && !e.showInObsidian && !out.has(e.key)) out.set(e.key, false);
    return [...out.entries()].map(([key, manual]) => ({ key, manual })).sort((a, b) => a.key.localeCompare(b.key));
  }

  /** Hide `key` everywhere (adds a manual hide). */
  hideKey(key: string): void {
    const s = this.host.settings;
    if (!s.manualHide.includes(key)) s.manualHide.push(key);
    this.host.save();
  }

  /** Unhide `key`: drop manual hides and mark sidebar entries visible. */
  unhideKey(key: string): void {
    const s = this.host.settings;
    s.manualHide = s.manualHide.filter((k) => k.toLowerCase() !== key.toLowerCase());
    for (const lk of Object.keys(s.layouts))
      for (const sec of s.layouts[lk].sections)
        for (const e of sec.entries)
          if (e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase()) e.showInObsidian = true;
    this.host.save();
    this.host.refreshViews();
  }

  toggle(key: string): void {
    if (this.isHidden(key)) this.unhideKey(key);
    else this.hideKey(key);
  }
}
