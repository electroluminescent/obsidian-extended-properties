/**
 * The control cluster: the right-aligned strip of cells on a numeric entry
 * row (`[addon slots...] [-] [value] [+] [addon slots...]`).
 *
 * All entries of a section share one column template (computed in
 * `section-renderer.ts`) so values align vertically; entries that don't use
 * a slot still render an empty cell of the same width.
 */

import type { ClusterFlags, ClusterOptions, ClusterRefs, EntryRef } from "../../core/context";
import type { ClusterAddon, ClusterNeeds, ClusterSlot } from "../../core/registry";
import { clamp, fmtNum } from "../../utils/misc";
import { openNumberInput } from "../components/inline-edit";
import { sfx } from "../../utils/sound";

/** Cluster addons applicable to an entry, in registration order. */
export function addonsFor(ref: EntryRef): ClusterAddon[] {
  return ref.view.registries.clusterAddons.all().filter((a) => a.appliesTo(ref));
}

/** Merge cluster needs, de-duplicating slots by id and preserving order. */
export function mergeNeeds(into: ClusterFlags, needs: ClusterNeeds | undefined): void {
  if (!needs) return;
  if (needs.steppers) into.steppers = true;
  const add = (target: ClusterSlot[], slots?: ClusterSlot[]) => {
    for (const s of slots ?? []) if (!target.some((x) => x.id === s.id)) target.push(s);
  };
  add(into.before, needs.before);
  add(into.after, needs.after);
}

export function emptyFlags(): ClusterFlags {
  return { before: [], steppers: false, after: [] };
}

/**
 * Build the cluster DOM for one entry.
 *
 * @param bindOpen attach the view's open-on-click behavior to the value cell
 */
export function buildCluster(
  head: HTMLElement,
  flags: ClusterFlags,
  o: ClusterOptions,
  bindOpen: (el: HTMLElement, open: () => void) => void
): ClusterRefs {
  const cl = head.createDiv({ cls: "ep-cluster" });

  // Column template mirrors the slot order.
  const cols: string[] = [];
  for (const _ of flags.before) cols.push("auto");
  // The stepper columns track the button size via a CSS var so the larger
  // mobile touch targets (body.is-mobile) get a wider column instead of
  // overflowing a fixed 20px cell and overlapping the value.
  if (flags.steppers) cols.push("var(--ep-step-col, 20px)");
  cols.push("minmax(2.1em, auto)");
  if (flags.steppers) cols.push("var(--ep-step-col, 20px)");
  for (const _ of flags.after) cols.push("auto");
  cl.setCssStyles({ gridTemplateColumns: cols.join(" ") });

  const cells: Record<string, HTMLElement> = {};
  const editable = !!(o.commit && o.get);
  const min = o.min ?? -Infinity;
  const max = o.max ?? Infinity;

  const makeSlotCell = (slot: ClusterSlot) => {
    const cell = cl.createSpan({ cls: "ep-cell" + (slot.cls ? " " + slot.cls : "") });
    // Tagged so the section renderer can equalize slot widths across rows.
    cell.setAttr("data-ep-slot", slot.id);
    cells[slot.id] = cell;
    o.slots?.[slot.id]?.(cell);
  };

  for (const slot of flags.before) makeSlotCell(slot);

  if (flags.steppers) {
    if (o.steppers && editable) {
      const dec = cl.createEl("button", { cls: "ep-step-btn", text: "-" });
      dec.setAttr("aria-label", "Decrease value");
      dec.onclick = () => {
        sfx.tick();
        const cur = o.get!();
        o.commit!(o.clamp ? clamp(cur - 1, min, max) : cur - 1);
      };
    } else {
      cl.createSpan({ cls: "ep-cell" });
    }
  }

  const val = cl.createSpan({ cls: "ep-num" });
  if (editable) {
    val.setText(fmtNum(o.get!()));
    bindOpen(val, () =>
      openNumberInput(val, o.get!(), o.commit!, { min, max, float: !!o.float, clamp: !!o.clamp })
    );
  } else {
    val.setText(o.display ?? "");
  }

  if (flags.steppers) {
    if (o.steppers && editable) {
      const inc = cl.createEl("button", { cls: "ep-step-btn", text: "+" });
      inc.setAttr("aria-label", "Increase value");
      inc.onclick = () => {
        sfx.tick();
        const cur = o.get!();
        o.commit!(o.clamp ? clamp(cur + 1, min, max) : cur + 1);
      };
    } else {
      cl.createSpan({ cls: "ep-cell" });
    }
  }

  for (const slot of flags.after) makeSlotCell(slot);

  return { val, cells };
}
