/**
 * D&D entry kinds: "computed" — derived read-only conveniences
 * (proficiency bonus, initiative). The former "saves"/"skills" kinds are
 * gone: they are now ordinary properties of the generic "skills" value type
 * (see `sections.ts` for the presets and `index.ts` for the migration).
 */

import type { EntryKindDef } from "../../core/registry";
import { ext } from "../../core/model";
import { fmtMod } from "../../utils/misc";
import { ABILITY_DEFAULT, LEVEL_KEY, abilityMod, profBonus } from "./rules";
import { ROLL_SERVICE, RollService } from "../rolling/roll-service";

/** Persisted field of "computed" entries. */
interface ComputedExt { computed?: "proficiency" | "initiative" }

export const computedKind: EntryKindDef = {
  id: "computed",
  defaultLabel: (i18n, entry) =>
    ext<ComputedExt>(entry).computed === "proficiency" ? i18n.t("dnd.proficiency") : i18n.t("dnd.initiative"),

  clusterNeeds(ref) {
    return ext<ComputedExt>(ref.entry).computed === "initiative"
      ? { after: [{ id: "roll", cls: "ep-roll-cell" }] }
      : {};
  },

  render(ctx) {
    const { view, entry } = ctx;
    view.renderLabel(ctx.head, ctx);
    const which = ext<ComputedExt>(entry).computed;
    const compute = () =>
      which === "proficiency"
        ? profBonus(view.note.num(LEVEL_KEY, 1))
        : abilityMod(view.note.num("Dexterity", ABILITY_DEFAULT));
    const slots: Record<string, (cell: HTMLElement) => void> = {};
    if (which === "initiative") {
      slots["roll"] = (cell) => {
        const btn = cell.createEl("button", { cls: "ep-roll-btn", text: view.i18n.t("roll.roll") });
        btn.onclick = () =>
          view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n)).roll(view.i18n.t("dnd.initiative"), compute());
      };
    }
    const refs = view.buildCluster(ctx.head, ctx.flags, { display: fmtMod(compute()), slots });
    if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) refs.val.style.color = entry.valueColor as string;
    view.registerUpdater(() => refs.val.setText(fmtMod(compute())));
  },
};
