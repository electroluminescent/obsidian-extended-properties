/**
 * The "modifiers" cluster addon - the generic UI of the influence engine
 * (`core/influences.ts`) for numeric property entries:
 *
 * - toggle checkboxes for togglable influences (the generic "proficiency"),
 * - the modifier badge: a denotation built from the short forms of all
 *   influencing properties ("INT + DEX - AGE") followed by the total,
 * - the influence editor in the entry options modal, where each term's
 *   source, derivation, sign, toggle list and short form are configured.
 *
 * The "derived" value type reuses {@link paintDenotation} so its rows show
 * the same denotation without a duplicate total.
 */

import { Setting, setIcon } from "obsidian";
import type { TFile } from "obsidian";
import type { EntryRef, EntryRenderCtx, OptionsCtx } from "../../core/context";
import type { ClusterAddon, ClusterNeeds, ClusterSlot } from "../../core/registry";
import type { Entry } from "../../core/model";
import { ext } from "../../core/model";
import {
  abbrFor, applyDerivation, assignShortForm, defaultAbbr, denotationText, ensureShortForm, hasNoteOverride,
  Influence, influenceActive, influenceDisabled, influenceTerm, ModExt, modifierInfo, modifierTotal,
  reassignDerived, referenceSuggestions, setInfluenceActive, setInfluenceDisabled, shortFormConflict, termDenotation,
} from "../../core/influences";
import { parseExpr } from "../../core/expr";
import { ConfirmModal } from "../modals/dialogs";
import type { ViewCtx } from "../../core/context";
import { fmtMod } from "../../utils/misc";
import { formatDice, parseDiceOrDefault } from "../../utils/dice";
import { diceIconId } from "./dice-icons";
import { PropSuggest, RefSuggest } from "../components/suggest";

/** Value types the modifier system attaches to. */
export const MODIFIABLE_TYPE_IDS = new Set(["number", "decimal", "formula", "derived"]);

function mods(entry: Entry): Influence[] {
  const m = ext<ModExt>(entry).mods;
  return Array.isArray(m) ? m : [];
}

/**
 * Influences whose checkbox is shown on the row, in modifier order (so
 * toggle buttons line up consistently across the entries of a section).
 * `hideToggle` suppresses the button per source without disabling the list.
 */
function togglable(entry: Entry): Influence[] {
  return mods(entry).filter((m) => m.toggle && !m.hideToggle);
}

// ---------------------------------------------------------------------------
// Painting
// ---------------------------------------------------------------------------

/**
 * Render the denotation of an entry's influences into `parent`:
 * one short form per term, signs between, inactive toggled terms dimmed.
 * Terms flagged `hideInChain` are skipped (they still count). When `file`
 * is given, togglable terms can be toggled directly: click in edit mode,
 * double-click otherwise.
 */
export function paintDenotation(
  parent: HTMLElement,
  view: ViewCtx,
  entry: Entry,
  file?: TFile
): HTMLElement | null {
  const list = mods(entry).filter((m) => !m.hideInChain);
  if (!list.length) return null;
  const den = parent.createSpan({ cls: "ep-denote" });
  list.forEach((inf, i) => {
    const neg = inf.weight === -1;
    if (i > 0) den.createSpan({ cls: "ep-denote-op", text: neg ? "-" : "+" });
    else if (neg) den.createSpan({ cls: "ep-denote-op", text: "-" });
    const srcKey = inf.source || (entry.key) || "";
    const term = den.createSpan({ cls: "ep-line-abbr ep-denote-term", text: termDenotation(view.settings, entry, inf) });
    let title: string;
    if (inf.expr) {
      title = inf.expr + (inf.toggle ? ` - ${inf.toggle}` : "");
    } else {
      const modeName =
        inf.mode === "formula"
          ? inf.formula ?? "x"
          : view.registries.derivations.get(inf.mode ?? "value")?.name(view.i18n) ?? "";
      title = srcKey + (modeName ? ` - ${modeName}` : "") + (inf.toggle ? ` - ${inf.toggle}` : "");
    }
    if (!influenceActive(view, entry, inf)) term.addClass("ep-denote-off");
    if (file) {
      // Every modifier is click-togglable: list-backed terms flip their
      // toggle list, the rest flip the per-note disabled-modifiers list.
      term.addClass("ep-denote-tog");
      title += ` - ${view.i18n.t("mods.clickToggle")}`;
      const flip = () => {
        if (inf.toggle) setInfluenceActive(view, file, entry, inf, !influenceActive(view, entry, inf));
        else setInfluenceDisabled(view, file, entry, inf, !influenceDisabled(view, entry, inf));
      };
      term.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        flip();
      };
    }
    term.setAttr("title", title);
  });
  return den;
}

