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
import { syntaxTree } from "@codemirror/language";
import { editorInfoField, editorLivePreviewField, Menu, TFile } from "obsidian";
import { InlineCtx, makeRollChip, makeValEl, renderPropValue } from "./inline-render";

const PREFIX = /^(roll|prop|val)(?:\(([^)]*)\))?:\s*(.+)$/i;

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
    private body: string,
    private from: number
  ) {
    super();
  }

  eq(o: InlineWidget): boolean {
    return (
      o.kind === this.kind &&
      o.opt === this.opt &&
      o.body === this.body &&
      o.from === this.from &&
      o.file.path === this.file.path
    );
  }

  toDOM(view: EditorView): HTMLElement {
    // Reveal the raw text by dropping the caret inside the span.
    const reveal = () => {
      view.dispatch({ selection: { anchor: this.from + 1 } });
      view.focus();
    };
    try {
      if (this.kind === "roll") return makeRollChip(this.ctx, this.file, this.body, this.opt, reveal);
      if (this.kind === "val") return makeValEl(this.ctx, this.file, this.body, reveal);
      const wrap = createSpan({ cls: "ep-inline-prop" });
      wrap.appendChild(renderPropValue(this.ctx, this.file, this.body));
      wrap.oncontextmenu = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const menu = new Menu();
        menu.addItem((i) => i.setTitle(this.ctx.i18n.t("inline.editSource")).setIcon("pencil").onClick(reveal));
        menu.showAtMouseEvent(ev);
      };
      return wrap;
    } catch (e) {
      // A throw here would leave an empty replacement widget — the raw text is
      // hidden but no chip appears. Fall back to a clickable raw-text span so
      // the source is always visible and editable.
      console.error("extended-properties: inline widget render failed", e);
      const fallback = createSpan({ cls: "ep-inline-error", text: `${this.kind}: ${this.body}` });
      fallback.onclick = reveal;
      return fallback;
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
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
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
        b.add(
          span.from,
          span.to,
          Decoration.replace({
            widget: new InlineWidget(ctx, file, m[1].toLowerCase(), (m[2] ?? "").trim(), m[3].trim(), span.from),
          })
        );
      },
    });
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
        if (
          u.docChanged ||
          u.viewportChanged ||
          u.selectionSet ||
          u.focusChanged ||
          u.startState.field(editorLivePreviewField, false) !== u.state.field(editorLivePreviewField, false)
        ) {
          this.decorations = buildDecos(u.view, ctx);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
}
