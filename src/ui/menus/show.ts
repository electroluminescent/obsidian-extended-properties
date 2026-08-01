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
function adopt(menu: Menu): void {
  const close = (): void => {
    menu.hide();
  };
  openOverlay(close);
  menu.onHide(() => overlayClosed(close));
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
 */
function selectFirst(doc: Document): void {
  window.setTimeout(() => {
    doc.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  }, 0);
}

/** Show `menu` at the event's position, replacing any menu already open. */
export function showMenu(menu: Menu, ev: MouseEvent): void {
  adopt(menu);
  menu.showAtMouseEvent(ev);
  selectFirst(activeDocument);
}

/** Show `menu` at a point, replacing any menu already open. */
export function showMenuAt(menu: Menu, pos: MenuPositionDef, doc?: Document): void {
  adopt(menu);
  menu.showAtPosition(pos, doc);
  selectFirst(doc ?? activeDocument);
}
