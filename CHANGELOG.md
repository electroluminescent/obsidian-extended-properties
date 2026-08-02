# Changelog

## 4.31.1

- Retyping a list-valued type property mapped over values the review guide
  reads as untyped. The values are kept as unknown, which is what they are.

## 4.31.0

- **Tab walks a context menu**, forward and back with shift, moving the same
  selection the arrows move. Tab used to walk straight past an open menu into
  the view behind it.
- **Escape closes a context menu without landing in the note.** Obsidian
  answers Escape by putting focus in the editor, so a keyboard trip through the
  sidebar ended in the note whenever a menu was dismissed. The menu now answers
  the key first, and focus stays on the row it was opened from.
- Two focus checks were looking for a class the view does not carry, so they
  never matched: focus sitting on the row when a menu closed did not count as
  the view's, and the row was left to whatever took focus next. Both now test
  the class the view actually has.

## 4.30.4

- **Holding a key no longer takes the first item as the menu opens.** The hold
  fires while the key is still down, so its repeats and its release landed on
  the menu or popup that had just appeared - and Space and Enter take whatever
  is highlighted there. What is left of that press is now eaten, up to and
  including the release, so the menu opens on its first item and waits.

## 4.30.3

- **Escape returns to the row, not the note.** Obsidian answers an element
  holding focus being removed by putting focus back in the active editor, and
  that landed before the check for whether focus was going spare - so the note
  looked like somewhere the user had chosen to be, and was left alone. Whether
  focus is ours to give back is now decided the moment the overlay lets it go,
  and the row takes it back over the frames that follow, unless focus has since
  gone somewhere in the sidebar deliberately.
- **The popup holds on to the keyboard.** Same cause: the editor took focus
  straight back off it. The popup takes it back in turn for its first moment on
  screen - never from a layer it opened itself, and not for long enough to
  fight a real attempt to leave.
- The focused toolbar button is now ringed in the accent colour, which reads
  against the button's own background; the border colour it used before did
  not.

## 4.30.2

- **The popup shows where the keyboard landed.** It had been taking focus on
  itself, which nothing marks - the container carries no focus ring - so it
  looked as though nothing was focused at all. Focus now goes to a real
  control: the first button on its toolbar, which is visibly focused. Its
  first *field* is still left alone, since focusing one springs its
  autocomplete open.
- The close button moved to the end of the toolbar, so the button the popup
  opens focused is a useful one rather than the one that throws it away.
- Focus is re-asserted over the first few frames after opening, so the tail of
  the press that opened the popup cannot take the keyboard back.

## 4.30.1

- **Focus comes back to the row after the popup closes.** Two things stopped it:
  the popup was still holding focus when it reported itself gone - which reads
  as focus the user chose, and is left alone - and the row it was opened from
  had never truly held focus, only the glow that stands for it. The row now
  takes the focus and the tab stop, the popup lets focus go before reporting,
  and a row rebuilt by a re-render in the meantime is found again by its id.
- **Opening the popup puts the keyboard in it**, rather than leaving it on the
  sidebar behind. This needs 4.30.0 or later installed.

## 4.30.0

- **The settings popup takes the keyboard when it opens.** It had been opening
  behind the scenes as far as the keyboard was concerned: nothing in it was
  focused, so Escape had nothing to reach and Tab carried on from wherever the
  press had left off. The popup itself now holds focus - not its first field,
  which would spring that field's autocomplete open - so Escape closes it and
  Tab walks into its toolbar and rows.
- **A close button on the popup toolbar**, as a way out that does not depend on
  a key: Escape can be claimed by whatever else is listening, and a press
  outside is not an obvious way to close.
- **A menu opened by a hold keeps its highlighted first item.** The highlight
  was going on and coming straight back off, because a menu opened mid-press
  gets the rest of that press - the release, and the drift of the cursor around
  it - on the menu that has just appeared underneath. The highlight is now put
  back once the press ends, and only when nothing is highlighted, so the item
  the cursor genuinely rests on is left alone.

## 4.29.1

- **Escape closes the settings popup.** Two faults, either of which was enough
  to stop it: the handler ignored the key whenever it came from inside the popup
  - the usual case - and the check for a layer in front matched elements merely
  present in the DOM, which Obsidian's parked suggestion container and menu
  always are. Escape now closes it wherever focus is, and only a layer actually
  on screen takes the key first. It listens both directly and through Obsidian's
  keymap, so whichever sees the key first, the popup closes.
