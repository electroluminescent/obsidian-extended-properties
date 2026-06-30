/**
 * Inline rendering of rolls and properties in note bodies.
 *
 * Shared builders used by both the reading-mode post-processor and the Live
 * Preview editor extension (`live-preview.ts`):
 *   `roll: 2d6+DEX`   → a clickable roll chip (mode via `roll(adv):`/`roll(dis):`)
 *   `prop: Strength`  → the note's live, click-to-edit property value
 * plus an `ep-sheet` code block that renders a read-only statblock.
 *
 * Everything is a thin adapter over existing pieces — {@link NoteFacade} for
 * values, the {@link RollService}/dice engine for rolls, the influence engine
 * for derived values — and resolves against the processor's `sourcePath`, not
 * the active view, so embeds and popovers attribute correctly. Subscriptions
 * live on {@link MarkdownRenderChild}s, so they unload with their block.
 */

import { App, MarkdownPostProcessorContext, MarkdownRenderChild, Menu, Notice, setIcon, TFile } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { Entry, EPSettings, Layout } from "../../core/model";
import { ext } from "../../core/model";
import type { Registries } from "../../core/registry";
import type { NoteModel, NoteFacade } from "../../core/note-model";
import type { PropertyIndex } from "../../core/property-index";
import type { HideService } from "../../core/hide-service";
import type { HistoryService } from "../rolling/history";
import {
  InfluenceEnv, keyForShortForm, modifierBaseFor, modifierInfo, modifierTotal,
} from "../../core/influences";
import { makeNoteAwareResolver, makeVaultAccess, parseNoteRef } from "../../core/note-ref";
import { makeValsEl } from "./inline-view";
import { guardScrollTaps, longPressContextMenu } from "../../ui/components/long-press";
import { DiceNode, parseRoll, RollAst, serializeRoll } from "../../utils/dice-expr";
import { parseDiceOrDefault } from "../../utils/dice";
import { fmtMod, fmtNum, getList, getNum } from "../../utils/misc";
import { diceIconId } from "../../ui/render/dice-icons";
import { openNumberInput, openTextInput } from "../../ui/components/inline-edit";
import { renderLinkedText } from "../../ui/components/links";
import { renderBars, renderProgress, renderRadar, renderSparkline } from "../../ui/render/charts";
import { openRollMenu } from "../rolling/dice-ui";
import type { RollMode, RollService } from "../rolling/roll-service";

/** Everything the inline renderers need from the plugin. */
export interface InlineCtx {
  app: App;
  i18n: I18n;
  settings: EPSettings;
  registries: Registries;
  facade: NoteFacade;
  /** Plugin-level roll service (works without a sidebar view). */
  roll: RollService;
  /** Vault-wide property queries (value-type rendering for `vals:`). */
  props: PropertyIndex;
  /** Obsidian properties-panel hide service (sidebar value-type contract). */
  hide: HideService;
  /** Plugin-level roll history (sidebar value-type contract). */
  history: HistoryService;
  /** Persist settings (e.g. after editing an inline `vals:` card's options). */
  save: () => void;
}

const enabled = (ctx: InlineCtx): boolean => ctx.settings.features["inline"] !== false;

// ---------------------------------------------------------------------------
// Inline `roll:` / `prop:` — reading-mode post-processor
// ---------------------------------------------------------------------------

