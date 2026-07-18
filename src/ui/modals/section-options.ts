/**
 * Section options modal with tabs.
 *
 * The tab bar holds one tab for the section itself plus one per contained
 * entry, so everything in a section is editable from one place. Tabs can be
 * multi-selected (Ctrl/Cmd-click): the body then shows only the settings
 * *shared* by every selected target, and only a setting the user actually
 * touches is written - to all selected targets at once. Shared settings use
 * the same fields and i18n labels across data types and sections, so they
 * are genuinely "the same" setting wherever they appear.
 *
 * Closing with changes asks to keep or undo them (the snapshot covers the
 * section including its entries, so tab edits are undoable too).
 */

import { Modal, Setting, TFile, setIcon } from "obsidian";
import type { OptionsCtx, ViewCtx } from "../../core/context";
import { Entry, LayoutMode, Section, SectionPin, SectionSize, sectionMode, sectionPin } from "../../core/model";
import { restoreFromSnapshot } from "../../utils/misc";
import { addColorSetting, addIconSetting } from "../components/setting-helpers";
import { asMobileSheet } from "../components/long-press";
import { ConfirmChangesModal } from "./dialogs";
import { renderEntryOptionsBody, viewColorHost } from "./entry-options";
import { parseExpr } from "../../core/expr";

const SECTION_TAB = "::section";

/** Types whose entries share the numeric option group. */
const NUMERIC_SET = new Set(["number", "decimal"]);
/** Types whose entries can carry modifiers / roll buttons. */
const MODIFIABLE_SET = new Set(["number", "decimal", "formula", "derived"]);

export class SectionOptionsModal extends Modal {
  private snapshot = "";
  private selected = new Set<string>([SECTION_TAB]);
  private file: TFile | null = null;
  /** Tap-to-toggle selection mode (the touch alternative to drag/Ctrl). */
  private multiTap = false;
  /** Anchor for Shift ranges and drag selection. */
  private anchorId: string | null = null;

  /** @param initialTab entry id whose tab opens pre-selected. */
  constructor(private view: ViewCtx, private section: Section, initialTab?: string) {
    super(view.app);
    if (initialTab && section.entries.some((e) => e.id === initialTab)) {
      this.selected = new Set([initialTab]);
      this.anchorId = initialTab;
    }
  }

  private changed(): void {
    this.view.saveLayout();
    this.view.rerender();
  }

