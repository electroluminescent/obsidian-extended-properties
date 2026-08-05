/**
 * Input autocompletion built on Obsidian's `AbstractInputSuggest`:
 * property-name suggestions (with "on note" badges and a create row) and
 * free-form value suggestions fed by vault usage.
 */

import { AbstractInputSuggest, App, TFile, TFolder } from "obsidian";
import type { I18n } from "../../i18n/i18n";

interface PropSuggestion { key: string; kind: "note" | "vault" | "create"; typeName?: string }

/** Suggests property keys; offers creating an unknown key verbatim. */
export class PropSuggest extends AbstractInputSuggest<PropSuggestion> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private i18n: I18n,
    private getCandidates: () => { key: string; onNote: boolean; typeName?: string }[],
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
    const res: PropSuggestion[] = filtered.map((c) => ({
      key: c.key,
      kind: c.onNote ? ("note" as const) : ("vault" as const),
      typeName: c.typeName,
    }));
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
    // Data-type tag, styled like the sidebar's type hint.
    if (c.typeName) el.createSpan({ cls: "ep-sug-type", text: c.typeName });
    if (c.kind === "note") el.createSpan({ cls: "ep-sug-badge", text: this.i18n.t("suggest.onNote") });
  }

  selectSuggestion(c: PropSuggestion): void {
    this.onChoose(c.key);
    this.setValue(this.clearOnSelect ? "" : c.key);
    (this as { close?: () => void }).close?.();
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
 * their short forms - interchangeably - for the identifier the caret is on,
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
    (this as { close?: () => void }).close?.();
  }
}


/**
 * Which notes a link may point at: everywhere, or one folder - the "only
 * characters" / "only locations" case, where a property references one
 * category of note.
 */
export interface NoteScope {
  /** Vault-relative folder path. Empty or unset = the whole vault. */
  folder?: string;
  /** Whether notes in folders below `folder` count too. */
  subfolders?: boolean;
}

/** Whether a note's path falls inside `scope`. Pure - the testable half. */
export function inScope(path: string, scope?: NoteScope): boolean {
  const folder = (scope?.folder ?? "").replace(/^\/+|\/+$/g, "");
  if (!folder) return true;
  const dir = path.slice(0, path.lastIndexOf("/") < 0 ? 0 : path.lastIndexOf("/"));
  const f = folder.toLowerCase();
  const d = dir.toLowerCase();
  return scope?.subfolders ? d === f || d.startsWith(f + "/") : d === f;
}

/** Markdown notes whose basename matches `q` (empty = all), best matches first. */
function noteMatches(app: App, q: string, scope?: NoteScope, limit = 30): TFile[] {
  const files = app.vault.getMarkdownFiles().filter((f) => inScope(f.path, scope));
  if (!q) return files.slice().sort((a, b) => a.basename.localeCompare(b.basename)).slice(0, limit);
  const out: { f: TFile; rank: number }[] = [];
  for (const f of files) {
    const i = f.basename.toLowerCase().indexOf(q);
    if (i < 0) continue;
    out.push({ f, rank: i === 0 ? 0 : 1 });
  }
  out.sort((a, b) => a.rank - b.rank || a.f.basename.localeCompare(b.f.basename));
  return out.slice(0, limit).map((x) => x.f);
}

/** Suggests vault folders, for settings that name one. */
export class FolderSuggest extends AbstractInputSuggest<string> {
  constructor(app: App, inputEl: HTMLInputElement, private onChoose: (path: string) => void) {
    super(app, inputEl);
  }

  getSuggestions(query: string): string[] {
    const q = query.trim().toLowerCase();
    const all: string[] = [];
    for (const f of this.app.vault.getAllLoadedFiles()) {
      if (f instanceof TFolder && f.path !== "/") all.push(f.path);
    }
    all.sort((a, b) => a.localeCompare(b));
    return (q ? all.filter((p) => p.toLowerCase().includes(q)) : all).slice(0, 50);
  }

  renderSuggestion(p: string, el: HTMLElement): void {
    el.setText(p);
  }

  selectSuggestion(p: string): void {
    this.onChoose(p);
    this.setValue(p);
    (this as { close?: () => void }).close?.();
  }
}

type LinkOrValue =
  | { kind: "link"; text: string; file: TFile }
  | { kind: "value" | "create" | "newNote"; text: string };

/** How a field offers notes: scoped to a folder, and whether it may invent one. */
export interface LinkMode {
  /**
   * Offer notes for whatever is typed, without waiting for a `[[` token - the
   * field *is* a link, so typing `f` should list the notes starting with f.
   */
  bare?: boolean;
  scope?: () => NoteScope | undefined;
  /** Offer to create the note when the typed name matches none. */
  create?: boolean;
}

/**
 * Text-input autocomplete that offers vault-note links when the caret sits in
 * an unclosed `[[...` token (inserting `[[Note]]`), and otherwise existing
 * property values when an options provider is given. Attach to any free-text or
 * list-value input so typing `[[` brings up note suggestions.
 */