- **Opening a menu highlights its first item**, so Enter takes it or the arrows
  move on, instead of a key press being needed just to enter the list. The
  highlight is Obsidian's own selection, not a mark of ours, so the menu's idea
  of where you are stays true.

## 4.29.0

- **One overlay at a time.** A context menu and the property-settings popup are
  opened by different gestures on the same row, and each only knew how to close
  its own kind - so a hold after a right click left two of them stacked. They
  share one slot now: opening either closes whatever was open, whichever gesture
  or surface it came from.
- **Closing one hands focus back to the control that opened it**, so Tab carries
  on from there instead of restarting at the top of the view. Focus is only
  restored when it was left dangling: if you have already clicked or tabbed
  somewhere deliberate, that wins.
- Escape now closes the settings popup through Obsidian's keymap rather than a
  listener of our own, which its own scope claimed first. A suggestion list,
  menu or modal opened from inside the popup still answers Escape before the
  popup does, because it pushes its scope above it.

## 4.28.0

- **The menu button answers to held and double keys.** Holding Enter or Space
  on it runs whatever the hold gesture is mapped to - the property settings by
  default - with the same charging ring a press draws; two quick taps run the
  double-click mapping; one tap still opens the menu. So a keyboard reaches
  every mapped action, not just the one action the button carries. The same
  applies to a card's menu button in a note.
- With a double-tap action mapped, a single tap waits out the double-tap window
  first, and a key released elsewhere never leaves a ring charging.

## 4.27.2

- **Tab reaches every control again, not only the values.** The chain was
  limited to fields to fill, which meant it skipped the steppers, roll buttons,
  chips, menu buttons and section headers that plain tabbing used to reach. It
  now stops on anything a keyboard can operate, in screen order, still opening a
  value it lands on. The row wrapper (which carries a tabindex for arrow
  navigation) and disabled controls are passed over.
- The era chip on a date is keyboard-operable now - focusable, with Enter or
  Space opening its era menu.

## 4.27.1

- Opening on arrival is now a setting - *Tab opens the field*, with the other
  interaction settings, on by default. Off, Tab only moves the focus and Enter
  or Space opens what it lands on.

## 4.27.0

- **Tab fills in a note.** Tab moves to the next value and opens it, so you can
  type straight away; Shift+Tab goes back. The chain now covers checkboxes and a
  list's add button as well as text and number fields, in the order they appear
  on screen, and skips anything inside a collapsed section.
- It works whether or not a field is already open - Tab from a value you clicked
  into, or from one you reached with the keyboard - and a field opens on arrival
  whatever gesture the mouse is set to, single or double click.
- Running out of fields hands the key back to the browser, so focus leaves the
  sidebar normally rather than being trapped in it.

## 4.26.0

- **An empty value is a strip to click, not a dash to hit.** The value cell now
  takes the row's free width and routes its own presses to the value, so
  clicking anywhere in that area starts editing - the way a properties panel
  behaves. Content stays right-aligned, so nothing moves; the area lights up on
  hover to show what it is.
- Presses on a child of the cell still belong to that child (a link opens, an
  era chip picks an era), and the cell itself is not marked editable - so a hold
  or right click over the empty part still reaches the row's own gestures
  instead of being swallowed.

## 4.25.1

- **No more strip of settings scrolling above the search bar.** The bar was
  sticky, and a sticky element parks at its scroll container's padding box -
  Obsidian's container, not ours - so rows scrolled into that strip stayed
  visible above it, with nothing of ours able to reach up and cover them. The
  bar now scrolls with the content, and switching tabs scrolls back to it.

## 4.25.0

- **Nine settings tabs instead of seventeen**, each holding related sections
  with their headings intact:
  - **Types** - the type list and Defaults
  - **Sections** - new section defaults
  - **Modifiers** - the building blocks
  - **Short forms**
  - **Dice & rolls** - dice, rolls and saved rolls
  - **Editing outside edit mode**
  - **Interface** - typography, interface features, Obsidian, always-hidden
    properties and UI text
  - **Features** - features and value types
  - **Reset**, last
