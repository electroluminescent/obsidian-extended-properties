import { describe, it, expect } from "vitest";
import { buildSolid, SOLID_SIDES } from "../src/utils/polyhedra";

const FACE_COUNT: Record<number, number> = { 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 20: 20 };
const FACE_SIDES: Record<number, number> = { 4: 3, 6: 4, 8: 3, 10: 4, 12: 5, 20: 3 };

describe("buildSolid", () => {
  it("exposes the standard solid sizes", () => {
    expect(SOLID_SIDES.sort((a, b) => a - b)).toEqual([4, 6, 8, 10, 12, 20]);
  });

  for (const sides of [4, 6, 8, 10, 12, 20]) {
    it(`d${sides}: ${FACE_COUNT[sides]} faces, each a ${FACE_SIDES[sides]}-gon, unit normals`, () => {
      const faces = buildSolid(sides);
      expect(faces).not.toBeNull();
      expect(faces!.length).toBe(FACE_COUNT[sides]);
      for (const f of faces!) {
        expect(f.sidesOfFace).toBe(FACE_SIDES[sides]);
        const l = Math.hypot(f.n[0], f.n[1], f.n[2]);
        expect(l).toBeCloseTo(1, 5);
        expect(f.place.startsWith("matrix3d(")).toBe(true);
        expect(f.land.startsWith("matrix3d(")).toBe(true);
        expect(f.clip.startsWith("polygon(")).toBe(true);
      }
    });
  }

  it("normals are distinct (faces point in different directions)", () => {
    const faces = buildSolid(20)!;
    const seen = new Set(faces.map((f) => f.n.map((x) => x.toFixed(2)).join(",")));
    expect(seen.size).toBe(20);
  });

  it("returns null for sizes without a defined solid", () => {
    expect(buildSolid(100)).toBeNull();
    expect(buildSolid(7)).toBeNull();
    expect(buildSolid(2)).toBeNull();
  });

  it("settle rotation brings each face's true normal to the front (+Z)", () => {
    for (const sides of [4, 6, 8, 10, 12, 20]) {
      for (const f of buildSolid(sides)!) {
        const m = f.land.match(/matrix3d\(([^)]+)\)/)![1].split(",").map(Number);
        // land is R^T (column-major): (R^T*n)[r] = sum_c m[4c+r]*n[c]; should be (0,0,1).
        const out = [0, 1, 2].map((r) => m[r] * f.n[0] + m[4 + r] * f.n[1] + m[8 + r] * f.n[2]);
        // matrix3d strings are rounded to 4 decimals, so allow ~1e-3 slack.
        expect(out[0]).toBeCloseTo(0, 3);
        expect(out[1]).toBeCloseTo(0, 3);
        expect(out[2]).toBeCloseTo(1, 3);
      }
    }
  });
});
