/**
 * The plugin's settings tab: note types, defaults, modifier building
 * blocks, short forms, typography, language (locale + per-string
 * overrides), Obsidian-panel integration, always-hidden properties, and
 * feature module toggles.
 */

import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type ExtendedPropertiesPlugin from "../main";
import { COLOR_SPACES, ColorSpace } from "../utils/color";
import type { SectionSize } from "../core/model";
import { defaultAbbr, defaultDerivations, referenceSuggestions } from "../core/influences";
import { compileFormula } from "../utils/formula";
import { genId } from "../utils/misc";
import { RefSuggest } from "./components/suggest";
import { ConfirmModal, TextPromptModal } from "./modals/dialogs";
import { ImportModal } from "./modals/transfer-modal";
import { packType } from "../core/transfer";
import { segsToText, textToSegs } from "../features/rolling/macros";
import { DICE_STYLES } from "../features/rolling/dice-styles";

/** Max override rows rendered at once (the list is searchable). */
const OVERRIDE_ROW_LIMIT = 25;

export class EPSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ExtendedPropertiesPlugin) {
    super(app, plugin);
  }

  display(): void {
    const c = this.containerEl;
    const plugin = this.plugin;
    const i18n = plugin.i18n;
    const t = i18n.t.bind(i18n);
    const save = () => {
      plugin.saveSettings();
      plugin.refreshViews();
    };
    c.empty();
    c.addClass("ep-settings");

    c.createEl("p", { text: t("settings.intro") });

    // -- types ---------------------------------------------------------------
    new Setting(c).setName(t("settings.typesHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.typesDesc") });
    for (const type of plugin.settings.types) {
      new Setting(c)
        .setName(type)
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
            .setWarning()
            .onClick(() => {
              plugin.settings.types = plugin.settings.types.filter((x) => x !== type);
              delete plugin.settings.layouts[type.toLowerCase()];
              if (plugin.settings.layoutVault === true) void plugin.layoutStore?.remove(type);
              save();
              this.display();
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
          this.display();
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
        .addExtraButton((b) =>
          b.setIcon("trash").setTooltip(t("settings.derivationDelete")).onClick(() => {
            plugin.settings.derivations = plugin.settings.derivations.filter((x) => x !== dv);
            applyDerivations();
            this.display();
          })
        );
    }
    new Setting(c)
      .setName(t("settings.modDepth"))
      .setDesc(t("settings.modDepthDesc"))
      .addSlider((sl) => {
        sl.setLimits(0, 16, 1)
          .setValue(plugin.settings.modDepth ?? 8)
          .setDynamicTooltip()
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
          this.display();
        })
      )
      .addButton((b) =>
        b.setButtonText(t("settings.derivationReseed")).onClick(() => {
          const have = new Set(plugin.settings.derivations.map((x) => x.id));
          for (const dv of defaultDerivations()) if (!have.has(dv.id)) plugin.settings.derivations.push(dv);
          applyDerivations();
          this.display();
        })
      );

    // -- short forms ------------------------------------------------------------------
    new Setting(c).setName(t("settings.abbrHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.abbrDesc") });
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
          this.display();
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
            this.display();
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
          this.display();
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
          .setDynamicTooltip()
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
          this.display();
        });
      });
    if (plugin.settings.sound !== false) {
      new Setting(c)
        .setName(t("settings.soundVolume"))
        .setDesc(t("settings.soundVolumeDesc"))
        .addSlider((sl) => {
          sl.setLimits(0, 1, 0.05)
            .setValue(plugin.settings.soundVolume ?? 0.3)
            .setDynamicTooltip()
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
            this.display();
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
          this.display();
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
            .setDynamicTooltip()
            .onChange((v) => {
              plugin.settings.rollHistoryLimit = v;
              plugin.history.applyLimit();
              save();
            });
        });
      new Setting(c).setName(t("settings.rollHistoryClear")).addButton((b) =>
        b.setButtonText(t("settings.rollHistoryClearBtn")).setWarning().onClick(() =>
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
              this.display();
            })
          );
      }
      new Setting(c).setName(t("settings.macroAdd")).addButton((b) =>
        b.setButtonText(t("settings.macroAddBtn")).onClick(() => {
          macros.push({ id: genId(), name: t("settings.macroNewName"), segs: [{ dice: "d20" }] });
          save();
          this.display();
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
          .setDynamicTooltip()
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
          this.display();
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
          this.display();
        }, () => plugin.props.knownProps()).open()
      )
    );

    // -- features -----------------------------------------------------------------------
    new Setting(c).setName(t("settings.featuresHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresDesc") });
    for (const mod of plugin.featureModules) {
      new Setting(c)
        .setName(mod.name(i18n))
        .setDesc(mod.description(i18n))
        .addToggle((tg) => {
          tg.setValue(plugin.settings.features[mod.id] !== false).onChange((v) => {
            plugin.settings.features[mod.id] = v;
            plugin.rebuildRegistries();
            save();
            this.display();
          });
        });
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
          plugin.saveSettings();
          plugin.refreshViews();
          this.display();
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
                plugin.saveSettings();
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
          .setWarning()
          .onClick(() =>
            new ConfirmModal(this.app, i18n, t("settings.resetAllConfirm"), () => {
              void plugin.resetAll().then(() => {
                new Notice(t("settings.resetAllDone"));
                this.display();
              });
            }).open()
          )
      );
  }
}
