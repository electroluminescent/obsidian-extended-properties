/**
 * Live Preview (CodeMirror 6) rendering of inline `roll:`/`prop:` code.
 *
 * A {@link ViewPlugin} maintains replace-widget decorations over inline-code
 * spans that match the inline syntax, but skips any span the selection touches
 * — so moving the caret just before, into, or just after a chip reveals the
 * raw text for editing, and leaving it re-renders the chip. The roll chip's
 * right-click menu (the standard roll menu) gains an "Edit source" action that
 * drops the caret inside the span to reveal it.
 *
 * Reading mode is handled by the markdown post-processor (`inline-render.ts`);
 * this is the editor-mode counterpart.
 */

import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import { editorInfoField, editorLivePreviewField, Menu, TFile } from "obsidian";
import { InlineCtx, makeChartEl, makeRollChip, makeValEl, renderPropValue } from "./inline-render";
import { makeValsEl } from "./inline-view";

const PREFIX = /^(roll|prop|vals|val|spark|bar|radar|progress)(?:\(([^)]*)\))?:\s*(.+)$/i;

/** Expand an inline-code content range to include its backtick fences. */
function backtickSpan(doc: { sliceString(a: number, b: number): string; length: number }, from: number, to: number) {
  let s = from;
  while (s > 0 && doc.sliceString(s - 1, s) === "`") s--;
  let e = to;
  while (e < doc.length && doc.sliceString(e, e + 1) === "`") e++;
  return { from: s, to: e };
}

class InlineWidget extends WidgetType {
  constructor(
    private ctx: InlineCtx,
    private file: TFile,
    private kind: string,
    private opt: string,
    private body: string
  ) {
    super();
  }

  /**
   * Position is deliberately NOT part of equality. An edit *above* a widget
   * shifts its position but not its content; if `eq` included the position,
   * CM6 would rebuild the whole widget every keystroke and re-attach its DOM —
   * a path that drops the heavier `vals:` card. Comparing content only lets
   * CM6 reuse and reposition the existing DOM, so cards survive edits above.
   */
  eq(o: InlineWidget): boolean {
    return o.kind === this.kind && o.opt === this.opt && o.body === this.body && o.file.path === this.file.path;
  }

  toDOM(view: EditorView): HTMLElement {
    let dom: HTMLElement | null = null;
    // Reveal the raw text by dropping the caret inside the span. The position
    // is read from the live DOM (not stored), so it stays correct after edits.
    const reveal = () => {
      if (!dom) return;
      const pos = view.posAtDOM(dom);
      view.dispatch({ selection: { anchor: pos + 1 } });
      view.focus();
    };
    try {
      if (this.kind === "roll") dom = makeRollChip(this.ctx, this.file, this.body, this.opt, reveal);
      else if (this.kind === "vals") dom = makeValsEl(this.ctx, this.file, this.body, reveal);
      else if (this.kind === "val") dom = makeValEl(this.ctx, this.file, this.body, reveal);
      else if (this.kind === "spark" || this.kind === "bar" || this.kind === "radar" || this.kind === "progress")
        dom = makeChartEl(this.ctx, this.file, this.kind, this.body);
      else {
        const wrap = createSpan({ cls: "ep-inline-prop" });
        wrap.appendChild(renderPropValue(this.ctx, this.file, this.body));
        wrap.oncontextmenu = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const menu = new Menu();
          menu.addItem((i) => i.setTitle(this.ctx.i18n.t("inline.editSource")).setIcon("pencil").onClick(reveal));
          menu.showAtMouseEvent(ev);
        };
        dom = wrap;
      }
      return dom;
    } catch (e) {
      // A throw here would leave an empty replacement widget — the raw text is
      // hidden but no chip appears. Fall back to a clickable raw-text span so
      // the source is always visible and editable.
      console.error("extended-properties: inline widget render failed", e);
      dom = createSpan({ cls: "ep-inline-error", text: `${this.kind}: ${this.body}` });
      dom.onclick = reveal;
      return dom;
    }
  }

  ignoreEvent(): boolean {
    return true; // let the chip handle its own clicks (don't move the caret)
  }
}

function buildDecos(view: EditorView, ctx: InlineCtx): DecorationSet {
  const b = new RangeSetBuilder<Decoration>();
  if (ctx.settings.features["inline"] === false) return b.finish();
  if (!view.state.field(editorLivePreviewField, false)) return b.finish(); // source mode → raw
  const file = view.state.field(editorInfoField, false)?.file ?? ctx.app.workspace.getActiveFile();
  if (!file) return b.finish();
  const sel = view.state.selection;
  const doc = view.state.doc;

  // Collect first, then add in sorted, non-overlapping order. RangeSetBuilder
  // requires that — and backtick-span expansion or multiple visible ranges can
  // otherwise produce an out-of-order add, which throws and blanks every chip.
  const items: { from: number; to: number; deco: Decoration }[] = [];
  for (const { from, to } of view.visibleRanges) {
    // Force the parser up to `to` so an edit elsewhere (e.g. above the chips)
    // can't leave their code spans un-relexed and drop them.
    const tree = ensureSyntaxTree(view.state, to, 50) ?? syntaxTree(view.state);
    tree.iterate({
      from,
      to,
      enter: (node) => {
        const name = node.type.name;
        if (!name.includes("inline-code") || name.includes("formatting")) return;
        const m = PREFIX.exec(doc.sliceString(node.from, node.to).trim());
        if (!m) return;
        const span = backtickSpan(doc, node.from, node.to);
        // While the editor is focused, a selection touching the span (either
        // edge) reveals the raw markdown for editing. When focus leaves the
        // editor, always render the chip — otherwise clicking away would hide
        // the editable text without re-rendering the chip.
        if (view.hasFocus && sel.ranges.some((r) => r.from <= span.to && r.to >= span.from)) return;
        items.push({
          from: span.from,
          to: span.to,
          deco: Decoration.replace({
            widget: new InlineWidget(ctx, file, m[1].toLowerCase(), (m[2] ?? "").trim(), m[3].trim()),
          }),
        });
      },
    });
  }

  items.sort((a, z) => a.from - z.from || a.to - z.to);
  let last = -1;
  for (const it of items) {
    if (it.from < last) continue; // drop overlaps/duplicates to stay strictly sorted
    b.add(it.from, it.to, it.deco);
    last = it.to;
  }
  return b.finish();
}

/** Editor extension that renders inline rolls/properties in Live Preview. */
export function inlineLivePreview(ctx: InlineCtx) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecos(view, ctx);
      }
      update(u: ViewUpdate): void {
        // Remap existing decorations through the edit first, so a widget whose
        // content is unchanged keeps its DOM (CM6 reuses it via `eq`) instead
        // of being dropped while the rebuild runs.
        if (u.docChanged) this.decorations = this.decorations.map(u.changes);
        if (
          u.docChanged ||
          u.viewportChanged ||
          u.selectionSet ||
          u.focusChanged ||
          u.startState.field(editorLivePreviewField, false) !== u.state.field(editorLivePreviewField, false) ||
          // Background parsing finished (after an edit above, the tree under a
          // widget may be momentarily stale): rebuild so a dropped chip/card
          // reappears on its own instead of waiting to be re-touched.
          syntaxTree(u.startState) !== syntaxTree(u.state)
        ) {
          try {
            this.decorations = buildDecos(u.view, ctx);
          } catch (e) {
            // A failed rebuild must not blank every chip/card — keep the
            // already-remapped decorations from this update instead.
            console.error("extended-properties: live-preview rebuild failed", e);
          }
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
}
