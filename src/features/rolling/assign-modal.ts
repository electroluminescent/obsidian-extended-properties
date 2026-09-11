/**
 * Dealing a screen full of rolls out across a sheet's properties.
 *
 * Rolling a character up is not one roll into one property - it is six rolls
 * made at once, looked at as a set, and then DEALT: this one here, that one
 * there, and the spare ignored. A menu that assigns one number at a time
 * cannot express that, because the decision is about the whole handful.
 *
 * The cards stay on screen while this is open (they are what is being dealt,
 * and closing them first would leave the reader deciding about numbers they
 * can no longer see), ticking a property deals it a roll straight away, and
 * every pairing can be changed by hand before a word is written.
 *
 * The rules it keeps:
 *
 *  - Nothing defaults to being left alone. A ticked property always shows the
 *    number it would get; *keep what it has* is a choice the reader makes,
 *    never one made for them.
 *  - Top / Random / Bottom is the order the rolls are handed out in, and every
 *    roll is used once before any is used twice.
 *  - Two properties may take the same roll. That is a thing somebody might
 *    mean, so it is marked rather than prevented.
 *  - The handful is whatever is on screen NOW. Dismiss a card mid-deal and it
 *    stops being an option; dismiss them all and there is nothing left to
 *    decide, so this closes.
 */

import { Modal, Notice, Setting, TFile } from "obsidian";
import type { ViewCtx } from "../../core/context";
import { asMobileSheet } from "../../ui/components/long-press";
import { liveRolls, watchLiveRolls, type LiveRoll } from "./live-rolls";
import { numberTargets, setAssignSession, type NumberTarget } from "./into";

/** The order the rolls are handed out in. */
export type DealOrder = "top" | "random" | "bottom";

/** A property's fate: a roll's id, or left alone. */
type Choice = number | "keep";

