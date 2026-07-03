/**
 * The removed "skills" value type - read-only fallback.
 *
 * Record-based skill lists were deprecated in v2.x and fully removed in
 * v4.0.0. Existing properties still render (read-only) so no data is ever
 * lost, and the one-click conversion to derived number properties stays
 * available from the entry menu, the options modal and the fallback itself.
 * New layouts use sections of derived number properties instead (that is
 * what the section templates create).
 */

import { Notice, Setting } from "obsidian";
import type { EntryRef, ViewCtx } from "../../core/context";
import type { ValueTypeDef } from "../../core/registry";
import type { Entry } from "../../core/model";
import { ext } from "../../core/model";
import { abbrFor, Influence } from "../../core/influences";
import { ensurePropEntries } from "../../core/layout-ops";
import { fmtMod, genId } from "../../utils/misc";
import { parseDice } from "../../utils/dice";
import { deriveModifier, levelProfBonus, SourceMode } from "./modifiers";
import { ConfirmModal } from "../../ui/modals/dialogs";

/** One row of a legacy record-based skills property (frozen shape). */
export interface SkillRecord {
  name: string;
  source?: string;
  prof?: boolean;
  dice?: string;
  mod?: number;
}

/** Entry-level configuration persisted on old layout entries (frozen shape). */
export interface SkillsExt {
  skillMode?: SourceMode;
  profMode?: "none" | "level" | "fixed";
  profSource?: string;
  profFixed?: number;
  dice?: string;
}

/** Tolerantly read records from a frontmatter value (strings become names). */
export function parseRecords(value: unknown): SkillRecord[] {
  if (!Array.isArray(value)) return [];
  const out: SkillRecord[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ name: item.trim() });
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const rec: SkillRecord = { name: String(o.name ?? "").trim() || "?" };
      if (o.source !== undefined && o.source !== null && o.source !== "") rec.source = String(o.source);
      if (o.prof === true || String(o.prof).toLowerCase() === "true") rec.prof = true;
      if (o.dice !== undefined && parseDice(String(o.dice))) rec.dice = String(o.dice);
      const m = Number(o.mod);
      if (o.mod !== undefined && o.mod !== null && o.mod !== "" && Number.isFinite(m)) rec.mod = m;
      out.push(rec);
    }
  }
  return out;
}

function readRecords(view: ViewCtx, key: string): SkillRecord[] {
  return parseRecords(view.note.raw[key]);
}

function profBonus(view: ViewCtx, e: SkillsExt): number {
  if (e.profMode === "fixed") return e.profFixed ?? 0;
  if (e.profMode === "level") return levelProfBonus(view.note.num(e.profSource || "Level", 1));
  return 0;
}

/** Displayed modifier: override or derived source value, plus proficiency. */
function effectiveMod(view: ViewCtx, e: SkillsExt, rec: SkillRecord): number {
  const base =
    rec.mod !== undefined
      ? rec.mod
      : rec.source
        ? deriveModifier(e.skillMode, view.note.num(rec.source, 0))
        : 0;
  return base + (rec.prof ? profBonus(view, e) : 0);
}

/** Whether `key` is already used by another prop entry of the layout. */
function keyTaken(view: ViewCtx, key: string, except: Entry): boolean {
  const kl = key.toLowerCase();
  for (const s of view.layout.sections)
    for (const en of s.entries)
      if (en !== except && en.kind === "prop" && en.key && en.key.toLowerCase() === kl) return true;
  return false;
}

/**
 * Replace this records-list entry with one derived number property per
 * record. Proficiency becomes a togglable influence on a real property
 * ("Proficiency Bonus" by default); the proficient record names are written
 * to the toggle list property so nothing is lost.
 */
