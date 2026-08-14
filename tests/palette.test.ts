/**
 * Turning a value into a colour: the wheel, the stops, the bands, and what
 * happens at their edges.
 */

import { describe, expect, it } from "vitest";
import {
  blendColors, colorAt, colorForText, defaultWheel, ensureDominance, mixColors, moveEdge,
  rangesValid, readableOn, setDominant, toOklch, type ColorRange, type Palette,
} from "../src/utils/palette";
import { formatEdge, parseEdge } from "../src/utils/palette-date";
import type { DateConfig } from "../src/core/calendar";

const wheel = (): Palette => ({ id: "w", name: "Wheel", mode: "wheel", wheel: defaultWheel() });

const points = (): Palette => ({
  id: "p",
  name: "Points",
  mode: "points",
  points: [
    { at: 0, color: "#ff0000" },
    { at: 10, color: "#0000ff" },
  ],
});

const bands = (extra: Partial<Palette> = {}): Palette => ({
  id: "r",
  name: "Bands",
  mode: "ranges",
  ranges: [
    { from: 0, to: 10, color: "#ff0000" },
    { from: 20, to: 30, color: "#0000ff" },
  ],
  ...extra,
});

/** The hue of a colour, for asserting where round the circle it landed. */
const hueOf = (hex: string | undefined): number => {
  const c = toOklch(hex ?? "");
  return c ? Math.round(c.H) : NaN;
};

describe("the wheel", () => {
  it("sweeps from the start hue across the spread", () => {
    const p = wheel();
    const span = { min: 0, max: 100 };
    const low = hueOf(colorAt(p, 0, span));
    const high = hueOf(colorAt(p, 100, span));
    expect(low).toBe(250);
    // 250 + 250 = 500, which is 140 round the circle.
    expect(high).toBe(140);
  });

  it("puts the middle value in the middle of the sweep", () => {
    expect(hueOf(colorAt(wheel(), 50, { min: 0, max: 100 }))).toBe(15);
  });

  it("goes the other way when reversed", () => {
    const p: Palette = { ...wheel(), wheel: { ...defaultWheel(), reverse: true } };
    expect(hueOf(colorAt(p, 100, { min: 0, max: 100 }))).toBe(0); // 250 - 250
  });

  it("gives nothing without a stretch to spread over", () => {
    expect(colorAt(wheel(), 5)).toBeUndefined();
  });
});

describe("stops", () => {
  it("gives a stop its own colour", () => {
    expect(colorAt(points(), 0)).toBe("#ff0000");
    expect(colorAt(points(), 10)).toBe("#0000ff");
  });

  it("blends between two stops, through the colours between them", () => {
    const mid = colorAt(points(), 5);
    expect(mid).not.toBe("#ff0000");
    expect(mid).not.toBe("#0000ff");
    // Halfway from red to blue the long way round is not grey: it keeps its
    // chroma, which is the whole reason for blending in OKLCH.
    expect(toOklch(mid ?? "")!.C).toBeGreaterThan(0.1);
  });

  it("holds the end colours beyond the ends", () => {
    expect(colorAt(points(), -50)).toBe("#ff0000");
    expect(colorAt(points(), 999)).toBe("#0000ff");
  });
});

describe("bands", () => {
  it("gives every value in a band the same colour", () => {
    expect(colorAt(bands(), 0)).toBe("#ff0000");
    expect(colorAt(bands(), 7)).toBe("#ff0000");
    expect(colorAt(bands(), 25)).toBe("#0000ff");
  });

  it("gives nothing in the gap, unless the gap is set to blend", () => {
    expect(colorAt(bands(), 15)).toBeUndefined();
    const blended = colorAt(bands({ gaps: "blend" }), 15);
    expect(blended).toBeDefined();
    expect(blended).not.toBe("#ff0000");
  });

  it("gives nothing outside, unless the ends are set to hold", () => {
    expect(colorAt(bands(), -5)).toBeUndefined();
    expect(colorAt(bands(), 99)).toBeUndefined();
    expect(colorAt(bands({ outside: "clamp" }), -5)).toBe("#ff0000");
    expect(colorAt(bands({ outside: "clamp" }), 99)).toBe("#0000ff");
  });

  it("hands a shared edge to whichever side was marked dominant", () => {
    const touching: ColorRange[] = [
      { from: 0, to: 10, color: "#ff0000" },
      { from: 10, to: 20, color: "#0000ff" },
    ];
    const lower = bands({ ranges: touching });
    expect(colorAt(lower, 10)).toBe("#ff0000"); // the lower band, by default
    const upper = bands({ ranges: setDominant(touching, 1, "from", true) });
    expect(colorAt(upper, 10)).toBe("#0000ff");
  });
});