/** Markdown post-processor: replace `roll:`/`prop:` inline code with live UI. */
export function processInline(el: HTMLElement, mdctx: MarkdownPostProcessorContext, ctx: InlineCtx): void {
  if (!enabled(ctx)) return;
  const codes = Array.from(el.querySelectorAll("code")) as HTMLElement[];
  if (!codes.length) return;
  const file = ctx.app.vault.getAbstractFileByPath(mdctx.sourcePath);
  if (!(file instanceof TFile)) return;
  for (const code of codes) {
    if (code.closest("pre")) continue; // skip fenced code blocks
    const m = /^(roll|prop|vals|val|spark|bar|radar|progress)(?:\(([^)]*)\))?:\s*(.+)$/i.exec(
      (code.textContent ?? "").trim()
    );
    if (!m) continue;
    const kind = m[1].toLowerCase();
    const opt = (m[2] ?? "").trim();
    const body = m[3].trim();
    // One malformed token must not break the rest of the note's rendering.
    try {
      if (kind === "roll") {
        code.replaceWith(makeRollChip(ctx, file, body, opt));
      } else if (kind === "spark" || kind === "bar" || kind === "radar" || kind === "progress") {
        const span = createSpan();
        code.replaceWith(span);
        mdctx.addChild(new ChartInline(span, ctx, file, kind, body));
      } else {
        const span = createSpan();
        code.replaceWith(span);
        const child =
          kind === "val"
            ? new ValInline(span, ctx, file, body)
            : kind === "vals"
              ? new ValsInline(span, ctx, file, body)
              : new PropInline(span, ctx, file, body);
        mdctx.addChild(child);
      }
    } catch (e) {
      console.error("Extended Properties: inline render failed", e);
    }
  }
}

// ---------------------------------------------------------------------------
// Shared chip / value builders (reading mode + Live Preview)
// ---------------------------------------------------------------------------

/** Resolve a short form (or a property key) to a property key for `file`. */
export function resolveRefKey(ctx: InlineCtx, file: TFile, name: string): string {
  return keyForShortForm(ctx.settings, name, Object.keys(ctx.facade.raw(file))) ?? name;
}

/** A reference resolver (names, short forms, `Xs` modifiers, `[[note]].x`) for `file`. */
function refResolver(ctx: InlineCtx, file: TFile): (name: string) => number | undefined {
  return makeNoteAwareResolver(ctx.app, ctx.settings, ctx.registries, envFor(ctx, file), file.path);
}

function primarySides(ast: RollAst | null): number {
  if (ast) for (const term of ast.terms) if (term.node.kind === "dice") return term.node.sides;
  return 20;
}

/** A `roll:` with no dice term implies a single d20 (e.g. `roll: DEX + 3`). */
function withDefaultDie(ast: RollAst): RollAst {
  if (ast.terms.some((tm) => tm.node.kind === "dice")) return ast;
  return { terms: [{ neg: false, node: { kind: "dice", count: 1, sides: 20, ops: [] } }, ...ast.terms] };
}

/** Advantage/disadvantage as +1 die dropped low/high on the first dice group. */
function applyMode(ast: RollAst, mode: RollMode): RollAst {
  if (mode === "normal") return ast;
  const terms = ast.terms.map((tm) =>
    tm.node.kind === "dice" ? { neg: tm.neg, node: { ...tm.node, ops: [...tm.node.ops] } } : tm
  );
  const first = terms.find((tm) => tm.node.kind === "dice");
  if (first) {
    const dn = first.node as DiceNode;
    dn.count += 1;
    dn.ops.push(mode === "advantage" ? { t: "dl", n: 1 } : { t: "dh", n: 1 });
  }
  return { terms };
}

/** Roll an inline expression `times` times under `mode`, resolving refs against `file`. */
export function runInlineRoll(ctx: InlineCtx, file: TFile, body: string, mode: RollMode, times: number): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  if (!parseRoll(body)) {
    new Notice(t("inline.rollInvalid"));
    return;
  }
  const tag =
    mode === "advantage"
      ? " " + t("roll.tagAdvantage")
      : mode === "disadvantage"
        ? " " + t("roll.tagDisadvantage")
        : "";
  const n = Math.max(1, Math.min(20, times || 1));
  const resolve = refResolver(ctx, file);
  for (let i = 0; i < n; i++) {
    ctx.roll.rollAst(n > 1 ? `${body} #${i + 1}` : body, applyMode(withDefaultDie(parseRoll(body)!), mode), {
      tag,
      mode,
      stay: n > 1,
      resolve,
    });
  }
}

