/**
 * Cross-note references for rolls and expressions: `[[Other note]].INT`
 * resolves to the linked note's `INT` (value, short form, or `INTs` modifier).
 *
 * The pure resolver in `influences.ts` only knows one note; this Obsidian-aware
 * layer builds a read-only {@link InfluenceEnv} for any linked file and routes
 * `[[link]].accessor` references to it, falling back to the local resolver for
 * ordinary references.
 */

import type { App, TFile } from "obsidian";
import type { EPSettings, Layout } from "./model";
import type { Registries } from "./registry";
import type { NoteModel } from "./note-model";
import type { PropertyIndex } from "./property-index";
import { getList, getNum } from "../utils/misc";
import { InfluenceEnv, makeRefResolver, VaultAccess } from "./influences";

/** Bind a {@link PropertyIndex} + the active note's path to the {@link VaultAccess} the engine consumes. */
export function makeVaultAccess(props: PropertyIndex, getSourcePath: () => string): VaultAccess {
  return {
    valuesByType: (type, key) => props.valuesByType(type, key),
    linkedValue: (linkProp, key) => props.linkedValue(getSourcePath(), linkProp, key),
  };
}

/** Split a `[[link]].accessor` reference; null when it isn't one. */
export function parseNoteRef(name: string): { link: string; accessor: string } | null {
  const m = /^\[\[([^\]]+)\]\](?:\s*\.\s*(.+))?$/.exec((name ?? "").trim());
  if (!m) return null;
  return { link: m[1].trim(), accessor: (m[2] ?? "").trim() };
}

/** The layout for a frontmatter's first matching configured type, or undefined. */
function layoutFor(settings: EPSettings, raw: Record<string, unknown>): Layout | undefined {
  const tk = Object.keys(raw).find((k) => k.toLowerCase() === "type");
  const tv = tk !== undefined ? raw[tk] : undefined;
  const types = Array.isArray(tv) ? tv.map(String) : tv === undefined || tv === null ? [] : [String(tv)];
  const match = settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
  if (!match) return undefined;
  const l = settings.layouts[match.toLowerCase()];
  return l && Array.isArray(l.sections) ? l : undefined;
}

/** A read-only influence environment for any file (frontmatter + its type layout). */
export function envForFile(app: App, settings: EPSettings, registries: Registries, file: TFile): InfluenceEnv {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
  const raw = fm ? { ...fm } : {};
  const note = {
    raw,
    num: (k: string, d: number) => getNum(raw, k, d),
    list: (k: string) => getList(raw, k),
  } as unknown as NoteModel;
  return { note, registries, settings, layout: layoutFor(settings, raw) };
}

/**
 * A resolver that understands `[[link]].accessor` cross-note references on top
 * of the local resolver (`localEnv`). Links resolve relative to `sourcePath`.
 */
export function makeNoteAwareResolver(
  app: App,
  settings: EPSettings,
  registries: Registries,
  localEnv: InfluenceEnv,
  sourcePath: string
): (name: string) => number | undefined {
  const local = makeRefResolver(localEnv);
  return (name) => {
    const nr = parseNoteRef(name);
    if (nr && nr.accessor) {
      if (settings.crossNote === false) return undefined; // kill-switch
      const f = app.metadataCache.getFirstLinkpathDest(nr.link, sourcePath);
      if (!f) return undefined;
      return makeRefResolver(envForFile(app, settings, registries, f))(nr.accessor);
    }
    return local(name);
  };
}
