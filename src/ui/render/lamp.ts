/**
 * The light on the finishes: one lamp, every value lit relative to itself,
 * and the light TRAVELS rather than teleports.
 *
 * A finish is a material, and a material is only material because the light
 * on it moves. The pointer is that light. What matters to a value, though, is
 * not where the pointer is in the window - it is where the pointer is on the
 * value: a highlight belongs under the cursor, and a sheet of ten rows should
 * catch the light one row at a time as you cross them, not all at once.
 *
 * Two things are worked out per value, per frame:
 *
 *   the TARGET   where the pointer stands on it right now
 *   the CURRENT  where the light has actually got to
 *
 * and the current moves towards the target at a speed with a ceiling on it.
 * That ceiling is the whole point: a pointer flung across the window would
 * otherwise strobe every value it passed, and the light leaving would snap
 * back to rest like a switch being thrown. Light does neither. It eases in,
 * it eases out, and it can only cross a value so fast.
 *
 * What is written on each value:
 *
 *   --ep-lamp-x, --ep-lamp-y     where the light is ON this value, 0-100%
 *   --ep-lamp-dx, --ep-lamp-dy   the same, measured from its middle
 *   --ep-lamp-reach              0-1, how far out from its middle
 *   --ep-lamp-turn               the angle from its middle to the light
 *   --ep-lamp-near               1 with the light on it, 0 once it has gone
 *
 * The frame is one read pass over the boxes and one write pass over the
 * properties, in that order, so the browser lays out once rather than once
 * per value. Nothing is written on the document itself: a value the light has
 * not reached inherits the resting light from the stylesheet, which is where
 * it belongs - and a value settling back to rest is handed over to those same
 * values exactly when it arrives at them, so there is nothing to see.
 *
 * The stylesheet names every one of these with a resting value, so this is an
 * embellishment and never a requirement: with no pointer, no listener and no
 * JavaScript at all, the finishes are still correct - just still. Under
 * `prefers-reduced-motion` nothing is installed at all.
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

/**
 * How eagerly the light approaches where it is going, per second. Higher is
 * more responsive and less liquid; this reaches most of the way in about a
 * tenth of a second, which reads as light rather than as lag.
 */
const RATE = 9;

/**
 * The speed limit, in value-lengths per second. Nothing may cross a value
 * faster than this however violently the pointer moves, which is what stops a
 * flung cursor strobing a sheet of rows.
 */
const SPEED = 2.2;

/** Close enough to have arrived. */
const SNAP = 0.002;

/** The longest step taken in one frame, so a stalled tab does not lurch. */
const MAX_FRAME = 0.05;

const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);

/** As much of a box as the light needs. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where the light is on one value, and how much of it there is. */
export interface Light {
  /** Across the value: 0 its left edge, 1 its right. */
  x: number;
  /** Down it. */
  y: number;
  /** How much of the light it is getting, 1 to 0. */
  near: number;
}

/**
 * Where the light rests when nothing is pointing at anything: overhead and a
 * little to the left, which is where a reader with no pointer expects a
 * highlight to be. Identical to the resting values in the stylesheet, so a
 * value that has settled here can have its properties taken away without
 * anything moving.
 */
export const REST: Light = { x: 0.42, y: 0.28, near: 0.35 };

/** Where the light would be on `box` with the pointer at (px, py). */
export function targetFor(box: Box, px: number, py: number): Light {
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
  // The positions the gradients are drawn from ARE clamped: a value the
  // pointer has left keeps leaning towards it, but only so far, or it is
  // drawn from a gradient ten lengths off the end of itself.
  return {
    x: clamp(overX, -0.5, 1.5),
    y: clamp(overY, -0.5, 1.5),
    near: clamp(1 - (away - 1) / FALLOFF, 0, 1),
  };
}

/** The properties a light is written as. */
export function propsOf(light: Light): Record<string, string> {
  const dx = light.x - 0.5;
  const dy = light.y - 0.5;
  const reach = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
  // Turned half a circle, so the angle reads as where the light comes FROM.
  const turn = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
  return {
    "--ep-lamp-x": (light.x * 100).toFixed(2) + "%",
    "--ep-lamp-y": (light.y * 100).toFixed(2) + "%",
    "--ep-lamp-dx": (dx * 100).toFixed(2) + "%",
    "--ep-lamp-dy": (dy * 100).toFixed(2) + "%",
    "--ep-lamp-reach": reach.toFixed(3),
    "--ep-lamp-turn": turn.toFixed(1) + "deg",
    "--ep-lamp-near": light.near.toFixed(3),
  };
}

/** What one value's light looks like with the pointer at (px, py), settled. */
export function lightFor(box: Box, px: number, py: number): Record<string, string> {
  return propsOf(targetFor(box, px, py));
}

/**
 * One step of `cur` towards `to`, over `dt` seconds.
 *
 * Eased, so it slows as it arrives rather than stopping dead - and capped, so
 * however far away the target suddenly is, the light crosses at most `SPEED`
 * of a value per second. The cap is what a transition cannot give you: an
 * eased move is proportional to the distance, so a pointer jumping right
 * across the window would still cross in one blink.
 */
export function approach(cur: number, to: number, dt: number): number {
  const gap = to - cur;
  if (Math.abs(gap) < SNAP) return to;
  const eased = gap * (1 - Math.exp(-RATE * dt));
  const cap = SPEED * dt;
  return cur + clamp(eased, -cap, cap);
}

