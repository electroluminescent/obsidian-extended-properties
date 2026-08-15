/**
 * Per-entry options.
 *
 * {@link renderEntryOptionsBody} renders the full options UI for one entry
 * into any container - used by the standalone modal here and by the tabbed
 * section options modal. Generic sections (property/label, appearance,
 * Obsidian visibility, placement) are rendered directly; type- and
 * feature-specific sections are contributed through the registries:
 *
 *   value type   -> `ValueTypeDef.renderOptions`   (range, image height, ...)
 *   addons       -> `ClusterAddon.renderOptions`   (modifiers, rolls, ...)
 *   entry kind   -> `EntryKindDef.renderOptions`   (non-prop widgets)
 *
 * Closing the modal with changes asks the user to keep or undo them
 * (snapshot diff).
 */

import { Modal, Setting, TFile } from "obsidian";
import type { OptionsCtx, ViewCtx } from "../../core/context";
import type { Entry, FormatRule, Section } from "../../core/model";
import type { Constraints } from "../../core/validate";
import { destructive } from "../components/setting-helpers";
import { setTypedText } from "../components/type-label";
import { parseExpr } from "../../core/expr";
import { setSharedDataType } from "../../core/layout-ops";
import { poolFor } from "../../core/pool";
import { restoreFromSnapshot } from "../../utils/misc";
import {
  addColorSetting, addIconSetting, ColorHost, keepScroll, mountTextList,
} from "../components/setting-helpers";
import { PropSuggest } from "../components/suggest";
import { renderFinishRules } from "../components/finish-rules";
import { renderScale } from "../components/palette-editor";
import { paletteFor } from "../render/format";
import { mountOptionsNav } from "../components/options-nav";
import { asMobileSheet } from "../components/long-press";
import { ConfirmChangesModal } from "./dialogs";

/** Color host bound to the plugin-wide default color space. */
export function viewColorHost(view: ViewCtx): ColorHost {
  return {
    app: view.app,
    i18n: view.i18n,
    getColorSpace: () => view.settings.defaults.colorSpace,
    setColorSpace: (sp) => {
      view.settings.defaults.colorSpace = sp;
      view.saveLayout();
    },
  };
}

/**
 * Render the complete options UI for `octx.entry` into `octx.container`.
 * @param onDone    called when the user presses Done
 * @param onRemoved called after the entry was removed from its section
 * @param opts.multi multi-target mode: the entry is a proxy whose changes
 *                   are mirrored to several entries - per-entry identity
 *                   (key, label) and removal are hidden.
 */
const NUMERIC_CONSTRAINT_TYPES = new Set(["number", "decimal", "formula", "unit", "rating"]);

/** Validation-constraint editors for a prop entry, shown per resolved data type. */
function renderConstraints(octx: OptionsCtx, type: string): void {
  const { view, entry, container: c, changed, redraw } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const cn = (): Constraints => ((entry.constraints ??= {}));
  c.createEl("h4", { text: t("options.constraintsHeading") });
  new Setting(c).setName(t("options.required")).setDesc(t("options.requiredDesc")).addToggle((tg) => {
    tg.setValue(!!entry.constraints?.required).onChange((v) => {
      cn().required = v || undefined;
      changed();
    });
  });
  if (NUMERIC_CONSTRAINT_TYPES.has(type)) {
    const numField = (name: string, get: () => number | undefined, set: (n: number | undefined) => void) =>
      new Setting(c).setName(name).addText((tx) => {
        tx.setValue(get() !== undefined ? String(get()) : "").onChange((v) => {
          const n = Number(v);
          set(v.trim() === "" || !Number.isFinite(n) ? undefined : n);
          changed();
        });
      });
    numField(t("options.constraintMin"), () => entry.constraints?.min, (n) => (cn().min = n));
    numField(t("options.constraintMax"), () => entry.constraints?.max, (n) => (cn().max = n));
    new Setting(c).setName(t("options.constraintClamp")).setDesc(t("options.constraintClampDesc")).addToggle((tg) => {
      tg.setValue(!!entry.constraints?.clamp).onChange((v) => {
        cn().clamp = v || undefined;
        changed();
      });
    });
  } else {
    new Setting(c).setName(t("options.constraintPattern")).setDesc(t("options.constraintPatternDesc")).addText((tx) => {
      tx.setValue(entry.constraints?.pattern ?? "").onChange((v) => {
        cn().pattern = v.trim() || undefined;
        changed();
      });
    });
    renderAllowedList(octx);
  }
  new Setting(c).addButton((b) =>
    b.setButtonText(t("options.constraintClear")).setWarning().onClick(() => {
      delete entry.constraints;
      changed();
      redraw();
    })
  );
}

