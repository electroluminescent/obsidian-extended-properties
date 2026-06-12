/**
 * Section options modal with tabs.
 *
 * The tab bar holds one tab for the section itself plus one per contained
 * entry, so everything in a section is editable from one place. Tabs can be
 * multi-selected (Ctrl/Cmd-click): the body then shows only the settings
 * *shared* by every selected target, and only a setting the user actually
 * touches is written — to all selected targets at once. Shared settings use
 * the same fields and i18n labels across data types and sections, so they
 * are genuinely "the same" setting wherever they appear.
 *
 * Closing with changes asks to keep or undo them (the snapshot covers the
 * section including its entries, so tab edits are undoable too).
 */

import { Modal, Setting, TFile } from "obsidian";
import type { OptionsCtx, ViewCtx } from "../../core/context";
import { Entry, LayoutMode, Section, SectionSize, sectionMode } from "../../core/model";
import { restoreFromSnapshot } from "../../utils/misc";
import { addColorSetting, addIconSetting } from "../components/setting-helpers";
import { ConfirmChangesModal } from "./dialogs";
import { renderEntryOptionsBody, viewColorHost } from "./entry-options";

const SECTION_TAB = "::section";

/** Types whose entries share the numeric option group. */
const NUMERIC_SET = new Set(["number", "decimal"]);
/** Types whose entries can carry modifiers / roll buttons. */
const MODIFIABLE_SET = new Set(["number", "decimal", "formula", "derived"]);

export class SectionOptionsModal extends Modal {
  private snapshot = "";
  private selected = new Set<string>([SECTION_TAB]);
  private file: TFile | null = null;

  constructor(private view: ViewCtx, private section: Section) {
    super(view.app);
  }

  private changed(): void {
    this.view.saveLayout();
    this.view.rerender();
  }

  onOpen(): void {
    this.snapshot = JSON.stringify(this.section);
    this.file = this.view.app.workspace.getActiveFile();
    this.draw();
  }

  // -- tab plumbing ---------------------------------------------------------

  private tabTargets(): Entry[] {
    return this.section.entries.filter((e) => this.selected.has(e.id));
  }

  private entryLabel(e: Entry): string {
    return (e.alias as string) || this.view.defaultLabelFor(e) || (e.key as string) || e.kind;
  }

  private drawTabs(c: HTMLElement): void {
    const t = this.view.i18n.t.bind(this.view.i18n);
    const bar = c.createDiv({ cls: "ep-tabs" });
    const mk = (id: string, label: string) => {
      const chip = bar.createDiv({ cls: "ep-tab", text: label });
      if (this.selected.has(id)) chip.addClass("is-active");
      chip.onclick = (ev) => {
        if (ev.ctrlKey || ev.metaKey) {
          if (this.selected.has(id)) {
            if (this.selected.size > 1) this.selected.delete(id);
          } else {
            this.selected.add(id);
          }
        } else {
          this.selected = new Set([id]);
        }
        this.draw();
      };
    };
    mk(SECTION_TAB, t("sectionOptions.tabSection"));
    for (const e of this.section.entries) {
      if (e.kind === "blank") continue;
      mk(e.id, this.entryLabel(e));
    }
    c.createEl("p", { cls: "setting-item-description", text: t("sectionOptions.tabsHint") });
  }

  private draw(): void {
    const c = this.contentEl;
    const t = this.view.i18n.t.bind(this.view.i18n);
    // Drop selections whose entries were removed meanwhile.
    for (const id of [...this.selected])
      if (id !== SECTION_TAB && !this.section.entries.some((e) => e.id === id)) this.selected.delete(id);
    if (!this.selected.size) this.selected.add(SECTION_TAB);

    c.empty();
    c.addClass("ep-options");
    c.createEl("h3", { text: t("sectionOptions.title", { name: this.section.title }) });
    this.drawTabs(c);

    const targets = this.tabTargets();
    const withSection = this.selected.has(SECTION_TAB);
    if (withSection && !targets.length) {
      this.drawSectionBody(c);
    } else if (!withSection && targets.length === 1 && this.file) {
      const entry = targets[0];
      const octx: OptionsCtx = {
        view: this.view,
        file: this.file,
        section: this.section,
        entry,
        container: c,
        changed: () => this.changed(),
        redraw: () => this.draw(),
      };
      renderEntryOptionsBody(octx, () => this.close(), () => this.draw());
    } else {
      this.drawSharedBody(c, targets, withSection);
    }
  }

