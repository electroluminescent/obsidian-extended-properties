/**
 * A place to type a roll, wherever one is wanted.
 *
 * The dice roller has had this for a long time - a field that round-trips with
 * its chips, a bar of buttons that insert the notation you can never remember,
 * and autocomplete over the note's property names. Anywhere else that asks for
 * a roll has had a bare text box and the hope that the reader knows what
 * `3d6dhdl` means.
 *
 * So it is lifted out here, without the parts that belong to the roller
 * itself: no advantage, no how-many, no Roll button. This writes an expression
 * down; what throws it is somebody else's business.
 */

import type { ViewCtx } from "../../core/context";
import type { RollSeg } from "../../core/model";
import { referenceSuggestions } from "../../core/influences";
import { RefSuggest } from "../../ui/components/suggest";
import { openDiceMenu } from "./dice-ui";
import { segsToText, textToSegs } from "./macros";

export interface ExprFieldOpts {
  /** The expression as it stands. */
  value: RollSeg[] | undefined;
  /** Called with a parsed expression, or with `null` when it cannot be read. */
  onChange: (segs: RollSeg[] | null) => void;
  placeholder?: string;
  /** Draw the one-line reminder of what the notation means (default true). */
  hint?: boolean;
}

/**
 * Mount the field, its function bar and (by default) a line explaining the
 * notation, into `host`.
 *
 * The field commits on Enter or on leaving it, never per keystroke: half a
 * dice expression is not a dice expression, and marking it invalid while
 * somebody is still typing it is just rude.
 */
export function mountRollExpr(host: HTMLElement, view: ViewCtx, o: ExprFieldOpts): void {
  const t = view.i18n.t.bind(view.i18n);
  const wrap = host.createDiv({ cls: "ep-exprfield" });

  const input = wrap.createEl("input", { cls: "ep-edit-input ep-expr-input", type: "text" });
  input.setAttr("placeholder", o.placeholder ?? "3d6dhdl + 8");
  input.value = segsToText(o.value ?? []);

  const commit = (): void => {
    const text = input.value.trim();
    if (!text) {
      input.removeClass("ep-invalid");
      o.onChange([]);
      return;
    }
    const parsed = textToSegs(text);
    if (!parsed) {
      input.addClass("ep-invalid");
      o.onChange(null);
      return;
    }
    input.removeClass("ep-invalid");
    o.onChange(parsed);
  };
  input.onblur = commit;
  input.onkeydown = (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      commit();
    } else if (ev.key === "Escape") {
      input.value = segsToText(o.value ?? []);
      input.removeClass("ep-invalid");
    }
  };
  // Property names, under either the name or the short form they are known by.
  new RefSuggest(view.app, input, () =>
    referenceSuggestions(view.settings, view.propCandidates(true).map((c) => c.key))
  );

  // -- the notation, as buttons ---------------------------------------------
  const insert = (token: string): void => {
    const from = input.selectionStart ?? input.value.length;
    const to = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, from) + token + input.value.slice(to);
    const at = from + token.length;
    input.focus();
    try {
      input.setSelectionRange(at, at);
    } catch {
      /* not a field that has a selection */
    }
  };
  const bar = wrap.createDiv({ cls: "ep-roller-fns" });
  const btn = (label: string, title: string, onClick: (ev: MouseEvent) => void): void => {
    const b = bar.createEl("button", { cls: "ep-roller-fn", text: label });
    b.setAttr("title", title);
    b.onmousedown = (ev) => ev.preventDefault(); // keep the field focused
    b.onclick = onClick;
  };
  btn(t("roller.fnDie"), t("roller.fnDieHint"), (ev) =>
    openDiceMenu(ev, view.app, view.i18n, { get: () => undefined, set: (n) => insert(n || "d20") })
  );
  btn("kh", t("roller.fnKeepHigh"), () => insert("kh1"));
  btn("kl", t("roller.fnKeepLow"), () => insert("kl1"));
  btn("!", t("roller.fnExplode"), () => insert("!"));
  btn("r", t("roller.fnReroll"), () => insert("r1"));
  btn(">=", t("roller.fnSuccess"), () => insert(">="));
  btn("+", t("roller.fnPlus"), () => insert(" + "));

  if (o.hint !== false) wrap.createDiv({ cls: "ep-expr-hint", text: t("roll.exprHelp") });
}
