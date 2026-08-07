/**
 * How much room an inline piece takes: the width a share comes to in a given
 * column, and what happens when that would be too narrow to read.
 */

import { describe, expect, it } from "vitest";
import {
  isShaped, MIN_INLINE_PX, resolveLines, resolveWidth, MAX_INLINE_LINES,
} from "../src/utils/inline-size";

describe("width", () => {
  it("is a share of the column", () => {
    expect(resolveWidth({ span: "full" }, 800).css).toBe("100%");
    expect(resolveWidth({ span: "half" }, 800).css).toBe("50%");
    expect(resolveWidth({ span: "quarter" }, 800).css).toBe("25%");
  });

  it("steps up to the next share rather than drawing something unreadable", () => {
    // A quarter of 400 is 100 - under the floor, so it takes a half instead.
    const half = resolveWidth({ span: "quarter" }, 400);
    expect(half.span).toBe("half");
    expect(half.stepped).toBe(true);
    // A quarter of 320 is 80 and a half is 160, still short: it takes it all.
    expect(resolveWidth({ span: "quarter" }, 280).span).toBe("full");
  });

  it("leaves a share that reads perfectly well alone", () => {
    const w = resolveWidth({ span: "quarter" }, 1200);
    expect(w.span).toBe("quarter");
    expect(w.stepped).toBe(false);
  });

  it("gives a full width whatever the column, there being nothing wider", () => {
    expect(resolveWidth({ span: "full" }, 100).css).toBe("100%");
  });

  it("takes a written width as written, down to the floor", () => {
    expect(resolveWidth({ span: "custom", width: 240 }).css).toBe("240px");
    expect(resolveWidth({ span: "custom", width: 40 }).css).toBe(`${MIN_INLINE_PX}px`);
    expect(resolveWidth({ span: "custom" }).css).toBeUndefined(); // nothing written
  });

  it("leaves a piece its natural size where nothing is asked for", () => {
    expect(resolveWidth(undefined).css).toBeUndefined();
    expect(resolveWidth({}).css).toBeUndefined();
    expect(resolveWidth({ span: "auto" }).css).toBeUndefined();
    expect(resolveWidth({ span: "nonsense" }, 800).css).toBeUndefined();
  });

  it("holds shares steady until something has been measured", () => {
    expect(resolveWidth({ span: "quarter" }, 0).span).toBe("quarter");
  });
});

describe("height", () => {
  it("is a whole number of lines, above one", () => {
    expect(resolveLines({ lines: 4 })).toBe(4);
    expect(resolveLines({ lines: 4.7 })).toBe(4);
    expect(resolveLines({ lines: 1 })).toBeUndefined();
    expect(resolveLines({ lines: 0 })).toBeUndefined();
    expect(resolveLines(undefined)).toBeUndefined();
  });

  it("stops at a screenful", () => {
    expect(resolveLines({ lines: 500 })).toBe(MAX_INLINE_LINES);
  });
});

describe("whether a piece has a shape of its own", () => {
  it("is true of anything given a height, a width or a side to sit on", () => {
    expect(isShaped({ lines: 3 })).toBe(true);
    expect(isShaped({ span: "half" })).toBe(true);
    expect(isShaped({ align: "center" })).toBe(true);
  });

  it("is false of a piece left to flow in the sentence", () => {
    expect(isShaped(undefined)).toBe(false);
    expect(isShaped({})).toBe(false);
    expect(isShaped({ lines: 1 })).toBe(false);
  });
});
