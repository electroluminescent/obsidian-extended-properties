# Extended Properties (Obsidian plugin)

A data-driven, fully arrangeable property sidebar that transforms how you organize and interact with note metadata. Activate it for any note whose `Type` matches a configured type; each type gets its own custom layout defined visually in the sidebar itself. Works on desktop and mobile.

The core is domain-agnostic: it renders sections of property entries with rich value types and extensible features. Domain-specific capabilities—like the bundled **D&D 5e character sheet** module—plug into the core through registries and can be toggled in settings. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design and extension guide.

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
- **Number**: Integer values with optional slider, min/max bounds, and clamping. Roll buttons integrate with the dice system.
- **Decimal**: Floating-point values with step controls and formula support.
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
- **Computed**: Read-only derived entries that calculate values on the fly. Used by the D&D module for proficiency bonus and initiative, but extensible for custom domain logic.

### Dice & Rolls System

Enable the rolling feature (default-on; toggle in Settings → Features) for full dice support:

- **Roll buttons** on numeric properties show a dice notation tag (e.g., "2d6 +3") and include a modifier badge.
- **Preset dice**: d2, d4, d6, d8, d10, d12, d20, d100, or custom die sizes with any quantity.
- **Roll log panel**: Persistent history of all rolls in the current note with timestamps.
- **Roll modes**: Normal, advantage (roll twice, take higher), and disadvantage (roll twice, take lower)—selectable per roll.
- **Skills value type**: A specialized list type for recording skills, saving throws, attacks, or any roll-enabled records. Each record stores: name, proficiency checkbox, modifying property (derives the bonus), custom modifier override, custom dice, and roll integration. Everything is editable inline or via right-click menu. Records can be reordered by drag-drop.

The skills type is fully configurable: set how modifiers are derived (raw value vs. ability modifier), where the proficiency bonus comes from (fixed value, a level property, or none), default dice per skill, and apply record presets to populate standard lists.

### Obsidian Integration

**Property panel sync**: Properties displayed in the sidebar can be automatically hidden from Obsidian's own properties panel (default behavior). A right-click menu on Obsidian's properties panel shows a "Hidden properties" list, and you can toggle visibility per property without removing data. Disable this behavior entirely in settings if preferred.

**Property index**: Vault-wide search for all properties across your vault, enabling autocompletion suggestions in text properties and helping you discover available fields.

### Customization & Accessibility

**Per-property styling**: Icon, icon color, label text override (alias), label size, value size, label color, value color, and visibility controls (hide label, hide when empty, show in Obsidian panel).

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
- **Entry kinds**: Custom entry renderers (e.g., computed entries).
- **Cluster addons**: Extra UI cells appended to numeric rows (e.g., roll buttons, modifier badges).
- **Section templates**: One-click section presets in the edit toolbar to build common layouts.
- **Layout presets**: Full default layouts for new note types.
- **Skill presets**: Pre-populated record lists for the skills type (e.g., D&D 5e skill lists, saving throws).

All feature modules can be toggled on/off in Settings → Features without breaking existing layouts or data.

### D&D 5e Character Sheet Module

A complete D&D 5e character sheet built entirely as a feature module on top of the core:

**Ability scores & modifiers**: Standard six abilities (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma). Scores automatically compute ability modifiers using D&D 5e rules. Roll buttons on ability modifiers let you make ability checks with advantage/disadvantage support.

**Saving throws & skills**: Pre-configured lists using the generic skills type. Saving throws derive from ability scores; skills can derive from abilities or use fixed modifiers. Proficiency checkbox adds the character's proficiency bonus (derived from Level). One-click presets populate standard lists; legacy list-type saves/skills are migrated automatically on first load.

**Attack rolls & initiatives**: Roll buttons for attack checks and initiative (both configured as computed entries). Initiative derives from Dexterity modifier and can be rolled with advantage.

**Character vitals**: Hit points, armor class, speed, proficiency bonus, and other standard fields.

**Section templates**: The module includes pre-built sections—Contents, Details, Vitals, Ability scores, Saving throws, Skills—all available as one-click templates in the edit toolbar.

**Default layout**: When you create a new note type while the D&D module is enabled, it starts with a full character-sheet layout including all standard sections.

**Data storage**: Everything is stored as plain note properties (frontmatter), making it searchable and portable. No proprietary formats or hidden data.

### Skills Value Type (Detailed)

The skills type is a sophisticated list variant supporting skill checks, saving throws, or any roll-enabled record:

**Record structure** (stored as YAML array in frontmatter):
```yaml
Skills:
  - name: Acrobatics
    source: Dexterity      # property feeding the modifier
    prof: true             # proficiency checkbox
    dice: 2d6              # per-record dice (overrides default)
    mod: 4                 # manual modifier override
```

**Inline editing**: Click any field in a skill row to edit:
- Name (double-click or Enter)
- Proficiency checkbox (toggle)
- Source property (autocomplete from vault)
- Dice (opens dice picker)
- Modifier (number input)
- Roll button (executes a roll with current state)

**Right-click menu**: Reorder (drag handle), set custom dice, adjust modifier, toggle proficiency, or remove a record.

