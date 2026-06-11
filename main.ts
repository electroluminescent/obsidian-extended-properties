import {
  AbstractInputSuggest, App, ItemView, Menu, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf, setIcon, getIconIds,
} from "obsidian";

const VIEW_TYPE = "extended-properties-character";
const HIDE_STYLE_ID = "ep-hide-properties";

type RollMode = "normal" | "advantage" | "disadvantage";
type PropType = "number" | "decimal" | "text" | "list" | "checkbox" | "color" | "formula" | "image" | "iframe";
type EntryKind = "prop" | "computed" | "saves" | "skills" | "rolls" | "toc" | "blank";
type RollKind = "value" | "abilityMod";
type ColorSpace = "RGB" | "HSL" | "OKLCH" | "OKLab";
type SectionSize = "s" | "m" | "l" | "unlimited";
type LayoutMode = "list" | "columns" | "grid";

const COLOR_SPACES: ColorSpace[] = ["RGB", "HSL", "OKLCH", "OKLab"];
const CH_LONG: Record<string, string> = { R: "Red", G: "Green", B: "Blue", H: "Hue", S: "Saturation", L: "Lightness", C: "Chroma", A: "a (green–red)", B2: "b (blue–yellow)" };

function clampN(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = (hex || "").trim().replace(/^#/, ""); if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex(r: number, g: number, b: number): string { const h = (n: number) => Math.round(clampN(n, 0, 255)).toString(16).padStart(2, "0"); return "#" + h(r) + h(g) + h(b); }
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2; const d = max - min;
  if (d) { s = l > 0.5 ? d / (2 - max - min) : d / (max + min); if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  return { h, s: s * 100, l: l * 100 };
}
function hslToRgb(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360; s = clampN(s, 0, 100) / 100; l = clampN(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const m = l - c / 2; let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function srgbToLin(c: number) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function linToSrgb(c: number) { const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055; return clampN(v * 255, 0, 255); }
function rgbToOklab(r: number, g: number, b: number) {
  const lr = srgbToLin(r), lg = srgbToLin(g), lb = srgbToLin(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb, m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb, s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return { L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_, a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_, b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_ };
}
function oklabToLin(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b; const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return { lr: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, lg: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, lb: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s };
}
function oklabToRgb(L: number, a: number, b: number) { const c = oklabToLin(L, a, b); return { r: linToSrgb(c.lr), g: linToSrgb(c.lg), b: linToSrgb(c.lb) }; }
function rgbToOklch(r: number, g: number, b: number) { const o = rgbToOklab(r, g, b); const C = Math.sqrt(o.a * o.a + o.b * o.b); let H = (Math.atan2(o.b, o.a) * 180) / Math.PI; if (H < 0) H += 360; return { L: o.L, C, H }; }
function oklchToLin(L: number, C: number, H: number) { const hr = (H * Math.PI) / 180; return oklabToLin(L, C * Math.cos(hr), C * Math.sin(hr)); }
function oklchToRgb(L: number, C: number, H: number) { const c = oklchToLin(L, C, H); return { r: linToSrgb(c.lr), g: linToSrgb(c.lg), b: linToSrgb(c.lb) }; }
function inGamutLin(c: { lr: number; lg: number; lb: number }) { const e = 0.0015; return c.lr >= -e && c.lr <= 1 + e && c.lg >= -e && c.lg <= 1 + e && c.lb >= -e && c.lb <= 1 + e; }
function gradStops(samples: number, at: (t: number) => { rgb: { r: number; g: number; b: number }; oog: boolean }): string {
  const stops: string[] = [];
  for (let i = 0; i <= samples; i++) { const t = i / samples; const { rgb, oog } = at(t); const pct = Math.round(t * 100); const r = Math.round(rgb.r), g = Math.round(rgb.g), b = Math.round(rgb.b); stops.push((oog ? `rgba(${r},${g},${b},0.15)` : `rgb(${r},${g},${b})`) + ` ${pct}%`); }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function compileFormula(expr: string): ((x: number) => number) | null {
  const s = expr; let i = 0; const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; }; const peek = () => s[i]; type F = (x: number) => number;
  const map1: Record<string, (n: number) => number> = { sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign, ln: Math.log, log: (v) => Math.log10(v) };
  function pe(): F { let n = pt(); ws(); while (peek() === "+" || peek() === "-") { const op = s[i++]; const r = pt(); const a = n; n = op === "+" ? (x) => a(x) + r(x) : (x) => a(x) - r(x); ws(); } return n; }
  function pt(): F { let n = pf(); ws(); while (peek() === "*" || peek() === "/") { const op = s[i++]; const r = pf(); const a = n; n = op === "*" ? (x) => a(x) * r(x) : (x) => a(x) / r(x); ws(); } return n; }
  function pf(): F { ws(); if (peek() === "-") { i++; const f = pf(); return (x) => -f(x); } if (peek() === "+") { i++; return pf(); } let n = pb(); ws(); while (peek() === "^") { i++; const r = pf(); const a = n; n = (x) => Math.pow(a(x), r(x)); ws(); } return n; }
  function pb(): F {
    ws(); const c = peek();
    if (c === "(") { i++; const e = pe(); ws(); if (peek() === ")") i++; else throw 0; return e; }
    if (c !== undefined && /[0-9.]/.test(c)) { let num = ""; while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++]; if ((num.match(/\./g) || []).length > 1 || num === ".") throw 0; const v = parseFloat(num); if (!Number.isFinite(v)) throw 0; return () => v; }
    if (c !== undefined && /[a-zA-Z_]/.test(c)) {
      let id = ""; while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) id += s[i++]; ws();
      if (peek() === "(") { i++; const args: F[] = [pe()]; ws(); while (peek() === ",") { i++; args.push(pe()); ws(); } if (peek() === ")") i++; else throw 0; const a0 = args[0];
        if (map1[id]) { const fn = map1[id]; return (x) => fn(a0(x)); } if (id === "pow") { const b = args[1]; return (x) => Math.pow(a0(x), b(x)); } if (id === "min") return (x) => Math.min(...args.map((a) => a(x))); if (id === "max") return (x) => Math.max(...args.map((a) => a(x))); if (id === "log" && args.length === 2) { const b = args[1]; return (x) => Math.log(a0(x)) / Math.log(b(x)); } throw 0; }
      if (id === "x") return (x) => x; if (id === "pi") return () => Math.PI; if (id === "e") return () => Math.E; throw 0;
    }
    throw 0;
  }
  try { ws(); const fn = pe(); ws(); if (i !== s.length) return null; const t = fn(1); if (typeof t !== "number" || Number.isNaN(t)) return null; return fn; } catch { return null; }
}
function invertFormula(f: (x: number) => number, target: number, min: number, max: number): number { const N = 400; let bx = min, bd = Infinity; for (let k = 0; k <= N; k++) { const x = min + ((max - min) * k) / N; const y = f(x); if (Number.isFinite(y)) { const d = Math.abs(y - target); if (d < bd) { bd = d; bx = x; } } } return bx; }

interface Ability { key: string; abbr: string; }
const ABILITIES: Ability[] = [{ key: "Strength", abbr: "STR" }, { key: "Dexterity", abbr: "DEX" }, { key: "Constitution", abbr: "CON" }, { key: "Intelligence", abbr: "INT" }, { key: "Wisdom", abbr: "WIS" }, { key: "Charisma", abbr: "CHA" }];
const ABBR: Record<string, string> = Object.fromEntries(ABILITIES.map((a) => [a.key, a.abbr]));
const SKILLS: { name: string; ability: string }[] = [{ name: "Acrobatics", ability: "Dexterity" }, { name: "Animal Handling", ability: "Wisdom" }, { name: "Arcana", ability: "Intelligence" }, { name: "Athletics", ability: "Strength" }, { name: "Deception", ability: "Charisma" }, { name: "History", ability: "Intelligence" }, { name: "Insight", ability: "Wisdom" }, { name: "Intimidation", ability: "Charisma" }, { name: "Investigation", ability: "Intelligence" }, { name: "Medicine", ability: "Wisdom" }, { name: "Nature", ability: "Intelligence" }, { name: "Perception", ability: "Wisdom" }, { name: "Performance", ability: "Charisma" }, { name: "Persuasion", ability: "Charisma" }, { name: "Religion", ability: "Intelligence" }, { name: "Sleight of Hand", ability: "Dexterity" }, { name: "Stealth", ability: "Dexterity" }, { name: "Survival", ability: "Wisdom" }];
const SAVE_PROF_KEY = "Saving Throw Proficiencies";
const SKILL_PROF_KEY = "Skill Proficiencies";
const ABILITY_DEFAULT = 10;

interface Entry { id: string; kind: EntryKind; key?: string; alias?: string; dataType?: PropType; slider?: boolean; min?: number; max?: number; clamp?: boolean; formula?: string; roll?: RollKind; rollSource?: string; rollOverride?: number; showMod?: boolean; computed?: "proficiency" | "initiative"; showInObsidian?: boolean; icon?: string; hideLabel?: boolean; labelSize?: number; valueSize?: number; labelColor?: string; valueColor?: string; size?: SectionSize; iframeScale?: number; iframeHeight?: number; iconColor?: string; hideIfEmpty?: boolean; }
interface Section { id: string; title: string; columns: number; layoutMode?: LayoutMode; rows?: number; collapsed?: boolean; entries: Entry[]; accent?: string; bg?: string; controlColor?: string; titleSize?: number; transparent?: boolean; sticky?: boolean; size?: SectionSize; icon?: string; hideLabel?: boolean; collapsible?: boolean; dividers?: boolean; vdividers?: boolean; iconColor?: string; hideIfEmpty?: boolean; }
interface Layout { version: number; sections: Section[]; }
interface Defaults { dataType: PropType; colorSpace: ColorSpace; sectionColumns: number; sectionTransparent: boolean; sectionSticky: boolean; sectionSize: SectionSize; sectionCollapsible: boolean; sectionDividers: boolean; fontFamily: string; baseSize: number; labelSize: number; valueSize: number; titleSize: number; listSize: number; }
interface EPSettings { types: string[]; layouts: Record<string, Layout>; hideShown: boolean; defaults: Defaults; manualHide: string[]; propMenu: boolean; }
const DEFAULT_DEFAULTS: Defaults = { dataType: "text", colorSpace: "HSL", sectionColumns: 1, sectionTransparent: false, sectionSticky: false, sectionSize: "unlimited", sectionCollapsible: true, sectionDividers: false, fontFamily: "", baseSize: 0, labelSize: 0, valueSize: 0, titleSize: 0, listSize: 0 };

function abilityMod(s: number): number { return Math.floor((s - 10) / 2); }
function profBonus(l: number): number { return 2 + Math.floor((Math.max(1, l) - 1) / 4); }
function fmtMod(m: number): string { return (m >= 0 ? "+" : "") + m; }
function fmtNum(n: number): string { return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000); }
function clamp(n: number, min: number, max: number): number { return Math.min(max, Math.max(min, n)); }
function d20(): number { return 1 + Math.floor(Math.random() * 20); }
function rollByMode(mode: RollMode): { rolls: number[]; used: number } { if (mode === "normal") { const r = d20(); return { rolls: [r], used: r }; } const a = d20(); const b = d20(); return { rolls: [a, b], used: mode === "advantage" ? Math.max(a, b) : Math.min(a, b) }; }
function noteTypes(raw: Record<string, unknown>): string[] { for (const k of Object.keys(raw)) if (k.toLowerCase() === "type") { const v = raw[k]; return Array.isArray(v) ? v.map((x) => String(x)) : v === undefined || v === null ? [] : [String(v)]; } return []; }
function getNum(raw: Record<string, unknown>, key: string, def: number): number { const n = Number(raw?.[key]); return Number.isFinite(n) ? n : def; }
function getStr(raw: Record<string, unknown>, key: string): string { const v = raw?.[key]; return v === undefined || v === null ? "" : String(v); }
function getList(raw: Record<string, unknown>, key: string): string[] { const v = raw?.[key]; if (Array.isArray(v)) return v.map((x) => String(x)); if (v === undefined || v === null || v === "") return []; return [String(v)]; }
function genId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function pEntry(key: string, extra: Partial<Entry> = {}): Entry { return { id: genId(), kind: "prop", key, ...extra }; }

const SPECIAL_IDS = ["rolls", "details", "vitals", "abilities", "saves", "skills"];
function specialSection(id: string): Section | null {
  if (id === "rolls") return { id: "rolls", title: "Contents", columns: 2, layoutMode: "columns", sticky: true, collapsible: true, entries: [{ id: genId(), kind: "toc" }, { id: genId(), kind: "rolls" }] };
  if (id === "details") return { id: "details", title: "Details", columns: 1, dividers: true, entries: [pEntry("Class"), pEntry("Subclass"), pEntry("Race"), pEntry("Background"), pEntry("Alignment")] };
  if (id === "vitals") return { id: "vitals", title: "Vitals", columns: 2, layoutMode: "columns", dividers: true, entries: [pEntry("Level", { dataType: "number", min: 1, max: 20 }), { id: genId(), kind: "computed", computed: "proficiency" }, pEntry("Armor Class", { dataType: "number", min: 0, max: 40 }), pEntry("Speed", { dataType: "number", min: 0, max: 200 }), pEntry("Current HP", { dataType: "number", min: 0, max: 9999 }), pEntry("Max HP", { dataType: "number", min: 0, max: 9999 }), { id: genId(), kind: "computed", computed: "initiative" }] };
  if (id === "abilities") return { id: "abilities", title: "Ability Scores", columns: 1, dividers: true, entries: ABILITIES.map((a) => pEntry(a.key, { dataType: "number", slider: true, min: 1, max: 30, clamp: true, roll: "abilityMod", showMod: true })) };
  if (id === "saves") return { id: "saves", title: "Saving Throws", columns: 1, entries: [{ id: genId(), kind: "saves" }] };
  if (id === "skills") return { id: "skills", title: "Skills", columns: 1, entries: [{ id: genId(), kind: "skills" }] };
  return null;
}
function defaultLayout(): Layout { return { version: 4, sections: SPECIAL_IDS.map((id) => specialSection(id)!) }; }

interface RollEntry { text: string; tone: "normal" | "crit" | "fail"; }
interface DragData { kind: "section" | "entry"; id: string; from?: string; }

export default class ExtendedPropertiesPlugin extends Plugin {
  settings: EPSettings = { types: ["Character"], layouts: { character: defaultLayout() }, hideShown: true, defaults: { ...DEFAULT_DEFAULTS }, manualHide: [], propMenu: true };
  private hideStyleEl: HTMLStyleElement | null = null;
  async onload() {
    await this.loadSettings();
    this.hideStyleEl = document.head.createEl("style", { attr: { id: HIDE_STYLE_ID } }); this.register(() => this.hideStyleEl?.remove()); this.updateHideStyle();
    this.registerView(VIEW_TYPE, (leaf) => new CharacterSidebarView(leaf, this));
    this.addRibbonIcon("dice-6", "Open character sidebar", () => this.activateView());
    this.addCommand({ id: "open-character-sidebar", name: "Open character sidebar", callback: () => this.activateView() });
    this.addCommand({ id: "hide-property-from-obsidian", name: "Hide a property from Obsidian\u2019s properties panel", callback: () => new TextPromptModal(this.app, "Property name to hide", "", (v) => { const k = v.trim(); if (!k) return; if (!this.settings.manualHide.includes(k)) this.settings.manualHide.push(k); this.saveSettings(); new Notice(`Hiding “${k}” from Obsidian properties.`); }, () => this.knownProps()).open() });
    this.addSettingTab(new EPSettingTab(this.app, this));
    const refresh = (file?: TFile) => { for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) { const v = leaf.view; if (v instanceof CharacterSidebarView) v.maybeRefresh(file); } };
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => refresh()));
    this.registerEvent(this.app.workspace.on("file-open", () => refresh()));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => refresh(file)));
    this.registerDomEvent(document, "contextmenu", (e: MouseEvent) => { if (!this.settings.propMenu) return; const t = e.target as HTMLElement; const el = t && t.closest ? (t.closest(".metadata-property") as HTMLElement | null) : null; if (!el) return; const key = el.getAttribute("data-property-key"); if (!key) return; e.preventDefault(); e.stopPropagation(); this.showPropMenu(e, key); }, true);
    this.registerDomEvent(document, "contextmenu", (e: MouseEvent) => { if (!this.settings.propMenu) return; const t = e.target as HTMLElement; if (!t || !t.closest || !t.closest(".metadata-properties-heading")) return; window.setTimeout(() => this.augmentPropsMenu(), 0); }, false);
  }
  async loadSettings() {
    const data: any = await this.loadData(); const s: EPSettings = { types: ["Character"], layouts: { character: defaultLayout() }, hideShown: true, defaults: { ...DEFAULT_DEFAULTS }, manualHide: [], propMenu: true };
    if (data) { if (data.layouts && data.types) { s.types = data.types; s.layouts = data.layouts; } else if (data.layout?.sections?.length) { s.types = ["Character"]; s.layouts = { character: data.layout }; } if (typeof data.hideShown === "boolean") s.hideShown = data.hideShown; if (data.defaults) s.defaults = { ...DEFAULT_DEFAULTS, ...data.defaults }; if (Array.isArray(data.manualHide)) s.manualHide = data.manualHide; if (typeof data.propMenu === "boolean") s.propMenu = data.propMenu; }
    if (!s.types.length) s.types = ["Character"]; for (const t of s.types) { const k = t.toLowerCase(); if (!s.layouts[k]?.sections) s.layouts[k] = defaultLayout(); }
    this.settings = s;
  }
  async saveSettings() { await this.saveData(this.settings); this.updateHideStyle(); }
  ensureLayout(typeKey: string): Layout { if (!this.settings.layouts[typeKey]?.sections) this.settings.layouts[typeKey] = defaultLayout(); return this.settings.layouts[typeKey]; }
  resetLayout(typeKey: string) { this.settings.layouts[typeKey] = defaultLayout(); this.saveSettings(); this.refreshViews(); }
  refreshViews() { for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) { const v = leaf.view; if (v instanceof CharacterSidebarView) v.render(); } }
  updateHideStyle() {
    if (!this.hideStyleEl) return;
    const keys = new Set<string>(); if (this.settings.hideShown) for (const k of Object.keys(this.settings.layouts)) for (const s of this.settings.layouts[k].sections) for (const e of s.entries) if (e.kind === "prop" && e.key && !e.showInObsidian) keys.add(e.key.toLowerCase());
    for (const k of this.settings.manualHide || []) keys.add(k.toLowerCase());
    const esc = (k: string) => k.replace(/\\/g, "\\\\").replace(/"/g, '\\"'); this.hideStyleEl.textContent = [...keys].map((k) => `.metadata-property[data-property-key="${esc(k)}"]{display:none!important;}`).join("\n");
  }
  hiddenKeys(): { key: string; manual: boolean }[] {
    const out = new Map<string, boolean>();
    for (const k of this.settings.manualHide) out.set(k, true);
    if (this.settings.hideShown) for (const lk of Object.keys(this.settings.layouts)) for (const s of this.settings.layouts[lk].sections) for (const e of s.entries) if (e.kind === "prop" && e.key && !e.showInObsidian && !out.has(e.key)) out.set(e.key, false);
    return [...out.entries()].map(([key, manual]) => ({ key, manual })).sort((a, b) => a.key.localeCompare(b.key));
  }
  unhideKey(key: string) {
    this.settings.manualHide = this.settings.manualHide.filter((k) => k.toLowerCase() !== key.toLowerCase());
    for (const lk of Object.keys(this.settings.layouts)) for (const s of this.settings.layouts[lk].sections) for (const e of s.entries) if (e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase()) e.showInObsidian = true;
    this.saveSettings(); this.refreshViews();
  }
  isHidden(key: string): boolean {
    if (this.settings.manualHide.some((k) => k.toLowerCase() === key.toLowerCase())) return true;
    if (!this.settings.hideShown) return false;
    for (const lk of Object.keys(this.settings.layouts)) for (const sec of this.settings.layouts[lk].sections) for (const en of sec.entries) if (en.kind === "prop" && en.key && en.key.toLowerCase() === key.toLowerCase() && !en.showInObsidian) return true;
    return false;
  }
  toggleHide(key: string) { if (this.isHidden(key)) this.unhideKey(key); else { if (!this.settings.manualHide.includes(key)) this.settings.manualHide.push(key); this.saveSettings(); } }
  showPropMenu(e: MouseEvent, key: string) {
    const menu = new Menu();
    const hid = this.isHidden(key);
    menu.addItem((i) => i.setTitle((hid ? `Show "${key}"` : `Hide "${key}"`) + " in properties (all notes)").setIcon(hid ? "eye" : "eye-off").onClick(() => this.toggleHide(key)));
    const af = this.app.workspace.getActiveFile(); const fm = af ? this.app.metadataCache.getFileCache(af)?.frontmatter : null;
    const noteKeys = new Set<string>(); if (fm) for (const k of Object.keys(fm)) if (k.toLowerCase() !== "position") noteKeys.add(k);
    const tv: string[] = []; if (fm) { const raw: any = (fm as any)["Type"] ?? (fm as any)["type"]; if (Array.isArray(raw)) raw.forEach((x) => tv.push(String(x))); else if (raw != null) tv.push(String(raw)); }
    const tkey = this.settings.types.find((t) => tv.some((x) => x.toLowerCase() === t.toLowerCase()))?.toLowerCase();
    const layout = tkey ? this.settings.layouts[tkey] : undefined;
    const inSec = new Set<string>(); const grps: { title: string; keys: string[] }[] = [];
    if (layout) for (const sec of layout.sections) { const ks: string[] = []; for (const en of sec.entries) if (en.kind === "prop" && en.key) { ks.push(en.key); inSec.add(en.key.toLowerCase()); } if (ks.length) grps.push({ title: sec.title, keys: ks }); }
    const inNotes = [...noteKeys].filter((k) => !inSec.has(k.toLowerCase()));
    const others = [...this.settings.manualHide].filter((k) => !inSec.has(k.toLowerCase()) && !noteKeys.has(k));
    if (grps.length || inNotes.length || others.length) menu.addItem((i) => {
      i.setTitle("Hide / show properties").setIcon("eye"); const sub = (i as any).setSubmenu ? (i as any).setSubmenu() : null; if (!sub) return;
      const grp = (title: string, keys: string[]) => { if (!keys.length) return; sub.addItem((h: any) => h.setTitle(title).setDisabled(true)); for (const k of [...new Set(keys)].sort((a, b) => a.localeCompare(b))) { const hd = this.isHidden(k); sub.addItem((si: any) => si.setTitle(hd ? `  Show "${k}"` : `  Hide "${k}"`).setIcon(hd ? "eye" : "eye-off").onClick(() => { this.toggleHide(k); window.setTimeout(() => this.showPropMenu(e, key), 0); })); } };
      for (const g of grps) grp(g.title, g.keys); grp("In notes", inNotes); grp("Other", others);
    });
    menu.showAtMouseEvent(e);
  }
  augmentPropsMenu() {
    const menus = document.querySelectorAll(".menu"); const menu = menus[menus.length - 1] as HTMLElement | undefined;
    if (!menu || menu.querySelector(".ep-injected")) return;
    menu.createDiv({ cls: "menu-separator ep-injected" });
    const hidden = this.hiddenKeys();
    const head = menu.createDiv({ cls: "menu-item ep-injected is-disabled" }); head.createDiv({ cls: "menu-item-title", text: "Hidden properties" });
    if (!hidden.length) { const none = menu.createDiv({ cls: "menu-item ep-injected is-disabled" }); none.createDiv({ cls: "menu-item-title", text: "None hidden" }); return; }
    for (const h of hidden) { const it = menu.createDiv({ cls: "menu-item ep-injected" }); const ic = it.createDiv({ cls: "menu-item-icon" }); setIcon(ic, "eye"); it.createDiv({ cls: "menu-item-title", text: h.manual ? h.key : h.key + " (sidebar)" }); it.addEventListener("click", () => { this.unhideKey(h.key); menu.remove(); }); }
    if (hidden.length > 1) { const all = menu.createDiv({ cls: "menu-item ep-injected" }); const ic = all.createDiv({ cls: "menu-item-icon" }); setIcon(ic, "eye"); all.createDiv({ cls: "menu-item-title", text: "Show all hidden" }); all.addEventListener("click", () => { for (const h of hidden) this.unhideKey(h.key); menu.remove(); }); }
  }
  obsidianType(key: string): PropType | null { try { const mt: any = (this.app as any).metadataTypeManager; const t: string | undefined = mt?.getAssignedType?.(key) ?? mt?.properties?.[key.toLowerCase()]?.type; if (!t) return null; if (t === "number") return "number"; if (t === "checkbox") return "checkbox"; if (t === "multitext" || t === "tags" || t === "aliases") return "list"; return "text"; } catch { return null; } }
  knownProps(): string[] { const names = new Set<string>(); try { const mc: any = this.app.metadataCache; const infos = mc.getAllPropertyInfos?.(); if (infos) for (const k of Object.keys(infos)) names.add(infos[k]?.name ?? k); const mt: any = (this.app as any).metadataTypeManager; if (mt?.properties) for (const k of Object.keys(mt.properties)) names.add(mt.properties[k]?.name ?? k); } catch { /* ignore */ } if (names.size === 0) for (const f of this.app.vault.getMarkdownFiles().slice(0, 1000)) { const fm = this.app.metadataCache.getFileCache(f)?.frontmatter; if (fm) for (const k of Object.keys(fm)) names.add(k); } return [...names]; }
  valuesFor(key: string): string[] { const set = new Set<string>(); for (const f of this.app.vault.getMarkdownFiles()) { const v = this.app.metadataCache.getFileCache(f)?.frontmatter?.[key]; if (Array.isArray(v)) v.forEach((x) => set.add(String(x))); else if (v !== undefined && v !== null && v !== "") set.add(String(v)); } return [...set].sort((a, b) => a.localeCompare(b)); }
  notesWithValue(key: string, value: string): string[] { const out: string[] = []; for (const f of this.app.vault.getMarkdownFiles()) { const v = this.app.metadataCache.getFileCache(f)?.frontmatter?.[key]; const has = Array.isArray(v) ? v.some((x) => String(x) === value) : v !== undefined && v !== null && String(v) === value; if (has) out.push(f.basename); } return out; }
  async activateView() { const { workspace } = this.app; let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0]; if (!leaf) { const right = workspace.getRightLeaf(false); if (!right) return; leaf = right; await leaf.setViewState({ type: VIEW_TYPE, active: true }); } workspace.revealLeaf(leaf); }
}

