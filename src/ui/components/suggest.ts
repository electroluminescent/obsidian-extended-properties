/**
 * Input autocompletion built on Obsidian's `AbstractInputSuggest`:
 * property-name suggestions (with "on note" badges and a create row) and
 * free-form value suggestions fed by vault usage.
 */

import { AbstractInputSuggest, App } from "obsidian";
import type { I18n } from "../../i18n/i18n";

interface PropSuggestion { key: string; kind: "note" | "vault" | "create" }

/** Suggests property keys; offers creating an unknown key verbatim. */
export class PropSuggest extends AbstractInputSuggest<PropSuggestion> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private i18n: I18n,
    private getCandidates: () => { key: string; onNote: boolean }[],
    private onChoose: (key: string) => void,
    private clearOnSelect = true
  ) {
    super(app, inputEl);
  }

  getSuggestions(query: string): PropSuggestion[] {
    const q = query.trim();
    const ql = q.toLowerCase();
    const cands = this.getCandidates();
    const filtered = (ql ? cands.filter((c) => c.key.toLowerCase().includes(ql)) : cands).slice(0, 50);
    const res: PropSuggestion[] = filtered.map((c) => ({ key: c.key, kind: c.onNote ? "note" : "vault" }));
    if (q && !cands.some((c) => c.key.toLowerCase() === ql)) res.unshift({ key: q, kind: "create" });
    return res;
  }

  renderSuggestion(c: PropSuggestion, el: HTMLElement): void {
    if (c.kind === "create") {
      el.addClass("ep-sug-create");
      el.setText(this.i18n.t("suggest.create", { key: c.key }));
      return;
    }
    el.createSpan({ text: c.key });
    if (c.kind === "note") el.createSpan({ cls: "ep-sug-badge", text: this.i18n.t("suggest.onNote") });
  }

  selectSuggestion(c: PropSuggestion): void {
    this.onChoose(c.key);
    this.setValue(this.clearOnSelect ? "" : c.key);
    (this as any).close?.();
  }
}

/** One reference autocomplete option: the text to insert plus a hint (its counterpart). */
export interface RefOption {
  text: string;
  hint: string;
}

/**
 * Token-aware autocomplete for expression/notation fields (the roller, the
 * influence expression editor, macro notation). Suggests property names and
 * their short forms — interchangeably — for the identifier the caret is on,
 * and replaces just that token on selection (the rest of the expression is
 * left intact).
 */
export class RefSuggest extends AbstractInputSuggest<RefOption> {
  private static readonly TOKEN = /[A-Za-z_][A-Za-z0-9_]*$/;
  private el: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, private getRefs: () => RefOption[]) {
    super(app, inputEl);
    this.el = inputEl;
  }

  getSuggestions(value: string): RefOption[] {
    const m = RefSuggest.TOKEN.exec(value);
    if (!m) return [];
    const tl = m[0].toLowerCase();
    return this.getRefs()
      .filter((r) => r.text.toLowerCase().includes(tl))
      .slice(0, 30);
  }

  renderSuggestion(r: RefOption, el: HTMLElement): void {
    el.createSpan({ text: r.text });
    if (r.hint) el.createSpan({ cls: "ep-sug-badge", text: r.hint });
  }

  selectSuggestion(r: RefOption): void {
    const val = this.el.value;
    const m = RefSuggest.TOKEN.exec(val);
    const start = m ? val.length - m[0].length : val.length;
    const next = val.slice(0, start) + r.text;
    this.el.value = next;
    this.el.dispatchEvent(new Event("input"));
    this.el.focus();
    try {
      this.el.setSelectionRange(next.length, next.length);
    } catch {
      /* selectionRange unsupported on this input */
    }
    (this as unknown as { close?: () => void }).close?.();
  }
}

/** Suggests existing values for a property (free text allowed). */
export class ValueSuggest extends AbstractInputSuggest<string> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private getOptions: () => string[],
    private onChoose: (v: string) => void,
    private clearOnSelect = true
  ) {
    super(app, inputEl);
  }

  getSuggestions(query: string): string[] {
    const q = query.trim();
    const ql = q.toLowerCase();
    const opts = this.getOptions();
    const filtered = (ql ? opts.filter((o) => o.toLowerCase().includes(ql)) : opts).slice(0, 50);
    if (q && !opts.some((o) => o.toLowerCase() === ql)) filtered.unshift(q);
    return filtered;
  }

  renderSuggestion(v: string, el: HTMLElement): void {
    el.setText(v);
  }

  selectSuggestion(v: string): void {
    this.onChoose(v);
    this.setValue(this.clearOnSelect ? "" : v);
    (this as any).close?.();
  }
}
