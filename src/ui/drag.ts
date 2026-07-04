/**
 * Drag & drop for sections and entries (edit mode).
 *
 * Both sections and entries use pointer events (mouse, pen *and* touch -
 * grips set `touch-action: none`). Sections show an insertion line between
 * sections (like the grid cell markers); entries use a floating clone:
 * list/column targets reorder live (FLIP-animated), grid targets highlight
 * a swap cell. All structural changes go through `core/layout-ops`; this
 * controller only translates gestures into those operations.
 */

import type { ViewCtx } from "../core/context";
import type { Entry, Section } from "../core/model";
import * as ops from "../core/layout-ops";

/**
 * FLIP-animate elements with `data-ep-id` across a layout mutation:
 * snapshot positions, run `fn` (which re-renders), then transform from the
 * old position to the new one.
 */
export function flipMove(view: ViewCtx, fn: () => void): void {
  const first = new Map<string, DOMRect>();
  view.containerEl.findAll("[data-ep-id]").forEach((el) => first.set(el.getAttribute("data-ep-id")!, el.getBoundingClientRect()));
  fn();
  requestAnimationFrame(() => {
    view.containerEl.findAll("[data-ep-id]").forEach((el) => {
      const id = el.getAttribute("data-ep-id");
      const f = id ? first.get(id) : undefined;
      if (!f) return;
      const n = el.getBoundingClientRect();
      const dx = f.left - n.left, dy = f.top - n.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const h = el as HTMLElement;
      h.setCssStyles({ transition: "none", transform: `translate(${dx}px, ${dy}px)` });
      requestAnimationFrame(() => {
        h.setCssStyles({ transition: "transform .25s ease", transform: "" });
        const done = () => {
          h.setCssStyles({ transition: "", transform: "" });
          h.removeEventListener("transitionend", done);
        };
        h.addEventListener("transitionend", done);
      });
    });
  });
}

export class DragController {
  constructor(private view: ViewCtx) {}

  // -- sections (pointer drag, touch-friendly) ------------------------------