class CharacterSidebarView extends ItemView {
  plugin: ExtendedPropertiesPlugin;
  rollMode: RollMode = "normal";
  editMode = false;
  currentPath: string | null = null;
  raw: Record<string, unknown> = {};
  log: RollEntry[] = [];
  logEl: HTMLElement | null = null;
  dragData: DragData | null = null;
  modeAnim = false;
  private ro: ResizeObserver | null = null;
  activeTypeKey: string | null = null;
  private headerEl: HTMLElement | null = null;
  private stickyZoneEl: HTMLElement | null = null;
  private flowEl: HTMLElement | null = null;
  private sectionEls: Record<string, HTMLElement> = {};
  private modeBtns: HTMLElement[] = [];
  private updaters: (() => void)[] = [];
  private lastEmptySig = "";
  private popups: HTMLElement[] = [];
  private notesWin: HTMLElement | null = null;
  private hlTimer = 0;
  private scrollTimer = 0;
  private lastWritePath: string | null = null;
  private lastWriteTime = 0;
  private layoutSnapshot: string | null = null;
  private valueUndo = new Map<string, { path: string; key: string; old: unknown }>();

  constructor(leaf: WorkspaceLeaf, plugin: ExtendedPropertiesPlugin) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW_TYPE; } getDisplayText() { return "Character"; } getIcon() { return "dice-6"; }
  async onOpen() { this.registerDomEvent(window, "resize", () => this.reflowSticky()); this.ro = new ResizeObserver(() => this.reflowSticky()); this.register(() => this.ro?.disconnect()); this.registerDomEvent(this.content, "scroll", () => { this.content.addClass("ep-scrolling"); window.clearTimeout(this.scrollTimer); this.scrollTimer = window.setTimeout(() => this.content.removeClass("ep-scrolling"), 800); }); this.render(); }
  async onClose() { this.closePopups(); }

  private get layout(): Layout { return this.plugin.ensureLayout(this.activeTypeKey || "character"); }
  private save() { this.plugin.saveSettings(); }
  private get content(): HTMLElement { return this.containerEl.children[1] as HTMLElement; }
  private stickyTopPx() { const hh = this.headerEl?.offsetHeight || 0; const zh = this.stickyZoneEl?.offsetHeight || 0; return hh + zh; }
  private animateHeight(el: HTMLElement | null, fromH: number) { if (!el || fromH <= 0) return; const toH = el.scrollHeight; if (Math.abs(toH - fromH) < 2) return; const prevO = el.style.overflow; el.style.overflow = "hidden"; el.style.height = fromH + "px"; void el.offsetWidth; el.style.transition = "height .28s ease"; el.style.height = toH + "px"; const done = () => { el.style.height = ""; el.style.transition = ""; el.style.overflow = prevO; el.removeEventListener("transitionend", done); }; el.addEventListener("transitionend", done); }
  private reflowSticky() { if (this.headerEl && this.stickyZoneEl) { this.stickyZoneEl.style.top = this.headerEl.offsetHeight + "px"; } this.content.style.setProperty("--ep-sticky-top", this.stickyTopPx() + "px"); }

  private isEcho(file: TFile): boolean { return this.lastWritePath === file.path && Date.now() - this.lastWriteTime < 600; }
  private loadFromCache(file: TFile) { const fm = this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined; this.raw = fm ? { ...fm } : {}; this.currentPath = file.path; }
  maybeRefresh(file?: TFile) { const active = this.app.workspace.getActiveFile(); if (!active) { this.currentPath = null; this.render(); return; } if (file) { if (file.path !== active.path) return; if (this.isEcho(file)) return; } if (active.path !== this.currentPath) { this.loadFromCache(active); this.render(); return; } this.loadFromCache(active); if (this.activeTypeKey && this.emptySig() === this.lastEmptySig) { this.refreshValues(); return; } this.render(); }
  private persist(file: TFile, key: string) { this.lastWritePath = file.path; this.lastWriteTime = Date.now(); this.app.fileManager.processFrontMatter(file, (f) => { const cur = this.raw[key]; if (cur === undefined) delete f[key]; else f[key] = cur; }).then(() => (this.lastWriteTime = Date.now())).catch((err) => new Notice("Could not save property: " + err)); }
  private setProp(file: TFile, key: string, value: unknown, full = false) { if (this.editMode) { const id = file.path + " " + key; if (!this.valueUndo.has(id)) this.valueUndo.set(id, { path: file.path, key, old: this.raw[key] }); } if (value === undefined) delete this.raw[key]; else this.raw[key] = value; if (full) this.render(); else this.refreshValues(); this.persist(file, key); }
  private setMany(file: TFile, entries: Record<string, unknown>) { if (this.editMode) for (const key of Object.keys(entries)) { const id = file.path + " " + key; if (!this.valueUndo.has(id)) this.valueUndo.set(id, { path: file.path, key, old: this.raw[key] }); } Object.assign(this.raw, entries); this.render(); this.lastWritePath = file.path; this.lastWriteTime = Date.now(); this.app.fileManager.processFrontMatter(file, (f) => { for (const k of Object.keys(entries)) f[k] = this.raw[k]; }).then(() => (this.lastWriteTime = Date.now())).catch((err) => new Notice("Could not save: " + err)); }
  private refreshValues() { for (const u of this.updaters) try { u(); } catch { /* ignore */ } }

  private enterEdit() { this.editMode = true; this.layoutSnapshot = JSON.stringify(this.layout); this.valueUndo.clear(); this.render(); }
  private hasChanges(): boolean { return (this.layoutSnapshot !== null && this.layoutSnapshot !== JSON.stringify(this.layout)) || this.valueUndo.size > 0; }
  private requestExit() {
    if (!this.hasChanges()) { this.editMode = false; this.layoutSnapshot = null; this.render(); return; }
    new ExitEditModal(this.app, () => { this.editMode = false; this.layoutSnapshot = null; this.valueUndo.clear(); this.render(); }, () => { if (this.layoutSnapshot && this.activeTypeKey) { this.plugin.settings.layouts[this.activeTypeKey] = JSON.parse(this.layoutSnapshot); this.plugin.saveSettings(); } this.revertValues(); this.editMode = false; this.layoutSnapshot = null; this.valueUndo.clear(); const active = this.app.workspace.getActiveFile(); if (active) this.loadFromCache(active); this.render(); }).open();
  }
  private revertValues() { const byFile = new Map<string, { key: string; old: unknown }[]>(); for (const { path, key, old } of this.valueUndo.values()) { if (!byFile.has(path)) byFile.set(path, []); byFile.get(path)!.push({ key, old }); } for (const [path, changes] of byFile) { const f = this.app.vault.getAbstractFileByPath(path); if (f instanceof TFile) this.app.fileManager.processFrontMatter(f, (fm) => { for (const { key, old } of changes) { if (old === undefined) delete fm[key]; else fm[key] = old; } }); } }
  private roll(label: string, modifier: number) { const { rolls, used } = rollByMode(this.rollMode); const total = used + modifier; const tag = this.rollMode === "advantage" ? " (adv)" : this.rollMode === "disadvantage" ? " (dis)" : ""; const dice = rolls.length > 1 ? `[${rolls.join(", ")}] -> ${used}` : `${used}`; const tone: RollEntry["tone"] = used === 20 ? "crit" : used === 1 ? "fail" : "normal"; this.log.unshift({ text: `${label}${tag}: ${total}   (d20 ${dice} ${fmtMod(modifier)})`, tone }); if (this.log.length > 6) this.log.pop(); this.renderLog(); new Notice(`${label}${tag}: ${total}`, 4000); }
  private renderLog() { if (!this.logEl) return; this.logEl.empty(); if (this.log.length === 0) { this.logEl.createDiv({ cls: "ep-log-empty", text: "Roll results will appear here." }); return; } for (const e of this.log) { const row = this.logEl.createDiv({ cls: "ep-log-row" }); if (e.tone === "crit") row.addClass("ep-crit"); if (e.tone === "fail") row.addClass("ep-fail"); row.setText(e.text); } }
  resolveImage(src: string): string { src = (src || "").trim(); const m = src.match(/!?\[\[(.*?)\]\]/); const path = m ? m[1].split("|")[0].split("#")[0].trim() : src; if (/^(https?:|data:|app:|file:)/.test(path)) return path; const f = this.app.metadataCache.getFirstLinkpathDest(path, this.currentPath || ""); if (f) return this.app.vault.getResourcePath(f); const af = this.app.vault.getAbstractFileByPath(path); if (af instanceof TFile) return this.app.vault.getResourcePath(af); return path; }
  openColorPicker(initial: string, onPick: (hex: string) => void) { new ColorPickerModal(this.app, this.plugin, initial, onPick).open(); }

  private bindOpen(span: HTMLElement, open: () => void, editable = true) { if (editable) span.addClass("ep-editable"); if (this.editMode) { span.setAttr("title", "Click to edit"); span.onclick = (e) => { e.preventDefault(); open(); }; } else { span.setAttr("title", "Double-click to edit"); span.ondblclick = () => open(); } }
  private openNumberInput(span: HTMLElement, value: number, commit: (v: number) => void, o: { min: number; max: number; float: boolean; clamp: boolean }) { const input = createEl("input", { cls: "ep-edit-input" }); input.type = "number"; input.value = fmtNum(value); if (o.float) input.step = "any"; span.replaceWith(input); input.focus(); input.select(); let done = false; const finish = (sv: boolean) => { if (done) return; done = true; if (input.parentElement) input.replaceWith(span); let n = Number(input.value); if (!Number.isFinite(n)) return; if (!o.float) n = Math.round(n); if (o.clamp) n = clamp(n, o.min, o.max); if (sv) commit(n); }; input.onblur = () => finish(true); input.onkeydown = (e: KeyboardEvent) => { if (e.key === "Enter") (e.preventDefault(), finish(true)); else if (e.key === "Escape") (e.preventDefault(), finish(false)); }; }
  private textInputInline(span: HTMLElement, key: string, value: string, commit: (v: string) => void) { const input = createEl("input", { cls: "ep-edit-input" }); input.type = "text"; input.value = value; span.replaceWith(input); input.focus(); input.select(); new ValueSuggest(this.app, input, () => this.plugin.valuesFor(key), (v) => commit(v), false); input.addEventListener("focus", () => input.dispatchEvent(new Event("input"))); input.dispatchEvent(new Event("input")); let done = false; const finish = (sv: boolean) => { if (done) return; done = true; if (input.parentElement) input.replaceWith(span); if (sv) commit(input.value.trim()); }; input.onblur = () => setTimeout(() => finish(true), 150); input.onkeydown = (e: KeyboardEvent) => { if (e.key === "Enter") (e.preventDefault(), finish(true)); else if (e.key === "Escape") (e.preventDefault(), finish(false)); }; }

  private renderLinks(el: HTMLElement, text: string) {
    const re = /(!?)\[\[([^\]]+?)\]\]|\[([^\]]+?)\]\(([^)]+?)\)/g; let last = 0; let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) el.appendText(text.slice(last, m.index));
      if (m[2] !== undefined) { const inner = m[2]; const parts = inner.split("|"); const lp = parts[0].trim(); const label = (parts[1] ?? parts[0]).trim(); if (m[1] === "!") el.appendText(m[0]); else { const a = el.createEl("a", { cls: "internal-link", text: label }); a.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); this.app.workspace.openLinkText(lp, this.currentPath || "", ev.ctrlKey || ev.metaKey); }; } }
      else { const url = m[4]; const a = el.createEl("a", { cls: "external-link", text: m[3] }); a.setAttr("href", url); a.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); window.open(url, "_blank"); }; }
      last = re.lastIndex;
    }
    if (last < text.length) el.appendText(text.slice(last));
  }
  resolveType(entry: Entry): PropType { if (entry.dataType) return entry.dataType; return this.deriveType(entry.key ?? ""); }
  deriveType(key: string): PropType { const t = this.plugin.obsidianType(key); if (t) return t; const v = this.raw[key]; if (Array.isArray(v)) return "list"; if (typeof v === "number") return "number"; if (typeof v === "boolean") return "checkbox"; return this.plugin.settings.defaults.dataType; }
  private isEmptyVal(key?: string) { if (!key) return true; const v = this.raw[key]; return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0); }
  private isHiddenEntry(entry: Entry) { return entry.kind === "prop" && !this.editMode && entry.hideIfEmpty !== false && this.isEmptyVal(entry.key); }
  private highlightEntry(el: HTMLElement) { const wrap = el.closest(".ep-entry") as HTMLElement | null; const c = this.content; if (!wrap) return; c.findAll(".ep-highlight").forEach((x) => x.removeClass("ep-highlight")); wrap.addClass("ep-highlight"); c.addClass("ep-highlighting"); window.clearTimeout(this.hlTimer); this.hlTimer = window.setTimeout(() => { c.removeClass("ep-highlighting"); wrap.removeClass("ep-highlight"); }, 1000); }
  private emptySig() { let sig = ""; for (const s of this.layout.sections) for (const e of s.entries) if (e.kind === "prop" && e.key) sig += this.isEmptyVal(e.key) ? "0" : "1"; return sig; }
  private entryDefaultLabel(entry: Entry): string { if (entry.kind === "prop") return entry.key ?? ""; if (entry.kind === "computed") return entry.computed === "proficiency" ? "Proficiency" : "Initiative"; if (entry.kind === "saves") return "Saving Throws"; if (entry.kind === "skills") return "Skills"; if (entry.kind === "rolls") return "Rolls"; if (entry.kind === "blank") return "Blank"; return "Contents"; }
  private sectionFlags(section: Section) { let hasMod = false, hasSteppers = false, hasRoll = false; for (const e of section.entries) { if (e.kind === "computed") { if (e.computed === "initiative") hasRoll = true; continue; } if (e.kind !== "prop") continue; const t = this.resolveType(e); if (t === "number" || t === "decimal") hasSteppers = true; if ((t === "number" || t === "decimal" || t === "formula") && e.showMod) hasMod = true; if ((t === "number" || t === "decimal" || t === "formula") && e.roll) hasRoll = true; } return { hasMod, hasSteppers, hasRoll }; }
  private applyTypography(container: HTMLElement) { const d = this.plugin.settings.defaults; const set = (k: string, v: number) => { if (v && v > 0) container.style.setProperty(k, v + "px"); else container.style.removeProperty(k); }; if (d.fontFamily) container.style.setProperty("--ep-font", d.fontFamily); else container.style.removeProperty("--ep-font"); set("--ep-size-base", d.baseSize); set("--ep-size-label", d.labelSize); set("--ep-size-value", d.valueSize); set("--ep-size-title", d.titleSize); set("--ep-size-list", d.listSize); }

  render() {
    const container = this.content; const prevScroll = container.scrollTop; const animate = this.modeAnim; const oldFlowH = animate && this.flowEl ? this.flowEl.offsetHeight : 0; const oldZoneH = animate && this.stickyZoneEl ? this.stickyZoneEl.offsetHeight : 0; container.empty(); container.addClass("ep-sidebar"); container.toggleClass("ep-editing", this.editMode); this.applyTypography(container); if (animate) { container.addClass("ep-mode-anim"); this.modeAnim = false; window.setTimeout(() => container.removeClass("ep-mode-anim"), 320); }
    this.updaters = []; this.sectionEls = {}; this.modeBtns = [];
    const file = this.app.workspace.getActiveFile();
    if (!file) { this.currentPath = null; container.createDiv({ cls: "ep-empty", text: "Open a note to see its character sheet." }); return; }
    if (this.currentPath !== file.path) { this.loadFromCache(file); this.log = []; }
    const types = noteTypes(this.raw); let match = this.plugin.settings.types.find((t) => types.some((x) => x.toLowerCase() === t.toLowerCase())); if (!match && types.length) { match = types[0]; if (!this.plugin.settings.types.some((t) => t.toLowerCase() === match!.toLowerCase())) this.plugin.settings.types.push(match); this.plugin.ensureLayout(match.toLowerCase()); this.plugin.saveSettings(); } this.activeTypeKey = match ? match.toLowerCase() : null;
    if (!match) { const box = container.createDiv({ cls: "ep-empty" }); box.createDiv({ text: `"${file.basename}" has no matching Type.` }); box.createDiv({ cls: "ep-empty-sub", text: "Set its Type property to one of:" }); for (const t of this.plugin.settings.types) { const b = box.createEl("button", { text: `Set Type: ${t}`, cls: "mod-cta" }); b.onclick = () => this.setProp(file, "Type", t, true); } return; }
    this.layout;
    const header = container.createDiv({ cls: "ep-header" }); this.headerEl = header;
    const titleRow = header.createDiv({ cls: "ep-titlerow" }); titleRow.createDiv({ cls: "ep-title", text: file.basename }); const tb = titleRow.createSpan({ cls: "ep-type-badge", text: match }); tb.setAttr("title", "This note\u2019s Type — selects which saved layout is shown");
    const editBtn = titleRow.createEl("button", { cls: "ep-edit-toggle", text: this.editMode ? "Done" : "Edit" }); if (this.editMode) editBtn.addClass("is-active"); editBtn.onclick = () => { this.modeAnim = true; if (this.editMode) this.requestExit(); else this.enterEdit(); }; editBtn.setAttr("title", this.editMode ? "Finish editing — keep or undo your changes" : "Edit: rearrange sections & properties, change types, colors, etc.");
    if (this.editMode) {
      const tools = header.createDiv({ cls: "ep-toolbar" });
      const addSec = tools.createEl("button", { text: "+ Section", cls: "ep-tool-btn" }); addSec.onclick = () => { const d = this.plugin.settings.defaults; this.layout.sections.unshift({ id: genId(), title: "New Section", columns: d.sectionColumns, transparent: d.sectionTransparent, sticky: d.sectionSticky, size: d.sectionSize, collapsible: d.sectionCollapsible, dividers: d.sectionDividers, entries: [] }); this.save(); this.render(); };
      const reset = tools.createEl("button", { text: "Reset all", cls: "ep-tool-btn" }); reset.onclick = () => new ConfirmModal(this.app, `Reset the "${match}" layout to defaults? Note properties are not changed.`, () => this.plugin.resetLayout(this.activeTypeKey!)).open();
      const defRow = header.createDiv({ cls: "ep-default-row" }); defRow.createSpan({ cls: "ep-default-lbl", text: "Add:" });
      for (const id of SPECIAL_IDS) { const def = specialSection(id)!; const b = defRow.createEl("button", { text: def.title, cls: "ep-mini-btn" }); b.onclick = () => this.addOrResetSpecial(id); }
    }
    this.stickyZoneEl = container.createDiv({ cls: "ep-sticky-zone" });
    const flow = container.createDiv({ cls: "ep-flow" }); this.flowEl = flow;
    for (const section of this.layout.sections) this.renderSection(section.sticky ? this.stickyZoneEl : flow, file, section);
    this.lastEmptySig = this.emptySig();
    container.scrollTop = prevScroll; requestAnimationFrame(() => this.reflowSticky()); if (this.ro) { this.ro.disconnect(); if (this.headerEl) this.ro.observe(this.headerEl); if (this.stickyZoneEl) this.ro.observe(this.stickyZoneEl); } if (animate) requestAnimationFrame(() => { this.animateHeight(this.flowEl, oldFlowH); this.animateHeight(this.stickyZoneEl, oldZoneH); });
  }

  private shownKeys(): Set<string> { const s = new Set<string>(); for (const sec of this.layout.sections) for (const e of sec.entries) if (e.kind === "prop" && e.key) s.add(e.key.toLowerCase()); return s; }

  private renderSection(parent: HTMLElement, file: TFile, section: Section) {
    if (!this.editMode && section.hideIfEmpty !== false) { const hasContent = section.entries.some((e) => e.kind !== "prop" || !((e.hideIfEmpty !== false) && this.isEmptyVal(e.key))); if (!hasContent) return; }
    const det = parent.createDiv({ cls: "ep-section" }); this.sectionEls[section.id] = det; det.setAttr("data-ep-id", "s:" + section.id);
    if (!section.sticky) det.addClass("ep-flow-section");
    if (section.transparent) det.addClass("ep-transparent");
    if (section.accent) det.style.setProperty("--ep-accent", section.accent);
    if (section.controlColor) det.style.setProperty("--ep-control", section.controlColor);
    det.style.setProperty("--ep-title-bg", section.transparent ? "var(--background-primary)" : section.bg || "var(--background-secondary)");
    if (section.bg && !section.transparent) det.style.background = section.bg;
    const collapsible = section.collapsible !== false;
    const sum = det.createDiv({ cls: "ep-section-title" });
    if (collapsible) { const chev = sum.createSpan({ cls: "ep-chev" }); setIcon(chev, "chevron-right"); chev.toggleClass("ep-open", !section.collapsed); }
    if (this.editMode) { const grip = sum.createSpan({ cls: "ep-grip", text: "⠿" }); grip.setAttr("title", "Drag to reorder section"); grip.onclick = (e) => e.stopPropagation(); }
    if (section.icon) { const ic = sum.createSpan({ cls: "ep-ticon" }); setIcon(ic, section.icon); if (section.iconColor) ic.style.color = section.iconColor; }
    const showLabel = this.editMode || !section.hideLabel;
    if (showLabel) { const titleSpan = sum.createSpan({ cls: "ep-sec-name" }); if (section.titleSize) titleSpan.style.fontSize = section.titleSize + "px"; if (section.accent) titleSpan.style.color = section.accent; if (this.editMode) { this.editTitle(titleSpan, section.title, "Section name", (v) => { section.title = v || "Section"; this.save(); this.render(); }); if (section.hideLabel) titleSpan.addClass("ep-dim"); } else titleSpan.setText(section.title); }
    sum.createSpan({ cls: "ep-spacer" });
    if (this.editMode) { const cmode = section.layoutMode ?? (section.columns > 1 ? "columns" : "list"); const modeBtn = sum.createSpan({ cls: "ep-icon-btn" }); setIcon(modeBtn, cmode === "grid" ? "layout-grid" : cmode === "columns" ? "columns" : "list"); modeBtn.setAttr("title", "Layout: " + cmode + " (click to cycle)"); modeBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); const order: LayoutMode[] = ["list", "columns", "grid"]; section.layoutMode = order[(order.indexOf(cmode) + 1) % 3]; this.save(); this.render(); }; const pinBtn = sum.createSpan({ cls: "ep-icon-btn" }); setIcon(pinBtn, "pin"); pinBtn.setAttr("title", section.sticky ? "Pinned (sticky) — click to unpin" : "Pin to top (sticky)"); if (section.sticky) pinBtn.addClass("is-active"); pinBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); section.sticky = !section.sticky; this.save(); this.render(); }; }
    if (this.editMode) { const menuBtn = sum.createSpan({ cls: "ep-menu-btn", text: "⋯" }); menuBtn.setAttr("title", "Section options"); menuBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.sectionMenu(e as MouseEvent, section); }; }
    sum.addEventListener("contextmenu", (e) => { e.preventDefault(); this.sectionMenu(e, section); });

    const collapseWrap = det.createDiv({ cls: "ep-collapse" }); const body = collapseWrap.createDiv({ cls: "ep-section-body" });
    const flags = this.sectionFlags(section);
    const mode: LayoutMode = section.layoutMode ?? (section.columns > 1 ? "columns" : "list");
    const ncol = Math.max(1, section.columns || 1);
    if (this.editMode && mode !== "list") this.renderColRail(body, section, ncol);
    const gflex = this.editMode && mode === "grid" ? body.createDiv({ cls: "ep-gridflex" }) : body;
    if (this.editMode && mode === "grid") this.renderRowRail(gflex, section, ncol);
    const grid = gflex.createDiv({ cls: "ep-grid ep-mode-" + mode }); if (section.dividers) grid.addClass("ep-dividers"); if (section.vdividers) grid.addClass("ep-vdividers");
    if (section.size && section.size !== "unlimited") { const r = section.size === "s" ? 4 : section.size === "m" ? 8 : 12; grid.style.maxHeight = r * 32 + "px"; grid.style.overflowY = "auto"; }
    if (mode === "list") {
      for (const entry of section.entries) this.renderEntry(grid, file, section, entry, flags);
      if (this.editMode) { const add = body.createDiv({ cls: "ep-add" }); const ab = add.createEl("button", { cls: "ep-add-input ep-addbtn", text: "+ add property" }); ab.onclick = () => this.openAddMenu(ab, file, section); }
    } else if (mode === "columns") {
      grid.style.gridTemplateColumns = `repeat(${ncol}, minmax(0, 1fr))`; const per = Math.max(1, Math.ceil(section.entries.length / ncol));
      for (let cc = 0; cc < ncol; cc++) { const col = grid.createDiv({ cls: "ep-col" }); for (const entry of section.entries.slice(cc * per, (cc + 1) * per)) this.renderEntry(col, file, section, entry, flags); if (this.editMode) { const ai = Math.min((cc + 1) * per, section.entries.length); const ab = col.createEl("button", { cls: "ep-mini-btn ep-coladd", text: "+ add property" }); ab.setAttr("title", `Add a property to this column of “${section.title}”`); ab.onclick = () => this.openAddMenu(ab, file, section, { index: ai }); } }
    } else {
      grid.style.gridTemplateColumns = `repeat(${ncol}, minmax(0, 1fr))`; if (section.rows && section.rows > 0) grid.style.gridTemplateRows = `repeat(${section.rows}, auto)`;
      for (const entry of section.entries) { if (this.isHiddenEntry(entry)) grid.createDiv({ cls: "ep-empty-cell" }); else this.renderEntry(grid, file, section, entry, flags); }
      if (this.editMode) { const pad = ((ncol - (section.entries.length % ncol)) % ncol) + ncol; for (let z = 0; z < pad; z++) { const cell = grid.createDiv({ cls: "ep-empty-cell ep-empty-pad" }); cell.createSpan({ cls: "ep-pad-plus", text: "+ add property" }); cell.setAttr("title", `Add a property to “${section.title}”`); cell.onclick = () => this.openAddMenu(cell, file, section, { index: section.entries.length }); cell.addEventListener("contextmenu", (ce) => { ce.preventDefault(); const m = new Menu(); m.addItem((i) => i.setTitle("Add property here").setIcon("plus").onClick(() => this.openAddMenu(cell, file, section, { index: section.entries.length }))); m.showAtMouseEvent(ce); }); } }
    }
    if (this.editMode) this.attachSectionDnD(det, grid, section);
    if (collapsible) { collapseWrap.style.overflow = "hidden"; if (section.collapsed) collapseWrap.style.height = "0px"; sum.onclick = () => this.toggleSection(section, det, collapseWrap); }
  }
  private toggleSection(section: Section, det: HTMLElement, wrap: HTMLElement) { section.collapsed = !section.collapsed; this.save(); const chev = det.querySelector(".ep-chev"); if (chev) (chev as HTMLElement).toggleClass("ep-open", !section.collapsed); if (section.collapsed) { const h = wrap.scrollHeight; wrap.style.height = h + "px"; requestAnimationFrame(() => { wrap.style.height = "0px"; }); } else { wrap.style.height = "0px"; const target = wrap.scrollHeight; requestAnimationFrame(() => { wrap.style.height = target + "px"; }); const done = () => { wrap.style.height = "auto"; wrap.removeEventListener("transitionend", done); }; wrap.addEventListener("transitionend", done); } requestAnimationFrame(() => this.reflowSticky()); }
  private scrollToSection(id: string) { const sec = this.layout.sections.find((s) => s.id === id); if (sec && sec.collapsed) { sec.collapsed = false; this.save(); this.render(); requestAnimationFrame(() => this.scrollToSection(id)); return; } const el = this.sectionEls[id]; if (!el) return; const c = this.content; const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - this.stickyTopPx() - 4; c.scrollTo({ top: Math.max(0, top), behavior: "smooth" }); }

  private candidates(): { key: string; onNote: boolean }[] { const shown = this.shownKeys(); const all = new Set<string>([...Object.keys(this.raw).filter((k) => k.toLowerCase() !== "position"), ...this.plugin.knownProps()]); const list: { key: string; onNote: boolean }[] = []; for (const k of all) { if (shown.has(k.toLowerCase())) continue; list.push({ key: k, onNote: this.raw[k] !== undefined }); } list.sort((a, b) => (a.onNote === b.onNote ? a.key.localeCompare(b.key) : a.onNote ? -1 : 1)); return list; }
  private addEntry(section: Section, key: string) { key = key.trim(); if (!key) return; section.entries.push({ id: genId(), kind: "prop", key, dataType: this.deriveType(key) }); this.save(); this.render(); }
  renameKey(entry: Entry, newKey: string) { newKey = newKey.trim(); if (!newKey || newKey === entry.key) return; entry.key = newKey; entry.alias = undefined; entry.slider = undefined; entry.roll = undefined; entry.showMod = undefined; entry.min = undefined; entry.max = undefined; entry.clamp = undefined; entry.formula = undefined; entry.dataType = this.deriveType(newKey); this.save(); this.render(); }
  private editTitle(span: HTMLElement, current: string, def: string, commit: (v: string) => void) { span.setText(current || def); span.addClass("ep-editable"); span.setAttr("title", "Click to rename"); span.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); const input = createEl("input", { cls: "ep-edit-input ep-edit-label" }); input.type = "text"; input.value = current; input.placeholder = def; span.replaceWith(input); input.focus(); input.select(); let done = false; const finish = (sv: boolean) => { if (done) return; done = true; if (input.parentElement) input.replaceWith(span); if (sv) commit(input.value.trim()); }; input.onblur = () => finish(true); input.onkeydown = (e: KeyboardEvent) => { if (e.key === "Enter") (e.preventDefault(), finish(true)); else if (e.key === "Escape") (e.preventDefault(), finish(false)); }; }; }

  private cluster(head: HTMLElement, flags: { hasMod: boolean; hasSteppers: boolean; hasRoll: boolean }, o: { showMod?: boolean; modGet?: () => number; get?: () => number; display?: string; steppers?: boolean; min: number; max: number; float?: boolean; clamp?: boolean; commit?: (v: number) => void; roll?: () => void }) {
    const cl = head.createDiv({ cls: "ep-cluster" }); const cols: string[] = []; if (flags.hasMod) cols.push("auto"); if (flags.hasSteppers) cols.push("20px"); cols.push("minmax(2.1em, auto)"); if (flags.hasSteppers) cols.push("20px"); if (flags.hasRoll) cols.push("auto"); cl.style.gridTemplateColumns = cols.join(" ");
    let modCell: HTMLElement = cl; if (flags.hasMod) { modCell = cl.createSpan({ cls: "ep-cell ep-mod-badge" }); if (o.showMod && o.modGet) modCell.setText(fmtMod(o.modGet())); }
    const editable = !!(o.commit && o.get);
    if (flags.hasSteppers) { if (o.steppers && editable) { const dec = cl.createEl("button", { cls: "ep-step-btn", text: "−" }); dec.onclick = () => { const cur = o.get!(); o.commit!(o.clamp ? clamp(cur - 1, o.min, o.max) : cur - 1); }; } else cl.createSpan({ cls: "ep-cell" }); }
    const val = cl.createSpan({ cls: "ep-num" }); if (editable) { val.setText(fmtNum(o.get!())); this.bindOpen(val, () => this.openNumberInput(val, o.get!(), o.commit!, { min: o.min, max: o.max, float: !!o.float, clamp: !!o.clamp })); } else val.setText(o.display ?? "");
    if (flags.hasSteppers) { if (o.steppers && editable) { const inc = cl.createEl("button", { cls: "ep-step-btn", text: "+" }); inc.onclick = () => { const cur = o.get!(); o.commit!(o.clamp ? clamp(cur + 1, o.min, o.max) : cur + 1); }; } else cl.createSpan({ cls: "ep-cell" }); }
    if (flags.hasRoll) { const rc = cl.createSpan({ cls: "ep-cell ep-roll-cell" }); if (o.roll) { const rb = rc.createEl("button", { cls: "ep-roll-btn", text: "Roll" }); rb.onclick = o.roll; } }
    return { val, modCell };
  }

  private renderEntry(grid: HTMLElement, file: TFile, section: Section, entry: Entry, flags: { hasMod: boolean; hasSteppers: boolean; hasRoll: boolean }) {
    if (this.isHiddenEntry(entry)) return;
    if (entry.kind === "blank") { const w = grid.createDiv({ cls: "ep-entry ep-blank" }); w.setAttr("data-ep-id", "e:" + entry.id); if (this.editMode) { const g = w.createSpan({ cls: "ep-grip", text: "⠿" }); g.setAttr("title", "Blank cell — drag to move"); const openBlankMenu = (ce: MouseEvent) => { ce.preventDefault(); ce.stopPropagation(); const m = new Menu(); m.addItem((i) => i.setTitle("Add property here").setIcon("plus").onClick(() => this.openAddMenu(w, file, section, { replaceId: entry.id }))); m.addItem((i) => i.setTitle("Remove blank").setIcon("trash").onClick(() => this.removeEntry(section, entry))); const cols = section.columns || 1; const bi = section.entries.indexOf(entry); if (bi >= 0) { m.addSeparator(); m.addItem((i) => i.setTitle("Remove this row").setIcon("trash").onClick(() => this.removeRowAt(section, Math.floor(bi / cols)))); m.addItem((i) => i.setTitle("Remove this column").setIcon("trash").onClick(() => this.removeColumnAt(section, bi % cols))); } m.showAtMouseEvent(ce); }; const mb = w.createSpan({ cls: "ep-menu-btn", text: "⋯" }); mb.onclick = openBlankMenu; w.addEventListener("contextmenu", openBlankMenu); w.onclick = () => this.openAddMenu(w, file, section, { replaceId: entry.id }); this.attachEntryDnD(w, g, section, entry); } return; }
    const wide = entry.kind === "saves" || entry.kind === "skills";
    const wrap = grid.createDiv({ cls: wide ? "ep-entry ep-entry-block" : "ep-entry" }); wrap.setAttr("data-ep-id", "e:" + entry.id); if (wide) wrap.style.gridColumn = "1 / -1";
    const head = wrap.createDiv({ cls: "ep-entry-head" }); let grip: HTMLElement | null = null;
    if (this.editMode) { grip = head.createSpan({ cls: "ep-grip", text: "⠿" }); grip.setAttr("title", "Drag to move"); }
    if (entry.icon) { const ic = head.createSpan({ cls: "ep-picon" }); setIcon(ic, entry.icon); if (entry.iconColor) ic.style.color = entry.iconColor; }
    const extra = wrap.createDiv({ cls: "ep-entry-extra" });
    if (entry.kind === "prop") this.renderPropEntry(head, extra, file, entry, flags);
    else if (entry.kind === "computed") this.renderComputed(head, entry, flags);
    else if (entry.kind === "saves" || entry.kind === "skills") this.renderBlock(head, extra, file, entry);
    else if (entry.kind === "rolls") this.renderRolls(head, extra, entry);
    else this.renderToc(head, extra, entry);
    wrap.addEventListener("contextmenu", (e) => { e.preventDefault(); this.entryMenu(e, file, section, entry); });
    if (this.editMode) { const menuBtn = head.createSpan({ cls: "ep-menu-btn", text: "⋯" }); menuBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.entryMenu(e as MouseEvent, file, section, entry); }; if (grip) this.attachEntryDnD(wrap, grip, section, entry); }
  }
  private labelSpan(head: HTMLElement, entry: Entry): HTMLElement | null {
    const showLabel = this.editMode || !entry.hideLabel; if (!showLabel) return null; const span = head.createSpan({ cls: "ep-line-name" });
    if (entry.labelSize) span.style.fontSize = entry.labelSize + "px"; if (entry.labelColor) span.style.color = entry.labelColor; if (this.editMode && entry.hideLabel) span.addClass("ep-dim");
    if (this.editMode && entry.kind === "prop") { span.setText(entry.alias || (entry.key ?? "")); span.addClass("ep-editable"); span.setAttr("title", "Click to change which property this shows"); span.onclick = (ev) => { ev.preventDefault(); const input = createEl("input", { cls: "ep-edit-input ep-edit-label" }); input.type = "text"; input.value = entry.key ?? ""; span.replaceWith(input); input.focus(); input.select(); new PropSuggest(this.app, input, () => this.candidates(), (key) => this.renameKey(entry, key)); let done = false; const finish = (sv: boolean) => { if (done) return; done = true; if (input.parentElement) input.replaceWith(span); if (sv) { const v = input.value.trim(); if (v && v !== entry.key) this.renameKey(entry, v); } }; input.onblur = () => setTimeout(() => finish(true), 120); input.onkeydown = (e: KeyboardEvent) => { if (e.key === "Escape") (e.preventDefault(), finish(false)); }; }; } else { span.setText(entry.alias || this.entryDefaultLabel(entry)); span.addClass("ep-clickname"); span.onclick = () => this.highlightEntry(span); }
    return span;
  }
  private renderPropEntry(head: HTMLElement, extra: HTMLElement, file: TFile, entry: Entry, flags: { hasMod: boolean; hasSteppers: boolean; hasRoll: boolean }) {
    const key = entry.key as string; const type = this.resolveType(entry); this.labelSpan(head, entry);
    if (type === "number" || type === "decimal" || type === "formula") this.renderNumeric(head, extra, file, entry, type, flags);
    else if (type === "color") this.renderColor(head, file, entry);
    else if (type === "image") this.renderImage(extra, file, entry);
    else if (type === "iframe") this.renderIframe(extra, file, entry);
    else if (type === "checkbox") { const v = head.createDiv({ cls: "ep-val-right" }); if (entry.valueColor) v.style.color = entry.valueColor; const cb = v.createEl("input"); cb.type = "checkbox"; cb.addClass("ep-prof"); cb.checked = this.raw[key] === true || String(this.raw[key]).toLowerCase() === "true"; if (this.editMode) { cb.onchange = () => this.setProp(file, key, cb.checked); } else { cb.setAttr("title", "Double-click to toggle"); cb.onclick = (e) => e.preventDefault(); cb.ondblclick = () => this.setProp(file, key, !(this.raw[key] === true || String(this.raw[key]).toLowerCase() === "true")); } this.updaters.push(() => { cb.checked = this.raw[key] === true || String(this.raw[key]).toLowerCase() === "true"; }); }
    else if (type === "list") { const holder = extra.createDiv({ cls: "ep-list-holder" }); if (entry.valueSize) holder.style.fontSize = entry.valueSize + "px"; if (entry.valueColor) holder.style.color = entry.valueColor; this.buildList(holder, file, key, this.editMode); this.updaters.push(() => { holder.empty(); this.buildList(holder, file, key, this.editMode); }); }
    else { const v = head.createDiv({ cls: "ep-val-right" }); if (entry.valueSize) v.style.fontSize = entry.valueSize + "px"; if (entry.valueColor) v.style.color = entry.valueColor; const s = v.createSpan(); const draw = () => { const val = getStr(this.raw, key); s.empty(); if (val === "") { s.setText("—"); s.addClass("ep-placeholder"); } else { s.removeClass("ep-placeholder"); this.renderLinks(s, val); } s.addClass("ep-editable"); }; draw(); this.bindOpen(s, () => this.textInputInline(s, key, getStr(this.raw, key), (nv) => this.setProp(file, key, nv === "" ? undefined : nv))); this.updaters.push(draw); }
  }
  private renderNumeric(head: HTMLElement, extra: HTMLElement, file: TFile, entry: Entry, type: PropType, flags: { hasMod: boolean; hasSteppers: boolean; hasRoll: boolean }) {
    const key = entry.key as string; const isFormula = type === "formula"; const isDecimal = type === "decimal"; const min = entry.min ?? (isFormula ? 0 : isDecimal ? 0 : -9999); const max = entry.max ?? (isFormula ? 10 : isDecimal ? 1 : 99999); const label = entry.alias ?? key; const f = isFormula ? compileFormula(entry.formula || "x") || ((x: number) => x) : null;
    const get = () => getNum(this.raw, key, 0);
    const rollMod = () => { if (entry.rollOverride !== undefined) return entry.rollOverride; const sk = entry.rollSource || key; return entry.roll === "abilityMod" ? abilityMod(getNum(this.raw, sk, 0)) : getNum(this.raw, sk, 0); };
    const refs = this.cluster(head, flags, { showMod: entry.showMod, modGet: rollMod, get, display: fmtNum(get()), steppers: type === "number" || type === "decimal", min, max, float: isDecimal || isFormula, clamp: !!entry.clamp, commit: (v) => this.setProp(file, key, v), roll: entry.roll ? () => this.roll(entry.roll === "abilityMod" ? `${label} check` : label, rollMod()) : undefined });
    if (entry.valueColor) refs.val.style.color = entry.valueColor; if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";
    let slider: HTMLInputElement | null = null;
    if (entry.slider || isFormula) { slider = extra.createEl("input", { cls: "ep-slider" }); slider.type = "range"; slider.min = String(min); slider.max = String(max); slider.step = type === "number" ? "1" : "any"; slider.value = String(isFormula && f ? invertFormula(f, get(), min, max) : get()); slider.addEventListener("input", () => { const x = Number(slider!.value); const out = isFormula && f ? f(x) : x; refs.val.setText(fmtNum(out)); if (entry.showMod) refs.modCell.setText(fmtMod(abilityMod(out))); }); slider.addEventListener("change", () => { const x = Number(slider!.value); const out = isFormula && f ? f(x) : (entry.clamp ? clamp(x, min, max) : x); this.setProp(file, key, isDecimal || isFormula ? out : Math.round(out)); }); }
    this.updaters.push(() => { const v2 = getNum(this.raw, key, 0); refs.val.setText(fmtNum(v2)); if (entry.showMod) refs.modCell.setText(fmtMod(rollMod())); if (slider) slider.value = String(isFormula && f ? invertFormula(f, v2, min, max) : v2); });
  }
  private renderColor(head: HTMLElement, file: TFile, entry: Entry) { const key = entry.key as string; const v = head.createDiv({ cls: "ep-val-right" }); if (entry.valueSize) v.style.fontSize = entry.valueSize + "px"; if (entry.valueColor) v.style.color = entry.valueColor; const sw = v.createSpan({ cls: "ep-swatch" }); const txt = v.createSpan({ cls: "ep-color-text" }); const draw = () => { const hex = getStr(this.raw, key); const ok = hexToRgb(hex); sw.style.background = ok ? hex : "transparent"; sw.toggleClass("ep-swatch-empty", !ok); txt.setText(hex || "—"); }; draw(); const open = () => this.openColorPicker(getStr(this.raw, key) || "#888888", (out) => this.setProp(file, key, out)); this.bindOpen(sw, open, false); this.bindOpen(txt, open); this.updaters.push(draw); }
  private renderImage(extra: HTMLElement, file: TFile, entry: Entry) {
    const key = entry.key as string; const holder = extra.createDiv({ cls: "ep-image" });
    const h = entry.size === "s" ? 120 : entry.size === "m" ? 240 : entry.size === "l" ? 360 : 0;
    const draw = () => { holder.empty(); holder.removeClass("ep-image-empty"); const src = getStr(this.raw, key); if (src) { if (h) { holder.style.height = h + "px"; holder.addClass("ep-image-fixed"); } else { holder.style.removeProperty("height"); holder.removeClass("ep-image-fixed"); } const img = holder.createEl("img", { cls: "ep-image-img" }); img.src = this.resolveImage(src); } else { holder.style.removeProperty("height"); holder.addClass("ep-image-empty"); holder.setText("No image — click to set"); } };
    draw(); if (this.editMode) this.bindOpen(holder, () => new TextPromptModal(this.app, "Image link (URL or ![[embed]])", getStr(this.raw, key), (val) => this.setProp(file, key, val.trim() === "" ? undefined : val.trim())).open(), false); else holder.onclick = () => { const src = getStr(this.raw, key); if (src) new ImageViewerModal(this.app, this.resolveImage(src)).open(); }; this.updaters.push(draw);
  }
  private renderIframe(extra: HTMLElement, file: TFile, entry: Entry) {
    const key = entry.key as string; const holder = extra.createDiv({ cls: "ep-iframe-wrap" });
    const scale = entry.iframeScale && entry.iframeScale > 0 ? entry.iframeScale : 0.25; const height = entry.iframeHeight && entry.iframeHeight > 0 ? entry.iframeHeight : 200;
    const draw = () => { holder.empty(); const url = getStr(this.raw, key).trim(); if (!url) { holder.addClass("ep-image-empty"); holder.style.removeProperty("height"); holder.setText("No URL — click to set"); return; } holder.removeClass("ep-image-empty"); holder.style.height = height + "px"; const f = holder.createEl("iframe"); f.setAttr("src", url); f.setAttr("style", `width:${100 / scale}%;height:${height / scale}px;transform:scale(${scale});transform-origin:top left;border:none;`); };
    draw();
    if (this.editMode) { const edit = extra.createDiv({ cls: "ep-iframe-edit" }); const btn = edit.createEl("button", { cls: "ep-mini-btn", text: "Set URL" }); btn.onclick = () => new TextPromptModal(this.app, "Embed URL", getStr(this.raw, key), (val) => this.setProp(file, key, val.trim() === "" ? undefined : val.trim())).open(); }
    else this.bindOpen(holder, () => new TextPromptModal(this.app, "Embed URL", getStr(this.raw, key), (val) => this.setProp(file, key, val.trim() === "" ? undefined : val.trim())).open(), false);
    let curUrl = getStr(this.raw, key); this.updaters.push(() => { const u = getStr(this.raw, key); if (u !== curUrl) { curUrl = u; draw(); } });
  }
  private renderComputed(head: HTMLElement, entry: Entry, flags: { hasMod: boolean; hasSteppers: boolean; hasRoll: boolean }) { this.computedLabel(head, entry); const compute = () => entry.computed === "proficiency" ? profBonus(getNum(this.raw, "Level", 1)) : abilityMod(getNum(this.raw, "Dexterity", 10)); const refs = this.cluster(head, flags, { display: fmtMod(compute()), steppers: false, min: 0, max: 0, roll: entry.computed === "initiative" ? () => this.roll("Initiative", abilityMod(getNum(this.raw, "Dexterity", 10))) : undefined }); if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px"; if (entry.valueColor) refs.val.style.color = entry.valueColor; this.updaters.push(() => refs.val.setText(fmtMod(compute()))); }
  private computedLabel(head: HTMLElement, entry: Entry) { const showLabel = this.editMode || !entry.hideLabel; if (!showLabel) return; const span = head.createSpan({ cls: "ep-line-name" }); if (entry.labelColor) span.style.color = entry.labelColor; if (entry.labelSize) span.style.fontSize = entry.labelSize + "px"; if (this.editMode) this.editTitle(span, entry.alias ?? "", this.entryDefaultLabel(entry), (v) => { entry.alias = v || undefined; this.save(); this.render(); }); else { span.setText(entry.alias || this.entryDefaultLabel(entry)); span.addClass("ep-clickname"); span.onclick = () => this.highlightEntry(span); } }
  private buildList(holder: HTMLElement, file: TFile, key: string, showAdd: boolean) { const current = getList(this.raw, key); const list = holder.createDiv({ cls: "ep-list" }); for (const item of current) { const chip = list.createSpan({ cls: "ep-chip" }); const cv = chip.createSpan(); this.renderLinks(cv, item); const x = chip.createSpan({ cls: "ep-chip-x", text: "×" }); x.onclick = () => this.setProp(file, key, current.filter((i) => i !== item)); } if (showAdd) { const addb = list.createEl("button", { cls: "ep-mini-btn ep-list-addbtn", text: "+ add" }); addb.onclick = () => { const r = addb.getBoundingClientRect(); this.openValuePickerForList(r.left, r.bottom + 2, file, key); }; } }
  private renderBlock(head: HTMLElement, extra: HTMLElement, file: TFile, entry: Entry) { this.computedLabel(head, entry); const listEl = extra.createDiv({ cls: "ep-block-list" }); const build = () => { listEl.empty(); const pb = profBonus(getNum(this.raw, "Level", 1)); if (entry.kind === "saves") { const profs = getList(this.raw, SAVE_PROF_KEY); for (const a of ABILITIES) { const pr = profs.some((x) => x.toLowerCase() === a.key.toLowerCase()); const total = abilityMod(getNum(this.raw, a.key, 10)) + (pr ? pb : 0); this.blockRow(listEl, file, SAVE_PROF_KEY, a.key, a.key, "", total, `${a.abbr} save`, pr); } } else { const profs = getList(this.raw, SKILL_PROF_KEY); for (const s of SKILLS) { const pr = profs.some((x) => x.toLowerCase() === s.name.toLowerCase()); const total = abilityMod(getNum(this.raw, s.ability, 10)) + (pr ? pb : 0); this.blockRow(listEl, file, SKILL_PROF_KEY, s.name, s.name, ABBR[s.ability] ?? "", total, s.name, pr); } } }; build(); this.updaters.push(build); }
  private blockRow(list: HTMLElement, file: TFile, profKey: string, name: string, label: string, abbr: string, total: number, rollLabel: string, proficient: boolean) { const row = list.createDiv({ cls: "ep-line" }); const cb = row.createEl("input"); cb.type = "checkbox"; cb.addClass("ep-prof"); cb.checked = proficient; if (this.editMode) { cb.setAttr("title", "Proficient"); cb.onchange = () => this.toggleProf(file, profKey, name, cb.checked); } else { cb.setAttr("title", "Double-click to toggle"); cb.onclick = (e) => e.preventDefault(); cb.ondblclick = () => this.toggleProf(file, profKey, name, !proficient); } row.createSpan({ cls: "ep-line-name", text: label }); if (abbr) row.createSpan({ cls: "ep-line-abbr", text: abbr }); row.createSpan({ cls: "ep-line-mod", text: fmtMod(total) }); const rb = row.createEl("button", { cls: "ep-roll-btn", text: "Roll" }); rb.onclick = () => this.roll(rollLabel, total); }
  private toggleProf(file: TFile, key: string, name: string, on: boolean) { const cur = getList(this.raw, key).filter((x) => x.toLowerCase() !== name.toLowerCase()); if (on) cur.push(name); this.setProp(file, key, cur); }
  private renderRolls(head: HTMLElement, extra: HTMLElement, entry: Entry) {
    this.computedLabel(head, entry); const modeWrap = extra.createDiv({ cls: "ep-mode" }); modeWrap.setAttr("title", "Roll mode — applies to all roll buttons"); this.modeBtns = [];
    for (const m of [{ key: "disadvantage" as RollMode, label: "Disadv" }, { key: "normal" as RollMode, label: "Normal" }, { key: "advantage" as RollMode, label: "Advantage" }]) { const b = modeWrap.createEl("button", { text: m.label, cls: "ep-mode-btn" }); if (this.rollMode === m.key) b.addClass("is-active"); this.modeBtns.push(b); b.onclick = () => { this.rollMode = m.key; for (const x of this.modeBtns) x.removeClass("is-active"); b.addClass("is-active"); }; }
    this.logEl = extra.createDiv({ cls: "ep-log" }); this.renderLog();
  }
  private renderToc(head: HTMLElement, extra: HTMLElement, entry: Entry) {
    this.computedLabel(head, entry); const list = extra.createDiv({ cls: "ep-toc" }); list.setAttr("title", "Contents — click a section to scroll to it");
    for (const s of this.layout.sections) { const row = list.createDiv({ cls: "ep-toc-row" }); if (s.icon) { const ic = row.createSpan({ cls: "ep-picon" }); setIcon(ic, s.icon); } row.createSpan({ text: s.title || "Untitled" }); row.onclick = () => this.scrollToSection(s.id); }
  }

  private specialMenu(e: MouseEvent) { const menu = new Menu(); for (const id of SPECIAL_IDS) { const def = specialSection(id)!; menu.addItem((i) => i.setTitle(def.title).onClick(() => this.addOrResetSpecial(id))); } menu.showAtMouseEvent(e); }
  private addOrResetSpecial(id: string) { const exists = this.layout.sections.find((s) => s.id === id); const apply = () => { const fresh = specialSection(id)!; if (exists) { const idx = this.layout.sections.findIndex((s) => s.id === id); this.layout.sections[idx] = fresh; } else this.layout.sections.unshift(fresh); this.save(); this.render(); }; if (exists) new ConfirmModal(this.app, `The "${exists.title}" section already exists. Reset it to its original section and properties?`, apply).open(); else apply(); }
  openPropOptions(section: Section, entry: Entry) { new PropertyOptionsModal(this.app, this.plugin, this, section, entry, () => { this.save(); this.render(); }).open(); }
  removeEntry(section: Section, entry: Entry) { const key = entry.kind === "prop" ? entry.key : undefined; section.entries = section.entries.filter((x) => x.id !== entry.id); this.save(); if (key) { const used = Object.keys(this.plugin.settings.layouts).some((lk) => this.plugin.settings.layouts[lk].sections.some((s) => s.entries.some((e) => e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase()))); if (!used) this.plugin.unhideKey(key); else this.render(); } else this.render(); }
  moveEntryToSection(entry: Entry, fromId: string, toId: string) { this.moveEntry(entry.id, fromId, toId, null, false); }
  sectionsList(): Section[] { return this.layout.sections; }

  private entryMenu(e: MouseEvent, file: TFile, section: Section, entry: Entry) {
    const menu = new Menu();
    menu.addItem((i) => i.setTitle(`Configure “${entry.alias || this.entryDefaultLabel(entry)}”…`).setIcon("settings").onClick(() => this.openPropOptions(section, entry)));
    if (entry.kind === "prop" && entry.key) { const key = entry.key; const type = this.resolveType(entry); menu.addSeparator(); menu.addItem((i) => i.setTitle((this.plugin.isHidden(key) ? `Show "${key}" in` : `Hide "${key}" from`) + " Obsidian properties").setIcon(this.plugin.isHidden(key) ? "eye" : "eye-off").onClick(() => this.plugin.toggleHide(key))); menu.addItem((i) => i.setTitle(`Remove value from “${key}”`).setIcon("eraser").onClick(() => this.setProp(file, key, undefined))); menu.addSeparator();
      if (type === "list") { menu.addItem((i) => i.setTitle("Add item…").setIcon("plus").onClick(() => this.openValuePickerForList(e.clientX, e.clientY, file, key))); }
      else if (type === "color") menu.addItem((i) => i.setTitle("Pick color…").setIcon("palette").onClick(() => this.openColorPicker(getStr(this.raw, key) || "#888888", (out) => this.setProp(file, key, out))));
      else if (type === "checkbox") menu.addItem((i) => i.setTitle("Toggle").setIcon("check").onClick(() => this.setProp(file, key, !(this.raw[key] === true))));
      else if (type === "image") menu.addItem((i) => i.setTitle("Edit image link…").setIcon("image").onClick(() => new TextPromptModal(this.app, "Image link", getStr(this.raw, key), (v) => this.setProp(file, key, v.trim() === "" ? undefined : v.trim())).open()));
      else { const float = type === "decimal" || type === "formula"; menu.addItem((i) => i.setTitle("Edit value…").setIcon("pencil").onClick(() => new TextPromptModal(this.app, "Edit " + (entry.alias || key), getStr(this.raw, key), (v) => { if (type === "text") this.setProp(file, key, v.trim() === "" ? undefined : v.trim()); else { let n = Number(v); if (!Number.isFinite(n)) return; if (!float) n = Math.round(n); if (entry.clamp && entry.min !== undefined && entry.max !== undefined) n = clamp(n, entry.min, entry.max); this.setProp(file, key, n); } }, type === "text" ? () => this.plugin.valuesFor(key) : undefined).open())); }
    }
    const gm = section.layoutMode ?? (section.columns > 1 ? "columns" : "list");
    if ((gm === "grid" || gm === "columns") && entry.kind !== "saves" && entry.kind !== "skills") { const cols = section.columns || 1; const idx = section.entries.indexOf(entry); if (idx >= 0) { menu.addSeparator(); if (gm === "grid") menu.addItem((i) => i.setTitle("Remove this row").setIcon("trash").onClick(() => this.removeRowAt(section, Math.floor(idx / cols)))); menu.addItem((i) => i.setTitle(gm === "grid" ? "Remove this column" : "Remove a column").setIcon("trash").onClick(() => this.removeColumnAt(section, idx % cols))); } }
    menu.addSeparator(); menu.addItem((i) => i.setTitle("Remove from sidebar").setIcon("trash").onClick(() => this.removeEntry(section, entry)));
    menu.showAtMouseEvent(e);
  }
  private sectionMenu(e: MouseEvent, section: Section) {
    const menu = new Menu();
    menu.addItem((i) => i.setTitle(`Configure “${section.title}”…`).setIcon("settings").onClick(() => new SectionFormatModal(this.app, this.plugin, section, () => { this.save(); this.render(); }).open()));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle((section.dividers ? "Hide" : "Show") + " horizontal dividers").onClick(() => { section.dividers = !section.dividers; this.save(); this.render(); })); menu.addItem((i) => i.setTitle((section.vdividers ? "Hide" : "Show") + " vertical dividers").onClick(() => { section.vdividers = !section.vdividers; this.save(); this.render(); }));
    menu.addItem((i) => i.setTitle((section.collapsible === false ? "Enable" : "Disable") + " collapsing").onClick(() => { section.collapsible = section.collapsible === false; if (section.collapsible === false) section.collapsed = false; this.save(); this.render(); }));
    menu.addItem((i) => i.setTitle("Add object").setIcon("plus-circle").onClick(() => { const m2 = new Menu(); m2.addItem((x) => x.setTitle("Rolls").onClick(() => { section.entries.push({ id: genId(), kind: "rolls" }); this.save(); this.render(); })); m2.addItem((x) => x.setTitle("Table of contents").onClick(() => { section.entries.push({ id: genId(), kind: "toc" }); this.save(); this.render(); })); m2.showAtMouseEvent(e); }));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle("Move up").setIcon("arrow-up").onClick(() => this.moveSectionBy(section.id, -1)));
    menu.addItem((i) => i.setTitle("Move down").setIcon("arrow-down").onClick(() => this.moveSectionBy(section.id, 1)));
    menu.addItem((i) => i.setTitle("Delete section").setIcon("trash").onClick(() => { this.layout.sections = this.layout.sections.filter((s) => s.id !== section.id); this.save(); this.render(); }));
    menu.showAtMouseEvent(e);
  }
  private renderColRail(parent: HTMLElement, section: Section, ncol: number) { const rail = parent.createDiv({ cls: "ep-colrail" }); for (let i = 0; i <= ncol; i++) { const b = rail.createDiv({ cls: "ep-addbar" }); const sp = b.createSpan(); setIcon(sp, "plus"); b.setAttr("title", "Add a column here"); b.onclick = () => this.addColumnAt(section, i); if (i < ncol) { const slot = rail.createDiv({ cls: "ep-railslot" }); const rm = slot.createDiv({ cls: "ep-rmbar" }); const rs = rm.createSpan(); setIcon(rs, "minus"); rm.setAttr("title", "Remove this column"); rm.onclick = () => this.removeColumnAt(section, i); } } }
  private renderRowRail(parent: HTMLElement, section: Section, ncol: number) { const nrow = section.rows && section.rows > 0 ? section.rows : Math.max(1, Math.ceil(section.entries.length / ncol)); const rail = parent.createDiv({ cls: "ep-rowrail" }); for (let i = 0; i <= nrow; i++) { const b = rail.createDiv({ cls: "ep-addbar" }); const sp = b.createSpan(); setIcon(sp, "plus"); b.setAttr("title", "Add a row here"); b.onclick = () => this.addRowAt(section, i); if (i < nrow) { const slot = rail.createDiv({ cls: "ep-railslot" }); const rm = slot.createDiv({ cls: "ep-rmbar" }); const rs = rm.createSpan(); setIcon(rs, "minus"); rm.setAttr("title", "Remove this row"); rm.onclick = () => this.removeRowAt(section, i); } } }
  private gridRows(section: Section, cols: number): Entry[][] { const rows: Entry[][] = []; const es = section.entries; for (let i = 0; i < es.length; i += cols) { const row = es.slice(i, i + cols); while (row.length < cols) row.push({ id: genId(), kind: "blank" }); rows.push(row); } return rows; }
  private addColumnAt(section: Section, idx: number) { const mode = section.layoutMode ?? (section.columns > 1 ? "columns" : "list"); if (mode !== "grid") { section.columns = (section.columns || 1) + 1; this.save(); this.render(); return; } const cols = section.columns || 1; const rows = this.gridRows(section, cols); const ci = Math.max(0, Math.min(idx, cols)); for (const row of rows) row.splice(ci, 0, { id: genId(), kind: "blank" }); section.columns = cols + 1; section.entries = rows.flat(); this.save(); this.render(); }
  private addRowAt(section: Section, idx: number) { const cols = section.columns || 1; const rows = this.gridRows(section, cols); const ri = Math.max(0, Math.min(idx, rows.length)); rows.splice(ri, 0, Array.from({ length: cols }, () => ({ id: genId(), kind: "blank" } as Entry))); if (section.rows && section.rows > 0) section.rows = rows.length; section.entries = rows.flat(); this.save(); this.render(); }
  private removeRowAt(section: Section, rowIdx: number) { const cols = section.columns || 1; const rows = this.gridRows(section, cols); if (rowIdx < 0 || rowIdx >= rows.length) return; rows.splice(rowIdx, 1); if (section.rows && section.rows > 0) section.rows = rows.length; section.entries = rows.flat(); this.save(); this.render(); }
  private removeColumnAt(section: Section, colIdx: number) { const mode = section.layoutMode ?? (section.columns > 1 ? "columns" : "list"); if (mode !== "grid") { section.columns = Math.max(1, (section.columns || 1) - 1); this.save(); this.render(); return; } const cols = section.columns || 1; if (cols <= 1) return; const rows = this.gridRows(section, cols); for (const row of rows) if (colIdx < row.length) row.splice(colIdx, 1); section.columns = cols - 1; section.entries = rows.flat(); this.save(); this.render(); }
  private flipMove(fn: () => void) {
    const first = new Map<string, DOMRect>();
    this.containerEl.findAll("[data-ep-id]").forEach((el) => first.set(el.getAttribute("data-ep-id")!, el.getBoundingClientRect()));
    fn();
    requestAnimationFrame(() => { this.containerEl.findAll("[data-ep-id]").forEach((el) => { const id = el.getAttribute("data-ep-id"); const f = id ? first.get(id) : undefined; if (!f) return; const n = el.getBoundingClientRect(); const dx = f.left - n.left, dy = f.top - n.top; if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return; const h = el as HTMLElement; h.style.transition = "none"; h.style.transform = `translate(${dx}px, ${dy}px)`; requestAnimationFrame(() => { h.style.transition = "transform .25s ease"; h.style.transform = ""; const done = () => { h.style.transition = ""; h.style.transform = ""; h.removeEventListener("transitionend", done); }; h.addEventListener("transitionend", done); }); }); });
  }
  private moveSectionBy(id: string, delta: number) { const secs = this.layout.sections; const i = secs.findIndex((s) => s.id === id); const j = i + delta; if (i < 0 || j < 0 || j >= secs.length) return; this.flipMove(() => { const [s] = secs.splice(i, 1); secs.splice(j, 0, s); this.save(); this.render(); }); }
  private moveSection(dragId: string, targetId: string, after: boolean) { if (dragId === targetId) return; const secs = this.layout.sections; const from = secs.findIndex((s) => s.id === dragId); if (from < 0) return; this.flipMove(() => { const [s] = secs.splice(from, 1); let idx = secs.findIndex((x) => x.id === targetId); if (idx < 0) idx = secs.length; idx += after ? 1 : 0; secs.splice(idx, 0, s); this.save(); this.render(); }); }
  private moveEntry(dragId: string, fromSec: string, toSec: string, targetEntryId: string | null, after: boolean) { const src = this.layout.sections.find((s) => s.id === fromSec); const dst = this.layout.sections.find((s) => s.id === toSec); if (!src || !dst) return; const i = src.entries.findIndex((en) => en.id === dragId); if (i < 0) return; this.flipMove(() => { const [en] = src.entries.splice(i, 1); let idx = targetEntryId ? dst.entries.findIndex((x) => x.id === targetEntryId) : dst.entries.length; if (idx < 0) idx = dst.entries.length; idx += after ? 1 : 0; dst.entries.splice(idx, 0, en); this.save(); this.render(); }); }
  private attachSectionDnD(det: HTMLElement, grid: HTMLElement, section: Section) { const grip = det.querySelector(".ep-section-title .ep-grip") as HTMLElement | null; if (grip) { grip.setAttr("draggable", "true"); grip.addEventListener("dragstart", (e: DragEvent) => { this.dragData = { kind: "section", id: section.id }; e.dataTransfer?.setData("text/plain", section.id); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; }); grip.addEventListener("dragend", () => { this.dragData = null; this.clearMarks(); }); } det.addEventListener("dragover", (e: DragEvent) => { if (this.dragData?.kind !== "section") return; e.preventDefault(); this.mark(det, this.isAfter(e, det)); }); det.addEventListener("dragleave", () => det.removeClasses(["ep-drop-top", "ep-drop-bottom"])); det.addEventListener("drop", (e: DragEvent) => { if (this.dragData?.kind !== "section") return; e.preventDefault(); e.stopPropagation(); this.moveSection(this.dragData.id, section.id, this.isAfter(e, det)); }); grid.addEventListener("dragover", (e: DragEvent) => { if (this.dragData?.kind !== "entry") return; e.preventDefault(); }); grid.addEventListener("drop", (e: DragEvent) => { if (this.dragData?.kind !== "entry") return; e.preventDefault(); this.moveEntry(this.dragData.id, this.dragData.from as string, section.id, null, false); }); }
  private attachEntryDnD(row: HTMLElement, grip: HTMLElement, section: Section, entry: Entry) {
    grip.addEventListener("pointerdown", (e: PointerEvent) => { if (e.button !== 0) return; this.startEntryDrag(e, row, section, entry); });
  }
  private startEntryDrag(ev: PointerEvent, wrap: HTMLElement, section: Section, entry: Entry) {
    ev.preventDefault();
    const rect = wrap.getBoundingClientRect(); const ox = ev.clientX - rect.left, oy = ev.clientY - rect.top;
    const clone = wrap.cloneNode(true) as HTMLElement; clone.addClass("ep-drag-clone"); clone.style.position = "fixed"; clone.style.left = "0"; clone.style.top = "0"; clone.style.width = rect.width + "px"; clone.style.margin = "0"; clone.style.pointerEvents = "none"; clone.style.zIndex = "9999"; document.body.appendChild(clone);
    const moveClone = (cx: number, cy: number) => { clone.style.transform = `translate(${cx - ox}px, ${cy - oy}px)`; };
    moveClone(ev.clientX, ev.clientY); wrap.addClass("ep-drag-placeholder");
    let swapEl: HTMLElement | null = null; let gridTarget: HTMLElement | null = null;
    const clearSwap = () => { if (swapEl) { swapEl.removeClass("ep-swap-target"); swapEl = null; } if (gridTarget) { gridTarget.removeClass("ep-swap-target"); gridTarget = null; } };
    const flip = (container: HTMLElement, fn: () => void) => { const els = Array.from(container.querySelectorAll(".ep-entry")) as HTMLElement[]; const first = new Map<HTMLElement, DOMRect>(); els.forEach((el) => first.set(el, el.getBoundingClientRect())); fn(); els.forEach((el) => { const f = first.get(el); if (!f) return; const n = el.getBoundingClientRect(); const dx = f.left - n.left, dy = f.top - n.top; if (!dx && !dy) return; el.style.transition = "none"; el.style.transform = `translate(${dx}px, ${dy}px)`; requestAnimationFrame(() => { el.style.transition = "transform .18s ease"; el.style.transform = ""; const done = () => { el.style.transition = ""; el.removeEventListener("transitionend", done); }; el.addEventListener("transitionend", done); }); }); };
    const onMove = (e: PointerEvent) => {
      moveClone(e.clientX, e.clientY);
      const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null; if (!under) return;
      const grid = under.closest(".ep-grid") as HTMLElement | null; if (!grid) return;
      const isGrid = grid.classList.contains("ep-mode-grid"); clearSwap();
      if (isGrid) { const cell = under.closest(".ep-entry, .ep-empty-cell") as HTMLElement | null; if (cell && cell !== wrap) { gridTarget = cell; cell.addClass("ep-swap-target"); } return; }
      const targetEntry = under.closest(".ep-entry") as HTMLElement | null;
      if (targetEntry && targetEntry !== wrap) {
        const r = targetEntry.getBoundingClientRect(); const relX = e.clientX - (r.left + r.width / 2), relY = e.clientY - (r.top + r.height / 2);
        if (isGrid && Math.abs(relX) < r.width * 0.3 && Math.abs(relY) < r.height * 0.3 && !targetEntry.classList.contains("ep-entry-block")) { swapEl = targetEntry; swapEl.addClass("ep-swap-target"); return; }
        const after = Math.abs(relX) > Math.abs(relY) ? relX > 0 : relY > 0; const parent = targetEntry.parentElement as HTMLElement; const refNode = after ? targetEntry.nextSibling : targetEntry;
        if (wrap.parentElement !== parent || wrap.nextSibling !== refNode) flip(grid, () => parent.insertBefore(wrap, refNode));
      } else {
        const cell = under.closest(".ep-empty-cell") as HTMLElement | null;
        if (cell) flip(grid, () => grid.insertBefore(wrap, cell));
        else { const cont = (under.closest(".ep-col") as HTMLElement | null) || grid; if ((cont.classList.contains("ep-col") || cont.classList.contains("ep-grid")) && wrap.parentElement !== cont) flip(grid, () => cont.appendChild(wrap)); }
      }
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp); clone.remove(); wrap.removeClass("ep-drag-placeholder");
      if (gridTarget) { const tid = (gridTarget.getAttribute("data-ep-id") || "").slice(2); gridTarget.removeClass("ep-swap-target"); if (tid) this.swapEntries(entry.id, tid); else this.moveLeaveBlank(entry.id, section.id); return; }
      if (swapEl) { const otherId = (swapEl.getAttribute("data-ep-id") || "").slice(2); swapEl.removeClass("ep-swap-target"); if (otherId) { this.swapEntries(entry.id, otherId); return; } }
      const secEl = wrap.closest(".ep-section") as HTMLElement | null; const toId = secEl ? (secEl.getAttribute("data-ep-id") || "s:").slice(2) : section.id;
      const order = secEl ? (Array.from(secEl.querySelectorAll(".ep-entry")) as HTMLElement[]).map((el) => (el.getAttribute("data-ep-id") || "").slice(2)).filter(Boolean) : [];
      this.reorderEntryByOrder(entry.id, section.id, toId, order);
    };
    document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", onUp);
  }
  private moveLeaveBlank(entryId: string, fromId: string) { const sec = this.layout.sections.find((s) => s.id === fromId); if (!sec) { this.render(); return; } const i = sec.entries.findIndex((e) => e.id === entryId); if (i < 0) { this.render(); return; } const [en] = sec.entries.splice(i, 1); sec.entries.splice(i, 0, { id: genId(), kind: "blank" }); sec.entries.push(en); this.save(); this.render(); }
  private swapEntries(aId: string, bId: string) { let aS: Section | undefined, bS: Section | undefined, ai = -1, bi = -1; for (const sec of this.layout.sections) { const i = sec.entries.findIndex((e) => e.id === aId); if (i >= 0) { aS = sec; ai = i; } const j = sec.entries.findIndex((e) => e.id === bId); if (j >= 0) { bS = sec; bi = j; } } if (!aS || !bS || ai < 0 || bi < 0) { this.render(); return; } const t = aS.entries[ai]; aS.entries[ai] = bS.entries[bi]; bS.entries[bi] = t; this.save(); this.render(); }
  private reorderEntryByOrder(entryId: string, fromId: string, toId: string, order: string[]) { const from = this.layout.sections.find((s) => s.id === fromId); const to = this.layout.sections.find((s) => s.id === toId); if (!from || !to) { this.render(); return; } const i = from.entries.findIndex((e) => e.id === entryId); if (i < 0) { this.render(); return; } const [en] = from.entries.splice(i, 1); const map = new Map(to.entries.map((e) => [e.id, e] as [string, Entry])); map.set(en.id, en); const next: Entry[] = []; for (const id of order) { const e = map.get(id); if (e) { next.push(e); map.delete(id); } } for (const e of map.values()) next.push(e); to.entries = next; this.save(); this.render(); }
  private closePopups() { const old = this.popups; this.popups = []; this.notesWin = null; for (const p of old) { p.addClass("ep-closing"); window.setTimeout(() => p.remove(), 140); } }
  private flipLeftIfNeeded(pop: HTMLElement, leftPx: number, anchorLeft: number) { const w = pop.offsetWidth; if (leftPx + w > window.innerWidth - 4) pop.style.left = Math.max(4, anchorLeft - w - 4) + "px"; const h = pop.offsetHeight; const top = parseFloat(pop.style.top || "0"); if (top + h > window.innerHeight - 4) pop.style.top = Math.max(4, window.innerHeight - h - 4) + "px"; }
  private showNotesWindow(anchor: HTMLElement, key: string, value: string) { if (this.notesWin) { this.notesWin.remove(); const k = this.popups.indexOf(this.notesWin); if (k >= 0) this.popups.splice(k, 1); } const w = document.body.createDiv({ cls: "ep-popup ep-noteswin" }); this.popups.push(w); this.notesWin = w; const r = anchor.getBoundingClientRect(); w.style.left = r.right + 4 + "px"; w.style.top = r.top + "px"; w.style.minWidth = "160px"; w.createDiv({ cls: "ep-side-title", text: `Notes with “${value}”` }); const body = w.createDiv({ cls: "ep-side-body" }); const notes = this.plugin.notesWithValue(key, value); if (!notes.length) body.createDiv({ cls: "ep-empty-sub", text: "No notes use this value." }); for (const n of notes.slice(0, 100)) body.createDiv({ cls: "ep-pop-row", text: n }); this.flipLeftIfNeeded(w, r.right + 4, r.left); }
  private closePopups2() {}
  private attachOutside(anchor: HTMLElement) { const h = (e: MouseEvent) => { const t = e.target as HTMLElement; if (this.popups.some((p) => p.contains(t)) || anchor.contains(t)) return; this.closePopups(); document.removeEventListener("mousedown", h); }; window.setTimeout(() => document.addEventListener("mousedown", h), 0); }
  private addEntryWithValue(file: TFile, section: Section, key: string, value: unknown, opts?: { index?: number; replaceId?: string }) { key = (key || "").trim(); if (!key) return; const isList = Array.isArray(value); const en: Entry = { id: genId(), kind: "prop", key, dataType: isList ? "list" : this.deriveType(key) }; let idx = opts?.index ?? section.entries.length; if (opts?.replaceId) { const ri = section.entries.findIndex((e) => e.id === opts.replaceId); if (ri >= 0) { section.entries.splice(ri, 1); idx = ri; } } section.entries.splice(Math.max(0, Math.min(idx, section.entries.length)), 0, en); if (value !== undefined) this.raw[key] = value; this.save(); this.render(); if (value !== undefined) this.persist(file, key); }
  private addCandidates() { const shown = this.shownKeys(); const all = new Set<string>([...Object.keys(this.raw).filter((k) => k.toLowerCase() !== "position"), ...this.plugin.knownProps()]); const onNote: { key: string }[] = [], onSidebar: { key: string }[] = [], others: { key: string }[] = []; for (const k of all) { if (this.raw[k] !== undefined) onNote.push({ key: k }); else if (shown.has(k.toLowerCase())) onSidebar.push({ key: k }); else others.push({ key: k }); } const srt = (a: { key: string }[]) => a.sort((x, y) => x.key.localeCompare(y.key)); return { onNote: srt(onNote), onSidebar: srt(onSidebar), others: srt(others) }; }
  private allKeys() { return [...new Set<string>([...Object.keys(this.raw), ...this.plugin.knownProps()])]; }
  private openAddMenu(anchor: HTMLElement, file: TFile, section: Section, opts?: { index?: number; replaceId?: string }) {
    this.closePopups();
    const pop = document.body.createDiv({ cls: "ep-popup ep-addmenu" }); this.popups.push(pop);
    const r = anchor.getBoundingClientRect(); pop.style.left = r.left + "px"; pop.style.top = r.bottom + 2 + "px"; pop.style.minWidth = "220px";
    const search = pop.createEl("input", { cls: "ep-edit-input ep-addsearch" }); search.type = "text"; search.placeholder = `Add a property to “${section.title}”…`;
    const listEl = pop.createDiv({ cls: "ep-addlist" });
    const groups = this.addCandidates();
    const render = () => {
      listEl.empty(); const q = search.value.trim().toLowerCase();
      const addRow = (c: { key: string }) => { const row = listEl.createDiv({ cls: "ep-pop-row" }); row.createSpan({ text: c.key }); if (this.plugin.isHidden(c.key)) row.createSpan({ cls: "ep-sug-badge ep-badge-hidden", text: "hidden" }); const isList = this.plugin.obsidianType(c.key) === "list" || Array.isArray(this.raw[c.key]); let timer = 0; row.onmouseenter = () => { timer = window.setTimeout(() => this.showAddSide(row, file, section, c.key, isList, opts), 450); }; row.onmouseleave = () => window.clearTimeout(timer); row.onclick = () => { if (isList) this.showAddSide(row, file, section, c.key, true, opts); else { this.addEntryWithValue(file, section, c.key, undefined, opts); this.closePopups(); } }; };
      const grp = (title: string, arr: { key: string }[]) => { const f = arr.filter((c) => !q || c.key.toLowerCase().includes(q)); if (!f.length) return; listEl.createDiv({ cls: "ep-pop-group", text: title }); for (const c of f.slice(0, 60)) addRow(c); };
      if (q && !this.allKeys().some((k) => k.toLowerCase() === q)) { const row = listEl.createDiv({ cls: "ep-pop-row ep-pop-create" }); row.setText(`Create “${search.value.trim()}”`); row.onclick = () => { this.addEntryWithValue(file, section, search.value.trim(), undefined, opts); this.closePopups(); }; }
      grp("On note", groups.onNote); grp("On sidebar", groups.onSidebar); grp("Others", groups.others);
    };
    search.oninput = () => render();
    search.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); const v = search.value.trim(); if (v) { this.addEntryWithValue(file, section, v, undefined, opts); this.closePopups(); } } else if (e.key === "Escape") this.closePopups(); };
    render(); window.setTimeout(() => search.focus(), 0); this.attachOutside(anchor);
  }
  private showAddSide(row: HTMLElement, file: TFile, section: Section, key: string, multi: boolean, opts?: { index?: number; replaceId?: string }) {
    while (this.popups.length > 1) { const p = this.popups.pop(); p?.remove(); }
    const side = document.body.createDiv({ cls: "ep-popup ep-side" }); this.popups.push(side);
    const r = row.getBoundingClientRect(); side.style.left = r.right + 2 + "px"; side.style.top = r.top + "px"; side.style.minWidth = "170px";
    side.createDiv({ cls: "ep-side-title", text: multi ? `${key} — pick values` : key });
    const body = side.createDiv({ cls: "ep-side-body" }); const sel = new Set<string>(); const vals = this.plugin.valuesFor(key);
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" }); custom.type = "text"; custom.placeholder = multi ? "Custom value…" : "Type a value…";
    let addBtn: HTMLButtonElement | null = null; const upd = () => { if (addBtn) addBtn.setText(`Add ${sel.size + (custom.value.trim() ? 1 : 0)}`); };
    const commit = (single?: string) => { if (multi) { const arr = [...sel]; if (custom.value.trim()) arr.push(custom.value.trim()); this.addEntryWithValue(file, section, key, arr, opts); } else { const v = single ?? custom.value.trim(); this.addEntryWithValue(file, section, key, v === "" ? undefined : v, opts); } this.closePopups(); };
    for (const v of vals) { const it = body.createDiv({ cls: "ep-pop-row" }); let nt = 0; it.onmouseenter = () => { nt = window.setTimeout(() => this.showNotesWindow(it, key, v), 500); }; it.onmouseleave = () => window.clearTimeout(nt); if (multi) { const cb = it.createEl("input"); cb.type = "checkbox"; it.createSpan({ text: v }); it.onclick = (e) => { if ((e.target as HTMLElement) !== cb) cb.checked = !cb.checked; if (cb.checked) sel.add(v); else sel.delete(v); upd(); }; } else { it.createSpan({ text: v }); it.onclick = () => commit(v); } }
    if (!vals.length) body.createDiv({ cls: "ep-empty-sub", text: "No existing values." });
    custom.oninput = () => upd(); custom.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } };
    const foot = side.createDiv({ cls: "ep-side-foot" }); if (multi) { addBtn = foot.createEl("button", { cls: "mod-cta", text: "Add 0" }); addBtn.onclick = () => commit(); } else { const ab = foot.createEl("button", { cls: "ep-mini-btn", text: "Add empty" }); ab.onclick = () => { this.addEntryWithValue(file, section, key, undefined, opts); this.closePopups(); }; } this.flipLeftIfNeeded(side, r.right + 2, r.left);
  }
  private openValuePickerForList(left: number, top: number, file: TFile, key: string) {
    this.closePopups(); const cur = getList(this.raw, key);
    const side = document.body.createDiv({ cls: "ep-popup ep-side" }); this.popups.push(side); side.style.left = left + "px"; side.style.top = top + "px"; side.style.minWidth = "170px";
    side.createDiv({ cls: "ep-side-title", text: `Add to ${key}` });
    const body = side.createDiv({ cls: "ep-side-body" }); const sel = new Set<string>(); const opts = this.plugin.valuesFor(key).filter((o) => !cur.some((c) => c.toLowerCase() === o.toLowerCase()));
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" }); custom.type = "text"; custom.placeholder = "Custom value…";
    let addBtn: HTMLButtonElement; const upd = () => addBtn.setText(`Add ${sel.size + (custom.value.trim() ? 1 : 0)}`);
    for (const v of opts) { const it = body.createDiv({ cls: "ep-pop-row" }); const cb = it.createEl("input"); cb.type = "checkbox"; it.createSpan({ text: v }); it.onclick = (e) => { if ((e.target as HTMLElement) !== cb) cb.checked = !cb.checked; if (cb.checked) sel.add(v); else sel.delete(v); upd(); }; }
    if (!opts.length) body.createDiv({ cls: "ep-empty-sub", text: "No more values." });
    custom.oninput = () => upd(); custom.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); addBtn.click(); } };
    const foot = side.createDiv({ cls: "ep-side-foot" }); addBtn = foot.createEl("button", { cls: "mod-cta", text: "Add 0" }); addBtn.onclick = () => { const add = [...sel]; if (custom.value.trim()) add.push(custom.value.trim()); if (add.length) this.setProp(file, key, [...cur, ...add]); this.closePopups(); };
    this.flipLeftIfNeeded(side, left, left); this.attachOutside(side);
  }
  private isAfter(e: DragEvent, el: HTMLElement): boolean { const r = el.getBoundingClientRect(); return e.clientY - r.top > r.height / 2; }
  private mark(el: HTMLElement, after: boolean) { el.removeClasses(["ep-drop-top", "ep-drop-bottom"]); el.addClass(after ? "ep-drop-bottom" : "ep-drop-top"); }
  private clearMarks() { this.containerEl.findAll(".ep-drop-top, .ep-drop-bottom").forEach((el) => el.removeClasses(["ep-drop-top", "ep-drop-bottom"])); this.containerEl.findAll(".ep-dragging").forEach((el) => el.removeClass("ep-dragging")); }
}

