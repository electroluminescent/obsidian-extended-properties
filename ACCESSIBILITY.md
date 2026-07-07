# Accessibility

Extended Properties aims to be fully operable by keyboard and legible to screen
readers, high-contrast themes and reduced-motion users. This document summarizes
the accessibility support that ships.

## What ships

- **Roving-tabindex entry navigation.** The sidebar entry list is one focus group:
  Tab into it, then `Up`/`Down`/`Home`/`End` move between entries and `Enter`/`Space`
  open the focused entry's context menu (the keyboard route to reorder / configure
  / remove / clear). Entries expose `role="group"` with the property name as their
  label.
- **Keyboard-operable controls.** Every custom control is focusable and operable
  without a mouse:
  - **Editable values** (number, decimal, formula, derived override, text, unit,
    datetime, link, colour) are `role="button"`, focusable, and open their editor
    on `Enter`/`Space` (mouse: click in edit mode, double-click when locked).
  - **Steppers** (`-`/`+`) are native buttons with labels.
  - **Slider** (custom knob) is `role="slider"` with `aria-valuemin/max/now` and
    arrow-key/Home/End support.
  - **Rating** is `role="slider"` (0...max) - arrow keys and Home/End change it; the
    pips are `aria-hidden` decoration.
  - **Checkbox** is a native checkbox with an accessible name; in locked mode
    `Enter`/`Space` toggles it (matching the mouse double-click).
  - **List chips** expose a labelled *Remove {item}* button reachable by keyboard.
  - **Section titles** are `role="button"` disclosures with `aria-expanded`,
    toggled by `Enter`/`Space`.
  - **Roll buttons**, the **entry `...` menu**, and table-view controls carry
    `aria-label`s.
- **Type table view.** Header sort is a real button (`Enter`/`Space`) and the
  column carries `aria-sort`; editable cells are `role="button"` and open their
  editor with `Enter`/`Space`; column-resize grips are focusable separators
  resized with `Left`/`Right`; note links and per-cell roll buttons are
  keyboard-reachable.
- **Live announcements.** A shared polite `aria-live` region (`utils/a11y.ts`)
  announces roll totals, since the roll card is otherwise purely visual.
- **Reduced motion.** `prefers-reduced-motion: reduce` disables the tumble, roll,
  spin, card and collapse animations; the 3D die lands on its result without the
  spin. (Covered by `@media (prefers-reduced-motion: reduce)` blocks and a runtime
  check in the dice animation.)
- **High contrast / forced colors.** Under `forced-colors: active` (Windows High
  Contrast), controls that convey state through colour also get a system-palette
  border/outline, and focus rings use the system `Highlight` colour, so nothing
  relies on colour alone.
- **Focus visibility.** `:focus-visible` rings are drawn on entries, editable
  values, rating, section titles, chips, steppers, roll cards, table cells and
  popups.

## Known limitations

- **Drag-to-reorder** is pointer-only (the grip is `aria-hidden`); the keyboard
  equivalent is the entry menu's move actions.
- **Screen-reader behaviour** is verified manually. Please file an issue with the
  reader + OS + Obsidian version if something reads incorrectly.