/** A shuffled copy (Fisher-Yates). */
function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export class AssignRollsModal extends Modal {
  private order: DealOrder = "random";
  /** Ticked property keys, in the order they were ticked - the dealing order. */
  private picked: string[] = [];
  /** Pairs the reader set by hand, which survive a re-deal of the rest. */
  private manual = new Map<string, Choice>();
  private targets: NumberTarget[] = [];
  private pool: LiveRoll[] = [];
  /** The deal order, redrawn whenever the rule or the handful changes. */
  private queue: number[] = [];
  private listEl: HTMLElement | null = null;
  private orderDesc: HTMLElement | null = null;
  private unwatch: (() => void) | null = null;

  constructor(
    private view: ViewCtx,
    private file: TFile,
    /** Run however this closes - what put the cards aside puts them back. */
    private onDismiss?: () => void
  ) {
    super(view.app);
  }

  onOpen(): void {
    asMobileSheet(this);
    this.targets = numberTargets(this.view);
    this.pool = liveRolls();
    this.requeue();
    this.adoptTargeted();
    // Let the cards know a deal is in progress: while it is, their menu offers
    // to hand a roll straight to one of these properties instead of offering
    // to open a second copy of this dialog.
    setAssignSession({
      picks: () => this.picked.map((key) => ({ key, label: this.labelFor(key) })),
      give: (rollId, key) => this.give(rollId, key),
    });
    this.unwatch = watchLiveRolls(() => this.poolChanged());
    this.draw();
  }

  // -- the handful -----------------------------------------------------------

  /**
   * A card landed or left.
   *
   * A roll that is gone cannot be given to anything, so it leaves the pool and
   * any pair pointing at it is dropped back to the deal. With nothing left on
   * screen there is nothing to decide, and this closes rather than sitting
   * there offering an empty list.
   */
  private poolChanged(): void {
    const before = this.pool;
    this.pool = liveRolls();
    if (!this.pool.length) {
      this.close();
      return;
    }
    const alive = new Set(this.pool.map((r) => r.id));
    const arrived = this.pool.filter((r) => !before.some((b) => b.id === r.id));

    // A re-roll is a NEW card standing where the old one stood, and it should
    // land on the property the old one was going to. The replacement is found
    // by what the roll was FOR if it was for something, and otherwise by its
    // name, which a re-roll keeps.
    for (const [key, c] of [...this.manual]) {
      if (typeof c !== "number" || alive.has(c)) continue;
      const was = before.find((r) => r.id === c);
      const heir =
        arrived.find((r) => r.forKey && r.forKey === was?.forKey) ??
        arrived.find((r) => !!was && r.label === was.label);
      if (heir) this.manual.set(key, heir.id);
      else this.manual.delete(key);
    }

    this.requeue();
    this.adoptTargeted();
    this.draw();
  }

  /**
   * Take up the pairings the rolls already carry.
   *
   * A SET button throws one roll per property and stamps each with the property
   * it was for, so a sheet rolled up arrives here already answered: the
   * properties are ticked and paired without anybody ticking anything. Only
   * rolls that name a property this sheet actually has are adopted, and an
   * existing choice is never overruled.
   */
  private adoptTargeted(): void {
    for (const roll of this.pool) {
      const key = roll.forKey;
      if (!key || !this.targets.some((t) => t.key === key)) continue;
      if (this.manual.get(key) !== undefined) continue;
      if (!this.picked.includes(key)) this.picked = [...this.picked, key];
      this.manual.set(key, roll.id);
    }
  }

  /**
   * Line the rolls up in the order they will be handed out.
   *
   * Every roll appears once before any appears twice: the queue is the whole
   * handful, and a property past the end of it wraps to a freshly ordered
   * pass rather than to a second helping of the first roll.
   */
  private requeue(): void {
    const ids = this.pool.map((r) => r.id);
    if (this.order === "top")
      this.queue = [...ids].sort((a, b) => this.totalOf(b) - this.totalOf(a));
    else if (this.order === "bottom")
      this.queue = [...ids].sort((a, b) => this.totalOf(a) - this.totalOf(b));
    else this.queue = shuffle(ids);
  }

  private totalOf(id: number): number {
    return this.pool.find((r) => r.id === id)?.total ?? 0;
  }

  private rollOf(id: number): LiveRoll | undefined {
    return this.pool.find((r) => r.id === id);
  }

  private labelFor(key: string): string {
    return this.targets.find((t) => t.key === key)?.label ?? key;
  }

  /** What `key` would get: its own choice, else its place in the queue. */
  private choiceFor(key: string): Choice | undefined {
    const own = this.manual.get(key);
    if (own !== undefined) return own;
    const at = this.picked.indexOf(key);
    if (at < 0 || !this.queue.length) return undefined;
    return this.queue[at % this.queue.length];
  }

  /** Rolls a ticked property is already taking. */
  private taken(): Set<number> {
    const out = new Set<number>();
    for (const key of this.picked) {
      const c = this.choiceFor(key);
      if (typeof c === "number") out.add(c);
    }
    return out;
  }

  /** Rolls more than one ticked property is taking - marked, not prevented. */
  private shared(): Set<number> {
    const seen = new Map<number, number>();
    for (const key of this.picked) {
      const c = this.choiceFor(key);
      if (typeof c === "number") seen.set(c, (seen.get(c) ?? 0) + 1);
    }
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id));
  }

  /** Hand one roll to one property - what a card's own menu asks for. */
  private give(rollId: number, key: string): void {
    if (!this.rollOf(rollId)) return;
    if (!this.picked.includes(key)) this.picked = [...this.picked, key];
    this.manual.set(key, rollId);
    this.draw();
    new Notice(
      this.view.i18n.t("roll.assign.gave", { total: String(this.totalOf(rollId)), name: this.labelFor(key) }),
      2500
    );
  }

  // -- drawing ---------------------------------------------------------------

  private draw(): void {
    const c = this.contentEl;
    const t = this.view.i18n.t.bind(this.view.i18n);
    c.empty();
    c.addClass("ep-assign");
    c.createEl("h3", { text: t("roll.assign.title") });

    if (!this.pool.length || !this.targets.length) {
      c.createDiv({
        cls: "ep-assign-empty",
        text: this.pool.length ? t("roll.assign.noProps") : t("roll.assign.noRolls"),
      });
      new Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
      return;
    }

    if (this.pool.length > 1) {
      const orderRow = new Setting(c)
        .setName(t("roll.assign.order"))
        .addDropdown((dd) => {
          dd.addOption("top", t("roll.assign.orderTop"));
          dd.addOption("random", t("roll.assign.orderRandom"));
          dd.addOption("bottom", t("roll.assign.orderBottom"));
          dd.setValue(this.order);
          dd.onChange((v) => {
            this.order = v === "top" ? "top" : v === "bottom" ? "bottom" : "random";
            // A new rule is a new deal: hand-picked pairs were made against the
            // old one and would read as the rule having half-applied.
            this.manual.clear();
            this.requeue();
            this.draw();
          });
        })
        .addExtraButton((b) =>
          b
            .setIcon("shuffle")
            .setTooltip(t("roll.assign.redeal"))
            .onClick(() => {
              this.manual.clear();
              this.requeue();
              this.draw();
            })
        );
      // Held so the line can change as boxes are ticked, without rebuilding
      // the dialog under the reader's cursor.
      this.orderDesc = orderRow.descEl;
    } else {
      this.orderDesc = null;
    }

    // One list. A ticked property rises to the top and grows its dropdown;
    // there is no second copy of it further down, because a thing shown twice
    // is a thing the reader has to work out is the same thing.
    new Setting(c).setName(t("roll.assign.props")).setDesc(t("roll.assign.propsDesc")).setHeading();
    this.listEl = c.createDiv({ cls: "ep-assign-list" });
    this.paintList();

    new Setting(c)
      .addButton((b) => b.setButtonText(t("common.cancel")).onClick(() => this.close()))
      .addButton((b) =>
        b
          .setButtonText(t("roll.assign.apply"))
          .setCta()
          .onClick(() => {
            this.apply();
            this.close();
          })
      );
  }

  /** Ticked first, in the order they were ticked; the rest in sheet order. */
  private rows(): NumberTarget[] {
    const ticked = this.picked
      .map((key) => this.targets.find((t) => t.key === key))
      .filter((t): t is NumberTarget => !!t);
    return [...ticked, ...this.targets.filter((t) => !this.picked.includes(t.key))];
  }

  /**
   * Draw the list, and slide the rows to wherever ticking just moved them.
   *
   * Rebuilt rather than reordered in place, because what a row contains
   * changes with its state - but a rebuild alone would teleport six rows at
   * once and leave the reader working out what became of the one they
   * touched. So the old positions are measured first, the new rows are put
   * back where their predecessors were, and released a frame later (FLIP).
   */
  private paintList(): void {
    const box = this.listEl;
    if (!box) return;
    const t = this.view.i18n.t.bind(this.view.i18n);
    this.orderDesc?.setText(
      this.picked.length ? t("roll.assign.orderDesc") : t("roll.assign.orderIdle")
    );

    const before = new Map<string, number>();
    for (const el of box.findAll(".ep-assign-pick")) {
      const key = el.getAttr("data-key");
      if (key) before.set(key, el.getBoundingClientRect().top);
    }

    box.empty();
    const clash = this.shared();
    const drawn = new Map<string, HTMLElement>();
    for (const target of this.rows()) {
      const on = this.picked.includes(target.key);
      const row = box.createDiv({ cls: "ep-assign-pick" + (on ? " is-on" : "") });
      row.setAttr("data-key", target.key);
      drawn.set(target.key, row);

      const tick = row.createEl("input", { cls: "ep-assign-tick", type: "checkbox" });
      tick.checked = on;
      tick.setAttr("aria-label", target.label);
      row.createSpan({ cls: "ep-assign-pickname", text: target.label });

      // What it holds now, right-aligned in a column of its own so it sits
      // against the dropdowns rather than wherever the name happens to end.
      const has = this.view.note.raw[target.key];
      row.createSpan({
        cls: "ep-assign-picknow",
        text:
          has === undefined || has === null || has === ""
            ? t("roll.assign.emptyNow")
            : t("roll.assign.holdsNow", { value: String(has) }),
      });

      // The slot is always there, empty or not: without it an unticked row's
      // "now" would slide out to the far right and the column would zig-zag.
      const slot = row.createDiv({ cls: "ep-assign-slot" });
      if (on) this.paintPair(row, slot, target.key, clash);

      tick.onchange = () => {
        this.picked = tick.checked
          ? [...this.picked.filter((k) => k !== target.key), target.key]
          : this.picked.filter((k) => k !== target.key);
        if (!tick.checked) this.manual.delete(target.key);
        this.paintList();
      };
    }

    // Put each row back where it was, then let go.
    for (const [key, el] of drawn) {
      const was = before.get(key);
      if (was === undefined) continue;
      const dy = was - el.getBoundingClientRect().top;
      if (!dy) continue;
      el.addClass("ep-assign-jump");
      el.setCssStyles({ transform: `translateY(${dy}px)` });
    }
    window.requestAnimationFrame(() => {
      for (const el of drawn.values()) {
        el.removeClass("ep-assign-jump");
        el.setCssStyles({ transform: "" });
      }
    });
  }

  /**
   * The number this property would get, and where it came from.
   *
   * One control, two columns: the value on the left because it is what is
   * being decided, the roll it came off right-aligned beside it because that
   * is only ever a reference - until two properties are reading the same card,
   * when the pair goes yellow, which is the one case where the source is the
   * point. The list it opens is laid out the same way, so choosing is reading
   * the same two columns you were already looking at.
   */
  private paintPair(row: HTMLElement, slot: HTMLElement, key: string, clash: Set<number>): void {
    const t = this.view.i18n.t.bind(this.view.i18n);
    const cur = this.choiceFor(key);
    const btn = slot.createEl("button", { cls: "ep-assign-btn" });
    const roll = typeof cur === "number" ? this.rollOf(cur) : undefined;
    btn.createSpan({ cls: "ep-assign-btnval", text: roll ? String(roll.total) : t("roll.assign.optKeep") });
    btn.createSpan({ cls: "ep-assign-btnfrom", text: roll?.label ?? "" });
    btn.createSpan({ cls: "ep-assign-chev", text: "▾" });
    btn.onclick = (ev) => {
      ev.preventDefault();
      this.openPicker(btn, key);
    };

    if (typeof cur === "number") {
      if (clash.has(cur)) {
        row.addClass("ep-assign-clash");
        row.setAttr("title", t("roll.assign.clash"));
      }
    } else {
      row.addClass("ep-assign-spare");
    }
  }

  /**
   * The roll list, as a panel rather than a `<select>`.
   *
   * A native dropdown can hold one string per row, and what is wanted here is
   * two columns - the number on one side, the card it came off on the other -
   * so this is built by hand. It rides above the dialog the way the plugin's
   * other popups do.
   */
  private openPicker(anchor: HTMLElement, key: string): void {
    const t = this.view.i18n.t.bind(this.view.i18n);
    const doc = anchor.ownerDocument;
    const pop = doc.body.createDiv({ cls: "ep-popup ep-assign-pop" });
    const at = anchor.getBoundingClientRect();
    pop.setCssStyles({ left: `${Math.round(at.left)}px`, top: `${Math.round(at.bottom + 2)}px`, minWidth: `${Math.round(at.width)}px` });

    const dismiss = (): void => {
      pop.remove();
      doc.removeEventListener("mousedown", outside, true);
      doc.removeEventListener("keydown", onKey, true);
    };
    const outside = (ev: MouseEvent): void => {
      if (!pop.contains(ev.target instanceof Node ? ev.target : null)) dismiss();
    };
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        ev.stopPropagation();
        dismiss();
      }
    };

    const cur = this.choiceFor(key);
    const choose = (value: Choice): void => {
      dismiss();
      this.manual.set(key, value);
      this.paintList();
    };
    const option = (label: string, from: string, value: Choice): void => {
      const on = cur === value;
      const opt = pop.createDiv({ cls: "ep-assign-opt" + (on ? " is-on" : "") });
      opt.createSpan({ cls: "ep-assign-optval", text: label });
      opt.createSpan({ cls: "ep-assign-optfrom", text: from });
      opt.onclick = () => choose(value);
    };

    // Split by whether anything is already taking that roll. Picking a taken
    // one is allowed - two properties may share - but it should be a thing the
    // reader chooses knowingly rather than stumbles into, and with a dozen
    // cards up the free ones are what they are usually looking for.
    const taken = this.taken();
    const groups: [string, LiveRoll[]][] = [
      [t("roll.assign.groupFree"), this.pool.filter((r) => !taken.has(r.id))],
      [t("roll.assign.groupTaken"), this.pool.filter((r) => taken.has(r.id))],
    ];
    for (const [label, rolls] of groups) {
      if (!rolls.length) continue;
      pop.createDiv({ cls: "ep-assign-group", text: label });
      for (const r of rolls) option(String(r.total), r.label, r.id);
    }
    pop.createDiv({ cls: "ep-assign-group", text: t("roll.assign.groupNone") });
    option(t("roll.assign.optKeep"), "", "keep");

    // Nudge back on screen if the panel would hang off the bottom or right.
    const box = pop.getBoundingClientRect();
    const overX = box.right - doc.documentElement.clientWidth + 8;
    const overY = box.bottom - doc.documentElement.clientHeight + 8;
    if (overX > 0) pop.setCssStyles({ left: `${Math.round(at.left - overX)}px` });
    if (overY > 0) pop.setCssStyles({ top: `${Math.round(at.top - box.height - 2)}px` });

    doc.addEventListener("mousedown", outside, true);
    doc.addEventListener("keydown", onKey, true);
  }

  /**
   * Write every pairing that has a roll to write.
   *
   * One notice for the deal rather than one per property: six notices nobody
   * reads is what a per-value path would give here, and the writes go through
   * the same route an edit does, so they are undoable like any other change.
   */
  private apply(): void {
    const done: string[] = [];
    for (const key of this.picked) {
      const c = this.choiceFor(key);
      if (typeof c !== "number") continue;
      const total = this.totalOf(c);
      this.view.note.set(this.file, key, total);
      done.push(`${this.labelFor(key)} ${total}`);
    }
    if (done.length) new Notice(this.view.i18n.t("roll.assign.done", { list: done.join(", ") }), 5000);
  }

  onClose(): void {
    this.unwatch?.();
    this.unwatch = null;
    setAssignSession(null);
    this.contentEl.empty();
    this.onDismiss?.();
  }
}
