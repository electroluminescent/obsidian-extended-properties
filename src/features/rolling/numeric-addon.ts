/**
 * Cluster addon attaching a roll button to numeric property entries
 * (including "derived" values). The rolled modifier is the entry's
 * influence sum from the core modifier system (`core/influences.ts`);
 * this addon only contributes the dice.
 *
 * Persisted entry fields (accessed via `ext<RollExt>`):
 *   roll   true = show the roll button (legacy "value"/"abilityMod"
 *          strings are migrated to influences in `index.ts`)
 *   dice   dice notation ("2d6"); unset = a single d20
 */

import { Notice, Setting } from "obsidian";
import type { EntryRef, EntryRenderCtx, OptionsCtx } from "../../core/context";
import type { ClusterAddon, ClusterNeeds, NumericAccess } from "../../core/registry";
import { ext, type RollSeg } from "../../core/model";
import { genId } from "../../utils/misc";
import { makeNoteAwareResolver } from "../../core/note-ref";
import { runRoll, segsToText, textToSegs } from "./macros";
import { assignMenu, putResult } from "./into";
import { ConfirmModal } from "../../ui/modals/dialogs";
import {
  abbrFor, hasNoteOverride, influenceActive, influenceTerm, modifierTotal, ModExt,
} from "../../core/influences";
import { MODIFIABLE_TYPE_IDS } from "../../ui/render/modifier-addon";
import { parseDiceOrDefault } from "../../utils/dice";
import { ROLL_SERVICE, RollMode, RollPart, RollService } from "./roll-service";
import { addDiceSettings, openRollMenu } from "./dice-ui";
import { longPressContextMenu } from "../../ui/components/long-press";

/** Entry fields persisted by this addon. */
export interface RollExt {
  roll?: boolean | string;
  dice?: string;
  /**
   * The macro whose roll fills this property when SET is pressed.
   *
   * A roll button asks a question of a value; SET decides what the value is.
   * Naming a macro rather than an expression is what makes a sheet of them
   * worth having: four attributes pointed at one `3d6dhdl + 8`, and changing
   * the macro changes all four.
   */
  setMacro?: string;
  /**
   * An expression of this property's OWN, standing in for that macro's.
   *
   * For the property whose roll is nearly the shared one but not quite. The
   * macro is still named - it is what the button says, and what it goes back
   * to if this is cleared.
   */
  setSegs?: RollSeg[];
  /**
   * Keep the SET button out of the row.
   *
   * Rolling a sheet up is done once; a button for it standing beside every
   * attribute afterwards is clutter. Hidden, the roll is still one press away
   * in the property's own settings.
   */
  setHide?: boolean;
}

/** Whether a macro has been named for this property at all. */
function hasSet(e: RollExt): boolean {
  return !!e.setMacro || !!e.setSegs?.length;
}

/**
 * Whether the button belongs in the row.
 *
 * Configured and shown are different questions: rolling a sheet up is done
 * once, and a SET button on every attribute for ever afterwards is clutter
 * standing next to values nobody means to re-roll. Hidden, the roll is still
 * a press away in the property's own settings.
 */
function showsSet(e: RollExt): boolean {
  return hasSet(e) && e.setHide !== true;
}

/** The view's roll service, made on first use like everything else here. */
function svcFor(view: EntryRef["view"]): RollService {
  return view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings, view.history, view.app));
}

/**
 * Roll this property's macro and put the total in it.
 *
 * Shared by the button in the row and the one in the settings, because they
 * are the same act - and because the settings are where you end up when the
 * row's button is switched off.
 *
 * The write waits for the card to be DISMISSED rather than for the dice to
 * land: the card can be re-rolled while it is up, and the number showing when
 * it closes is the one kept.
 */