class PropSuggest extends AbstractInputSuggest<{ key: string; kind: "note" | "vault" | "create" }> {
  constructor(app: App, inputEl: HTMLInputElement, private getCands: () => { key: string; onNote: boolean }[], private onChoose: (key: string) => void, private clearOnSelect = true) { super(app, inputEl); }
  getSuggestions(query: string) { const q = query.trim(); const ql = q.toLowerCase(); const cands = this.getCands(); const filtered = (ql ? cands.filter((c) => c.key.toLowerCase().includes(ql)) : cands).slice(0, 50); const res: { key: string; kind: "note" | "vault" | "create" }[] = filtered.map((c) => ({ key: c.key, kind: c.onNote ? "note" : "vault" })); if (q && !cands.some((c) => c.key.toLowerCase() === ql)) res.unshift({ key: q, kind: "create" }); return res; }
  renderSuggestion(c: { key: string; kind: "note" | "vault" | "create" }, el: HTMLElement) { if (c.kind === "create") { el.addClass("ep-sug-create"); el.setText(`Create "${c.key}" (text)`); return; } el.createSpan({ text: c.key }); if (c.kind === "note") el.createSpan({ cls: "ep-sug-badge", text: "on note" }); }
  selectSuggestion(c: { key: string; kind: "note" | "vault" | "create" }) { this.onChoose(c.key); this.setValue(this.clearOnSelect ? "" : c.key); (this as any).close?.(); }
}
class ValueSuggest extends AbstractInputSuggest<string> {
  constructor(app: App, inputEl: HTMLInputElement, private getOptions: () => string[], private onChoose: (v: string) => void, private clearOnSelect = true) { super(app, inputEl); }
  getSuggestions(query: string) { const q = query.trim(); const ql = q.toLowerCase(); const opts = this.getOptions(); const filtered = (ql ? opts.filter((o) => o.toLowerCase().includes(ql)) : opts).slice(0, 50); if (q && !opts.some((o) => o.toLowerCase() === ql)) filtered.unshift(q); return filtered; }
  renderSuggestion(v: string, el: HTMLElement) { el.setText(v); }
  selectSuggestion(v: string) { this.onChoose(v); this.setValue(this.clearOnSelect ? "" : v); (this as any).close?.(); }
}
function addColorSetting(app: App, plugin: ExtendedPropertiesPlugin, container: HTMLElement, name: string, desc: string, get: () => string | undefined, set: (v: string | undefined) => void) {
  const setting = new Setting(container).setName(name); if (desc) setting.setDesc(desc);
  const sw = setting.controlEl.createSpan({ cls: "ep-swatch" }); const upd = () => { const h = get(); const ok = h && hexToRgb(h); sw.style.background = ok ? (h as string) : "transparent"; sw.toggleClass("ep-swatch-empty", !ok); }; upd();
  sw.onclick = () => new ColorPickerModal(app, plugin, get() || "#888888", (hex) => { set(hex); upd(); }).open();
  setting.addButton((b) => b.setButtonText("Clear").onClick(() => { set(undefined); upd(); })); return setting;
}