- Tabs follow that order rather than the order the body happens to render in,
  and a section no tab claims still gets one of its own, just before Reset - so
  a new section is never lost by forgetting to list it.
- Searching now works section by section within a tab: a matching heading shows
  its section whole, and a section's blurb travels with the section rather than
  with a row that happened to match.

## 4.24.1

- The intro paragraph above the settings is gone; the tabs and the search box
  start the tab.
- Section descriptions line up with their rows again. They moved one level
  deeper when the body became tabs - inside the section's panel - and the rule
  that aligns loose copy only reached the level above.

## 4.24.0

- **The settings are tabs now**, one section at a time instead of one long
  scroll: Type, Defaults, Dice, Rolls, Features and the rest. The body is still
  written as a single document and partitioned by its headings when it renders,
  so a new section becomes a tab on its own - there is no list to keep in step.
- **A search box above the tabs filters every section at once.** Matching rows
  appear under their section heading, so a result says where it lives; a
  section whose heading matches shows whole, which keeps the bespoke editors
  (types, macros, short forms) findable. A clear button empties the box - the
  settings window claims Escape before a field inside it sees it.
- The open tab and the search text survive the re-render that follows a change,
  and the box keeps focus and caret while you type.

## 4.23.0

- **A text property can edit in a box that grows.** *Options -> Text ->
  Expanding text box* swaps the one-line field for a text area that follows its
  content up to twelve rows and then scrolls, for paragraph-length values like
  a description. Enter adds a line; Ctrl/Cmd+Enter, Tab or clicking away saves,
  Escape cancels. The value keeps its line breaks and wraps when shown, instead
  of being cut to a single line. Off by default, and off means the single-line
  field with value suggestions, unchanged.
- **Lists can be added to without entering edit mode.** The add button used to
  appear only while arranging a layout, which left the right-click menu as the
  only way to fill a list while entering data. It is always there now - quiet
  until the row is hovered - and the picker it opens still adds a known value on
  click and stays open for the next one.

## 4.22.0

- **A double click is now a mappable gesture too.** *Double click on a
  property* joins click, hold, right click and right-click-and-hold, with the
  same choices - context menu, property settings, focus, nothing - and defaults
  to nothing, so no vault changes behaviour on upgrade.
- Values keep their own behaviour: a double click on the value opens its editor
  when that is the activation gesture chosen for it, and the row's mapping
  applies to the rest of the row. With a click action mapped as well, the click
  waits out the double-click window first, so a double click no longer fires
  the single-click action twice on its way.

## 4.21.2

