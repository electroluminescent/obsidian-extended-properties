/**
 * Building the wide word table out of a file of word vectors.
 *
 * The plugin ships a few hundred words with colours (`semantic-anchors`).
 * Given a vector file - GloVe, or anything in the same shape - every other
 * word can take the colour of the anchors it sits nearest to, weighted by how
 * near. That is done ONCE, on this machine, and the answer is kept: what the
 * plugin reads from then on is a map of words to colours, not a model.
 *
 * The file is whatever the user dropped in, so nothing here assumes GloVe in
 * particular: one word and its numbers per line, separated by spaces.
 *
 * Pure: text in, a map out. No DOM, no Obsidian, no network.
 */

/** One line of the file, without allocating the whole thing as an array. */
export function* eachLine(text: string): Generator<string> {
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) !== 10) continue; // \n
    const end = i > start && text.charCodeAt(i - 1) === 13 ? i - 1 : i; // \r\n
    if (end > start) yield text.slice(start, end);
    start = i + 1;
  }
  if (start < text.length) yield text.slice(start);
}

/** A word and its vector, or null where the line is not one. */
function parseLine(line: string): { word: string; vec: number[] } | null {
  const sp = line.indexOf(" ");
  if (sp <= 0) return null;
  const parts = line.slice(sp + 1).split(" ");
  const vec: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n)) return null;
    vec.push(n);
  }
  return vec.length ? { word: line.slice(0, sp), vec } : null;
}

const dot = (a: number[], b: number[]): number => {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
};

const norm = (a: number[]): number => Math.sqrt(dot(a, a)) || 1;

/** Hex -> the three channels, for averaging anchors together. */
function channels(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (r: number, g: number, b: number): string =>
  "#" +
  [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");

export interface BuildOptions {
  /** How many words to keep, longest-used first as the file lists them. */
  limit?: number;
  /** How many anchors a word takes its colour from. */
  near?: number;
  /** How alike a word and an anchor must be to count at all. */
  minSim?: number;
  /** Called now and then with how many lines have been read. */
  onProgress?: (lines: number) => void;
}

/**
 * Every word in `text`, with the colour of the anchors nearest it.
 *
 * Words are taken in the order the file lists them, which for a vector file
 * is commonest first - so a limit keeps the words people actually write.
 */
export function buildTable(
  text: string,
  anchors: Map<string, string>,
  o: BuildOptions = {}
): Record<string, string> {
  const limit = o.limit ?? 50000;
  const near = o.near ?? 4;
  const minSim = o.minSim ?? 0.2;

  // Pass one: the anchors' own vectors, and the vocabulary worth colouring.
  const anchorVecs: { vec: number[]; len: number; rgb: [number, number, number] }[] = [];
  const kept: { word: string; vec: number[]; len: number }[] = [];
  let lines = 0;
  for (const line of eachLine(text)) {
    lines++;
    if (o.onProgress && lines % 20000 === 0) o.onProgress(lines);
    const parsed = parseLine(line);
    if (!parsed) continue;
    const { word, vec } = parsed;
    const anchor = anchors.get(word);
    if (anchor) {
      const rgb = channels(anchor);
      if (rgb) anchorVecs.push({ vec, len: norm(vec), rgb });
    }
    // Words, not punctuation, numbers or fragments.
    if (kept.length < limit && /^[a-z][a-z'-]{1,}$/.test(word)) kept.push({ word, vec, len: norm(vec) });
  }
  if (!anchorVecs.length) return {};

  // Pass two: each word takes the colour of the anchors it sits nearest.
  const out: Record<string, string> = {};
  for (const { word, vec, len } of kept) {
    const own = anchors.get(word);
    if (own) {
      out[word] = own;
      continue;
    }
    const scored = anchorVecs
      .map((a) => ({ a, sim: dot(vec, a.vec) / (len * a.len) }))
      .sort((x, y) => y.sim - x.sim)
      .slice(0, near)
      .filter((x) => x.sim > minSim);
    if (!scored.length) continue;
    let r = 0;
    let g = 0;
    let b = 0;
    let w = 0;
    for (const { a, sim } of scored) {
      // Cubed, so the nearest anchor dominates rather than everything
      // averaging towards mud.
      const k = sim * sim * sim;
      r += a.rgb[0] * k;
      g += a.rgb[1] * k;
      b += a.rgb[2] * k;
      w += k;
    }
    if (w > 0) out[word] = toHex(r / w, g / w, b / w);
  }
  return out;
}

/**
 * What a cache file holds: our own `{ built, words }`, or a plain map that
 * somebody built elsewhere and dropped in.
 */
export function readCache(raw: unknown): { words: Record<string, string> | null; built: number } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { words: null, built: 0 };
  const obj = raw as Record<string, unknown>;
  if (obj.words && typeof obj.words === "object" && !Array.isArray(obj.words)) {
    return { words: obj.words as Record<string, string>, built: Number(obj.built) || 0 };
  }
  const plain = Object.values(obj).every((v) => typeof v === "string");
  return plain ? { words: obj as Record<string, string>, built: 0 } : { words: null, built: 0 };
}