/**
 * The allowed values, as a list that grows rather than one comma-separated
 * box: a value per row, add and remove, and a button that fills it from what
 * the vault already holds for this property - which is usually the list the
 * user was about to type out.
 */
function renderAllowedList(octx: OptionsCtx): void {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const key = (entry.key as string) ?? "";
  new Setting(c).setName(t("options.constraintAllowed")).setDesc(t("options.constraintAllowedDesc"));
  mountTextList(c, {
    values: entry.constraints?.allowed ?? [],
    addLabel: t("options.constraintAllowedAdd"),
    removeTip: t("options.constraintAllowedRemove"),
    placeholder: t("options.constraintAllowedPlaceholder"),
    save: (values) => {
      (entry.constraints ??= {}).allowed = values.length ? values : undefined;
      changed();
    },
    // What the vault already holds for this property is usually the list the
    // user was about to type out.
    extra: key
      ? (foot, append) => {
          foot.addButton((b) =>
            b
              .setButtonText(t("options.constraintFromPool"))
              .setTooltip(t("options.constraintFromPoolDesc"))
              .onClick(() => {
                const have = new Set((entry.constraints?.allowed ?? []).map((v) => v.trim().toLowerCase()));
                const pool = poolFor(view.settings, view.props.valuesFor(key), key);
                append(pool.filter((v) => v.trim() && !have.has(v.trim().toLowerCase())));
              })
          );
        }
      : undefined,
  });
}

/**
 * Which palette speaks for this property, and where its colour lands.
 *
 * The rule lives with the PROPERTY by default - the sidebar, the type table
 * and inline chips then agree about what "Current HP" looks like - and can be
 * moved onto this one row where it should differ.
 */
