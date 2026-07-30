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