  onOpen(): void {
    asMobileSheet(this);
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
    const tabbable = this.section.entries.filter((e) => e.kind !== "blank");
    const order: string[] = [SECTION_TAB, ...tabbable.map((e) => e.id)];
    const chips = new Map<string, HTMLElement>();

    let dragging = false;
    let dragBase = new Set<string>();
    let dragAnchor: string | null = null;

    const applySelection = () => {
      for (const [id, el] of chips) el.toggleClass("is-active", this.selected.has(id));
    };
    const rangeIds = (a: string, b: string): string[] => {
      const i = order.indexOf(a);
      const j = order.indexOf(b);
      if (i < 0 || j < 0) return [b];
      const [lo, hi] = i < j ? [i, j] : [j, i];
      return order.slice(lo, hi + 1);
    };

    const mk = (parent: HTMLElement, id: string, label: string) => {
      const chip = parent.createDiv({ cls: "ep-tab", text: label });
      chips.set(id, chip);
      if (this.selected.has(id)) chip.addClass("is-active");
      chip.addEventListener("pointerdown", (ev: PointerEvent) => {
        if (ev.button !== 0) return;
        ev.preventDefault();
        if (this.multiTap) {
          // Touch path: every tap toggles membership - no drag, no modifier
          // keys needed. The section tab stays a plain switch.
          if (id === SECTION_TAB) {
            this.selected = new Set([SECTION_TAB]);
          } else if (this.selected.has(id)) {
            if (this.selected.size > 1) this.selected.delete(id);
          } else {
            this.selected.add(id);
            this.selected.delete(SECTION_TAB);
          }
          this.anchorId = id;
          this.draw();
          return;
        }
        if (ev.shiftKey && this.anchorId) {
          const range = rangeIds(this.anchorId, id);
          this.selected = ev.ctrlKey || ev.metaKey ? new Set([...this.selected, ...range]) : new Set(range);
          dragAnchor = this.anchorId;
        } else if (ev.ctrlKey || ev.metaKey) {
          if (this.selected.has(id)) {
            if (this.selected.size > 1) this.selected.delete(id);
          } else {
            this.selected.add(id);
          }
          this.anchorId = id;
          dragAnchor = id;
        } else {
          this.selected = new Set([id]);
          this.anchorId = id;
          dragAnchor = id;
        }
        // Drag across tabs extends the selection from the anchor.
        dragging = true;
        dragBase = ev.ctrlKey || ev.metaKey ? new Set(this.selected) : new Set<string>();
        applySelection();
        activeDocument.addEventListener(
          "pointerup",
          () => {
            dragging = false;
            this.draw();
          },
          { once: true }
        );
      });
      chip.addEventListener("pointerenter", () => {
        if (!dragging || !dragAnchor) return;
        this.selected = new Set([...dragBase, ...rangeIds(dragAnchor, id)]);
        applySelection();
      });
    };

    const bar = c.createDiv({ cls: "ep-tabs" });
    // Touch alternative to drag/Ctrl selection: with the toggle on, taps
    // toggle each property in and out of the selection.
    const multiBtn = bar.createDiv({ cls: "ep-tab ep-tab-multi" + (this.multiTap ? " is-active" : "") });
    setIcon(multiBtn.createSpan(), "copy-check");
    multiBtn.setAttr("title", t("sectionOptions.multiSelect"));
    multiBtn.setAttr("aria-label", t("sectionOptions.multiSelect"));
    multiBtn.onclick = () => {
      this.multiTap = !this.multiTap;
      this.draw();
    };
    mk(bar, SECTION_TAB, t("sectionOptions.tabSection"));

    // How to divide the property tabs: by column, by row, or by data type.
    const mode = sectionMode(this.section);
    const groupMode =
      this.section.tabGroup ?? (mode === "columns" ? "column" : mode === "grid" ? "row" : "type");
    const sel = bar.createEl("select", { cls: "dropdown ep-tab-groupsel" });
    sel.setAttr("aria-label", t("sectionOptions.groupBy"));
    for (const [v, key] of [
      ["column", "sectionOptions.groupColumn"],
      ["row", "sectionOptions.groupRow"],
      ["type", "sectionOptions.groupType"],
    ] as [string, string][]) {
      const opt = sel.createEl("option", { text: t(key) });
      opt.value = v;
    }
    sel.value = groupMode;
    sel.onchange = () => {
      this.section.tabGroup = sel.value as "column" | "row" | "type";
      this.changed();
      this.draw();
    };

    const groups = this.tabGroups(groupMode);
    for (const g of groups) {
      if (!g.ents.length) continue;
      const row = c.createDiv({ cls: "ep-tabs" });
      if (g.label) row.createSpan({ cls: "ep-tab-collabel", text: g.label });
      for (const e of g.ents) mk(row, e.id, this.entryLabel(e));
    }
    if (!groups.length) for (const e of tabbable) mk(bar, e.id, this.entryLabel(e));
    c.createEl("p", { cls: "setting-item-description", text: t("sectionOptions.tabsHint") });
  }