function renderFormatting(octx: OptionsCtx): void {
  const { view, entry: e, container: c, changed, redraw } = octx;
  const t = view.i18n.t.bind(view.i18n);
  if (e.kind !== "prop" || !e.key) return;
  const key = (e.key as string).toLowerCase();
  const rule = (): FormatRule => e.format ?? view.settings.formatProps?.[key] ?? {};
  const onRow = (): boolean => !!e.format;
  const empty = (r: FormatRule): boolean =>
    !r.palette && !r.target && !r.contrast && !r.finishes?.length && !r.off;
  const write = (patch: Partial<FormatRule>): void => {
    const next: FormatRule = { ...rule(), ...patch };
    if (onRow()) e.format = empty(next) ? undefined : next;
    else {
      const store = (view.settings.formatProps ??= {});
      if (empty(next)) delete store[key];
      else store[key] = next;
    }
    changed();
    redraw();
  };

  c.createEl("h4", { text: t("options.formatHeading") });
  const palRow = new Setting(c)
    .setName(t("options.formatPalette"))
    .setDesc(t("options.formatPaletteDesc"))
    .addDropdown((dd) => {
      const fill = (): void => {
        const cur = rule().palette ?? "";
        dd.selectEl.empty();
        dd.addOption("", t("options.formatNone"));
        for (const p of view.settings.palettes ?? []) dd.addOption(p.id, p.name || p.id);
        dd.setValue(cur);
      };
      fill();
      dd.onChange((v) => write({ palette: v || undefined }));
      // A palette renamed in the settings has to show up here while this is
      // open, not only the next time it is opened. The watch lets go as soon
      // as the row it belongs to has gone.
      let off: (() => void) | undefined;
      off = view.onSettingsSaved(() => {
        if (!dd.selectEl.isConnected) {
          off?.();
          return;
        }
        fill();
      });
    });
  // Straight from the property to the palette it uses.
  if (rule().palette)
    palRow.addExtraButton((b) =>
      b
        .setIcon("pencil")
        .setTooltip(t("options.formatPaletteEdit"))
        .onClick(() => view.openPaletteSettings(rule().palette as string))
    );
  if (!rule().palette) return; // nothing else means anything yet
  new Setting(c)
    .setName(t("options.formatTarget"))
    .setDesc(t("options.formatTargetDesc"))
    .addDropdown((dd) => {
      for (const target of ["text", "chip", "card"]) dd.addOption(target, t("options.formatTarget." + target));
      dd.setValue(rule().target ?? "text");
      dd.onChange((v) => write({ target: v as FormatRule["target"] }));
    });
  const host = viewColorHost(view);
  addColorSetting(host, c, t("options.formatContrast"), t("options.formatContrastDesc"),
    () => (rule().contrast === "auto" ? undefined : rule().contrast),
    (v) => write({ contrast: v ?? undefined }));

  // -- a scale of this property's own ---------------------------------------
  // The palette's colours, read against this property's own numbers. One
  // palette can then dress a dozen properties that share nothing but a sense
  // of low-to-high, without a palette each.
  const palette = paletteFor(view, rule());
  if (palette?.mode === "bands") {
    new Setting(c)
      .setName(t("options.formatScale"))
      .setDesc(t("options.formatScaleDesc"))
      .addToggle((tg) => {
        tg.setValue(!!rule().scale).onChange((v) => {
          // Start from the palette's own scale, so the first thing seen is
          // what was already happening.
          write({
            scale: v
              ? { steps: (palette.steps ?? []).map((x) => ({ ...x })), relative: palette.relative }
              : undefined,
          });
        });
      });
    const own = rule().scale;
    if (own)
      renderScale(c, { ...palette, steps: own.steps, relative: own.relative, colors: palette.colors }, {
        app: view.app,
        i18n: view.i18n,
        colors: host,
        save: () => write({ scale: { steps: own.steps, relative: own.relative } }),
        redraw,
        dateProps: () => Object.entries(view.settings.dateProps ?? {}).map(([key, cfg]) => ({ key, cfg })),
        colorsReadOnly: true,
      });
  }

  // -- what it is made of ---------------------------------------------------
  new Setting(c)
    .setName(t("options.finishHeading"))
    .setDesc(rule().finishes?.length ? t("options.finishHeadingDesc") : t("options.finishFromPalette"));
  renderFinishRules(c, view.i18n, rule().finishes ?? [], (next) =>
    write({ finishes: next.length ? next : undefined })
  );

  new Setting(c)
    .setName(t("options.formatScope"))
    .setDesc(t("options.formatScopeDesc"))
    .addDropdown((dd) => {
      dd.addOption("key", t("options.formatScope.key"));
      dd.addOption("row", t("options.formatScope.row"));
      dd.setValue(onRow() ? "row" : "key");
      dd.onChange((v) => {
        const current = rule();
        if (v === "row") {
          e.format = { ...current };
          const store = view.settings.formatProps;
          if (store) delete store[key];
        } else {
          const store = (view.settings.formatProps ??= {});
          store[key] = { ...current };
          e.format = undefined;
        }
        changed();
        redraw();
      });
    });
}