  attachSection(det: HTMLElement, _grid: HTMLElement, section: Section): void {
    const grip = det.querySelector(".ep-section-title .ep-grip") as HTMLElement | null;
    if (!grip) return;
    grip.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.startSectionDrag(e, det, section);
    });
  }

  private startSectionDrag(ev: PointerEvent, det: HTMLElement, section: Section): void {
    ev.preventDefault();
    ev.stopPropagation();
    const view = this.view;
    det.addClass("ep-drag-placeholder");
    let target: HTMLElement | null = null;
    let after = false;

    const onMove = (e: PointerEvent) => {
      const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const sec = (under?.closest(".ep-section") as HTMLElement | null) ?? null;
      this.clearMarks();
      target = null;
      if (!sec || sec === det) return;
      const r = sec.getBoundingClientRect();
      after = e.clientY - r.top > r.height / 2;
      // Insertion line between sections (mirrors the grid cell markers).
      this.mark(sec, after);
      target = sec;
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      det.removeClass("ep-drag-placeholder");
      const t = target;
      const a = after;
      this.clearMarks();
      if (!t) return;
      const targetId = (t.getAttribute("data-ep-id") || "").slice(2);
      if (!targetId) return;
      flipMove(view, () => {
        if (ops.moveSectionTo(view.layout, section.id, targetId, a)) {
          view.saveLayout();
          view.rerender();
        }
      });
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }

  // -- entries (pointer drag with clone) ------------------------------------

  attachEntry(wrap: HTMLElement, grip: HTMLElement, section: Section, entry: Entry): void {
    grip.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.startEntryDrag(e, wrap, section, entry);
    });
  }

  private startEntryDrag(ev: PointerEvent, wrap: HTMLElement, section: Section, entry: Entry): void {
    ev.preventDefault();
    const view = this.view;
    const rect = wrap.getBoundingClientRect();
    const ox = ev.clientX - rect.left, oy = ev.clientY - rect.top;

    // Floating clone follows the pointer; the original becomes a placeholder.
    const clone = wrap.cloneNode(true) as HTMLElement;
    clone.addClass("ep-drag-clone");
    clone.setCssStyles({
      position: "fixed",
      left: "0",
      top: "0",
      width: rect.width + "px",
      margin: "0",
      pointerEvents: "none",
      zIndex: "9999",
    });
    document.body.appendChild(clone);
    const moveClone = (cx: number, cy: number) => {
      clone.setCssStyles({ transform: `translate(${cx - ox}px, ${cy - oy}px)` });
    };
    moveClone(ev.clientX, ev.clientY);
    wrap.addClass("ep-drag-placeholder");

    let swapEl: HTMLElement | null = null;
    let gridTarget: HTMLElement | null = null;
    const clearSwap = () => {
      if (swapEl) { swapEl.removeClass("ep-swap-target"); swapEl = null; }
      if (gridTarget) { gridTarget.removeClass("ep-swap-target"); gridTarget = null; }
    };

    /** FLIP within a container while live-reordering the placeholder. */
    const flip = (container: HTMLElement, fn: () => void) => {
      const els = Array.from(container.querySelectorAll(".ep-entry")) as HTMLElement[];
      const first = new Map<HTMLElement, DOMRect>();
      els.forEach((el) => first.set(el, el.getBoundingClientRect()));
      fn();
      els.forEach((el) => {
        const f = first.get(el);
        if (!f) return;
        const n = el.getBoundingClientRect();
        const dx = f.left - n.left, dy = f.top - n.top;
        if (!dx && !dy) return;
        el.setCssStyles({ transition: "none", transform: `translate(${dx}px, ${dy}px)` });
        requestAnimationFrame(() => {
          el.setCssStyles({ transition: "transform .18s ease", transform: "" });
          const done = () => {
            el.setCssStyles({ transition: "" });
            el.removeEventListener("transitionend", done);
          };
          el.addEventListener("transitionend", done);
        });
      });
    };

    const onMove = (e: PointerEvent) => {
      moveClone(e.clientX, e.clientY);
      const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!under) return;
      const grid = under.closest(".ep-grid") as HTMLElement | null;
      if (!grid) return;
      const isGrid = grid.classList.contains("ep-mode-grid");
      clearSwap();
      if (isGrid) {
        // Grid mode: highlight the hovered cell as a swap target.
        const cell = under.closest(".ep-entry, .ep-empty-cell") as HTMLElement | null;
        if (cell && cell !== wrap) {
          gridTarget = cell;
          cell.addClass("ep-swap-target");
        }
        return;
      }
      const targetEntry = under.closest(".ep-entry") as HTMLElement | null;
      if (targetEntry && targetEntry !== wrap) {
        const r = targetEntry.getBoundingClientRect();
        const relX = e.clientX - (r.left + r.width / 2);
        const relY = e.clientY - (r.top + r.height / 2);
        const after = Math.abs(relX) > Math.abs(relY) ? relX > 0 : relY > 0;
        const parent = targetEntry.parentElement as HTMLElement;
        const refNode = after ? targetEntry.nextSibling : targetEntry;
        if (wrap.parentElement !== parent || wrap.nextSibling !== refNode)
          flip(grid, () => parent.insertBefore(wrap, refNode));
      } else {
        const cell = under.closest(".ep-empty-cell") as HTMLElement | null;
        if (cell) {
          flip(grid, () => grid.insertBefore(wrap, cell));
        } else {
          const cont = (under.closest(".ep-col") as HTMLElement | null) || grid;
          if ((cont.classList.contains("ep-col") || cont.classList.contains("ep-grid")) && wrap.parentElement !== cont)
            flip(grid, () => cont.appendChild(wrap));
        }
      }
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      clone.remove();
      wrap.removeClass("ep-drag-placeholder");
      const commit = (mutate: () => boolean) => {
        if (mutate()) {
          view.saveLayout();
        }
        view.rerender();
      };
      if (gridTarget) {
        const tid = (gridTarget.getAttribute("data-ep-id") || "").slice(2);
        gridTarget.removeClass("ep-swap-target");
        if (tid) commit(() => ops.swapEntries(view.layout, entry.id, tid));
        else commit(() => ops.moveLeavingBlank(view.layout, entry.id, section.id));
        return;
      }
      if (swapEl) {
        const otherId = (swapEl.getAttribute("data-ep-id") || "").slice(2);
        swapEl.removeClass("ep-swap-target");
        if (otherId) {
          commit(() => ops.swapEntries(view.layout, entry.id, otherId));
          return;
        }
      }
      // Read the final DOM position and mirror it into the model.
      const secEl = wrap.closest(".ep-section") as HTMLElement | null;
      const toId = secEl ? (secEl.getAttribute("data-ep-id") || "s:").slice(2) : section.id;
      const order = secEl
        ? (Array.from(secEl.querySelectorAll(".ep-entry")) as HTMLElement[])
            .map((el) => (el.getAttribute("data-ep-id") || "").slice(2))
            .filter(Boolean)
        : [];
      commit(() => ops.reorderByDomOrder(view.layout, entry.id, section.id, toId, order));
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }

  // -- drop markers ---------------------------------------------------------

  private mark(el: HTMLElement, after: boolean): void {
    el.removeClasses(["ep-drop-top", "ep-drop-bottom"]);
    el.addClass(after ? "ep-drop-bottom" : "ep-drop-top");
  }

  private clearMarks(): void {
    this.view.containerEl.findAll(".ep-drop-top, .ep-drop-bottom").forEach((el) =>
      el.removeClasses(["ep-drop-top", "ep-drop-bottom"])
    );
    this.view.containerEl.findAll(".ep-dragging").forEach((el) => el.removeClass("ep-dragging"));
  }
}