  /** Divide the entries into labeled tab groups per the chosen mode. */
  private tabGroups(groupMode: string): { label: string; ents: Entry[] }[] {
    const t = this.view.i18n.t.bind(this.view.i18n);
    const mode = sectionMode(this.section);
    const all = this.section.entries;
    const ncol = Math.max(1, this.section.columns || 1);
    const visible = (es: Entry[]) => es.filter((e) => e.kind !== "blank");
    const out: { label: string; ents: Entry[] }[] = [];

    if (groupMode === "column") {
      if (mode === "grid") {
        for (let cc = 0; cc < ncol; cc++)
          out.push({
            label: t("sectionOptions.columnN", { n: cc + 1 }),
            ents: visible(all.filter((_, i) => i % ncol === cc)),
          });
      } else {
        const per = Math.max(1, Math.ceil(all.length / ncol));
        for (let cc = 0; cc < ncol; cc++)
          out.push({
            label: t("sectionOptions.columnN", { n: cc + 1 }),
            ents: visible(all.slice(cc * per, (cc + 1) * per)),
          });
      }
    } else if (groupMode === "row") {
      if (mode === "columns") {
        const per = Math.max(1, Math.ceil(all.length / ncol));
        for (let r = 0; r < per; r++) {
          const row: Entry[] = [];
          for (let cc = 0; cc < ncol; cc++) {
            const e = all[cc * per + r];
            if (e) row.push(e);
          }
          out.push({ label: t("sectionOptions.rowN", { n: r + 1 }), ents: visible(row) });
        }
      } else {
        const width = mode === "grid" ? ncol : 1;
        for (let i = 0; i < all.length; i += width)
          out.push({
            label: t("sectionOptions.rowN", { n: Math.floor(i / width) + 1 }),
            ents: visible(all.slice(i, i + width)),
          });
      }
    } else {
      // By data type (non-property objects group under their kind label).
      const byType = new Map<string, Entry[]>();
      for (const e of visible(all)) {
        const label =
          e.kind === "prop"
            ? this.view.registries.valueTypes.get(this.view.resolveType(e))?.name(this.view.i18n) ??
              this.view.resolveType(e)
            : this.view.defaultLabelFor(e);
        if (!byType.has(label)) byType.set(label, []);
        byType.get(label)!.push(e);
      }
      for (const [label, ents] of byType) out.push({ label, ents });
    }
    return out.filter((g) => g.ents.length);
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
    } else if (
      !withSection &&
      targets.length > 1 &&
      this.file &&
      targets.every((e) => e.kind === "prop") &&
      new Set(targets.map((e) => this.view.resolveType(e))).size === 1
    ) {
      // Same data type everywhere: show the *full* option set, multi-target.
      this.drawMultiSameType(c, targets);
    } else {
      this.drawSharedBody(c, targets, withSection);
    }
  }

  /**
   * Multi-edit for selections that share one data type: every option is
   * visible. The UI edits a proxy of the first entry; whenever a setting
   * changes, exactly the fields that changed are copied to all selected
   * entries (identity fields are excluded). Settings whose values differ
   * across the selection are listed in the note on top - changing one
   * writes it to all.
   */
  private drawMultiSameType(c: HTMLElement, ents: Entry[]): void {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    const SKIP = new Set(["id", "key", "alias", "__multi"]);

    const typeId = view.resolveType(ents[0]);
    const typeName = view.registries.valueTypes.get(typeId)?.name(view.i18n) ?? typeId;
    const allKeys = new Set<string>();
    for (const e of ents) for (const k of Object.keys(e)) if (!SKIP.has(k)) allKeys.add(k);
    const mixed = [...allKeys].filter((k) => {
      const first = JSON.stringify((ents[0] as Record<string, unknown>)[k]);
      return ents.some((e) => JSON.stringify((e as Record<string, unknown>)[k]) !== first);
    });
    let note = t("options.multiNote", { n: ents.length, type: typeName });
    if (mixed.length) note += " " + t("options.multiMixed", { list: mixed.sort().join(", ") });
    c.createEl("p", { cls: "setting-item-description ep-multi-note", text: note });

    // Proxy of the first entry; diffs propagate to every selected entry.
    const proxy = JSON.parse(JSON.stringify(ents[0])) as Entry;
    (proxy as Record<string, unknown>)["__multi"] = true;
    let snap = JSON.stringify(proxy);
    const applyDiff = () => {
      const cur = proxy as Record<string, unknown>;
      const old = JSON.parse(snap) as Record<string, unknown>;
      for (const k of new Set([...Object.keys(cur), ...Object.keys(old)])) {
        if (SKIP.has(k)) continue;
        const now = JSON.stringify(cur[k]);
        if (now === JSON.stringify(old[k])) continue;
        for (const e of ents) {
          if (cur[k] === undefined) delete (e as Record<string, unknown>)[k];
          else (e as Record<string, unknown>)[k] = JSON.parse(now);
        }
      }
      snap = JSON.stringify(proxy);
      this.changed();
    };

    const octx: OptionsCtx = {
      view,
      file: this.file!,
      section: this.section,
      entry: proxy,
      container: c,
      changed: applyDiff,
      redraw: () => this.draw(),
    };
    renderEntryOptionsBody(octx, () => this.close(), () => this.draw(), { multi: true });
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
      const s = read((x) => !x["hideLabel"]);
      new Setting(c).setName(t("options.showLabel")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => (x["hideLabel"] = v ? undefined : true)));
      });
    }
    {
      const s = read((x) => x["hideIfEmpty"] === false);
      new Setting(c).setName(t("options.showWhenEmpty")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => (x["hideIfEmpty"] = v ? false : undefined)));
      });
    }
    if (withSection) {
      // Section-level conditional visibility (writes only to the section).
      const sec = this.section;
      new Setting(c)
        .setName(t("options.showWhen"))
        .setDesc(t("sectionOptions.showWhenDesc"))
        .addText((tx) => {
          const mark = () => {
            const v = tx.getValue().trim();
            tx.inputEl.toggleClass("ep-invalid", !!v && !parseExpr(v));
          };
          tx.setPlaceholder('Class == "Wizard"').setValue(sec.showWhen ?? "");
          mark();
          tx.onChange((v) => {
            sec.showWhen = v.trim() || undefined;
            mark();
            this.changed();
          });
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
        {
          const ty = read((x) => x["showType"] !== false);
          new Setting(c).setName(t("options.showType")).setDesc(mixedDesc(ty.mixed)).addToggle((tg) => {
            tg.setValue(ty.v).onChange((v) => apply((x) => (x["showType"] = v ? undefined : false)));
          });
        }

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
          const ch = read((x) => x["showChain"] !== false);
          new Setting(c).setName(t("mods.showChain")).setDesc(mixedDesc(ch.mixed)).addToggle((tg) => {
            tg.setValue(ch.v).onChange((v) => apply((x) => (x["showChain"] = v ? undefined : false)));
          });
          const di = read((x) => x["showDice"] !== false);
          new Setting(c).setName(t("mods.showDice")).setDesc(mixedDesc(di.mixed)).addToggle((tg) => {
            tg.setValue(di.v).onChange((v) => apply((x) => (x["showDice"] = v ? undefined : false)));
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
    new Setting(c).setName(t("options.showLabel")).addToggle((tg) => {
      tg.setValue(!s.hideLabel).onChange((v) => {
        s.hideLabel = v ? undefined : true;
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
    if (sectionMode(s) === "grid") {
      new Setting(c)
        .setName(t("sectionOptions.trimEmptyRows"))
        .setDesc(t("sectionOptions.trimEmptyRowsDesc"))
        .addToggle((tg) => {
          tg.setValue(!!s.trimEmptyRows).onChange((v) => {
            s.trimEmptyRows = v || undefined;
            this.view.saveLayout();
            this.view.rerender();
          });
        });
    }
    new Setting(c).setName(t("sectionOptions.vdividers")).addToggle((tg) => {
      tg.setValue(!!s.vdividers).onChange((v) => {
        s.vdividers = v || undefined;
        this.changed();
      });
    });
    new Setting(c)
      .setName(t("options.showWhenEmpty"))
      .setDesc(t("sectionOptions.showWhenEmptyDesc"))
      .addToggle((tg) => {
        tg.setValue(s.hideIfEmpty === false).onChange((v) => {
          s.hideIfEmpty = v ? false : undefined;
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
    new Setting(c)
      .setName(t("sectionOptions.pin"))
      .setDesc(t("sectionOptions.pinDesc"))
      .addDropdown((d) => {
        d.addOption("body", t("pin.body"));
        d.addOption("header", t("pin.header"));
        d.addOption("footer", t("pin.footer"));
        d.setValue(sectionPin(s));
        d.onChange((v) => {
          s.pin = v === "body" ? undefined : (v as SectionPin);
          s.sticky = undefined; // superseded legacy flag
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
