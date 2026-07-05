/**
 * Inline editing primitives: temporarily swap a display element for an
 * `<input>`, commit on Enter/blur, cancel on Escape, restore the element.
 */

import { App } from "obsidian";
import { fmtNum, clamp } from "../../utils/misc";
import { TextLinkSuggest } from "./suggest";
import { sfx } from "../../utils/sound";

export interface NumberInputOptions {
  min: number;
  max: number;
  float: boolean;
  clamp: boolean;
  /** Called instead of `commit` when the field is emptied (e.g. to clear an override). */
  onEmpty?: () => void;
}

/** Swap `span` for a number input; commit the parsed (and clamped) value. */
export function openNumberInput(
  span: HTMLElement,
  value: number,
  commit: (v: number) => void,
  o: NumberInputOptions
): void {
  const input = createEl("input", { cls: "ep-edit-input" });
  input.type = "number";
  input.value = fmtNum(value);
  if (o.float) input.step = "any";
  span.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (save: boolean) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (input.value.trim() === "") {
      // An emptied field clears rather than committing 0.
      if (save) o.onEmpty?.();
      return;
    }
    let n = Number(input.value);
    if (!Number.isFinite(n)) return;
    if (!o.float) n = Math.round(n);
    if (o.clamp) n = clamp(n, o.min, o.max);
    if (save) { sfx.tick(); commit(n); }
  };
  input.onblur = () => finish(true);
  input.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); finish(false); }
  };
}

/** Swap `span` for a text input with value autocompletion for `key`. */
export function openTextInput(
  app: App,
  span: HTMLElement,
  key: string,
  value: string,
  valuesFor: (key: string) => string[],
  commit: (v: string) => void
): void {
  const input = createEl("input", { cls: "ep-edit-input" });
  input.type = "text";
  input.value = value;
  span.replaceWith(input);
  input.focus();
  input.select();
  new TextLinkSuggest(app, input, () => valuesFor(key), (v) => commit(v));
  input.addEventListener("focus", () => input.dispatchEvent(new Event("input")));
  input.dispatchEvent(new Event("input"));
  let done = false;
  const finish = (save: boolean) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save) { sfx.tick(); commit(input.value.trim()); }
  };
  // Delay so a suggestion click can land before the blur commits.
  input.onblur = () => window.setTimeout(() => finish(true), 150);
  input.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); finish(false); }
  };
}

/**
 * Make `span` a click-to-rename title (used for section titles and labels in
 * edit mode). Shows `current` or the `placeholder` default.
 */
export function bindRename(
  span: HTMLElement,
  current: string,
  placeholder: string,
  tooltip: string,
  commit: (v: string) => void
): void {
  span.setText(current || placeholder);
  span.addClass("ep-editable");
  span.setAttr("title", tooltip);
  span.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
    input.type = "text";
    input.value = current;
    input.placeholder = placeholder;
    span.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save: boolean) => {
      if (done) return;
      done = true;
      if (input.parentElement) input.replaceWith(span);
      if (save) commit(input.value.trim());
    };
    input.onblur = () => finish(true);
    input.onkeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      else if (e.key === "Escape") { e.preventDefault(); finish(false); }
    };
  };
}
