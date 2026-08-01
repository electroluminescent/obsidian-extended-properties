/**
 * The plugin's settings tab: note types, defaults, modifier building
 * blocks, short forms, typography, language (locale + per-string
 * overrides), Obsidian-panel integration, always-hidden properties, and
 * feature module toggles.
 */

import { App, Notice, PluginSettingTab, Setting, setIcon, SettingDefinitionItem } from "obsidian";
import type ExtendedPropertiesPlugin from "../main";
import { TYPE_FEATURES, UI_FEATURES } from "../core/features";
import { COLOR_SPACES, ColorSpace } from "../utils/color";
import type { SectionSize } from "../core/model";
import { typeIconOf } from "../core/model";
import { defaultAbbr, defaultDerivations, referenceSuggestions } from "../core/influences";
import { compileFormula } from "../utils/formula";
import { genId } from "../utils/misc";
import { RefSuggest } from "./components/suggest";
import { destructive } from "./components/setting-helpers";
import { ConfirmModal, TextPromptModal } from "./modals/dialogs";
import { IconPickerModal } from "./modals/icon-picker";
import { setTypedText, tintTypeNames, typedText, typeName } from "./components/type-label";
import { RenameTypeModal } from "./modals/rename-type";
import { mobileGestures } from "./components/hold-config";
import { ACTIVATION_SURFACES, activationFor, setActivation } from "../core/activation";
import { ImportModal } from "./modals/transfer-modal";
import { packType } from "../core/transfer";
import { segsToText, textToSegs } from "../features/rolling/macros";
import { DICE_STYLES } from "../features/rolling/dice-styles";

/** Max override rows rendered at once (the list is searchable). */
const OVERRIDE_ROW_LIMIT = 25;

/** Section headings, offered to the settings search as aliases. */
/**
 * How the body's section headings group into tabs, in tab order.
 *
 * Sections are matched by their rendered heading text (both sides go through
 * `t()`, so a translation moves them together). A heading no group claims gets
 * a tab of its own, appended after these - a new section is never lost by
 * forgetting to list it here.
 */
const TAB_GROUPS: { label: string; sections: string[] }[] = [
  { label: "settings.tab.types", sections: ["settings.typesHeading", "settings.defaultsHeading"] },
  { label: "settings.tab.sections", sections: ["settings.newSectionHeading"] },
  { label: "settings.tab.modifiers", sections: ["settings.derivationsHeading"] },
  { label: "settings.abbrHeading", sections: ["settings.abbrHeading"] },
  {
    label: "settings.tab.rolling",
    sections: ["settings.diceHeading", "settings.rollsHeading", "settings.macrosHeading"],
  },
  { label: "settings.activationHeading", sections: ["settings.activationHeading"] },
  {
    label: "settings.tab.interface",
    sections: [
      "settings.typographyHeading",
      "settings.featuresUi",
      "settings.obsidianHeading",
      "settings.hiddenHeading",
      "settings.languageHeading",
    ],
  },
  { label: "settings.featuresHeading", sections: ["settings.featuresHeading", "settings.featuresTypes"] },
  { label: "settings.resetHeading", sections: ["settings.resetHeading"] },
];

const SEARCH_SECTIONS = [
  "settings.typesHeading", "settings.defaultsHeading", "settings.newSectionHeading",
  "settings.derivationsHeading", "settings.abbrHeading", "settings.diceHeading",
  "settings.rollsHeading", "settings.macrosHeading", "settings.typographyHeading",
  "settings.languageHeading", "settings.activationHeading", "settings.obsidianHeading",
  "settings.hiddenHeading",
  "settings.featuresHeading", "settings.featuresTypes", "settings.featuresUi",
  "settings.resetHeading",
];

