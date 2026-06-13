/**
 * "derived" value type — a read-only number computed by the influence
 * engine: the sum of its configured influences (`core/influences.ts`),
 * shown as a signed modifier. Replaces the former hard-coded "computed"
 * entries (proficiency, initiative) and the rows of the legacy skills
 * list: a skill is simply a derived property like
 * `DEX(mod) + Proficiency Bonus (toggled by "Skill Proficiencies")`.
 *
 * Cluster addons attach as usual, so the roll button and the toggle
 * checkboxes work the same way they do on plain numbers.
 */

import type { EntryRef, OptionsCtx } from "../../../core/context";
import type { ValueTypeDef } from "../../../core/registry";
import { hasNoteOverride, modifierInfo, modifierTotal } from "../../../core/influences";
import { fmtMod } from "../../../utils/misc";
import { addonsFor, emptyFlags, mergeNeeds } from "../cluster";
import { openNumberInput } from "../../components/inline-edit";
import { paintDenotation, paintDice } from "../modifier-addon";

export const derivedType: ValueTypeDef = {
  id: "derived",
  name: (i18n) => i18n.t("type.derived"),

  clusterNeeds(ref: EntryRef) {
    const flags = emptyFlags();
    for (const a of addonsFor(ref)) mergeNeeds(flags, a.needs(ref));
    // The denotation (+ dice breakdown) sits directly before the value.
    flags.before.push({ id: "den", cls: "ep-den-cell" });
    return flags;
  },

  render(ctx) {
    const { view, entry } = ctx;
    const compute = () => modifierTotal(view, entry);
    const label = (entry.alias as string) || (entry.key as string) || "";

    const slots: Record<string, (cell: HTMLElement) => void> = {
      den: (cell) => {
        const paint = () => {
          cell.empty();
          if (entry.showChain !== false) paintDenotation(cell, view, entry, ctx.file);
          // Roll breakdown between the modifier names and the value.
          paintDice(cell, entry);
        };
        paint();
        view.registerUpdater(paint);
      },
    };
    for (const a of addonsFor(ctx)) Object.assign(slots, a.fillSlots(ctx, { get: compute, label }));

    const disp = () => {
      const r = modifierInfo(view, entry);
      return r.value === undefined ? "—" : fmtMod(r.value);
    };
    const refs = view.buildCluster(ctx.head, ctx.flags, { display: disp(), slots });
    refs.val.addClass("ep-num-join");
    if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) refs.val.style.color = entry.valueColor as string;
    const sync = () => {
      const info = modifierInfo(view, entry);
      if (info.value === undefined) {
        refs.val.setText("—");
        refs.val.addClass("ep-expr-error");
        refs.val.removeClass("ep-overridden");
        refs.val.setAttr("title", view.i18n.t(info.error === "cycle" ? "mods.errCycle" : "mods.errExpr"));
      } else {
        refs.val.setText(fmtMod(info.value));
        refs.val.removeClass("ep-expr-error");
        refs.val.removeAttribute("title");
        refs.val.toggleClass("ep-overridden", hasNoteOverride(view, entry));
      }
    };
    sync();
    // Per-note override: editing the value stores it in this note's
    // frontmatter (which also flips the override toggle in the property
    // settings); emptying the field clears it back to the derived sum.
    view.bindOpen(refs.val, () =>
      openNumberInput(refs.val, compute(), (v) => view.note.set(ctx.file, entry.key as string, v), {
        min: -9999,
        max: 9999,
        float: false,
        clamp: false,
        onEmpty: () => view.note.set(ctx.file, entry.key as string, undefined),
      })
    );
    view.registerUpdater(sync);
  },

  menuItems(menu, ref: EntryRef) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    if (hasNoteOverride(view, entry)) {
      menu.addItem((i) =>
        i.setTitle(view.i18n.t("mods.clearNoteOverride")).setIcon("eraser").onClick(() =>
          view.note.set(file, key, undefined)
        )
      );
    }
  },

  renderOptions(octx: OptionsCtx) {
    // Influence editor, roll settings, … — every addon may contribute.
    for (const a of octx.view.registries.clusterAddons.all()) a.renderOptions?.(octx);
  },
};
