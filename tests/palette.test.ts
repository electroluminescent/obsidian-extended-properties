/**
 * Turning a value into a colour: the wheel, the stops, the bands, and what
 * happens at their edges.
 */

import { describe, expect, it } from "vitest";
import {
  blendColors, colorAt, colorForText, defaultWheel, edgeContested, ensureDominance, insertStep,
  midpointBlend, mixColors, moveColor, moveEdge, positionalBlend, readableOn, removeStep,
  percentIn, setDominant, stepsValid, toOklch, type Palette, type ScaleStep,
} from "../src/utils/palette";
import { formatEdge, parseEdge } from "../src/utils/palette-date";
import type { DateConfig } from "../src/core/calendar";

const wheel = (): Palette => ({ id: "w", name: "Wheel", mode: "wheel", wheel: defaultWheel() });

/** Two stops, as the old points mode became after the migration. */
const points = (): Palette => ({
  id: "p",
  name: "Points",
  mode: "bands",
  steps: [
    { from: 0, to: 0, point: true },
    { from: 10, to: 10, point: true },
  ],
  colors: ["#ff0000", "#0000ff"],
  gaps: "blend",
  outside: "clamp",
});

const bands = (extra: Partial<Palette> = {}): Palette => ({
  id: "r",
  name: "Bands",
  mode: "bands",
  steps: [
    { from: 0, to: 10 },
    { from: 20, to: 30 },
  ],
  colors: ["#ff0000", "#0000ff"],
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
    const touching: ScaleStep[] = [
      { from: 0, to: 10 },
      { from: 10, to: 20 },
    ];
    const lower = bands({ steps: touching });
    expect(colorAt(lower, 10)).toBe("#ff0000"); // the lower band, by default
    const upper = bands({ steps: setDominant(touching, 1, "from", true) });
    expect(colorAt(upper, 10)).toBe("#0000ff");
  });
});

describe("who owns a shared edge", () => {
  const touching = (): ScaleStep[] => [
    { from: 0, to: 10 },
    { from: 10, to: 20 },
  ];

  it("gives an unclaimed meeting point to the band that starts there", () => {
    const rs = ensureDominance(touching());
    expect(rs[1].domFrom).toBe(true);
    expect(rs[0].domTo).toBeUndefined();
    expect(colorAt({ id: "r", name: "R", mode: "bands", steps: rs, colors: ["#f00", "#00f"] }, 10)).toBe("#00f");
  });

  it("leaves a claim where the user put it", () => {
    const rs = ensureDominance([{ ...touching()[0], domTo: true }, touching()[1]]);
    expect(rs[0].domTo).toBe(true);
    expect(rs[1].domFrom).toBeUndefined();
  });

  it("never leaves two edges claiming the same value", () => {
    const rs = ensureDominance([
      { from: 0, to: 10, domTo: true },
      { from: 10, to: 20, domFrom: true },
    ]);
    expect([rs[0].domTo === true, rs[1].domFrom === true].filter(Boolean)).toHaveLength(1);
  });

  it("drops a claim on an edge that meets nothing", () => {
    const rs = ensureDominance([
      { from: 0, to: 10, domFrom: true, domTo: true },
      { from: 20, to: 30 },
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
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
    ]);
    expect(rs[1].domFrom).toBe(true);
    expect(rs[2].domFrom).toBe(true);
    expect(rs[0].domTo).toBeUndefined();
    expect(rs[1].domTo).toBeUndefined();
  });
});