export function runSetRoll(ref: EntryRef, label: string): void {
  const view = ref.view;
  const e = ext<RollExt>(ref.entry);
  const key = (ref.entry.key as string) ?? "";
  const macros = Array.isArray(view.settings.macros) ? view.settings.macros : [];
  const macro = macros.find((m) => m.id === e.setMacro);
  // This property's own expression if it has one, else the macro's.
  const segs = e.setSegs?.length ? e.setSegs : macro?.segs ?? [];
  if (!segs.length || !key) {
    new Notice(view.i18n.t("roll.setNoMacro"));
    return;
  }
  runRoll(svcFor(view), view.i18n, {
    segs,
    mode: macro?.mode,
    times: macro?.times,
    label,
    resolve: makeNoteAwareResolver(view.app, view.settings, view.registries, view, view.note.path ?? ""),
    onClose: (total) =>
      putResult(
        view.app,
        view.i18n,
        { key, current: view.note.raw[key], set: (value) => view.note.set(ref.file, key, value) },
        total
      ),
  });
}

/**
 * The labelled modifier terms behind an entry's roll, for the animation chain.
 *
 * An override replaces the lot with one row saying so; otherwise each active
 * influence contributes its own, under the short name it is known by.
 */
function partsFor(ref: EntryRef): RollPart[] {
  const { view, entry } = ref;
  const me = ext<ModExt>(entry);
  if (hasNoteOverride(view, entry) || me.rollOverride !== undefined)
    return [{ label: view.i18n.t("roll.partOverride"), value: modifierTotal(view, entry) }];
  return (me.mods ?? [])
    .filter((inf) => influenceActive(view, entry, inf))
    .map((inf) => ({
      label: abbrFor(view.settings, inf.source || (entry.key as string) || ""),
      value: influenceTerm(view, entry, inf),
    }));
}

/**
 * Roll this entry's dice plus its modifier - what the roll button does.
 *
 * Exported because the button is not the only place that offers it: the
 * settings popup's toolbar carries the same action, and the two must not
 * drift into rolling slightly different things.
 */
export function runEntryRoll(
  ref: EntryRef,
  label: string,
  opts: { mode?: RollMode; times?: number; assignAt?: MouseEvent } = {}
): void {
  const { view, entry } = ref;
  const e = ext<RollExt>(entry);
  const svc = svcFor(view);
  const n = Math.max(1, Math.min(20, opts.times ?? 1));
  const at = opts.assignAt;
  for (let i = 0; i < n; i++)
    svc.roll(n > 1 ? `${label} #${i + 1}` : label, modifierTotal(view, entry), parseDiceOrDefault(e.dice), {
      parts: partsFor(ref),
      mode: opts.mode,
      stay: n > 1 || !!at,
      onClose: at && ref.file ? (total) => assignMenu(view, ref.file, total, at) : undefined,
    });
}

/** Whether a rolled total could be put into this entry at all. */
export function canSetFromRoll(ref: EntryRef): boolean {
  return ref.entry.kind === "prop" && MODIFIABLE_TYPE_IDS.has(ref.view.resolveType(ref.entry));
}

