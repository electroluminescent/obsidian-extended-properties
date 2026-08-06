/**
 * Inline editing primitives: temporarily swap a display element for an
 * `<input>`, commit on Enter/blur, cancel on Escape, restore the element.
 */

import { App, Notice } from "obsidian";
import { fmtNum, clamp } from "../../utils/misc";
import { inScope, linkNameOf, TextLinkSuggest } from "./suggest";
import { valueAllowed } from "../../core/choices";
import type { NoteScope } from "./suggest";
import { stepField } from "./tab-chain";
import { sfx } from "../../utils/sound";

export interface NumberInputOptions {
  min: number;
  max: number;
  float: boolean;
  clamp: boolean;
  /** Called instead of `commit` when the field is emptied (e.g. to clear an override). */
  onEmpty?: () => void;
  /**
   * Work out what was typed - arithmetic, measurements - instead of reading it
   * as a plain number. Given one, the field takes text rather than digits.
   */
  evaluate?: (text: string) => number | undefined;
}

/**
 * After a Tab commit, move to the neighbouring field (see `tab-chain`), so the
 * sidebar works as a primary data-entry surface: click once, then Tab
 * (Shift+Tab) through every value, checkbox and list on the note.
 */
function focusEditableFrom(span: HTMLElement, backwards: boolean): void {
  const scope = span.closest(".view-content") ?? span.ownerDocument.body;
  stepField(scope, span, backwards);
}

/** Swap `span` for a number input; commit the parsed (and clamped) value. */
export function openNumberInput(
  span: HTMLElement,
  value: number,
  commit: (v: number) => void,
  o: NumberInputOptions
): void {
  const input = createEl("input", { cls: "ep-edit-input" });
  if (o.evaluate) {
    // A field that works out what it is given cannot be type=number: that
    // refuses everything but digits, and the point is to take 1'2" - 5cm.
    input.type = "text";
    input.inputMode = "text";
    input.spellcheck = false;
  } else {
    input.type = "number";
    if (o.float) input.step = "any";
  }
  input.value = fmtNum(value);
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
    let n = o.evaluate ? (o.evaluate(input.value) ?? NaN) : Number(input.value);
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

export interface TextInputOptions {
  /** Refuse anything but a value on offer, rather than taking free text. */
  strict?: boolean;
  /** What to say when a strict field is given something not on offer. */
  rejected?: string;
}

/** Swap `span` for a text input with value autocompletion for `key`. */
export function openTextInput(
  app: App,
  span: HTMLElement,
  key: string,
  value: string,
  valuesFor: (key: string) => string[],
  commit: (v: string) => void,
  opts: TextInputOptions = {}
): void {
  const input = createEl("input", { cls: "ep-edit-input" });
  input.type = "text";
  input.value = value;
  span.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (save: boolean) => {
    if (done) return;
    if (save && !valueAllowed(input.value, valuesFor(key), opts.strict)) {
      if (opts.rejected) new Notice(opts.rejected);
      input.focus();
      input.select();
      return;
    }
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save) { sfx.tick(); commit(input.value.trim()); }
  };
  // A pick goes through the same commit as typing, so a strict field cannot be
  // talked into a value it would refuse.
  new TextLinkSuggest(
    app,
    input,
    () => valuesFor(key),
    (v) => {
      input.value = v;
      window.setTimeout(() => finish(true), 0);
    },
    undefined,
    !opts.strict
  );
  input.addEventListener("focus", () => input.dispatchEvent(new Event("input")));
  input.dispatchEvent(new Event("input"));
  // Delay so a suggestion click can land before the blur commits.
  input.onblur = () => window.setTimeout(() => finish(true), 150);
  input.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); finish(false); }
    else if (e.key === "Tab") { e.preventDefault(); finish(true); focusEditableFrom(span, e.shiftKey); }
  };
}

export interface LinkInputOptions {
  scope?: NoteScope;
  /** Refuse anything but a note on offer, rather than taking free text. */
  strict?: boolean;
  /** Offer to make the note when the name matches none. */
  create?: boolean;
  /** What to say when a strict field is given a note that is not on offer. */
  rejected: string;
}

/**
 * Swap `span` for a link field: typing a name lists the notes it could mean -
 * no `[[` needed, since the field holds nothing else - and picking one writes
 * `[[Note]]`. With a folder named, only that folder's notes are offered, and
 * `strict` refuses anything else rather than storing a link to nowhere.
 */
export function openLinkInput(
  app: App,
  span: HTMLElement,
  value: string,
  opts: LinkInputOptions,
  commit: (v: string) => void
): void {
  const input = createEl("input", { cls: "ep-edit-input" });
  input.type = "text";
  input.value = value;
  span.replaceWith(input);
  input.focus();
  input.select();
  const allowed = (v: string): boolean => {
    if (!opts.strict) return true;
    const name = linkNameOf(v);
    if (name === "") return true; // clearing the value is always allowed
    const dest = app.metadataCache.getFirstLinkpathDest(name, "");
    return !!dest && inScope(dest.path, opts.scope);
  };
  let done = false;
  const finish = (save: boolean): void => {
    if (done) return;
    if (save && !allowed(input.value)) {
      new Notice(opts.rejected);
      input.focus();
      input.select();
      return;
    }
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save) {
      sfx.tick();
      commit(input.value.trim());
    }
  };
  new TextLinkSuggest(app, input, undefined, () => window.setTimeout(() => finish(true), 0), {
    bare: true,
    create: opts.create,
    scope: () => opts.scope,
  });
  input.addEventListener("focus", () => input.dispatchEvent(new Event("input")));
  input.dispatchEvent(new Event("input"));
  // Delay so a suggestion click can land before the blur commits.
  input.onblur = () => window.setTimeout(() => finish(true), 150);
  input.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); done = true; input.replaceWith(span); }
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