describe("keeping the bands legal", () => {
  it("accepts bands that touch and refuses bands that overlap", () => {
    expect(stepsValid([{ from: 0, to: 10 }, { from: 10, to: 20 }])).toBe(true);
    expect(stepsValid([{ from: 0, to: 10 }, { from: 5, to: 20 }])).toBe(false);
    expect(stepsValid([{ from: 10, to: 0 }])).toBe(false);
  });

  it("lets a stop stand wherever it likes, a band's middle included", () => {
    expect(stepsValid([{ from: 0, to: 10 }, { from: 5, to: 5, point: true }])).toBe(true);
    expect(stepsValid([{ from: 5, to: 6, point: true }])).toBe(false); // a stop has no width
  });

  it("carries the neighbour when the edges are linked", () => {
    const rs: ScaleStep[] = [
      { from: 0, to: 10 },
      { from: 10, to: 20 },
    ];
    const moved = moveEdge(rs, 1, "from", 14, true);
    expect(moved[1].from).toBe(14);
    expect(moved[0].to).toBe(14); // the one before followed
    const alone = moveEdge(rs, 1, "from", 14, false);
    expect(alone[0].to).toBe(10); // ...and did not, unlinked
  });

  it("lets only one edge of a shared number be dominant", () => {
    const rs: ScaleStep[] = [
      { from: 0, to: 10, domTo: true },
      { from: 10, to: 20 },
    ];
    const next = setDominant(rs, 1, "from", true);
    expect(next[1].domFrom).toBe(true);
    expect(next[0].domTo).toBeUndefined();
  });
});

describe("stops and bands on one scale", () => {
  const mixed = (): Palette => ({
    id: "m",
    name: "Mixed",
    mode: "bands",
    steps: [
      { from: 0, to: 10 },
      { from: 10, to: 10, point: true },
      { from: 10, to: 20 },
    ],
    colors: ["#ff0000", "#00ff00", "#0000ff"],
  });

  it("hands a value a stop names to the stop, whatever the bands claim", () => {
    expect(colorAt(mixed(), 10)).toBe("#00ff00");
    expect(colorAt(mixed(), 5)).toBe("#ff0000");
    expect(colorAt(mixed(), 15)).toBe("#0000ff");
  });

  it("lets a stop pick one value out of the middle of a band", () => {
    const p: Palette = {
      id: "i", name: "I", mode: "bands",
      steps: [{ from: 0, to: 100 }, { from: 20, to: 20, point: true }],
      colors: ["#ff0000", "#00ff00"],
    };
    expect(colorAt(p, 20)).toBe("#00ff00");
    expect(colorAt(p, 21)).toBe("#ff0000");
  });

  it("offers no claim on an edge a stop is standing on", () => {
    const steps = mixed().steps as ScaleStep[];
    expect(edgeContested(steps, 0, "to")).toBe(false);
    expect(edgeContested(steps, 2, "from")).toBe(false);
    const settled = ensureDominance(steps);
    expect(settled[0].domTo).toBeUndefined();
    expect(settled[2].domFrom).toBeUndefined();
  });

  it("still settles a meeting point with no stop on it", () => {
    const steps: ScaleStep[] = [{ from: 0, to: 10 }, { from: 10, to: 20 }];
    expect(edgeContested(steps, 1, "from")).toBe(true);
  });

  it("moves a stop whole, from either edge", () => {
    const moved = moveEdge([{ from: 5, to: 5, point: true }], 0, "to", 9, false);
    expect(moved[0]).toEqual({ from: 9, to: 9, point: true });
  });
});

describe("putting a step in, and taking one out", () => {
  const two = (): { steps: ScaleStep[]; colors: string[] } => ({
    steps: [{ from: 0, to: 10 }, { from: 20, to: 30 }],
    colors: ["#ff0000", "#0000ff"],
  });

  it("fills the gap between two bands, and blends the colour it lands between", () => {
    const { steps, colors } = two();
    const next = insertStep(steps, colors, 1, "band");
    expect(next.steps[1]).toMatchObject({ from: 10, to: 20 });
    expect(next.colors[1]).not.toBe("#ff0000");
    expect(next.colors[1]).not.toBe("#0000ff");
    expect(toOklch(next.colors[1])!.C).toBeGreaterThan(0.1); // through the colours, not through grey
  });

  it("makes room when the bands it lands between are touching", () => {
    const steps: ScaleStep[] = [{ from: 0, to: 10 }, { from: 10, to: 20 }];
    const next = insertStep(steps, ["#f00", "#00f"], 1, "band");
    expect(next.steps[1].from).toBe(10);
    expect(next.steps[2].from).toBeGreaterThanOrEqual(next.steps[1].to); // the one above moved up
    expect(stepsValid(next.steps)).toBe(true);
  });

  it("puts a stop halfway between its neighbours and moves nothing", () => {
    const { steps, colors } = two();
    const next = insertStep(steps, colors, 1, "point");
    expect(next.steps[1]).toMatchObject({ from: 15, to: 15, point: true });
    expect(next.steps[2]).toMatchObject({ from: 20, to: 30 });
  });

  it("takes a step and its colour away together", () => {
    const { steps, colors } = two();
    const next = removeStep(steps, colors, 0);
    expect(next.steps).toHaveLength(1);
    expect(next.colors).toEqual(["#0000ff"]);
  });
});