export const rollAddon: ClusterAddon = {
  id: "rolling.roll",

  appliesTo(ref: EntryRef): boolean {
    if (ref.entry.kind !== "prop") return false;
    const e = ext<RollExt>(ref.entry);
    if (!e.roll && !showsSet(e)) return false;
    return MODIFIABLE_TYPE_IDS.has(ref.view.resolveType(ref.entry));
  },

  needs(ref: EntryRef): ClusterNeeds {
    const e = ext<RollExt>(ref.entry);
    const after: { id: string; cls: string }[] = [];
    if (e.roll) after.push({ id: "roll", cls: "ep-roll-cell" });
    if (showsSet(e)) after.push({ id: "set", cls: "ep-set-cell" });
    return { after };
  },

  onRename(entry) {
    const e = ext<RollExt>(entry);
    e.roll = undefined;
    e.dice = undefined;
    e.setMacro = undefined;
    e.setSegs = undefined;
    e.setHide = undefined;
  },

  fillSlots(ctx: EntryRenderCtx, num: NumericAccess) {
    const view = ctx.view;
    const e = ext<RollExt>(ctx.entry);
    const slots: Record<string, (cell: HTMLElement) => void> = {};
    if (showsSet(e))
      slots["set"] = (cell) => {
        const btn = cell.createEl("button", { cls: "ep-set-btn", text: view.i18n.t("roll.set") });
        btn.setAttr("aria-label", view.i18n.t("roll.setAria", { name: num.label }));
        btn.setAttr("title", view.i18n.t("roll.setHint"));
        btn.onclick = () => runSetRoll(ctx, num.label);
      };
    if (!e.roll) return slots;
    slots["roll"] = (cell) => {
      // The dice breakdown lives in the modifier badge / denotation cell
      // (between the modifier names and the modifier); the cell holds only
      // the button.
      const btn = cell.createEl("button", { cls: "ep-roll-btn", text: view.i18n.t("roll.roll") });
      btn.setAttr("aria-label", view.i18n.t("roll.rollAria", { name: num.label }));
      btn.onclick = () => runEntryRoll(ctx, num.label);
      // Right-click: advantage/disadvantage, how many simultaneous rolls, and
      // where the result should go if it turns out to have been for something.
      btn.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openRollMenu(
          ev,
          view.i18n,
          svcFor(view).mode,
          (mode, times) => runEntryRoll(ctx, num.label, { mode, times }),
          {
            // Roll once, keep the card up, and put the number wherever it was
            // wanted when it is closed.
            onAssign: (mode) => runEntryRoll(ctx, num.label, { mode, assignAt: ev }),
          }
        );
      });
      longPressContextMenu(btn); // touch parity for the roll-mode menu
    };
    return slots;
  },

  renderOptions(octx: OptionsCtx): void {
    const { view, entry, container: c, changed, redraw } = octx;
    if (entry.kind !== "prop" || !MODIFIABLE_TYPE_IDS.has(view.resolveType(entry))) return;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext<RollExt & ModExt>(entry);
    c.createEl("h4", { text: t("roll.options.heading") });
    new Setting(c).setName(t("roll.options.rollButton")).setDesc(t("roll.options.rollButtonDesc")).addToggle((tg) => {
      tg.setValue(!!e.roll).onChange((v) => {
        e.roll = v || undefined;
        // Make the implicit "roll this value" explicit and editable:
        // a fresh roll button starts with the entry's own value as term.
        if (v && !(e.mods?.length) && e.rollOverride === undefined && view.resolveType(entry) !== "derived")
          e.mods = [{}];
        changed();
        redraw();
      });
    });
    if (e.roll) {
      addDiceSettings(c, view.i18n, {
        get: () => e.dice,
        set: (n) => {
          e.dice = n;
          changed();
        },
      });
      new Setting(c)
        .setName(t("mods.showDice"))
        .setDesc(t("mods.showDiceDesc"))
        .addToggle((tg) => {
          tg.setValue(entry.showDice !== false).onChange((v) => {
            entry.showDice = v ? undefined : false;
            changed();
          });
        });
      new Setting(c)
        .setName(t("mods.showDiceIcon"))
        .setDesc(t("mods.showDiceIconDesc"))
        .addToggle((tg) => {
          tg.setValue(entry.showDiceIcon !== false).onChange((v) => {
            entry.showDiceIcon = v ? undefined : false;
            changed();
          });
        });
    }
    renderSetOptions(octx, e);
  },
};

/**
 * The SET button's settings: which macro decides this property's value.
 *
 * A roll button asks a question of a value; SET decides what the value IS.
 * It is pointed at a MACRO rather than at an expression, because the case
 * that matters is four attributes sharing one `3d6dhdl + 8` - and then one
 * edit changes all four. The property may still keep an expression of its
 * own, for the attribute that is nearly the shared roll but not quite; the
 * macro stays named, so clearing the override goes back to it.
 */
