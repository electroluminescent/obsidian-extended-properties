/**
 * One lamp for the whole screen.
 *
 * The finishes are materials, and a material is only material because the
 * light on it moves. Rather than give every formatted value its own pointer
 * tracking - fifty rows, fifty listeners, fifty sets of geometry read on
 * every mouse move - there is a single light source: one listener per window,
 * throttled to a frame, writing a handful of custom properties on the
 * document. Every finish on screen reads the same numbers, so the sheet is
 * lit by one lamp and the whole thing costs one style recalculation a frame.
 *
 * What is written (the stylesheet names them all with resting values, so this
 * is an embellishment and never a requirement):
 *
 *   --ep-lamp-x, --ep-lamp-y        where the light is, 0-100% of the window
 *   --ep-lamp-dx, --ep-lamp-dy      the same, measured from the middle
 *   --ep-lamp-reach                 0-1, how far out from the middle it is
 *   --ep-lamp-turn                  the angle from the middle to the pointer
 *
 * Nothing is written while no finish is on screen, so a vault that formats
 * nothing pays for a `querySelector` a second and not one property write.
 */

/** How often to look for a finish worth lighting, in ms. */
const LOOK_EVERY = 1000;

/** The properties this writes, so they can all be handed back together. */
const PROPS = ["x", "y", "dx", "dy", "reach", "turn"] as const;

/** Whether anything in `doc` is wearing a finish, asked at most once a second. */
function lighting(doc: Document, seen: { at: number; any: boolean }): boolean {
  const now = Date.now();
  if (now - seen.at < LOOK_EVERY) return seen.any;
  seen.at = now;
  seen.any = !!doc.querySelector(".ep-fin");
  return seen.any;
}

/**
 * Follow the pointer around `win`, lighting whatever is on screen there.
 *
 * Returns the way to stop, which the caller registers for cleanup. Popout
 * windows get their own lamp: they are their own document, with their own
 * root to write on and their own pointer to follow.
 */
export function installLamp(win: Window): () => void {
  const doc = win.document;
  const root = doc.documentElement;
  const seen = { at: 0, any: false };
  let queued = false;
  let x = 0;
  let y = 0;

  const write = (): void => {
    queued = false;
    if (!lighting(doc, seen)) return;
    const w = win.innerWidth || 1;
    const h = win.innerHeight || 1;
    const px = x / w;
    const py = y / h;
    const dx = px - 0.5;
    const dy = py - 0.5;
    // Reach is capped at 1 at the corners, so a finish's brightness has a top
    // rather than climbing with the size of the window.
    const reach = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
    // Turned half a circle, so the angle reads as "where the light is coming
    // from" rather than "where the pointer went".
    const turn = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    root.style.setProperty("--ep-lamp-x", (px * 100).toFixed(2) + "%");
    root.style.setProperty("--ep-lamp-y", (py * 100).toFixed(2) + "%");
    root.style.setProperty("--ep-lamp-dx", (dx * 100).toFixed(2) + "%");
    root.style.setProperty("--ep-lamp-dy", (dy * 100).toFixed(2) + "%");
    root.style.setProperty("--ep-lamp-reach", reach.toFixed(3));
    root.style.setProperty("--ep-lamp-turn", turn.toFixed(1) + "deg");
  };

  const onMove = (e: PointerEvent): void => {
    x = e.clientX;
    y = e.clientY;
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(write);
  };
  /** Hand the lamp back, so nothing is left lit from a corner it has left. */
  const release = (): void => {
    for (const p of PROPS) root.style.removeProperty("--ep-lamp-" + p);
  };

  win.addEventListener("pointermove", onMove, { passive: true });
  doc.addEventListener("pointerleave", release);
  win.addEventListener("blur", release);
  return () => {
    win.removeEventListener("pointermove", onMove);
    doc.removeEventListener("pointerleave", release);
    win.removeEventListener("blur", release);
    release();
  };
}