**Options panel** (right-click entry → Configure):
- **Source mode**: How the source property becomes a modifier (raw value vs. ability modifier conversion).
- **Proficiency source**: Where the proficiency bonus comes from (none, fixed value, or derived from a level property).
- **Default dice**: Dice notation for records without custom dice (e.g., "1d20").
- **Preset application**: Load a pre-built record list (e.g., D&D 5e skills, saving throws).

**Presets**: Domain modules can register skill presets—ready-made lists like "D&D 5e Saving Throws" or "D&D 5e Skills". Applying a preset populates records; existing records remain editable.

## Interactive Pickers & Editors

**Icon picker modal**: Search Obsidian's icon library or paste custom SVG for entry and section icons.

**Color picker modal**: Full-featured color picker with:
- RGB, HSL, OKLCH, and OKLab color space input
- Eyedropper tool to sample colors from anywhere
- Live preview of selected color
- Out-of-gamut warning when the color exceeds display gamut
- Direct hex code input and paste
- Recently used color history

**Image viewer modal**: Click an image entry to open a zoomable, pannable viewer with fit-to-screen and full-resolution modes. Supports both URL and `![[obsidian-embed]]` syntax.

**Text input modal**: Multi-line text input for longer text values, with full editor height and scrolling.

**Number/decimal input**: Step controls (− / +), keyboard entry, and optional slider when configured. Numeric types support min/max bounds with optional clamping.

## Drag & Drop & Animations

**Smooth rearrangement**: Drag entry or section handles in edit mode to reorder. FLIP animation (First, Last, Invert, Play) provides smooth visual feedback without layout jank.

**Mobile friendly**: Touch drag is fully supported on mobile devices.

**Session undo**: All layout changes (reordering, renaming, adding/removing entries) are tracked in the edit session. Clicking Done shows a save-or-discard dialog; choosing discard restores the original layout.

## Mobile & Responsive Design

The sidebar adapts to small screens:
- Sections stack vertically even in column/grid modes on mobile
- Touch-friendly button sizes and spacing
- Swipe and long-press support
- All features work identically on desktop and mobile

## Settings & Configuration

**Global defaults**: Set default data type for new properties, default section layout mode, default color space, typography (font family, sizes for labels/values/titles/lists), section appearance (transparent, sticky, collapsible, dividers, size limits).

**Features toggle**: Enable/disable optional modules (D&D 5e, dice rolling, etc.) without deleting data.

**Language & localization**: Choose UI language and override individual strings via searchable editor. Missing translations gracefully fall back to English.

**Property hiding**: Manage which properties are hidden from Obsidian's properties panel. Sidebar-shown properties can be auto-hidden (default), and you can manually hide additional properties.

**Note type activation**: Select which `Type` values activate the sidebar, and define a unique layout per type.

## Backward Compatibility & Data

- `data.json` written by v1 loads unchanged—the data model is stable.
- Persisted data is plain YAML frontmatter, fully compatible with Obsidian and other tools.
- Feature modules extend entries using open-ended field storage; disabling a module preserves its data (displayed as "Unavailable" stubs until the module is re-enabled).
- Migrations are applied automatically for schema updates.

## Localization

**Built-in languages**: English, German.

**Adding a locale**: Create a dictionary file in `src/i18n/locales/<code>.ts`, register it in `main.ts`, and add feature-module translations if desired. Missing keys gracefully degrade to English or a humanized key fallback.

**String overrides**: Every UI string can be overridden individually in Settings → Language, enabling custom terminology without code changes.

## Install

### From Obsidian Community Plugins
*(If published)*

1. Open Obsidian Settings → Community plugins → Browse
2. Search for "Extended Properties"
3. Click Install, then Enable

### Manual Install
1. Download `manifest.json`, `main.js`, and `styles.css`
2. Create the folder `<vault>/.obsidian/plugins/extended-properties/`
3. Copy the three files into that folder
4. Reload Obsidian (or restart the app)
5. Go to Settings → Community plugins and enable "Extended Properties"

## Development

### Setup
```bash
npm install
```

### Build
```bash
npm run build      # esbuild: src/main.ts → main.js (minified for production)
npm run dev        # Continuous rebuild on file changes
npx tsc --noEmit   # Type checking (strict mode)
```

### Project Structure

Start with [ARCHITECTURE.md](ARCHITECTURE.md) for a complete overview. The codebase is organized by layer:

- **`src/core/`**: Data model, registries, and extension contracts—no UI or feature knowledge.
- **`src/ui/`**: View orchestration, renderers, modals, menus, and components.
- **`src/i18n/`**: Localization service and language dictionaries.
- **`src/features/`**: Optional modules (D&D 5e, dice rolling) that extend the core.
- **`src/utils/`**: Shared utilities (color, dice, formulas).

Every file has a header comment explaining its role. The dependency rules are strict and reviewed:
- `core/` is feature-agnostic
- `ui/` imports only from `core/` and `i18n/`
- Features use registries to integrate without tight coupling
- Only `main.ts` knows which features exist

### Creating a Feature Module

See [ARCHITECTURE.md → How to: add a feature module](ARCHITECTURE.md#how-to-add-a-feature-module) for a complete guide. In brief:

1. Create `src/features/<id>/index.ts` exporting a `FeatureModule`
2. Register entry kinds, value types, addons, templates, and presets via `ctx.registries`
3. Add the module to `FEATURE_MODULES` in `src/main.ts`
4. The module appears as a toggle in Settings → Features automatically

### License

MIT
