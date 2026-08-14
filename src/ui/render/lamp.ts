/**
 * The light on the finishes: one lamp, but every value lit relative to
 * itself.
 *
 * A finish is a material, and a material is only material because the light
 * on it moves. The pointer is that light. What matters to a value, though, is
 * not where the pointer is in the window - it is where the pointer is on the
 * value: a highlight belongs under the cursor, and a sheet of ten rows should
 * catch the light one row at a time as you cross them, not all at once.
 *
 * So there is one listener per window and one frame of work, but the numbers
 * are worked out per value:
 *
 *   --ep-lamp-x, --ep-lamp-y     where the pointer is ON this value, 0-100%
 *   --ep-lamp-dx, --ep-lamp-dy   the same, measured from its middle
 *   --ep-lamp-reach              0-1, how far out from its middle
 *   --ep-lamp-turn               the angle from its middle to the pointer
 *   --ep-lamp-near               1 with the pointer on it, falling to 0 away
 *
 * The frame is one read pass over the boxes and one write pass over the
 * properties, in that order, so the browser lays out once rather than once
 * per value. Nothing is written on the document itself: a value the light has
 * not reached inherits the resting light from the stylesheet, which is where
 * it belongs.
 *
 * The stylesheet names every one of these with a resting value, so this is an
 * embellishment and never a requirement: with no pointer, no listener and no
 * JavaScript at all, the finishes are still correct - just still.
 */

/** The properties written, so they can all be handed back together. */
const PROPS = ["x", "y", "dx", "dy", "reach", "turn", "near"] as const;

/**
 * How far past a value's own size the light still reaches, as a multiple of
 * its half-diagonal. At 1 the light dies at the value's own corners, which
 * reads as a spotlight; this is wider, so a row notices the pointer arriving
 * before it gets there.
 */
const FALLOFF = 2.6;

/**
 * The most values lit at once. A sidebar shows tens, not hundreds - and past
 * some number the honest thing is to light what is nearest and leave the rest
 * at rest rather than spend a frame on all of them.
 */
const LIMIT = 160;

const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);

/** As much of a box as the light needs. */
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** What one value's light looks like, given where the pointer is on it. */
export function lightFor(box: Box, px: number, py: number): Record<string, string> {
  // Where the pointer sits across the value, in the value's own terms: 0 at
  // its left edge, 1 at its right, and past both when the pointer is beyond
  // it. Measured before anything is clamped, because how FAR away the pointer
  // is has to be answerable for a value at the other end of the sheet.
  const overX = (px - box.left) / (box.width || 1);
  const overY = (py - box.top) / (box.height || 1);
  const outX = overX - 0.5;
  const outY = overY - 0.5;
  // 1 at the value's own corner, and up from there. Normalised per value, so
  // a wide row and a small chip fade at the same rate rather than by pixels -
  // and a row two rows down fades faster than one two columns across, which
  // is right: it is further away in its own terms.
  const away = Math.sqrt(outX * outX + outY * outY) * 2;
  const near = clamp(1 - (away - 1) / FALLOFF, 0, 1);
  // The positions the gradients are drawn from ARE clamped: a value the
  // pointer has left keeps leaning towards it, but only so far, or it is
  // drawn from a gradient ten lengths off the end of itself.
  const x = clamp(overX, -0.5, 1.5);
  const y = clamp(overY, -0.5, 1.5);
  const dx = x - 0.5;
  const dy = y - 0.5;
  const reach = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
  // Turned half a circle, so the angle reads as where the light comes FROM.
  const turn = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
  return {
    "--ep-lamp-x": (x * 100).toFixed(2) + "%",
    "--ep-lamp-y": (y * 100).toFixed(2) + "%",
    "--ep-lamp-dx": (dx * 100).toFixed(2) + "%",
    "--ep-lamp-dy": (dy * 100).toFixed(2) + "%",
    "--ep-lamp-reach": reach.toFixed(3),
    "--ep-lamp-turn": turn.toFixed(1) + "deg",
    "--ep-lamp-near": near.toFixed(3),
  };
}

/**
 * Follow the pointer around `win`, lighting every finish on screen from where
 * the pointer stands on each of them.
 *
 * Returns the way to stop, which the caller registers for cleanup. A popout
 * window gets its own lamp: it is its own document, with its own pointer.
 */
export function installLamp(win: Window): () => void {
  const doc = win.document;
  /** The finishes on screen, refreshed when the document changes under us. */
  let lit: HTMLElement[] = [];
  let stale = true;
  /** Values the light no longer reaches, cleared once and then left alone. */
  const resting = new WeakSet<HTMLElement>();
  let queued = false;
  let px = 0;
  let py = 0;

  // Rather than hunt for finishes on a timer, notice when the document gains
  // or loses one. A row is redrawn on every value change, so this fires often
  // and does nothing but set a flag; the hunting happens once per frame, and
  // only when something actually moved.
  const watch = new MutationObserver(() => {
    stale = true;
  });

  const write = (): void => {
    queued = false;
    if (stale) {
      lit = Array.from(doc.querySelectorAll<HTMLElement>(".ep-fin")).slice(0, LIMIT);
      stale = false;
    }
    // Read every box first, THEN write every property: interleaving them
    // makes the browser lay the page out once per value instead of once.
    const boxes = lit.map((el) => el.getBoundingClientRect());
    const h = win.innerHeight || 1;
    const w = win.innerWidth || 1;
    lit.forEach((el, i) => {
      const box = boxes[i];
      // Nothing to light: collapsed, or scrolled out of the window.
      if (box.width === 0 || box.height === 0 || box.bottom < 0 || box.top > h || box.right < 0 || box.left > w) return;
      const vals = lightFor(box, px, py);
      // A value the light has left goes back to rest once and is then skipped
      // entirely: on a long sheet most values are out of reach at any moment,
      // and there is no sense writing seven properties to say so every frame.
      if (vals["--ep-lamp-near"] === "0.000") {
        if (resting.has(el)) return;
        resting.add(el);
        for (const p of PROPS) el.style.removeProperty("--ep-lamp-" + p);
        return;
      }
      resting.delete(el);
      for (const [k, v] of Object.entries(vals)) el.style.setProperty(k, v);
    });
  };

  /** Work the light out again on the next frame, at most once per frame. */
  const refresh = (): void => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(write);
  };
  const onMove = (e: PointerEvent): void => {
    px = e.clientX;
    py = e.clientY;
    refresh();
  };
  /** Hand the lamp back, so nothing is left lit from a corner it has left. */
  const release = (): void => {
    for (const el of lit) {
      for (const p of PROPS) el.style.removeProperty("--ep-lamp-" + p);
      resting.add(el);
    }
  };

  watch.observe(doc.body, { childList: true, subtree: true });
  win.addEventListener("pointermove", onMove, { passive: true });
  // Scrolling moves the values under a pointer that has not moved at all.
  doc.addEventListener("scroll", refresh, { passive: true, capture: true });
  doc.addEventListener("pointerleave", release);
  win.addEventListener("blur", release);
  return () => {
    watch.disconnect();
    win.removeEventListener("pointermove", onMove);
    doc.removeEventListener("scroll", refresh, true);
    doc.removeEventListener("pointerleave", release);
    win.removeEventListener("blur", release);
    release();
  };
}