class ColorPickerModal extends Modal {
  private rgb: { r: number; g: number; b: number };
  private space: ColorSpace;
  private preview!: HTMLElement; private hexInput!: HTMLInputElement; private body!: HTMLElement; private lastIdx?: number; private lastBodyH?: number;
  constructor(app: App, private plugin: ExtendedPropertiesPlugin, initial: string, private onSubmit: (hex: string) => void) { super(app); this.rgb = hexToRgb(initial) ?? { r: 136, g: 136, b: 136 }; this.space = plugin.settings.defaults.colorSpace; }
  onOpen() {
    const { contentEl } = this; contentEl.addClass("ep-colorpicker"); contentEl.createEl("h3", { text: "Pick a color" });
    const tabs = contentEl.createDiv({ cls: "ep-cp-tabs" });
    for (const sp of COLOR_SPACES) { const b = tabs.createEl("button", { cls: "ep-mode-btn", text: sp }); if (sp === this.space) b.addClass("is-active"); b.onclick = () => { this.space = sp; this.plugin.settings.defaults.colorSpace = sp; this.plugin.saveSettings(); tabs.querySelectorAll("button").forEach((x) => x.removeClass("is-active")); b.addClass("is-active"); this.renderContent(); }; }
    const bar = contentEl.createDiv({ cls: "ep-cp-bar" });
    this.preview = bar.createDiv({ cls: "ep-cp-preview" });
    if ((window as any).EyeDropper) { const ed = bar.createEl("button", { cls: "ep-icon-btn" }); setIcon(ed, "pipette"); ed.setAttr("title", "Pick from screen"); ed.onclick = async () => { try { const c = await new (window as any).EyeDropper().open(); const rgb = hexToRgb(c.sRGBHex); if (rgb) { this.rgb = rgb; this.updatePreviewHex(); this.renderContent(); } } catch { /* cancelled */ } }; }
    this.hexInput = bar.createEl("input"); this.hexInput.type = "text"; this.hexInput.addClass("ep-edit-input"); this.hexInput.onchange = () => { const c = hexToRgb(this.hexInput.value); if (c) { this.rgb = c; this.updatePreviewHex(); this.renderContent(); } };
    this.body = contentEl.createDiv({ cls: "ep-cp-body" });
    this.updatePreviewHex(); this.renderContent();
    new Setting(contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Save").setCta().onClick(() => { this.onSubmit(rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b)); this.close(); }));
  }
  private updatePreviewHex() { const hex = rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b); this.preview.style.background = hex; if (this.hexInput) this.hexInput.value = hex; }
  private gslider(parent: HTMLElement, label: string, long: string, min: number, max: number, step: number, val: number, grad: () => string, onInput: (v: number) => void) {
    const row = parent.createDiv({ cls: "ep-cp-channel" }); const lbl = row.createSpan({ cls: "ep-cp-label", text: label }); lbl.setAttr("title", long);
    const sw = row.createDiv({ cls: "ep-gslider" }); const track = sw.createDiv({ cls: "ep-gtrack" }); const thumb = sw.createDiv({ cls: "ep-gthumb" });
    const num = row.createEl("input"); num.type = "number"; num.min = String(min); num.max = String(max); num.step = String(step); num.value = String(Math.round(val * 1000) / 1000); num.addClass("ep-edit-input");
    let cur = val;
    const place = () => { const t = max > min ? (cur - min) / (max - min) : 0; thumb.style.left = clampN(t, 0, 1) * 100 + "%"; };
    const update = () => { track.style.background = grad(); };
    const setVal = (v: number, fire: boolean) => { cur = clampN(v, min, max); num.value = String(Math.round(cur * 1000) / 1000); place(); if (fire) onInput(cur); };
    const fromX = (clientX: number) => { const r = sw.getBoundingClientRect(); const tt = clampN((clientX - r.left) / r.width, 0, 1); let v = min + tt * (max - min); if (step) v = Math.round(v / step) * step; setVal(v, true); };
    sw.addEventListener("pointerdown", (e: PointerEvent) => { sw.setPointerCapture(e.pointerId); fromX(e.clientX); });
    sw.addEventListener("pointermove", (e: PointerEvent) => { if (e.buttons) fromX(e.clientX); });
    num.addEventListener("change", () => setVal(Number(num.value), true));
    update(); place();
    return { update, setValue: (v: number) => setVal(v, false) };
  }
  private buildField(parent: HTMLElement, colorAt: (x: number, y: number) => { r: number; g: number; b: number }, getXY: () => [number, number], setXY: (x: number, y: number) => void) {
    const wrap = parent.createDiv({ cls: "ep-cp-field-wrap" }); const canvas = wrap.createEl("canvas"); canvas.width = 200; canvas.height = 170; canvas.addClass("ep-cp-field"); const cursor = wrap.createDiv({ cls: "ep-cp-cursor" });
    const paint = () => { const ctx = canvas.getContext("2d"); if (!ctx) return; const w = canvas.width, h = canvas.height; const img = ctx.createImageData(w, h); const d = img.data; for (let py = 0; py < h; py++) { const yy = py / (h - 1); for (let px = 0; px < w; px++) { const xx = px / (w - 1); const c = colorAt(xx, yy); const i = (py * w + px) * 4; d[i] = clampN(c.r, 0, 255); d[i + 1] = clampN(c.g, 0, 255); d[i + 2] = clampN(c.b, 0, 255); d[i + 3] = 255; } } ctx.putImageData(img, 0, 0); };
    const place = () => { const [x, y] = getXY(); cursor.style.left = x * 100 + "%"; cursor.style.top = y * 100 + "%"; };
    const fromEv = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); setXY(clampN((e.clientX - r.left) / r.width, 0, 1), clampN((e.clientY - r.top) / r.height, 0, 1)); place(); };
    canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); fromEv(e); }); canvas.addEventListener("pointermove", (e) => { if (e.buttons) fromEv(e); });
    paint(); place(); return { paint, place };
  }
  private renderContent() {
    const idx = COLOR_SPACES.indexOf(this.space); const dir = this.lastIdx === undefined ? 0 : idx > this.lastIdx ? 1 : idx < this.lastIdx ? -1 : 0; this.lastIdx = idx;
    this.body.empty(); this.body.removeClass("ep-slide-r"); this.body.removeClass("ep-slide-l"); void this.body.offsetWidth; if (dir > 0) this.body.addClass("ep-slide-r"); else if (dir < 0) this.body.addClass("ep-slide-l");
    const sliders: { update: () => void }[] = []; const refresh = () => { this.updatePreviewHex(); sliders.forEach((s) => s.update()); };
    if (this.space === "RGB") {
      const ch = { ...this.rgb };
      sliders.push(this.gslider(this.body, "R", "Red", 0, 255, 1, ch.r, () => gradStops(16, (t) => ({ rgb: { r: t * 255, g: ch.g, b: ch.b }, oog: false })), (v) => { ch.r = v; this.rgb = { ...ch }; refresh(); }));
      sliders.push(this.gslider(this.body, "G", "Green", 0, 255, 1, ch.g, () => gradStops(16, (t) => ({ rgb: { r: ch.r, g: t * 255, b: ch.b }, oog: false })), (v) => { ch.g = v; this.rgb = { ...ch }; refresh(); }));
      sliders.push(this.gslider(this.body, "B", "Blue", 0, 255, 1, ch.b, () => gradStops(16, (t) => ({ rgb: { r: ch.r, g: ch.g, b: t * 255 }, oog: false })), (v) => { ch.b = v; this.rgb = { ...ch }; refresh(); }));
    } else if (this.space === "HSL") {
      const ch = rgbToHsl(this.rgb.r, this.rgb.g, this.rgb.b); let field: { paint: () => void; place: () => void } | null = null;
      const two = this.body.createDiv({ cls: "ep-cp-2col" }); const left = two.createDiv({ cls: "ep-cp-left" }); const right = two.createDiv({ cls: "ep-cp-right" });
      const hS = this.gslider(right, "H", "Hue", 0, 360, 1, ch.h, () => gradStops(48, (t) => ({ rgb: hslToRgb(t * 360, ch.s, ch.l), oog: false })), (v) => { ch.h = v; this.rgb = hslToRgb(ch.h, ch.s, ch.l); field?.paint(); refresh(); });
      const sS = this.gslider(right, "S", "Saturation", 0, 100, 1, ch.s, () => gradStops(28, (t) => ({ rgb: hslToRgb(ch.h, t * 100, ch.l), oog: false })), (v) => { ch.s = v; this.rgb = hslToRgb(ch.h, ch.s, ch.l); field?.place(); refresh(); });
      const lS = this.gslider(right, "L", "Lightness", 0, 100, 1, ch.l, () => gradStops(28, (t) => ({ rgb: hslToRgb(ch.h, ch.s, t * 100), oog: false })), (v) => { ch.l = v; this.rgb = hslToRgb(ch.h, ch.s, ch.l); field?.place(); refresh(); });
      sliders.push(hS, sS, lS);
      field = this.buildField(left, (x, y) => hslToRgb(ch.h, x * 100, (1 - y) * 100), () => [ch.s / 100, 1 - ch.l / 100], (x, y) => { ch.s = x * 100; ch.l = (1 - y) * 100; this.rgb = hslToRgb(ch.h, ch.s, ch.l); sS.setValue(ch.s); lS.setValue(ch.l); refresh(); });
    } else if (this.space === "OKLCH") {
      const ch = rgbToOklch(this.rgb.r, this.rgb.g, this.rgb.b);
      sliders.push(this.gslider(this.body, "L", "Lightness", 0, 1, 0.001, ch.L, () => gradStops(56, (t) => ({ rgb: oklchToRgb(t, ch.C, ch.H), oog: !inGamutLin(oklchToLin(t, ch.C, ch.H)) })), (v) => { ch.L = v; this.rgb = oklchToRgb(ch.L, ch.C, ch.H); refresh(); }));
      sliders.push(this.gslider(this.body, "C", "Chroma", 0, 0.4, 0.001, ch.C, () => gradStops(56, (t) => ({ rgb: oklchToRgb(ch.L, t * 0.4, ch.H), oog: !inGamutLin(oklchToLin(ch.L, t * 0.4, ch.H)) })), (v) => { ch.C = v; this.rgb = oklchToRgb(ch.L, ch.C, ch.H); refresh(); }));
      sliders.push(this.gslider(this.body, "H", "Hue", 0, 360, 1, ch.H, () => gradStops(64, (t) => ({ rgb: oklchToRgb(ch.L, ch.C, t * 360), oog: !inGamutLin(oklchToLin(ch.L, ch.C, t * 360)) })), (v) => { ch.H = v; this.rgb = oklchToRgb(ch.L, ch.C, ch.H); refresh(); }));
    } else {
      const ch = rgbToOklab(this.rgb.r, this.rgb.g, this.rgb.b); let field: { paint: () => void; place: () => void } | null = null;
      const two = this.body.createDiv({ cls: "ep-cp-2col" }); const left = two.createDiv({ cls: "ep-cp-left" }); const right = two.createDiv({ cls: "ep-cp-right" });
      const lS = this.gslider(right, "L", "Lightness", 0, 1, 0.001, ch.L, () => gradStops(56, (t) => ({ rgb: oklabToRgb(t, ch.a, ch.b), oog: !inGamutLin(oklabToLin(t, ch.a, ch.b)) })), (v) => { ch.L = v; this.rgb = oklabToRgb(ch.L, ch.a, ch.b); field?.paint(); refresh(); });
      sliders.push(lS);
      field = this.buildField(left, (x, y) => oklabToRgb(ch.L, x * 0.8 - 0.4, (1 - y) * 0.8 - 0.4), () => [(ch.a + 0.4) / 0.8, 1 - (ch.b + 0.4) / 0.8], (x, y) => { ch.a = x * 0.8 - 0.4; ch.b = (1 - y) * 0.8 - 0.4; this.rgb = oklabToRgb(ch.L, ch.a, ch.b); refresh(); });
    }
    const newH = this.body.scrollHeight;
    if (this.lastBodyH !== undefined && this.lastBodyH !== newH) { this.body.style.height = this.lastBodyH + "px"; void this.body.offsetWidth; this.body.style.height = newH + "px"; const done = () => { this.body.style.height = "auto"; this.body.removeEventListener("transitionend", done); }; this.body.addEventListener("transitionend", done); }
    this.lastBodyH = newH;
  }
  onClose() { this.contentEl.empty(); }
}

