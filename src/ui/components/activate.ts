/**
 * Binding the configured activation gesture (see `core/activation`).
 *
 * One helper so every surface behaves identically: the same tooltip wording,
 * the same keyboard parity, and - in single-click mode - the same suppression
 * of the second click of a fast double click, which would otherwise open the
 * editor and immediately reopen it.
 */

import { activationFor, type ActivationMode, type ActivationSurface } from "../../core/activation";
import type { I18n } from "../../i18n/i18n";

interface ActivationSettings {
  activation?: Record<string, string>;
}

/**
 * Bind `run` to the gesture chosen for `surface`, returning the mode so the
 * caller can word its own tooltip. `run` receives the triggering event.
 */
export function bindActivation(
  el: HTMLElement,
  settings: ActivationSettings,
  surface: ActivationSurface,
  run: (ev: MouseEvent) => void
): ActivationMode {
  const mode = activationFor(settings, surface);
  if (mode === "single") {
    el.onclick = (ev: MouseEvent) => {
      // A link inside a value belongs to the link, not the editor.
      if (ev.target instanceof Node && ev.target.instanceOf(HTMLElement) && ev.target.closest("a")) return;
      ev.preventDefault();
      run(ev);
    };
    // The second click of a double click has nothing left to open.
    el.ondblclick = (ev: MouseEvent) => ev.preventDefault();
  } else {
    el.ondblclick = (ev: MouseEvent) => run(ev);
  }
  return mode;
}

/** "Click to edit" / "Double-click to edit", matching the bound gesture. */
export function activationHint(i18n: I18n, mode: ActivationMode, toggle = false): string {
  if (toggle) return i18n.t(mode === "single" ? "hint.clickToggle" : "hint.dblToggle");
  return i18n.t(mode === "single" ? "hint.clickEdit" : "hint.dblEdit");
}