/**
 * Dice breakdown tag ("2d20") for rollable entries, rendered between the
 * modifier names and the modifier itself, so the row reads like the roll:
 * `STR + PRO  2d20 +5`. Only the notation is needed here - the rolling
 * module owns the actual rolling.
 */
export function paintDice(parent: HTMLElement, entry: Entry): void {
  const e = entry as Record<string, unknown>;
  if (!e["roll"] || e["showDice"] === false) return;
  const spec = parseDiceOrDefault(typeof e["dice"] === "string" ? (e["dice"]) : undefined);
  const tag = parent.createSpan({ cls: "ep-dice-tag ep-line-abbr" });
  if (e["showDiceIcon"] !== false) {
    // Icon stacked above the notation, both centered.
    tag.addClass("ep-dice-stack");
    const ic = tag.createSpan({ cls: "ep-dice-ico" });
    setIcon(ic, diceIconId(spec.sides));
  }
  tag.createSpan({ text: formatDice(spec) });
}

/** Badge: denotation + dice breakdown + computed total (or "-" on error). */
function paintBadge(cell: HTMLElement, ref: EntryRef): void {
  cell.empty();
  if (ref.entry.showChain !== false) paintDenotation(cell, ref.view, ref.entry, ref.file);
  paintDice(cell, ref.entry);
  const info = modifierInfo(ref.view, ref.entry);
  if (info.value === undefined) {
    const m = cell.createSpan({ cls: "ep-expr-error", text: "-" });
    m.setAttr("title", ref.view.i18n.t(info.error === "cycle" ? "mods.errCycle" : "mods.errExpr"));
  } else {
    cell.appendText(fmtMod(info.value));
  }
}

// ---------------------------------------------------------------------------
// The addon
// ---------------------------------------------------------------------------

