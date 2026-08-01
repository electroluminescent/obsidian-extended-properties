/**
 * Keyboard policy for an entry row.
 *
 * The row is a focusable group: arrows move between rows, and Enter or Space
 * opens its context menu. But the row also *contains* focusable controls - the
 * value, the menu button, a list chip's remove button - each with its own
 * Enter/Space meaning. Since the row's handler is delegated (one listener on
 * the view), a key pressed on a control reaches it too, and both would act:
 * the button opens the menu, then the row opens it again.
 *
 * So activation belongs to whatever has focus: the row's own Enter/Space only
 * applies when the row itself is focused. Navigation keys still work from
 * anywhere inside, so focus is never trapped in a control.
 */

export type EntryKeyAction = "next" | "prev" | "first" | "last" | "menu" | null;

/**
 * What a key should do for the entry row.
 *
 * @param onRowItself whether the event's target *is* the row, rather than a
 *                    control inside it.
 */
export function entryKeyAction(key: string, onRowItself: boolean): EntryKeyAction {
  switch (key) {
    case "ArrowDown":
      return "next";
    case "ArrowUp":
      return "prev";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "Enter":
    case " ":
      return onRowItself ? "menu" : null;
    default:
      return null;
  }
}
