/**
 * Global modifier-key state — a power-user shortcut: holding **Shift** while
 * triggering a confirmation bypasses the dialog and takes its default action
 * (save when closing the property editor, keep on an options modal, or the
 * primary/confirm action — delete, reset, clear — on a `ConfirmModal`).
 *
 * The confirmation modals (`ui/modals/dialogs.ts`) read {@link isShiftHeld} in
 * their `open()` override, so every call site gets the behaviour for free.
 */

import type { Plugin } from "obsidian";

let shift = false;

/** True while the Shift key is held (updated on key + mouse events). */
export function isShiftHeld(): boolean {
  return shift;
}

/** Wire the document listeners that track Shift; cleaned up on plugin unload. */
export function trackModifiers(plugin: Plugin): void {
  const upd = (e: KeyboardEvent | MouseEvent): void => {
    shift = e.shiftKey;
  };
  // Capture phase so we see the state even if a handler stops propagation, and
  // before the click handler that opens a confirmation runs.
  plugin.registerDomEvent(activeDocument, "keydown", upd, true);
  plugin.registerDomEvent(activeDocument, "keyup", upd, true);
  plugin.registerDomEvent(activeDocument, "mousedown", upd, true);
  // A window blur can swallow the keyup, which would leave Shift stuck on.
  plugin.registerDomEvent(window, "blur", () => {
    shift = false;
  });
}
