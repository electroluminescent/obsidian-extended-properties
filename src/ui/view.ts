/**
 * The sidebar view.
 *
 * Orchestration only: header, sticky zone, section flow, edit-mode session
 * (snapshot + undo), refresh strategy, and the {@link ViewCtx} services that
 * renderers consume. What entries look like is decided entirely by the
 * registries (see `core/registry.ts`).
 *
 * Refresh strategy: frontmatter edits made elsewhere re-render in place via
 * registered updaters when possible; the view only fully re-renders when the
 * set of *visible* entries would change (tracked by an "empty signature").
 */

import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import type ExtendedPropertiesPlugin from "../main";
import type { ClusterFlags, ClusterOptions, ClusterRefs, EntryRenderCtx, ViewCtx } from "../core/context";
import { Entry, Layout, Section } from "../core/model";
import { ServiceHub, SectionTemplateDef } from "../core/registry";
import { NoteModel } from "../core/note-model";
import { influenceSources, VaultAccess } from "../core/influences";
import { parseExpr, evalCondition } from "../core/expr";
import type { ExprEnv, ExprNode } from "../core/expr";
import { makeVaultAccess } from "../core/note-ref";
import { guardScrollTaps } from "./components/long-press";
import * as ops from "../core/layout-ops";
import { genId } from "../utils/misc";
import { buildCluster } from "./render/cluster";
import { alignClustersNow, renderSection } from "./render/section-renderer";
import { DragController } from "./drag";
import { PopupManager } from "./components/popups";
import { renderLinkedText } from "./components/links";
import { bindRename } from "./components/inline-edit";
import { PropSuggest } from "./components/suggest";
import { ConfirmModal, ExitEditModal } from "./modals/dialogs";
import { ColorPickerModal } from "./modals/color-picker";
import { SectionOptionsModal } from "./modals/section-options";

export const VIEW_TYPE = "extended-properties-character";

export class SidebarView extends ItemView implements ViewCtx {
  readonly plugin: ExtendedPropertiesPlugin;
  readonly note: NoteModel;
  readonly hub = new ServiceHub();

  editMode = false;
  /** Lower-cased type key whose layout is shown (null = no match). */
  activeTypeKey: string | null = null;

