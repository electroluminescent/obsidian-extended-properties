/**
 * The "skills" value type.
 *
 * The property value is a list of {@link SkillRecord}s — one per skill —
 * stored as plain objects in frontmatter, e.g.:
 *
 * ```yaml
 * Skills:
 *   - name: Acrobatics
 *     source: Dexterity   # modifying property
 *     prof: true          # adds the entry's proficiency bonus
 *   - name: Chainsaw
 *     dice: 2d6           # per-skill dice (default comes from the entry)
 *     mod: 4              # manual modifier override
 * ```
 *
 * Nothing is locked: name, modifying property, dice, modifier and
 * proficiency are all editable inline; structure and derivation rules are
 * configurable in the entry's options page. Feature modules contribute
 * ready-made record sets through the skill-preset registry (the D&D module
 * registers its saves and skill lists), so domain presets are plain data on
 * top of this one implementation.
 *
 * Row layout (matching the classic block): proficiency checkbox, name,
 * modifying-property abbreviation, dice tag, modifier, roll button — the
 * dice render in the same muted format as the abbreviation, before the
 * modifier.
 */

import { Menu, Setting, TFile } from "obsidian";
import type { EntryRef, EntryRenderCtx, OptionsCtx, ViewCtx } from "../../core/context";
import type { SkillPresetDef, SkillRecord, ValueTypeDef } from "../../core/registry";
import { ext } from "../../core/model";
import { fmtMod } from "../../utils/misc";
import { parseDice, parseDiceOrDefault } from "../../utils/dice";
import { deriveModifier, levelProfBonus, sourceAbbr, SourceMode } from "./modifiers";
import { ROLL_SERVICE, RollService } from "./roll-service";
import { addDiceSettings, openDiceMenu, renderDiceTag } from "./dice-ui";
import { openNumberInput } from "../../ui/components/inline-edit";
import { PropSuggest } from "../../ui/components/suggest";
import { TextPromptModal } from "../../ui/modals/dialogs";

/** Entry-level configuration persisted on the layout entry. */
export interface SkillsExt {
  /** How a record's source value becomes a modifier. */
  skillMode?: SourceMode;
  /** Where the proficiency bonus comes from. */
  profMode?: "none" | "level" | "fixed";
  /** Property feeding the level-based bonus (default "Level"). */
  profSource?: string;
  /** Bonus for profMode "fixed". */
  profFixed?: number;
  /** Default dice notation for records without their own. */
  dice?: string;
  /** Preset suggested by the section template that created this entry. */
  skillsPreset?: string;
}

// ---------------------------------------------------------------------------
// Records ↔ frontmatter
// ---------------------------------------------------------------------------

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

/** Serialize records, omitting unset fields so the YAML stays tidy. */
function cleanRecords(records: SkillRecord[]): Record<string, unknown>[] {
  return records.map((r) => {
    const o: Record<string, unknown> = { name: r.name };
    if (r.source) o.source = r.source;
    if (r.prof) o.prof = true;
    if (r.dice) o.dice = r.dice;
    if (r.mod !== undefined) o.mod = r.mod;
    return o;
  });
}

function readRecords(view: ViewCtx, key: string): SkillRecord[] {
  return parseRecords(view.note.raw[key]);
}

function writeRecords(view: ViewCtx, file: TFile, key: string, records: SkillRecord[]): void {
  view.note.set(file, key, cleanRecords(records));
}

// ---------------------------------------------------------------------------
// Modifier math
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Record mutation helpers (read → modify → write keeps rows stateless)
// ---------------------------------------------------------------------------

function updateRecord(ctx: EntryRenderCtx, index: number, change: (rec: SkillRecord) => void): void {
  const key = ctx.entry.key as string;
  const records = readRecords(ctx.view, key);
  if (!records[index]) return;
  change(records[index]);
  writeRecords(ctx.view, ctx.file, key, records);
}

