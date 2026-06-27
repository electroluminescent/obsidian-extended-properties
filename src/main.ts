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
import type { EPSettings, Layout } from "./core/model";
import { normalizeSettings, runSchemaMigrations } from "./core/settings";
import { LayoutStore } from "./core/layout-store";
import { materializeShortForms, registerDerivations } from "./core/influences";
import { FeatureModule, Registries } from "./core/registry";
import { PropertyIndex } from "./core/property-index";
import { HideService } from "./core/hide-service";
import { registerCore } from "./ui/render/value-types/index";
import { API_VERSION } from "./api";
import type { ExtendedPropertiesApi } from "./api";
import { registerDiceIcons } from "./ui/render/dice-icons";
import { SidebarView, VIEW_TYPE } from "./ui/view";
import { TableView, VIEW_TYPE_TABLE } from "./ui/table-view";
import { EPSettingTab } from "./ui/settings-tab";
import { TextPromptModal } from "./ui/modals/dialogs";
import { augmentPropsMenu, showPropMenu } from "./ui/menus/prop-panel-menu";
import { rollingModule } from "./features/rolling/index";
import { dnd5eModule } from "./features/dnd5e/index";
import { HistoryService } from "./features/rolling/history";
import { RollService } from "./features/rolling/roll-service";
import { runMacro } from "./features/rolling/macros";
import { inlineModule, registerInline } from "./features/inline/index";
import { configureSound } from "./utils/sound";
import { NoteFacade } from "./core/note-model";

/**
 * All available feature modules, in registration order (later modules may
 * build on earlier ones — dnd5e uses the rolling module's value types).
 * Adding a feature to the plugin is: create `src/features/<id>/`, export a
 * {@link FeatureModule}, list it here.
 */
const FEATURE_MODULES: FeatureModule[] = [rollingModule, dnd5eModule, inlineModule];

export default class ExtendedPropertiesPlugin extends Plugin {
  settings!: EPSettings;
  readonly i18n = new I18n();
  readonly registries = new Registries();
  /** Public, versioned API (F5) — also exposed on `window.ExtendedProperties`. */
  api!: ExtendedPropertiesApi;
  /** Third-party feature modules registered through the public API. */
  private externalModules: FeatureModule[] = [];
  /** Optional vault-file layout store (D2); created in onload. */
  layoutStore?: LayoutStore;
  private layoutReloadTimer = 0;
  props!: PropertyIndex;
  hide!: HideService;
  /** Plugin-level, persistent roll history shared by every view. */
  history!: HistoryService;
  /** View-less roll service for macro commands (created on first use). */
  private rollSvc?: RollService;
  /** Command ids registered for the current macro set (for clean removal). */
  private macroCmdIds: string[] = [];
  /** Signature of the registered macro set; guards needless re-registration. */
  private macroSig = "";

  /** All known feature modules (enabled or not) — the settings tab lists them. */
  get featureModules(): FeatureModule[] {
    return FEATURE_MODULES;
  }