export function renderEntryOptionsBody(
  octx: OptionsCtx,
  onDone: () => void,
  onRemoved: () => void,
  opts: { multi?: boolean } = {}
): void {
  const { view, section, entry: e, container: c, changed, redraw } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const isProp = e.kind === "prop";

  // -- identity (per-entry only) --------------------------------------------
  if (!opts.multi) {
    c.createEl("h4", { text: isProp ? t("options.propertyHeading") : t("options.objectHeading") });
    if (isProp) {
      new Setting(c)
        .setName(t("options.property"))
        .setDesc(t("options.propertyDesc"))
        .addText((tx) => {
          tx.setValue((e.key as string) ?? "");
          new PropSuggest(view.app, tx.inputEl, view.i18n, () => view.propCandidates(true), (k) => {
            view.renameKey(e, k);
            // The suggestion list is still closing over this input: rebuilding
            // the rows underneath it now makes its teardown remove a node that
            // has already gone (NotFoundError), which aborts the rebuild.
            window.setTimeout(redraw, 0);
          }, false);
          tx.inputEl.addEventListener("change", () => {
            const v = tx.getValue().trim();
            if (v && v !== e.key) {
              view.renameKey(e, v);
              redraw();
            }
          });
        });
    }
    new Setting(c)
      .setName(t("options.label"))
      .setDesc(t("options.labelDesc", { default: view.defaultLabelFor(e) }))
      .addText((tx) => {
        tx.setPlaceholder(view.defaultLabelFor(e))
          .setValue((e.alias as string) ?? "")
          .onChange((v) => {
            e.alias = v.trim() || undefined;
            changed();
          });
      });
    if (isProp) {
      // Universal: every value type can hide its textual value (the label,
      // controls, sliders and ratings stay).
      new Setting(c).setName(t("options.showValue")).setDesc(t("options.showValueDesc")).addToggle((tg) => {
        tg.setValue(e.showValue !== false).onChange((v) => {
          e.showValue = v ? undefined : false;
          changed();
        });
      });
    }
  }

  // -- type-specific -------------------------------------------------------
  if (isProp) {
    setTypedText(c.createEl("h4"), view.i18n, view.settings, "options.typeHeading");
    const cur = view.resolveType(e);
    new Setting(c)
      .setName(t("options.dataType"))
      .setDesc(t("options.dataTypeDesc"))
      .addDropdown((d) => {
        for (const def of view.registries.valueTypes.all()) {
          if (def.deprecated && def.id !== cur) continue; // legacy types render, but are not offered
          d.addOption(def.id, def.name(view.i18n));
        }
        d.setValue(cur);
        d.onChange((v) => {
          // Data types are shared per property key (vault-wide): re-stamp
          // every layout and inline entry showing this key.
          if (e.key) setSharedDataType(view.settings, e.key, v);
          e.dataType = v;
          changed();
          redraw();
        });
      });
    view.registries.valueTypes.get(cur)?.renderOptions?.(octx);
    renderConstraints(octx, cur);
  } else {
    view.registries.entryKinds.get(e.kind)?.renderOptions?.(octx);
  }

  // -- appearance ----------------------------------------------------------
  const host = viewColorHost(view);
  c.createEl("h4", { text: t("options.appearanceHeading") });
  addIconSetting(view.app, view.i18n, c, t("options.icon"), () => e.icon, (v) => {
    e.icon = v;
    changed();
  });
  addColorSetting(host, c, t("options.iconColor"), "", () => e.iconColor, (v) => {
    e.iconColor = v;
    changed();
  });
  new Setting(c)
    .setName(t("options.showLabel"))
    .setDesc(t("options.showLabelDesc"))
    .addToggle((tg) => {
      tg.setValue(!e.hideLabel).onChange((v) => {
        e.hideLabel = v ? undefined : true;
        changed();
      });
    });
  // Every kind and data type: the button sits at the end of the row, after
  // whatever the type rendered.
  new Setting(c)
    .setName(t("options.menuBtn"))
    .setDesc(t("options.menuBtnDesc"))
    .addToggle((tg) => {
      tg.setValue(e.menuBtn === true).onChange((v) => {
        e.menuBtn = v ? true : undefined;
        changed();
      });
    });
  if (isProp) {
    new Setting(c)
      .setName(t("options.showType"))
      .setDesc(t("options.showTypeDesc"))
      .addToggle((tg) => {
        tg.setValue(e.showType !== false).onChange((v) => {
          e.showType = v ? undefined : false;
          changed();
        });
      });
  }
  new Setting(c)
    .setName(t("options.showWhenEmpty"))
    .setDesc(t("options.showWhenEmptyDesc"))
    .addToggle((tg) => {
      tg.setValue(e.hideIfEmpty === false).onChange((v) => {
        e.hideIfEmpty = v ? false : undefined;
        changed();
      });
    });
  new Setting(c)
    .setName(t("options.showCollapsed"))
    .setDesc(t("options.showCollapsedDesc"))
    .addToggle((tg) => {
      tg.setValue(e.showCollapsed === true).onChange((v) => {
        e.showCollapsed = v || undefined;
        changed();
      });
    });
  renderFormatting(octx);
  new Setting(c)
    .setName(t("options.showWhen"))
    .setDesc(t("options.showWhenDesc"))
    .addText((tx) => {
      const mark = () => {
        const v = tx.getValue().trim();
        tx.inputEl.toggleClass("ep-invalid", !!v && !parseExpr(v));
      };
      tx.setPlaceholder('Class == "Wizard"').setValue((e.showWhen as string) ?? "");
      mark();
      tx.onChange((v) => {
        e.showWhen = v.trim() || undefined;
        mark();
        changed();
      });
    });
  new Setting(c)
    .setName(t("options.labelSize"))
    .setDesc(t("options.sizeDesc"))
    .addSlider((sl) => {
      sl.setLimits(0, 40, 1)
        .setValue((e.labelSize as number) ?? 0)
        .onChange((v) => {
          e.labelSize = v || undefined;
          changed();
        });
    });
  new Setting(c)
    .setName(t("options.valueSize"))
    .setDesc(t("options.sizeDesc"))
    .addSlider((sl) => {
      sl.setLimits(0, 40, 1)
        .setValue((e.valueSize as number) ?? 0)
        .onChange((v) => {
          e.valueSize = v || undefined;
          changed();
        });
    });
  addColorSetting(host, c, t("options.labelColor"), "", () => e.labelColor, (v) => {
    e.labelColor = v;
    changed();
  });
  addColorSetting(host, c, t("options.valueColor"), "", () => e.valueColor, (v) => {
    e.valueColor = v;
    changed();
  });

  // -- Obsidian integration ------------------------------------------------
  if (isProp) {
    c.createEl("h4", { text: t("options.obsidianHeading") });
    new Setting(c)
      .setName(t("options.showInObsidian"))
      .setDesc(t("options.showInObsidianDesc"))
      .addToggle((tg) => {
        tg.setValue(!!e.showInObsidian).onChange((v) => {
          e.showInObsidian = v || undefined;
          changed();
        });
      });
  }

  // -- placement -----------------------------------------------------------
  if (!opts.multi) {
    c.createEl("h4", { text: t("options.placementHeading") });
    new Setting(c).addButton((b) =>
      b.setButtonText(t("entry.menu.remove")).then(destructive).onClick(() => {
        view.removeEntry(section, e);
        onRemoved();
      })
    );
  }
  new Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => onDone()));
}

