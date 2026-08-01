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

/** Show `menu` at the event's position, replacing any menu already open. */
export function showMenu(menu: Menu, ev: MouseEvent): void {
  adopt(menu);
  menu.showAtMouseEvent(ev);
}

/** Show `menu` at a point, replacing any menu already open. */
export function showMenuAt(menu: Menu, pos: MenuPositionDef, doc?: Document): void {
  adopt(menu);
  menu.showAtPosition(pos, doc);
}
