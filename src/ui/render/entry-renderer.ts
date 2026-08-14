/**
 * Renders one entry into a section grid: the shared shell (wrapper, grip,
 * icon, options button, context menu, drag wiring) around the kind-specific
 * body looked up in the entry-kind registry.
 */

import { setIcon } from "obsidian";
import type { TFile } from "obsidian";
import type { ClusterFlags, EntryRenderCtx, ViewCtx } from "../../core/context";
import type { Entry, Section } from "../../core/model";
import { openEntryMenu } from "../menus/entry-menu";
import { applyFormat, formatValue, ruleFor } from "./format";
import {
  focusEntry,
  openEntrySettingsPopup,
  wireEntryInteractions,
  wireKeyGestures,
} from "../components/hold-config";
import type { DragController } from "../drag";

/** True when the entry should be hidden outside edit mode (empty prop). */
export function isHiddenEntry(view: ViewCtx, entry: Entry): boolean {
  if (view.editMode) return false;
  // Conditional visibility applies to entries of any kind.
  if (entry.showWhen && !view.condVisible(entry.showWhen)) return true;
  if (entry.kind !== "prop") return false;
  // Derived values are computed, not stored - they are never "empty".
  if (view.resolveType(entry) === "derived") return false;
  return entry.hideIfEmpty !== false && view.note.isEmpty(entry.key);
}

/** Whether the entry spans all section columns (kind- or value-type-wide). */
function isWide(view: ViewCtx, entry: Entry): boolean {
  if (view.registries.entryKinds.get(entry.kind)?.wide) return true;
  if (entry.kind === "prop") return !!view.registries.valueTypes.get(view.resolveType(entry))?.wide;
  return false;
}

export interface RenderEntryOptions {
  /**
   * Draw the entry even where the sidebar would be hiding it (empty, or a
   * condition unmet). The section's "Set a property" panel lists everything
   * the section holds, which is the whole point of going there.
   */
  force?: boolean;
}