/**
 * A clickable roll chip: left-click rolls (mode from the `roll(adv|dis):`
 * suffix), right-click opens the standard roll menu — with an extra "Edit
 * source" action when `onEdit` is given (Live Preview reveals the raw text).
 */
export function makeRollChip(ctx: InlineCtx, file: TFile, body: string, opt: string, onEdit?: () => void): HTMLElement {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const parsed = parseRoll(body);
  const ast = parsed ? withDefaultDie(parsed) : null;
  const resolve = refResolver(ctx, file);
  const chip = createSpan({ cls: "ep-inline-roll" });
  const ic = chip.createSpan({ cls: "ep-inline-roll-ico" });
  setIcon(ic, diceIconId(primarySides(ast)));
  // The label shows short forms resolved to their current values; the tooltip
  // keeps the symbolic formula (e.g. label "2d6 + 3", title "2d6+INT").
  chip.createSpan({
    cls: "ep-inline-roll-lab",
    text: ast
      ? serializeRoll(ast, (name) => {
          const v = resolve(name);
          return v === undefined ? name : String(v);
        })
      : body,
  });
  const mode: RollMode = /^adv/i.test(opt) ? "advantage" : /^dis/i.test(opt) ? "disadvantage" : "normal";
  if (!ast) chip.addClass("ep-expr-error");
  chip.setAttr("title", ast ? t("inline.rollHint", { expr: body }) : t("inline.rollInvalid"));
  chip.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    runInlineRoll(ctx, file, body, mode, 1);
  };
  chip.oncontextmenu = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openRollMenu(ev, ctx.i18n, mode, (mo, ti) => runInlineRoll(ctx, file, body, mo, ti), onEdit ? { onEdit } : undefined);
  };
  longPressContextMenu(chip); // touch parity for the roll menu
  guardScrollTaps(chip); // don't roll when a scroll ends on the chip
  return chip;
}

/** A live, click-to-edit property value span (updates itself on commit). */
export function renderPropValue(ctx: InlineCtx, file: TFile, key: string): HTMLElement {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const raw = ctx.facade.get(file, key);
  const text =
    raw === undefined || raw === null || raw === "" ? t("inline.empty") : Array.isArray(raw) ? raw.join(", ") : String(raw);
  const val = createSpan({ cls: "ep-inline-val ep-inline-editable", text });
  val.setAttr("title", t("inline.propHint", { key }));
  val.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const isNum =
      typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw)));
    if (isNum) {
      openNumberInput(
        val,
        Number(raw ?? 0),
        (v) => {
          ctx.facade.set(file, key, v);
          val.setText(fmtNum(v));
        },
        {
          min: -100000,
          max: 100000,
          float: true,
          clamp: false,
          onEmpty: () => {
            ctx.facade.set(file, key, undefined);
            val.setText(t("inline.empty"));
          },
        }
      );
    } else {
      openTextInput(ctx.app, val, key, raw == null ? "" : String(raw), () => [], (v) => {
        ctx.facade.set(file, key, v || undefined);
        val.setText(v || t("inline.empty"));
      });
    }
  };
  return val;
}

/** A live, click-to-edit property value bound to a note's frontmatter (reading mode). */
class PropInline extends MarkdownRenderChild {
  constructor(public root: HTMLElement, private ctx: InlineCtx, private file: TFile, private key: string) {
    super(root);
  }

  onload(): void {
    this.root.addClass("ep-inline-prop");
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }

  private draw(): void {
    this.root.empty();
    this.root.appendChild(renderPropValue(this.ctx, this.file, this.key));
  }
}

/** The layout prop entry for `key` in `file`'s type (for its icon), or null. */
function findInlineEntry(ctx: InlineCtx, file: TFile, key: string): Entry | null {
  const layout = layoutForFile(ctx, file);
  if (!layout) return null;
  const kl = key.toLowerCase();
  for (const s of layout.sections)
    for (const e of s.entries) if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl) return e;
  return null;
}

