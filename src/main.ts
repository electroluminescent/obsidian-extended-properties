/**
 * Plugin entry point — wiring only.
 *
 * Owns the long-lived services (settings, i18n, registries, property index,
 * hide service), registers the view, commands and DOM integrations, and
 * builds the registries from the core registration plus every enabled
 * feature module. All behavior lives in the modules this file connects.
 */

import { Notice, Plugin, TFile } from "obsidian";
import { I18n } from "./i18n/i18n";
import { coreEn } from "./i18n/locales/en";
import { coreDe } from "./i18n/locales/de";
import type { EPSettings, Layout } from "./core/model";
import { normalizeSettings } from "./core/settings";
import { registerDerivations } from "./core/influences";
import { FeatureModule, Registries } from "./core/registry";
import { PropertyIndex } from "./core/property-index";
import { HideService } from "./core/hide-service";
import { registerCore } from "./ui/render/value-types/index";
import { SidebarView, VIEW_TYPE } from "./ui/view";
import { EPSettingTab } from "./ui/settings-tab";
import { TextPromptModal } from "./ui/modals/dialogs";
import { augmentPropsMenu, showPropMenu } from "./ui/menus/prop-panel-menu";
import { rollingModule } from "./features/rolling/index";
import { dnd5eModule } from "./features/dnd5e/index";

/**
 * All available feature modules, in registration order (later modules may
 * build on earlier ones — dnd5e uses the rolling module's value types).
 * Adding a feature to the plugin is: create `src/features/<id>/`, export a
 * {@link FeatureModule}, list it here.
 */
const FEATURE_MODULES: FeatureModule[] = [rollingModule, dnd5eModule];

export default class ExtendedPropertiesPlugin extends Plugin {
  settings!: EPSettings;
  readonly i18n = new I18n();
  readonly registries = new Registries();
  props!: PropertyIndex;
  hide!: HideService;

  /** All known feature modules (enabled or not) — the settings tab lists them. */
  get featureModules(): FeatureModule[] {
    return FEATURE_MODULES;
  }

  async onload(): Promise<void> {
    this.props = new PropertyIndex(this.app);

    // Settings must exist before registries: feature toggles live there.
    // The default layout depends on registries, so bootstrap in two steps:
    // build registries assuming defaults, then normalize settings with them.
    this.i18n.register("en", coreEn, "English");
    this.i18n.register("de", coreDe, "Deutsch");
    const data = await this.loadData();
    this.settings = normalizeSettings(data, () => ({ version: 4, sections: [] }));
    this.rebuildRegistries();
    // Re-normalize so types missing a layout get the real default preset.
    this.settings = normalizeSettings(data, () => this.defaultLayout());
    this.i18n.setLocale(this.settings.language);
    this.i18n.setOverrides(this.settings.stringOverrides);

    // Let enabled feature modules upgrade settings written by old versions.
    let migrated = false;
    for (const mod of FEATURE_MODULES) {
      if (this.settings.features[mod.id] !== false && mod.migrate?.(this.settings)) migrated = true;
    }

    this.hide = new HideService({
      settings: this.settings,
      save: () => this.saveSettings(),
      refreshViews: () => this.refreshViews(),
    });
    this.register(this.hide.install());
    if (migrated) await this.saveSettings();

    // -- view, ribbon, commands ---------------------------------------------
    this.registerView(VIEW_TYPE, (leaf) => new SidebarView(leaf, this));
    this.addRibbonIcon("panel-right", this.i18n.t("command.openSidebar"), () => this.activateView());
    this.addCommand({
      id: "open-character-sidebar",
      name: this.i18n.t("command.openSidebar"),
      callback: () => this.activateView(),
    });
    this.addCommand({
      id: "hide-property-from-obsidian",
      name: this.i18n.t("command.hideProperty"),
      callback: () =>
        new TextPromptModal(this.app, this.i18n, this.i18n.t("settings.hidePromptTitle"), "", (v) => {
          const k = v.trim();
          if (!k) return;
          this.hide.hideKey(k);
          new Notice(this.i18n.t("notice.hiding", { key: k }));
        }, () => this.props.knownProps()).open(),
    });
    this.addSettingTab(new EPSettingTab(this.app, this));

    // -- view refresh on workspace / metadata events ---------------------------
    const refresh = (file?: TFile) => {
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
        const v = leaf.view;
        if (v instanceof SidebarView) v.maybeRefresh(file);
      }
    };
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => refresh()));
    this.registerEvent(this.app.workspace.on("file-open", () => refresh()));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => refresh(file)));

    // -- Obsidian properties-panel menus -----------------------------------------
    const host = { app: this.app, i18n: this.i18n, settings: this.settings, hide: this.hide };
    this.registerDomEvent(
      document,
      "contextmenu",
      (e: MouseEvent) => {
        if (!this.settings.propMenu) return;
        const target = e.target as HTMLElement;
        const el = target?.closest?.(".metadata-property") as HTMLElement | null;
        if (!el) return;
        const key = el.getAttribute("data-property-key");
        if (!key) return;
        e.preventDefault();
        e.stopPropagation();
        showPropMenu(host, e, key);
      },
      true
    );
    this.registerDomEvent(document, "contextmenu", (e: MouseEvent) => {
      if (!this.settings.propMenu) return;
      const target = e.target as HTMLElement;
      if (!target?.closest?.(".metadata-properties-heading")) return;
      window.setTimeout(() => augmentPropsMenu(host), 0);
    });
  }

  // -- registries -------------------------------------------------------------

  /** (Re)build all registries from core + enabled feature modules. */
  rebuildRegistries(): void {
    this.registries.clear();
    const ctx = { i18n: this.i18n, registries: this.registries };
    registerCore(ctx);
    for (const mod of FEATURE_MODULES) {
      if (this.settings.features[mod.id] !== false) mod.register(ctx);
    }
    // User-editable derivation building blocks (settings → registry).
    registerDerivations(this.registries, this.settings);
  }

  /** Default layout for new note types (preset claimed by features, or empty). */
  defaultLayout(): Layout {
    const preset =
      this.registries.layoutPresets.get(this.registries.defaultPresetId) ?? this.registries.layoutPresets.get("empty");
    return preset ? preset.build(this.i18n) : { version: 4, sections: [] };
  }

  // -- settings & layouts --------------------------------------------------------

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.hide.update();
  }

  ensureLayout(typeKey: string): Layout {
    if (!this.settings.layouts[typeKey]?.sections) this.settings.layouts[typeKey] = this.defaultLayout();
    return this.settings.layouts[typeKey];
  }

  resetLayout(typeKey: string): void {
    this.settings.layouts[typeKey] = this.defaultLayout();
    this.saveSettings();
    this.refreshViews();
  }

  refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const v = leaf.view;
      if (v instanceof SidebarView) v.render();
    }
  }

  // -- view activation --------------------------------------------------------------

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const right = workspace.getRightLeaf(false);
      if (!right) return;
      leaf = right;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}
