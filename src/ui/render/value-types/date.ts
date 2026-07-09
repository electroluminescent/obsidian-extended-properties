/**
 * The "date" value type: dates under a per-property, vault-shared
 * configuration - display format (MM/DD/YYYY-style tokens), an optional
 * custom calendar (months per year, days per month/week, month names)
 * and an era suffix pool. The era for a specific note is picked from the
 * pool via the era chip (typing a new suffix grows the pool), and an
 * optional timeline plot marks where OTHER notes' values for the same
 * property fall, with min/max configurable or taken from the vault's
 * extremes - the date analog of the number slider.
 *
 * STORAGE: notes hold a calendar-independent integer (see encodeSerial in
 * core/calendar.ts). Entered text is translated text -> parts -> integer
 * through the property's format/system/era pool, and displayed integer ->
 * parts -> formatted text. Because the integer is the ground truth and
 * the config only the lens, changing the system or era pool re-encodes
 * every note's integer (translateSerial) so each date keeps its
 * interpreted value - or the closest one the new system can represent.
 * Legacy text values still parse and are converted on their next edit or
 * config migration.
 */

import { Menu, Notice, Setting } from "obsidian";
import type { EntryRenderCtx, EntryRef, OptionsCtx, ViewCtx } from "../../../core/context";
import type { ValueTypeDef } from "../../../core/registry";
import { ext } from "../../../core/model";
import {
  DateConfig, DateParts, DEFAULT_DATE_FORMAT, decodeSerial, encodeSerial, formatDate, monthName, parseDate,
  systemOf, translateSerial,
} from "../../../core/calendar";
import { TextPromptModal } from "../../modals/dialogs";

/** Entry-level fields (per sidebar entry, not shared). */
interface DateExt {
  slider?: boolean;
  dateMin?: string;
  dateMax?: string;
}

/** The property's shared config (create-on-write). */
function cfgFor(view: ViewCtx, key: string): DateConfig {
  const store = (view.settings.dateProps ??= {});
  return (store[key.toLowerCase()] ??= { format: DEFAULT_DATE_FORMAT });
}

/** Persist a shared-config mutation. */
function saveCfg(view: ViewCtx, mutate: () => void): void {
  mutate();
  view.saveLayout();
}

/** A deep copy of the config, for before/after migration snapshots. */
const snapshotCfg = (cfg: DateConfig): DateConfig => JSON.parse(JSON.stringify(cfg)) as DateConfig;

/**
 * Interpret a stored frontmatter value: integers decode through the config;
 * strings (legacy or hand-typed in Obsidian's panel) parse via the format.
 */
function rawToParts(raw: unknown, cfg: DateConfig): DateParts | null {
  if (typeof raw === "number") return decodeSerial(raw, cfg);
  if (typeof raw === "string" && raw.trim()) return parseDate(raw.trim(), cfg);
  return null;
}

/** Serial of a stored value (numbers as-is via re-encode, text via parse). */
function rawSerial(raw: unknown, cfg: DateConfig): number | null {
  const p = rawToParts(raw, cfg);
  return p ? encodeSerial(p, cfg) : null;
}

/**
 * Rewrite every note's stored value for `key` so it keeps its interpreted
 * date under the new config: integers translate old-lens -> new-lens,
 * legacy text parses under the OLD config and becomes an integer.
 */
async function migrateDateSerials(view: ViewCtx, key: string, before: DateConfig, after: DateConfig): Promise<void> {
  let changed = 0;
  for (const f of view.props.filesWithKey(key)) {
    try {
      await view.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        const realKey = Object.keys(fm).find((k) => k.toLowerCase() === key.toLowerCase());
        if (!realKey) return;
        const cur = fm[realKey];
        let next: number | null = null;
        if (typeof cur === "number") next = translateSerial(cur, before, after);
        else if (typeof cur === "string" && cur.trim()) {
          const p = parseDate(cur.trim(), before);
          if (p) next = translateSerial(encodeSerial(p, before), before, after);
        }
        if (next !== null && next !== cur) {
          fm[realKey] = next;
          changed++;
        }
      });
    } catch {
      /* unreadable file: leave it untouched */
    }
  }
  if (changed) new Notice(view.i18n.t("date.migrated", { count: String(changed) }));
}