/**
 * A `val:` element — rendered like a roll chip (with the property's icon in the
 * same slot the dice icon occupies on a roll). It shows a property's value
 * (editable; link values are clickable to navigate, edited via the context
 * menu) — or, when the reference uses the modifier suffix (`INTs`), that
 * property's modifier (read-only). `onEditSource` adds an "Edit source" menu
 * item (Live Preview, to reveal the raw text).
 */
export function makeValEl(ctx: InlineCtx, file: TFile, body: string, onEditSource?: () => void): HTMLElement {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const noteRef = parseNoteRef(body);
  const noteKeys = Object.keys(ctx.facade.raw(file));
  const directKey = noteRef ? null : keyForShortForm(ctx.settings, body, noteKeys);
  const base = directKey || noteRef ? null : modifierBaseFor(ctx.settings, body);
  const baseKey = base ? keyForShortForm(ctx.settings, base, noteKeys) : null;

  const chip = createSpan({ cls: "ep-inline-roll ep-inline-valchip" });
  const iconKey = directKey ?? baseKey;
  const entry = iconKey ? findInlineEntry(ctx, file, iconKey) : null;
  if (entry?.icon) {
    const ic = chip.createSpan({ cls: "ep-inline-roll-ico" });
    setIcon(ic, entry.icon);
    if (entry.iconColor) ic.style.color = entry.iconColor as string;
  }
  // The property's full name, in small text before the value. For a cross-note
  // reference, show "<note>/<property>" — the accessor resolved to that note's
  // full property name where possible.
  let crossName: string | null = null;
  if (noteRef) {
    let prop = noteRef.accessor;
    const lf = ctx.app.metadataCache.getFirstLinkpathDest(noteRef.link, file.path);
    if (lf) prop = keyForShortForm(ctx.settings, noteRef.accessor, Object.keys(ctx.facade.raw(lf))) ?? noteRef.accessor;
    crossName = noteRef.accessor ? `${noteRef.link}/${prop}` : noteRef.link;
  }
  const fullName = directKey ?? baseKey ?? crossName;
  if (fullName) chip.createSpan({ cls: "ep-inline-val-name", text: fullName });
  const lab = chip.createSpan({ cls: "ep-inline-roll-lab" });
  let editValue: (() => void) | null = null;

  if (directKey) {
    const key = directKey;
    const raw = ctx.facade.get(file, key);
    const str =
      raw === undefined || raw === null || raw === "" ? "" : Array.isArray(raw) ? raw.join(", ") : String(raw);
    editValue = () => {
      const isNum = typeof raw === "number" || (str.trim() !== "" && Number.isFinite(Number(str)));
      if (isNum) {
        openNumberInput(lab, Number(raw ?? 0), (v) => { ctx.facade.set(file, key, v); lab.setText(fmtNum(v)); }, {
          min: -100000, max: 100000, float: true, clamp: false,
          onEmpty: () => { ctx.facade.set(file, key, undefined); lab.setText(t("inline.empty")); },
        });
      } else {
        openTextInput(ctx.app, lab, key, str, () => [], (v) => { ctx.facade.set(file, key, v || undefined); lab.setText(v || t("inline.empty")); });
      }
    };
    if (str && /\[\[.+?\]\]|\]\([^)]+\)/.test(str)) {
      renderLinkedText(ctx.app, lab, str, file.path); // clickable link(s)
    } else {
      lab.setText(str || t("inline.empty"));
      lab.addClass("ep-inline-editable");
      lab.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); editValue?.(); };
    }
    chip.setAttr("title", t("inline.propHint", { key }));
  } else {
    // Modifier (`Xs`), cross-note (`[[note]].x`), or unresolved → read-only.
    const v = makeNoteAwareResolver(ctx.app, ctx.settings, ctx.registries, envFor(ctx, file), file.path)(body);
    lab.setText(v === undefined ? t("inline.empty") : base ? fmtMod(v) : String(v));
    if (v === undefined) chip.addClass("ep-expr-error");
    chip.setAttr("title", body);
  }

  if (editValue || onEditSource) {
    chip.oncontextmenu = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const menu = new Menu();
      if (editValue && directKey)
        menu.addItem((i) => i.setTitle(t("inline.editValue", { prop: directKey })).setIcon("pencil").onClick(editValue!));
      if (onEditSource) menu.addItem((i) => i.setTitle(t("inline.editSource")).setIcon("code").onClick(onEditSource));
      menu.showAtMouseEvent(ev);
    };
    longPressContextMenu(chip); // touch parity
  }
  guardScrollTaps(chip); // don't edit/navigate when a scroll ends on the chip
  return chip;
}