function populateFromPreset(view: ViewCtx, file: TFile, key: string, preset: SkillPresetDef): void {
  const fresh = preset.records();
  // Legacy import: names listed in the old proficiency property become proficient.
  if (preset.legacyProfKey) {
    const legacy = view.note.list(preset.legacyProfKey).map((x) => x.toLowerCase());
    for (const r of fresh) if (legacy.includes(r.name.toLowerCase())) r.prof = true;
  }
  // Merge by name: keep existing rows, append missing preset rows.
  const existing = readRecords(view, key);
  const have = new Set(existing.map((r) => r.name.toLowerCase()));
  const merged = [...existing, ...fresh.filter((r) => !have.has(r.name.toLowerCase()))];
  writeRecords(view, file, key, merged);
}

function addBlankSkill(view: ViewCtx, file: TFile, key: string): void {
  new TextPromptModal(view.app, view.i18n, view.i18n.t("skills.newSkillPrompt"), "", (v) => {
    const name = v.trim();
    if (!name) return;
    writeRecords(view, file, key, [...readRecords(view, key), { name }]);
  }).open();
}

/** Menu listing registered presets plus "new skill". */
function openAddSkillsMenu(e: MouseEvent, view: ViewCtx, file: TFile, key: string): void {
  const menu = new Menu();
  for (const preset of view.registries.skillPresets.all()) {
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("skills.menu.addPreset", { name: preset.name(view.i18n) }))
        .setIcon("list-plus")
        .onClick(() => populateFromPreset(view, file, key, preset))
    );
  }
  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle(view.i18n.t("skills.newSkill")).setIcon("plus").onClick(() => addBlankSkill(view, file, key))
  );
  menu.showAtMouseEvent(e);
}

// ---------------------------------------------------------------------------
// Inline editors
// ---------------------------------------------------------------------------

/** Swap a span for a bare text input (no suggestions). */
function inlineText(span: HTMLElement, value: string, commit: (v: string) => void): void {
  const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
  input.type = "text";
  input.value = value;
  span.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (save: boolean) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save && input.value.trim()) commit(input.value.trim());
  };
  input.onblur = () => finish(true);
  input.onkeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Enter") { ev.preventDefault(); finish(true); }
    else if (ev.key === "Escape") { ev.preventDefault(); finish(false); }
  };
}

/** Swap a span for a property picker (for the modifying property). */
function inlineSource(ctx: EntryRenderCtx, span: HTMLElement, index: number): void {
  const view = ctx.view;
  const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
  input.type = "text";
  input.value = (readRecords(view, ctx.entry.key as string)[index]?.source as string) ?? "";
  span.replaceWith(input);
  input.focus();
  input.select();
  const choose = (key: string) => updateRecord(ctx, index, (r) => (r.source = key || undefined));
  new PropSuggest(view.app, input, view.i18n, () => view.propCandidates(true), choose);
  let done = false;
  const finish = (save: boolean) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save) choose(input.value.trim());
  };
  input.onblur = () => setTimeout(() => finish(true), 120);
  input.onkeydown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") { ev.preventDefault(); finish(false); }
    else if (ev.key === "Enter") { ev.preventDefault(); finish(true); }
  };
}

// ---------------------------------------------------------------------------
// Row rendering
// ---------------------------------------------------------------------------