class ConfirmModal extends Modal {
  constructor(app: App, private message: string, private onConfirm: () => void) { super(app); }
  onOpen() { const { contentEl } = this; contentEl.createEl("p", { text: this.message }); new Setting(contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Confirm").setWarning().onClick(() => { this.onConfirm(); this.close(); })); }
  onClose() { this.contentEl.empty(); }
}
class ExitEditModal extends Modal {
  constructor(app: App, private onSave: () => void, private onDiscard: () => void) { super(app); }
  onOpen() { const { contentEl } = this; contentEl.createEl("h3", { text: "Leave edit mode" }); contentEl.createEl("p", { text: "You made changes while editing. Keep them, or undo everything from this session?" }); new Setting(contentEl).addButton((b) => b.setButtonText("Keep editing").onClick(() => this.close())).addButton((b) => b.setButtonText("Undo changes").setWarning().onClick(() => { this.onDiscard(); this.close(); })).addButton((b) => b.setButtonText("Save changes").setCta().onClick(() => { this.onSave(); this.close(); })); }
  onClose() { this.contentEl.empty(); }
}
class TextPromptModal extends Modal {
  private value: string;
  constructor(app: App, private title: string, initial: string, private onSubmit: (v: string) => void, private suggest?: () => string[]) { super(app); this.value = initial; }
  onOpen() { const { contentEl } = this; contentEl.createEl("h3", { text: this.title }); new Setting(contentEl).setName(this.title).addText((t) => { t.setValue(this.value).onChange((v) => (this.value = v)); if (this.suggest) { new ValueSuggest(this.app, t.inputEl, this.suggest, (v) => (this.value = v), false); t.inputEl.addEventListener("focus", () => t.inputEl.dispatchEvent(new Event("input"))); t.inputEl.dispatchEvent(new Event("input")); } t.inputEl.focus(); t.inputEl.select(); t.inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { this.onSubmit(this.value); this.close(); } }); }); new Setting(contentEl).addButton((b) => b.setButtonText("Cancel").onClick(() => this.close())).addButton((b) => b.setButtonText("Save").setCta().onClick(() => { this.onSubmit(this.value); this.close(); })); }
  onClose() { this.contentEl.empty(); }
}

