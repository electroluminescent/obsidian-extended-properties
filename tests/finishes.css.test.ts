/**
 * The finishes have to tile seamlessly.
 *
 * A moving layer is a tiled image, and a tile shows its edge unless the
 * pattern closes on itself. These are the three rules the stylesheet's finish
 * block claims to follow, checked against what it actually says - a seam is
 * the kind of thing that is obvious on screen and invisible in a diff.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const css = readFileSync(join(process.cwd(), "styles.css"), "utf8");
const block = css.slice(css.indexOf("/* -- finishes ---"), css.indexOf("/* -- M1: high-contrast"));

describe("the finishes tile without a seam", () => {
  it("gives every repeating conic gradient a period that divides 360", () => {
    const bad: string[] = [];
    for (const m of block.matchAll(/repeating-conic-gradient\(([^;]*?)\)\s*[,;]/gs)) {
      const stops = [...m[1].matchAll(/([\d.]+)deg/g)].map((d) => Number(d[1]));
      if (!stops.length) continue;
      const period = stops[stops.length - 1];
      if (Math.abs(360 / period - Math.round(360 / period)) > 1e-6) bad.push(period + "deg");
    }
    expect(bad).toEqual([]);
  });

  it("reads every band exactly as many times as it divides the image", () => {
    for (const m of block.matchAll(/--ep-band: calc\(100% \/ (\d+)\)([\s\S]*?)\n\}/g)) {
      const parts = Number(m[1]);
      const tops = [...m[2].matchAll(/--ep-band\) \* (\d+)\)/g)].map((t) => Number(t[1]));
      expect(Math.max(...tops)).toBe(parts);
    }
  });

  it("sizes every pixel-period tile to a whole number of periods", () => {
    // A dot tile is its own period and may be any size; a tile carrying a
    // repeating pattern must hold a whole number of it, or the pattern
    // restarts mid-stride at the edge of every tile. These are the ones that
    // carry one, and the period each is written in.
    const woven: Record<string, number> = { prism: 24, satin: 8, weave: 4 };
    for (const [name, period] of Object.entries(woven)) {
      const at = block.indexOf(`.ep-fin-${name} {`);
      expect(at, `${name} is missing`).toBeGreaterThan(-1);
      const rule = block.slice(at, block.indexOf("\n}", at));
      const sizes = [...rule.matchAll(/(\d+)px (\d+)px/g)].map((m) => Number(m[1]));
      const tile = sizes.find((n) => n % period === 0);
      expect(tile, `${name}: no tile is a multiple of ${period}px`).toBeDefined();
    }
  });

  it("lets a layer repeat only where its size matches its pattern", () => {
    // Every finish either says nothing about repeating (so nothing does) or
    // says it once per layer - a shorter list would repeat the wrong ones.
    for (const m of block.matchAll(/\.ep-fin-[a-z-]+ \{([\s\S]*?)\n\}/g)) {
      const rule = m[1];
      const size = /--ep-sheet-size: ([^;]+);/.exec(rule);
      const repeat = /--ep-sheet-repeat: ([^;]+);/.exec(rule);
      if (!repeat) continue;
      const layers = size ? size[1].split(/,(?![^(]*\))/).length : 1;
      expect(repeat[1].split(",").length).toBe(layers);
    }
  });

  it("holds a moving position inside the image it is drawn from", () => {
    // A non-repeating layer stops covering the value the moment its position
    // leaves 0-100%, and the gap reads as a seam. Both are clamped.
    expect(block).toContain("--ep-drift:\n    clamp(0%");
    expect(block).toContain("--ep-sweep:\n    clamp(0%");
    // ...which only works while the travel cannot outrun the clamp.
    const travel = /--ep-travel: ([\d.]+);/.exec(block);
    expect(travel).not.toBeNull();
    expect(Number(travel?.[1])).toBeLessThanOrEqual(0.5);
  });

  it("ends every moving linear sweep on the colour it began with", () => {
    // The layers that move (a `--ep-sweep` or `--ep-drift` position) and are
    // NOT repeating patterns must close: first stop colour === last.
    const sweeps = [...block.matchAll(/\n {4}linear-gradient\(([^;]+?)\)[,;]/g)].map((m) => m[1]);
    for (const body of sweeps) {
      const stops = body.split(/,(?![^(]*\))/).slice(1).map((s) => s.trim());
      if (stops.length < 2) continue;
      const bare = (s: string): string => s.replace(/\s+[\d.]+%$/, "").trim();
      const first = bare(stops[0]);
      const last = bare(stops[stops.length - 1]);
      // Either it closes, or both ends are transparent - which closes too.
      expect(first === last || (first.includes("transparent") && last.includes("transparent"))).toBe(true);
    }
  });
});
