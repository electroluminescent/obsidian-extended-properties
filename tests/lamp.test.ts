/**
 * The light on one value: where the pointer stands on it, how much of the
 * light it is getting, and how fast it is allowed to get there.
 */

import { describe, expect, it } from "vitest";
import {
  approach, CALM_SPEED, lightFor, ORBIT, orbitAt, ORBIT_SECONDS, REST, SPEED, targetFor,
} from "../src/ui/render/lamp";

/** A hundred-pixel square at the origin. */
const box = { left: 0, top: 0, width: 100, height: 100 };

describe("the light on a value", () => {
  it("puts the light where the pointer is on the value, not in the window", () => {
    expect(lightFor(box, 50, 50)["--ep-lamp-x"]).toBe("50.00%");
    expect(lightFor(box, 25, 75)["--ep-lamp-x"]).toBe("25.00%");
    expect(lightFor(box, 25, 75)["--ep-lamp-y"]).toBe("75.00%");
    // The same pointer, a different value: each is lit from its own middle.
    const other = { left: 400, top: 0, width: 100, height: 100 };
    expect(lightFor(other, 450, 50)["--ep-lamp-x"]).toBe("50.00%");
  });

  it("gives a value with the pointer in its middle no reach and all the light", () => {
    const mid = lightFor(box, 50, 50);
    expect(mid["--ep-lamp-reach"]).toBe("0.000");
    expect(mid["--ep-lamp-near"]).toBe("1.000");
    expect(mid["--ep-lamp-dx"]).toBe("0.00%");
  });

  it("reaches full at the value's own corner", () => {
    expect(lightFor(box, 100, 100)["--ep-lamp-reach"]).toBe("1.000");
  });

  it("fades as the pointer leaves, and is gone well before the sheet ends", () => {
    const near = Number(lightFor(box, 150, 50)["--ep-lamp-near"]);
    const far = Number(lightFor(box, 400, 50)["--ep-lamp-near"]);
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(1);
    expect(far).toBe(0);
  });

  it("never runs the gradients far off the end of the value", () => {
    const x = lightFor(box, 100000, 50)["--ep-lamp-x"];
    expect(Number.parseFloat(x)).toBeLessThanOrEqual(150);
    expect(Number.parseFloat(lightFor(box, -100000, 50)["--ep-lamp-x"])).toBeGreaterThanOrEqual(-50);
  });

  it("survives a value with no size at all", () => {
    const flat = lightFor({ left: 0, top: 0, width: 0, height: 0 }, 10, 10);
    expect(Number.isFinite(Number.parseFloat(flat["--ep-lamp-x"]))).toBe(true);
  });
});

describe("the light travelling", () => {
  const dt = 1 / 60;

  it("never crosses a value faster than the speed limit", () => {
    // A pointer flung from one end of the window to the other: however far
    // the target has jumped, one frame moves the light by a bounded amount.
    const one = approach(0, 50, dt);
    expect(one).toBeGreaterThan(0);
    expect(one).toBeLessThanOrEqual(2.2 * dt + 1e-9);
  });

  it("travels at the limit while it is far off, then eases as it arrives", () => {
    let cur = 0;
    const steps: number[] = [];
    for (let i = 0; i < 60; i++) {
      const next = approach(cur, 1, dt);
      steps.push(next - cur);
      cur = next;
    }
    const cap = 2.2 * dt;
    // Never faster than the limit, and never speeding up.
    for (const s of steps) expect(s).toBeLessThanOrEqual(cap + 1e-9);
    // ...and never speeding up, bar the last hair's breadth, which is taken
    // in one go rather than approached forever.
    for (let i = 1; i < steps.length; i++) {
      if (steps[i] <= 0.002) continue;
      expect(steps[i]).toBeLessThanOrEqual(steps[i - 1] + 1e-9);
    }
    // It starts at the limit and finishes well under it: a slow arrival, not
    // a stop dead.
    expect(steps[0]).toBeCloseTo(cap, 6);
    expect(steps[30]).toBeLessThan(cap / 4);
  });

  it("gets there in the end, and stops there", () => {
    let cur = 0;
    for (let i = 0; i < 400; i++) cur = approach(cur, 1, dt);
    expect(cur).toBe(1);
    expect(approach(1, 1, dt)).toBe(1);
  });

  it("comes back the same way it went", () => {
    let cur = 1;
    const first = 1 - approach(cur, 0, dt);
    expect(first).toBeGreaterThan(0);
    for (let i = 0; i < 400; i++) cur = approach(cur, 0, dt);
    expect(cur).toBe(0);
  });

  it("rests where the stylesheet rests", () => {
    // The handover from the lamp to the stylesheet has to be invisible, which
    // means these numbers and the resting ones in styles.css are the same.
    const props = lightFor({ left: 0, top: 0, width: 100, height: 100 }, 42, 28);
    expect(props["--ep-lamp-x"]).toBe("42.00%");
    expect(props["--ep-lamp-y"]).toBe("28.00%");
    expect(props["--ep-lamp-dx"]).toBe("-8.00%");
    expect(props["--ep-lamp-dy"]).toBe("-22.00%");
    expect(props["--ep-lamp-reach"]).toBe("0.468");
    expect(props["--ep-lamp-turn"]).toBe("70.0deg");
    expect(REST.x).toBe(0.42);
    expect(REST.y).toBe(0.28);
  });

  it("reports a target as a light rather than as text", () => {
    const t = targetFor({ left: 0, top: 0, width: 100, height: 100 }, 50, 50);
    expect(t).toEqual({ x: 0.5, y: 0.5, near: 1 });
  });
});

describe("the light wandering, and being asked to calm down", () => {
  const dt = 1 / 60;

  it("orbits, and comes back to where it started", () => {
    const a = orbitAt(0);
    const half = orbitAt(ORBIT_SECONDS / 2);
    const round = orbitAt(ORBIT_SECONDS);
    expect(a.x).toBeCloseTo(ORBIT, 6);
    expect(half.x).toBeCloseTo(-ORBIT, 6);
    expect(round.x).toBeCloseTo(a.x, 6);
    expect(round.y).toBeCloseTo(a.y, 6);
  });

  it("wanders little enough to be a breath rather than a movement", () => {
    for (let t = 0; t < ORBIT_SECONDS; t += 0.25) {
      const o = orbitAt(t);
      expect(Math.abs(o.x)).toBeLessThanOrEqual(ORBIT + 1e-9);
      expect(Math.abs(o.y)).toBeLessThanOrEqual(ORBIT + 1e-9);
    }
  });

  it("carries the light with it, without changing how much there is", () => {
    const box = { left: 0, top: 0, width: 100, height: 100 };
    const still = targetFor(box, 50, 50);
    const carried = targetFor(box, 50, 50, orbitAt(3));
    expect(carried.x).not.toBe(still.x);
    // How near the light is belongs to the pointer, not to the wandering.
    expect(carried.near).toBe(still.near);
  });

  it("crawls when asked to: the same crossing takes many times as long", () => {
    const steps = (speed: number): number => {
      let cur = 0;
      let n = 0;
      while (cur < 0.999 && n < 100000) {
        cur = approach(cur, 1, dt, speed, speed === CALM_SPEED ? 2.5 : undefined);
        n++;
      }
      return n;
    };
    const brisk = steps(SPEED);
    const calm = steps(CALM_SPEED);
    expect(calm).toBeGreaterThan(brisk * 4);
    // ...and a quarter of a value per second is four seconds to cross one.
    expect(approach(0, 10, 1, CALM_SPEED, 2.5)).toBeCloseTo(CALM_SPEED, 6);
  });
});