/** Serial bounds for the plot: explicit strings win, else vault extremes. */
function plotRange(view: ViewCtx, key: string, cfg: DateConfig, e: Partial<DateExt>): { min: number; max: number } | null {
  const fromStr = (s?: string): number | null => {
    const p = s ? parseDate(s, cfg) : null;
    return p ? encodeSerial(p, cfg) : null;
  };
  let min = fromStr(e.dateMin);
  let max = fromStr(e.dateMax);
  if (min === null || max === null) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of view.props.rawValuesFor(key)) {
      const s = rawSerial(v, cfg);
      if (s === null) continue;
      if (s < lo) lo = s;
      if (s > hi) hi = s;
    }
    if (lo <= hi) {
      min ??= lo;
      max ??= hi;
    }
  }
  return min !== null && max !== null && max > min ? { min, max } : null;
}

function render(ctx: EntryRenderCtx): void {
  const { view, file, entry } = ctx;
  const key = entry.key as string;
  const e = ext<DateExt>(entry);
  const cfg = cfgFor(view, key);
  const t = view.i18n.t.bind(view.i18n);

  const cell = ctx.head.createDiv({ cls: "ep-val-right ep-dateval" });
  if (entry.valueColor) cell.setCssStyles({ color: entry.valueColor });
  if (entry.valueSize) cell.setCssStyles({ fontSize: entry.valueSize + "px" });
  const txt = cell.createSpan({ cls: "ep-editable" });
  const eraChip = cell.createSpan({ cls: "ep-era-chip" });

  const hasEraToken = /(^|[^A-Za-z])E([^A-Za-z]|$)/.test(" " + cfg.format + " ");
  const parsed = (): DateParts | null => rawToParts(view.note.raw[key], cfg);

  const draw = (): void => {
    const raw = view.note.raw[key];
    const empty = raw === undefined || raw === null || raw === "";
    const p = empty ? null : rawToParts(raw, cfg);
    txt.setText(empty ? cfg.format : p ? formatDate(p, cfg) : String(raw));
    txt.toggleClass("ep-placeholder", empty);
    txt.toggleClass("ep-invalid", !empty && !p);
    txt.setAttr("title", !empty && !p ? t("date.invalid", { format: cfg.format }) : "");
    // Era chip: only meaningful when the format shows eras.
    const era = p?.era ?? "";
    const pool = cfg.eras ?? [];
    eraChip.setText(era || (pool.length ? pool[pool.length - 1] + "?" : ""));
    eraChip.toggleClass("ep-era-unset", !era);
    const show = hasEraToken && !!p && (pool.length > 0 || !!era);
    eraChip.toggleClass("ep-hidden", !show);
  };

  // Era chip: pick from the pool per note; "custom" grows the pool. The
  // stored integer is re-encoded with the new era.
  eraChip.onclick = (ev) => {
    const p = parsed();
    if (!p) return;
    const menu = new Menu();
    const setEra = (era?: string): void => {
      view.note.set(file, key, encodeSerial({ ...p, era }, cfg));
    };
    for (const era of cfg.eras ?? []) {
      menu.addItem((i) =>
        i.setTitle(era)
          .setChecked(!!p.era && era.toLowerCase() === p.era.toLowerCase())
          .onClick(() => setEra(era))
      );
    }
    if (p.era) menu.addItem((i) => i.setTitle(t("date.eraNone")).onClick(() => setEra(undefined)));
    menu.addItem((i) =>
      i.setTitle(t("date.eraCustom")).onClick(() => {
        new TextPromptModal(view.app, view.i18n, t("date.eraCustomPrompt"), "", (v) => {
          const era = v.trim();
          if (!era) return;
          const pool = (cfg.eras ??= []);
          if (!pool.some((x) => x.toLowerCase() === era.toLowerCase()))
            saveCfg(view, () => pool.push(era));
          setEra(era);
        }).open();
      })
    );
    menu.showAtMouseEvent(ev);
  };

  // Click-to-edit: free text against the format. What the user types is
  // translated text -> parts -> INTEGER (stored) -> formatted text (shown).
  txt.onclick = () => {
    if (cell.querySelector("input")) return;
    const inp = cell.createEl("input", { cls: "ep-edit-input ep-date-input" });
    inp.type = "text";
    inp.placeholder = cfg.format;
    const p0 = parsed();
    inp.value = p0 ? formatDate(p0, cfg) : String(view.note.raw[key] ?? "");
    txt.hide();
    eraChip.hide();
    inp.focus();
    inp.select();
    let done = false;
    const finish = (commit: boolean): void => {
      if (done) return;
      done = true;
      const v = inp.value.trim();
      inp.remove();
      txt.show();
      draw();
      if (!commit) return;
      if (!v) {
        view.note.set(file, key, undefined);
        return;
      }
      const p = parseDate(v, cfg);
      if (p?.era) {
        const pool = (cfg.eras ??= []);
        if (!pool.some((x) => x.toLowerCase() === p.era!.toLowerCase()))
          saveCfg(view, () => pool.push(p.era!)); // typed a new era: pool grows
      }
      // Parsed dates store as the calendar-independent integer; text that
      // doesn't fit the format is kept verbatim and marked invalid.
      view.note.set(file, key, p ? encodeSerial(p, cfg) : v);
    };
    inp.onblur = () => finish(true);
    inp.onkeydown = (ke) => {
      if (ke.key === "Enter") finish(true);
      else if (ke.key === "Escape") finish(false);
    };
  };

  // Timeline plot: other notes' values as ticks, this note as the marker.
  let syncPlot: (() => void) | null = null;
  if (e.slider) {
    const plot = ctx.extra.createDiv({ cls: "ep-dateplot" });
    plot.createDiv({ cls: "ep-dateplot-track" });
    const marker = plot.createDiv({ cls: "ep-dateplot-marker" });
    const ticksEl = plot.createDiv({ cls: "ep-dateplot-ticks" });
    syncPlot = () => {
      ticksEl.empty();
      const range = plotRange(view, key, cfg, e);
      plot.toggleClass("ep-hidden", !range);
      if (!range) return;
      const span = range.max - range.min;
      const pct = (s: number): number => Math.max(0, Math.min(1, (s - range.min) / span)) * 100;
      const own = String(view.note.raw[key] ?? "");
      for (const v of view.props.rawValuesFor(key)) {
        if (String(v) === own) continue; // other notes only; own value is the marker
        const p = rawToParts(v, cfg);
        if (!p) continue;
        const tick = ticksEl.createDiv({ cls: "ep-dateplot-tick" });
        tick.setCssStyles({ left: pct(encodeSerial(p, cfg)) + "%" });
        tick.setAttr("title", formatDate(p, cfg));
      }
      const p = parsed();
      marker.toggleClass("ep-hidden", !p);
      if (p) {
        marker.setCssStyles({ left: pct(encodeSerial(p, cfg)) + "%" });
        marker.setAttr("title", formatDate(p, cfg));
      }
    };
    syncPlot();
  }

  draw();
  view.registerUpdater(() => {
    draw();
    syncPlot?.();
  });
}