export const modifierAddon: ClusterAddon = {
  id: "core.mods",

  appliesTo(ref: EntryRef): boolean {
    if (ref.entry.kind !== "prop") return false;
    if (!MODIFIABLE_TYPE_IDS.has(ref.view.resolveType(ref.entry))) return false;
    const e = ext<ModExt>(ref.entry);
    return !!(e.mods?.length || e.showMod);
  },

  needs(ref: EntryRef): ClusterNeeds {
    const before: ClusterSlot[] = [];
    if (togglable(ref.entry).length) before.push({ id: "tog", cls: "ep-tog-cell" });
    // The derived type shows the total as its value; only the denotation
    // is rendered there (by the type itself), so no badge cell.
    const isDerived = ref.view.resolveType(ref.entry) === "derived";
    if (ext<ModExt>(ref.entry).showMod && !isDerived) before.push({ id: "mod", cls: "ep-mod-badge" });
    return { before };
  },

  onRename(entry) {
    const e = ext<ModExt>(entry);
    e.mods = undefined;
    e.rollOverride = undefined;
    e.showMod = undefined;
  },

  fillSlots(ctx: EntryRenderCtx) {
    const view = ctx.view;
    const e = ext<ModExt>(ctx.entry);
    const slots: Record<string, (cell: HTMLElement) => void> = {};

    const togs = togglable(ctx.entry);
    if (togs.length) {
      slots["tog"] = (cell) => {
        for (const inf of togs) {
          const cb = cell.createEl("input");
          cb.type = "checkbox";
          cb.addClass("ep-prof");
          const sync = () => (cb.checked = influenceActive(view, ctx.entry, inf));
          sync();
          const flip = () => setInfluenceActive(view, ctx.file, ctx.entry, inf, !influenceActive(view, ctx.entry, inf));
          if (view.editMode) {
            cb.setAttr("title", inf.toggle ?? "");
            cb.onchange = flip;
          } else {
            cb.setAttr("title", `${inf.toggle ?? ""} - ${view.i18n.t("hint.dblToggle")}`);
            cb.onclick = (ev) => ev.preventDefault();
            cb.ondblclick = flip;
          }
          view.registerUpdater(sync);
        }
      };
    }
    if (e.showMod && view.resolveType(ctx.entry) !== "derived") {
      slots["mod"] = (cell) => {
        paintBadge(cell, ctx);
        view.registerUpdater(() => paintBadge(cell, ctx));
      };
    }
    return slots;
  },

  /** Keep the badge live while a slider drags (only the self term reacts). */
  onPreview(ctx, cells, value) {
    const e = ext<ModExt>(ctx.entry);
    if (!e.showMod || !cells["mod"] || e.rollOverride !== undefined) return;
    const view = ctx.view;
    let total = 0;
    for (const inf of mods(ctx.entry)) {
      if (inf.source || inf.expr) {
        // Sourced and expression terms don't track the dragged value live -
        // evaluate them normally against the current note.
        total += influenceTerm(view, ctx.entry, inf);
        continue;
      }
      if (!influenceActive(view, ctx.entry, inf)) continue;
      total += (inf.weight === -1 ? -1 : 1) * applyDerivation(view, inf, value);
    }
    const cell = cells["mod"];
    cell.empty();
    if (ctx.entry.showChain !== false) paintDenotation(cell, view, ctx.entry, ctx.file);
    paintDice(cell, ctx.entry);
    cell.appendText(fmtMod(total));
  },

  // -- options: the influence editor ---------------------------------------
  renderOptions(octx: OptionsCtx): void {
    const { view, entry, container: c, changed, redraw } = octx;
    if (entry.kind !== "prop" || !MODIFIABLE_TYPE_IDS.has(view.resolveType(entry))) return;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext<ModExt>(entry);
    const isDerived = view.resolveType(entry) === "derived";
    const list = mods(entry);

    c.createEl("h4", { text: t("mods.heading") });
    if (list.length) {
      c.createEl("p", {
        cls: "setting-item-description",
        text: t("mods.preview", {
          denote: denotationText(view.settings, entry, list),
          total: fmtMod(modifierTotal(view, entry)),
        }),
      });
    }

    // Per-property short form, used in modifier chains and inline val:/roll: refs.
    // Short forms are unique; setting one already in use prompts to overwrite,
    // in which case the previous owner gets a freshly derived short form.
    if (entry.key && (entry as Record<string, unknown>)["__multi"] !== true) {
      const key = entry.key;
      if (ensureShortForm(view.settings, key)) changed();
      new Setting(c)
        .setName(t("mods.shortForm"))
        .setDesc(t("mods.shortFormDesc"))
        .addText((tx) => {
          tx.setValue(abbrFor(view.settings, key)).setPlaceholder(defaultAbbr(key));
          tx.inputEl.addClass("ep-abbr-input");
          tx.inputEl.addEventListener("change", () => {
            const desired = tx.getValue().trim().toUpperCase();
            if (!desired) {
              reassignDerived(view.settings, key);
              changed();
              tx.setValue(abbrFor(view.settings, key));
              return;
            }
            if (desired === abbrFor(view.settings, key)) return;
            const other = shortFormConflict(view.settings, key, desired);
            if (other) {
              tx.setValue(abbrFor(view.settings, key)); // revert until confirmed
              new ConfirmModal(view.app, view.i18n, t("mods.shortFormConflict", { abbr: desired, other }), () => {
                assignShortForm(view.settings, key, desired);
                reassignDerived(view.settings, other);
                changed();
                redraw();
              }).open();
              return;
            }
            assignShortForm(view.settings, key, desired);
            changed();
          });
        });
    }

    list.forEach((inf, idx) => {
      const head = new Setting(c).setName(t("mods.influence", { n: idx + 1 }));
      head.addText((tx) => {
        tx.setPlaceholder(t("mods.sourceSelf")).setValue(inf.source ?? "");
        // With an expression the source is named inside it; the field is moot.
        if (inf.expr !== undefined) tx.setDisabled(true);
        new PropSuggest(view.app, tx.inputEl, view.i18n, () => view.propCandidates(true), (k) => {
          inf.source = k || undefined;
          changed();
          redraw();
        }, false);
        tx.inputEl.addEventListener("change", () => {
          inf.source = tx.getValue().trim() || undefined;
          changed();
        });
      });
      head.addDropdown((d) => {
        d.addOption("value", view.registries.derivations.get("value")?.name(view.i18n) ?? "value");
        for (const def of view.registries.derivations.all())
          if (def.id !== "value") d.addOption(def.id, def.name(view.i18n));
        d.addOption("formula", t("mods.modeFormula"));
        d.addOption("expr", t("mods.modeExpr"));
        d.setValue(inf.expr !== undefined ? "expr" : inf.mode ?? "value");
        d.onChange((v) => {
          if (v === "expr") {
            inf.expr = inf.expr ?? "";
            inf.mode = undefined;
          } else {
            inf.expr = undefined;
            inf.mode = v === "value" ? undefined : v;
          }
          changed();
          redraw();
        });
      });
      head.addExtraButton((b) =>
        b.setIcon("arrow-up").setTooltip(t("mods.moveUp")).onClick(() => {
          if (idx === 0) return;
          [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
          e.mods = list;
          changed();
          redraw();
        })
      );
      head.addExtraButton((b) =>
        b.setIcon("arrow-down").setTooltip(t("mods.moveDown")).onClick(() => {
          if (idx >= list.length - 1) return;
          [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
          e.mods = list;
          changed();
          redraw();
        })
      );
      head.addExtraButton((b) =>
        b.setIcon("trash").setTooltip(t("mods.removeInfluence")).onClick(() => {
          list.splice(idx, 1);
          e.mods = list.length ? list : undefined;
          changed();
          redraw();
        })
      );

      if (inf.expr !== undefined) {
        new Setting(c)
          .setName(t("mods.expr"))
          .setDesc(t("mods.exprDesc"))
          .setClass("ep-mods-sub")
          .addText((tx) => {
            tx.setValue(inf.expr ?? "");
            tx.inputEl.addClass("ep-expr-input");
            new RefSuggest(view.app, tx.inputEl, () =>
              referenceSuggestions(view.settings, view.propCandidates(true).map((c) => c.key))
            );
            const validate = (val: string) =>
              tx.inputEl.toggleClass("ep-invalid", val.trim() !== "" && !parseExpr(val));
            validate(inf.expr ?? "");
            tx.onChange((val) => {
              inf.expr = val;
              validate(val);
              changed();
            });
          });
      } else if (inf.mode === "formula") {
        new Setting(c)
          .setName(t("mods.formula"))
          .setDesc(t("options.formulaDesc"))
          .setClass("ep-mods-sub")
          .addText((tx) => {
            tx.setValue(inf.formula ?? "x").onChange((v) => {
              inf.formula = v.trim() || undefined;
              changed();
            });
          });
      }

      const sub = new Setting(c).setName(t("mods.termOptions")).setClass("ep-mods-sub");
      sub.addDropdown((d) => {
        d.addOption("1", t("mods.weightAdd"));
        d.addOption("-1", t("mods.weightSub"));
        d.setValue(inf.weight === -1 ? "-1" : "1");
        d.onChange((v) => {
          inf.weight = v === "-1" ? -1 : undefined;
          changed();
        });
      });
      sub.addText((tx) => {
        tx.setPlaceholder(t("mods.togglePlaceholder")).setValue(inf.toggle ?? "");
        tx.inputEl.setAttr("aria-label", t("mods.toggleProp"));
        new PropSuggest(view.app, tx.inputEl, view.i18n, () => view.propCandidates(true), (k) => {
          inf.toggle = k || undefined;
          changed();
          redraw();
        }, false);
        tx.inputEl.addEventListener("change", () => {
          inf.toggle = tx.getValue().trim() || undefined;
          changed();
        });
      });
      sub.setDesc(t("mods.termOptionsDesc"));

      // Labeled visibility toggle for this term's checkbox (proficiency
      // style); only meaningful for togglable terms.
      if (inf.toggle) {
        new Setting(c)
          .setName(t("mods.showToggle"))
          .setDesc(t("mods.showToggleDesc", { list: inf.toggle }))
          .setClass("ep-mods-sub")
          .addToggle((tg) => {
            tg.setValue(!inf.hideToggle).onChange((v) => {
              inf.hideToggle = v ? undefined : true;
              changed();
            });
          });
      }
      // Per-term visibility in the chain denotation (still counted).
      new Setting(c)
        .setName(t("mods.showInChain"))
        .setDesc(t("mods.showInChainDesc"))
        .setClass("ep-mods-sub")
        .addToggle((tg) => {
          tg.setValue(!inf.hideInChain).onChange((v) => {
            inf.hideInChain = v ? undefined : true;
            changed();
          });
        });
    });

    new Setting(c).addButton((b) =>
      b.setButtonText(t("mods.addInfluence")).onClick(() => {
        e.mods = [...list, {}];
        changed();
        redraw();
      })
    );

    if (!isDerived) {
      new Setting(c).setName(t("mods.showBadge")).setDesc(t("mods.showBadgeDesc")).addToggle((tg) => {
        tg.setValue(!!e.showMod).onChange((v) => {
          e.showMod = v || undefined;
          changed();
        });
      });
    }
    new Setting(c)
      .setName(t("mods.showChain"))
      .setDesc(t("mods.showChainDesc"))
      .addToggle((tg) => {
        tg.setValue(entry.showChain !== false).onChange((v) => {
          entry.showChain = v ? undefined : false;
          changed();
        });
      });

    const isMulti = (entry as Record<string, unknown>)["__multi"] === true;
    if (isDerived && entry.key && !isMulti) {
      // Per-note override: a stored note value replacing the derived sum.
      // Editing the value in the sidebar turns this on; clearing it (or
      // this toggle) turns it off.
      const key = entry.key;
      const on = hasNoteOverride(view, entry);
      const ov = new Setting(c).setName(t("mods.overrideNote")).setDesc(t("mods.overrideNoteDesc"));
      ov.addToggle((tg) => {
        tg.setValue(on).onChange((v) => {
          view.note.set(octx.file, key, v ? modifierTotal(view, entry) : undefined);
          redraw();
        });
      });
      ov.addText((tx) => {
        tx.setValue(on ? String(view.note.num(key, 0)) : "");
        tx.setPlaceholder(fmtMod(modifierTotal(view, entry)));
        tx.onChange((v) => {
          if (v.trim() === "") {
            view.note.set(octx.file, key, undefined);
            return;
          }
          const n = Number(v);
          if (Number.isFinite(n)) view.note.set(octx.file, key, n);
        });
      });
    } else {
      new Setting(c)
        .setName(t("mods.override"))
        .setDesc(t("mods.overrideDesc"))
        .addText((tx) => {
          tx.setValue(e.rollOverride !== undefined ? String(e.rollOverride) : "").onChange((v) => {
            const n = Number(v);
            e.rollOverride = v.trim() === "" || !Number.isFinite(n) ? undefined : n;
            changed();
          });
        });
    }
  },
};