const ALL_TYPES: PropType[] = ["text", "number", "decimal", "list", "checkbox", "color", "formula", "image", "iframe"];
function entryDefault(entry: Entry): string { if (entry.kind === "prop") return entry.key ?? ""; if (entry.kind === "computed") return entry.computed === "proficiency" ? "Proficiency" : "Initiative"; if (entry.kind === "saves") return "Saving Throws"; if (entry.kind === "skills") return "Skills"; if (entry.kind === "rolls") return "Rolls"; if (entry.kind === "blank") return "Blank"; return "Contents"; }

class PropertyOptionsModal extends Modal {
  private snap = "";
  constructor(app: App, private plugin: ExtendedPropertiesPlugin, private view: CharacterSidebarView, private section: Section, private entry: Entry, private onChange: () => void) { super(app); }
  private changed() { this.onChange(); }
  private cands() { const keys = new Set<string>([...Object.keys(this.view.raw).filter((k) => k.toLowerCase() !== "position"), ...this.plugin.knownProps()]); return [...keys].map((k) => ({ key: k, onNote: this.view.raw[k] !== undefined })).sort((a, b) => (a.onNote === b.onNote ? a.key.localeCompare(b.key) : a.onNote ? -1 : 1)); }
  onOpen() { this.snap = JSON.stringify(this.entry); this.draw(); }
  private draw() {
    const c = this.contentEl; c.empty(); c.addClass("ep-options"); const e = this.entry; const isProp = e.kind === "prop";
    c.createEl("h3", { text: `“${e.alias || entryDefault(e)}” options` });

    c.createEl("h4", { text: isProp ? "Property" : "Object" });
    if (isProp) new Setting(c).setName("Property").setDesc("Which note property this entry shows").addText((t) => { t.setValue(e.key ?? ""); new PropSuggest(this.app, t.inputEl, () => this.cands(), (k) => { this.view.renameKey(e, k); this.draw(); }, false); t.inputEl.addEventListener("change", () => { const v = t.getValue().trim(); if (v && v !== e.key) { this.view.renameKey(e, v); this.draw(); } }); });
    new Setting(c).setName("Display label").setDesc(`Optional — leave blank to use "${entryDefault(e)}"`).addText((t) => { t.setPlaceholder(entryDefault(e)).setValue(e.alias ?? "").onChange((v) => { e.alias = v.trim() || undefined; this.changed(); }); });

    if (isProp) {
      c.createEl("h4", { text: "Type" });
      const cur = this.view.resolveType(e);
      new Setting(c).setName("Data type").setDesc("Defaults to the Obsidian property type").addDropdown((d) => { for (const t of ALL_TYPES) d.addOption(t, t); d.setValue(cur); d.onChange((v) => { e.dataType = v as PropType; this.changed(); this.draw(); }); });
      if (cur === "number" || cur === "decimal" || cur === "formula") {
        c.createEl("h4", { text: "Number & slider" });
        new Setting(c).setName("Show slider").addToggle((tg) => { tg.setValue(!!e.slider).onChange((v) => { e.slider = v || undefined; this.changed(); }); });
        new Setting(c).setName("Minimum").addText((tx) => { tx.setValue(e.min !== undefined ? String(e.min) : "").onChange((v) => { const n = Number(v); e.min = v.trim() === "" || !Number.isFinite(n) ? undefined : n; this.changed(); }); });
        new Setting(c).setName("Maximum").addText((tx) => { tx.setValue(e.max !== undefined ? String(e.max) : "").onChange((v) => { const n = Number(v); e.max = v.trim() === "" || !Number.isFinite(n) ? undefined : n; this.changed(); }); });
        new Setting(c).setName("Clamp typed values").addToggle((tg) => { tg.setValue(!!e.clamp).onChange((v) => { e.clamp = v || undefined; this.changed(); }); });
        if (cur === "formula") new Setting(c).setName("Slider formula f(x)").setDesc("e.g. sqrt(x), x^2, 2*x+1").addText((tx) => { tx.setValue(e.formula ?? "x").onChange((v) => { if (v.trim() && !compileFormula(v.trim())) return; e.formula = v.trim() || undefined; this.changed(); }); });
        new Setting(c).setName("Roll button").addDropdown((d) => { d.addOption("none", "None"); d.addOption("abilityMod", "Modifier (d20 + mod)"); d.addOption("value", "Value (d20 + value)"); d.setValue(e.roll ?? "none"); d.onChange((v) => { e.roll = v === "none" ? undefined : (v as RollKind); e.showMod = v === "none" ? undefined : true; this.changed(); this.draw(); }); });
        const srcSet = new Setting(c).setName("Roll source").setDesc("Property whose value the roll uses"); srcSet.addDropdown((d) => { d.addOption("", "(this property)"); for (const cand of this.cands()) d.addOption(cand.key, cand.key); d.setValue(e.rollSource || ""); d.setDisabled(!e.roll); d.onChange((v) => { e.rollSource = v || undefined; this.changed(); }); }); if (!e.roll) srcSet.settingEl.addClass("ep-disabled");
        const ovSet = new Setting(c).setName("Roll override").setDesc("Fixed modifier/value; blank derives from source"); ovSet.addText((t) => { t.setDisabled(!e.roll); t.setValue(e.rollOverride !== undefined ? String(e.rollOverride) : "").onChange((v) => { const n = Number(v); e.rollOverride = v.trim() === "" || !Number.isFinite(n) ? undefined : n; this.changed(); }); }); if (!e.roll) ovSet.settingEl.addClass("ep-disabled");
      }
      if (cur === "image") { c.createEl("h4", { text: "Image" }); new Setting(c).setName("Max height").addDropdown((d) => { d.addOption("unlimited", "Unlimited"); d.addOption("s", "Small"); d.addOption("m", "Medium"); d.addOption("l", "Large"); d.setValue(e.size || "unlimited"); d.onChange((v) => { e.size = v as SectionSize; this.changed(); }); }); }
      if (cur === "iframe") { c.createEl("h4", { text: "Embed" }); new Setting(c).setName("Height (px)").addText((tx) => { tx.setValue(String(e.iframeHeight ?? 200)).onChange((v) => { const n = Number(v); e.iframeHeight = Number.isFinite(n) && n > 0 ? n : undefined; this.changed(); }); }); new Setting(c).setName("Scale").addSlider((sl) => { sl.setLimits(0.25, 2, 0.05).setValue(e.iframeScale ?? 0.25).setDynamicTooltip().onChange((v) => { e.iframeScale = v; this.changed(); }); }); }
    }

    c.createEl("h4", { text: "Appearance" });
    addIconSetting(this.app, c, "Icon", () => e.icon, (v) => { e.icon = v; this.changed(); });
    addColorSetting(this.app, this.plugin, c, "Icon color", "", () => e.iconColor, (v) => { e.iconColor = v; this.changed(); });
    new Setting(c).setName("Hide label").setDesc("Hide the label outside edit mode").addToggle((tg) => { tg.setValue(!!e.hideLabel).onChange((v) => { e.hideLabel = v || undefined; this.changed(); }); });
    new Setting(c).setName("Hide if empty").setDesc("If this property has no value, hide it entirely outside edit mode").addToggle((tg) => { tg.setValue(e.hideIfEmpty !== false).onChange((v) => { e.hideIfEmpty = v ? undefined : false; this.changed(); }); });
    new Setting(c).setName("Label size").setDesc("0 = theme default").addSlider((sl) => { sl.setLimits(0, 40, 1).setValue(e.labelSize ?? 0).setDynamicTooltip().onChange((v) => { e.labelSize = v || undefined; this.changed(); }); });
    new Setting(c).setName("Value size").setDesc("0 = theme default").addSlider((sl) => { sl.setLimits(0, 40, 1).setValue(e.valueSize ?? 0).setDynamicTooltip().onChange((v) => { e.valueSize = v || undefined; this.changed(); }); });
    addColorSetting(this.app, this.plugin, c, "Label color", "", () => e.labelColor, (v) => { e.labelColor = v; this.changed(); });
    addColorSetting(this.app, this.plugin, c, "Value color", "", () => e.valueColor, (v) => { e.valueColor = v; this.changed(); });

    if (isProp) { c.createEl("h4", { text: "Obsidian" }); new Setting(c).setName("Show in Obsidian properties").setDesc("Off = hidden from the properties panel").addToggle((tg) => { tg.setValue(!!e.showInObsidian).onChange((v) => { e.showInObsidian = v || undefined; this.changed(); }); }); }

    c.createEl("h4", { text: "Placement" });
    new Setting(c).addButton((b) => b.setButtonText("Remove from sidebar").setWarning().onClick(() => { this.view.removeEntry(this.section, e); this.close(); }));
    new Setting(c).addButton((b) => b.setButtonText("Done").setCta().onClick(() => this.close()));
  }
  onClose() { this.contentEl.empty(); if (JSON.stringify(this.entry) !== this.snap) new ConfirmChangesModal(this.app, () => {}, () => { restoreObj(this.entry, this.snap); this.onChange(); }).open(); }
}