export class EntryOptionsModal extends Modal {
  private snapshot = "";

  constructor(private view: ViewCtx, private section: Section, private entry: Entry, private file: TFile) {
    super(view.app);
  }

  private changed(): void {
    this.view.saveLayout();
    this.view.rerender();
  }

  onOpen(): void {
    asMobileSheet(this);
    this.snapshot = JSON.stringify(this.entry);
    this.draw();
  }

  private draw(): void {
    keepScroll(this.contentEl, () => this.paint());
  }

  private paint(): void {
    const c = this.contentEl;
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    c.empty();
    c.addClass("ep-options");
    c.createEl("h3", {
      text: t("options.title", { name: (this.entry.alias as string) || view.defaultLabelFor(this.entry) }),
    });
    const octx: OptionsCtx = {
      view,
      file: this.file,
      section: this.section,
      entry: this.entry,
      container: c,
      changed: () => this.changed(),
      redraw: () => this.draw(),
    };
    renderEntryOptionsBody(octx, () => this.close(), () => this.close());
    mountOptionsNav(c, view.i18n, { beside: c.closest<HTMLElement>(".modal") ?? c });
  }

  onClose(): void {
    this.contentEl.empty();
    if (JSON.stringify(this.entry) !== this.snapshot) {
      new ConfirmChangesModal(this.view.app, this.view.i18n, () => {}, () => {
        restoreFromSnapshot(this.entry, this.snapshot);
        this.changed();
      }).open();
    }
  }
}
