#!/usr/bin/env node
/**
 * i18n key-parity check (F4: i18n as data).
 *
 * English is the schema. This collects every key from the bundled English
 * dictionaries (core + each feature module), guards against malformed
 * `{placeholder}` tokens, and diffs any additional locale file against English
 * (missing keys, unknown keys, placeholder drift). Exits non-zero on any
 * problem so CI fails loudly.
 *
 * Locale layout (a translation adds the right-hand files, fully optional):
 *   src/i18n/locales/en.json                English core (schema)
 *   src/i18n/locales/<code>.json            a core translation
 *   src/features/<mod>/strings.json         English module strings (schema)
 *   src/features/<mod>/strings.<code>.json  a module translation
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const placeholders = (s) => new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
const MODULES = ["rolling", "dnd5e", "inline"];

let errors = 0;
const err = (m) => { console.error("  X " + m); errors++; };

/** key -> { file, ph }. `scope` groups keys by their schema file. */
const schema = new Map();
const enSources = [
  ["src/i18n/locales/en.json", "core"],
  ...MODULES.map((m) => [`src/features/${m}/strings.json`, m]),
];
for (const [f, scope] of enSources) {
  const abs = join(ROOT, f);
  if (!existsSync(abs)) { err(`missing English source ${f}`); continue; }
  const dict = read(abs);
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v !== "string") { err(`${f}: value of "${k}" is not a string`); continue; }
    if (schema.has(k)) console.warn(`  ! duplicate key "${k}" in ${f} (also ${schema.get(k).file})`);
    else schema.set(k, { file: f, scope, ph: placeholders(v) });
    if (((v.match(/\{/g) || []).length) !== ((v.match(/\}/g) || []).length)) err(`${f}: unbalanced { } in "${k}"`);
  }
}
console.log(`English schema: ${schema.size} keys across ${enSources.length} dictionaries.`);

/** Translation files present in the tree. */
const locales = [];
const locDir = join(ROOT, "src/i18n/locales");
if (existsSync(locDir))
  for (const f of readdirSync(locDir))
    if (/^[a-z]{2,5}\.json$/.test(f) && f !== "en.json") locales.push([join(locDir, f), "core"]);
for (const m of MODULES) {
  const d = join(ROOT, "src/features", m);
  if (existsSync(d))
    for (const f of readdirSync(d))
      if (/^strings\.[a-z]{2,5}\.json$/.test(f)) locales.push([join(d, f), m]);
}

if (!locales.length) {
  console.log("No non-English locale files yet - English schema validated only.");
} else {
  for (const [lf, scope] of locales) {
    const dict = read(lf);
    const scopeKeys = [...schema.entries()].filter(([, m]) => m.scope === scope);
    const have = new Set(Object.keys(dict));
    for (const [k, m] of scopeKeys) {
      if (!have.has(k)) { err(`${lf}: missing key "${k}"`); continue; }
      const tp = placeholders(dict[k]);
      for (const p of m.ph) if (!tp.has(p)) err(`${lf}: "${k}" is missing placeholder {${p}}`);
      for (const p of tp) if (!m.ph.has(p)) err(`${lf}: "${k}" has unknown placeholder {${p}}`);
    }
    const valid = new Set(scopeKeys.map(([k]) => k));
    for (const k of have) if (!valid.has(k)) err(`${lf}: unknown key "${k}" (not in English)`);
    console.log(`${lf}: checked ${scopeKeys.length} keys.`);
  }
}

if (errors) { console.error(`\ni18n check failed with ${errors} problem(s).`); process.exit(1); }
console.log("\ni18n check passed.");
