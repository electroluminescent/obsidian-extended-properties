/**
 * The label a scale line or a plot marker shows while the pointer rests on it,
 * and the focus ring that comes with it - so putting the pointer on something
 * small reads the same way as focusing a property does.
 *
 * One label exists at a time: moving to another line replaces it, and a press
 * or a scroll takes it away, so nothing is left behind when the surface under
 * it is redrawn. The listeners that watch for those live only while a label
 * does, so nothing outlives the sidebar that opened it.
 */

/** Long enough that sweeping across a scale does not flash a label per line. */
const OPEN_DELAY = 90;

let openEl: HTMLElement | null = null;
let openOwner: HTMLElement | null = null;
let watching: Document | null = null;
let timer = 0;

/** Take away whatever label is showing, and unfocus what it belonged to. */
export function closeHoverLabel(): void {
  window.clearTimeout(timer);
  if (watching) {
    watching.removeEventListener("pointerdown", closeHoverLabel, true);
    watching.removeEventListener("scroll", closeHoverLabel, true);
    watching = null;
  }
  openEl?.remove();
  openEl = null;
  openOwner?.removeClass("is-focused");
  openOwner = null;
}

/** Put the label above `el`, or below it where there is no room above. */
function place(pop: HTMLElement, el: HTMLElement): void {
  const r = el.getBoundingClientRect();
  const pr = pop.getBoundingClientRect();
  const left = Math.max(4, Math.min(r.left + r.width / 2 - pr.width / 2, window.innerWidth - pr.width - 4));
  const top = r.top - pr.height - 4 < 4 ? r.bottom + 4 : r.top - pr.height - 4;
  pop.setCssStyles({ left: left + "px", top: top + "px" });
}

/**
 * Give `el` a hover label reading whatever `text` says at the time, and the
 * focus ring while the pointer is on it. An empty text shows the ring alone,
 * which is how a marker carrying its own popup uses this.
 */
export function bindHoverLabel(el: HTMLElement, text: () => string): void {
  el.addEventListener("mouseenter", () => {
    closeHoverLabel();
    openOwner = el;
    el.addClass("is-focused");
    const label = text();
    if (!label) return;
    timer = window.setTimeout(() => {
      if (openOwner !== el || !el.isConnected) return; // moved on, or redrawn
      const doc = el.ownerDocument;
      openEl = doc.body.createDiv({ cls: "ep-popup ep-hover-label", text: label });
      place(openEl, el);
      // Anything that moves the surface underneath takes the label with it.
      watching = doc;
      doc.addEventListener("pointerdown", closeHoverLabel, true);
      doc.addEventListener("scroll", closeHoverLabel, true);
    }, OPEN_DELAY);
  });
  el.addEventListener("mouseleave", () => {
    if (openOwner === el) closeHoverLabel();
  });
}