  async onload(): Promise<void> {
    this.props = new PropertyIndex(this.app);
    registerDiceIcons();

    // Settings must exist before registries: feature toggles live there.
    // The default layout depends on registries, so bootstrap in two steps:
    // build registries assuming defaults, then normalize settings with them.
    this.i18n.register("en", coreEn, "English");
    // German was removed in v2.41.0 (English-only; see ROADMAP "Deprecations").
    // The locale mechanism stays intact so a data-driven locale can return (F4).
    const data = await this.loadData();
    this.settings = normalizeSettings(data, () => ({ version: 4, sections: [] }));
    this.rebuildRegistries();
    // Re-normalize so types missing a layout get the real default preset.
    this.settings = normalizeSettings(data, () => this.defaultLayout());
    configureSound(this.settings.sound !== false, this.settings.soundVolume ?? 0.3, {
      ui: this.settings.soundUi !== false,
      dice: this.settings.soundDice !== false,
      crit: this.settings.soundCrit !== false,
    });
    this.i18n.setLocale(this.settings.language);
    this.i18n.setOverrides(this.settings.stringOverrides);

    // Let enabled feature modules upgrade settings written by old versions.
    let migrated = false;
    for (const mod of FEATURE_MODULES) {
      if (this.settings.features[mod.id] !== false && mod.migrate?.(this.settings)) migrated = true;
    }
    // Give every number/derived property and influence source a unique short form.
    if (materializeShortForms(this.settings)) migrated = true;

    this.hide = new HideService({
      settings: this.settings,
      save: () => this.saveSettings(),
      refreshViews: () => this.refreshViews(),
    });
    this.register(this.hide.install());

    // Plugin-level roll history (shared by all views; persists across reloads).
    this.history = new HistoryService(this.settings, () => {
      void this.saveData(this.settings);
    });

    // -- D3: versioned schema migration + pre-migration backup --------------
    const isFresh = !data || Object.keys(data as object).length === 0;
    if (runSchemaMigrations(this.settings).changed) migrated = true;
    if (migrated) {
      // Snapshot data.json before persisting an upgrade (nothing to back up on a fresh vault).
      if (!isFresh) await this.backupData(data);
      await this.saveSettings();
    }

    // -- D2: optional vault-file layout store --------------------------------
    this.layoutStore = new LayoutStore(
      this.app,
      this.i18n,
      () => this.settings.layoutVaultFolder ?? "_extended-properties",
      (k) => this.settings.layouts[k],
      (k) => this.typeNameFor(k)
    );
    if (this.settings.layoutVault === true) {
      // Vault files are authoritative: load them over the data.json copies.
      const fromFiles = await this.layoutStore.readAll();
      for (const k of Object.keys(fromFiles)) this.settings.layouts[k] = fromFiles[k];
    }
    this.registerEvent(this.app.vault.on("modify", (f) => this.onLayoutFileEvent(f.path)));
    this.registerEvent(this.app.vault.on("create", (f) => this.onLayoutFileEvent(f.path)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.onLayoutFileEvent(f.path)));

    // -- view, ribbon, commands ---------------------------------------------
    this.registerView(VIEW_TYPE, (leaf) => new SidebarView(leaf, this));
    this.addRibbonIcon("panel-right", this.i18n.t("command.openSidebar"), () => this.activateView());
    this.addCommand({
      id: "open-character-sidebar",
      name: this.i18n.t("command.openSidebar"),
      callback: () => this.activateView(),
    });
    this.registerView(VIEW_TYPE_TABLE, (leaf) => new TableView(leaf, this));
    this.addRibbonIcon("table", this.i18n.t("command.openTable"), () => this.activateTableView());
    this.addCommand({
      id: "open-type-table",
      name: this.i18n.t("command.openTable"),
      callback: () => this.activateTableView(),
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

    // Rolling commands (the feature may be disabled): export + per-macro.
    if (this.settings.features["rolling"] !== false) {
      this.addCommand({
        id: "export-roll-history",
        name: this.i18n.t("roll.cmd.exportHistory"),
        callback: () => void this.exportRollHistory(),
      });
    }
    this.syncMacroCommands();

    // -- inline rolls & properties in note bodies (reading mode) ------------------
    registerInline(this, {
      app: this.app,
      i18n: this.i18n,
      settings: this.settings,
      registries: this.registries,
      facade: new NoteFacade(this.app, this.i18n, () => this.settings.conflictGuard !== false),
      roll: this.rollService(),
      props: this.props,
      hide: this.hide,
      history: this.history,
      save: () => this.saveSettings(),
    });

    // -- view refresh on workspace / metadata events ---------------------------
    const refresh = (file?: TFile) => {
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
        const v = leaf.view;
        if (v instanceof SidebarView) v.maybeRefresh(file);
      }
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TABLE)) {
        const v = leaf.view;
        if (v instanceof TableView) v.refresh();
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

    this.exposeApi();
  }

  // -- public module API (F5) ---------------------------------------------

  /** Build and expose the public API on `this.api` and `window.ExtendedProperties`. */
  private exposeApi(): void {
    this.api = {
      apiVersion: API_VERSION,
      version: this.manifest.version,
      register: (module) => this.registerExternalModule(module),
      t: (key, vars) => this.i18n.t(key, vars),
    };
    (window as unknown as Record<string, unknown>).ExtendedProperties = this.api;
    this.register(() => {
      if ((window as unknown as Record<string, unknown>).ExtendedProperties === this.api)
        delete (window as unknown as Record<string, unknown>).ExtendedProperties;
    });
  }

  /** @see ExtendedPropertiesApi.register — incorporate a third-party module. */
  private registerExternalModule(module: FeatureModule): void {
    if (!module || typeof module.id !== "string" || typeof module.register !== "function") {
      console.error("Extended Properties: invalid module passed to register()");
      return;
    }
    const declared = (module as { apiVersion?: number }).apiVersion;
    if (typeof declared === "number" && declared > API_VERSION) {
      new Notice("A plugin needs a newer Extended Properties API (v" + declared + " > v" + API_VERSION + ").");
      return;
    }
    if (FEATURE_MODULES.some((m) => m.id === module.id) || this.externalModules.some((m) => m.id === module.id)) return;
    this.externalModules.push(module);
    this.rebuildRegistries();
    this.refreshViews();
  }

  onunload(): void {
    // Persist any debounced roll-history writes before the plugin goes away.
    this.history?.flushNow();
    this.layoutStore?.flushAll();
  }

  // -- rolling: history export & macro commands -------------------------------

  /** Lazily-created roll service for view-less rolls (macro commands). */
  /** Lazily-created roll service for view-less rolls (macro commands, table cells). */
  rollService(): RollService {
    if (!this.rollSvc) this.rollSvc = new RollService(this.i18n, this.settings, this.history, this.app);
    return this.rollSvc;
  }

  /**
   * Keep exactly one command per saved macro registered, removing commands of
   * deleted macros. A signature check makes the frequent {@link saveSettings}
   * caller a no-op unless the macro set actually changed. When the rolling
   * feature is disabled, all macro commands are removed.
   */
  syncMacroCommands(): void {
    const enabled = this.settings.features["rolling"] !== false;
    const macros = enabled && Array.isArray(this.settings.macros) ? this.settings.macros : [];
    const sig = (enabled ? "" : "off|") + macros.map((m) => `${m.id}:${m.name}`).join("|");
    if (sig === this.macroSig) return;
    this.macroSig = sig;
    // removeCommand is not in the public API but is the standard way to drop a
    // dynamically-registered command; guarded so a future API change can't throw.
    const cmds = (this.app as unknown as { commands?: { removeCommand?: (id: string) => void } }).commands;
    for (const id of this.macroCmdIds) cmds?.removeCommand?.(`${this.manifest.id}:${id}`);
    this.macroCmdIds = [];
    for (const m of macros) {
      const cmdId = `roll-macro-${m.id}`;
      this.addCommand({
        id: cmdId,
        name: this.i18n.t("roll.cmd.macroPrefix", { name: m.name }),
        callback: () => runMacro(this.rollService(), this.i18n, m),
      });
      this.macroCmdIds.push(cmdId);
    }
  }

  /** Export the roll history to a new note as a Markdown table. */
  private async exportRollHistory(): Promise<void> {
    const md = this.history.exportMarkdown(this.i18n);
    const base = this.i18n.t("roll.export.fileName");
    let path = `${base}.md`;
    let n = 2;
    while (this.app.vault.getAbstractFileByPath(path)) path = `${base} ${n++}.md`;
    try {
      const f = await this.app.vault.create(path, md);
      await this.app.workspace.getLeaf(true).openFile(f);
      new Notice(this.i18n.t("roll.export.done"));
    } catch (err) {
      new Notice(this.i18n.t("roll.export.failed", { error: String(err) }));
    }
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
    for (const mod of this.externalModules) {
      if (this.settings.features[mod.id] === false) continue;
      try {
        mod.register(ctx);
      } catch (e) {
        console.error("Extended Properties: external module '" + mod.id + "' failed to register", e);
      }
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
    configureSound(this.settings.sound !== false, this.settings.soundVolume ?? 0.3, {
      ui: this.settings.soundUi !== false,
      dice: this.settings.soundDice !== false,
      crit: this.settings.soundCrit !== false,
    });
    this.hide.update();
    this.syncMacroCommands();
    if (this.settings.layoutVault === true && this.layoutStore)
      for (const t of this.settings.types) this.layoutStore.write(t);
  }

  /**
   * Snapshot the pre-migration `data.json` to the plugin's `backups/` folder,
   * keeping the most recent 5. Best-effort — a failure must never block load.
   */
  private async backupData(rawData: unknown): Promise<void> {
    try {
      if (!this.manifest.dir) return;
      const dir = `${this.manifest.dir}/backups`;
      const adapter = this.app.vault.adapter;
      if (!(await adapter.exists(dir))) await adapter.mkdir(dir);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      await adapter.write(`${dir}/data-${stamp}.json`, JSON.stringify(rawData, null, 2));
      const listing = await adapter.list(dir);
      const backups = listing.files.filter((f) => /data-.*\.json$/.test(f)).sort();
      for (const old of backups.slice(0, Math.max(0, backups.length - 5))) await adapter.remove(old);
    } catch (e) {
      console.error("Extended Properties: settings backup failed", e);
    }
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

  // -- D2: vault-file layouts -------------------------------------------------

  /** Display name for a lower-cased type key (falls back to the key). */
  private typeNameFor(key: string): string {
    return this.settings.types.find((t) => t.toLowerCase() === key) ?? key;
  }

  /** A vault file changed — if it's one of our layout files (not our echo), reload (debounced). */
  private onLayoutFileEvent(path: string): void {
    if (this.settings.layoutVault !== true || !this.layoutStore) return;
    if (!this.layoutStore.owns(path) || this.layoutStore.isEcho(path)) return;
    window.clearTimeout(this.layoutReloadTimer);
    this.layoutReloadTimer = window.setTimeout(() => void this.reloadVaultLayouts(), 300);
  }

  /** Re-read layout files into memory (files win) and refresh open views. */
  async reloadVaultLayouts(): Promise<void> {
    if (!this.layoutStore) return;
    const fromFiles = await this.layoutStore.readAll();
    for (const k of Object.keys(fromFiles)) this.settings.layouts[k] = fromFiles[k];
    await this.saveData(this.settings);
    this.refreshViews();
    new Notice(this.i18n.t("layoutStore.reloaded", { n: String(Object.keys(fromFiles).length) }));
  }

  /** Turn on vault-file storage, exporting current layouts to files. */
  async enableLayoutVault(): Promise<void> {
    this.settings.layoutVault = true;
    await this.saveSettings();
    if (this.layoutStore) await this.layoutStore.writeAll(this.settings.types);
    new Notice(this.i18n.t("layoutStore.enabled"));
  }

  /** Turn off vault-file storage (layouts stay in data.json; the files remain). */
  async disableLayoutVault(): Promise<void> {
    this.settings.layoutVault = undefined;
    await this.saveSettings();
    new Notice(this.i18n.t("layoutStore.disabled"));
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

  /** Open (or focus) the type table view in a main tab. */
  async activateTableView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TABLE)[0];
    const leaf = existing ?? this.app.workspace.getLeaf(true);
    if (!existing) await leaf.setViewState({ type: VIEW_TYPE_TABLE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
}