class SectionFormatModal extends Modal {
  private snap = "";
  constructor(app: App, private plugin: ExtendedPropertiesPlugin, private section: Section, private onChange: () => void) { super(app); }
  onOpen() { this.snap = JSON.stringify(this.section); this.draw(); }
  private draw() {
    const c = this.contentEl; c.empty(); const s = this.section; c.addClass("ep-options"); c.createEl("h3", { text: `Format “${s.title}”` });
    c.createEl("h4", { text: "Section" });
    new Setting(c).setName("Name").setDesc('Optional — blank shows "Section"').addText((t) => { t.setPlaceholder("Section").setValue(s.title).onChange((v) => { s.title = v.trim() || "Section"; this.onChange(); }); });
    addIconSetting(this.app, c, "Icon", () => s.icon, (v) => { s.icon = v; this.onChange(); });
    addColorSetting(this.app, this.plugin, c, "Icon color", "", () => s.iconColor, (v) => { s.iconColor = v; this.onChange(); });
    new Setting(c).setName("Hide label").addToggle((tg) => { tg.setValue(!!s.hideLabel).onChange((v) => { s.hideLabel = v || undefined; this.onChange(); }); });
    new Setting(c).setName("Collapsible").addToggle((tg) => { tg.setValue(s.collapsible !== false).onChange((v) => { s.collapsible = v; if (!v) s.collapsed = false; this.onChange(); }); });
    new Setting(c).setName("Horizontal dividers").addToggle((tg) => { tg.setValue(!!s.dividers).onChange((v) => { s.dividers = v || undefined; this.onChange(); }); });
    new Setting(c).setName("Vertical dividers").addToggle((tg) => { tg.setValue(!!s.vdividers).onChange((v) => { s.vdividers = v || undefined; this.onChange(); }); });
    new Setting(c).setName("Hide if empty").setDesc("Hide the whole section when it has no visible properties (outside edit mode)").addToggle((tg) => { tg.setValue(s.hideIfEmpty !== false).onChange((v) => { s.hideIfEmpty = v ? undefined : false; this.onChange(); }); });

    c.createEl("h4", { text: "Layout" });
    const mode: LayoutMode = s.layoutMode ?? (s.columns > 1 ? "columns" : "list");
    new Setting(c).setName("Layout").setDesc("List = one column; Columns = vertical, independent columns; Grid = fixed 2D cells").addDropdown((d) => { d.addOption("list", "List"); d.addOption("columns", "Columns"); d.addOption("grid", "Grid"); d.setValue(mode); d.onChange((v) => { s.layoutMode = v as LayoutMode; this.onChange(); this.draw(); }); });
    const colSet = new Setting(c).setName("Columns"); colSet.addText((t) => { t.setDisabled(mode === "list"); t.setValue(String(s.columns || 2)).onChange((v) => { const n = parseInt(v); if (Number.isFinite(n) && n > 0) { s.columns = n; this.onChange(); } }); }); if (mode === "list") colSet.settingEl.addClass("ep-disabled");
    const rowSet = new Setting(c).setName("Rows").setDesc("Grid only"); rowSet.addText((t) => { t.setDisabled(mode !== "grid"); t.setValue(String(s.rows || 0)).onChange((v) => { const n = parseInt(v); s.rows = Number.isFinite(n) && n > 0 ? n : undefined; this.onChange(); }); }); if (mode !== "grid") rowSet.settingEl.addClass("ep-disabled");
    new Setting(c).setName("Transparent").addToggle((tg) => { tg.setValue(!!s.transparent).onChange((v) => { s.transparent = v || undefined; this.onChange(); }); });
    new Setting(c).setName("Sticky").addToggle((tg) => { tg.setValue(!!s.sticky).onChange((v) => { s.sticky = v || undefined; this.onChange(); }); });
    new Setting(c).setName("Height").setDesc("Scrolls within the section if limited").addDropdown((d) => { d.addOption("unlimited", "Unlimited"); d.addOption("s", "Small (~4)"); d.addOption("m", "Medium (~8)"); d.addOption("l", "Large (~12)"); d.setValue(s.size || "unlimited"); d.onChange((v) => { s.size = v as SectionSize; this.onChange(); }); });

    c.createEl("h4", { text: "Colors" });
    addColorSetting(this.app, this.plugin, c, "Accent color", "Title & highlights", () => s.accent, (v) => { s.accent = v; this.onChange(); });
    addColorSetting(this.app, this.plugin, c, "Background color", "", () => s.bg, (v) => { s.bg = v; this.onChange(); });
    addColorSetting(this.app, this.plugin, c, "Controls color", "Buttons & list chips", () => s.controlColor, (v) => { s.controlColor = v; this.onChange(); });

    c.createEl("h4", { text: "Title" });
    new Setting(c).setName("Title size").setDesc("0 = theme default").addSlider((sl) => { sl.setLimits(0, 48, 1).setValue(s.titleSize ?? 0).setDynamicTooltip().onChange((v) => { s.titleSize = v || undefined; this.onChange(); }); });
    new Setting(c).addButton((b) => b.setButtonText("Done").setCta().onClick(() => this.close()));
  }
  onClose() { this.contentEl.empty(); if (JSON.stringify(this.section) !== this.snap) new ConfirmChangesModal(this.app, () => {}, () => { restoreObj(this.section, this.snap); this.onChange(); }).open(); }
}

class EPSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: ExtendedPropertiesPlugin) { super(app, plugin); }
  display() {
    const c = this.containerEl; c.empty();
    c.createEl("p", { text: "Open a note whose Type matches one below, then click Edit (or right-click anything) to arrange it. Drag handles, use ⋯ / right-click for options (Configure for the full panel), click labels to rename, add properties at each section's bottom." });
    c.createEl("h3", { text: "Types" });
    c.createEl("p", { cls: "setting-item-description", text: "Each Type has its own layout; a note's Type property selects it." });
    for (const t of this.plugin.settings.types) new Setting(c).setName(t).addButton((b) => b.setButtonText("Reset layout").onClick(() => new ConfirmModal(this.app, `Reset the "${t}" layout to defaults?`, () => this.plugin.resetLayout(t.toLowerCase())).open())).addButton((b) => b.setButtonText("Delete").setWarning().setDisabled(this.plugin.settings.types.length <= 1).onClick(() => { this.plugin.settings.types = this.plugin.settings.types.filter((x) => x !== t); delete this.plugin.settings.layouts[t.toLowerCase()]; this.plugin.saveSettings(); this.plugin.refreshViews(); this.display(); }));
    new Setting(c).setName("Add a type").addButton((b) => b.setButtonText("+ Type").setCta().onClick(() => new TextPromptModal(this.app, "New type name", "", (v) => { const name = v.trim(); if (!name) return; if (this.plugin.settings.types.some((x) => x.toLowerCase() === name.toLowerCase())) { new Notice("That type already exists."); return; } this.plugin.settings.types.push(name); this.plugin.ensureLayout(name.toLowerCase()); this.plugin.saveSettings(); this.plugin.refreshViews(); this.display(); }).open()));

    const d = this.plugin.settings.defaults; const save = () => { this.plugin.saveSettings(); this.plugin.refreshViews(); };
    c.createEl("h3", { text: "Defaults" });
    new Setting(c).setName("Default data type").setDesc("For new properties with no Obsidian type").addDropdown((dd) => { for (const t of ALL_TYPES) dd.addOption(t, t); dd.setValue(d.dataType); dd.onChange((v) => { d.dataType = v as PropType; save(); }); });
    new Setting(c).setName("Default color space").addDropdown((dd) => { for (const sp of COLOR_SPACES) dd.addOption(sp, sp); dd.setValue(d.colorSpace); dd.onChange((v) => { d.colorSpace = v as ColorSpace; save(); }); });
    c.createEl("h3", { text: "New section defaults" });
    new Setting(c).setName("Columns").addDropdown((dd) => { dd.addOption("1", "1"); dd.addOption("2", "2"); dd.setValue(String(d.sectionColumns)); dd.onChange((v) => { d.sectionColumns = Number(v); save(); }); });
    new Setting(c).setName("Transparent").addToggle((t) => { t.setValue(d.sectionTransparent).onChange((v) => { d.sectionTransparent = v; save(); }); });
    new Setting(c).setName("Sticky").addToggle((t) => { t.setValue(d.sectionSticky).onChange((v) => { d.sectionSticky = v; save(); }); });
    new Setting(c).setName("Collapsible").addToggle((t) => { t.setValue(d.sectionCollapsible).onChange((v) => { d.sectionCollapsible = v; save(); }); });
    new Setting(c).setName("Dividers between properties").addToggle((t) => { t.setValue(d.sectionDividers).onChange((v) => { d.sectionDividers = v; save(); }); });
    new Setting(c).setName("Height").addDropdown((dd) => { dd.addOption("unlimited", "Unlimited"); dd.addOption("s", "Small"); dd.addOption("m", "Medium"); dd.addOption("l", "Large"); dd.setValue(d.sectionSize); dd.onChange((v) => { d.sectionSize = v as SectionSize; save(); }); });
    c.createEl("h3", { text: "Typography" });
    c.createEl("p", { cls: "setting-item-description", text: "Sizes in px; 0 uses the theme default." });
    new Setting(c).setName("Font family").addText((t) => { t.setPlaceholder("theme default").setValue(d.fontFamily).onChange((v) => { d.fontFamily = v.trim(); save(); }); });
    const sizeRow = (name: string, get: () => number, set: (n: number) => void) => new Setting(c).setName(name).addSlider((sl) => { sl.setLimits(0, 32, 1).setValue(get()).setDynamicTooltip().onChange((v) => { set(v); save(); }); });
    sizeRow("Base size", () => d.baseSize, (n) => (d.baseSize = n));
    sizeRow("Label size", () => d.labelSize, (n) => (d.labelSize = n));
    sizeRow("Value size", () => d.valueSize, (n) => (d.valueSize = n));
    sizeRow("Section title size", () => d.titleSize, (n) => (d.titleSize = n));
    sizeRow("List item size", () => d.listSize, (n) => (d.listSize = n));
    c.createEl("h3", { text: "Obsidian" });
    new Setting(c).setName("Hide sidebar properties from Obsidian").setDesc("Override per property in its options.").addToggle((t) => { t.setValue(this.plugin.settings.hideShown).onChange((v) => { this.plugin.settings.hideShown = v; save(); }); });
    new Setting(c).setName("Right-click hide in Obsidian properties").setDesc("Adds a hide toggle to the right-click menu in Obsidian\u2019s properties panel (replaces the default menu for that click).").addToggle((t) => { t.setValue(this.plugin.settings.propMenu).onChange((v) => { this.plugin.settings.propMenu = v; save(); }); });
    c.createEl("h3", { text: "Always-hidden properties" });
    c.createEl("p", { cls: "setting-item-description", text: "Hidden from Obsidian's properties panel everywhere, whether or not they're in the sidebar." });
    for (const k of this.plugin.settings.manualHide) new Setting(c).setName(k).addButton((b) => b.setButtonText("Unhide").onClick(() => { this.plugin.settings.manualHide = this.plugin.settings.manualHide.filter((x) => x !== k); save(); this.display(); }));
    new Setting(c).setName("Hide a property").addButton((b) => b.setButtonText("+ Hide property").onClick(() => new TextPromptModal(this.app, "Property name to hide", "", (v) => { const k = v.trim(); if (!k) return; if (!this.plugin.settings.manualHide.includes(k)) this.plugin.settings.manualHide.push(k); save(); this.display(); }, () => this.plugin.knownProps()).open()));
  }
}

function addIconSetting(app: App, container: HTMLElement, name: string, get: () => string | undefined, set: (v: string | undefined) => void) {
  const setting = new Setting(container).setName(name).setDesc("Optional icon shown left of the label");
  const prev = setting.controlEl.createSpan({ cls: "ep-icon-prev" }); const upd = () => { prev.empty(); const ic = get(); if (ic) setIcon(prev, ic); else prev.setText("—"); }; upd();
  setting.addButton((b) => b.setButtonText("Choose").onClick(() => new IconPickerModal(app, get() || "", (v) => { set(v || undefined); upd(); }).open()));
  setting.addButton((b) => b.setButtonText("Clear").onClick(() => { set(undefined); upd(); }));
}
class IconPickerModal extends Modal {
  constructor(app: App, private current: string, private onPick: (id: string) => void) { super(app); }
  onOpen() {
    const c = this.contentEl; c.addClass("ep-iconpick"); c.createEl("h3", { text: "Choose an icon" });
    const search = c.createEl("input"); search.type = "text"; search.placeholder = "Search icons…"; search.addClass("ep-edit-input"); search.style.width = "100%";
    const grid = c.createDiv({ cls: "ep-iconpick-grid" }); let all: string[] = []; try { all = getIconIds(); } catch { all = []; }
    const draw = (q: string) => { grid.empty(); const ql = q.trim().toLowerCase(); const items = (ql ? all.filter((i) => i.toLowerCase().includes(ql)) : all).slice(0, 500); for (const id of items) { const cell = grid.createDiv({ cls: "ep-iconpick-item" }); if (id === this.current) cell.addClass("is-active"); setIcon(cell, id); cell.setAttr("title", id); cell.onclick = () => { this.onPick(id); this.close(); }; } if (items.length === 0) grid.createDiv({ cls: "ep-empty-sub", text: "No matching icons." }); };
    search.addEventListener("input", () => draw(search.value)); draw(""); window.setTimeout(() => search.focus(), 0);
  }
  onClose() { this.contentEl.empty(); }
}

function restoreObj(o: any, snap: string) { const v = JSON.parse(snap); for (const k of Object.keys(o)) delete o[k]; Object.assign(o, v); }
class ConfirmChangesModal extends Modal {
  constructor(app: App, private onKeep: () => void, private onUndo: () => void) { super(app); }
  onOpen() { const c = this.contentEl; c.createEl("h3", { text: "Apply changes?" }); c.createEl("p", { text: "Keep the changes you made here, or undo them?" }); new Setting(c).addButton((b) => b.setButtonText("Undo changes").setWarning().onClick(() => { this.onUndo(); this.close(); })).addButton((b) => b.setButtonText("Keep changes").setCta().onClick(() => { this.onKeep(); this.close(); })); }
  onClose() { this.contentEl.empty(); }
}

class ImageViewerModal extends Modal {
  constructor(app: App, private src: string) { super(app); }
  onOpen() {
    const c = this.contentEl; c.addClass("ep-imgview"); (this.modalEl as HTMLElement).addClass("ep-imgview-modal");
    const wrap = c.createDiv({ cls: "ep-imgview-wrap" }); const img = wrap.createEl("img"); img.src = this.src;
    let scale = 1, tx = 0, ty = 0, dragging = false, lx = 0, ly = 0;
    const apply = () => { img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; };
    wrap.addEventListener("wheel", (e: WheelEvent) => { e.preventDefault(); const d = e.deltaY < 0 ? 1.1 : 1 / 1.1; scale = clampN(scale * d, 0.2, 12); apply(); });
    wrap.addEventListener("pointerdown", (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener("pointermove", (e: PointerEvent) => { if (!dragging) return; tx += e.clientX - lx; ty += e.clientY - ly; lx = e.clientX; ly = e.clientY; apply(); });
    wrap.addEventListener("pointerup", () => (dragging = false));
    wrap.addEventListener("dblclick", () => { scale = 1; tx = 0; ty = 0; apply(); });
    c.createEl("div", { cls: "ep-imgview-hint", text: "Scroll to zoom · drag to pan · double-click to reset" });
    apply();
  }
  onClose() { this.contentEl.empty(); }
}