function renderRow(ctx: EntryRenderCtx, list: HTMLElement, records: SkillRecord[], index: number): void {
  const view = ctx.view;
  const t = view.i18n.t.bind(view.i18n);
  const e = ext<SkillsExt>(ctx.entry);
  const rec = records[index];
  const row = list.createDiv({ cls: "ep-line" });

  // Proficiency checkbox.
  const cb = row.createEl("input");
  cb.type = "checkbox";
  cb.addClass("ep-prof");
  cb.checked = !!rec.prof;
  if (view.editMode) {
    cb.setAttr("title", t("skills.proficientHint"));
    cb.onchange = () => updateRecord(ctx, index, (r) => (r.prof = cb.checked || undefined));
  } else {
    cb.setAttr("title", t("hint.dblToggle"));
    cb.onclick = (ev) => ev.preventDefault();
    cb.ondblclick = () => updateRecord(ctx, index, (r) => (r.prof = !r.prof || undefined));
  }

  // Name (editable).
  const nameSpan = row.createSpan({ cls: "ep-line-name", text: rec.name });
  view.bindOpen(nameSpan, () =>
    inlineText(nameSpan, rec.name, (v) => updateRecord(ctx, index, (r) => (r.name = v)))
  );

  // Modifying property (abbreviation, editable).
  const abbrSpan = row.createSpan({
    cls: "ep-line-abbr",
    text: rec.source ? sourceAbbr(rec.source) : "—",
  });
  abbrSpan.setAttr("aria-label", rec.source || t("skills.menu.setSource"));
  view.bindOpen(abbrSpan, () => inlineSource(ctx, abbrSpan, index));

  // Dice tag — same muted format, before the modifier.
  const diceNotation = rec.dice ?? e.dice;
  const diceTag = renderDiceTag(row, diceNotation);
  if (diceTag) {
    view.bindOpen(diceTag, () => {
      const r2 = diceTag.getBoundingClientRect();
      const fakeEvent = new MouseEvent("click", { clientX: r2.left, clientY: r2.bottom });
      openDiceMenu(fakeEvent, view.app, view.i18n, {
        get: () => readRecords(view, ctx.entry.key as string)[index]?.dice ?? e.dice,
        set: (n) => updateRecord(ctx, index, (r) => (r.dice = n)),
      });
    });
  }

  // Modifier (editable — writes an override so the shown value sticks).
  const modSpan = row.createSpan({ cls: "ep-line-mod", text: fmtMod(effectiveMod(view, e, rec)) });
  view.bindOpen(modSpan, () =>
    openNumberInput(modSpan, effectiveMod(view, e, rec), (v) => {
      const prof = rec.prof ? profBonus(view, e) : 0;
      updateRecord(ctx, index, (r) => (r.mod = v - prof));
    }, { min: -999, max: 999, float: false, clamp: false })
  );

  // Roll button: record dice (or entry default) + effective modifier.
  const rb = row.createEl("button", { cls: "ep-roll-btn", text: t("roll.roll") });
  rb.onclick = () =>
    view.hub
      .get(ROLL_SERVICE, () => new RollService(view.i18n))
      .roll(rec.name, effectiveMod(view, e, rec), parseDiceOrDefault(rec.dice ?? e.dice));

  // Row menu: source, dice, override, order, removal.
  row.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const menu = new Menu();
    menu.addItem((i) =>
      i.setTitle(t("skills.menu.setSource")).setIcon("link").onClick(() => inlineSource(ctx, abbrSpan, index))
    );
    menu.addItem((i) =>
      i.setTitle(t("skills.menu.setDice")).setIcon("dice").onClick(() =>
        openDiceMenu(ev, view.app, view.i18n, {
          get: () => readRecords(view, ctx.entry.key as string)[index]?.dice ?? e.dice,
          set: (n) => updateRecord(ctx, index, (r) => (r.dice = n)),
        })
      )
    );
    if (rec.mod !== undefined)
      menu.addItem((i) =>
        i.setTitle(t("skills.menu.clearOverride")).setIcon("eraser").onClick(() =>
          updateRecord(ctx, index, (r) => (r.mod = undefined))
        )
      );
    menu.addSeparator();
    const move = (delta: number) => {
      const key = ctx.entry.key as string;
      const rs = readRecords(view, key);
      const j = index + delta;
      if (j < 0 || j >= rs.length) return;
      [rs[index], rs[j]] = [rs[j], rs[index]];
      writeRecords(view, ctx.file, key, rs);
    };
    menu.addItem((i) => i.setTitle(t("skills.menu.moveUp")).setIcon("arrow-up").onClick(() => move(-1)));
    menu.addItem((i) => i.setTitle(t("skills.menu.moveDown")).setIcon("arrow-down").onClick(() => move(1)));
    menu.addItem((i) =>
      i.setTitle(t("skills.menu.remove")).setIcon("trash").onClick(() => {
        const key = ctx.entry.key as string;
        const rs = readRecords(view, key);
        rs.splice(index, 1);
        writeRecords(view, ctx.file, key, rs);
      })
    );
    menu.showAtMouseEvent(ev);
  });
}

// ---------------------------------------------------------------------------
// The value type
// ---------------------------------------------------------------------------

