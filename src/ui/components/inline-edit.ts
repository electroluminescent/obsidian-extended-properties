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

/**
 * After a Tab commit, open the neighboring editable value in the same view,
 * so the sidebar works as a primary data-entry surface: click once, then
 * Tab (Shift+Tab) through every field.
 */
function focusEditableFrom(span: HTMLElement, backwards: boolean): void {
  const scope = span.closest(".view-content") ?? span.ownerDocument.body;
  const all = Array.from(scope.querySelectorAll<HTMLElement>(".ep-editable"));
  const i = all.indexOf(span);
  const next = i >= 0 ? all[i + (backwards ? -1 : 1)] : undefined;
  if (next) window.setTimeout(() => next.click(), 0);
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
    else if (e.key === "Tab") { e.preventDefault(); finish(true); focusEditableFrom(span, e.shiftKey); }
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
    else if (e.key === "Tab") { e.preventDefault(); finish(true); focusEditableFrom(span, e.shiftKey); }
  };
}

/** Rows a growing text box may reach before it scrolls instead. */
const AREA_MAX_ROWS = 12;

/**
 * Swap `span` for a text area that grows with its content - the editor for a
 * paragraph-length value, where a one-line field shows a sentence at a time.
 *
 * Enter makes a new line here (that is the point of it), so committing is
 * Ctrl/Cmd+Enter, Tab, or clicking away; Escape still cancels. There is no
 * value autocomplete: Obsidian's suggester attaches to inputs, and a long-form
 * field is prose rather than one of a known set of values.
 */
export function openTextArea(span: HTMLElement, value: string, commit: (v: string) => void): void {
  const area = createEl("textarea", { cls: "ep-edit-input ep-edit-area" });
  area.value = value;
  area.rows = 1;
  span.replaceWith(area);

  /** Height follows the content, up to a cap - then it scrolls. */
  const grow = (): void => {
    area.setCssStyles({ height: "auto" });
    const line = parseFloat(getComputedStyle(area).lineHeight) || 18;
    area.setCssStyles({ height: Math.min(area.scrollHeight, line * AREA_MAX_ROWS) + "px" });
  };
  grow();
  area.focus();
  area.select();
  area.addEventListener("input", grow);

  let done = false;
  const finish = (save: boolean): void => {
    if (done) return;
    done = true;
    if (area.parentElement) area.replaceWith(span);
    if (save) {
      sfx.tick();
      commit(area.value.trim());
    }
  };
  area.onblur = () => finish(true);
  area.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); finish(false); }
    else if (e.key === "Tab") { e.preventDefault(); finish(true); focusEditableFrom(span, e.shiftKey); }
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
