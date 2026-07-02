# Accessibility

Extended Properties aims to be fully operable by keyboard and legible to screen
readers, high-contrast themes and reduced-motion users. There is no automated a11y
gate (no screen reader runs in CI), so this document is the **manual test
checklist** to run before a release, plus a summary of the support that ships.

## What ships

- **Roving-tabindex entry navigation.** The sidebar entry list is one focus group:
  Tab into it, then `↑`/`↓`/`Home`/`End` move between entries and `Enter`/`Space`
  open the focused entry's context menu (the keyboard route to reorder / configure
  / remove / clear). Entries expose `role="group"` with the property name as their
  label.
- **Keyboard-operable controls.** Every custom control is focusable and operable
  without a mouse:
  - **Editable values** (number, decimal, formula, derived override, text, unit,
    datetime, link, colour) are `role="button"`, focusable, and open their editor
    on `Enter`/`Space` (mouse: click in edit mode, double-click when locked).
  - **Steppers** (`−`/`+`) are native buttons with labels.
  - **Slider** (custom knob) is `role="slider"` with `aria-valuemin/max/now` and
    arrow-key/Home/End support.
  - **Rating** is `role="slider"` (0…max) — arrow keys and Home/End change it; the
    pips are `aria-hidden` decoration.
  - **Checkbox** is a native checkbox with an accessible name; in locked mode
    `Enter`/`Space` toggles it (matching the mouse double-click).
  - **List chips** expose a labelled *Remove {item}* button reachable by keyboard.
  - **Section titles** are `role="button"` disclosures with `aria-expanded`,
    toggled by `Enter`/`Space`.
  - **Roll buttons**, the **entry `⋯` menu**, and table-view controls carry
    `aria-label`s.
- **Type table view.** Header sort is a real button (`Enter`/`Space`) and the
  column carries `aria-sort`; editable cells are `role="button"` and open their
  editor with `Enter`/`Space`; column-resize grips are focusable separators
  resized with `←`/`→`; note links and per-cell roll buttons are
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

## Manual checklist (run before release)

Keyboard only (unplug the mouse):

- [ ] Tab reaches the sidebar; arrow keys move between entries; `Enter` opens an
      entry's menu; `Esc` closes popups/menus.
- [ ] A number entry: focus the value, `Enter` opens the inline editor; the
      `−`/`+` buttons and the slider knob are reachable and change the value
      (arrows on the knob).
- [ ] A rating entry: arrow keys raise/lower it; Home/End set min/max.
- [ ] A checkbox entry (locked mode): `Space`/`Enter` toggles it.
- [ ] A list entry: the *Remove* control on a chip is reachable and works.
- [ ] A colour entry: `Enter` opens the picker; inside it the sliders/field and
      channel inputs are operable; `Esc` closes.
- [ ] Section titles: `Enter`/`Space` collapse/expand; `aria-expanded` flips.
- [ ] Edit mode: the entry `⋯` menu opens from the keyboard; reorder via the menu.
- [ ] Type table view: header sort, cell edit and roll are reachable.

Screen reader (NVDA on Windows, VoiceOver on macOS):

- [ ] Each entry announces its property name and `group` role.
- [ ] The slider and rating announce name, current value and min/max, and update
      as they change.
- [ ] The checkbox announces its name and checked state.
- [ ] Editable values announce as buttons; activating them opens the editor.
- [ ] Section titles announce as expandable/collapsed.
- [ ] Rolling announces the total via the live region.

Reduced motion / high contrast:

- [ ] With reduced-motion on, rolls and transitions resolve without animation.
- [ ] In Windows High Contrast, section/chip/button borders, the active/selected
      states and focus rings are all visible.

## Known limitations

- **Drag-to-reorder** is pointer-only (the grip is `aria-hidden`); the keyboard
  equivalent is the entry menu's move actions.
- **No screen reader in CI** — this checklist is a manual pass. File issues with
  the reader + OS + Obsidian version if something reads incorrectly.
