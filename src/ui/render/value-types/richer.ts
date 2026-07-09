/**
 * Richer value types (roadmap C3):
 *
 * - "rating"   - a row of clickable pips/stars; stores an integer.
 * - "link"     - an internal link, click-through, with unresolved styling.
 * - "unit"     - a number shown with a unit suffix; stores the canonical
 *                number, displays it multiplied by a per-entry factor.
 * - "datetime" - an ISO date with a relative ("in 3 days") hint; `<input
 *                type=date>` editor. Pairs with the `today()`/`days()`
 *                expression functions.
 *
 * Each is just a {@link ValueTypeDef} registration - no engine change - which
 * is the point of the registry architecture.
 */

import { setIcon, Setting } from "obsidian";
import type { App } from "obsidian";
import type { I18n } from "../../../i18n/i18n";
import type { NoteModel } from "../../../core/note-model";
import type { ValueTypeDef } from "../../../core/registry";
import { fmtNum } from "../../../utils/misc";
import { openNumberInput } from "../../components/inline-edit";
import { sfx } from "../../../utils/sound";
import { TextPromptModal } from "../../modals/dialogs";

/** The subset of the view a link prompt needs. */
interface LinkPromptView {
  app: App;
  i18n: I18n;
  note: NoteModel;
}

// ---------------------------------------------------------------------------
// rating
// ---------------------------------------------------------------------------

export const ratingType: ValueTypeDef = {
  id: "rating",
  name: (i18n) => i18n.t("type.rating"),
  // Absorbed by the number type (rating display under the slider settings).
  deprecated: true,

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const max = Math.max(1, Math.min(20, Math.round(Number(entry.ratingMax) || 5)));
    const icon = (entry.ratingIcon as string) || "star";
    const v = ctx.head.createDiv({ cls: "ep-val-right ep-rating" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    // Accessible as a slider (M1): focusable, arrow-keys change the value, and
    // the pips themselves are decorative (aria-hidden) - the container conveys it.
    v.setAttr("role", "slider");
    v.tabIndex = 0;
    v.setAttr("aria-label", view.i18n.t("a11y.rating", { name: view.defaultLabelFor(entry) }));
    v.setAttr("aria-valuemin", "0");
    v.setAttr("aria-valuemax", String(max));
    const setRating = (n: number) => view.note.set(file, key, Math.max(0, Math.min(max, n)));
    const draw = () => {
      v.empty();
      const cur = Math.round(view.note.num(key, 0));
      v.setAttr("aria-valuenow", String(cur));
      v.setAttr("aria-valuetext", view.i18n.t("a11y.ratingValue", { value: cur, max }));
      for (let i = 1; i <= max; i++) {
        const pip = v.createSpan({ cls: "ep-rating-pip" + (i <= cur ? " is-on" : "") });
        setIcon(pip, icon);
        pip.setAttr("aria-hidden", "true");
        pip.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          sfx.tick();
          // Click the current highest pip to clear it (toggle down).
          setRating(i === cur ? i - 1 : i);
        };
      }
    };
    draw();
    v.addEventListener("keydown", (e: KeyboardEvent) => {
      const cur = Math.round(view.note.num(key, 0));
      let n = cur;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") n = cur + 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") n = cur - 1;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = max;
      else return;
      e.preventDefault();
      sfx.tick();
      setRating(n);
    });
    view.registerUpdater(draw);
  },

  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("type.rating") });
    new Setting(c).setName(t("options.ratingMax")).addSlider((sl) =>
      sl
        .setLimits(1, 10, 1)
        .setValue(Math.round(Number(entry.ratingMax) || 5))
        .onChange((val) => {
          entry.ratingMax = val;
          changed();
        })
    );
    new Setting(c).setName(t("options.ratingIcon")).setDesc(t("options.ratingIconDesc")).addText((tx) =>
      tx
        .setPlaceholder("star")
        .setValue((entry.ratingIcon as string) || "")
        .onChange((val) => {
          entry.ratingIcon = val.trim() || undefined;
          changed();
        })
    );
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.clearValue", { key })).setIcon("eraser").onClick(() =>
        view.note.set(file, key, undefined)
      )
    );
  },
};

// ---------------------------------------------------------------------------
// link
// ---------------------------------------------------------------------------

