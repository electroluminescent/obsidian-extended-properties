/**
 * The "type" word in the interface follows the user's configured type
 * property (Settings -> Types -> Type property): a vault that drives the
 * plugin from `category` should read "category", not "Type".
 *
 * Because the name is substituted into localized sentences, it is rendered -
 * not concatenated - so the substituted word can carry a slight accent tint
 * (.ep-typename) wherever it appears.
 */

import type { I18n } from "../../i18n/i18n";
import { typePropOf } from "../../core/model";

interface TypePropSettings {
  typeProp?: string;
}

/** Sentinel wrapping the substituted name so it can be split back out. */
const MARK = "\u0000";

/** The configured type property's display name (default "Type"). */
export const typeName = (settings: TypePropSettings): string => typePropOf(settings);

/**
 * Render a localized string into `el`, tinting every occurrence of the
 * substituted type name. `key` should use the `{typeProp}` placeholder.
 */
export function setTypedText(
  el: HTMLElement,
  i18n: I18n,
  settings: TypePropSettings,
  key: string,
  vars: Record<string, string> = {}
): HTMLElement {
  const text = i18n.t(key, { ...vars, typeProp: MARK + typeName(settings) + MARK });
  el.empty();
  const parts = text.split(MARK);
  parts.forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) el.createSpan({ cls: "ep-typename", text: part });
    else el.appendText(part);
  });
  return el;
}

/** Plain (untinted) form, for titles, tooltips and button labels. */
export function typedText(
  i18n: I18n,
  settings: TypePropSettings,
  key: string,
  vars: Record<string, string> = {}
): string {
  return i18n.t(key, { ...vars, typeProp: typeName(settings) });
}

/**
 * Words that turn a following "type" into a DIFFERENT concept: the data type
 * of a property, not the note's type. "data type", "value type", "number
 * type", "date type" and friends must never be highlighted as if they named
 * the user's type property - which matters most when that property is itself
 * called "Type".
 */
const QUALIFIERS = new Set([
  "data", "value", "property", "obsidian", "custom", "legacy", "same", "this",
  "text", "number", "decimal", "derived", "list", "checkbox", "color", "colour",
  "formula", "image", "media", "audio", "video", "pdf", "iframe", "rating",
  "link", "unit", "date", "datetime", "time", "skills", "star", "embed", "sheet",
]);

/**
 * Tint every occurrence of the configured type name inside `root`.
 *
 * Most strings reach the DOM as plain text (Setting.setName/setDesc, headings,
 * notices), so a call-site helper can only ever cover a fraction of them. This
 * pass runs after a container renders and wraps the name wherever it appears
 * in prose, which keeps the highlight consistent without every call site
 * having to know about it.
 *
 * Two things are deliberately left alone: values (fields, code, the type chip,
 * editable text and anything already tinted), so a note's own value that
 * happens to match is never restyled; and qualified compounds like "data type"
 * or "date type", which name the value-type system rather than this one.
 */
export function tintTypeNames(root: HTMLElement, settings: TypePropSettings): void {
  const name = typeName(settings);
  if (!name) return;
  const re = new RegExp("\\b" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi");
  const SKIP = "input, textarea, select, code, pre, .ep-typename, .ep-type-badge, .ep-title, .ep-editable, .ep-num, .ep-chip";
  /** Whether the word before `index` makes this a different concept. */
  const qualified = (value: string, index: number): boolean => {
    const before = value.slice(0, index).trimEnd();
    if (before.endsWith("/") || before.endsWith("-")) return true; // date/time type
    const word = /([A-Za-z]+)$/.exec(before)?.[1];
    return !!word && QUALIFIERS.has(word.toLowerCase());
  };
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    if (!text.nodeValue) continue;
    re.lastIndex = 0;
    let any = false;
    for (let m = re.exec(text.nodeValue); m; m = re.exec(text.nodeValue)) {
      if (!qualified(text.nodeValue, m.index)) {
        any = true;
        break;
      }
    }
    re.lastIndex = 0;
    if (!any) continue;
    const parent = text.parentElement;
    if (!parent || parent.closest(SKIP)) continue;
    targets.push(text);
  }
  for (const text of targets) {
    const value = text.nodeValue ?? "";
    const frag = createFragment();
    let last = 0;
    re.lastIndex = 0;
    for (let m = re.exec(value); m; m = re.exec(value)) {
      if (qualified(value, m.index)) continue; // "data type", "date type", ...
      if (m.index > last) frag.appendText(value.slice(last, m.index));
      frag.createSpan({ cls: "ep-typename", text: m[0] });
      last = m.index + m[0].length;
    }
    if (last < value.length) frag.appendText(value.slice(last));
    text.replaceWith(frag);
  }
}
