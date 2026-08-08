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
import { FolderSuggest, inScope, linkDisplay, linkStored } from "../../components/suggest";
import { mountTextList } from "../../components/setting-helpers";
import type { NoteScope } from "../../components/suggest";

/** Whether this entry's value is the name of a note. */
export function linksToNotes(entry: Entry): boolean {
  return entry.choices?.linksToNotes === true;
}

/**
 * The folders an entry offers notes from. `folder` is the single one older
 * versions stored, still read so an imported layout keeps its scope.
 */
export function foldersOf(entry: Entry): string[] {
  const c = entry.choices;
  const list = c?.folders ?? (c?.folder ? [c.folder] : []);
  return list.map((f) => f.trim()).filter(Boolean);
}

/** The folders an entry offers notes from, if it names any. */
export function linkScopeOf(entry: Entry): NoteScope | undefined {
  const folders = foldersOf(entry);
  // Subfolders count unless turned off: a folder of characters that grows a
  // "Minor" subfolder still holds characters.
  return folders.length ? { folders, subfolders: entry.choices?.subfolders !== false } : undefined;
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
export function drawNoteLink(
  view: ViewCtx,
  file: TFile,
  cell: HTMLElement,
  span: HTMLElement,
  entry: Entry,
  raw: string
): void {
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
  // A property that draws from one folder makes its notes there: following a
  // link to a note that does not exist yet should not drop one somewhere else.
  if (!dest && foldersOf(entry).length) {
    const a = span.querySelector("a");
    a?.addEventListener(
      "click",
      (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        void createInFolder(view, file, entry, linkTarget(raw));
      },
      true
    );
  }
}

/** Make `name` in the entry's first folder, link it, and open it. */
async function createInFolder(view: ViewCtx, file: TFile, entry: Entry, name: string): Promise<void> {
  const folder = (foldersOf(entry)[0] ?? "").replace(/^\/+|\/+$/g, "");
  const path = `${folder ? folder + "/" : ""}${name}.md`;
  try {
    if (!view.app.vault.getAbstractFileByPath(path)) await view.app.vault.create(path, "");
    // The value may have been plain text until now; it names a note from here.
    if (entry.key) view.note.set(file, entry.key, `[[${name}]]`);
    await view.app.workspace.openLinkText(name, file.path, false);
  } catch (err) {
    console.error("Extended Properties: could not create", path, err);
  }
}

/** Open the in-place link field over `span`, writing back to the entry's key. */
export function editNoteLink(view: ViewCtx, file: TFile, entry: Entry, span: HTMLElement): void {
  const key = entry.key as string;
  const c = entry.choices;
  // The field shows and takes note names; the brackets are how the value is
  // stored, and are put back on the way out.
  openLinkInput(
    view.app,
    span,
    linkDisplay(view.note.str(key)),
    {
      scope: linkScopeOf(entry),
      strict: c?.strict === true,
      create: c?.create === true,
      rejected: folderList(entry)
        ? view.i18n.t("link.notInFolder", { folder: folderList(entry) })
        : view.i18n.t("link.notANote"),
    },
    (val) => {
      const stored = linkStored(val);
      view.note.set(file, key, stored === "" ? undefined : stored);
    }
  );
}

/** The folders named, for a message that has to say which. */
function folderList(entry: Entry): string {
  return foldersOf(entry).join(", ");
}

/**
 * The folders a note-linking field draws from, as a list that grows: several
 * folders can hold the same kind of note ("Characters" and "Villains"), and
 * the first one is where a new note is made.
 */
function renderFolderList(octx: OptionsCtx): void {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  new Setting(c).setName(t("options.linkFolder")).setDesc(t("options.linkFolderDesc"));
  mountTextList(c, {
    values: foldersOf(entry),
    addLabel: t("options.linkFolderAdd"),
    removeTip: t("options.linkFolderRemove"),
    placeholder: t("options.linkFolderPlaceholder"),
    suggest: (input, save) => {
      new FolderSuggest(view.app, input, save);
    },
    save: (folders) => {
      const ch = (entry.choices ??= {});
      ch.folders = folders.length ? folders : undefined;
      ch.folder = undefined; // the single-folder field is superseded
      changed();
    },
  });
}

/** The settings a note-linking field carries: where its notes come from. */
export function renderNoteChoices(octx: OptionsCtx): void {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const ch = (): NonNullable<Entry["choices"]> => (entry.choices ??= {});
  renderFolderList(octx);
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
