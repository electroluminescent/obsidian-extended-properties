/**
 * Showing a menu, one at a time.
 *
 * Obsidian dismisses an open menu when a press lands outside it - but the
 * controls that open our menus stop that press from propagating (otherwise the
 * row's own gestures would fire too), and a keyboard activation never dismisses
 * anything. So repeating the same action stacked menu on menu, each offset a
 * little from the last.
 *
 * Every menu the plugin opens goes through here, and opening one closes
 * whichever was open before it.
 */

import type { Menu, MenuPositionDef } from "obsidian";
import { closeOverlay, openOverlay, overlayClosed } from "../overlay";

/** Close the plugin menu (or popup) that is currently open, if any. */
export function closeOpenMenu(): void {
  closeOverlay();
}

/**
 * Take the overlay slot for `menu` - closing whatever was open, menu or
 * popup - and give focus back to its opener when it hides.
 */
function adopt(menu: Menu, doc: Document): void {
  const close = (): void => {
    menu.hide();
  };
  openOverlay(close);
  const unwire = wireMenuKeys(doc, close);
  menu.onHide(() => {
    unwire();
    overlayClosed(close);
  });
}

/**
 * Tab and Escape while one of our menus is open.
 *
 * A menu is arrow-navigable but nothing else: Tab walks past it into the view
 * behind, and Escape reaches Obsidian, which answers it by putting focus in
 * the editor - so a keyboard trip through the sidebar ended in the note. Tab
 * now moves the menu's selection the way the arrows do, and Escape closes the
 * menu here, before Obsidian can act on it, leaving focus on the row the menu
 * was opened from.
 */
function wireMenuKeys(doc: Document, close: () => void): () => void {
  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key === "Tab") {
      ev.preventDefault();
      ev.stopPropagation();
      // Moved by handing the menu the arrow it already answers to, so its
      // selection stays its own.
      arrow(doc, ev.shiftKey ? "ArrowUp" : "ArrowDown");
      return;
    }
    if (ev.key !== "Escape" || !liveMenu(doc)) return;
    ev.preventDefault();
    ev.stopPropagation();
    close();
  };
  doc.addEventListener("keydown", onKey, true);
  return () => doc.removeEventListener("keydown", onKey, true);
}

/** Hand the menu a key of its own, as though the user had pressed it. */
function arrow(doc: Document, key: string): void {
  doc.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

/** How Obsidian marks the item a menu is currently on. */
const SELECTED = ".menu-item.selected, .menu-item.is-selected";
/** Long enough for the moves that follow a release to have been and gone. */
const SETTLE_MS = 120;
/** After this, a press is a new one rather than the tail of the hold. */
const HOLD_TAIL_MS = 1500;

/** The menu on screen, i.e. the one just shown. */
function liveMenu(doc: Document): HTMLElement | null {
  const all = Array.from(doc.querySelectorAll<HTMLElement>(".menu"));
  // Obsidian parks hidden menus in the document, so presence proves nothing.
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].getClientRects().length > 0) return all[i];
  }
  return null;
}

/**
 * Highlight the menu's first item, so it can be used from the keyboard at once
 * - Enter takes it, or the arrows move on - rather than needing a press of a
 * key just to enter the list.
 *
 * Done by handing Obsidian its own ArrowDown rather than by marking an item
 * ourselves, so the highlight and the menu's idea of which item is selected
 * stay the same thing. A native menu (Obsidian's setting) ignores this
 * harmlessly, since the key goes to a menu it does not own.
 *
 * A menu opened by a hold gets the rest of that press: the release, and the
 * drift of the cursor around it, land on the menu that has just appeared under
 * it and take the highlight back off. So the highlight is asserted again once
 * the press ends - and only when nothing is highlighted, leaving the item the
 * cursor genuinely rests on alone.
 */
function selectFirst(doc: Document): void {
  const assert = (): void => {
    const menu = liveMenu(doc);
    if (!menu || menu.querySelector(SELECTED)) return;
    arrow(doc, "ArrowDown");
  };
  window.setTimeout(assert, 0);
  const settle = (): void => {
    window.setTimeout(assert, 0);
    window.setTimeout(assert, SETTLE_MS);
  };
  doc.addEventListener("pointerup", settle, { once: true, capture: true });
  window.setTimeout(() => doc.removeEventListener("pointerup", settle, true), HOLD_TAIL_MS);
}

/** Show `menu` at the event's position, replacing any menu already open. */
export function showMenu(menu: Menu, ev: MouseEvent): void {
  adopt(menu, activeDocument);
  menu.showAtMouseEvent(ev);
  selectFirst(activeDocument);
}

/** Show `menu` at a point, replacing any menu already open. */
export function showMenuAt(menu: Menu, pos: MenuPositionDef, doc?: Document): void {
  adopt(menu, doc ?? activeDocument);
  menu.showAtPosition(pos, doc);
  selectFirst(doc ?? activeDocument);
}
