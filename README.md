# Extended Properties (Obsidian plugin)

A data-driven, fully arrangeable property sidebar. It activates for any note
whose `Type` matches a configured type; each type has its own layout, defined
visually in the sidebar itself. Desktop and mobile.

The core is domain-agnostic: it renders sections of property entries with
rich value types. Domain features — like the bundled **D&D 5e character
sheet** module — plug into the core through registries and can be toggled in
settings. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design and
extension guide.

## Using the sidebar

**Locked vs edit.** Locked by default: tick checkboxes, nudge numbers with
− / +, **double-click** a value to type it, **right-click** any entry for
actions. Click **Edit** to arrange: drag ⠿ handles to reorder, use ⋯ or
right-click for options (*Configure* opens the full panel), click labels to
rename, add properties at each section's bottom. **Done** offers saving or
undoing everything from the session — including value edits made while
editing. Value edits update in place and preserve scroll position.

**Sections.** Name, icon, collapsible, transparent, sticky (pins below the
header), height limits with internal scrolling, horizontal/vertical dividers,
accent / background / controls colors, title size. Three layout modes: list,
columns, and a fixed 2D grid with row/column rails and blank cells.

**Value types** (stored per entry): text (with vault-wide autocompletion and
link rendering), number, decimal, list (chips), checkbox, color (multi-space
picker: RGB / HSL / OKLCH / OKLab, eyedropper, out-of-gamut display), formula
(an expression like `sqrt(x)` maps the slider; typing a value solves it
backwards), image (URL or `![[embed]]`, zoomable viewer), iframe.

**Obsidian integration.** Properties shown in the sidebar are hidden from
Obsidian's own properties panel by default (per-property override). The
properties panel gets a right-click hide/show menu and a "Hidden properties"
list in its heading menu. Both behaviors can be turned off.

## Dice & rolls module

Enabled by default (Settings -> Features). Adds roll buttons to numeric
properties (with a modifier badge), the roll log panel with
normal/advantage/disadvantage modes, and the **skills** data type. Every roll
can use preset dice (d2, d4, d6, d8, d10, d12, d20, d100) or a custom die
size, with any number of dice; the chosen dice show as a small tag before the
modifier ("2d6 +3").

A skills property stores a list of records - one per skill - directly in the
note:

```yaml
Skills:
  - name: Acrobatics
    source: Dexterity   # modifying property
    prof: true          # adds the proficiency bonus
  - name: Chainsaw
    dice: 2d6           # per-skill dice
    mod: 4              # manual modifier override
```

Nothing is locked: name, modifying property, dice, modifier and proficiency
are all editable inline (click in edit mode, double-click otherwise;
right-click a row for dice, ordering and removal). The entry's options page
configures how modifiers derive from the source (raw value or ability
modifier), the proficiency bonus (none / from a level property / fixed), the
default dice, and offers one-click record presets.

## D&D 5e module

Builds entirely on the pieces above: its saving throws and skills are
*presets* of the generic skills type (populating also imports proficiencies
from the legacy list properties), ability scores use the shared roll addon,
and proficiency/initiative are computed entries. Section templates: Contents,
Details, Vitals, Ability scores, Saving throws, Skills. New note types start
with the full character-sheet layout while the module is enabled. All stats
are stored as plain note properties.

## Language

Settings → Language: choose the UI language (English and German ship with the
plugin) and override any individual UI text with your own wording via the
searchable *Custom wording* editor. Adding a locale is a single dictionary
file — see ARCHITECTURE.md.

## Install

Copy `manifest.json`, `main.js`, `styles.css` into
`<vault>/.obsidian/plugins/extended-properties/` and enable the plugin in
Community plugins.

## Development

```
npm install
npm run build      # bundle src/main.ts → main.js
npx tsc --noEmit   # typecheck
```

Source lives in `src/` (core / i18n / ui / features). Start with
[ARCHITECTURE.md](ARCHITECTURE.md); every module has a header comment
explaining its role.