export class TextLinkSuggest extends AbstractInputSuggest<LinkOrValue> {
  /** An unclosed `[[` token (no brackets after it) ending at the caret. */
  private static readonly OPEN = /\[\[([^[\]]*)$/;
  private el: HTMLInputElement;
  private appRef: App;

  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private getOptions?: () => string[],
    private onChoose?: (v: string) => void,
    private link?: LinkMode,
    /** Whether a value that matches nothing may still be offered as typed. */
    private allowNew = true
  ) {
    super(app, inputEl);
    this.el = inputEl;
    this.appRef = app;
  }

  /** The notes on offer for what has been typed, as suggestion rows. */
  private notes(typed: string): LinkOrValue[] {
    // Matched case-insensitively, but offered to be created as written: a new
    // note takes the name the user typed, capitals and all.
    const q = typed.trim();
    const ql = q.toLowerCase();
    const found = noteMatches(this.appRef, ql, this.link?.scope?.());
    const res: LinkOrValue[] = found.map((f) => ({ kind: "link" as const, text: f.basename, file: f }));
    if (this.link?.create && q && !found.some((f) => f.basename.toLowerCase() === ql)) {
      res.unshift({ kind: "newNote", text: q });
    }
    return res;
  }

  getSuggestions(value: string): LinkOrValue[] {
    const link = TextLinkSuggest.OPEN.exec(value);
    if (link) return this.notes(link[1]);
    // A link field takes the whole box as the name of a note - no `[[` first.
    if (this.link?.bare) return this.notes(linkNameOf(value));
    if (!this.getOptions) return [];
    const q = value.trim();
    const ql = q.toLowerCase();
    const opts = this.getOptions();
    const filtered = (ql ? opts.filter((o) => o.toLowerCase().includes(ql)) : opts).slice(0, 50);
    const res: LinkOrValue[] = filtered.map((o) => ({ kind: "value" as const, text: o }));
    // A field that only takes what it offers must not offer anything else.
    if (this.allowNew && q && !opts.some((o) => o.toLowerCase() === ql)) {
      res.unshift({ kind: "create", text: q });
    }
    return res;
  }

  renderSuggestion(s: LinkOrValue, el: HTMLElement): void {
    if (s.kind === "link") {
      el.createSpan({ cls: "ep-sug-link", text: s.text });
      const p = s.file.parent?.path;
      if (p && p !== "/") el.createSpan({ cls: "ep-sug-badge", text: p });
      return;
    }
    if (s.kind === "newNote") {
      el.addClass("ep-sug-create");
      el.setText(`+ ${s.text}`);
      return;
    }
    el.setText(s.text);
  }

  selectSuggestion(s: LinkOrValue): void {
    if (s.kind === "newNote") {
      void this.createNote(s.text);
      return;
    }
    if (s.kind === "link") {
      // A link field holds one link, so the pick replaces the box rather than
      // being spliced in where a `[[` was typed.
      if (this.link?.bare) {
        this.commitLink(s.text);
        return;
      }
      const val = this.el.value;
      const m = TextLinkSuggest.OPEN.exec(val);
      const start = m ? m.index : val.length;
      const next = val.slice(0, start) + `[[${s.text}]]`;
      this.el.value = next;
      this.el.dispatchEvent(new Event("input"));
      this.el.focus();
      try {
        this.el.setSelectionRange(next.length, next.length);
      } catch {
        /* setSelectionRange unsupported on this input type */
      }
      (this as unknown as { close?: () => void }).close?.();
      return;
    }
    this.onChoose?.(s.text);
    this.setValue(s.text);
    (this as unknown as { close?: () => void }).close?.();
  }

  /** Put `[[name]]` in the box and hand it on, as though typed in full. */
  private commitLink(name: string): void {
    const val = `[[${name}]]`;
    this.setValue(val);
    this.el.value = val;
    this.el.dispatchEvent(new Event("input"));
    this.onChoose?.(val);
    (this as unknown as { close?: () => void }).close?.();
  }

  /** Make the note the typed name asks for, in the scoped folder, and link it. */
  private async createNote(name: string): Promise<void> {
    const folder = (this.link?.scope?.()?.folder ?? "").replace(/^\/+|\/+$/g, "");
    const path = `${folder ? folder + "/" : ""}${name}.md`;
    try {
      if (!this.appRef.vault.getAbstractFileByPath(path)) await this.appRef.vault.create(path, "");
    } catch (err) {
      console.error("Extended Properties: could not create", path, err);
    }
    this.commitLink(name);
  }
}

/** The bare note name in `[[Name|alias]]`, or the text as typed. */
export function linkNameOf(raw: string): string {
  const m = /\[\[([^\]|#]*)/.exec(raw);
  return (m ? m[1] : raw).trim();
}