/** Move a whole light one step towards another. */
function step(cur: Light, to: Light, dt: number): Light {
  return {
    x: approach(cur.x, to.x, dt),
    y: approach(cur.y, to.y, dt),
    near: approach(cur.near, to.near, dt),
  };
}

/** Whether a light has arrived where it was going. */
function settled(cur: Light, to: Light): boolean {
  return (
    Math.abs(cur.x - to.x) < SNAP && Math.abs(cur.y - to.y) < SNAP && Math.abs(cur.near - to.near) < SNAP
  );
}

/**
 * Follow the pointer around `win`, lighting every finish on screen from where
 * the pointer stands on each of them - and letting the light travel there.
 *
 * Returns the way to stop, which the caller registers for cleanup. A popout
 * window gets its own lamp: it is its own document, with its own pointer.
 */
export function installLamp(win: Window): () => void {
  const doc = win.document;
  // Somebody who has asked for less movement is not asking for a lamp that
  // follows them around. The stylesheet pins the resting light in that case,
  // so the materials are all still there - they simply hold still.
  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => undefined;

  /** The finishes on screen, refreshed when the document changes under us. */
  let lit: HTMLElement[] = [];
  /**
   * What each of them is lit AS: itself, or the row it is one piece of.
   *
   * A list of chips wearing one finish is one sheet with chips cut out of it
   * (see `format.ts`), so the light has to be worked out across the sheet -
   * otherwise every chip carries its own highlight and the row reads as five
   * little cards rather than one.
   */
  let sheets: HTMLElement[] = [];
  let stale = true;
  /** Where the light has actually got to, per value. */
  const at = new WeakMap<HTMLElement, Light>();
  /** Values sitting at rest with nothing written on them. */
  const resting = new WeakSet<HTMLElement>();
  /** The pointer, and whether it is in the window at all. */
  let px = 0;
  let py = 0;
  let away = true;
  let frame = 0;
  let last = 0;

  // Rather than hunt for finishes on a timer, notice when the document gains
  // or loses one. A row is redrawn on every value change, so this fires often
  // and does nothing but set a flag; the hunting happens once per frame, and
  // only when something actually moved.
  const watch = new MutationObserver(() => {
    stale = true;
  });

  const tick = (now: number): void => {
    frame = 0;
    const dt = last ? Math.min(MAX_FRAME, (now - last) / 1000) : 1 / 60;
    last = now;
    if (stale) {
      lit = Array.from(doc.querySelectorAll<HTMLElement>(".ep-fin")).slice(0, LIMIT);
      sheets = lit.map((el) => el.closest<HTMLElement>(".ep-fin-sheet") ?? el);
      stale = false;
    }
    // Read every box first, THEN write every property: interleaving them
    // makes the browser lay the page out once per value instead of once.
    const boxes = sheets.map((el) => el.getBoundingClientRect());
    const h = win.innerHeight || 1;
    const w = win.innerWidth || 1;
    let moving = false;
    lit.forEach((el, i) => {
      const box = boxes[i];
      // Nothing to light: collapsed, or scrolled out of the window. It keeps
      // whatever it had, so coming back into view is not a fresh arrival.
      if (box.width === 0 || box.height === 0 || box.bottom < 0 || box.top > h || box.right < 0 || box.left > w) return;
      const to = away ? REST : targetFor(box, px, py);
      const cur = at.get(el) ?? REST;
      if (settled(cur, to)) {
        // Arrived. If that is rest, hand the value back to the stylesheet -
        // its resting values are these ones, so nothing moves as it changes
        // hands - and stop paying any attention to it.
        if (to === REST || settled(to, REST)) {
          if (!resting.has(el)) {
            resting.add(el);
            at.set(el, REST);
            for (const p of PROPS) el.style.removeProperty("--ep-lamp-" + p);
          }
          return;
        }
        at.set(el, to);
        return;
      }
      const next = step(cur, to, dt);
      at.set(el, next);
      resting.delete(el);
      moving = true;
      for (const [k, v] of Object.entries(propsOf(next))) el.style.setProperty(k, v);
    });
    // Keep going while anything is still travelling, or while the pointer is
    // in the window at all - it may not have moved, but the page under it can.
    if (moving || !away) run();
  };

  /** Ask for a frame, at most one at a time. */
  const run = (): void => {
    if (frame) return;
    frame = win.requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent): void => {
    px = e.clientX;
    py = e.clientY;
    away = false;
    run();
  };
  /**
   * The pointer has gone. Nothing is cleared here: the targets become rest and
   * the light eases back to it over the next few frames, which is the whole
   * difference between a lamp being carried away and a lamp being switched
   * off.
   */
  const release = (): void => {
    away = true;
    run();
  };

  watch.observe(doc.body, { childList: true, subtree: true });
  win.addEventListener("pointermove", onMove, { passive: true });
  // Scrolling moves the values under a pointer that has not moved at all.
  doc.addEventListener("scroll", run, { passive: true, capture: true });
  doc.addEventListener("pointerleave", release);
  win.addEventListener("blur", release);
  return () => {
    watch.disconnect();
    if (frame) win.cancelAnimationFrame(frame);
    win.removeEventListener("pointermove", onMove);
    doc.removeEventListener("scroll", run, true);
    doc.removeEventListener("pointerleave", release);
    win.removeEventListener("blur", release);
    for (const el of lit) for (const p of PROPS) el.style.removeProperty("--ep-lamp-" + p);
  };
}