describe("who owns a shared edge", () => {
  const touching = (): ColorRange[] => [
    { from: 0, to: 10, color: "#f00" },
    { from: 10, to: 20, color: "#00f" },
  ];

  it("gives an unclaimed meeting point to the band that starts there", () => {
    const rs = ensureDominance(touching());
    expect(rs[1].domFrom).toBe(true);
    expect(rs[0].domTo).toBeUndefined();
    expect(colorAt({ id: "r", name: "R", mode: "ranges", ranges: rs }, 10)).toBe("#00f");
  });

  it("leaves a claim where the user put it", () => {
    const rs = ensureDominance([{ ...touching()[0], domTo: true }, touching()[1]]);
    expect(rs[0].domTo).toBe(true);
    expect(rs[1].domFrom).toBeUndefined();
  });

  it("never leaves two edges claiming the same value", () => {
    const rs = ensureDominance([
      { from: 0, to: 10, color: "#f00", domTo: true },
      { from: 10, to: 20, color: "#00f", domFrom: true },
    ]);
    expect([rs[0].domTo === true, rs[1].domFrom === true].filter(Boolean)).toHaveLength(1);
  });

  it("drops a claim on an edge that meets nothing", () => {
    const rs = ensureDominance([
      { from: 0, to: 10, color: "#f00", domFrom: true, domTo: true },
      { from: 20, to: 30, color: "#00f" },
    ]);
    expect(rs[0].domFrom).toBeUndefined();
    expect(rs[0].domTo).toBeUndefined();
  });

  it("moves the claim when another edge is picked, and keeps exactly one", () => {
    const first = ensureDominance(touching());
    const moved = setDominant(first, 0, "to", true);
    expect(moved[0].domTo).toBe(true);
    expect(moved[1].domFrom).toBeUndefined();
  });

  it("settles every meeting point of three bands at once", () => {
    const rs = ensureDominance([
      { from: 0, to: 10, color: "#f00" },
      { from: 10, to: 20, color: "#0f0" },
      { from: 20, to: 30, color: "#00f" },
    ]);
    expect(rs[1].domFrom).toBe(true);
    expect(rs[2].domFrom).toBe(true);
    expect(rs[0].domTo).toBeUndefined();
    expect(rs[1].domTo).toBeUndefined();
  });
});

describe("keeping the bands legal", () => {
  it("accepts bands that touch and refuses bands that overlap", () => {
    expect(rangesValid([{ from: 0, to: 10, color: "#f00" }, { from: 10, to: 20, color: "#00f" }])).toBe(true);
    expect(rangesValid([{ from: 0, to: 10, color: "#f00" }, { from: 5, to: 20, color: "#00f" }])).toBe(false);
    expect(rangesValid([{ from: 10, to: 0, color: "#f00" }])).toBe(false);
  });

  it("carries the neighbour when the edges are linked", () => {
    const rs: ColorRange[] = [
      { from: 0, to: 10, color: "#f00" },
      { from: 10, to: 20, color: "#00f" },
    ];
    const moved = moveEdge(rs, 1, "from", 14, true);
    expect(moved[1].from).toBe(14);
    expect(moved[0].to).toBe(14); // the one before followed
    const alone = moveEdge(rs, 1, "from", 14, false);
    expect(alone[0].to).toBe(10); // ...and did not, unlinked
  });

  it("lets only one edge of a shared number be dominant", () => {
    const rs: ColorRange[] = [
      { from: 0, to: 10, color: "#f00", domTo: true },
      { from: 10, to: 20, color: "#00f" },
    ];
    const next = setDominant(rs, 1, "from", true);
    expect(next[1].domFrom).toBe(true);
    expect(next[0].domTo).toBeUndefined();
  });
});

describe("words", () => {
  it("takes the colour it was given", () => {
    const p: Palette = { id: "s", name: "S", mode: "points", words: [{ word: "Poison", color: "#00ff00" }] };
    expect(colorForText(p, "poison")).toBe("#00ff00");
  });

  it("otherwise reads its place in the allowed values as a number", () => {
    const p = points();
    expect(colorForText(p, "low", ["low", "mid", "high"])).toBe(colorAt(p, 0));
    expect(colorForText(p, "high", ["low", "mid", "high"])).toBe(colorAt(p, 2));
  });

  it("gives nothing for a word it has never met", () => {
    expect(colorForText(points(), "quixotic", ["low", "high"])).toBeUndefined();
    expect(colorForText(points(), "   ")).toBeUndefined();
  });
});

describe("mixing", () => {
  it("averages a handful of colours without turning them to mud", () => {
    const mixed = blendColors(["#ff0000", "#00ff00"]);
    expect(mixed).toBeDefined();
    expect(toOklch(mixed!)!.C).toBeGreaterThan(0.05);
  });

  it("ignores anything that is not a colour", () => {
    expect(blendColors(["nonsense"])).toBeUndefined();
    expect(blendColors(["nonsense", "#ffffff"])).toBe("#ffffff");
  });

  it("takes the hue of whichever partner has one", () => {
    // Grey has no hue to travel from, so the mix keeps the red's.
    const mixed = mixColors("#808080", "#ff0000", 0.5);
    expect(Math.abs(hueOf(mixed) - hueOf("#ff0000"))).toBeLessThan(2);
  });
});

describe("text that can be read on it", () => {
  it("is black on a light fill and white on a dark one", () => {
    expect(readableOn("#ffffff")).toBe("#000000");
    expect(readableOn("#111111")).toBe("#ffffff");
  });
});

describe("edges written as dates", () => {
  const cfg: DateConfig = { format: "YYYY-MM-DD" };

  it("stores what was typed as the number behind it", () => {
    const n = parseEdge("1312-06-03", cfg);
    expect(n).toBeDefined();
    expect(formatEdge(n, cfg)).toBe("1312-06-03");
  });

  it("takes a plain number as the stored value itself", () => {
    expect(parseEdge("487000", cfg)).toBe(487000);
  });

  it("gives nothing for what is not a date", () => {
    expect(parseEdge("", cfg)).toBeUndefined();
    expect(parseEdge("sometime", cfg)).toBeUndefined();
    expect(formatEdge(undefined, cfg)).toBe("");
  });

  it("orders the way the calendar does, so bands over dates work", () => {
    const a = parseEdge("1312-06-03", cfg)!;
    const b = parseEdge("1312-07-03", cfg)!;
    expect(b).toBeGreaterThan(a);
  });
});
