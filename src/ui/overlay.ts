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
}

let current: Overlay | null = null;

/** Whether focus is nowhere in particular, i.e. ours to give back. */
function adrift(doc: Document): boolean {
  const el = doc.activeElement;
  return !el || el === doc.body || el === doc.documentElement;
}

/** Open an overlay, closing any other. `close` identifies it later. */
export function openOverlay(close: () => void): void {
  const prev = current;
  current = null; // cleared first: closing prev must not re-enter this slot
  prev?.close();
  const active = activeDocument.activeElement;
  current = { close, opener: active instanceof HTMLElement ? active : null };
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
  const opener = current.opener;
  current = null;
  if (!opener) return;
  // After the overlay's own teardown, which may move focus itself.
  window.setTimeout(() => {
    if (opener.isConnected && adrift(opener.ownerDocument)) opener.focus();
  }, 0);
}