export function convertToProperties(ref: EntryRef): void {
  const { view, file, section, entry } = ref;
  const t = view.i18n.t.bind(view.i18n);
  const e = ext<SkillsExt>(entry);
  const key = entry.key as string;

  const records = readRecords(view, key);
  if (!records.length) {
    new Notice(t("skills.convertEmpty"));
    return;
  }

  // -- proficiency as a property + toggle list -----------------------------
  const useProf = e.profMode === "level" || e.profMode === "fixed";
  const profKey = t("skills.convertProfProperty");
  const profListKey = t("skills.convertProfList", { name: (entry.alias as string) || key });
  let profInf: Influence | null = null;
  if (useProf) {
    profInf = { source: profKey, toggle: profListKey };
    if (!keyTaken(view, profKey, entry)) {
      if (e.profMode === "level") {
        const levelKey = e.profSource || "Level";
        section.entries.unshift({
          id: genId(),
          kind: "prop",
          key: profKey,
          dataType: "derived",
          hideIfEmpty: false,
          mods: [{ source: levelKey, mode: "profBonus" }],
        } as Entry);
        ensurePropEntries(view.layout, section, [levelKey]);
      } else {
        ensurePropEntries(view.layout, section, [profKey]);
        view.note.set(file, profKey, e.profFixed ?? 0);
      }
    }
    // Preserve which records are proficient.
    const have = view.note.list(profListKey);
    const haveL = have.map((x) => x.toLowerCase());
    const add = records.filter((r) => r.prof && !haveL.includes(r.name.toLowerCase())).map((r) => r.name);
    if (add.length) view.note.set(file, profListKey, [...have, ...add]);
  }

  // -- one derived entry per record -----------------------------------------
  const fresh: Entry[] = records.map((rec) => {
    let k = rec.name;
    if ((rec.source && k.toLowerCase() === rec.source.toLowerCase()) || keyTaken(view, k, entry))
      k = t("skills.convertKeySuffix", { name: rec.name });
    const mods: Influence[] = [];
    if (rec.source)
      mods.push({ source: rec.source, mode: e.skillMode === "abilityMod" ? "abilityMod" : undefined });
    if (profInf) mods.push({ ...profInf });
    const en = {
      id: genId(),
      kind: "prop",
      key: k,
      dataType: "derived",
      hideIfEmpty: false,
      roll: true,
      mods,
    } as Entry;
    if (k !== rec.name) en.alias = rec.name;
    if (rec.dice ?? e.dice) en.dice = rec.dice ?? e.dice;
    if (rec.mod !== undefined) en.rollOverride = rec.mod + (rec.prof ? profBonus(view, e) : 0);
    return en;
  });

  const idx = section.entries.findIndex((x) => x.id === entry.id);
  section.entries.splice(idx < 0 ? section.entries.length : idx, 1, ...fresh);
  ensurePropEntries(view.layout, section, [...new Set(records.map((r) => r.source).filter((x): x is string => !!x))]);
  view.saveLayout();
  view.rerender();
  new Notice(t("skills.convertDone", { n: fresh.length }));
}

function confirmConvert(ref: EntryRef): void {
  new ConfirmModal(ref.view.app, ref.view.i18n, ref.view.i18n.t("skills.convertConfirm"), () =>
    convertToProperties(ref)
  ).open();
}

/** Read-only fallback: shows stored records and offers the conversion. */
export const skillsType: ValueTypeDef = {
  id: "skills",
  wide: true,
  deprecated: true, // hidden from type dropdowns; renders legacy data only
  name: (i18n) => i18n.t("type.skills"),

  render(ctx) {
    const { view, entry } = ctx;
    const key = entry.key as string;
    const e = ext<SkillsExt>(entry);
    const holder = ctx.extra.createDiv({ cls: "ep-block-list" });
    const build = () => {
      holder.empty();
      holder.createDiv({ cls: "ep-skills-deprecated", text: view.i18n.t("skills.removed") });
      const records = readRecords(view, key);
      if (!records.length) {
        holder.createDiv({ cls: "ep-empty-sub", text: view.i18n.t("skills.empty") });
      } else {
        for (const rec of records) {
          const row = holder.createDiv({ cls: "ep-line" });
          row.createSpan({ cls: "ep-line-name", text: (rec.prof ? "* " : "") + rec.name });
          if (rec.source) row.createSpan({ cls: "ep-line-abbr", text: abbrFor(view.settings, rec.source) });
          row.createSpan({ cls: "ep-line-mod", text: fmtMod(effectiveMod(view, e, rec)) });
        }
      }
      const btn = holder.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("skills.convertBtn") });
      btn.onclick = () => confirmConvert({ view, file: ctx.file, section: ctx.section, entry: ctx.entry });
    };
    build();
    view.registerUpdater(build);
  },

  menuItems(menu, ref: EntryRef) {
    menu.addItem((i) =>
      i.setTitle(ref.view.i18n.t("skills.convert")).setIcon("wand").onClick(() => confirmConvert(ref))
    );
  },

  renderOptions(octx) {
    const { view, container: c } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("skills.options.heading") });
    c.createDiv({ cls: "ep-skills-deprecated", text: t("skills.removed") });
    new Setting(c)
      .setName(t("skills.convert"))
      .setDesc(t("skills.convertDesc"))
      .addButton((b) => b.setButtonText(t("skills.convertBtn")).onClick(() => confirmConvert(octx)));
  },
};