- **Repeating an action no longer stacks context menus.** Obsidian dismisses a
  menu when a press lands outside it, but the controls that open ours stop that
  press from travelling (otherwise the row's gestures fire too), and a keyboard
  activation dismisses nothing - so pressing the same button twice left two
  menus on screen, slightly offset. Every menu the plugin opens now goes through
  one place, and opening one closes whichever was open before it. That covers
  the row menu, the type chip, sections, inline cards, the table, dice and date
  menus alike.

## 4.21.1

- **Space on the menu button opened two menus.** The row is a focusable group
  whose own Enter/Space opens its menu, and that listener is delegated - so a
  key pressed on a control inside the row reached it as well, and both acted.
  The row's activation now applies only when the row itself has focus; a
  control keeps its own. Arrows still navigate from anywhere inside, so focus
  is never trapped. This also affected pressing Space on a value, which opened
  its editor and the context menu at once.

## 4.21.0

- **A per-property menu button.** *Appearance -> Menu button* puts a vertical
  three-dot button at the end of the row outside edit mode, opening the same
  menu a right-click does. It is appended after the value type has rendered, so
  it sits to the right of the roll button where there is one and at the end of
  the row where there is not - the same for every data type, every layout mode,
  and for cards in notes (which open their own card menu). Off by default.
- The edit-mode menu button now draws the same vertical-dots icon instead of
  three full stops, so the two are one control in two places.

## 4.20.0

- **Single click can open a value outside edit mode.** A new *Editing outside
  edit mode* section sets the gesture per surface - property values, checkboxes,
  proficiency checkboxes, values in notes, table cells - so the sidebar can be a
  data-entry surface rather than a display that guards its values. Every surface
  defaults to double click, exactly as before; nothing changes until you say so.
  Edit mode still opens on a single click, since that mode is for arranging.
- Checkboxes set to single click toggle on their own click, so they take one
  hit rather than two quick ones. Enter and Space keep working either way.
- A click on a link inside a value follows the link instead of opening the
  editor, and the second click of a fast double click no longer reopens what
  the first click just opened.

## 4.19.1

- **The type chip carries the type's own menu.** Right-click it for everything
  the settings tab offers per type - retype the note, rename, choose or reset
  the icon, reset the layout, copy the snippet, delete - next to the note it
  applies to instead of four clicks away in settings.
- Deleting a type is one code path now, shared by the chip and the settings
  tab: the layout, the icon and the vault layout file go, and the notes keep
  their value (they stop matching a layout, which is undoable; losing the
  property would not be).

## 4.19.0

- **Types can be renamed.** Each type row has a rename button; the layout, the
  icon and any rolls scoped to that type move with it. This is what lets a vault
  adopt a property it already uses - point the type property at `category`,
  rename `sims` to `sim`, and those notes are recognized straight away, with no
  layout rebuilt and nothing renamed in the notes.
- **Optionally rewrite the notes too.** The dialog counts the notes carrying the
  old value up front ("Also update 214 notes") and, when left on, changes the
  value in each of them - list values keep their other entries, and renaming
  onto a value a list already holds does not duplicate it.
- **Renaming onto an existing type merges the two**, with a choice of which
  layout survives. The dialog says so before you commit, and its button reads
  Merge rather than Rename.
- A rename no longer resurrects the old type. Between changing the settings and
  rewriting the notes the two disagree by design, and the sidebar - which adopts
  any type it does not recognize - would recreate the one just renamed away.

## 4.18.4

- Review compliance: the popup's dismissal and control checks use Obsidian's
  cross-window `.instanceOf(...)` rather than `instanceof`, so they still hold
  in a popped-out window - where an element comes from that window's own class
  and a plain `instanceof` is false.

## 4.18.3

- Review compliance: `ValueTypeDef.menuItems` declares `this: void`. The
  settings popup holds the function on its own to decide whether to offer its
  value-actions button, so the contract that it never depends on its defining
  object is now stated in the type rather than assumed.

## 4.18.2

- **Autocomplete shows up in the settings popup.** The list was opening all
  along - correctly placed, fully rendered - with the popup painted on top of
  it, because both sat on the same layer and Obsidian's suggestion container
  precedes the popup in the document. The popup now sits one layer lower, so
  suggestions, menus, notices and modals all come out in front of it, exactly
  as they do over the full property settings.
- Choosing a suggestion no longer throws: the rows underneath were rebuilt
  while the list was still closing over the field, which aborted the rebuild
  (`NotFoundError` on the container). This affected the full settings window
  too.

## 4.18.1

- **The settings popup only closes when you click away from it.** Using a row
  could dismiss it: a native dropdown draws its option list outside the page,
  so the press that picked an option was read as a press elsewhere. The same
  went for anything a row opens beside the popup - autocomplete lists, menus,
  the icon picker and other prompts - and Escape closed the popup instead of
  the list or modal in front of it. All of those now belong to the popup, so
  its dropdowns and suggestions behave exactly as they do in the full property
  settings.
- Rows that rebuild after a change (renaming the property, switching its data
  type) keep their scroll position instead of jumping back to the top.

## 4.18.0

- **One press, one action on mobile.** A touch screen has a single long press,
  and it is also the platform's context-menu press - so a hold could fire the
  hold mapping and the right-click mapping at once. Mobile now routes every
  long press through the *right click and hold* option and swallows the native
  context menu. The interaction settings show that one option there (named
  "Long press on a property") instead of four, and desktop carries a note
  explaining what mobile will do.
- **The settings popup arrives as a sheet on mobile**, the way menus do there:
  along the bottom edge, full width, with thumb-sized toolbar buttons.
- **The popup covers the whole context menu.** Value-type actions - edit value,
  pick a color, add an item, roll - were the one group with no equivalent row
  in the settings body; they now hang off a toolbar button, so nothing is
  reachable only by right-clicking.

## 4.17.1

- **Settings text lines up again.** Drawing the tab inside a setting row (4.17.0)
  left the loose prose - the intro, section blurbs like "Crit threshold per die
  size...", the override search field and its hints - flush against the panel
  edge while every setting row sat indented, and the intro sat hard against the
  top in body-sized text. The tab now measures a real row's padding and matches
  it on all three sides, and the intro reads as a description like every other
  blurb.

## 4.17.0

- **The settings tab renders on Obsidian 1.13 again.** 1.13 draws a tab from its
  setting definitions and only falls back to `display()` when there are none - and
  in 1.13.4 that fallback did not fire here, so the tab showed an empty
  placeholder. It now declares a `render` item and draws itself inside that row,
  which also puts it back in the settings search (every section heading is an
  alias, so searching "dice" or "features" finds it).
- Removed three redundant type assertions flagged by the plugin review.


Everything since 4.10.1, grouped by what it changes.

### Works with an existing vault

- **The type property is configurable.** *Settings -> Types -> Type property* (default `Type`). Point it at a property you already use - `category`, `kind`, anything - and the plugin recognizes those notes retroactively: the sidebar match, the property index's buckets, the table view and the properties-panel menu all read the configured name, and assigning a type writes to it. No renaming, no double entry, no clash with other plugins that use `Type`.
- **The interface speaks that name.** Every string that means the note-type concept renders your property's name - the no-type screen, the chip tooltip, the entry-options heading, the table view and command, settings headings and prompts, import/export, macros, snapshots, layout files, the inline sheet block. Wherever the name appears in prose it carries a slight accent tint - applied by a pass over the rendered settings tab and sidebar, so it reaches strings that reach the DOM as plain text too. Prose only: values, fields, code and buttons keep the theme's own styling. Renaming the property re-renders the settings tab at once. Strings about *data* types keep saying "type" and are never highlighted - "data type", "value type", "number type", "date/time type" and friends name the value-type system, not this one, which matters most when the property is itself called Type.

### Types in the sidebar

- **The type chip is an editor.** Click it for a text field with a dropdown of every type, filtered as you type. Pick one to retype the note; type a new name to create it, with a prompt to start it as a copy of the current layout or empty.
- **Per-type icons**, chosen from Obsidian's icon picker, with a configurable default (`tag`) for types that define none, and a reset button to fall back to it.
- **A note with no type** offers "+ New type" alongside the existing assign buttons, and those buttons now work on the first click.
- **The header sheds in stages** as room runs out: the Edit button collapses to its icon, then the chip drops its label and keeps its icon, then both wrap onto their own line beneath the title with their labels back.

### Interaction mapping

- **Four mappable gestures** on a property - click, hold, right click, right click and hold - each set to Context menu, Property settings, Focus, or Nothing. Hold and right-hold default to the property settings; right click to the menu; plain click to nothing.
- **Hold to configure**: a ring charges around the cursor (500ms, adjustable 200-2000ms) and opens a scrollable popup carrying the property's full settings page - compact, menu-shaped, with an icon toolbar mirroring the context menu (open full settings, hide/show, clear value, remove row/column, remove entry) and descriptions on hover. Animated in and out.
- **In-note cards and chips** share the same mapping, each keeping its own menu contents.

### Building blocks

- **Each modifier building block carries its own reference suffix**: `Level.pb` applies the proficiency bonus to Level, `Strength.am` the ability modifier to Strength - in expressions, derived formulas and inline chips. Defaults `pb` and `am`; blank means not referenceable.
- The modifier short-form setting moved into the building-blocks section, beside the per-block suffixes.

### Data entry

- Tab and Shift+Tab commit the current value and move to the next or previous editable value in the sidebar.

### Fixes

- A quick click no longer charges the hold ring; releases anywhere cancel it.
- Column dividers are drawn only between cells that genuinely sit side by side, and the wrap divide marks the wrapped row rather than every cell - removed entirely in grid mode, where it flickered and left artefacts.
- An edit followed by a focus change no longer loses its value: a reload mid-write keeps keys whose write is still queued (this silently dropped type assignments, and could drop ordinary property edits).
- The settings tab renders again - 4.10.1's `getSettingDefinitions()` made Obsidian render definitions instead of the tab, leaving every setting inert.
- Review compliance: Obsidian's `createEl`/`createDiv`/`createFragment` helpers replace all `document.create*` calls.

---

Older releases are listed in the GitHub release history.