function renderSetOptions(octx: OptionsCtx, e: RollExt): void {
  const { view, entry, container: c, changed, redraw } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const macros = Array.isArray(view.settings.macros) ? view.settings.macros : [];
  const macro = macros.find((m) => m.id === e.setMacro);
  const label = (entry.alias as string) || (entry.key as string) || t("roll.set");

  c.createEl("h4", { text: t("roll.setHeading") });
  new Setting(c)
    .setName(t("roll.setMacro"))
    .setDesc(t("roll.setMacroDesc"))
    .addDropdown((dd) => {
      dd.addOption("", t("roll.setMacroNone"));
      for (const m of macros) dd.addOption(m.id, m.name);
      dd.addOption("+", t("roll.setMacroNew"));
      dd.setValue(e.setMacro ?? "");
      dd.onChange((v) => {
        if (v === "+") {
          // A macro made here joins the vault's list: the next property can
          // point at it rather than inventing the same roll again.
          const made = { id: genId(), name: label, segs: e.setSegs ?? ([{ dice: "3d6" }] as RollSeg[]) };
          view.settings.macros = [...macros, made];
          e.setMacro = made.id;
          e.setSegs = undefined;
        } else {
          e.setMacro = v || undefined;
          // The override belonged to the macro that was there before.
          e.setSegs = undefined;
        }
        changed();
        redraw();
      });
    });
  if (!e.setMacro) return;

  const shared = segsToText(macro?.segs ?? []);
  const mine = e.setSegs?.length ? segsToText(e.setSegs) : shared;
  const differs = !!e.setSegs?.length;

  // Typing here changes THIS property and nothing else. That is the safe
  // reading of an edit - the macro may be shared with a dozen other rows -
  // and the other answer is a button, standing where it can be seen rather
  // than a dialog that only appears once you have already typed something.
  const row = new Setting(c)
    .setName(t("roll.setExpr"))
    .setDesc(differs ? t("roll.setExprOwn", { name: macro?.name ?? "" }) : t("roll.setExprShared", { name: macro?.name ?? "" }))
    .addText((tx) => {
      tx.setPlaceholder("3d6dhdl + 8").setValue(mine);
      tx.inputEl.addEventListener("change", () => {
        const parsed = textToSegs(tx.getValue());
        if (!parsed) {
          tx.inputEl.addClass("ep-invalid");
          return;
        }
        tx.inputEl.removeClass("ep-invalid");
        // Back to what the macro says: there is nothing left to override.
        e.setSegs = segsToText(parsed) === shared ? undefined : parsed;
        changed();
        redraw();
      });
    });

  if (differs) {
    // The overwrite, in plain sight: push this property's expression back into
    // the macro, and every property using that macro changes with it.
    row.addButton((b) =>
      b
        .setButtonText(t("roll.setExprEverywhere"))
        .setTooltip(t("roll.setExprAsk", { name: macro?.name ?? "", prop: label }))
        .onClick(() => {
          new ConfirmModal(
            view.app,
            view.i18n,
            t("roll.setExprAsk", { name: macro?.name ?? "", prop: label }),
            () => {
              if (macro) macro.segs = e.setSegs ?? macro.segs;
              e.setSegs = undefined;
              changed();
              redraw();
            },
            { confirmText: t("roll.setExprEverywhere"), destructiveConfirm: false }
          ).open();
        })
    );
    row.addExtraButton((b) =>
      b
        .setIcon("rotate-ccw")
        .setTooltip(t("roll.setExprReset"))
        .onClick(() => {
          e.setSegs = undefined;
          changed();
          redraw();
        })
    );
  }

  // Whether the button stands in the row, or only here.
  new Setting(c)
    .setName(t("roll.setShow"))
    .setDesc(t("roll.setShowDesc"))
    .addToggle((tg) => {
      tg.setValue(e.setHide !== true).onChange((v) => {
        e.setHide = v ? undefined : true;
        changed();
        redraw();
      });
    });

  // Roll it from here. This is the whole point of being able to hide the
  // button: a sheet is rolled up once, and the settings are where you are
  // standing when you set it up.
  new Setting(c)
    .setName(t("roll.setRollNow"))
    .setDesc(t("roll.setRollNowDesc"))
    .addButton((b) =>
      b
        .setButtonText(t("roll.set"))
        .setCta()
        .onClick(() => runSetRoll(octx, label))
    );

  // ...and the macros themselves are a settings page away, since renaming one
  // or changing what it rolls belongs there rather than here.
  new Setting(c)
    .setName(t("roll.setMacroEdit"))
    .setDesc(t("roll.setMacroEditDesc"))
    .addButton((b) => b.setButtonText(t("roll.setMacroOpen")).onClick(() => view.openMacroSettings()));
}
