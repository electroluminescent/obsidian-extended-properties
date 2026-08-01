/**
 * Tab order for filling in a note.
 *
 * Filling a sheet should not need the mouse: Tab moves to the next value and
 * *opens* it, so you can type straight away, Shift+Tab goes back, and the chain
 * covers everything a value can be - a text or number field, a checkbox, a
 * list's add button - in the order they appear on screen.
 *
 * Native tabbing would walk the same elements, but it walks the row's chrome
 * with them (grips, roll buttons, menu buttons) and it never opens anything, so
 * every stop needs a second key. This chain is the data-entry path; leaving it
 * at either end falls through to the browser, so focus is never trapped.
 */

/** Everything that counts as a field to fill. */
const FIELDS = ".ep-editable, .ep-entry input[type='checkbox'], .ep-list-addbtn";

/** Whether an element is actually on screen (not in a collapsed section). */
function visible(el: HTMLElement): boolean {
  return el.offsetParent !== null || el.getClientRects().length > 0;
}

/** The fields of `scope`, in document order. */
export function fieldsIn(scope: ParentNode): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(FIELDS)).filter(visible);
}

/**
 * How to open each editable value, registered where it is bound.
 *
 * Tabbing must open a field whatever gesture the user chose for the mouse -
 * synthesizing a click would do nothing when values are set to open on a
 * double click - so the opener is held here rather than inferred.
 */
const openers = new WeakMap<HTMLElement, () => void>();

/** Record how to open `el`, for the Tab chain (see {@link enterField}). */
export function registerOpener(el: HTMLElement, open: () => void): void {
  openers.set(el, open);
}

/**
 * Land on a field: an editable value opens for typing, a control just takes
 * focus (Space toggles a checkbox, Enter opens a list's picker).
 */
export function enterField(el: HTMLElement): void {
  el.focus();
  openers.get(el)?.();
}

/**
 * Move from `from` to the next (or previous) field within `scope`.
 * Returns false at either end, so the caller can let the key through.
 */
export function stepField(scope: ParentNode, from: HTMLElement | null, backwards: boolean): boolean {
  const all = fieldsIn(scope);
  if (!all.length) return false;
  const here = from ? all.indexOf(from) : -1;
  const next = all[here + (backwards ? -1 : 1)];
  if (here < 0 || !next) return false;
  // Deferred: the caller may still be committing the field being left.
  window.setTimeout(() => enterField(next), 0);
  return true;
}
