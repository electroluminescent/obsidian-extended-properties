/**
 * Hiding properties from Obsidian's own properties panel.
 *
 * Two sources decide what is hidden:
 * 1. `settings.manualHide` - explicit, vault-wide hides.
 * 2. Sidebar entries - when `settings.hideShown` is on, every property shown
 *    in a sidebar layout is hidden from Obsidian unless the entry opts out
 *    via `showInObsidian`.
 *
 * Hiding is implemented by toggling a CSS class (`ep-prop-hidden`, styled in
 * styles.css) on Obsidian's property rows as they render — so no `<style>`
 * element is injected and no Obsidian internals are patched.
 */

import type { EPSettings } from "./model";

/** Host hooks: persistence and view refresh are owned by the plugin. */
export interface HideServiceHost {
  settings: EPSettings;
  save(): void;
  refreshViews(): void;
}

export class HideService {
  private keys = new Set<string>();
  private observer: MutationObserver | null = null;
  private raf = 0;

  constructor(private host: HideServiceHost) {}

  /** Start hiding. Returns a disposer for `Plugin.register`. */
  install(): () => void {
    this.recompute();
    // Re-apply the hide class whenever the properties panel re-renders.
    this.observer = new MutationObserver(() => this.schedule());
    this.observer.observe(activeDocument.body, { childList: true, subtree: true });
    this.apply();
    return () => {
      this.observer?.disconnect();
      this.observer = null;
      if (this.raf) activeWindow.cancelAnimationFrame(this.raf);
      this.unapplyAll();
    };
  }

  /** Recompute the hidden set from settings and re-apply. Call after each save. */
  update(): void {
    this.recompute();
    this.apply();
  }

  private recompute(): void {
    const s = this.host.settings;
    const keys = new Set<string>();
    if (s.hideShown) {
      for (const lk of Object.keys(s.layouts))
        for (const sec of s.layouts[lk].sections)
          for (const e of sec.entries)
            if (e.kind === "prop" && e.key && !e.showInObsidian) keys.add(e.key.toLowerCase());
    }
    for (const k of s.manualHide || []) keys.add(k.toLowerCase());
    this.keys = keys;
  }

  /** Coalesce bursts of DOM mutations into a single apply on the next frame. */
  private schedule(): void {
    if (this.raf) return;
    this.raf = window.requestAnimationFrame(() => {
      this.raf = 0;
      this.apply();
    });
  }

  private apply(): void {
    activeDocument
      .querySelectorAll<HTMLElement>(".metadata-property[data-property-key]")
      .forEach((row) => {
        const key = (row.getAttribute("data-property-key") || "").toLowerCase();
        row.toggleClass("ep-prop-hidden", this.keys.has(key));
      });
  }

  private unapplyAll(): void {
    activeDocument
      .querySelectorAll<HTMLElement>(".metadata-property.ep-prop-hidden")
      .forEach((row) => row.removeClass("ep-prop-hidden"));
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
