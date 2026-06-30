/**
 * 3D dice geometry (roadmap G2 follow-up): real polyhedra for the standard dice.
 *
 * Each solid is described by its vertices plus its face normals (the dual's
 * vertices); the faces are derived as the vertices on each normal's supporting
 * plane. For every face we emit:
 *   - `place`: a `matrix3d(...)` that positions a face element on the solid,
 *   - `land`:  the transpose rotation that brings *that* face to the front,
 *              upright and centred (so a settled die always reads correctly —
 *              this is the inverse of the face's own rotation, so it is exact
 *              regardless of any coordinate-handedness subtleties), and
 *   - `clip`:  a `clip-path: polygon(...)` of the face's true outline.
 *
 * Pure (no DOM / Obsidian), so the linear algebra is unit-tested. d6 is a cube,
 * d4/d8/d20 are the triangular Platonic solids, d12 a dodecahedron, d10 a
 * pentagonal trapezohedron; other sizes fall back to a cube (see dice-styles).
 */

export type V3 = [number, number, number];

const PHI = (1 + Math.sqrt(5)) / 2;
/** Pixels per geometry unit. Solids are normalized to circumradius 1 first, so
 * every die ends up the same on-screen size (~2·SCALE across). */
const SCALE = 28;
/** Face element box size in px (clip-path coords are relative to it). */
const BOX = 64;
/** Edge ring thickness in px (gap between a face's fill and its outline). */
const GAP = 3;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const len = (a: V3): number => Math.sqrt(dot(a, a));
const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mean = (vs: V3[]): V3 => {
  const s: V3 = [0, 0, 0];
  for (const v of vs) {
    s[0] += v[0];
    s[1] += v[1];
    s[2] += v[2];
  }
  return [s[0] / vs.length, s[1] / vs.length, s[2] / vs.length];
};

/** All sign combinations of (±x,±y,±z) for the given magnitudes (0 keeps 0). */
function signs(x: number, y: number, z: number): V3[] {
  const out: V3[] = [];
  const sx = x === 0 ? [0] : [x, -x];
  const sy = y === 0 ? [0] : [y, -y];
  const sz = z === 0 ? [0] : [z, -z];
  for (const a of sx) for (const b of sy) for (const c of sz) out.push([a, b, c]);
  return out;
}
/** Even/cyclic permutations helper for icosa/dodeca coordinate sets. */
function cyc(a: number, b: number, c: number): V3[] {
  return [...signs(a, b, c), ...signs(b, c, a), ...signs(c, a, b)];
}

interface SolidDef {
  verts: V3[];
  /** Explicit faces (vertex-index loops); when omitted, derived from the hull. */
  faces?: number[][];
}

/** Pentagonal trapezohedron (d10): 2 apexes + two offset rings of 5, 10 kites. */
function trapezohedron(): SolidDef {
  const verts: V3[] = [];
  const ringR = 1;
  const ringZ = 0.16;
  // Apex height that makes the kite faces exactly planar: the apex, the midpoint
  // of an upper edge, and the opposite lower vertex must be colinear, giving
  // apexZ = ringZ·(1+cos36°)/(1−cos36°).
  const c36 = Math.cos(Math.PI / 5);
  const apexZ = (ringZ * (1 + c36)) / (1 - c36);
  verts.push([0, 0, apexZ]); // 0 top apex
  verts.push([0, 0, -apexZ]); // 1 bottom apex
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5;
    verts.push([ringR * Math.cos(a), ringR * Math.sin(a), ringZ]); // 2..6 upper
  }
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 + Math.PI / 5;
    verts.push([ringR * Math.cos(a), ringR * Math.sin(a), -ringZ]); // 7..11 lower
  }
  const U = (i: number): number => 2 + (i % 5);
  const L = (i: number): number => 7 + (i % 5);
  const faces: number[][] = [];
  for (let i = 0; i < 5; i++) faces.push([0, U(i), L(i), U(i + 1)]); // top kites
  for (let i = 0; i < 5; i++) faces.push([1, L(i), U(i + 1), L(i + 1)]); // bottom kites
  return { verts, faces };
}