function renderOptions(octx: OptionsCtx): void {
  const { view, entry, container: c, changed } = octx;
  const key = entry.key as string;
  const e = ext<DateExt>(entry);
  const cfg = cfgFor(view, key);
  const t = view.i18n.t.bind(view.i18n);

  c.createEl("h4", { text: t("options.dateHeading") });
  new Setting(c)
    .setName(t("options.dateFormat"))
    .setDesc(t("options.dateFormatDesc"))
    .addText((tx) => {
      tx.setValue(cfg.format).onChange((v) => {
        saveCfg(view, () => (cfg.format = v.trim() || DEFAULT_DATE_FORMAT));
        changed();
      });
    });

  new Setting(c).setName(t("options.datePlot")).setDesc(t("options.datePlotDesc")).addToggle((tg) => {
    tg.setValue(!!e.slider).onChange((v) => {
      e.slider = v || undefined;
      changed();
    });
  });
  new Setting(c)
    .setName(t("options.minimum"))
    .setDesc(t("options.dateRangeAuto"))
    .addText((tx) => {
      tx.setPlaceholder(cfg.format);
      tx.setValue(e.dateMin ?? "").onChange((v) => {
        e.dateMin = v.trim() || undefined;
        changed();
      });
    });
  new Setting(c)
    .setName(t("options.maximum"))
    .setDesc(t("options.dateRangeAuto"))
    .addText((tx) => {
      tx.setPlaceholder(cfg.format);
      tx.setValue(e.dateMax ?? "").onChange((v) => {
        e.dateMax = v.trim() || undefined;
        changed();
      });
    });

  // -- custom calendar (shared per property) --------------------------------
  // System changes re-encode every note's stored integer (migrateDateSerials)
  // so each date keeps its interpreted value under the new lens.
  new Setting(c)
    .setName(t("options.customCalendar"))
    .setDesc(t("options.customCalendarDesc"))
    .addToggle((tg) => {
      tg.setValue(!!cfg.system).onChange((v) => {
        const before = snapshotCfg(cfg);
        saveCfg(view, () => {
          cfg.system = v
            ? { months: 12, daysPerMonth: 30, daysPerWeek: 7, monthNames: [] }
            : undefined;
        });
        void migrateDateSerials(view, key, before, cfg);
        changed();
        octx.redraw();
      });
    });
  if (cfg.system) {
    const sys = cfg.system;
    let renderMonthNames = (): void => undefined;
    // Number fields commit on change (blur/Enter), NOT per keystroke: a
    // half-typed "1" of "13" must never trigger a destructive re-encode.
    const numRow = (name: string, get: () => number, set: (n: number) => void, o: { redraw?: boolean; migrates?: boolean }): void => {
      new Setting(c).setName(name).addText((tx) => {
        tx.inputEl.type = "number";
        tx.setValue(String(get()));
        tx.inputEl.addEventListener("change", () => {
          const n = Math.max(1, Math.floor(Number(tx.getValue())));
          if (!Number.isFinite(n) || n === get()) return;
          const before = snapshotCfg(cfg);
          saveCfg(view, () => set(n));
          if (o.migrates) void migrateDateSerials(view, key, before, cfg);
          changed();
          if (o.redraw) renderMonthNames();
        });
      });
    };
    numRow(t("options.months"), () => sys.months, (n) => (sys.months = n), { redraw: true, migrates: true });
    numRow(t("options.daysPerMonth"), () => sys.daysPerMonth, (n) => (sys.daysPerMonth = n), { migrates: true });
    numRow(t("options.daysPerWeek"), () => sys.daysPerWeek, (n) => (sys.daysPerWeek = n), {});
    const box = c.createDiv({ cls: "ep-monthnames" });
    renderMonthNames = (): void => {
      box.empty();
      // One name field per month the user defined.
      for (let m = 1; m <= Math.min(sys.months, 60); m++) {
        const idx = m - 1;
        new Setting(box).setName(t("options.monthName", { n: String(m) })).addText((tx) => {
          tx.setPlaceholder(monthName(systemOf(cfg), m));
          tx.setValue(sys.monthNames[idx] ?? "").onChange((v) => {
            saveCfg(view, () => {
              while (sys.monthNames.length < m) sys.monthNames.push("");
              sys.monthNames[idx] = v.trim();
            });
            changed();
          });
        });
      }
    };
    renderMonthNames();
  }

  // -- era pool (shared per property) ----------------------------------------
  // Removing an era shifts the indexes encoded in stored integers, so it
  // migrates too; appending never disturbs existing values.
  new Setting(c).setName(t("options.eraPool")).setDesc(t("options.eraPoolDesc")).setHeading();
  const eraBox = c.createDiv({ cls: "ep-erapool" });
  const renderEras = (): void => {
    eraBox.empty();
    for (const era of cfg.eras ?? []) {
      new Setting(eraBox).setName(era).addExtraButton((b) => {
        b.setIcon("x")
          .setTooltip(t("options.eraRemove"))
          .onClick(() => {
            const before = snapshotCfg(cfg);
            saveCfg(view, () => (cfg.eras = (cfg.eras ?? []).filter((x) => x !== era)));
            void migrateDateSerials(view, key, before, cfg);
            changed();
            renderEras();
          });
      });
    }
    new Setting(eraBox).setName(t("options.eraAdd")).addText((tx) => {
      tx.setPlaceholder("CE");
      tx.inputEl.onkeydown = (ke) => {
        if (ke.key !== "Enter") return;
        const v = tx.getValue().trim();
        if (!v) return;
        const pool = (cfg.eras ??= []);
        if (!pool.some((x) => x.toLowerCase() === v.toLowerCase())) {
          saveCfg(view, () => pool.push(v));
          changed();
        }
        renderEras();
      };
    });
  };
  renderEras();
}

function menuItems(menu: Menu, ref: EntryRef): void {
  const { view, file, entry } = ref;
  const key = entry.key as string;
  const cfg = cfgFor(view, key);
  menu.addItem((i) =>
    i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(() => {
      const p0 = rawToParts(view.note.raw[key], cfg);
      new TextPromptModal(
        view.app,
        view.i18n,
        view.i18n.t("prompt.editValue", { name: (entry.alias as string) || key }),
        p0 ? formatDate(p0, cfg) : view.note.str(key),
        (v) => {
          const p = parseDate(v.trim(), cfg);
          view.note.set(file, key, p ? encodeSerial(p, cfg) : v.trim() || undefined);
        }
      ).open();
    })
  );
}

export const dateType: ValueTypeDef = {
  id: "date",
  name: (i18n) => i18n.t("type.date"),
  render,
  renderOptions,
  menuItems,
};
