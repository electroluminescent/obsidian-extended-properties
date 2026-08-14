/**
 * Getting around a long page of settings: a rail of its sections, and a box
 * to search it.
 *
 * A property's options run to a dozen sections and the plugin's settings to
 * many more, which is fine to read and miserable to navigate - the thing you
 * want is always somewhere below the fold. The rail is a timeline of the
 * headings pinned to the side of whatever scrolls: it says where you are and
 * takes you anywhere else in one press. The search box hides the rows that do
 * not match, and the headings left with nothing under them.
 *
 * Mounted into the scrolling element itself and pinned with `sticky`, so the
 * same code serves the popup, the modals and the settings tab without any of
 * them having to arrange a column for it.
 */

import type { I18n } from "../../i18n/i18n";

/** Hidden by the search, rather than by anything the settings themselves say. */
const HIDDEN = "ep-nav-filtered";

export interface OptionsNavOptions {
  /** What counts as a section heading. */
  headings?: string;
  /** Offer the search box above the first row. */
  search?: boolean;
  /** Where the search box goes; the scroller itself by default. */
  body?: HTMLElement;
}

/** The query each scroller was last searched for, kept across redraws. */
const queries = new WeakMap<HTMLElement, string>();

/** `el`'s distance from the top of the scrolling box's content. */
function offsetIn(scroller: HTMLElement, el: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

/**
 * Put the rail (and, if asked, the search box) on `scroller`.
 *
 * Call it after the body has been drawn, and again after every redraw: it
 * takes its own previous copy off first, so re-mounting is the normal way to
 * use it rather than a special case.
 */
export function mountOptionsNav(scroller: HTMLElement, i18n: I18n, o: OptionsNavOptions = {}): void {
  const sel = o.headings ?? "h4, .setting-item-heading";
  const body = o.body ?? scroller;
  for (const old of scroller.findAll(".ep-nav, .ep-nav-search")) old.remove();
  // Only what is on show: the settings tab keeps every tab's headings in the
  // document and displays one tab's worth of them.
  const heads = scroller.findAll(sel).filter((h) => h.offsetHeight > 0);
  if (heads.length < 2) return;

  const rail = scroller.createDiv({ cls: "ep-nav" });
  rail.setAttr("role", "navigation");
  rail.setAttr("aria-label", i18n.t("nav.sections"));
  scroller.insertBefore(rail, scroller.firstChild);

  const dots = heads.map((h) => {
    const text = (h.textContent ?? "").trim();
    const dot = rail.createEl("button", { cls: "ep-nav-dot" });
    dot.type = "button";
    dot.setAttr("aria-label", text);
    dot.setAttr("title", text);
    dot.createSpan({ cls: "ep-nav-label", text });
    dot.createSpan({ cls: "ep-nav-mark" });
    dot.onclick = (e) => {
      e.preventDefault();
      scroller.scrollTo({ top: Math.max(0, offsetIn(scroller, h) - 8), behavior: "smooth" });
    };
    return dot;
  });

  // Where each heading sits, measured once and again only when the page
  // changes height - a search hiding rows, a row growing options of its own.
  let tops: number[] = [];
  let measuredAt = -1;
  const measure = (): void => {
    tops = heads.map((h) => offsetIn(scroller, h));
    measuredAt = scroller.scrollHeight;
  };
  /** Which section the top of the view is in. */
  const mark = (): void => {
    if (scroller.scrollHeight !== measuredAt) measure();
    const top = scroller.scrollTop + 24;
    let at = 0;
    tops.forEach((y, i) => {
      if (y <= top && heads[i].offsetHeight > 0) at = i;
    });
    dots.forEach((d, i) => d.toggleClass("is-here", i === at));
  };
  mark();
  scroller.addEventListener("scroll", mark, { passive: true });

  if (o.search === false) return;
  const searchRow = mountSearch(scroller, body, i18n, sel, () => {
    // A section the search emptied has nowhere to take anyone.
    heads.forEach((h, i) => dots[i].toggleClass(HIDDEN, h.hasClass(HIDDEN)));
    mark();
  });
  scroller.insertBefore(searchRow, rail.nextSibling);
}

/** The search box, and what it does to the rows below it. */
function mountSearch(
  scroller: HTMLElement,
  body: HTMLElement,
  i18n: I18n,
  sel: string,
  after: () => void
): HTMLElement {
  const row = body.createDiv({ cls: "ep-nav-search" });
  const input = row.createEl("input", { cls: "ep-nav-search-input" });
  input.type = "search";
  input.placeholder = i18n.t("nav.searchPlaceholder");
  input.setAttr("aria-label", i18n.t("nav.searchPlaceholder"));
  input.value = queries.get(scroller) ?? "";

  const apply = (): void => {
    const q = input.value.trim().toLowerCase();
    queries.set(scroller, input.value);
    for (const item of body.findAll(".setting-item")) {
      if (item.matches(sel)) continue; // headings are decided by their contents
      const text = (item.textContent ?? "").toLowerCase();
      item.toggleClass(HIDDEN, !!q && !text.includes(q));
    }
    // A heading with nothing left under it says nothing worth reading.
    for (const head of body.findAll(sel)) {
      let any = false;
      for (let n = head.nextElementSibling; n; n = n.nextElementSibling) {
        const el = n as HTMLElement;
        if (el.matches(sel)) break;
        if (el.hasClass("setting-item") && !el.hasClass(HIDDEN)) any = true;
      }
      head.toggleClass(HIDDEN, !!q && !any);
    }
    scroller.toggleClass("ep-nav-searching", !!q);
    after();
  };
  input.addEventListener("input", apply);
  apply();
  return row;
}