const SOLIDS: Record<number, SolidDef> = {
  4: { verts: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] }, // tetrahedron
  6: { verts: signs(1, 1, 1) }, // cube
  8: { verts: [...signs(1, 0, 0), ...signs(0, 1, 0), ...signs(0, 0, 1)] }, // octahedron
  12: { verts: [...signs(1, 1, 1), ...cyc(0, 1 / PHI, PHI)] }, // dodecahedron
  20: { verts: cyc(0, 1, PHI) }, // icosahedron
  10: trapezohedron(), // pentagonal trapezohedron (explicit kite faces)
};

/**
 * Faces of the convex hull of `verts`: every plane through 3 vertices with all
 * other vertices on one side is a face; its on-plane vertices (ordered) are the
 * polygon. Works for any convex solid, so square/pentagon/kite faces fall out
 * without hand-listing them. O(n⁴), but n ≤ 20.
 */
function hullFaces(verts: V3[]): V3[][] {
  const eps = 1e-4;
  const n = verts.length;
  const seen = new Set<string>();
  const out: V3[][] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const nrm = cross(sub(verts[j], verts[i]), sub(verts[k], verts[i]));
        if (len(nrm) < eps) continue; // collinear triple
        const u = norm(nrm);
        const d = dot(u, verts[i]);
        let pos = false;
        let neg = false;
        const on: number[] = [];
        for (let l = 0; l < n; l++) {
          const s = dot(u, verts[l]) - d;
          if (s > eps) pos = true;
          else if (s < -eps) neg = true;
          else on.push(l);
        }
        if (pos && neg) continue; // plane cuts through the solid → not a face
        if (on.length < 3) continue;
        const key = [...on].sort((a, b) => a - b).join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(orderAround(on.map((idx) => verts[idx])));
      }
  return out;
}

export interface PolyFace {
  /** matrix3d placing the face element on the solid. */
  place: string;
  /** matrix3d (applied to the solid) bringing this face to the front, upright. */
  land: string;
  /** clip-path outline of the face (the edge layer). */
  clip: string;
  /** clip-path of the inset fill layer (leaves an edge ring around it). */
  clipInner: string;
  /** Outward unit normal (for tests). */
  n: V3;
  /** Number of polygon vertices (3 = triangle, 4 = square/kite, 5 = pentagon). */
  sidesOfFace: number;
  /** CSS rotation (deg) so the digit's top points at the face's pointiest vertex
   *  (an edge midpoint for square faces). */
  numRot: number;
  /** Extra rotateZ (deg) applied alongside `land` so the landed face reads upright
   *  (brings the number's target feature to the top of the screen). */
  landUp: number;
}

/**
 * The point the digit's top should aim at: the pointiest (smallest interior
 * angle) vertex, except square faces (d6), which aim at an edge midpoint so the
 * number sits upright.
 */
function numberFeature(face: V3[]): V3 {
  const k = face.length;
  const ang = face.map((v, i) => {
    const a = norm(sub(face[(i - 1 + k) % k], v));
    const b = norm(sub(face[(i + 1) % k], v));
    return Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  });
  if (k === 4 && Math.max(...ang) - Math.min(...ang) < 0.05) return mean([face[0], face[1]]);
  let idx = 0;
  for (let i = 1; i < k; i++) if (ang[i] < ang[idx]) idx = i;
  return face[idx];
}

/** Order coplanar vertices counter-clockwise around their shared centre. */
function orderAround(face: V3[]): V3[] {
  const c = mean(face);
  // True face normal — the centroid direction is wrong for kite faces (d10),
  // which would order their vertices in a tilted frame and malform the polygon.
  let n = norm(cross(sub(face[1], face[0]), sub(face[2], face[0])));
  if (dot(n, c) < 0) n = [-n[0], -n[1], -n[2]];
  const right = norm(sub(face[0], c));
  const up = cross(n, right);
  return [...face].sort((a, b) => {
    const aa = Math.atan2(dot(sub(a, c), up), dot(sub(a, c), right));
    const bb = Math.atan2(dot(sub(b, c), up), dot(sub(b, c), right));
    return aa - bb;
  });
}

function f3(x: number): string {
  return Math.abs(x) < 1e-6 ? "0" : x.toFixed(4);
}