  private drag = new DragController(this);
  private popupsMgr = new PopupManager(this);
  private updaters: (() => void)[] = [];
  private sectionEls: Record<string, HTMLElement> = {};
  private headerEl: HTMLElement | null = null;
  private stickyZoneEl: HTMLElement | null = null;
  private flowEl: HTMLElement | null = null;
  private resizeObs: ResizeObserver | null = null;
  private lastEmptySig = "";
  /** Parsed `showWhen` ASTs, keyed by expression text (null = unparseable). */
  private condCache = new Map<string, ExprNode | null>();
  private hlTimer = 0;
  private scrollTimer = 0;
  /** Animate the next render (entering/leaving edit mode). */
  private modeAnim = false;
  /** Layout JSON at edit-mode entry, for session undo. */
  private layoutSnapshot: string | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: ExtendedPropertiesPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.note = new NoteModel(this.app, plugin.i18n, {
      onLightChange: () => this.refreshValues(),
      onFullChange: () => this.render(),
      captureUndo: () => this.editMode,
    });
  }

  // -- ViewCtx surface ----------------------------------------------------

  get i18n() { return this.plugin.i18n; }
  get settings() { return this.plugin.settings; }
  get registries() { return this.plugin.registries; }
  get props() { return this.plugin.props; }
  get hide() { return this.plugin.hide; }
  get history() { return this.plugin.history; }
  get layout(): Layout { return this.plugin.ensureLayout(this.activeTypeKey || "character"); }
  /** Vault reads for cross-note aggregates / `prop()` in expressions. */
  get vault(): VaultAccess { return makeVaultAccess(this.plugin.props, () => this.note.path ?? ""); }

  saveLayout(): void { this.plugin.saveSettings(); }
  rerender(): void { this.render(); }

  refreshValues(): void {
    for (const u of this.updaters) {
      try { u(); } catch { /* a single broken updater must not kill the pass */ }
    }
    // Updaters may repaint decorations (badges, chains) fresh — re-decide
    // visibility so a refresh can't resurrect squeezed elements.
    this.responsivePass();
  }

  registerUpdater(fn: () => void): void {
    this.updaters.push(fn);
  }

  resolveType(entry: Entry): string {
    if (entry.dataType) return entry.dataType;
    return this.deriveType(entry.key ?? "");
  }

  deriveType(key: string): string {
    const assigned = this.props.obsidianType(key);
    if (assigned) return assigned;
    const v = this.note.raw[key];
    if (Array.isArray(v)) return "list";
    if (typeof v === "number") return "number";
    if (typeof v === "boolean") return "checkbox";
    return this.settings.defaults.dataType;
  }

  /** @see ViewCtx.condVisible */
  condVisible(showWhen?: string): boolean {
    const expr = (showWhen ?? "").trim();
    if (!expr) return true;
    let ast = this.condCache.get(expr);
    if (ast === undefined) {
      ast = parseExpr(expr);
      this.condCache.set(expr, ast);
    }
    if (!ast) return true; // unparseable conditions never hide (non-blocking)
    const r = evalCondition(ast, this.condEnv());
    return r === undefined ? true : r; // unresolved reference → visible
  }

  /** Expression env resolving names against the active note's frontmatter. */
  private condEnv(): ExprEnv {
    const raw = this.note.raw;
    const find = (name: string): unknown => {
      if (name in raw) return raw[name];
      const lc = name.toLowerCase();
      for (const k in raw) if (k.toLowerCase() === lc) return raw[k];
      return undefined;
    };
    return {
      resolve: (name) => {
        const v = find(name);
        if (typeof v === "number") return v;
        if (typeof v === "boolean") return v ? 1 : 0;
        if (typeof v === "string") {
          const f = parseFloat(v);
          return Number.isFinite(f) ? f : undefined;
        }
        return undefined;
      },
      resolveStr: (name) => {
        const v = find(name);
        if (v === undefined || v === null) return undefined;
        return Array.isArray(v) ? v.map(String).join(", ") : String(v);
      },
    };
  }

  defaultLabelFor(entry: Entry): string {
    const kind = this.registries.entryKinds.get(entry.kind);
    return kind ? kind.defaultLabel(this.i18n, entry) : entry.kind;
  }

  buildCluster(head: HTMLElement, flags: ClusterFlags, o: ClusterOptions): ClusterRefs {
    return buildCluster(head, flags, o, (el, open) => this.bindOpen(el, open));
  }

  bindOpen(el: HTMLElement, open: () => void, markEditable = true): void {
    if (markEditable) el.addClass("ep-editable");
    if (this.editMode) {
      el.setAttr("title", this.i18n.t("hint.clickEdit"));
      el.onclick = (e) => {
        e.preventDefault();
        open();
      };
    } else {
      el.setAttr("title", this.i18n.t("hint.dblEdit"));
      el.ondblclick = () => open();
    }
  }

  renderLinks(el: HTMLElement, text: string): void {
    renderLinkedText(this.app, el, text, this.note.path || "");
  }

  resolveImage(src: string): string {
    src = (src || "").trim();
    const m = src.match(/!?\[\[(.*?)\]\]/);
    const path = m ? m[1].split("|")[0].split("#")[0].trim() : src;
    if (/^(https?:|data:|app:|file:)/.test(path)) return path;
    const f = this.app.metadataCache.getFirstLinkpathDest(path, this.note.path || "");
    if (f) return this.app.vault.getResourcePath(f);
    const af = this.app.vault.getAbstractFileByPath(path);
    if (af instanceof TFile) return this.app.vault.getResourcePath(af);
    return path;
  }

  openColorPicker(initial: string, onPick: (hex: string) => void): void {
    new ColorPickerModal(
      {
        app: this.app,
        i18n: this.i18n,
        getColorSpace: () => this.settings.defaults.colorSpace,
        setColorSpace: (sp) => {
          this.settings.defaults.colorSpace = sp;
          this.plugin.saveSettings();
        },
      },
      initial,
      onPick
    ).open();
  }

  highlight(el: HTMLElement): void {
    const wrap = el.closest(".ep-entry") as HTMLElement | null;
    const c = this.content;
    if (!wrap) return;
    c.findAll(".ep-highlight").forEach((x) => x.removeClass("ep-highlight"));
    wrap.addClass("ep-highlight");
    c.addClass("ep-highlighting");
    window.clearTimeout(this.hlTimer);
    this.hlTimer = window.setTimeout(() => {
      c.removeClass("ep-highlighting");
      wrap.removeClass("ep-highlight");
    }, 1000);
  }

  removeEntry(section: Section, entry: Entry): void {
    const key = entry.kind === "prop" ? entry.key : undefined;
    section.entries = section.entries.filter((x) => x.id !== entry.id);
    this.saveLayout();
    if (key) {
      // If no layout shows this key anymore, also unhide it in Obsidian.
      const stillUsed = Object.keys(this.settings.layouts).some((lk) =>
        this.settings.layouts[lk].sections.some((s) =>
          s.entries.some((e) => e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase())
        )
      );
      if (!stillUsed) this.hide.unhideKey(key);
      else this.render();
    } else {
      this.render();
    }
  }

  renameKey(entry: Entry, newKey: string): void {
    newKey = newKey.trim();
    if (!newKey || newKey === entry.key) return;
    entry.key = newKey;
    // Type-specific settings rarely survive a key change meaningfully.
    entry.alias = undefined;
    entry.slider = undefined;
    entry.sliderCurve = undefined;
    entry.steppers = undefined;
    entry.roll = undefined;
    entry.showMod = undefined;
    entry.showChain = undefined;
    entry.showDice = undefined;
    entry.mods = undefined;
    entry.rollOverride = undefined;
    entry.dice = undefined;
    entry.min = undefined;
    entry.max = undefined;
    entry.clamp = undefined;
    entry.formula = undefined;
    entry.dataType = this.deriveType(newKey);
    this.saveLayout();
    this.render();
  }

  openEntryOptions(section: Section, entry: Entry): void {
    // Property settings live inside the section options: open the section
    // modal with this property's tab pre-selected.
    new SectionOptionsModal(this, section, entry.id).open();
  }

  openAddMenu(anchor: HTMLElement, section: Section, o?: { index?: number; replaceId?: string }): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    this.popupsMgr.openAddMenu(anchor, file, section, o);
  }

  openListValuePicker(x: number, y: number, key: string): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    this.popupsMgr.openListValuePicker(x, y, file, key);
  }

  scrollToSection(id: string): void {
    const sec = this.layout.sections.find((s) => s.id === id);
    if (sec && sec.collapsed) {
      sec.collapsed = false;
      this.saveLayout();
      this.render();
      requestAnimationFrame(() => this.scrollToSection(id));
      return;
    }
    const el = this.sectionEls[id];
    if (!el) return;
    const c = this.content;
    const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - this.stickyTopPx() - 4;
    c.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  propCandidates(includeShown = false): { key: string; onNote: boolean }[] {
    const shown = new Set<string>();
    if (!includeShown)
      for (const sec of this.layout.sections)
        for (const e of sec.entries) if (e.kind === "prop" && e.key) shown.add(e.key.toLowerCase());
    const all = new Set<string>([
      ...Object.keys(this.note.raw).filter((k) => k.toLowerCase() !== "position"),
      ...this.props.knownProps(),
    ]);
    const list: { key: string; onNote: boolean }[] = [];
    for (const k of all) {
      if (shown.has(k.toLowerCase())) continue;
      list.push({ key: k, onNote: this.note.raw[k] !== undefined });
    }
    list.sort((a, b) => (a.onNote === b.onNote ? a.key.localeCompare(b.key) : a.onNote ? -1 : 1));
    return list;
  }

  // -- ItemView lifecycle ---------------------------------------------------

  getViewType(): string { return VIEW_TYPE; }
  getDisplayText(): string { return this.i18n.t("view.title"); }
  getIcon(): string { return "panel-right"; }

  async onOpen(): Promise<void> {
    this.registerDomEvent(window, "resize", () => {
      this.reflowSticky();
      this.responsivePass();
    });
    this.resizeObs = new ResizeObserver(() => {
      this.reflowSticky();
      this.responsivePass();
    });
    this.register(() => this.resizeObs?.disconnect());
    this.registerDomEvent(this.content, "scroll", () => {
      this.content.addClass("ep-scrolling");
      window.clearTimeout(this.scrollTimer);
      this.scrollTimer = window.setTimeout(() => this.content.removeClass("ep-scrolling"), 800);
    });
    // Don't let a scroll/drag that ends on a control fire its tap (mobile).
    this.register(guardScrollTaps(this.content));
    this.render();
  }

  async onClose(): Promise<void> {
    this.popupsMgr.closeAll();
  }

  private get content(): HTMLElement {
    return this.containerEl.children[1] as HTMLElement;
  }

  // -- refresh strategy ------------------------------------------------------

  /**
   * Called on workspace/metadata events. Decides between: do nothing (echo
   * of our own write), in-place value refresh, or full re-render.
   */
  maybeRefresh(file?: TFile): void {
    const active = this.app.workspace.getActiveFile();
    if (!active) {
      this.note.path = null;
      this.render();
      return;
    }
    if (file) {
      if (file.path !== active.path) return;
      if (this.note.isEcho(file)) return;
    }
    if (active.path !== this.note.path) {
      this.note.load(active);
      this.render();
      return;
    }
    this.note.load(active);
    if (this.activeTypeKey && this.emptySig() === this.lastEmptySig) {
      this.refreshValues();
      return;
    }
    this.render();
  }

  /** Signature of which prop entries are empty — visibility changes need a re-render. */
  private emptySig(): string {
    let sig = "";
    for (const s of this.layout.sections) {
      if (s.showWhen) sig += this.condVisible(s.showWhen) ? "S" : "s";
      for (const e of s.entries) {
        if (e.kind === "prop" && e.key) sig += this.note.isEmpty(e.key) ? "0" : "1";
        if (e.showWhen) sig += this.condVisible(e.showWhen) ? "V" : "v";
      }
    }
    return sig;
  }

  // -- edit mode session ------------------------------------------------------

  private enterEdit(): void {
    this.editMode = true;
    this.layoutSnapshot = JSON.stringify(this.layout);
    this.note.clearUndo();
    this.render();
  }

  private hasChanges(): boolean {
    return (this.layoutSnapshot !== null && this.layoutSnapshot !== JSON.stringify(this.layout)) || this.note.hasUndo();
  }

  private requestExit(): void {
    const finish = () => {
      this.editMode = false;
      this.layoutSnapshot = null;
      this.note.clearUndo();
      this.render();
    };
    if (!this.hasChanges()) {
      finish();
      return;
    }
    new ExitEditModal(
      this.app,
      this.i18n,
      finish,
      () => {
        // Undo: restore the layout snapshot and revert edited values.
        if (this.layoutSnapshot && this.activeTypeKey) {
          this.settings.layouts[this.activeTypeKey] = JSON.parse(this.layoutSnapshot);
          this.plugin.saveSettings();
        }
        this.note.revertUndo();
        const active = this.app.workspace.getActiveFile();
        if (active) this.note.load(active);
        finish();
      }
    ).open();
  }

  // -- label rendering (shared by entry kinds) ----------------------------------

  renderLabel(head: HTMLElement, ctx: EntryRenderCtx): void {
    const { entry } = ctx;
    const showLabel = this.editMode || !entry.hideLabel;
    if (!showLabel) return;
    const span = head.createSpan({ cls: "ep-line-name" });
    if (entry.labelSize) span.style.fontSize = entry.labelSize + "px";
    if (entry.labelColor) span.style.color = entry.labelColor as string;
    if (this.editMode && entry.hideLabel) span.addClass("ep-dim");

    if (this.editMode && entry.kind === "prop") {
      // Edit mode, property entry: clicking the label re-points the key.
      span.setText((entry.alias as string) || (entry.key ?? ""));
      span.addClass("ep-editable");
      span.setAttr("title", this.i18n.t("entry.changeKeyHint"));
      span.onclick = (ev) => {
        ev.preventDefault();
        const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
        input.type = "text";
        input.value = entry.key ?? "";
        span.replaceWith(input);
        input.focus();
        input.select();
        new PropSuggest(this.app, input, this.i18n, () => this.propCandidates(), (key) => this.renameKey(entry, key));
        let done = false;
        const finish = (save: boolean) => {
          if (done) return;
          done = true;
          if (input.parentElement) input.replaceWith(span);
          if (save) {
            const v = input.value.trim();
            if (v && v !== entry.key) this.renameKey(entry, v);
          }
        };
        input.onblur = () => setTimeout(() => finish(true), 120);
        input.onkeydown = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            e.preventDefault();
            finish(false);
          }
        };
      };
    } else if (this.editMode) {
      // Edit mode, widget entry: clicking the label edits the alias.
      bindRename(span, (entry.alias as string) ?? "", this.defaultLabelFor(entry), this.i18n.t("entry.renameHint"), (v) => {
        entry.alias = v || undefined;
        this.saveLayout();
        this.render();
      });
    } else {
      span.setText((entry.alias as string) || this.defaultLabelFor(entry));
      span.addClass("ep-clickname");
      span.onclick = () => this.highlight(span);
    }

    // Data-type hint beside the label. Visibility is decided dynamically by
    // the responsive pass (and the per-entry "Show data type" toggle).
    if (entry.kind === "prop" && entry.showType !== false) {
      const typeId = this.resolveType(entry);
      const def = this.registries.valueTypes.get(typeId);
      span.createSpan({ cls: "ep-type-hint", text: def ? def.name(this.i18n) : typeId });
    }
  }

  /**
   * Width-responsive decorations: per section, progressively hide the
   * data-type hints, then the modifier chains, then the dice tags while
   * any row overflows — and bring them back when the sidebar grows.
   * Re-run on every render and on container resize.
   */
  private responsivePass(): void {
    // Decorations need this much spare room before they may stay — derived from
    // the view's font size (~1.5em) so it scales with the user's text size and
    // gives larger touch targets on mobile.
    const SLACK = 1.5 * (parseFloat(getComputedStyle(this.content).fontSize) || 16);
    // Hide order = reverse priority. Label, value and roll button rank
    // highest and are never hidden; then (descending importance) the
    // modifier total, toggle checkboxes, modifier chain, dice, data type —
    // so the data type vanishes first and the modifier badge last.
    const TIERS = [".ep-type-hint", ".ep-dice-tag", ".ep-denote", ".ep-tog-cell", ".ep-mod-badge"];
    for (const el of this.content.findAll(".ep-section")) {
      const sec = el as HTMLElement;
      // Everything below happens synchronously (no paint in between), so
      // unchanged elements never flicker.
      // Skip sections that aren't laid out (collapsed, hidden tab, view
      // off-screen): zero-width measurements would wrongly hide everything.
      // The next pass on a visible section re-decides.
      if (sec.clientWidth === 0) continue;
      sec.addClass("ep-measuring");
      sec.findAll(".ep-squeezed").forEach((x) => x.removeClass("ep-squeezed"));
      alignClustersNow(sec);
      // Decide PER ROW: one cramped row must not strip the decorations off
      // every other row of the section. A row is "tight" when its children
      // genuinely overflow it, or when the label (flex: 1 — it absorbs all
      // spare room) has less than SLACK px left before truncating. The
      // label's content width must be measured with a Range — scrollWidth
      // is max(clientWidth, content) and can never report spare room.
      const spareOf = (n: HTMLElement): number => {
        const r = n.ownerDocument.createRange();
        r.selectNodeContents(n);
        const cw = r.getBoundingClientRect().width;
        r.detach();
        return n.getBoundingClientRect().width - cw;
      };
      for (const h of sec.findAll(".ep-entry-head") as HTMLElement[]) {
        if (h.clientWidth === 0) continue;
        const name = h.querySelector(".ep-line-name") as HTMLElement | null;
        const tight = () =>
          h.scrollWidth > h.clientWidth + 1 || (!!name && spareOf(name) < SLACK);
        for (const cls of TIERS) {
          if (!tight()) break;
          h.findAll(cls).forEach((x) => {
            x.addClass("ep-squeezed");
            // Reclaim the column width the hidden element reserved.
            const cell = x.closest("[data-ep-slot]") as HTMLElement | null;
            if (cell) cell.style.minWidth = "";
          });
        }
      }
      void sec.offsetWidth;
      sec.removeClass("ep-measuring");
    }
  }

  // -- layout & rendering -------------------------------------------------------

  private stickyTopPx(): number {
    const hh = this.headerEl?.offsetHeight || 0;
    const zh = this.stickyZoneEl?.offsetHeight || 0;
    return hh + zh;
  }

  private reflowSticky(): void {
    if (this.headerEl && this.stickyZoneEl) this.stickyZoneEl.style.top = this.headerEl.offsetHeight + "px";
    this.content.style.setProperty("--ep-sticky-top", this.stickyTopPx() + "px");
  }

  /** Animate a container's height change (edit-mode transitions). */
  private animateHeight(el: HTMLElement | null, fromH: number): void {
    if (!el || fromH <= 0) return;
    const toH = el.scrollHeight;
    if (Math.abs(toH - fromH) < 2) return;
    const prevO = el.style.overflow;
    el.style.overflow = "hidden";
    el.style.height = fromH + "px";
    void el.offsetWidth;
    el.style.transition = "height .28s ease";
    el.style.height = toH + "px";
    const done = () => {
      el.style.height = "";
      el.style.transition = "";
      el.style.overflow = prevO;
      el.removeEventListener("transitionend", done);
    };
    el.addEventListener("transitionend", done);
  }

  private applyTypography(container: HTMLElement): void {
    const d = this.settings.defaults;
    const set = (k: string, v: number) => {
      if (v && v > 0) container.style.setProperty(k, v + "px");
      else container.style.removeProperty(k);
    };
    if (d.fontFamily) container.style.setProperty("--ep-font", d.fontFamily);
    else container.style.removeProperty("--ep-font");
    set("--ep-size-base", d.baseSize);
    set("--ep-size-label", d.labelSize);
    set("--ep-size-value", d.valueSize);
    set("--ep-size-title", d.titleSize);
    set("--ep-size-list", d.listSize);
  }

  render(): void {
    const t = this.i18n.t.bind(this.i18n);
    const container = this.content;
    const prevScroll = container.scrollTop;
    const animate = this.modeAnim;
    const oldFlowH = animate && this.flowEl ? this.flowEl.offsetHeight : 0;
    const oldZoneH = animate && this.stickyZoneEl ? this.stickyZoneEl.offsetHeight : 0;
    container.empty();
    container.addClass("ep-sidebar");
    container.toggleClass("ep-editing", this.editMode);
    this.applyTypography(container);
    if (animate) {
      container.addClass("ep-mode-anim");
      this.modeAnim = false;
      window.setTimeout(() => container.removeClass("ep-mode-anim"), 320);
    }
    this.updaters = [];
    this.sectionEls = {};

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      this.note.path = null;
      container.createDiv({ cls: "ep-empty", text: t("view.noNote") });
      return;
    }
    if (this.note.path !== file.path) {
      this.note.load(file);
      this.hub.notifyFileChanged();
    }

    // Match the note's Type against configured types; adopt unknown types.
    const types = this.note.noteTypes();
    let match = this.settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
    if (!match && types.length) {
      match = types[0];
      if (!this.settings.types.some((tp) => tp.toLowerCase() === match!.toLowerCase())) this.settings.types.push(match);
      this.plugin.ensureLayout(match.toLowerCase());
      this.plugin.saveSettings();
    }
    this.activeTypeKey = match ? match.toLowerCase() : null;

    if (!match) {
      const box = container.createDiv({ cls: "ep-empty" });
      box.createDiv({ text: t("view.noType", { note: file.basename }) });
      if (this.settings.types.length) {
        box.createDiv({ cls: "ep-empty-sub", text: t("view.noTypeHint") });
        for (const tp of this.settings.types) {
          const b = box.createEl("button", { text: t("view.setType", { type: tp }), cls: "mod-cta" });
          b.onclick = () => this.note.set(file, "Type", tp, true);
        }
      } else {
        // No default type exists — any Type value the note gets is adopted
        // as a new, empty type.
        box.createDiv({ cls: "ep-empty-sub", text: t("view.noTypesConfigured") });
      }
      return;
    }

    // -- header ---------------------------------------------------------------
    const header = container.createDiv({ cls: "ep-header" });
    this.headerEl = header;
    const titleRow = header.createDiv({ cls: "ep-titlerow" });
    titleRow.createDiv({ cls: "ep-title", text: file.basename });
    const badge = titleRow.createSpan({ cls: "ep-type-badge", text: match });
    badge.setAttr("title", t("view.typeBadgeHint"));
    const editBtn = titleRow.createEl("button", {
      cls: "ep-edit-toggle",
      text: this.editMode ? t("view.done") : t("view.edit"),
    });
    if (this.editMode) editBtn.addClass("is-active");
    editBtn.setAttr("title", this.editMode ? t("view.doneHint") : t("view.editHint"));
    editBtn.onclick = () => {
      this.modeAnim = true;
      if (this.editMode) this.requestExit();
      else this.enterEdit();
    };

    if (this.editMode) {
      const tools = header.createDiv({ cls: "ep-toolbar" });
      const addSec = tools.createEl("button", { text: t("view.addSection"), cls: "ep-tool-btn" });
      addSec.onclick = () => {
        const d = this.settings.defaults;
        this.layout.sections.unshift({
          id: genId(),
          title: t("section.newName"),
          columns: d.sectionColumns,
          transparent: d.sectionTransparent,
          sticky: d.sectionSticky,
          size: d.sectionSize,
          collapsible: d.sectionCollapsible,
          dividers: d.sectionDividers,
          entries: [],
        });
        this.saveLayout();
        this.render();
      };
      const reset = tools.createEl("button", { text: t("view.resetAll"), cls: "ep-tool-btn" });
      reset.onclick = () =>
        new ConfirmModal(this.app, this.i18n, t("view.resetConfirm", { type: match! }), () =>
          this.plugin.resetLayout(this.activeTypeKey!)
        ).open();

      // Section templates registered by features.
      const templates = this.registries.sectionTemplates.all();
      if (templates.length) {
        const defRow = header.createDiv({ cls: "ep-default-row" });
        defRow.createSpan({ cls: "ep-default-lbl", text: t("view.addTemplates") });
        for (const tpl of templates) {
          const b = defRow.createEl("button", { text: tpl.name(this.i18n), cls: "ep-mini-btn" });
          b.onclick = () => this.addOrResetTemplate(tpl.id);
        }
      }
    }

    // -- sections -----------------------------------------------------------
    this.stickyZoneEl = container.createDiv({ cls: "ep-sticky-zone" });
    const flow = container.createDiv({ cls: "ep-flow" });
    this.flowEl = flow;
    const host = {
      registerSectionEl: (id: string, el: HTMLElement) => (this.sectionEls[id] = el),
      reflowSticky: () => this.reflowSticky(),
    };
    for (const section of this.layout.sections)
      renderSection(section.sticky ? this.stickyZoneEl : flow, this, file, section, this.drag, host);
    this.lastEmptySig = this.emptySig();

    container.scrollTop = prevScroll;
    requestAnimationFrame(() => {
      this.reflowSticky();
      // After the per-section alignment passes have run.
      requestAnimationFrame(() => this.responsivePass());
    });
    if (this.resizeObs) {
      this.resizeObs.disconnect();
      if (this.headerEl) this.resizeObs.observe(this.headerEl);
      if (this.stickyZoneEl) this.resizeObs.observe(this.stickyZoneEl);
      if (this.flowEl) this.resizeObs.observe(this.flowEl);
    }
    if (animate)
      requestAnimationFrame(() => {
        this.animateHeight(this.flowEl, oldFlowH);
        this.animateHeight(this.stickyZoneEl, oldZoneH);
      });
  }

  /** Add a template section, or offer to reset it when it already exists. */
  private addOrResetTemplate(id: string): void {
    const tpl = this.registries.sectionTemplates.get(id);
    if (!tpl) return;
    const existing = this.layout.sections.find((s) => s.id === id);
    const apply = () => {
      const fresh = tpl.build(this.i18n);
      if (existing) {
        const idx = this.layout.sections.findIndex((s) => s.id === id);
        this.layout.sections[idx] = fresh;
      } else {
        this.layout.sections.unshift(fresh);
      }
      this.provisionTemplateSources(tpl, fresh);
      this.seedTemplateProperties(fresh);
      this.saveLayout();
      this.render();
    };
    if (existing)
      new ConfirmModal(this.app, this.i18n, this.i18n.t("view.templateResetConfirm", { name: existing.title }), apply).open();
    else apply();
  }

  /**
   * Make every modifier source a template refers to a real, editable
   * property entry: first the entries the template declares (with their
   * full configuration, e.g. a derived proficiency bonus), then plain
   * number entries for any remaining influence sources.
   */
  private provisionTemplateSources(tpl: SectionTemplateDef, fresh: Section): void {
    const have = new Set<string>();
    for (const s of this.layout.sections)
      for (const e of s.entries) if (e.kind === "prop" && e.key) have.add(e.key.toLowerCase());
    const declared = (tpl.sources?.(this.i18n) ?? []).filter(
      (e) => e.key && !have.has((e.key as string).toLowerCase())
    );
    for (const e of declared) have.add((e.key as string).toLowerCase());
    fresh.entries.unshift(...declared);
    // Whatever is still referenced but missing becomes a plain number.
    ops.ensurePropEntries(this.layout, fresh, influenceSources(fresh.entries));
  }

  /**
   * Template properties become real note properties right away (value
   * `null` for the ones the note doesn't have yet). They stay hidden from
   * Obsidian's properties panel through the usual hide-shown rule, since
   * they are now shown in the sidebar.
   */
  private seedTemplateProperties(fresh: Section): void {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const missing: Record<string, unknown> = {};
    for (const e of fresh.entries)
      if (e.kind === "prop" && e.key && this.note.raw[e.key] === undefined) missing[e.key] = null;
    if (Object.keys(missing).length) this.note.setMany(file, missing);
  }
}
