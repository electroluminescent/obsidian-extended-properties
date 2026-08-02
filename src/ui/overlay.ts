/**
 * One overlay at a time, and focus back where it came from.
 *
 * A context menu and the property-settings popup are opened by different
 * gestures on the same row, and each only knew how to close its own kind - so
 * a hold after a right click left two of them stacked. They share the slot
 * here instead: opening either closes whatever was open.
 *
 * The slot also remembers what had focus when it opened, and gives it back on
 * close, so the keyboard carries on from the control that spawned the overlay
 * rather than from the top of the view. Focus is only restored when it was
 * left dangling: if the user has already put it somewhere deliberate, that
 * wins.
 */

interface Overlay {
  close: () => void;
  opener: HTMLElement | null;
  /** The opener's entry id, if it is a row: it survives a re-render. */
  id: string | null;
}

let current: Overlay | null = null;

/**
 * How long to keep the restored focus. Obsidian answers an element holding
 * focus being removed by putting focus back in the active editor, which lands
 * after ours does; taking it back once more settles it.
 */
const RECLAIM_MS = 80;

/**
 * Whether focus is ours to give back: nowhere in particular, on an element
 * that has just been removed, or still inside the overlay that is closing.
 */
function adrift(doc: Document): boolean {
  const el = doc.activeElement;
  if (!el || el === doc.body || el === doc.documentElement) return true;
  if (!el.isConnected) return true;
  return !!el.closest(".menu, .ep-popup");
}

/** Whether focus is still in the view the overlay was opened from. */
function inView(doc: Document): boolean {
  return !!doc.activeElement?.closest(".ep-sidebar");
}

/**
 * The element to give focus back to. Usually the one that had it, but a view
 * that re-rendered while the overlay was open - which closing it often causes -
 * leaves that node detached, with an identical row in its place.
 */
function target(o: Overlay): HTMLElement | null {
  const opener = o.opener;
  if (!opener) return null;
  if (opener.isConnected) return opener;
  if (!o.id) return null;
  return opener.ownerDocument.querySelector<HTMLElement>(`.ep-entry[data-ep-id="${o.id}"]`);
}

/** Open an overlay, closing any other. `close` identifies it later. */
export function openOverlay(close: () => void): void {
  const prev = current;
  current = null; // cleared first: closing prev must not re-enter this slot
  prev?.close();
  const active = activeDocument.activeElement;
  const opener = active?.instanceOf(HTMLElement) ? active : null;
  const row = opener?.closest<HTMLElement>(".ep-entry") ?? null;
  current = { close, opener, id: row?.getAttribute("data-ep-id") ?? null };
}

/** Close the open overlay, if any. */
export function closeOverlay(): void {
  const prev = current;
  current = null;
  prev?.close();
}

/**
 * Report that `close`'s overlay has gone, handing focus back to whatever
 * opened it. A stale report - from an overlay that has already been replaced -
 * is ignored, so it cannot steal focus from the one that replaced it.
 */
export function overlayClosed(close: () => void): void {
  if (current?.close !== close) return;
  const overlay = current;
  current = null;
  const opener = overlay.opener;
  if (!opener) return;
  // Decided now, while the overlay has only just let focus go. Waiting until
  // the timeout to decide loses the view: by then the editor has been handed
  // focus, which reads as somewhere the user chose to be.
  //
  // Focus still sitting in the view counts too, and is the ordinary case for a
  // menu - which never took focus off the row. It is where it belongs at this
  // instant, but Obsidian moves it to the editor a moment later, so the passes
  // below have to run to put it back.
  const doc = opener.ownerDocument;
  if (!adrift(doc) && !inView(doc)) return;
  const give = (): void => {
    const el = target(overlay);
    // Unless the user has since put focus somewhere in the view themselves.
    if (!el || el.ownerDocument.activeElement?.closest(".ep-sidebar")) return;
    el.focus();
  };
  // After the overlay's own teardown, which may move focus itself, and then
  // twice more: Obsidian's own restore lands at no fixed moment.
  for (const ms of [0, RECLAIM_MS, RECLAIM_MS * 3]) window.setTimeout(give, ms);
}