/** Reading-mode `val:` (refreshes on metadata change). */
class ValInline extends MarkdownRenderChild {
  constructor(public root: HTMLElement, private ctx: InlineCtx, private file: TFile, private body: string) {
    super(root);
  }

  onload(): void {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }

  private draw(): void {
    this.root.empty();
    this.root.appendChild(makeValEl(this.ctx, this.file, this.body));
  }
}

/** Reading-mode `vals:` — the sidebar value-type rendering (refreshes on change). */
class ValsInline extends MarkdownRenderChild {
  constructor(public root: HTMLElement, private ctx: InlineCtx, private file: TFile, private body: string) {
    super(root);
  }

  onload(): void {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }

  private draw(): void {
    this.root.empty();
    this.root.appendChild(makeValsEl(this.ctx, this.file, this.body));
  }
}

// ---------------------------------------------------------------------------
// Inline charts (G2): `spark:` / `bar:` / `radar:` / `progress:` + `ep-chart`
// ---------------------------------------------------------------------------

type ChartKind = "spark" | "bar" | "radar" | "progress";

interface ChartSpec {
  kind: ChartKind;
  /** Property references for spark / bar / radar. */
  refs: string[];
  /** Progress numerator reference. */
  value?: string;
  /** Max as a literal number or a property reference. */
  max?: string;
  /** Block title (`ep-chart` only). */
  title?: string;
}

/** A max that may be a literal number or a property reference resolved on the note. */
function resolveMax(max: string | undefined, resolve: (n: string) => number | undefined): number | undefined {
  if (max === undefined || max === "") return undefined;
  const n = Number(max);
  return Number.isFinite(n) ? n : resolve(max);
}

/** Render a chart spec into `parent` (an inline chip or a block container). */
function renderChartSpec(parent: HTMLElement, ctx: InlineCtx, file: TFile, spec: ChartSpec): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const resolve = refResolver(ctx, file);
  const err = (): void => void parent.createSpan({ cls: "ep-chart-err", text: t("inline.chartInvalid") });

  if (spec.kind === "progress") {
    const ref = spec.value ?? spec.refs[0] ?? "";
    const value = resolve(ref);
    const max = resolveMax(spec.max, resolve);
    if (value === undefined || max === undefined || max <= 0) return err();
    renderProgress(parent, value, max, { label: `${ref} ${fmtNum(value)} / ${fmtNum(max)}` });
    return;
  }

  const valid = spec.refs.map((r) => ({ name: r, v: resolve(r) })).filter((p) => p.v !== undefined) as {
    name: string;
    v: number;
  }[];
  if (valid.length < (spec.kind === "radar" ? 3 : 2)) return err();
  const values = valid.map((p) => p.v);
  const labels = valid.map((p) => p.name);
  const aria = t("inline.chartAria", {
    kind: spec.kind,
    data: labels.map((l, i) => `${l} ${fmtNum(values[i])}`).join(", "),
  });
  if (spec.kind === "spark") renderSparkline(parent, values, { aria });
  else if (spec.kind === "bar") renderBars(parent, values, { aria });
  else renderRadar(parent, values, labels, { aria, max: resolveMax(spec.max, resolve) });
}

