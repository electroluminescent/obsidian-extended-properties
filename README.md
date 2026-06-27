# Extended Properties (Obsidian plugin)

A data-driven, fully arrangeable property sidebar that transforms how you organize and interact with note metadata. Activate it for any note whose `Type` matches a configured type; each type gets its own custom layout defined visually in the sidebar itself. Works on desktop and mobile.

The core is domain-agnostic: it renders sections of property entries with rich value types and extensible features. Domain-specific capabilities—like the bundled **D&D 5e character sheet** module—plug into the core through registries and can be toggled in settings. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design and extension guide.

## Installation

**Community plugins** (once published): in Obsidian, open *Settings → Community plugins → Browse*, search for "Extended Properties", install, and enable.

**BRAT (beta):** install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin, then *Add beta plugin* with this repository's URL. BRAT tracks the latest GitHub release.

**Manual:** download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest) and copy them into `<your vault>/.obsidian/plugins/extended-properties/`, then enable the plugin in *Settings → Community plugins*.

## Features

### Core Sidebar UI

**Locked vs Edit Modes.** Locked by default for safe interaction: tick checkboxes, nudge numbers with − / +, **double-click** a value to edit it inline, **right-click** any entry for quick actions. Click **Edit** to enter arrangement mode: drag ⠿ handles to reorder entries within sections, use ⋯ menu or right-click for options (*Configure* opens the full property editor), click section titles and labels to rename them, add new properties at each section's bottom, create blank spacers for visual separation, or insert table-of-contents entries. **Done** button offers saving or undoing everything in the session—including value edits made while arranging. Value edits update in place and preserve scroll position during navigation.

### Section Styling & Layout

Customize each section independently: name, icon, icon color, collapsibility, transparency, sticky positioning (pins below the header), height presets with internal scrolling, horizontal and vertical dividers, accent color, background color, control button colors, and title font size. Choose from three layout modes to match your data structure:

- **List mode**: Entries stack vertically, ideal for linear property lists.
- **Columns mode**: Entries arranged in multiple columns, great for compact grids of related fields.
- **Grid mode**: Fixed 2D grid with row and column rail controls, blank cells, and precise alignment—perfect for structured data tables and spreadsheet-like layouts.

Each mode is independently configurable per section, and section visibility can be toggled (hiding empty sections outside edit mode is the default behavior).

### Rich Value Types

Every property entry has a configurable data type that controls how it renders and edits:

