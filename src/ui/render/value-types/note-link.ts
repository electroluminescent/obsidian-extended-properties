/**
 * The note-link field: a value that names a note.
 *
 * Shared by the "link" data type and by any text property with "links to a
 * note" switched on - the two are the same field, and the switch is how the
 * type will eventually be absorbed. Everything here works off `entry.choices`,
 * so neither caller keeps its own copy of the behaviour.
 */

import { Setting, TFile } from "obsidian";
import type { Entry } from "../../../core/model";
import type { OptionsCtx, ViewCtx } from "../../../core/context";
import { openLinkInput } from "../../components/inline-edit";
import { FolderSuggest, inScope } from "../../components/suggest";
import type { NoteScope } from "../../components/suggest";

/** Whether this entry's value is the name of a note. */
export function linksToNotes(entry: Entry): boolean {
  return entry.choices?.linksToNotes === true;
}

/** The folder an entry offers notes from, if it names one. */
export function linkScopeOf(entry: Entry): NoteScope | undefined {
  const c = entry.choices;
  // Subfolders count unless turned off: a folder of characters that grows a
  // "Minor" subfolder still holds characters.
  return c?.folder ? { folder: c.folder, subfolders: c.subfolders !== false } : undefined;
}

/** The bare link target inside `[[Target|alias]]`, or the raw string. */
export function linkTarget(raw: string): string {
  const m = /\[\[([^\]|#]+)/.exec(raw);
  return (m ? m[1] : raw).trim();
}

/**
 * The span each rendered link occupies, so a row menu can open the same
 * in-place field the cell does rather than a prompt window of its own.
 */
const spans = new WeakMap<Entry, HTMLElement>();

/** The span holding `entry`'s link, if it is on screen. */
export function linkSpanFor(entry: Entry): HTMLElement | null {
  const s = spans.get(entry);
  return s?.isConnected ? s : null;
}

/**
 * Draw `raw` into `span` as an internal link - a bare name counts, which is
 * the point of the type - flagging on `cell` a link that leads nowhere, or
 * (for a property held to one folder) outside it, which is just as wrong.
 */
export function drawNoteLink(view: ViewCtx, cell: HTMLElement, span: HTMLElement, entry: Entry, raw: string): void {
  spans.set(entry, span);
  span.empty();
  span.removeClass("ep-placeholder");
  cell.removeClass("ep-link-unresolved");
  if (!raw) {
    span.addClass("ep-placeholder");
    span.setText("-");
    return;
  }
  view.renderLinks(span, /\[\[.+?\]\]|\]\([^)]+\)/.test(raw) ? raw : `[[${raw}]]`);
  const dest = view.app.metadataCache.getFirstLinkpathDest(linkTarget(raw), view.note.path || "");
  if (!dest || (entry.choices?.strict === true && !inScope(dest.path, linkScopeOf(entry)))) {
    cell.addClass("ep-link-unresolved");
  }
}

/** Open the in-place link field over `span`, writing back to the entry's key. */
export function editNoteLink(view: ViewCtx, file: TFile, entry: Entry, span: HTMLElement): void {
  const key = entry.key as string;
  const c = entry.choices;
  openLinkInput(
    view.app,
    span,
    view.note.str(key),
    {
      scope: linkScopeOf(entry),
      strict: c?.strict === true,
      create: c?.create === true,
      rejected: view.i18n.t(c?.folder ? "link.notInFolder" : "link.notANote", { folder: c?.folder ?? "" }),
    },
    (val) => view.note.set(file, key, val === "" ? undefined : val)
  );
}

/** The settings a note-linking field carries: where its notes come from. */
export function renderNoteChoices(octx: OptionsCtx): void {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const ch = (): NonNullable<Entry["choices"]> => (entry.choices ??= {});
  new Setting(c)
    .setName(t("options.linkFolder"))
    .setDesc(t("options.linkFolderDesc"))
    .addText((tx) => {
      tx.setValue(entry.choices?.folder ?? "");
      const save = (v: string): void => {
        ch().folder = v.trim() || undefined;
        changed();
      };
      tx.onChange(save);
      new FolderSuggest(view.app, tx.inputEl, save);
    });
  new Setting(c)
    .setName(t("options.linkSubfolders"))
    .setDesc(t("options.linkSubfoldersDesc"))
    .addToggle((tg) => {
      tg.setValue(entry.choices?.subfolders !== false).onChange((v) => {
        ch().subfolders = v ? undefined : false;
        changed();
      });
    });
  new Setting(c)
    .setName(t("options.linkStrict"))
    .setDesc(t("options.linkStrictDesc"))
    .addToggle((tg) => {
      tg.setValue(entry.choices?.strict === true).onChange((v) => {
        ch().strict = v || undefined;
        changed();
      });
    });
  new Setting(c)
    .setName(t("options.linkCreate"))
    .setDesc(t("options.linkCreateDesc"))
    .addToggle((tg) => {
      tg.setValue(entry.choices?.create === true).onChange((v) => {
        ch().create = v || undefined;
        changed();
      });
    });
}