/** Build an inline chart chip from a token kind + body. */
export function makeChartEl(ctx: InlineCtx, file: TFile, kind: string, body: string): HTMLElement {
  const chip = createSpan({ cls: "ep-inline-chart" });
  try {
    let spec: ChartSpec;
    if (kind === "progress") {
      const [v, m] = body.split("/").map((s) => s.trim());
      spec = { kind: "progress", refs: [], value: v, max: m };
    } else {
      spec = { kind: kind as ChartKind, refs: body.split(",").map((s) => s.trim()).filter(Boolean) };
    }
    renderChartSpec(chip, ctx, file, spec);
  } catch (e) {
    console.error("Extended Properties: chart render failed", e);
    chip.empty();
    chip.addClass("ep-chart-err");
    chip.setText(ctx.i18n.t("inline.chartInvalid"));
  }
  return chip;
}

/** Reading-mode inline chart (redraws when the note's values change). */
class ChartInline extends MarkdownRenderChild {
  constructor(public root: HTMLElement, private ctx: InlineCtx, private file: TFile, private kind: string, private body: string) {
    super(root);
  }
  onload(): void {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  private draw(): void {
    this.root.empty();
    this.root.appendChild(makeChartEl(this.ctx, this.file, this.kind, this.body));
  }
}

const CHART_KINDS = new Set(["spark", "bar", "radar", "progress"]);

/** Parse an `ep-chart` block body into a spec. */
function parseChartConfig(src: string): ChartSpec {
  const spec: ChartSpec = { kind: "bar", refs: [] };
  for (const line of src.split("\n")) {
    const m = /^(\w+)\s*:\s*(.+)$/.exec(line.trim());
    if (!m) continue;
    const k = m[1].toLowerCase();
    const v = m[2].trim();
    if (k === "type") spec.kind = (CHART_KINDS.has(v.toLowerCase()) ? v.toLowerCase() : "bar") as ChartKind;
    else if (k === "props" || k === "properties") spec.refs = v.split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "value") spec.value = v;
    else if (k === "max" || k === "of") spec.max = v;
    else if (k === "title") spec.title = v;
  }
  return spec;
}

/** Code-block processor for ```ep-chart. */
export function renderChart(src: string, el: HTMLElement, mdctx: MarkdownPostProcessorContext, ctx: InlineCtx): void {
  const file = ctx.app.vault.getAbstractFileByPath(mdctx.sourcePath);
  if (!(file instanceof TFile)) return;
  mdctx.addChild(new ChartBlock(el, ctx, file, src));
}

class ChartBlock extends MarkdownRenderChild {
  constructor(public root: HTMLElement, private ctx: InlineCtx, private file: TFile, private src: string) {
    super(root);
  }
  onload(): void {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  private draw(): void {
    this.root.empty();
    this.root.addClass("ep-chart-block");
    if (!enabled(this.ctx)) return;
    const spec = parseChartConfig(this.src);
    if (spec.title) this.root.createDiv({ cls: "ep-chart-title", text: spec.title });
    renderChartSpec(this.root, this.ctx, this.file, spec);
  }
}

// ---------------------------------------------------------------------------
// `ep-sheet` code block — read-only statblock projection
// ---------------------------------------------------------------------------

/** Build a read-only influence environment for `file` (optionally scoped to `layout`). */
function buildEnv(ctx: InlineCtx, file: TFile, layout: Layout | null): InfluenceEnv {
  const raw = ctx.facade.raw(file);
  const note = {
    raw,
    num: (k: string, d: number) => getNum(raw, k, d),
    list: (k: string) => getList(raw, k),
  } as unknown as NoteModel;
  return {
    note,
    registries: ctx.registries,
    settings: ctx.settings,
    layout: layout ?? undefined,
    vault: makeVaultAccess(ctx.props, () => file.path),
  };
}

/** Influence environment for the file's own type layout (or none). */
function envFor(ctx: InlineCtx, file: TFile): InfluenceEnv {
  return buildEnv(ctx, file, layoutForFile(ctx, file));
}

/** Layout for a file's first matching configured type, or null. */
function layoutForFile(ctx: InlineCtx, file: TFile): Layout | null {
  const raw = ctx.facade.raw(file);
  const tk = Object.keys(raw).find((k) => k.toLowerCase() === "type");
  const tv = tk !== undefined ? raw[tk] : undefined;
  const types = Array.isArray(tv) ? tv.map(String) : tv === undefined || tv === null ? [] : [String(tv)];
  const match = ctx.settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
  if (!match) return null;
  const layout = ctx.settings.layouts[match.toLowerCase()];
  return layout && Array.isArray(layout.sections) ? layout : null;
}

/** Code-block processor for ```ep-sheet. */
export function renderSheet(src: string, el: HTMLElement, mdctx: MarkdownPostProcessorContext, ctx: InlineCtx): void {
  const file = ctx.app.vault.getAbstractFileByPath(mdctx.sourcePath);
  if (!(file instanceof TFile)) return;
  mdctx.addChild(new SheetInline(el, ctx, file, src));
}

class SheetInline extends MarkdownRenderChild {
  constructor(public root: HTMLElement, private ctx: InlineCtx, private file: TFile, private src: string) {
    super(root);
  }

