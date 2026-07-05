/**
 * Export / import of types, sections and templates (roadmap D1).
 *
 * Packs a note-type layout or a single section into a versioned, self-contained
 * JSON snippet - plus a dependency manifest of the derivation building blocks it
 * references - so it can be shared and imported into another vault. Importing
 * regenerates entry/section ids (avoiding collisions) and audits which
 * referenced derivations are missing in the target, so the UI can offer to add
 * them. Pure - no Obsidian - so it round-trips in unit tests.
 */

import type { Layout, Section } from "./model";
import { ext } from "./model";
import type { DerivationSetting, ModExt } from "./influences";
import { genId } from "../utils/misc";

/** Bump when the snippet shape changes incompatibly. */
export const TRANSFER_SCHEMA = 1;

/** Derivation "ids" that need no settings block (built into the engine). */
const BUILTIN_DERIVATIONS = new Set(["value", "formula", ""]);

export interface TransferDoc {
  /** Magic marker so our own snippets are recognisable. */
  ep: "extended-properties";
  /** Transfer schema version. */
  schema: number;
  /** Plugin version that produced the snippet (informational). */
  plugin?: string;
  kind: "type" | "section";
  /** Type name (kind "type") or section title (kind "section"). */
  name: string;
  /** Full layout (kind "type"). */
  layout?: Layout;
  /** A single section (kind "section"). */
  section?: Section;
  /** Derivation building blocks the payload references. */
  derivations: DerivationSetting[];
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

/** Derivation ids referenced by any influence's `mode` (excluding built-ins). */
export function referencedDerivations(sections: Section[]): string[] {
  const out = new Set<string>();
  for (const s of sections)
    for (const e of s.entries)
      for (const inf of ext<ModExt>(e).mods ?? [])
        if (inf.mode && !BUILTIN_DERIVATIONS.has(inf.mode)) out.add(inf.mode);
  return [...out];
}

/** Source property keys referenced by influences (source + toggle list). */
export function referencedSources(sections: Section[]): string[] {
  const out = new Set<string>();
  for (const s of sections)
    for (const e of s.entries)
      for (const inf of ext<ModExt>(e).mods ?? []) {
        if (inf.source) out.add(inf.source);
        if (inf.toggle) out.add(inf.toggle);
      }
  return [...out];
}

function depManifest(sections: Section[], derivations: DerivationSetting[]): DerivationSetting[] {
  const used = new Set(referencedDerivations(sections).map((d) => d.toLowerCase()));
  return derivations.filter((d) => used.has(d.id.toLowerCase())).map(clone);
}

/** Pack a whole note type (its layout + referenced derivations). */
export function packType(name: string, layout: Layout, derivations: DerivationSetting[], plugin?: string): TransferDoc {
  return {
    ep: "extended-properties",
    schema: TRANSFER_SCHEMA,
    plugin,
    kind: "type",
    name,
    layout: clone(layout),
    derivations: depManifest(layout.sections, derivations),
  };
}

/** Pack a single section (+ referenced derivations). */
export function packSection(section: Section, derivations: DerivationSetting[], plugin?: string): TransferDoc {
  return {
    ep: "extended-properties",
    schema: TRANSFER_SCHEMA,
    plugin,
    kind: "section",
    name: section.title || "Section",
    section: clone(section),
    derivations: depManifest([section], derivations),
  };
}

/** Parse + validate a snippet; null when it isn't a recognised transfer doc. */
export function parseTransfer(text: string): TransferDoc | null {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  const d = v as Partial<TransferDoc> | null;
  if (!d || d.ep !== "extended-properties" || (d.kind !== "type" && d.kind !== "section")) return null;
  if (typeof d.schema !== "number" || d.schema > TRANSFER_SCHEMA) return null;
  if (!Array.isArray(d.derivations)) d.derivations = [];
  if (d.kind === "type" && (!d.layout || !Array.isArray(d.layout.sections))) return null;
  if (d.kind === "section" && (!d.section || !Array.isArray(d.section.entries))) return null;
  if (typeof d.name !== "string") d.name = d.kind === "type" ? "Imported type" : "Imported section";
  return d as TransferDoc;
}

/** Sections carried by a doc, regardless of kind. */
export function docSections(doc: TransferDoc): Section[] {
  if (doc.kind === "section" && doc.section) return [doc.section];
  if (doc.kind === "type" && doc.layout) return doc.layout.sections;
  return [];
}

/** Derivations referenced by `doc` that aren't already present in `existing` (by id). */
export function missingDerivations(doc: TransferDoc, existing: DerivationSetting[]): DerivationSetting[] {
  const have = new Set(existing.map((d) => d.id.toLowerCase()));
  return doc.derivations.filter((d) => d && typeof d.id === "string" && !have.has(d.id.toLowerCase()));
}

/** Clone a section with freshly-generated section + entry ids (collision-free import). */
export function freshSection(section: Section): Section {
  const s = clone(section);
  s.id = genId();
  for (const e of s.entries) e.id = genId();
  return s;
}

/** Fresh-id copies of all sections a doc carries. */
export function freshSections(doc: TransferDoc): Section[] {
  return docSections(doc).map(freshSection);
}