export function renderEntry(
  grid: HTMLElement,
  view: ViewCtx,
  file: TFile,
  section: Section,
  entry: Entry,
  flags: ClusterFlags,
  drag: DragController,
  opts: RenderEntryOptions = {}
): void {
  if (!opts.force && isHiddenEntry(view, entry)) return;
  const kind = view.registries.entryKinds.get(entry.kind);
  // Edit mode shows conditionally-hidden entries dimmed (so they stay reachable).
  const condOff = view.editMode && !!entry.showWhen && !view.condVisible(entry.showWhen);

  // Bare kinds (blank cells) own their entire chrome.
  if (kind?.bare) {
    const wrap = grid.createDiv({ cls: "ep-entry ep-blank" });
    wrap.setAttr("data-ep-id", "e:" + entry.id);
    if (condOff) wrap.addClass("ep-cond-off");
    const ctx: EntryRenderCtx = { view, file, section, entry, head: wrap, extra: wrap, flags, wrap };
    kind.render(ctx);
    if (view.editMode) {
      const grip = wrap.querySelector<HTMLElement>(".ep-grip");
      if (grip) drag.attachEntry(wrap, grip, section, entry);
    }
    return;
  }

  const wide = isWide(view, entry);
  const wrap = grid.createDiv({ cls: wide ? "ep-entry ep-entry-block" : "ep-entry" });
  wrap.setAttr("data-ep-id", "e:" + entry.id);
  // Keyboard a11y (E1): focusable group with a label; arrow-navigated by the view.
  wrap.tabIndex = -1;
  wrap.setAttr("role", "group");
  wrap.setAttr("aria-label", (entry.alias as string) || entry.key || view.defaultLabelFor(entry));
  if (condOff) {
    wrap.addClass("ep-cond-off");
    wrap.setAttr("title", view.i18n.t("options.showWhenActive", { expr: entry.showWhen as string }));
  }
  if (wide) wrap.setCssStyles({ gridColumn: "1 / -1" });
  // "Show value" off hides the textual value everywhere; controls remain.
  if (entry.showValue === false) wrap.addClass("ep-hide-value");

  const head = wrap.createDiv({ cls: "ep-entry-head" });
  let grip: HTMLElement | null = null;
  if (view.editMode) {
    grip = head.createSpan({ cls: "ep-grip", text: "::" });
    grip.setAttr("title", view.i18n.t("entry.dragHint"));
    grip.setAttr("aria-hidden", "true"); // mouse-drag affordance; keyboard reorders via the entry menu
  }
  if (entry.icon) {
    const ic = head.createSpan({ cls: "ep-picon" });
    setIcon(ic, entry.icon);
    if (entry.iconColor) ic.setCssStyles({ color: entry.iconColor });
  }
  const extra = wrap.createDiv({ cls: "ep-entry-extra" });

  const ctx: EntryRenderCtx = { view, file, section, entry, head, extra, flags, wrap };
  if (kind) {
    kind.render(ctx);
  } else {
    // Unknown kind (e.g. its feature module was disabled): show a stub.
    view.renderLabel(head, ctx);
    const v = head.createDiv({ cls: "ep-val-right" });
    v.createSpan({ cls: "ep-placeholder", text: view.i18n.t("entry.unknownKind", { kind: entry.kind }) });
  }

  // Conditional formatting: one pass over whatever the value type drew, and
  // again whenever the value changes. A property nobody has formatted is left
  // exactly as it was, so this costs a lookup and nothing more.
  if (entry.kind === "prop" && entry.key) {
    const paint = (): void => {
      applyFormat(view, entry, formatValue(view, entry), {
        wrap,
        // The chips are rebuilt by the list type as values come and go, so
        // they are found again on every pass rather than held onto.
        val: wrap.querySelector<HTMLElement>(".ep-num, .ep-val-right, .ep-val"),
        chips: wrap.findAll(".ep-chip"),
      });
    };
    paint();
    view.registerUpdater(paint);
    // A value can also change without anything telling us: a slider mid-drag,
    // a stepper, an inline edit committing, a chip added. Watch what the value
    // type drew and reassess the colour - and the text that has to be legible
    // on it - whenever it changes. One frame at a time, and only for rows that
    // are actually formatted.
    if (ruleFor(view, entry)) {
      let queued = false;
      const watch = new MutationObserver(() => {
        if (!wrap.isConnected) {
          watch.disconnect();
          return;
        }
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(() => {
          queued = false;
          if (wrap.isConnected) paint();
          else watch.disconnect();
        });
      });
      watch.observe(wrap, { subtree: true, childList: true, characterData: true });
    }
  }

  // Right-click and press-and-hold are user-mappable (menu / property
  // settings popup / focus); the hold charges a ring around the cursor.
  wireEntryInteractions(wrap, view, file, section, entry);
  // The menu button: always in edit mode, and outside it when the entry asks
  // for one. It is appended to the head after the value type has rendered, so
  // it lands at the end of the row - to the right of the cluster, and so of
  // the roll button - whatever the data type or layout mode.
  if (view.editMode || entry.menuBtn === true) {
    const menuBtn = head.createSpan({ cls: "ep-menu-btn" });
    setIcon(menuBtn, "more-vertical");
    menuBtn.setAttr("role", "button");
    menuBtn.tabIndex = 0;
    menuBtn.setAttr("aria-label", view.i18n.t("a11y.entryMenu"));
    menuBtn.setAttr("title", view.i18n.t("a11y.entryMenu"));
    menuBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEntryMenu(e, view, file, section, entry);
    };
    // The keyboard gets the same mapping a press has: tap for the menu, hold
    // for the hold action, two taps for the double-click action.
    wireKeyGestures(
      menuBtn,
      view.settings,
      {
        menu: (x, y) =>
          openEntryMenu(new MouseEvent("contextmenu", { clientX: x, clientY: y }), view, file, section, entry),
        settings: (x, y) => openEntrySettingsPopup(view, file, section, entry, x, y),
        focus: () => focusEntry(wrap),
      },
      (x, y) => openEntryMenu(new MouseEvent("contextmenu", { clientX: x, clientY: y }), view, file, section, entry)
    );
  }
  if (view.editMode && grip) drag.attachEntry(wrap, grip, section, entry);
}
