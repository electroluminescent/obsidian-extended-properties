/**
 * Render the result of {@link validate} (roadmap C1): a red border + tooltip on
 * the value element, never blocking the edit. Used by the value-type renderers.
 */

import type { I18n } from "../../i18n/i18n";
import type { Entry } from "../../core/model";
import { validate, Validity } from "../../core/validate";

/** Human-readable message for a validity result. */
export function validityMessage(i18n: I18n, v: Validity): string {
  switch (v.code) {
    case "required":
      return i18n.t("validate.required");
    case "min":
      return i18n.t("validate.min", { n: String(v.bound) });
    case "max":
      return i18n.t("validate.max", { n: String(v.bound) });
    case "pattern":
      return i18n.t("validate.pattern");
    case "allowed":
      return i18n.t("validate.allowed");
    default:
      return "";
  }
}

/** Toggle `.ep-invalid` + a tooltip on `el` for `entry`'s current `raw` value. */
export function applyValidity(el: HTMLElement, entry: Entry, type: string, raw: unknown, i18n: I18n): boolean {
  const v = validate(raw, entry.constraints, type);
  el.toggleClass("ep-invalid", !v.ok);
  el.toggleClass("ep-invalid-mark", !v.ok);
  if (v.ok) el.removeAttribute("data-ep-invalid");
  else {
    el.setAttr("data-ep-invalid", "1");
    el.setAttr("title", validityMessage(i18n, v));
  }
  return v.ok;
}
