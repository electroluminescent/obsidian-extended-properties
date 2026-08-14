/**
 * Build the optional wide word table.
 *
 * The plugin ships a few hundred words (src/utils/semantic-anchors.ts). This
 * turns a word-vector file into the rest of English: for every word in the
 * vocabulary, the colour of the anchors it sits nearest to, weighted by how
 * near. The model does the work HERE, once, and the plugin only ever reads
 * the answer - no weights in the bundle, nothing downloaded at runtime.
 *
 *   node scripts/build-semantic.mjs glove.6B.50d.txt semantic-en.json [50000]
 *
 * GloVe (Stanford) is released under the Public Domain Dedication and
 * Licence; attribute it in the release notes. Any file of the same shape
 * works: "word v1 v2 v3 ...", one per line.
 *
 * The result goes in the GitHub release, NOT in main.js: users who want the
 * wide vocabulary drop it into the plugin's folder.
 */

import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

const [vectorsPath, outPath = "semantic-en.json", limitArg = "50000"] = process.argv.slice(2);
if (!vectorsPath) {
  console.error("usage: node scripts/build-semantic.mjs <vectors.txt> [out.json] [limit]");
  process.exit(1);
}
const LIMIT = Number(limitArg) || 50000;
/** How many anchors a word takes its colour from. */
const NEAR = 4;

/** Read the anchor words out of the plugin's own source, so they cannot drift. */
async function readAnchors() {
  const url = pathToFileURL(new URL("../src/utils/semantic-anchors.ts", import.meta.url).pathname);
  const src = await (await fetch(url)).text().catch(() => null) ?? null;
  const text = src ?? (await import("node:fs")).readFileSync(new URL("../src/utils/semantic-anchors.ts", import.meta.url), "utf8");
  const body = text.slice(text.indexOf('"'), text.lastIndexOf('"') + 1);
  const pairs = body.replace(/"\s*\+\s*\n\s*"/g, "").replace(/^"|"$/g, "").split(",");
  const out = new Map();
  for (const p of pairs) {
    const i = p.indexOf(":");
    if (i > 0) out.set(p.slice(0, i).trim(), "#" + p.slice(i + 1).trim());
  }
  return out;
}

const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const toHex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a)) || 1;

const anchors = await readAnchors();
console.log(`anchors: ${anchors.size} words`);

/** First pass: the anchors' own vectors. */
const anchorVecs = new Map();
const vocab = [];
{
  const rl = createInterface({ input: createReadStream(vectorsPath), crlfDelay: Infinity });
  let n = 0;
  for await (const line of rl) {
    const sp = line.indexOf(" ");
    if (sp <= 0) continue;
    const word = line.slice(0, sp);
    if (anchors.has(word)) anchorVecs.set(word, line.slice(sp + 1).split(" ").map(Number));
    if (n < LIMIT && /^[a-z][a-z-]{1,}$/.test(word)) vocab.push(line);
    n++;
  }
}
console.log(`anchors found in vectors: ${anchorVecs.size}; vocabulary: ${vocab.length}`);

const anchorList = [...anchorVecs.entries()].map(([w, v]) => ({
  word: w,
  vec: v,
  len: norm(v),
  rgb: hexToRgb(anchors.get(w)),
}));

/** Second pass: every word takes the colour of the anchors nearest it. */
const out = {};
for (const line of vocab) {
  const sp = line.indexOf(" ");
  const word = line.slice(0, sp);
  if (anchors.has(word)) {
    out[word] = anchors.get(word);
    continue;
  }
  const vec = line.slice(sp + 1).split(" ").map(Number);
  const len = norm(vec);
  const scored = anchorList
    .map((a) => ({ a, sim: dot(vec, a.vec) / (len * a.len) }))
    .sort((x, y) => y.sim - x.sim)
    .slice(0, NEAR)
    .filter((x) => x.sim > 0.2);
  if (!scored.length) continue;
  let r = 0, g = 0, b = 0, w = 0;
  for (const { a, sim } of scored) {
    if (!a.rgb) continue;
    const k = sim ** 3; // the nearest anchor should dominate
    r += a.rgb.r * k;
    g += a.rgb.g * k;
    b += a.rgb.b * k;
    w += k;
  }
  if (w > 0) out[word] = toHex(r / w, g / w, b / w);
}

writeFileSync(outPath, JSON.stringify(out));
console.log(`wrote ${Object.keys(out).length} words to ${outPath}`);