describe("colours that move on their own", () => {
  it("slides the others out of the way when one is moved", () => {
    expect(moveColor(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveColor(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveColor(["a", "b", "c"], 1, 99)).toEqual(["a", "c", "b"]);
  });

  it("blends from the two either side, halfway", () => {
    const mid = midpointBlend(["#ff0000", "#000000", "#0000ff"], 1);
    expect(mid).toBeDefined();
    expect(mid).not.toBe("#000000");
    expect(midpointBlend(["#ff0000", "#00ff00"], 1)).toBe("#ff0000"); // nothing above it
  });

  it("blends by where the step sits between its neighbours", () => {
    const steps: ScaleStep[] = [
      { from: 0, to: 0, point: true },
      { from: 9, to: 9, point: true },
      { from: 10, to: 10, point: true },
    ];
    const colors = ["#ff0000", "#000000", "#0000ff"];
    const near = positionalBlend(steps, colors, 1);
    const mid = midpointBlend(colors, 1);
    expect(near).not.toBe(mid); // nine tenths of the way along, not half
    expect(near).toBe(mixColors("#ff0000", "#0000ff", 0.9));
  });
});

describe("words", () => {
  it("takes the colour it was given", () => {
    const p: Palette = { id: "s", name: "S", mode: "bands", words: [{ word: "Poison", color: "#00ff00" }] };
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

describe("a scale written in per cent of the property's own range", () => {
  /** Low, middling and high - as thirds, in no particular units. */
  const thirds = (): Palette => ({
    id: "r",
    name: "Relative",
    mode: "bands",
    relative: true,
    steps: [
      { from: 0, to: 33 },
      { from: 33, to: 66 },
      { from: 66, to: 100 },
    ],
    colors: ["#ff0000", "#ffff00", "#00ff00"],
  });

  it("says where a value sits in its span", () => {
    expect(percentIn(5, { min: 0, max: 20 })).toBe(25);
    expect(percentIn(0, { min: -10, max: 10 })).toBe(50);
    expect(percentIn(150, { min: 0, max: 100 })).toBe(150); // outside stays outside
    expect(percentIn(3, { min: 3, max: 3 })).toBe(0); // a span of no width
  });

  it("dresses two properties of wildly different size the same way", () => {
    const skill = { min: 0, max: 20 };
    const fortune = { min: 0, max: 10000 };
    // A tenth of the way up is the low band in both.
    expect(colorAt(thirds(), 2, skill)).toBe("#ff0000");
    expect(colorAt(thirds(), 1000, fortune)).toBe("#ff0000");
    // ...and nine tenths is the high one.
    expect(colorAt(thirds(), 18, skill)).toBe("#00ff00");
    expect(colorAt(thirds(), 9000, fortune)).toBe("#00ff00");
  });

  it("reads the numbers as values again when it is told to", () => {
    const absolute: Palette = { ...thirds(), relative: undefined };
    // 18 is now simply the number 18, which sits in the first band - even
    // though it is nine tenths of the way up a skill out of twenty.
    expect(colorAt(absolute, 18, { min: 0, max: 20 })).toBe("#ff0000");
    // ...and a fortune of 9000 is off the end of a scale that stops at 100.
    expect(colorAt(absolute, 9000, { min: 0, max: 10000 })).toBeUndefined();
  });

  it("needs a span to be relative against", () => {
    expect(colorAt(thirds(), 50)).toBeDefined(); // no span: read as values
  });
});
