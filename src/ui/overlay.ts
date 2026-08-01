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

/** Whether focus is nowhere in particular, i.e. ours to give back. */
function adrift(doc: Document): boolean {
  const el = doc.activeElement;
  return !el || el === doc.body || el === doc.documentElement;
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
  if (!overlay.opener) return;
  // After the overlay's own teardown, which may move focus itself.
  window.setTimeout(() => {
    const el = target(overlay);
    if (el && adrift(el.ownerDocument)) el.focus();
  }, 0);
}
