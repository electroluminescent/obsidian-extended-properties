/**
 * Getting around a long page of settings: a rail of its sections, and a box
 * to search it.
 *
 * A property's options run to a dozen sections and the plugin's settings to
 * many more, which is fine to read and miserable to navigate - the thing you
 * want is always somewhere below the fold. The rail is a timeline of the
 * headings, and it stands OUTSIDE what it describes: a strip alongside the
 * popup or the settings window, every section named in full, with the one you
 * are reading marked. Inside would mean either covering the settings or
 * stealing width from them, and a column of unlabelled dots is a puzzle
 * rather than a map.
 *
 * The search box does belong inside, above the first row: it hides the rows
 * that do not match, and the headings left with nothing under them.
 */

import type { I18n } from "../../i18n/i18n";

/** Hidden by the search, rather than by anything the settings themselves say. */
const HIDDEN = "ep-nav-filtered";

/** How far from the strip's edge the window is allowed to crowd it. */
const EDGE = 8;

export interface OptionsNavOptions {
  /** What counts as a section heading. */
  headings?: string;
  /** Offer the search box above the first row. */
  search?: boolean;
  /** Where the search box goes; the content element by default. */
  body?: HTMLElement;
  /** What the strip stands beside; the content element by default. */
  beside?: HTMLElement;
}

/** The query each page was last searched for, kept across redraws. */
const queries = new WeakMap<HTMLElement, string>();
/**
 * How to take down the strip standing beside each page. A redraw replaces
 * rather than adds - and the old strip's watchers have to go with it, or a
 * settings tab redrawn a dozen times leaves a dozen timers behind, each
 * placing a strip that is no longer on screen.
 */
const strips = new WeakMap<HTMLElement, () => void>();

/** The nearest thing that actually scrolls around `el`. */
function scrollerFor(el: HTMLElement): HTMLElement | null {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (/(auto|scroll|overlay)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) return n;
  }
  return null;
}

/**
 * Put the strip beside `content` (and, if asked, a search box inside it).
 *
 * Call it after the body has been drawn, and again after every redraw: the
 * previous strip is taken down first, so re-mounting is the normal way to use
 * this rather than a special case.
 */
export function mountOptionsNav(content: HTMLElement, i18n: I18n, o: OptionsNavOptions = {}): void {
  const sel = o.headings ?? "h4, .setting-item-heading";
  const body = o.body ?? content;
  const beside = o.beside ?? content;
  strips.get(content)?.();
  strips.delete(content);
  for (const old of content.findAll(".ep-nav-search")) old.remove();

  if (o.search !== false) {
    const searchRow = mountSearch(content, body, i18n, sel);
    body.insertBefore(searchRow, body.firstChild);
  }

  // Only what is on show: the settings tab keeps every tab's headings in the
  // document and displays one tab's worth of them.
  const heads = content.findAll(sel).filter((h) => h.offsetHeight > 0);
  if (heads.length < 2) return;

  const doc = content.ownerDocument;
  const rail = doc.body.createDiv({ cls: "ep-nav" });
  rail.setAttr("role", "navigation");
  rail.setAttr("aria-label", i18n.t("nav.sections"));

  const dots = heads.map((h) => {
    const text = (h.textContent ?? "").trim();
    const dot = rail.createEl("button", { cls: "ep-nav-dot" });
    dot.type = "button";
    dot.setAttr("title", text);
    dot.createSpan({ cls: "ep-nav-mark" });
    dot.createSpan({ cls: "ep-nav-label", text });
    // Whatever is scrolling - a popup body, a modal, the settings window -
    // gets to do the scrolling itself, so nothing has to be found first.
    dot.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      h.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    return dot;
  });

  /** Which section the top of the view is in. */
  const scroller = scrollerFor(heads[0]);
  const mark = (): void => {
    const top = (scroller ?? doc.documentElement).getBoundingClientRect().top + 24;
    let at = 0;
    heads.forEach((h, i) => {
      if (h.offsetHeight > 0 && h.getBoundingClientRect().top <= top) at = i;
    });
    dots.forEach((d, i) => d.toggleClass("is-here", i === at));
  };

  /** Stand the strip beside what it describes, on whichever side has room. */
  const place = (): void => {
    const box = beside.getBoundingClientRect();
    const w = rail.offsetWidth;
    const h = rail.offsetHeight;
    const room = box.left - EDGE * 2;
    const left = room >= w ? box.left - w - EDGE : Math.min(box.right + EDGE, window.innerWidth - w - EDGE);
    const top = Math.min(Math.max(EDGE, box.top), Math.max(EDGE, window.innerHeight - h - EDGE));
    rail.setCssStyles({ left: `${Math.max(EDGE, left)}px`, top: `${top}px` });
  };

  const tick = (): void => {
    if (!content.isConnected || beside.offsetHeight === 0) {
      stop();
      return;
    }
    place();
    mark();
  };
  const timer = window.setInterval(tick, 400);
  const stop = (): void => {
    window.clearInterval(timer);
    doc.removeEventListener("scroll", tick, true);
    window.removeEventListener("resize", tick);
    rail.remove();
    if (strips.get(content) === stop) strips.delete(content);
  };
  strips.set(content, stop);
  doc.addEventListener("scroll", tick, true);
  window.addEventListener("resize", tick);
  place();
  mark();
}

/** The search box, and what it does to the rows below it. */
function mountSearch(content: HTMLElement, body: HTMLElement, i18n: I18n, sel: string): HTMLElement {
  const row = body.createDiv({ cls: "ep-nav-search" });
  const input = row.createEl("input", { cls: "ep-nav-search-input" });
  input.type = "search";
  input.placeholder = i18n.t("nav.searchPlaceholder");
  input.setAttr("aria-label", i18n.t("nav.searchPlaceholder"));
  input.value = queries.get(content) ?? "";

  const apply = (): void => {
    const q = input.value.trim().toLowerCase();
    queries.set(content, input.value);
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
    content.toggleClass("ep-nav-searching", !!q);
  };
  input.addEventListener("input", apply);
  apply();
  return row;
}
