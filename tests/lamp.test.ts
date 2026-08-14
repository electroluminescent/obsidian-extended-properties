/**
 * The light on one value: where the pointer stands on it, and how much of the
 * light it is getting.
 */

import { describe, expect, it } from "vitest";
import { lightFor } from "../src/ui/render/lamp";

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