- **Text**: Plain text with vault-wide property autocompletion, Obsidian link rendering (`[[note]]` support), and multi-line input.
- **Number**: Integer values with toggleable − / + steppers, optional slider (linear, root, or exponential response curve), min/max bounds (blank bounds default to the property's range across all notes), and clamping. Roll buttons integrate with the dice system.
- **Decimal**: Floating-point values with step controls and formula support.
- **Derived**: A read-only number computed by the influence engine (see below) — the sum of other properties' contributions. Click the value to store a per-note override; clear it to return to the derived sum.
- **Formula**: Advanced numeric type—enter an expression like `sqrt(x)` or `level * 2 - 1`. The expression maps to a slider, and typing a value solves the formula backwards to update the source property.
- **List**: Renders as chips/tags. Edit inline or via a modal list editor.
- **Checkbox**: Boolean toggles, editable in locked mode.
- **Color**: Interactive color picker with multiple color space support (RGB, HSL, OKLCH, OKLab), eyedropper tool, out-of-gamut indicator, and direct hex/input entry. Select your preferred color space globally in settings.
- **Image**: Render images from URLs or Obsidian embeds (`![[image]]`). Includes a zoomable modal viewer and height preset controls (small, medium, large, unlimited).
- **Iframe**: Embed external web content with configurable width, height, and scaling.

### Entry Types

Beyond properties, the sidebar supports several entry kinds for extended functionality:

- **Property (prop)**: Standard frontmatter key-value pairs.
- **Blank**: Invisible spacer for visual separation during arrangement.
- **Table of Contents (toc)**: Auto-generated entry that links to all headings in the current note. Respects collapsible sections and updates dynamically.

(The former bespoke "computed" entries are gone: proficiency bonus, initiative and the like are now ordinary **derived** properties built on the influence engine.)

### Derived Values & the Influence Engine

Any numeric or derived entry can carry a list of *influences* — terms summed into its modifier. Each term is built from user-editable blocks:

- **Source**: a property, referenced by name. Chains resolve through other derived properties (a derived value feeding another derived value) up to a configurable depth (default 8, set in the plugin settings).
- **Derivation**: "value as-is", a named formula block from settings (seeded with *Ability modifier* and *Proficiency bonus* — rename, edit or delete them freely), or a custom formula in `x`.
- **Expression**: a full expression over many properties — `floor((STR + DEX) / 2) + max(PB, 2)` — referencing them by name or short form (`[Quoted Names]` for spaces). Functions: `floor`, `ceil`, `round`, `min`, `max`, `clamp`, `abs`, `if`, comparisons and `&&`/`||`; your derivation blocks are callable too (`abilityMod(Dexterity)`). A typo degrades to "—" with a tooltip and reference cycles are detected explicitly, never breaking the sheet.
- **Sign**: added or subtracted.
- **Toggle**: a list property that switches the term on/off per note — the generic form of proficiency. The row gets a checkbox, and the term in the chain can be double-clicked to toggle it.

Rows display the chain as short forms (`INT + DEX − AGE`), the dice breakdown (`2d20` with a die pictogram) and the total. **Short forms are configured per number property** (in its options), kept **unique across properties** — setting one already in use prompts to overwrite, and the previous owner is re-derived by walking the name (`Dexterity → DEX`, `Dexterous → DET`). A property's name and its short form are **interchangeable** wherever you reference it, and both autocomplete as you type (chains, expressions, the dice roller, inline `val:`/`roll:`). The data-type tag, chain, dice and die icon each have their own show toggle, and whatever is enabled is shown or hidden dynamically as the sidebar is resized.

### Dice & Rolls System

Enable the rolling feature (default-on; toggle in Settings → Features) for full dice support:

- **Roll buttons** on numeric and derived properties roll the configured dice plus the entry's influence sum; the row reads like the roll (`STR + PRO 2d20 +5`).
- **Preset dice**: d2, d4, d6, d8, d10, d12, d20, d100, or custom die sizes with any quantity — with isometric die icons in the dice menus and inline before the notation (sources in `assets/dice/`).
- **Dice notation**: Type any roll in the dice roller — `2d6kh1 + 1d8 + DEX + 3` — with keep/drop (`kh`/`kl`/`dh`/`dl`), exploding (`!`/`!N`), reroll (`rN`/`roN`), success counting (`>=N`, `>N`, `<=N`, `<N`, `=N`) and property references (by name or short form). The chips and the text field are two views of one roll. A **function bar** inserts notation (die picker, keep/drop, explode, reroll, success), and references autocomplete as you type. Crit thresholds per die size and the fail-on-1 rule are configurable in Settings → Dice.
- **Roll history panel**: A durable, plugin-wide log that survives note switches and reloads (capped, configurable in Settings → Rolls). Toggle the full chain vs. label & result, filter to the current note, clear it, and re-run any in-session roll by clicking it. *Export roll history to a note* writes it out as a Markdown table.
- **Saved rolls (macros)**: Reusable "custom roll objects" — name a chain like `2d6 + 1d8 + 3`, then roll it from the dice roller, from the command palette (one command per macro), with optional per-type scope. Build one in the roller and *save as macro*, or manage them in Settings → Rolls.
- **Roll modes**: Normal, advantage (roll twice, take higher), and disadvantage (roll twice, take lower)—selectable per roll.
- **Skills value type (legacy)**: The record-based list type is kept for existing notes and offers a one-click *Convert to property entries* that turns each record into a derived property (proficiency becomes a togglable influence backed by a list property). New layouts use sections of derived properties instead.

### Inline Rolls & Properties

Enable the inline feature (default-on; toggle in Settings → Features) to project the sidebar's engine into note bodies (reading mode):

- **Inline rolls**: `` `roll: 2d6+DEX` `` becomes a clickable roll chip — full dice notation and property references, with `` `roll(adv):` `` / `` `roll(dis):` `` for advantage/disadvantage. Rolls go through the same animation and history as the sidebar, with no view open.
- **Inline properties**: `` `prop: Strength` `` shows the note's live value and is click-to-edit, writing back to frontmatter.
- **Inline values**: `` `val: INT` `` renders a property (by name or short form) as a chip styled like a roll — with the property's icon, if it has one. `` `val: INTs` `` (the modifier suffix) shows that property's *modifier* instead of its value. Link values are clickable to navigate, with a right-click *Edit value* action.
- **Modifier references**: append the configurable suffix (default `s`) to any reference to use a property's modifier rather than its value — in expressions, `` `roll:` `` (`2d6 + INTs`), and `` `val:` ``. If a property's modifier is overridden, that override is used.
- **Statblock block**: an `ep-sheet` code block projects the note type's sections as a compact read-only statblock (derived values computed, roll buttons included). List section titles inside the block to show only those.

Values resolve against the note the code lives in, so embeds and hover previews stay correct. Chips render in both **reading mode and Live Preview**. In Live Preview, moving the caret just before, into, or just after a chip reveals its raw text for editing; on a roll chip, right-click for the usual roll menu (advantage/disadvantage, number of rolls) plus an *Edit source* action.

### Obsidian Integration

**Property panel sync**: Properties displayed in the sidebar can be automatically hidden from Obsidian's own properties panel (default behavior). A right-click menu on Obsidian's properties panel shows a "Hidden properties" list, and you can toggle visibility per property without removing data. Disable this behavior entirely in settings if preferred.

**Property index**: Vault-wide search for all properties across your vault, enabling autocompletion suggestions in text properties and helping you discover available fields.

### Customization & Accessibility

**Per-property styling**: Icon, icon color, label text override (alias), label size, value size, label color, value color, and show toggles (label, data type tag, when empty, modifier chain, dice, die icon, per-term chain visibility and checkboxes, Obsidian panel).

**Tabbed section options**: A property's settings open inside its section's options modal, which has one tab per property plus the section itself. Ctrl/Cmd-click toggles tabs, Shift-click selects ranges, and dragging across tabs sweeps a selection — multi-selections show only the shared settings (identical across data types and sections), and only the settings you change are written to every selected tab. Tabs can be grouped by column, by row, or by data type.

**Typography controls**: Set global font family, base font size, and separate sizing for labels, values, list items, and section titles—use 0 for theme defaults.

**Theme colors**: Customize accent, background, and control colors per section, with overflow and contrast-aware displays.

**Keyboard & touch friendly**: Numeric steppers work with keyboard (± / click), inline edit activates via double-click or Enter, and the sidebar is fully responsive for mobile devices.

### Localization & Text Override

**Multi-language support**: Built-in English and German; add more by contributing locale files.

**String overrides**: Override any UI text string individually via a searchable editor in Settings → Language, without touching code. Useful for domain-specific terminology or personal naming preferences.

## Advanced Features & Domain Modules

### Extensible Architecture

The plugin's architecture is built around registries, allowing feature modules to extend the core without modifying the codebase. Any module can register:

- **Value types**: Custom data renderers and editors (e.g., the skills type).
- **Entry kinds**: Custom entry renderers (e.g., the roll panel).
- **Cluster addons**: Extra UI cells appended to numeric rows (e.g., roll buttons, modifier badges).
- **Derivations**: Modifier math blocks (also user-editable in settings).
- **Section templates**: One-click section presets in the edit toolbar to build common layouts.
- **Layout presets**: Full default layouts for new note types.
- **Skill presets**: Pre-populated record lists for the legacy skills type (e.g., D&D 5e skill lists, saving throws).

All feature modules can be toggled on/off in Settings → Features without breaking existing layouts or data.

### D&D 5e Character Sheet Module

A complete D&D 5e character sheet built entirely as a feature module on top of the core:

**Ability scores & modifiers**: Standard six abilities (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma). Scores automatically compute ability modifiers using D&D 5e rules. Roll buttons on ability modifiers let you make ability checks with advantage/disadvantage support.

**Saving throws & skills**: Sections of derived properties — one per save/skill — combining the ability modifier with a proficiency term toggled through the classic `Saving Throw Proficiencies` / `Skill Proficiencies` list properties. Legacy entry kinds are migrated automatically on first load.

**Initiative & proficiency bonus**: Ordinary derived properties (`Dexterity → ability modifier`, `Level → proficiency bonus`) with roll integration — no bespoke widgets.

**Character vitals**: Hit points, armor class, speed, proficiency bonus, and other standard fields.

**Section templates**: The module includes pre-built sections—Contents, Details, Vitals, Ability scores, Saving throws, Skills—all available as one-click templates in the edit toolbar. Applying a template also creates any missing modifier-source properties as real entries and writes the template's properties to the note (empty, hidden from Obsidian's panel).

