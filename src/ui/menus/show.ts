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

let current: Menu | null = null;

/** Close the plugin menu that is currently open, if any. */
export function closeOpenMenu(): void {
  const prev = current;
  current = null;
  prev?.hide();
}

/** Remember `menu` as the open one until it hides. */
function adopt(menu: Menu): void {
  closeOpenMenu();
  current = menu;
  menu.onHide(() => {
    if (current === menu) current = null;
  });
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