  onload(): void {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }

  private draw(): void {
    const t = this.ctx.i18n.t.bind(this.ctx.i18n);
    this.root.empty();
    this.root.addClass("ep-inline-sheet");
    if (!enabled(this.ctx)) return;
    const layout = layoutForFile(this.ctx, this.file);
    if (!layout) {
      this.root.createDiv({ cls: "ep-inline-note", text: t("inline.sheetNoType") });
      return;
    }
    const wanted = this.src
      .split("\n")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const env = buildEnv(this.ctx, this.file, layout);
    let any = false;
    for (const section of layout.sections) {
      if (wanted.length && !wanted.includes((section.title || "").toLowerCase())) continue;
      const entries = section.entries.filter((e) => e.kind === "prop" && e.key);
      if (!entries.length) continue;
      any = true;
      const sec = this.root.createDiv({ cls: "ep-inline-sheet-sec" });
      if (section.title) sec.createDiv({ cls: "ep-inline-sheet-title", text: section.title });
      for (const entry of entries) this.row(sec, env, entry);
    }
    if (!any) this.root.createDiv({ cls: "ep-inline-note", text: t("inline.sheetEmpty") });
  }

  private row(parent: HTMLElement, env: InfluenceEnv, entry: Entry): void {
    const t = this.ctx.i18n.t.bind(this.ctx.i18n);
    const row = parent.createDiv({ cls: "ep-inline-sheet-row" });
    row.createSpan({ cls: "ep-inline-sheet-lab", text: (entry.alias as string) || (entry.key as string) });
    const valEl = row.createSpan({ cls: "ep-inline-sheet-val" });
    if (entry.dataType === "derived") {
      const info = modifierInfo(env, entry);
      if (info.value === undefined) {
        valEl.addClass("ep-expr-error");
        valEl.setText(t("inline.empty"));
        valEl.setAttr("title", t(info.error === "cycle" ? "mods.errCycle" : "mods.errExpr"));
      } else {
        valEl.setText(fmtMod(info.value));
      }
    } else {
      const raw = this.ctx.facade.get(this.file, entry.key as string);
      valEl.setText(
        raw === undefined || raw === null || raw === "" ? t("inline.empty") : Array.isArray(raw) ? raw.join(", ") : String(raw)
      );
    }
    const e = ext<{ roll?: unknown; dice?: string }>(entry);
    if (e.roll) {
      const chip = row.createSpan({ cls: "ep-inline-roll ep-inline-sheet-roll" });
      const spec = parseDiceOrDefault(typeof e.dice === "string" ? e.dice : undefined);
      const ic = chip.createSpan({ cls: "ep-inline-roll-ico" });
      setIcon(ic, diceIconId(spec.sides));
      chip.createSpan({ cls: "ep-inline-roll-lab", text: t("roll.roll") });
      const label = (entry.alias as string) || (entry.key as string) || t("roll.roll");
      chip.setAttr("title", t("inline.rollHint", { expr: label }));
      chip.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.ctx.roll.roll(label, modifierTotal(env, entry), spec, {});
      };
    }
  }
}