/** The bare link target inside `[[Target|alias]]`, or the raw string. */
function linkTarget(raw: string): string {
  const m = /\[\[([^\]|#]+)/.exec(raw);
  return (m ? m[1] : raw).trim();
}

function promptLink(view: LinkPromptView, set: (v: string | undefined) => void, key: string): void {
  new TextPromptModal(view.app, view.i18n, view.i18n.t("link.prompt"), view.note.str(key), (val) => {
    const s = val.trim();
    set(s === "" ? undefined : s);
  }).open();
}

export const linkType: ValueTypeDef = {
  id: "link",
  name: (i18n) => i18n.t("type.link"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const v = ctx.head.createDiv({ cls: "ep-val-right ep-linkval" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    const draw = () => {
      v.empty();
      v.removeClass("ep-link-unresolved");
      const raw = view.note.str(key);
      if (!raw) {
        v.createSpan({ cls: "ep-placeholder", text: "-" });
        return;
      }
      // Render as an internal link (wrap bare text in [[...]]) and flag unresolved.
      view.renderLinks(v, /\[\[.+?\]\]|\]\([^)]+\)/.test(raw) ? raw : `[[${raw}]]`);
      const dest = view.app.metadataCache.getFirstLinkpathDest(linkTarget(raw), view.note.path || "");
      if (!dest) v.addClass("ep-link-unresolved");
    };
    draw();
    view.bindOpen(v, () => promptLink(view, (val) => view.note.set(file, key, val), key), false);
    view.registerUpdater(draw);
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("link.edit")).setIcon("link").onClick(() =>
        promptLink(view, (val) => view.note.set(file, key, val), key)
      )
    );
  },
};

// ---------------------------------------------------------------------------
// unit
// ---------------------------------------------------------------------------

export const unitType: ValueTypeDef = {
  id: "unit",
  name: (i18n) => i18n.t("type.unit"),
  // Absorbed by the number type (unit suffix + display factor options).
  deprecated: true,

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const unit = (entry.unit as string) || "";
    const factor = Number(entry.unitFactor) > 0 ? Number(entry.unitFactor) : 1;
    const cell = ctx.head.createDiv({ cls: "ep-val-right ep-unitval" });
    if (entry.valueColor) cell.setCssStyles({ color: entry.valueColor });
    const num = cell.createSpan({ cls: "ep-num ep-editable" });
    if (unit) cell.createSpan({ cls: "ep-unit-suffix", text: " " + unit });
    const draw = () => num.setText(fmtNum(view.note.num(key, 0) * factor));
    draw();
    // Edit in displayed units; store the canonical (base) number.
    view.bindOpen(num, () =>
      openNumberInput(num, view.note.num(key, 0) * factor, (disp) => view.note.set(file, key, disp / factor), {
        min: -1e12,
        max: 1e12,
        float: true,
        clamp: false,
        onEmpty: () => view.note.set(file, key, undefined),
      })
    );
    view.registerUpdater(draw);
  },

  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("type.unit") });
    new Setting(c).setName(t("options.unitLabel")).setDesc(t("options.unitLabelDesc")).addText((tx) =>
      tx
        .setValue((entry.unit as string) || "")
        .onChange((val) => {
          entry.unit = val.trim() || undefined;
          changed();
        })
    );
    new Setting(c).setName(t("options.unitFactor")).setDesc(t("options.unitFactorDesc")).addText((tx) =>
      tx
        .setPlaceholder("1")
        .setValue(entry.unitFactor !== undefined ? String(entry.unitFactor) : "")
        .onChange((val) => {
          const n = Number(val);
          entry.unitFactor = val.trim() === "" || !Number.isFinite(n) || n <= 0 ? undefined : n;
          changed();
        })
    );
  },
};

// ---------------------------------------------------------------------------
// datetime
// ---------------------------------------------------------------------------

/** Relative-day phrase ("today", "in 3 days", "5 days ago"). */
function relativeDays(i18n: I18n, d: Date): string {
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days === 0) return i18n.t("date.today");
  return days > 0 ? i18n.t("date.inDays", { n: days }) : i18n.t("date.daysAgo", { n: -days });
}

export const datetimeType: ValueTypeDef = {
  id: "datetime",
  name: (i18n) => i18n.t("type.datetime"),
  // Superseded by the "date" type (custom calendars, eras, time systems,
  // serial storage). Existing datetime properties keep rendering; the type
  // is no longer offered for new properties.
  deprecated: true,

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const cell = ctx.head.createDiv({ cls: "ep-val-right ep-dateval" });
    if (entry.valueColor) cell.setCssStyles({ color: entry.valueColor });
    const txt = cell.createSpan({ cls: "ep-editable" });
    const rel = cell.createSpan({ cls: "ep-date-rel" });
    const draw = () => {
      const raw = view.note.str(key);
      const d = raw ? new Date(raw) : null;
      if (!raw || !d || isNaN(d.getTime())) {
        txt.setText(raw || "-");
        txt.toggleClass("ep-placeholder", !raw);
        rel.setText("");
        return;
      }
      txt.removeClass("ep-placeholder");
      txt.setText(d.toLocaleDateString());
      rel.setText(relativeDays(view.i18n, d));
    };
    draw();
    const edit = () => {
      const cur = view.note.str(key);
      const inp = cell.createEl("input", { cls: "ep-edit-input ep-date-input" });
      inp.type = "date";
      if (/^\d{4}-\d{2}-\d{2}/.test(cur)) inp.value = cur.slice(0, 10);
      txt.hide();
      rel.hide();
      inp.focus();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        const val = inp.value;
        inp.remove();
        txt.show();
        rel.show();
        view.note.set(file, key, val || undefined);
      };
      inp.onblur = finish;
      inp.onchange = finish;
    };
    view.bindOpen(txt, edit, false);
    view.registerUpdater(draw);
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.clearValue", { key })).setIcon("eraser").onClick(() =>
        view.note.set(file, key, undefined)
      )
    );
  },
};