export class EPSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ExtendedPropertiesPlugin) {
    super(app, plugin);
  }

  /**
   * Obsidian 1.13 renders a tab from its setting DEFINITIONS and only falls
   * back to display() when there are none - and in 1.13.4 that fallback does
   * not fire for this tab, leaving an empty placeholder. So the tab declares
   * a single `render` item and draws itself inside that row: several sections
   * are bespoke editors rather than name/control pairs, and the item carries
   * every section heading as a search alias so the settings search can still
   * find and open it.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    return [
      {
        name: this.plugin.manifest.name,
        aliases: SEARCH_SECTIONS.map((k) => t(k)),
        render: (setting) => {
          const host = setting.settingEl;
          host.empty();
          host.removeClass("setting-item");
          host.addClass("ep-settings-host");
          this.renderTarget = host;
          this.render();
          return () => {
            this.renderTarget = null;
          };
        },
      },
    ];
  }

  /** Fallback for Obsidian versions older than 1.13. */
  display(): void {
    if (this.renderTarget) return; // already drawn by the definition above
    this.render();
  }

  /** Every render ends by tinting the configured type name in the prose. */
  private tint(): void {
    tintTypeNames(this.host, this.plugin.settings);
  }

  /** Where the tab draws: the definition's row, else the tab container. */
  private renderTarget: HTMLElement | null = null;

  private get host(): HTMLElement {
    return this.renderTarget ?? this.containerEl;
  }

  /** Heading text of the open tab (survives re-renders; "" = the first one). */
  private activeTab = "";
  /** Current filter text, likewise. */
  private query = "";
  /** Whether the filter box had focus when the tab last rebuilt. */
  private queryFocused = false;

  render(): void {
    this.renderBody();
    this.tabify();
    this.tint();
    this.alignLooseText();
  }

  /**
   * Turn the rendered body into tabs with a filter box.
   *
   * The body is written as one long document - which is how it stays readable
   * to write - and partitioned here by its headings, which are grouped into
   * tabs by {@link TAB_GROUPS}. The headings stay visible inside a tab, since a
   * tab may hold several. A heading no group claims still gets a tab of its
   * own, so a new section is never lost, and the two views (one tab at a time,
   * or every match of a search) are the same nodes moved around rather than a
   * second rendering path that could drift.
   */
  private tabify(): void {
    const host = this.host;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const nodes = Array.from(host.children) as HTMLElement[];

    const first = nodes.findIndex((n) => n.hasClass("setting-item-heading"));
    if (first < 0) return;

    const chrome = host.createDiv({ cls: "ep-settings-chrome" });
    const body = host.createDiv({ cls: "ep-settings-panels" });

    /** One heading and what belongs to it: its rows, and its loose copy. */
    interface Sect { title: string; heading: HTMLElement; rows: HTMLElement[]; loose: HTMLElement[] }
    interface Group { title: string; panel: HTMLElement; sects: Sect[] }
    const groups: Group[] = [];
    /** Tab for a heading title, creating one for anything unclaimed. */
    const tabFor = (title: string): Group => {
      const spec = TAB_GROUPS.find((g) => g.sections.some((k) => t(k) === title));
      const label = spec ? t(spec.label) : title;
      const found = groups.find((g) => g.title === label);
      if (found) return found;
      const made = { title: label, panel: body.createDiv({ cls: "ep-settings-panel" }), sects: [] };
      groups.push(made);
      return made;
    };

    let group: Group | null = null;
    let sect: Sect | null = null;
    for (const node of nodes.slice(first)) {
      if (node.hasClass("setting-item-heading")) {
        const title = node.textContent?.trim() ?? "";
        group = tabFor(title);
        sect = { title, heading: node, rows: [], loose: [] };
        group.sects.push(sect);
      } else if (node.hasClass("setting-item")) sect?.rows.push(node);
      else sect?.loose.push(node);
      group?.panel.appendChild(node);
    }
    if (!groups.length) return;

    // Tabs follow TAB_GROUPS rather than the order the body happens to render
    // in; a tab nothing claimed sits just before the last listed one (Reset).
    const rank = (title: string): number => {
      const i = TAB_GROUPS.findIndex((g) => t(g.label) === title);
      return i >= 0 ? i : TAB_GROUPS.length - 1.5;
    };
    groups.sort((a, b) => rank(a.title) - rank(b.title));
    for (const g of groups) body.appendChild(g.panel);

    // -- filter ---------------------------------------------------------------
    const row = chrome.createDiv({ cls: "ep-settings-searchrow" });
    const search = row.createEl("input", { cls: "ep-edit-input ep-settings-search" });
    search.type = "search";
    search.placeholder = t("settings.searchPlaceholder");
    search.value = this.query;
    search.setAttr("aria-label", t("settings.searchPlaceholder"));
    // A clear button rather than only Escape: the settings window claims that
    // key before a field inside it ever sees it.
    const clear = row.createEl("button", { cls: "ep-settings-clear" });
    setIcon(clear, "x");
    clear.setAttr("aria-label", t("settings.searchClear"));
    clear.setAttr("title", t("settings.searchClear"));
    clear.onclick = () => {
      search.value = "";
      this.query = "";
      search.focus();
      apply();
    };

    // -- tabs -----------------------------------------------------------------
    const bar = chrome.createDiv({ cls: "ep-settings-tabs" });
    const active = groups.some((g) => g.title === this.activeTab) ? this.activeTab : groups[0].title;
    this.activeTab = active;
    const buttons = groups.map((g) => {
      const b = bar.createEl("button", { cls: "ep-settings-tab", text: g.title });
      b.setAttr("role", "tab");
      b.onclick = () => {
        this.activeTab = g.title;
        this.query = "";
        search.value = "";
        apply();
        // The bar scrolls with the page, so bring it back into view: a tab
        // opened from halfway down should start at its top.
        chrome.scrollIntoView({ block: "start" });
      };
      return b;
    });

    /** Show the open tab, or - while filtering - every row that matches. */
    const apply = (): void => {
      const q = this.query.trim().toLowerCase();
      host.toggleClass("ep-settings-filtering", !!q);
      clear.toggleClass("ep-hidden", !this.query);
      buttons.forEach((b, i) => b.toggleClass("is-active", !q && groups[i].title === this.activeTab));
      let hits = 0;
      for (const g of groups) {
        if (!q) {
          g.panel.toggleClass("ep-hidden", g.title !== this.activeTab);
          for (const s of g.sects)
            for (const el of [s.heading, ...s.rows, ...s.loose]) el.removeClass("ep-hidden");
          continue;
        }
        let shownInTab = 0;
        for (const s of g.sects) {
          // A matching heading shows its whole section: several sections are
          // bespoke editors rather than rows, and would otherwise look empty.
          const whole = s.title.toLowerCase().includes(q) || g.title.toLowerCase().includes(q);
          let shown = 0;
          for (const row of s.rows) {
            const hit = whole || (row.textContent ?? "").toLowerCase().includes(q);
            row.toggleClass("ep-hidden", !hit);
            if (hit) shown++;
          }
          // Loose copy is context, not a result: it comes along with a whole
          // section, not with a row that happened to match.
          for (const el of s.loose) el.toggleClass("ep-hidden", !whole);
          s.heading.toggleClass("ep-hidden", !whole && shown === 0);
          shownInTab += shown;
        }
        g.panel.toggleClass("ep-hidden", shownInTab === 0);
        hits += shownInTab;
      }
      empty.toggleClass("ep-hidden", !q || hits > 0);
    };

    const empty = body.createDiv({ cls: "ep-settings-empty setting-item-description ep-hidden" });
    empty.setText(t("settings.searchNoResults"));

    search.addEventListener("input", () => {
      this.query = search.value;
      apply();
    });
    search.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !search.value) return;
      e.preventDefault();
      e.stopPropagation(); // Escape would otherwise close the settings window
      search.value = "";
      this.query = "";
      apply();
    });
    // The tab re-renders on many changes; typing must survive that.
    search.addEventListener("focus", () => (this.queryFocused = true));
    search.addEventListener("blur", () => (this.queryFocused = false));
    if (this.queryFocused) {
      search.focus();
      search.setSelectionRange(search.value.length, search.value.length);
    }

    apply();
  }

  /**
   * Loose copy (section blurbs, the intro, the override search field) is not
   * inside a `.setting-item`, so it misses the row padding and sits flush
   * against the edge. Measure a real row and hand its inline padding to the
   * stylesheet, so the alignment follows whatever the theme uses rather than
   * a hardcoded guess.
   */
  private alignLooseText(): void {
    const host = this.host;
    const row = host.querySelector<HTMLElement>(".setting-item");
    if (!row) return;
    const cs = (row.ownerDocument.defaultView ?? window).getComputedStyle(row);
    host.setCssProps({
      "--ep-row-pad-l": cs.paddingLeft,
      "--ep-row-pad-r": cs.paddingRight,
      "--ep-row-pad-t": cs.paddingTop,
    });
  }

  private renderBody(): void {
    const c = this.host;
    const plugin = this.plugin;
    const i18n = plugin.i18n;
    const t = i18n.t.bind(i18n);
    const save = () => {
      void plugin.saveSettings();
      plugin.refreshViews();
    };
    c.empty();
    c.addClass("ep-settings");

    // -- types ---------------------------------------------------------------
    new Setting(c).setName(t("settings.typesHeading")).setHeading();
    new Setting(c)
      .setName(t("settings.typeProp"))
      .setDesc(t("settings.typePropDesc"))
      .addText((tx) => {
        tx.setPlaceholder("Type").setValue(plugin.settings.typeProp ?? "");
        tx.onChange((v) => {
          plugin.settings.typeProp = v.trim() || undefined;
          save();
          // The index bucketed notes under the old property - rebuild.
          plugin.props.invalidateAll();
          plugin.refreshViews();
        });
        // Every heading, description and prompt names this property, so the
        // whole tab re-renders once the field is committed (on change, not
        // per keystroke, which would steal focus mid-word).
        tx.inputEl.addEventListener("change", () => {
          this.render();
          // The tab rebuilt: put the caret back where the user left it.
          const next = this.host.querySelector<HTMLInputElement>(".ep-typeprop-input");
          next?.focus();
        });
        tx.inputEl.addClass("ep-typeprop-input");
      });
    setTypedText(c.createEl("p", { cls: "setting-item-description" }), i18n, plugin.settings, "settings.typesDesc");
    // Fallback icon for types that define none - the header chip always has
    // something to collapse to.
    {
      const setting = new Setting(c).setName(t("settings.defaultTypeIcon")).setDesc(t("settings.defaultTypeIconDesc"));
      const prev = setting.controlEl.createSpan({ cls: "ep-typeicon-prev" });
      const paint = (): void => {
        prev.empty();
        setIcon(prev, plugin.settings.defaultTypeIcon ?? "tag");
      };
      paint();
      setting.addExtraButton((b) =>
        b.setIcon("image").setTooltip(t("settings.typeIcon")).onClick(() =>
          new IconPickerModal(this.app, i18n, plugin.settings.defaultTypeIcon ?? "tag", (v) => {
            plugin.settings.defaultTypeIcon = v || undefined;
            save();
            paint();
            plugin.refreshViews();
          }).open()
        )
      );
    }
    for (const type of plugin.settings.types) {
      const setting = new Setting(c).setName(type);
      // Icon preview + picker: this is what the header chip collapses to.
      const iconPrev = setting.nameEl.createSpan({ cls: "ep-typeicon-prev" });
      const paintIcon = (): void => {
        iconPrev.empty();
        setIcon(iconPrev, typeIconOf(plugin.settings, type));
        iconPrev.toggleClass("ep-typeicon-default", !plugin.settings.typeIcons?.[type.toLowerCase()]);
      };
      paintIcon();
      const setTypeIcon = (v: string | undefined): void => {
        const icons = (plugin.settings.typeIcons ??= {});
        if (v) icons[type.toLowerCase()] = v;
        else delete icons[type.toLowerCase()];
        save();
        paintIcon();
        plugin.refreshViews();
      };
      // Rename: the layout, icon and scoped macros move with the type, which is
      // what lets a vault adopt a property whose values it already uses.
      setting.addExtraButton((b) =>
        b.setIcon("pencil").setTooltip(typedText(i18n, plugin.settings, "settings.renameType")).onClick(() => {
          const prop = typeName(plugin.settings);
          new RenameTypeModal(this.app, i18n, {
            current: type,
            clashes: (name) =>
              plugin.settings.types.some(
                (x) => x.toLowerCase() === name.toLowerCase() && x.toLowerCase() !== type.toLowerCase()
              ),
            noteCount: plugin.props.filesWithValue(prop, type, true).length,
            onSubmit: (next, o) => {
              void (async () => {
                const { outcome, notes } = await plugin.renameTypeEverywhere(type, next, o);
                if (outcome === "invalid") return;
                new Notice(t(outcome === "merged" ? "settings.renameTypeMerged" : "settings.renameTypeDone", { name: next }));
                if (o.retype) new Notice(t("settings.renameTypeNotesDone", { n: String(notes) }));
                this.render();
              })();
            },
          }).open();
        })
      );
      setting.addExtraButton((b) =>
        b.setIcon("image").setTooltip(t("settings.typeIcon")).onClick(() =>
          new IconPickerModal(this.app, i18n, plugin.settings.typeIcons?.[type.toLowerCase()] ?? "", setTypeIcon).open()
        )
      );
      // Back to the default icon (the row's preview greys out again).
      setting.addExtraButton((b) =>
        b.setIcon("rotate-ccw")
          .setTooltip(t("settings.typeIconReset"))
          .setDisabled(!plugin.settings.typeIcons?.[type.toLowerCase()])
          .onClick(() => {
            setTypeIcon(undefined);
            this.render();
          })
      );
      setting
        .addButton((b) =>
          b.setButtonText(t("settings.resetLayout")).onClick(() =>
            new ConfirmModal(this.app, i18n, t("settings.resetLayoutConfirm", { type }), () =>
              plugin.resetLayout(type.toLowerCase())
            ).open()
          )
        )
        .addButton((b) =>
          b.setButtonText(t("transfer.exportType")).setTooltip(t("transfer.exportTypeTip")).onClick(() => {
            const doc = packType(type, plugin.ensureLayout(type.toLowerCase()), plugin.settings.derivations, plugin.manifest.version);
            void navigator.clipboard?.writeText(JSON.stringify(doc, null, 2));
            new Notice(t("transfer.copied"));
          })
        )
        .addButton((b) =>
          b.setButtonText(t("settings.deleteType"))
            .then(destructive)
            .onClick(() => {
              plugin.deleteType(type);
              this.render();
            })
        );
    }
    new Setting(c).setName(t("settings.addType")).addButton((b) =>
      b.setButtonText(t("settings.addTypeBtn")).setCta().onClick(() =>
        new TextPromptModal(this.app, i18n, t("settings.newTypePrompt"), "", (v) => {
          const name = v.trim();
          if (!name) return;
          if (plugin.settings.types.some((x) => x.toLowerCase() === name.toLowerCase())) {
            new Notice(t("settings.typeExists"));
            return;
          }
          plugin.settings.types.push(name);
          plugin.ensureLayout(name.toLowerCase());
          save();
          this.render();
        }).open()
      )
    );
    new Setting(c)
      .setName(t("transfer.importHeading"))
      .setDesc(t("transfer.importHeadingDesc"))
      .addButton((b) => b.setButtonText(t("transfer.importBtn")).setCta().onClick(() => new ImportModal(plugin).open()));

    // -- defaults --------------------------------------------------------------
    const d = plugin.settings.defaults;
    new Setting(c).setName(t("settings.defaultsHeading")).setHeading();
    new Setting(c)
      .setName(t("settings.defaultDataType"))
      .setDesc(t("settings.defaultDataTypeDesc"))
      .addDropdown((dd) => {
        for (const def of plugin.registries.valueTypes.all()) {
          if (def.deprecated) continue;
          dd.addOption(def.id, def.name(i18n));
        }
        dd.setValue(d.dataType);
        dd.onChange((v) => {
          d.dataType = v;
          save();
        });
      });
    new Setting(c).setName(t("settings.defaultColorSpace")).addDropdown((dd) => {
      for (const sp of COLOR_SPACES) dd.addOption(sp, sp);
      dd.setValue(d.colorSpace);
      dd.onChange((v) => {
        d.colorSpace = v as ColorSpace;
        save();
      });
    });

    // -- new-section defaults ----------------------------------------------------
    new Setting(c).setName(t("settings.newSectionHeading")).setHeading();
    new Setting(c).setName(t("sectionOptions.columns")).addDropdown((dd) => {
      dd.addOption("1", "1");
      dd.addOption("2", "2");
      dd.setValue(String(d.sectionColumns));
      dd.onChange((v) => {
        d.sectionColumns = Number(v);
        save();
      });
    });
    const toggleRow = (name: string, get: () => boolean, set: (v: boolean) => void) =>
      new Setting(c).setName(name).addToggle((tg) => {
        tg.setValue(get()).onChange((v) => {
          set(v);
          save();
        });
      });
    toggleRow(t("sectionOptions.transparent"), () => d.sectionTransparent, (v) => (d.sectionTransparent = v));
    toggleRow(t("sectionOptions.pinDefault"), () => d.sectionSticky, (v) => (d.sectionSticky = v));
    toggleRow(t("sectionOptions.collapsible"), () => d.sectionCollapsible, (v) => (d.sectionCollapsible = v));
    toggleRow(t("settings.entryDividers"), () => d.sectionDividers, (v) => (d.sectionDividers = v));
    new Setting(c).setName(t("sectionOptions.height")).addDropdown((dd) => {
      dd.addOption("unlimited", t("size.unlimited"));
      dd.addOption("s", t("size.small"));
      dd.addOption("m", t("size.medium"));
      dd.addOption("l", t("size.large"));
      dd.setValue(d.sectionSize);
      dd.onChange((v) => {
        d.sectionSize = v as SectionSize;
        save();
      });
    });

    // -- modifier building blocks --------------------------------------------------
    new Setting(c).setName(t("settings.derivationsHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.derivationsDesc") });
    const applyDerivations = () => {
      plugin.rebuildRegistries();
      save();
    };
    for (const dv of [...plugin.settings.derivations]) {
      new Setting(c)
        .setName(dv.name || dv.id)
        .addText((tx) => {
          tx.setPlaceholder(t("settings.derivationName"))
            .setValue(dv.name)
            .onChange((v) => {
              dv.name = v.trim() || dv.id;
              applyDerivations();
            });
        })
        .addText((tx) => {
          tx.setPlaceholder("f(x)").setValue(dv.formula).onChange((v) => {
            const invalid = !!v.trim() && !compileFormula(v.trim());
            tx.inputEl.toggleClass("ep-invalid", invalid);
            if (invalid) return;
            dv.formula = v.trim() || "x";
            applyDerivations();
          });
        })
        .addText((tx) => {
          tx.inputEl.addClass("ep-suffix-input");
          tx.setPlaceholder(t("settings.blockSuffix"))
            .setValue(dv.suffix ?? "")
            .onChange((v) => {
              dv.suffix = v.trim().replace(/^\./, "") || undefined;
              applyDerivations();
            });
          tx.inputEl.setAttr("title", t("settings.blockSuffixDesc"));
        })
        .addExtraButton((b) =>
          b.setIcon("trash").setTooltip(t("settings.derivationDelete")).onClick(() => {
            plugin.settings.derivations = plugin.settings.derivations.filter((x) => x !== dv);
            applyDerivations();
            this.render();
          })
        );
    }
    // The modifier short form lives with the blocks: `.s` (configurable) is
    // the influence-sum reference, and each block above adds its own suffix.
    new Setting(c)
      .setName(t("settings.modSuffix"))
      .setDesc(t("settings.modSuffixDesc"))
      .addText((tx) => {
        tx.setPlaceholder("s")
          .setValue(plugin.settings.modifierSuffix ?? "s")
          .onChange((v) => {
            plugin.settings.modifierSuffix = v;
            save();
          });
      });
    new Setting(c)
      .setName(t("settings.modDepth"))
      .setDesc(t("settings.modDepthDesc"))
      .addSlider((sl) => {
        sl.setLimits(0, 16, 1)
          .setValue(plugin.settings.modDepth ?? 8)
          .onChange((v) => {
            plugin.settings.modDepth = v;
            save();
          });
      });
    new Setting(c)
      .setName(t("settings.modsOffProp"))
      .setDesc(t("settings.modsOffPropDesc"))
      .addText((tx) => {
        tx.setValue(plugin.settings.modsOffProp).onChange((v) => {
          plugin.settings.modsOffProp = v.trim() || "Modifiers Off";
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.derivationAdd"))
      .addButton((b) =>
        b.setButtonText(t("settings.derivationAddBtn")).onClick(() => {
          plugin.settings.derivations.push({ id: genId(), name: t("settings.newDerivation"), formula: "x" });
          applyDerivations();
          this.render();
        })
      )
      .addButton((b) =>
        b.setButtonText(t("settings.derivationReseed")).onClick(() => {
          const have = new Set(plugin.settings.derivations.map((x) => x.id));
          for (const dv of defaultDerivations()) if (!have.has(dv.id)) plugin.settings.derivations.push(dv);
          applyDerivations();
          this.render();
        })
      );

    // -- short forms ------------------------------------------------------------------
    new Setting(c).setName(t("settings.abbrHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.abbrDesc") });
    new Setting(c)
      .setName(t("settings.poolSuffix"))
      .setDesc(t("settings.poolSuffixDesc"))
      .addText((tx) => {
        tx.setPlaceholder("p")
          .setValue(plugin.settings.poolSuffix ?? "p")
          .onChange((v) => {
            plugin.settings.poolSuffix = v;
            save();
          });
      });
    new Setting(c)
      .setName(t("settings.crossNote"))
      .setDesc(t("settings.crossNoteDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.crossNote !== false).onChange((v) => {
          plugin.settings.crossNote = v ? undefined : false;
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.conflictGuard"))
      .setDesc(t("settings.conflictGuardDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.conflictGuard !== false).onChange((v) => {
          plugin.settings.conflictGuard = v ? undefined : false;
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.snapshots"))
      .setDesc(t("settings.snapshotsDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.snapshots === true).onChange((v) => {
          plugin.settings.snapshots = v ? true : undefined;
          save();
        });
      })
      .addButton((b) => b.setButtonText(t("settings.snapshotSaveNow")).onClick(() => void plugin.saveSnapshot(true)))
      .addButton((b) => b.setButtonText(t("settings.snapshotRestore")).onClick(() => void plugin.restoreSnapshotFlow()));
    new Setting(c)
      .setName(t("settings.layoutVault"))
      .setDesc(t("settings.layoutVaultDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.layoutVault === true).onChange(async (v) => {
          if (v) await plugin.enableLayoutVault();
          else await plugin.disableLayoutVault();
          this.render();
        });
      });
    if (plugin.settings.layoutVault === true) {
      new Setting(c)
        .setName(t("settings.layoutVaultFolder"))
        .setDesc(t("settings.layoutVaultFolderDesc"))
        .addText((tx) =>
          tx.setPlaceholder("_extended-properties")
            .setValue(plugin.settings.layoutVaultFolder ?? "")
            .onChange((v) => {
              plugin.settings.layoutVaultFolder = v.trim() || undefined;
              save();
            })
        )
        .addButton((b) =>
          b.setButtonText(t("settings.layoutVaultReload")).onClick(() => void plugin.reloadVaultLayouts())
        );
    }
    for (const key of Object.keys(plugin.settings.sourceAbbrs).sort((a, b) => a.localeCompare(b))) {
      new Setting(c)
        .setName(key)
        .setDesc(t("settings.abbrDefault", { abbr: defaultAbbr(key) }))
        .addText((tx) => {
          tx.setPlaceholder(defaultAbbr(key))
            .setValue(plugin.settings.sourceAbbrs[key])
            .onChange((v) => {
              const a = v.trim();
              if (a && a !== defaultAbbr(key)) plugin.settings.sourceAbbrs[key] = a;
              else delete plugin.settings.sourceAbbrs[key];
              save();
            });
        })
        .addExtraButton((b) =>
          b.setIcon("trash").setTooltip(t("settings.abbrDelete")).onClick(() => {
            delete plugin.settings.sourceAbbrs[key];
            save();
            this.render();
          })
        );
    }
    new Setting(c).setName(t("settings.abbrAdd")).addButton((b) =>
      b.setButtonText(t("settings.abbrAddBtn")).onClick(() =>
        new TextPromptModal(this.app, i18n, t("settings.abbrPrompt"), "", (v) => {
          const k = v.trim();
          if (!k) return;
          if (!Object.keys(plugin.settings.sourceAbbrs).some((x) => x.toLowerCase() === k.toLowerCase()))
            plugin.settings.sourceAbbrs[k] = defaultAbbr(k);
          save();
          this.render();
        }, () => plugin.props.knownProps()).open()
      )
    );

    // -- dice ----------------------------------------------------------------------
    new Setting(c).setName(t("settings.diceHeading")).setHeading();
    new Setting(c)
      .setName(t("settings.diceAnim"))
      .setDesc(t("settings.diceAnimDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.diceAnim).onChange((v) => {
          plugin.settings.diceAnim = v;
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.diceStyle"))
      .setDesc(t("settings.diceStyleDesc"))
      .addDropdown((dd) => {
        for (const st of DICE_STYLES) dd.addOption(st.id, st.name(i18n));
        dd.setValue(plugin.settings.diceAnimStyle ?? "classic").onChange((v) => {
          plugin.settings.diceAnimStyle = v;
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.diceAa"))
      .setDesc(t("settings.diceAaDesc"))
      .addToggle((tg) => {
        // Temporarily locked off: supersampling distorts the dice
        // (see AA_LOCKED in dice-anim.ts). Disabled until that is fixed.
        tg.setValue(false).setDisabled(true);
      });
    new Setting(c)
      .setName(t("settings.diceAnimMs"))
      .setDesc(t("settings.diceAnimMsDesc"))
      .addSlider((sl) => {
        sl.setLimits(0.3, 5, 0.1)
          .setValue((plugin.settings.diceAnimMs ?? 1500) / 1000)
          .onChange((v) => {
            plugin.settings.diceAnimMs = Math.round(v * 1000);
            save();
          });
      });
    new Setting(c)
      .setName(t("settings.diceAnimStay"))
      .setDesc(t("settings.diceAnimStayDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.diceAnimStay).onChange((v) => {
          plugin.settings.diceAnimStay = v;
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.diceAnimBlock"))
      .setDesc(t("settings.diceAnimBlockDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.diceAnimBlock !== false).onChange((v) => {
          plugin.settings.diceAnimBlock = v;
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.sound"))
      .setDesc(t("settings.soundDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.sound !== false).onChange((v) => {
          plugin.settings.sound = v;
          save();
          this.render();
        });
      });
    if (plugin.settings.sound !== false) {
      new Setting(c)
        .setName(t("settings.soundVolume"))
        .setDesc(t("settings.soundVolumeDesc"))
        .addSlider((sl) => {
          sl.setLimits(0, 1, 0.05)
            .setValue(plugin.settings.soundVolume ?? 0.3)
            .onChange((v) => {
              plugin.settings.soundVolume = v;
              save();
            });
        });
      const soundCat = (nameKey: string, descKey: string, get: () => boolean, set: (v: boolean) => void) =>
        new Setting(c).setName(t(nameKey)).setDesc(t(descKey)).addToggle((tg) => {
          tg.setValue(get()).onChange((v) => {
            set(v);
            save();
          });
        });
      soundCat("settings.soundUi", "settings.soundUiDesc", () => plugin.settings.soundUi !== false, (v) => {
        plugin.settings.soundUi = v ? undefined : false;
      });
      soundCat("settings.soundDice", "settings.soundDiceDesc", () => plugin.settings.soundDice !== false, (v) => {
        plugin.settings.soundDice = v ? undefined : false;
      });
      soundCat("settings.soundCrit", "settings.soundCritDesc", () => plugin.settings.soundCrit !== false, (v) => {
        plugin.settings.soundCrit = v ? undefined : false;
      });
    }
    new Setting(c)
      .setName(t("settings.failOnOne"))
      .setDesc(t("settings.failOnOneDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.failOnOne !== false).onChange((v) => {
          plugin.settings.failOnOne = v;
          save();
        });
      });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.critRangesDesc") });
    for (const sides of Object.keys(plugin.settings.critRanges).sort((a, b) => Number(a) - Number(b))) {
      new Setting(c)
        .setName(t("settings.critRangeFrom", { sides }))
        .addText((tx) => {
          tx.setValue(String(plugin.settings.critRanges[sides])).onChange((v) => {
            const n = parseInt(v);
            if (Number.isFinite(n) && n >= 1) {
              plugin.settings.critRanges[sides] = n;
              save();
            }
          });
        })
        .addExtraButton((b) =>
          b.setIcon("trash").setTooltip(t("settings.critRangeDelete")).onClick(() => {
            delete plugin.settings.critRanges[sides];
            save();
            this.render();
          })
        );
    }
    new Setting(c).setName(t("settings.critRangeAdd")).addButton((b) =>
      b.setButtonText(t("settings.critRangeAddBtn")).onClick(() =>
        new TextPromptModal(this.app, i18n, t("settings.critRangePrompt"), "20", (v) => {
          const sides = parseInt(v);
          if (!Number.isFinite(sides) || sides < 2) return;
          if (plugin.settings.critRanges[String(sides)] === undefined)
            plugin.settings.critRanges[String(sides)] = sides;
          save();
          this.render();
        }).open()
      )
    );

    // -- rolls: history & macros ---------------------------------------------
    if (plugin.settings.features["rolling"] !== false) {
      new Setting(c).setName(t("settings.rollsHeading")).setHeading();
      new Setting(c)
        .setName(t("settings.rollHistory"))
        .setDesc(t("settings.rollHistoryDesc"))
        .addToggle((tg) => {
          tg.setValue(plugin.settings.rollHistoryEnabled !== false).onChange((v) => {
            plugin.settings.rollHistoryEnabled = v;
            plugin.history.setEnabled(v);
            save();
          });
        });
      new Setting(c)
        .setName(t("settings.rollHistoryLimit"))
        .setDesc(t("settings.rollHistoryLimitDesc"))
        .addSlider((sl) => {
          sl.setLimits(50, 2000, 50)
            .setValue(plugin.settings.rollHistoryLimit ?? 500)
            .onChange((v) => {
              plugin.settings.rollHistoryLimit = v;
              plugin.history.applyLimit();
              save();
            });
        });
      new Setting(c).setName(t("settings.rollHistoryClear")).addButton((b) =>
        b.setButtonText(t("settings.rollHistoryClearBtn")).then(destructive).onClick(() =>
          new ConfirmModal(this.app, i18n, t("settings.rollHistoryClearConfirm"), () => {
            plugin.history.clear();
            new Notice(t("settings.rollHistoryCleared"));
          }).open()
        )
      );

      // Macros ("custom roll objects"): name - notation - mode - scope - delete.
      new Setting(c).setName(t("settings.macrosHeading")).setHeading();
      c.createEl("p", { cls: "setting-item-description", text: t("settings.macrosDesc") });
      const macros = plugin.settings.macros;
      for (const m of [...macros]) {
        new Setting(c)
          .addText((tx) =>
            tx.setPlaceholder(t("settings.macroName")).setValue(m.name).onChange((v) => {
              m.name = v.trim() || m.name;
              save();
            })
          )
          .addText((tx) => {
            tx.setPlaceholder("2d6 + 3").setValue(segsToText(m.segs));
            new RefSuggest(this.app, tx.inputEl, () => referenceSuggestions(plugin.settings, plugin.props.knownProps()));
            tx.onChange((v) => {
              const segs = textToSegs(v);
              if (!segs) {
                tx.inputEl.addClass("ep-invalid");
                return;
              }
              tx.inputEl.removeClass("ep-invalid");
              m.segs = segs;
              save();
            });
          })
          .addDropdown((dd) => {
            dd.addOption("normal", t("roll.modeNormal"));
            dd.addOption("advantage", t("roll.modeAdvantage"));
            dd.addOption("disadvantage", t("roll.modeDisadvantage"));
            dd.setValue(m.mode === "advantage" || m.mode === "disadvantage" ? m.mode : "normal");
            dd.onChange((v) => {
              m.mode = v === "normal" ? undefined : v;
              save();
            });
          })
          .addDropdown((dd) => {
            dd.addOption("", t("settings.macroGlobal"));
            for (const tp of plugin.settings.types) dd.addOption(tp.toLowerCase(), tp);
            dd.setValue(m.typeKey ?? "");
            dd.onChange((v) => {
              m.typeKey = v || undefined;
              save();
            });
          })
          .addExtraButton((b) =>
            b.setIcon("trash").setTooltip(t("settings.macroDelete")).onClick(() => {
              plugin.settings.macros = macros.filter((x) => x.id !== m.id);
              save();
              this.render();
            })
          );
      }
      new Setting(c).setName(t("settings.macroAdd")).addButton((b) =>
        b.setButtonText(t("settings.macroAddBtn")).onClick(() => {
          macros.push({ id: genId(), name: t("settings.macroNewName"), segs: [{ dice: "d20" }] });
          save();
          this.render();
        })
      );
    }

    // -- typography ---------------------------------------------------------------
    new Setting(c).setName(t("settings.typographyHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.typographyDesc") });
    new Setting(c).setName(t("settings.fontFamily")).addText((tx) => {
      tx.setPlaceholder(t("settings.fontPlaceholder"))
        .setValue(d.fontFamily)
        .onChange((v) => {
          d.fontFamily = v.trim();
          save();
        });
    });
    const sizeRow = (name: string, get: () => number, set: (n: number) => void) =>
      new Setting(c).setName(name).addSlider((sl) => {
        sl.setLimits(0, 32, 1)
          .setValue(get())
          .onChange((v) => {
            set(v);
            save();
          });
      });
    sizeRow(t("settings.baseSize"), () => d.baseSize, (n) => (d.baseSize = n));
    sizeRow(t("options.labelSize"), () => d.labelSize, (n) => (d.labelSize = n));
    sizeRow(t("options.valueSize"), () => d.valueSize, (n) => (d.valueSize = n));
    sizeRow(t("sectionOptions.titleSize"), () => d.titleSize, (n) => (d.titleSize = n));
    sizeRow(t("settings.listSize"), () => d.listSize, (n) => (d.listSize = n));

    // -- UI text (per-string overrides; English is the built-in locale) --------------
    new Setting(c).setName(t("settings.languageHeading")).setHeading();
    this.renderOverrideEditor(c);

    // -- Obsidian integration ----------------------------------------------------------
    new Setting(c).setName(t("settings.obsidianHeading")).setHeading();
    new Setting(c)
      .setName(t("settings.hideShown"))
      .setDesc(t("settings.hideShownDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.hideShown).onChange((v) => {
          plugin.settings.hideShown = v;
          save();
        });
      });
    // -- activation outside edit mode -----------------------------------------
    new Setting(c).setName(t("settings.activationHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.activationDesc") });
    for (const surface of ACTIVATION_SURFACES) {
      new Setting(c)
        .setName(t("settings.activation." + surface))
        .setDesc(t("settings.activation." + surface + "Desc"))
        .addDropdown((d) => {
          d.addOption("double", t("settings.activationDouble"));
          d.addOption("single", t("settings.activationSingle"));
          d.setValue(activationFor(plugin.settings, surface));
          d.onChange((v) => {
            setActivation(plugin.settings, surface, v === "single" ? "single" : "double");
            save();
          });
        });
    }

    const interactionDrop = (name: string, desc: string, get: () => string, set: (v: string) => void, def: string): void => {
      new Setting(c).setName(name).setDesc(desc).addDropdown((d) => {
        d.addOption("menu", t("settings.interactMenu"));
        d.addOption("settings", t("settings.interactSettings"));
        d.addOption("focus", t("settings.interactFocus"));
        d.addOption("none", t("settings.interactNone"));
        d.setValue(get() || def);
        d.onChange((v) => {
          set(v);
          save();
        });
      });
    };
    // A touch screen has one gesture, and it is the platform's context-menu
    // press: the plain-hold and right-click mappings can never apply there, so
    // mobile is shown the one option it honours, with the reason for it.
    const mobile = mobileGestures();
    c.createEl("p", {
      cls: "setting-item-description",
      text: mobile ? t("settings.gesturesMobile") : t("settings.gesturesMobileNote"),
    });
    if (!mobile) {
      interactionDrop(
        t("settings.clickAction"), t("settings.clickActionDesc"),
        () => plugin.settings.clickAction ?? "none",
        (v) => (plugin.settings.clickAction = v === "none" ? undefined : v),
        "none"
      );
      interactionDrop(
        t("settings.dblClickAction"), t("settings.dblClickActionDesc"),
        () => plugin.settings.dblClickAction ?? "none",
        (v) => (plugin.settings.dblClickAction = v === "none" ? undefined : v),
        "none"
      );
      interactionDrop(
        t("settings.holdAction"), t("settings.holdActionDesc"),
        () => plugin.settings.holdAction ?? "settings",
        (v) => (plugin.settings.holdAction = v === "settings" ? undefined : v),
        "settings"
      );
      interactionDrop(
        t("settings.rightClickAction"), t("settings.rightClickActionDesc"),
        () => plugin.settings.rightClickAction ?? "menu",
        (v) => (plugin.settings.rightClickAction = v === "menu" ? undefined : v),
        "menu"
      );
    }
    interactionDrop(
      t(mobile ? "settings.rightHoldActionMobile" : "settings.rightHoldAction"),
      t(mobile ? "settings.rightHoldActionMobileDesc" : "settings.rightHoldActionDesc"),
      () => plugin.settings.rightHoldAction ?? "settings",
      (v) => (plugin.settings.rightHoldAction = v === "settings" ? undefined : v),
      "settings"
    );
    new Setting(c)
      .setName(t("settings.tabOpens"))
      .setDesc(t("settings.tabOpensDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.tabOpens !== false).onChange((v) => {
          plugin.settings.tabOpens = v ? undefined : false;
          save();
        });
      });
    new Setting(c)
      .setName(t("settings.holdMs"))
      .setDesc(t("settings.holdMsDesc"))
      .addSlider((sl) => {
        sl.setLimits(200, 2000, 50)
          .setValue(plugin.settings.holdMs ?? 500)
          .setDynamicTooltip()
          .onChange((v) => {
            plugin.settings.holdMs = v === 500 ? undefined : v;
            save();
          });
      });
    new Setting(c)
      .setName(t("settings.propMenu"))
      .setDesc(t("settings.propMenuDesc"))
      .addToggle((tg) => {
        tg.setValue(plugin.settings.propMenu).onChange((v) => {
          plugin.settings.propMenu = v;
          save();
        });
      });

    // -- always-hidden properties ---------------------------------------------------------
    new Setting(c).setName(t("settings.hiddenHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.hiddenDesc") });
    for (const k of plugin.settings.manualHide) {
      new Setting(c).setName(k).addButton((b) =>
        b.setButtonText(t("settings.unhide")).onClick(() => {
          plugin.settings.manualHide = plugin.settings.manualHide.filter((x) => x !== k);
          save();
          this.render();
        })
      );
    }
    new Setting(c).setName(t("settings.hideProperty")).addButton((b) =>
      b.setButtonText(t("settings.hidePropertyBtn")).onClick(() =>
        new TextPromptModal(this.app, i18n, t("settings.hidePromptTitle"), "", (v) => {
          const k = v.trim();
          if (!k) return;
          if (!plugin.settings.manualHide.includes(k)) plugin.settings.manualHide.push(k);
          save();
          this.render();
        }, () => plugin.props.knownProps()).open()
      )
    );

    // -- features -----------------------------------------------------------------------
    // Every feature of the plugin can be disabled here: the optional modules,
    // each optional value type, and the interface features. All default to
    // on; disabling never deletes data (see core/features.ts).
    const featureToggle = (st: Setting, id: string): void => {
      st.addToggle((tg) => {
        tg.setValue(plugin.settings.features[id] !== false).onChange((v) => {
          plugin.settings.features[id] = v;
          plugin.rebuildRegistries();
          plugin.applyFeatureGates();
          plugin.refreshViews();
          save();
          this.render();
        });
      });
    };
    new Setting(c).setName(t("settings.featuresHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresDesc") });
    for (const mod of plugin.featureModules) {
      featureToggle(new Setting(c).setName(mod.name(i18n)).setDesc(mod.description(i18n)), mod.id);
    }
    new Setting(c).setName(t("settings.featuresTypes")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresTypesDesc") });
    for (const f of TYPE_FEATURES) {
      featureToggle(new Setting(c).setName(t("feature." + f.id)).setDesc(t("feature." + f.id + "Desc")), f.id);
    }
    new Setting(c).setName(t("settings.featuresUi")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresUiDesc") });
    for (const f of UI_FEATURES) {
      featureToggle(new Setting(c).setName(t("feature." + f.id)).setDesc(t("feature." + f.id + "Desc")), f.id);
    }
  }

  /**
   * Searchable per-string override editor. Every UI string can be replaced;
   * a blank field returns the string to its locale default.
   */
  private renderOverrideEditor(c: HTMLElement): void {
    const plugin = this.plugin;
    const i18n = plugin.i18n;
    const t = i18n.t.bind(i18n);

    new Setting(c)
      .setName(t("settings.overrides"))
      .setDesc(t("settings.overridesDesc"))
      .addButton((b) =>
        b.setButtonText(t("settings.overridesReset")).onClick(() => {
          plugin.settings.stringOverrides = {};
          i18n.setOverrides({});
          void plugin.saveSettings();
          plugin.refreshViews();
          this.render();
        })
      );

    const search = c.createEl("input", { cls: "ep-edit-input" });
    search.type = "text";
    search.placeholder = t("settings.overridesSearch");
    search.setCssStyles({ width: "100%" });
    const listEl = c.createDiv();

    const renderList = () => {
      listEl.empty();
      const q = search.value.trim().toLowerCase();
      const keys = i18n.keys();
      // Overridden strings always surface first; then filter matches.
      const matches = keys.filter((k) => {
        if (!q) return plugin.settings.stringOverrides[k] !== undefined;
        return k.toLowerCase().includes(q) || i18n.baseText(k).toLowerCase().includes(q);
      });
      const shown = matches.slice(0, OVERRIDE_ROW_LIMIT);
      if (!q && !shown.length)
        listEl.createDiv({ cls: "setting-item-description", text: t("settings.overridesHint") });
      for (const key of shown) {
        new Setting(listEl)
          .setName(key)
          .setDesc(t("settings.overrideDefault", { text: i18n.baseText(key) }))
          .addText((tx) => {
            tx.setPlaceholder(i18n.baseText(key))
              .setValue(plugin.settings.stringOverrides[key] ?? "")
              .onChange((v) => {
                if (v) plugin.settings.stringOverrides[key] = v;
                else delete plugin.settings.stringOverrides[key];
                i18n.setOverrides(plugin.settings.stringOverrides);
                void plugin.saveSettings();
                plugin.refreshViews();
              });
          });
      }
      if (matches.length > shown.length)
        listEl.createDiv({
          cls: "setting-item-description",
          text: t("settings.overridesMore", { count: matches.length - shown.length }),
        });
    };
    search.addEventListener("input", renderList);
    renderList();

    // -- reset (danger zone) -------------------------------------------------
    new Setting(c).setName(t("settings.resetHeading")).setHeading();
    new Setting(c)
      .setName(t("settings.resetAll"))
      .setDesc(t("settings.resetAllDesc"))
      .addButton((b) =>
        b
          .setButtonText(t("settings.resetAllBtn"))
          .then(destructive)
          .onClick(() =>
            new ConfirmModal(this.app, i18n, t("settings.resetAllConfirm"), () => {
              void plugin.resetAll().then(() => {
                new Notice(t("settings.resetAllDone"));
                this.render();
              });
            }).open()
          )
      );
  }
}