function makeFace(face: V3[]): PolyFace {
  const c = mean(face);
  // True outward face normal. The centroid direction is NOT the normal for kite
  // faces (d10) — using it left the d10 mis-assembled. Take it from two edges.
  let n = norm(cross(sub(face[1], face[0]), sub(face[2], face[0])));
  if (dot(n, c) < 0) n = [-n[0], -n[1], -n[2]];
  // Anchor the face element at the foot of the perpendicular from the origin
  // (p = d·n, a point on the face plane); this makes the settle rotation land
  // every face exactly centred, kites included.
  const d0 = dot(n, face[0]);
  const p: V3 = [n[0] * d0, n[1] * d0, n[2] * d0];
  const right = norm(sub(face[0], p));
  const up = cross(n, right); // unit: n ⟂ right, both unit
  // place = translate(p*SCALE) ∘ rotation[right|up|n]  (column-major matrix3d)
  const place =
    `matrix3d(${f3(right[0])},${f3(right[1])},${f3(right[2])},0,` +
    `${f3(up[0])},${f3(up[1])},${f3(up[2])},0,` +
    `${f3(n[0])},${f3(n[1])},${f3(n[2])},0,` +
    `${f3(p[0] * SCALE)},${f3(p[1] * SCALE)},${f3(p[2] * SCALE)},1)`;
  // land = transpose of the rotation (its inverse): rotating the solid by this
  // maps the face to identity → front, centred (since p lies on the normal).
  const land =
    `matrix3d(${f3(right[0])},${f3(up[0])},${f3(n[0])},0,` +
    `${f3(right[1])},${f3(up[1])},${f3(n[1])},0,` +
    `${f3(right[2])},${f3(up[2])},${f3(n[2])},0,0,0,0,1)`;
  const mid = BOX / 2;
  // The placement matrix maps the element's local +Y axis onto `up`, so the
  // clip-path Y is `mid + (…·up)` — NOT minus. With minus each face's outline is
  // reflected; that's invisible for regular polygons (their reference axis is a
  // symmetry axis) but mis-shapes the d10's kite faces, so the d10 never tiled.
  const px = face.map((v) => {
    const dd = sub(v, p);
    return [mid + dot(dd, right) * SCALE, mid + dot(dd, up) * SCALE] as [number, number];
  });
  const poly = (pts: [number, number][]): string =>
    `polygon(${pts.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(", ")})`;
  // Inset polygon: pull each point toward the face centre by GAP px, so the
  // fill layer sits inside the edge layer and a consistent outline shows.
  const inner = px.map(([x, y]): [number, number] => {
    const dx = x - mid;
    const dy = y - mid;
    const m = Math.hypot(dx, dy) || 1;
    const f = Math.max(0, 1 - GAP / m);
    return [mid + dx * f, mid + dy * f];
  });
  // Rotate the digit so its top points at the face feature. atan2(fx, -fy) maps
  // the in-plane (right, up) direction to a CSS rotation (px frame, y down).
  const feat = numberFeature(face);
  const fx = dot(sub(feat, p), right);
  const fy = dot(sub(feat, p), up);
  const numRot = (Math.atan2(fx, -fy) * 180) / Math.PI;
  // At landing the face is at identity (its `up` axis points screen-down), so the
  // feature sits at screen angle atan2(fy, fx). Spin the solid so it ends up at the
  // top (−90°), which also carries the number (pointed at the feature) upright.
  const landUp = -90 - (Math.atan2(fy, fx) * 180) / Math.PI;
  return { place, land, clip: poly(px), clipInner: poly(inner), n, sidesOfFace: face.length, numRot, landUp };
}

/** Build the faces for a die of `sides`, or null if there is no defined solid. */
export function buildSolid(sides: number): PolyFace[] | null {
  const def = SOLIDS[sides];
  if (!def) return null;
  // Normalize to circumradius 1 so every die renders at the same on-screen size.
  const maxR = Math.max(...def.verts.map((v) => len(v))) || 1;
  const verts = def.verts.map((v): V3 => [v[0] / maxR, v[1] / maxR, v[2] / maxR]);
  const faces = def.faces
    ? def.faces.map((idx) => orderAround(idx.map((i) => verts[i])))
    : hullFaces(verts);
  return faces.map(makeFace);
}

/** Die sizes that have a true 3D solid (others fall back to a cube). */
export const SOLID_SIDES = Object.keys(SOLIDS).map(Number);
