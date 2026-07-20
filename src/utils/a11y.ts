/**
 * Tiny screen-reader helpers (roadmap E1).
 *
 * A single shared polite `aria-live` region announces transient results (roll
 * totals) so assistive tech reads them even though the roll card is purely
 * visual. `announce` is safe to call from anywhere and creates the region lazily.
 */
let region: HTMLElement | null = null;

function live(): HTMLElement {
  if (!region || !region.isConnected) {
    region = activeDocument.body.createDiv({ cls: "ep-sr-only" });
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
  }
  return region;
}

/** Announce `text` to screen readers via the shared polite live region. */
export function announce(text: string): void {
  if (!text) return;
  const el = live();
  // Clear, then set on the next tick so an identical message re-announces.
  el.textContent = "";
  window.setTimeout(() => {
    el.textContent = text;
  }, 30);
}
