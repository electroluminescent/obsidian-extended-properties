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

import { App, MarkdownPostProcessorContext, MarkdownRenderChild, Notice, setIcon, TFile } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { Entry, EPSettings, Layout } from "../../core/model";
import { ext } from "../../core/model";
import type { Registries } from "../../core/registry";
import type { NoteModel, NoteFacade } from "../../core/note-model";
import { InfluenceEnv, keyForShortForm, modifierInfo, modifierTotal } from "../../core/influences";
import { DiceNode, parseRoll, RollAst, serializeRoll } from "../../utils/dice-expr";
import { parseDiceOrDefault } from "../../utils/dice";
import { fmtMod, fmtNum, getList, getNum } from "../../utils/misc";
import { diceIconId } from "../../ui/render/dice-icons";
import { openNumberInput, openTextInput } from "../../ui/components/inline-edit";
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
    const m = /^(roll|prop|val)(?:\(([^)]*)\))?:\s*(.+)$/i.exec((code.textContent ?? "").trim());
    if (!m) continue;
    const kind = m[1].toLowerCase();
    const opt = (m[2] ?? "").trim();
    const body = m[3].trim();
    if (kind === "roll") {
      code.replaceWith(makeRollChip(ctx, file, body, opt));
    } else {
      // `val:` takes a short form (or key); `prop:` takes a key.
      const key = kind === "val" ? resolveRefKey(ctx, file, body) : body;
      const span = createSpan();
      code.replaceWith(span);
      mdctx.addChild(new PropInline(span, ctx, file, key));
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

/** Resolve a property reference (short form or key) to a number against `file`'s frontmatter. */
function refValue(ctx: InlineCtx, file: TFile, name: string): number | undefined {
  const v = ctx.facade.get(file, resolveRefKey(ctx, file, name));
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function primarySides(ast: RollAst | null): number {
  if (ast) for (const term of ast.terms) if (term.node.kind === "dice") return term.node.sides;
  return 20;
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
  for (let i = 0; i < n; i++) {
    ctx.roll.rollAst(n > 1 ? `${body} #${i + 1}` : body, applyMode(parseRoll(body)!, mode), {
      tag,
      mode,
      stay: n > 1,
      resolve: (name) => refValue(ctx, file, name),
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
  const ast = parseRoll(body);
  const chip = createSpan({ cls: "ep-inline-roll" });
  const ic = chip.createSpan({ cls: "ep-inline-roll-ico" });
  setIcon(ic, diceIconId(primarySides(ast)));
  // The label shows short forms resolved to their current values; the tooltip
  // keeps the symbolic formula (e.g. label "2d6 + 3", title "2d6+INT").
  chip.createSpan({
    cls: "ep-inline-roll-lab",
    text: ast
      ? serializeRoll(ast, (name) => {
          const v = refValue(ctx, file, name);
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

// ---------------------------------------------------------------------------
// `ep-sheet` code block — read-only statblock projection
// ---------------------------------------------------------------------------

/** Build a read-only influence environment for `file` against `layout`. */
function buildEnv(ctx: InlineCtx, file: TFile, layout: Layout): InfluenceEnv {
  const raw = ctx.facade.raw(file);
  const note = {
    raw,
    num: (k: string, d: number) => getNum(raw, k, d),
    list: (k: string) => getList(raw, k),
  } as unknown as NoteModel;
  return { note, registries: ctx.registries, settings: ctx.settings, layout };
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
