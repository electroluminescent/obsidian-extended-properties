# Changelog

## 4.16.9

Everything since 4.10.1, grouped by what it changes.

### Works with an existing vault

- **The type property is configurable.** *Settings -> Types -> Type property* (default `Type`). Point it at a property you already use - `category`, `kind`, anything - and the plugin recognizes those notes retroactively: the sidebar match, the property index's buckets, the table view and the properties-panel menu all read the configured name, and assigning a type writes to it. No renaming, no double entry, no clash with other plugins that use `Type`.
- **The interface speaks that name.** Every string that means the note-type concept renders your property's name - the no-type screen, the chip tooltip, the entry-options heading, the table view and command, settings headings and prompts, import/export, macros, snapshots, layout files, the inline sheet block. Wherever the name appears in prose it carries a slight accent tint - applied by a pass over the rendered settings tab and sidebar, so it reaches strings that reach the DOM as plain text too (values, fields, code and the chip are left alone). Strings about *data* types (the data-type dropdown, Value types, per-value-type descriptions) deliberately keep saying "type": they mean something else.

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