export const skillsType: ValueTypeDef = {
  id: "skills",
  wide: true,
  name: (i18n) => i18n.t("type.skills"),

  render(ctx) {
    const { view, entry } = ctx;
    const key = entry.key as string;
    // The label is rendered by the prop kind; this type fills `extra` only.
    const holder = ctx.extra.createDiv({ cls: "ep-block-list" });
    const build = () => {
      holder.empty();
      const records = readRecords(view, key);
      if (!records.length) {
        const empty = holder.createDiv({ cls: "ep-empty-sub", text: view.i18n.t("skills.empty") });
        const btn = empty.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("skills.addMenu") });
        btn.onclick = (ev) => openAddSkillsMenu(ev, view, ctx.file, key);
        return;
      }
      for (let i = 0; i < records.length; i++) renderRow(ctx, holder, records, i);
      if (view.editMode) {
        const add = holder.createEl("button", { cls: "ep-mini-btn ep-list-addbtn", text: view.i18n.t("skills.addSkill") });
        add.onclick = (ev) => openAddSkillsMenu(ev, view, ctx.file, key);
      }
    };
    build();
    view.registerUpdater(build);
  },

  menuItems(menu, ref: EntryRef) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("skills.newSkill")).setIcon("plus").onClick(() => addBlankSkill(view, file, key))
    );
    for (const preset of view.registries.skillPresets.all()) {
      menu.addItem((i) =>
        i.setTitle(view.i18n.t("skills.menu.addPreset", { name: preset.name(view.i18n) }))
          .setIcon("list-plus")
          .onClick(() => populateFromPreset(view, file, key, preset))
      );
    }
  },

  renderOptions(octx: OptionsCtx) {
    const { view, entry, container: c, changed, redraw } = octx;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext<SkillsExt>(entry);
    c.createEl("h4", { text: t("skills.options.heading") });
    c.createEl("p", { cls: "setting-item-description", text: t("skills.options.editHint") });

    new Setting(c).setName(t("skills.options.sourceMode")).addDropdown((d) => {
      d.addOption("value", t("skills.options.modeValue"));
      d.addOption("abilityMod", t("skills.options.modeAbilityMod"));
      d.setValue(e.skillMode ?? "value");
      d.onChange((v) => {
        e.skillMode = v as SourceMode;
        changed();
      });
    });

    new Setting(c).setName(t("skills.options.profMode")).addDropdown((d) => {
      d.addOption("none", t("skills.options.profNone"));
      d.addOption("level", t("skills.options.profLevel"));
      d.addOption("fixed", t("skills.options.profFixed"));
      d.setValue(e.profMode ?? "none");
      d.onChange((v) => {
        e.profMode = v === "none" ? undefined : (v as "level" | "fixed");
        changed();
        redraw();
      });
    });
    if (e.profMode === "level") {
      new Setting(c).setName(t("skills.options.profSource")).addText((tx) => {
        tx.setPlaceholder("Level")
          .setValue(e.profSource ?? "")
          .onChange((v) => {
            e.profSource = v.trim() || undefined;
            changed();
          });
      });
    }
    if (e.profMode === "fixed") {
      new Setting(c).setName(t("skills.options.profFixedValue")).addText((tx) => {
        tx.setValue(e.profFixed !== undefined ? String(e.profFixed) : "").onChange((v) => {
          const n = Number(v);
          e.profFixed = v.trim() === "" || !Number.isFinite(n) ? undefined : n;
          changed();
        });
      });
    }

    addDiceSettings(c, view.i18n, {
      get: () => e.dice,
      set: (n) => {
        e.dice = n;
        changed();
      },
    });

    const presets = view.registries.skillPresets.all();
    if (presets.length) {
      c.createEl("h4", { text: t("skills.options.presets") });
      for (const preset of presets) {
        new Setting(c).setName(preset.name(view.i18n)).addButton((b) =>
          b.setButtonText(t("skills.options.addPreset")).onClick(() => {
            populateFromPreset(view, octx.file, entry.key as string, preset);
            changed();
          })
        );
      }
    }
  },
};