  // -- shared multi-edit ------------------------------------------------------

  /**
   * Settings common to every selected target. Each control shows the first
   * target's value (with a "mixed" note when they differ) and writes to all
   * targets only when the user changes it.
   */
  private drawSharedBody(c: HTMLElement, ents: Entry[], withSection: boolean): void {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    const targets: Record<string, unknown>[] = withSection
      ? [this.section as unknown as Record<string, unknown>, ...ents]
      : [...ents];

    c.createEl("h4", { text: t("options.sharedHeading", { n: targets.length }) });

    const read = <T,>(get: (x: Record<string, unknown>) => T): { v: T; mixed: boolean } => {
      const first = get(targets[0]);
      return { v: first, mixed: targets.some((x) => get(x) !== first) };
    };
    const apply = (set: (x: Record<string, unknown>) => void): void => {
      for (const x of targets) set(x);
      this.changed();
    };
    const mixedDesc = (mixed: boolean) => (mixed ? t("options.mixed") : "");

    const host = viewColorHost(view);

    // Shared by sections and every entry kind/data type alike.
    addIconSetting(view.app, view.i18n, c, t("options.icon"),
      () => read((x) => x["icon"] as string | undefined).v,
      (v) => apply((x) => (x["icon"] = v)));
    addColorSetting(host, c, t("options.iconColor"), "",
      () => read((x) => x["iconColor"] as string | undefined).v,
      (v) => apply((x) => (x["iconColor"] = v)));
    {
      const s = read((x) => !!x["hideLabel"]);
      new Setting(c).setName(t("options.hideLabel")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => (x["hideLabel"] = v || undefined)));
      });
    }
    {
      const s = read((x) => x["hideIfEmpty"] !== false);
      new Setting(c).setName(t("options.hideIfEmpty")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => (x["hideIfEmpty"] = v ? undefined : false)));
      });
    }

    if (!withSection) {
      // Entry-only appearance.
      const sizeRow = (nameKey: string, field: string) => {
        const s = read((x) => (x[field] as number) ?? 0);
        new Setting(c)
          .setName(t(nameKey))
          .setDesc(s.mixed ? t("options.mixed") : t("options.sizeDesc"))
          .addSlider((sl) => {
            sl.setLimits(0, 40, 1)
              .setValue(s.v)
              .setDynamicTooltip()
              .onChange((v) => apply((x) => (x[field] = v || undefined)));
          });
      };
      sizeRow("options.labelSize", "labelSize");
      sizeRow("options.valueSize", "valueSize");
      addColorSetting(host, c, t("options.labelColor"), "",
        () => read((x) => x["labelColor"] as string | undefined).v,
        (v) => apply((x) => (x["labelColor"] = v)));
      addColorSetting(host, c, t("options.valueColor"), "",
        () => read((x) => x["valueColor"] as string | undefined).v,
        (v) => apply((x) => (x["valueColor"] = v)));

      const allProps = ents.every((e) => e.kind === "prop");
      if (allProps) {
        const s = read((x) => !!x["showInObsidian"]);
        new Setting(c).setName(t("options.showInObsidian")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
          tg.setValue(s.v).onChange((v) => apply((x) => (x["showInObsidian"] = v || undefined)));
        });

        const types = ents.map((e) => view.resolveType(e));
        if (types.every((ty) => NUMERIC_SET.has(ty))) {
          c.createEl("h4", { text: t("options.numberHeading") });
          const sl = read((x) => !!x["slider"]);
          new Setting(c).setName(t("options.showSlider")).setDesc(mixedDesc(sl.mixed)).addToggle((tg) => {
            tg.setValue(sl.v).onChange((v) => apply((x) => (x["slider"] = v || undefined)));
          });
          const st = read((x) => x["steppers"] !== false);
          new Setting(c).setName(t("options.showSteppers")).setDesc(mixedDesc(st.mixed)).addToggle((tg) => {
            tg.setValue(st.v).onChange((v) => apply((x) => (x["steppers"] = v ? undefined : false)));
          });
          const cu = read((x) => (x["sliderCurve"] as string) || "linear");
          new Setting(c).setName(t("options.sliderCurve")).setDesc(mixedDesc(cu.mixed)).addDropdown((d) => {
            d.addOption("linear", t("options.curveLinear"));
            d.addOption("root", t("options.curveRoot"));
            d.addOption("exp", t("options.curveExp"));
            d.setValue(cu.v);
            d.onChange((v) => apply((x) => (x["sliderCurve"] = v === "linear" ? undefined : v)));
          });
          const numRow = (nameKey: string, field: string) => {
            const s = read((x) => x[field] as number | undefined);
            new Setting(c)
              .setName(t(nameKey))
              .setDesc(s.mixed ? t("options.mixed") : t("options.rangeAuto"))
              .addText((tx) => {
                tx.setValue(s.mixed || s.v === undefined ? "" : String(s.v)).onChange((v) => {
                  const n = Number(v);
                  const val = v.trim() === "" || !Number.isFinite(n) ? undefined : n;
                  apply((x) => (x[field] = val));
                });
              });
          };
          numRow("options.minimum", "min");
          numRow("options.maximum", "max");
          const cl = read((x) => !!x["clamp"]);
          new Setting(c).setName(t("options.clamp")).setDesc(mixedDesc(cl.mixed)).addToggle((tg) => {
            tg.setValue(cl.v).onChange((v) => apply((x) => (x["clamp"] = v || undefined)));
          });
        }
        if (types.every((ty) => MODIFIABLE_SET.has(ty))) {
          const ro = read((x) => !!x["roll"]);
          new Setting(c).setName(t("roll.options.rollButton")).setDesc(mixedDesc(ro.mixed)).addToggle((tg) => {
            tg.setValue(ro.v).onChange((v) => apply((x) => (x["roll"] = v || undefined)));
          });
        }
      }
    }

    new Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
  }

  // -- the section's own tab ---------------------------------------------------

  private drawSectionBody(c: HTMLElement): void {
    const s = this.section;
    const t = this.view.i18n.t.bind(this.view.i18n);
    const host = viewColorHost(this.view);

    // -- identity -----------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.sectionHeading") });
    new Setting(c)
      .setName(t("sectionOptions.name"))
      .setDesc(t("sectionOptions.nameDesc"))
      .addText((tx) => {
        tx.setPlaceholder(t("section.namePlaceholder"))
          .setValue(s.title)
          .onChange((v) => {
            s.title = v.trim() || t("section.namePlaceholder");
            this.changed();
          });
      });
    addIconSetting(this.view.app, this.view.i18n, c, t("options.icon"), () => s.icon, (v) => {
      s.icon = v;
      this.changed();
    });
    addColorSetting(host, c, t("options.iconColor"), "", () => s.iconColor, (v) => {
      s.iconColor = v;
      this.changed();
    });
    new Setting(c).setName(t("options.hideLabel")).addToggle((tg) => {
      tg.setValue(!!s.hideLabel).onChange((v) => {
        s.hideLabel = v || undefined;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.collapsible")).addToggle((tg) => {
      tg.setValue(s.collapsible !== false).onChange((v) => {
        s.collapsible = v;
        if (!v) s.collapsed = false;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.dividers")).addToggle((tg) => {
      tg.setValue(!!s.dividers).onChange((v) => {
        s.dividers = v || undefined;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.vdividers")).addToggle((tg) => {
      tg.setValue(!!s.vdividers).onChange((v) => {
        s.vdividers = v || undefined;
        this.changed();
      });
    });
    new Setting(c)
      .setName(t("options.hideIfEmpty"))
      .setDesc(t("sectionOptions.hideIfEmptyDesc"))
      .addToggle((tg) => {
        tg.setValue(s.hideIfEmpty !== false).onChange((v) => {
          s.hideIfEmpty = v ? undefined : false;
          this.changed();
        });
      });

    // -- layout --------------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.layoutHeading") });
    const mode = sectionMode(s);
    new Setting(c)
      .setName(t("sectionOptions.layout"))
      .setDesc(t("sectionOptions.layoutDesc"))
      .addDropdown((d) => {
        d.addOption("list", t("layout.list"));
        d.addOption("columns", t("layout.columns"));
        d.addOption("grid", t("layout.grid"));
        d.setValue(mode);
        d.onChange((v) => {
          s.layoutMode = v as LayoutMode;
          this.changed();
          this.draw();
        });
      });
    const colSet = new Setting(c).setName(t("sectionOptions.columns"));
    colSet.addText((tx) => {
      tx.setDisabled(mode === "list");
      tx.setValue(String(s.columns || 2)).onChange((v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n > 0) {
          s.columns = n;
          this.changed();
        }
      });
    });
    if (mode === "list") colSet.settingEl.addClass("ep-disabled");
    const rowSet = new Setting(c).setName(t("sectionOptions.rows")).setDesc(t("sectionOptions.rowsDesc"));
    rowSet.addText((tx) => {
      tx.setDisabled(mode !== "grid");
      tx.setValue(String(s.rows || 0)).onChange((v) => {
        const n = parseInt(v);
        s.rows = Number.isFinite(n) && n > 0 ? n : undefined;
        this.changed();
      });
    });
    if (mode !== "grid") rowSet.settingEl.addClass("ep-disabled");
    new Setting(c).setName(t("sectionOptions.transparent")).addToggle((tg) => {
      tg.setValue(!!s.transparent).onChange((v) => {
        s.transparent = v || undefined;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.sticky")).addToggle((tg) => {
      tg.setValue(!!s.sticky).onChange((v) => {
        s.sticky = v || undefined;
        this.changed();
      });
    });
    new Setting(c)
      .setName(t("sectionOptions.height"))
      .setDesc(t("sectionOptions.heightDesc"))
      .addDropdown((d) => {
        d.addOption("unlimited", t("size.unlimited"));
        d.addOption("s", t("size.smallRows"));
        d.addOption("m", t("size.mediumRows"));
        d.addOption("l", t("size.largeRows"));
        d.setValue(s.size || "unlimited");
        d.onChange((v) => {
          s.size = v as SectionSize;
          this.changed();
        });
      });

    // -- colors --------------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.colorsHeading") });
    addColorSetting(host, c, t("sectionOptions.accent"), t("sectionOptions.accentDesc"), () => s.accent, (v) => {
      s.accent = v;
      this.changed();
    });
    addColorSetting(host, c, t("sectionOptions.background"), "", () => s.bg, (v) => {
      s.bg = v;
      this.changed();
    });
    addColorSetting(host, c, t("sectionOptions.controls"), t("sectionOptions.controlsDesc"), () => s.controlColor, (v) => {
      s.controlColor = v;
      this.changed();
    });

    // -- title ----------------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.titleHeading") });
    new Setting(c)
      .setName(t("sectionOptions.titleSize"))
      .setDesc(t("options.sizeDesc"))
      .addSlider((sl) => {
        sl.setLimits(0, 48, 1)
          .setValue(s.titleSize ?? 0)
          .setDynamicTooltip()
          .onChange((v) => {
            s.titleSize = v || undefined;
            this.changed();
          });
      });
    new Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
    if (JSON.stringify(this.section) !== this.snapshot) {
      new ConfirmChangesModal(this.view.app, this.view.i18n, () => {}, () => {
        restoreFromSnapshot(this.section as unknown as Record<string, unknown>, this.snapshot);
        this.changed();
      }).open();
    }
  }
}