**No default layout**: New note types always start empty; add the template sections you want. The full character sheet remains available as a layout preset.

**Data storage**: Everything is stored as plain note properties (frontmatter), making it searchable and portable. No proprietary formats or hidden data.

## Settings & Configuration

**Global defaults**: Set default data type for new properties, default section layout mode, default color space, typography (font family, sizes for labels/values/titles/lists), section appearance (transparent, sticky, collapsible, dividers, size limits).

**Features toggle**: Enable/disable optional modules (D&D 5e, dice rolling, etc.) without deleting data.

**Language & localization**: Choose UI language and override individual strings via searchable editor. Missing translations gracefully fall back to English.

**Property hiding**: Manage which properties are hidden from Obsidian's properties panel. Sidebar-shown properties can be auto-hidden (default), and you can manually hide additional properties.

**Note type activation**: Select which `Type` values activate the sidebar, and define a unique layout per type. There is no default type — give any note a `Type` value and it is adopted with an empty layout.

**Modifier building blocks**: Named formulas (in `x`) that influences apply to source values, plus the modifier chain depth and per-property short forms — all editable.

## Theming

Every plugin surface reads its sizes and colours from `--ep-*` CSS variables, each falling back to the current Obsidian theme value, so themes and the [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin can restyle Extended Properties without `!important`. A Style Settings panel (**Extended Properties**) is bundled; you can also set any variable yourself in a CSS snippet, e.g. `body { --ep-radius: 12px; --ep-accent-default: #c678dd; }`.

| Variable | Default | Controls |
| --- | --- | --- |
| `--ep-accent-default` | `var(--text-accent)` | Section title / icon / drop-marker accent (per-section colours still win) |
| `--ep-control-default` | `var(--interactive-normal)` | Stepper / control button background |
| `--ep-section-bg` | `var(--background-secondary)` | Section background fill |
| `--ep-section-border` | `var(--background-modifier-border)` | Section border colour |
| `--ep-section-title-bg` | `var(--background-secondary)` | Sticky section-title background |
| `--ep-radius` | `8px` | Corner radius of sections, cards and chips |
| `--ep-section-gap` | `10px` | Vertical gap above each section |
| `--ep-section-pad` | `4px 8px 6px` | Section padding |
| `--ep-chip-bg` | `var(--background-modifier-hover)` | List / tag value-chip background |
| `--ep-chip-fg` | `inherit` | Chip text colour |
| `--ep-chip-radius` | `var(--ep-radius)` | Chip corner radius |
| `--ep-rating-color` | theme accent | Rating stars / pips |
| `--ep-font`, `--ep-size-base`/`-label`/`-value`/`-title`/`-list` | theme | Typography (also set from the plugin's own settings) |

Toggle **Flat sections** in Style Settings (or add the `ep-flat-sections` class to `body`) to drop section borders and backgrounds for a borderless look.

## Backward Compatibility & Data

- `data.json` written by v1 loads unchanged—the data model is stable.
- Persisted data is plain YAML frontmatter, fully compatible with Obsidian and other tools.
- Feature modules extend entries using open-ended field storage; disabling a module preserves its data (displayed as "Unavailable" stubs until the module is re-enabled).
- Migrations are applied automatically for schema updates.

## Development

### Setup
```bash
npm install --legacy-peer-deps   # obsidian pins @codemirror/state
```

### Build & test
```bash
npm run build      # esbuild: src/main.ts → main.js
npm run dev        # continuous rebuild on file changes
npm run typecheck  # tsc --noEmit (strict)
npm test           # vitest over the pure modules (utils/*, core/*)
```

Tests live in `tests/` and cover the pure, Obsidian-free modules: dice math, the dice and expression engines, the influence/short-form rules, cross-note references, and a golden settings-migration fixture. CI (`.github/workflows/`) runs typecheck → test → build on every push; pushing a `MAJOR.MINOR.PATCH` tag that matches `manifest.json` publishes a draft release with `main.js`, `manifest.json`, and `styles.css` attached.

### Project Structure

Start with [ARCHITECTURE.md](ARCHITECTURE.md) for a complete overview. The codebase is organized by layer:

- **`src/core/`**: Data model, registries, the influence engine, and extension contracts—no UI or feature knowledge.
- **`src/ui/`**: View orchestration, renderers, modals, menus, and components.
- **`src/i18n/`**: Localization service and language dictionaries.
- **`src/features/`**: Optional modules (D&D 5e, dice rolling) that extend the core.
- **`src/utils/`**: Shared utilities (color, dice, formulas).
- **`assets/dice/`**: The isometric die SVGs (also embedded as Obsidian icons).

### License

MIT
