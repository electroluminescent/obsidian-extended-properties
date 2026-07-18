var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ExtendedPropertiesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian44 = require("obsidian");

// src/i18n/i18n.ts
var I18n = class {
  constructor() {
    this.dicts = /* @__PURE__ */ new Map();
    this.names = /* @__PURE__ */ new Map();
    this.locale = "en";
    this.overrides = {};
  }
  /**
   * Merge `dict` into the dictionary for `locale`. Later registrations win,
   * so feature modules can refine core strings if they must (discouraged).
   */
  register(locale, dict, displayName) {
    var _a;
    const existing = (_a = this.dicts.get(locale)) != null ? _a : {};
    this.dicts.set(locale, { ...existing, ...dict });
    if (displayName) this.names.set(locale, displayName);
  }
  /** Switch the active locale. Unknown codes silently fall back to English. */
  setLocale(code) {
    this.locale = code;
  }
  getLocale() {
    return this.locale;
  }
  /** Install the user's per-string overrides (from settings). */
  setOverrides(overrides) {
    this.overrides = overrides != null ? overrides : {};
  }
  /** All locales that have at least one registered dictionary. */
  availableLocales() {
    return [...this.dicts.keys()].sort().map((code) => {
      var _a;
      return { code, name: (_a = this.names.get(code)) != null ? _a : code };
    });
  }
  /** Every known string key (union over all locales) - used by the override editor. */
  keys() {
    const all = /* @__PURE__ */ new Set();
    for (const d of this.dicts.values()) for (const k of Object.keys(d)) all.add(k);
    return [...all].sort();
  }
  /** The string a key resolves to *ignoring* user overrides (for the editor UI). */
  baseText(key) {
    var _a, _b, _c, _d;
    return (_d = (_c = (_a = this.dicts.get(this.locale)) == null ? void 0 : _a[key]) != null ? _c : (_b = this.dicts.get("en")) == null ? void 0 : _b[key]) != null ? _d : humanize(key);
  }
  /** Translate `key`, substituting `{placeholders}` from `vars`. */
  t(key, vars) {
    var _a, _b, _c, _d, _e;
    const raw = (_e = (_d = (_b = this.overrides[key]) != null ? _b : (_a = this.dicts.get(this.locale)) == null ? void 0 : _a[key]) != null ? _d : (_c = this.dicts.get("en")) == null ? void 0 : _c[key]) != null ? _e : humanize(key);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => vars[name] !== void 0 ? String(vars[name]) : m);
  }
};
function humanize(key) {
  var _a;
  const tail = (_a = key.split(".").pop()) != null ? _a : key;
  const words = tail.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// src/i18n/locales/en.json
var en_default = {
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.save": "Save",
  "common.clear": "Clear",
  "common.choose": "Choose",
  "common.done": "Done",
  "view.title": "Extended properties",
  "view.noNote": "Open a note to see its properties here.",
  "view.noType": '"{note}" has no matching Type.',
  "view.noTypeHint": "Set its Type property to one of:",
  "view.setType": "Set Type: {type}",
  "view.noTypesConfigured": "No types are configured yet. Give this note any Type value to create one (it starts empty), or add types in the plugin settings.",
  "view.typeBadgeHint": "This note's Type - selects which saved layout is shown",
  "view.edit": "Edit",
  "view.done": "Done",
  "view.editHint": "Edit: rearrange sections & properties, change types, colors, etc.",
  "view.doneHint": "Finish editing - keep or undo your changes",
  "view.addSection": "+ Section",
  "view.resetAll": "Reset all",
  "view.resetConfirm": 'Reset the "{type}" layout to defaults? Note properties are not changed.',
  "view.addTemplates": "Add:",
  "view.templateResetConfirm": 'The "{name}" section already exists. Reset it to its original section and properties?',
  "hint.clickEdit": "Click to edit",
  "hint.dblEdit": "Double-click to edit",
  "hint.dblToggle": "Double-click to toggle",
  "a11y.editValue": "Edit value",
  "a11y.rating": "{name} rating",
  "a11y.ratingValue": "{value} of {max}",
  "a11y.removeItem": "Remove {item}",
  "a11y.toggleSection": "Toggle section {name}",
  "a11y.entryMenu": "Entry options",
  "settings.resetHeading": "Reset",
  "settings.resetAll": "Reset plugin",
  "settings.resetAllDesc": "Reset all Extended Properties settings, types and layouts to their defaults. Your current configuration is backed up to the plugin's backups folder first. Your note properties (frontmatter) are not touched. Tip: hold Shift while clicking to skip the confirmation.",
  "settings.resetAllBtn": "Reset plugin",
  "settings.resetAllConfirm": "Reset all Extended Properties settings, types and layouts to defaults? Your current configuration is backed up first; your note data is left untouched.",
  "settings.resetAllDone": "Extended Properties was reset to defaults.",
  "section.namePlaceholder": "Section",
  "section.newName": "New section",
  "section.untitled": "Untitled",
  "section.renameHint": "Click to rename",
  "section.dragHint": "Drag to reorder section",
  "section.layoutHint": "Layout: {mode} (click to cycle)",
  "entry.typeHint": "Change data type (applies to this property everywhere)",
  "settings.poolSuffix": "Pool suffix",
  "settings.poolSuffixDesc": "Typed after a property name in a key field (Class.p), opens that property's autofill-pool editor. Empty disables it.",
  "pool.title": "Autofill pool - {key}",
  "pool.empty": "No options yet - add one below.",
  "pool.addPlaceholder": "New option",
  "pool.addBtn": "Add to pool",
  "pool.addedTag": "added",
  "pool.usesTag": "{n} notes",
  "pool.removeAria": "Remove {value} from the pool",
  "pool.removeConfirm": `Remove "{value}" from the pool AND from {n} note(s)? The value is deleted from those notes' properties.`,
  "pool.scrubbed": 'Removed "{value}" from {n} note(s).',
  "pool.editRow": 'Edit autofill pool for "{key}"...',
  "options.unit": "Unit",
  "options.unitDesc": "Optional suffix shown after the value (e.g. kg, ft, %).",
  "options.listHeading": "List",
  "options.listAlign": "Alignment",
  "options.listAlignDesc": "How the list items are arranged across the row.",
  "align.left": "Left",
  "align.center": "Center",
  "align.right": "Right",
  "section.pinCycleHint": "Pin: {zone} (click to cycle)",
  "pin.body": "Body (not pinned)",
  "pin.header": "Header (pinned to top)",
  "pin.footer": "Footer (pinned to bottom)",
  "section.optionsHint": "Section options",
  "layout.list": "list",
  "layout.columns": "columns",
  "layout.grid": "grid",
  "section.menu.configure": 'Configure "{name}" section...',
  "section.menu.showDividers": "Show horizontal dividers",
  "section.menu.hideDividers": "Hide horizontal dividers",
  "section.menu.showVDividers": "Show vertical dividers",
  "section.menu.hideVDividers": "Hide vertical dividers",
  "section.menu.enableCollapse": "Enable collapsing",
  "section.menu.disableCollapse": "Disable collapsing",
  "section.menu.addObject": "Add object",
  "section.menu.moveUp": "Move up",
  "section.menu.moveDown": "Move down",
  "section.menu.export": "Export section...",
  "section.menu.delete": "Delete section",
  "transfer.exportType": "Export",
  "transfer.exportTypeTip": "Copy this type (layout + referenced derivations) to the clipboard as a shareable snippet",
  "transfer.copied": "Copied to clipboard",
  "transfer.importHeading": "Import type or section",
  "transfer.importHeadingDesc": "Paste a snippet exported from another vault to add its sections here.",
  "transfer.importTitle": "Import type or section",
  "transfer.importPlaceholder": "Paste an exported type or section snippet (JSON)...",
  "transfer.importBtn": "Import",
  "transfer.invalid": "Not a valid Extended Properties snippet.",
  "transfer.kindType": "type",
  "transfer.kindSection": "section",
  "transfer.summary": '{kind} "{name}" - {sections} section(s), {entries} propert(y/ies).',
  "transfer.missingDerivations": "Missing derivation building blocks: {list}",
  "transfer.createMissing": "Create missing derivations",
  "transfer.targetType": "Add to type",
  "transfer.targetTypeDesc": "Sections are appended to this type (created if it doesn't exist). Existing: {types}",
  "transfer.pickType": "Enter a target type name.",
  "transfer.imported": 'Imported "{name}" into {type}',
  "entry.addProperty": "+ add property",
  "entry.addToColumnHint": 'Add a property to this column of "{section}"',
  "entry.addToSectionHint": 'Add a property to "{section}"',
  "entry.dragHint": "Drag to move",
  "entry.changeKeyHint": "Click to change which property this shows",
  "entry.renameHint": "Click to rename",
  "entry.unknownKind": "Unavailable: {kind}",
  "entry.menu.configure": 'Configure "{name}" property...',
  "entry.menu.configureObject": 'Configure "{name}" object...',
  "entry.menu.showInObsidian": 'Show "{key}" in Obsidian properties',
  "entry.menu.hideFromObsidian": 'Hide "{key}" from Obsidian properties',
  "entry.menu.clearValue": 'Remove value from "{key}"',
  "entry.menu.remove": "Remove from sidebar",
  "entry.menu.editValue": "Edit value...",
  "entry.menu.toggle": "Toggle",
  "entry.menu.addItem": "Add item...",
  "entry.menu.pickColor": "Pick color...",
  "entry.menu.editImage": "Edit image link...",
  "prompt.editValue": "Edit {name}",
  "kind.blank": "Blank",
  "kind.toc": "Contents",
  "toc.hint": "Contents - click a section to scroll to it",
  "blank.dragHint": "Blank cell - drag to move",
  "blank.addHere": "Add property here",
  "blank.remove": "Remove blank",
  "grid.removeRow": "Remove this row",
  "grid.removeColumn": "Remove this column",
  "grid.removeAColumn": "Remove a column",
  "grid.addColumnHint": "Add a column here",
  "grid.removeColumnHint": "Remove this column",
  "grid.addRowHint": "Add a row here",
  "grid.removeRowHint": "Remove this row",
  "type.text": "text",
  "type.number": "number",
  "type.decimal": "decimal",
  "type.derived": "derived",
  "roll.partMod": "modifier",
  "roll.partOverride": "override",
  "roll.partProf": "prof",
  "roll.partTotal": "total",
  "roll.menu.count": "Number of rolls",
  "roll.menu.go": "Roll",
  "roll.menu.edit": "Edit source",
  "type.list": "list",
  "type.checkbox": "checkbox",
  "type.color": "color",
  "type.formula": "formula",
  "type.image": "image",
  "type.audio": "audio",
  "type.video": "video",
  "type.pdf": "PDF",
  "type.iframe": "iframe",
  "type.rating": "rating (legacy)",
  "type.link": "link",
  "type.unit": "unit (legacy)",
  "type.datetime": "date/time (legacy)",
  "type.date": "date",
  "feature.date": "Dates (custom calendars)",
  "feature.dateDesc": "The date value type with per-property formats, custom calendars and era pools.",
  "options.dateHeading": "Date",
  "options.dateFormat": "Format",
  "options.dateFormatDesc": "Shared by every instance of this property. Tokens: YYYY/Y year, MM/M month, MMMM/MMM month name, DD/D day, HH/H hour, mm/m minute, E era suffix. E.g. MM/DD/YYYY or D MMMM, Y E HH:mm. Input is lenient: month names (full, short or prefixed), reordered numeric dates, an H:MM time and pooled era suffixes translate even when they don't match this format; values always display in it.",
  "options.datePlot": "Show timeline plot",
  "options.datePlotDesc": "Where the slider would be, plot every other note's value for this property as reference points; this note is the marker. Hover a point to see its notes; click a name to open it (Ctrl/Cmd: new tab). The plot never changes the value.",
  "options.dateRangeAuto": "In the property's format. Blank = the earliest/latest value across all notes.",
  "options.customCalendar": "Custom date system",
  "options.customCalendarDesc": "Define this property's own calendar (shared by all notes): months per year, days per month, days per week, month names. Stored values are calendar-independent integers - changing the system re-encodes every note so each date keeps its meaning (clamped to the closest date when the new system is smaller).",
  "options.months": "Months per year",
  "options.daysPerMonth": "Days per month",
  "options.daysPerWeek": "Days per week",
  "options.time": "Time of day",
  "options.timeDesc": "Add hours and minutes to this property (shared by all notes). Serials re-encode at minute resolution; turning it off re-encodes back to days.",
  "options.hoursPerDay": "Hours per day",
  "options.minutesPerHour": "Minutes per hour",
  "options.monthName": "Month {n} name",
  "options.eraPool": "Era suffixes",
  "options.eraPoolDesc": "The pool offered by the era chip (e.g. BCE, CE), oldest first. Each note picks its own; typing a new suffix when editing a value adds it here. Removing an era re-encodes stored values (affected notes fall back to no era).",
  "options.eraAdd": "Add era (Enter)",
  "options.eraRemove": "Remove",
  "date.invalid": "Doesn't match the format {format}",
  "date.eraNone": "No era",
  "date.eraCustom": "Custom era...",
  "date.eraCustomPrompt": "New era suffix",
  "date.migrated": "Extended Properties: re-encoded dates in {count} notes to keep their meaning under the new calendar.",
  "options.ratingMax": "Maximum",
  "options.ratingIcon": "Icon",
  "options.ratingIconDesc": "A Lucide icon name (e.g. star, heart, circle).",
  "options.unitLabel": "Unit",
  "options.unitLabelDesc": "Suffix shown after the value (e.g. lb, ft, gp).",
  "options.unitFactor": "Display factor",
  "options.unitFactorDesc": "Stored value is multiplied by this for display (and divided back on edit). Blank = 1.",
  "link.prompt": "Note to link (name or [[wikilink]])",
  "link.edit": "Edit link",
  "date.today": "today",
  "date.inDays": "in {n} days",
  "date.daysAgo": "{n} days ago",
  "validate.required": "This value is required.",
  "validate.min": "Must be at least {n}.",
  "validate.max": "Must be at most {n}.",
  "validate.pattern": "Doesn't match the required format.",
  "validate.allowed": "Not one of the allowed values.",
  "options.constraintsHeading": "Validation",
  "options.required": "Required",
  "options.requiredDesc": "Flag the value as invalid when empty.",
  "options.constraintMin": "Minimum",
  "options.constraintMax": "Maximum",
  "options.constraintClamp": "Clamp to range on edit",
  "options.constraintClampDesc": "Committed values outside the range snap to the nearest bound instead of only warning.",
  "options.constraintPattern": "Pattern (regex)",
  "options.constraintPatternDesc": "The whole value (each list item) must match this regular expression. Leave blank to skip.",
  "options.constraintAllowed": "Allowed values",
  "options.constraintAllowedDesc": "Comma-separated accepted values (case-insensitive). Leave blank to allow anything.",
  "derive.value": "Value as-is",
  "mods.heading": "Modifier",
  "mods.preview": "{denote} = {total}",
  "mods.influence": "Influence {n}",
  "mods.sourceSelf": "(this property)",
  "mods.modeFormula": "Custom formula...",
  "mods.formula": "Formula f(x)",
  "mods.modeExpr": "Expression...",
  "mods.expr": "Expression",
  "mods.exprDesc": "Math over properties by name or short form, e.g. floor((STR + DEX) / 2) + max(PB, 2). Functions: floor, ceil, round, min, max, clamp, abs, if; your derivations are callable too.",
  "mods.errExpr": "This value can't be computed - check the expression (unknown property or syntax).",
  "mods.errCycle": "This value depends on itself (a reference cycle).",
  "mods.termOptions": "Sign - toggle",
  "mods.termOptionsDesc": "How this term enters the sum, and a list property that toggles it per note (the way proficiency works).",
  "mods.shortForm": "Short form",
  "mods.shortFormDesc": "Abbreviation used in modifier chains (INT + DEX) and inline val:/roll: references. Must be unique across properties.",
  "mods.shortFormConflict": '"{abbr}" is already the short form of "{other}". Use it here instead? "{other}" will be given a new short form.',
  "mods.showToggle": "Show checkbox on the row",
  "mods.clickToggle": "click to toggle",
  "mods.weightAdd": "+ add",
  "mods.weightSub": "- subtract",
  "mods.toggleProp": "Toggle list property",
  "mods.togglePlaceholder": "always on",
  "mods.abbr": "Short form",
  "mods.addInfluence": "+ Add influence",
  "mods.removeInfluence": "Remove influence",
  "mods.moveUp": "Move up",
  "mods.moveDown": "Move down",
  "mods.showBadge": "Show modifier badge",
  "mods.showBadgeDesc": "Short-form denotation plus the computed total, next to the value",
  "mods.showChain": "Show modifier chain",
  "mods.showChainDesc": "The short-form denotation (INT + DEX); auto-hidden when space is tight",
  "mods.showDice": "Show dice",
  "mods.showDiceDesc": "The dice breakdown (2d20) before the modifier; auto-hidden when space is tight",
  "mods.showToggleDesc": 'On = the checkbox bound to "{list}" is shown on the row',
  "mods.showInChain": "Show in chain",
  "mods.showInChainDesc": "On = this term appears in the chain denotation (it always counts toward the total)",
  "mods.showDiceIcon": "Show dice icon",
  "mods.showDiceIconDesc": "On = a die pictogram precedes the dice breakdown",
  "mods.overrideNote": "Modifier override (this note)",
  "mods.overrideNoteDesc": "On = this note stores a fixed value instead of the derived sum. Editing the value in the sidebar turns this on; clearing the field turns it off.",
  "mods.override": "Modifier override",
  "mods.overrideDesc": "Fixed value replacing the computed sum for every note. A number stored in the note's own property overrides per note (click the value on the row); blank derives from the influences.",
  "mods.clearNoteOverride": "Clear this note's override",
  "list.add": "+ add",
  "list.addTo": "Add to {key}",
  "list.noMoreValues": "No more values.",
  "image.emptyHint": "No image - click to set",
  "image.linkPrompt": "Image link (URL or ![[embed]])",
  "image.linkPromptShort": "Image link",
  "iframe.emptyHint": "No URL - click to set",
  "iframe.urlPrompt": "Embed URL",
  "media.setSource": "Set source...",
  "add.addCustom": "Add custom value",
  "audio.emptyHint": "No audio - click to set a file or URL",
  "audio.srcPrompt": "Audio source (vault file, [[wikilink]] or URL - Spotify/SoundCloud links embed their player)",
  "video.emptyHint": "No video - click to set a file or URL",
  "video.srcPrompt": "Video source (vault file, [[wikilink]] or URL - YouTube/Vimeo links embed their player)",
  "pdf.emptyHint": "No PDF - click to set a file or URL",
  "pdf.srcPrompt": "PDF source (vault file, [[wikilink]] or URL)",
  "options.videoHeading": "Video",
  "iframe.setUrl": "Set URL",
  "add.searchPlaceholder": 'Add a property to "{section}"...',
  "add.hiddenBadge": "hidden",
  "add.create": 'Create "{key}"',
  "add.groupOnNote": "On note",
  "add.groupOnSidebar": "On sidebar",
  "add.groupOthers": "Others",
  "add.pickValues": "{key} - pick values",
  "add.customValue": "Custom value...",
  "add.typeValue": "Type a value...",
  "add.addN": "Add {n}",
  "add.addEmpty": "Add empty",
  "add.noValues": "No existing values.",
  "add.notesWith": 'Notes with "{value}"',
  "add.noNotes": "No notes use this value.",
  "suggest.create": 'Create "{key}" (text)',
  "suggest.onNote": "on note",
  "exitEdit.title": "Leave edit mode",
  "exitEdit.message": "You made changes while editing. Keep them, or undo everything from this session?",
  "exitEdit.keepEditing": "Keep editing",
  "exitEdit.undo": "Undo changes",
  "exitEdit.save": "Save changes",
  "confirmChanges.title": "Apply changes?",
  "confirmChanges.message": "Keep the changes you made here, or undo them?",
  "confirmChanges.keep": "Keep changes",
  "confirmChanges.undo": "Undo changes",
  "iconPicker.title": "Choose an icon",
  "iconPicker.search": "Search icons...",
  "iconPicker.noMatch": "No matching icons.",
  "colorPicker.title": "Pick a color",
  "colorPicker.eyedropper": "Pick from screen",
  "colorPicker.red": "Red",
  "colorPicker.green": "Green",
  "colorPicker.blue": "Blue",
  "colorPicker.hue": "Hue",
  "colorPicker.saturation": "Saturation",
  "colorPicker.lightness": "Lightness",
  "colorPicker.chroma": "Chroma",
  "colorPicker.labA": "a (green-red)",
  "colorPicker.labB": "b (blue-yellow)",
  "imageViewer.hint": "Scroll to zoom - drag to pan - double-click to reset",
  "options.title": '"{name}" options',
  "options.propertyHeading": "Property",
  "options.objectHeading": "Object",
  "options.property": "Property",
  "options.propertyDesc": "Which note property this entry shows",
  "options.label": "Display label",
  "options.labelDesc": 'Optional - leave blank to use "{default}"',
  "options.typeHeading": "Type",
  "options.dataType": "Data type",
  "options.dataTypeDesc": "Defaults to the Obsidian property type",
  "options.numberHeading": "Number & slider",
  "options.showSlider": "Show slider",
  "options.ratingToggle": "Rating icons",
  "options.ratingToggleDesc": "Show the value as clickable icons instead of the slider. The icon count is the Maximum above; a negative Minimum adds its own red icons left of the positives. There is no zero icon - zero is every icon clicked off.",
  "options.ratingBalance": "Balance rating rows",
  "options.ratingBalanceDesc": "When the icons need several rows, split them evenly (12 icons with room for 10 = 6 + 6). Off = fill each row before wrapping (10 + 2).",
  "options.ratingFill": "Filled icons",
  "options.ratingFillDesc": "Fill the icon glyphs solid instead of outlined (works on icons with fillable shapes, like the star).",
  "options.ratingAlign": "Rating alignment",
  "options.alignLeft": "Left",
  "options.alignCenter": "Center",
  "options.alignRight": "Right",
  "options.alignSpace": "Distributed",
  "options.showValue": "Show value",
  "options.showValueDesc": "Off = hide the textual value. The label and controls (steppers, slider, rating, roll) stay.",
  "options.showSteppers": "Show - / + buttons",
  "options.sliderCurve": "Slider curve",
  "options.curveLinear": "Linear",
  "options.curveRoot": "Root",
  "options.curveExp": "Exponential",
  "options.rangeAuto": "Blank = this property's lowest/highest value across notes",
  "options.sharedHeading": "Shared settings ({n} selected)",
  "options.mixed": "Mixed values - changing this writes it to every selected tab.",
  "options.multiNote": "Editing {n} {type} properties together - every setting you change here is written to all of them.",
  "options.multiMixed": "Currently differing across the selection: {list}.",
  "options.showLabel": "Show label",
  "options.showLabelDesc": "On = the label is visible outside edit mode",
  "options.showWhenEmpty": "Show when empty",
  "options.showWhenEmptyDesc": "On = stays visible outside edit mode even without a value",
  "options.showWhen": "Show when",
  "options.showWhenDesc": `Condition over the note's values - e.g. Class == "Wizard" or Level >= 5. Empty = always shown; edit mode shows it dimmed.`,
  "options.showWhenActive": "Shown when: {expr}",
  "options.showType": "Show data type",
  "options.showTypeDesc": "Small italic tag beside the label; auto-hidden when space is tight",
  "options.minimum": "Minimum",
  "options.maximum": "Maximum",
  "options.clamp": "Clamp typed values",
  "options.formula": "Slider formula f(x)",
  "options.formulaDesc": "e.g. sqrt(x), x^2, 2*x+1",
  "options.imageHeading": "Image",
  "options.maxHeight": "Max height",
  "options.embedHeading": "Embed",
  "options.embedHeight": "Height (px)",
  "options.embedScale": "Scale",
  "options.appearanceHeading": "Appearance",
  "options.icon": "Icon",
  "options.iconDesc": "Optional icon shown left of the label",
  "options.iconColor": "Icon color",
  "options.hideLabel": "Hide label",
  "options.hideLabelDesc": "Hide the label outside edit mode",
  "options.hideIfEmpty": "Hide if empty",
  "options.hideIfEmptyDesc": "If this property has no value, hide it entirely outside edit mode",
  "options.labelSize": "Label size",
  "options.valueSize": "Value size",
  "options.sizeDesc": "0 = theme default",
  "options.labelColor": "Label color",
  "options.valueColor": "Value color",
  "options.obsidianHeading": "Obsidian",
  "options.showInObsidian": "Show in Obsidian properties",
  "options.showInObsidianDesc": "Off = hidden from the properties panel",
  "options.placementHeading": "Placement",
  "sectionOptions.title": 'Format "{name}"',
  "sectionOptions.tabSection": "Section",
  "sectionOptions.multiSelect": "Select multiple (tap to toggle)",
  "sectionOptions.tabsHint": "Click a tab to edit it. Ctrl/Cmd-click toggles single tabs, Shift-click selects a range, and dragging across tabs selects several - the body then shows their shared settings, and only settings you change are written to all selected tabs.",
  "sectionOptions.columnN": "Column {n}",
  "sectionOptions.rowN": "Row {n}",
  "sectionOptions.groupBy": "Group tabs",
  "sectionOptions.groupColumn": "By column",
  "sectionOptions.groupRow": "By row",
  "sectionOptions.groupType": "By data type",
  "sectionOptions.showWhenEmptyDesc": "On = the section stays visible even when it has no visible properties (outside edit mode)",
  "sectionOptions.showWhenDesc": 'Show this section only when the condition holds - e.g. Class == "Wizard". Empty = always shown.',
  "sectionOptions.sectionHeading": "Section",
  "sectionOptions.name": "Name",
  "sectionOptions.nameDesc": 'Optional - blank shows "Section"',
  "sectionOptions.collapsible": "Collapsible",
  "sectionOptions.dividers": "Horizontal dividers",
  "sectionOptions.vdividers": "Vertical dividers",
  "sectionOptions.trimEmptyRows": "Remove white space",
  "sectionOptions.trimEmptyRowsDesc": "Hide fully-empty rows at the top or bottom of the grid outside edit mode (rows whose cells hold no visible property). Empty rows between properties keep their place.",
  "sectionOptions.hideIfEmptyDesc": "Hide the whole section when it has no visible properties (outside edit mode)",
  "sectionOptions.layoutHeading": "Layout",
  "sectionOptions.layout": "Layout",
  "sectionOptions.layoutDesc": "List = one column; Columns = vertical, independent columns; Grid = fixed 2D cells",
  "sectionOptions.columns": "Columns",
  "sectionOptions.rows": "Rows",
  "sectionOptions.rowsDesc": "Grid only",
  "sectionOptions.transparent": "Transparent",
  "sectionOptions.pin": "Pin",
  "sectionOptions.pinDesc": "Header pins to the top of the sidebar, Footer to the bottom. Pinned zones cap their height and scroll internally, so nothing becomes unreachable on a small window.",
  "sectionOptions.pinDefault": "Pin new sections to the header",
  "sectionOptions.height": "Height",
  "sectionOptions.heightDesc": "Scrolls within the section if limited",
  "sectionOptions.colorsHeading": "Colors",
  "sectionOptions.accent": "Accent color",
  "sectionOptions.accentDesc": "Title & highlights",
  "sectionOptions.background": "Background color",
  "sectionOptions.controls": "Controls color",
  "sectionOptions.controlsDesc": "Buttons & list chips",
  "sectionOptions.titleHeading": "Title",
  "sectionOptions.titleSize": "Title size",
  "size.unlimited": "Unlimited",
  "size.small": "Small",
  "size.medium": "Medium",
  "size.large": "Large",
  "size.smallRows": "Small (~4)",
  "size.mediumRows": "Medium (~8)",
  "size.largeRows": "Large (~12)",
  "propPanel.hideEverywhere": 'Hide "{key}" in properties (all notes)',
  "propPanel.showEverywhere": 'Show "{key}" in properties (all notes)',
  "propPanel.hideShow": "Hide / show properties",
  "propPanel.hideKey": '  Hide "{key}"',
  "propPanel.showKey": '  Show "{key}"',
  "propPanel.groupInNotes": "In notes",
  "propPanel.groupOther": "Other",
  "propPanel.hiddenHeading": "Hidden properties",
  "propPanel.noneHidden": "None hidden",
  "propPanel.sidebarSuffix": "{key} (sidebar)",
  "propPanel.showAll": "Show all hidden",
  "command.openSidebar": "Open properties sidebar",
  "command.openTable": "Open type table",
  "command.hideProperty": "Hide a property from Obsidian's properties panel",
  "table.title": "Type table",
  "table.columns": "Columns",
  "table.filter": "Filter...",
  "table.name": "Name",
  "table.count": "{n} notes",
  "table.noTypes": "No note types are configured yet. Add one in the plugin settings to see its notes here.",
  "table.removeColumn": "Remove column",
  "table.resize": "Resize {name} column",
  "roll.summary.settings": "Roll settings",
  "table.roll": "Roll this property",
  "table.rollFailed": "Rolling is unavailable.",
  "table.truncated": "Showing first {shown} of {total} - narrow the filter to see more.",
  "notice.hiding": 'Hiding "{key}" from Obsidian properties.',
  "notice.saveFailed": "Could not save property: {error}",
  "conflict.message": '"{note}" changed on disk while you were editing. Keep your changes, or take the version on disk?',
  "conflict.keepMine": "Keep mine",
  "conflict.takeTheirs": "Take theirs",
  "conflict.merged": 'Merged your edits into "{note}" ({n} changed) - no conflicts.',
  "conflict.keys": "Both sides changed: {keys}",
  "preset.empty": "Empty",
  "settings.intro": "Open a note whose Type matches one below, then click Edit (or right-click anything) to arrange it. Drag handles, use ... / right-click for options (Configure for the full panel), click labels to rename, add properties at each section's bottom.",
  "settings.typesHeading": "Types",
  "settings.typesDesc": "Each Type has its own layout; a note's Type property selects it.",
  "settings.resetLayout": "Reset layout",
  "settings.resetLayoutConfirm": 'Reset the "{type}" layout to defaults?',
  "settings.deleteType": "Delete",
  "settings.addType": "Add a type",
  "settings.addTypeBtn": "+ Type",
  "settings.newTypePrompt": "New type name",
  "settings.typeExists": "That type already exists.",
  "settings.defaultsHeading": "Defaults",
  "settings.defaultDataType": "Default data type",
  "settings.defaultDataTypeDesc": "For new properties with no Obsidian type",
  "settings.defaultColorSpace": "Default color space",
  "settings.newSectionHeading": "New section defaults",
  "settings.entryDividers": "Dividers between properties",
  "settings.derivationsHeading": "Modifier building blocks",
  "settings.derivationsDesc": "Reusable formula blocks for derived values and modifiers. Each block can carry a reference suffix: write Level.pb (or Strength.am) in notes, expressions and inline chips to apply that block to the property. The modifier short form below is the influence-sum reference; block suffixes are checked after it.",
  "settings.derivationName": "Name",
  "settings.blockSuffix": "suffix",
  "settings.blockSuffixDesc": "Dotted reference suffix for this block, e.g. pb makes Level.pb apply it to Level. Blank = no reference.",
  "settings.derivationDelete": "Delete",
  "settings.derivationAdd": "Add a building block",
  "settings.derivationAddBtn": "+ Block",
  "settings.derivationReseed": "Restore defaults",
  "settings.newDerivation": "New derivation",
  "settings.diceHeading": "Dice",
  "settings.diceAnim": "Roll animation",
  "settings.diceAnimDesc": "Tumble the rolled dice in 3D before settling; the modifier and total animate in afterwards, and the notice/log appear only once the roll resolves. Click the overlay to skip a roll.",
  "settings.diceStyle": "Dice animation style",
  "settings.diceStyleDesc": "How each die animates while rolling: classic cycling numbers, a spinning icon, or a tumbling 3D cube.",
  "settings.diceAa": "Anti-alias 3D dice",
  "settings.diceAaDesc": "Supersampling the 3D dice currently distorts them, so this option is temporarily disabled.",
  "settings.diceAnimRolls": "Rolls before settling",
  "settings.diceAnimRollsDesc": "How many times the dice faces cycle before the result settles.",
  "settings.diceAnimMs": "Animation duration (seconds)",
  "settings.diceAnimMsDesc": "How long a roll takes to fully resolve. Dice and modifiers stagger to start one after another and finish within this time.",
  "settings.diceAnimStay": "Keep results on screen",
  "settings.diceAnimStayDesc": "On = roll cards stay until clicked; off = they dismiss themselves. Clicking a card always toggles keeping it.",
  "settings.diceAnimBlock": "Block background while rolling",
  "settings.diceAnimBlockDesc": "Dim everything behind the roll cards and prevent clicking through until they are dismissed.",
  "settings.sound": "Sound effects",
  "settings.soundDesc": "Subtle synthesized blips for clicks, dice rolls, and critical hits/fails.",
  "settings.soundVolume": "Sound volume",
  "settings.soundVolumeDesc": "Loudness of the sound effects (0 = silent).",
  "settings.soundUi": "UI sounds",
  "settings.soundUiDesc": "Clicks for steppers, edits, checkboxes and ratings.",
  "settings.soundDice": "Dice sounds",
  "settings.soundDiceDesc": "The tumble and settle of a roll.",
  "settings.soundCrit": "Crit / fail sounds",
  "settings.soundCritDesc": "The chime on a critical hit and the buzz on a critical fail.",
  "settings.failOnOne": "Fail on natural 1",
  "settings.failOnOneDesc": "Mark a roll red when every kept die of the first group shows 1.",
  "settings.critRangesDesc": "Crit threshold per die size - the lowest face that counts toward a crit (default = the die's maximum). E.g. set d20 to 19 for a 19-20 crit range.",
  "settings.critRangeFrom": "Crit from (d{sides})",
  "settings.critRangeDelete": "Remove",
  "settings.critRangeAdd": "Add a crit range",
  "settings.critRangeAddBtn": "+ Die size",
  "settings.critRangePrompt": "Die size (e.g. 20)",
  "settings.modsOffProp": "Disabled-modifiers property",
  "settings.modsOffPropDesc": 'List property storing the modifiers switched off by clicking their short form (entries as "Property:Source").',
  "settings.modDepth": "Modifier chain depth",
  "settings.modDepthDesc": "How many property->property hops are resolved when derived values influence other derived values.",
  "settings.modSuffix": "Modifier suffix",
  "settings.modSuffixDesc": "Append this after a dot to use a property's modifier instead of its value (e.g. INT.s or intelligence.s in a roll or expression; cross-note [[Note]].INT.s). Any length; blank disables it.",
  "settings.crossNote": "Cross-note references",
  "settings.crossNoteDesc": 'Allow [[Note]].Prop references and aggregates (sum/avg/count/min/max("Type", "Key")) and prop("LinkProp", "Key") in rolls and expressions. Turn off to disable all vault-wide reads.',
  "settings.conflictGuard": "Guard against edit conflicts",
  "settings.conflictGuardDesc": "When a note changes on disk (sync, another pane) while you're editing it here, ask before overwriting instead of clobbering the on-disk version.",
  "settings.layoutVault": "Store layouts as vault files",
  "settings.layoutVaultDesc": "Save each note type's layout as a JSON file in your vault (so it syncs, diffs and shares) instead of only in data.json. data.json keeps a backup copy; the vault files win on load.",
  "settings.layoutVaultFolder": "Layout folder",
  "settings.layoutVaultFolderDesc": "Vault folder for the per-type layout files.",
  "settings.layoutVaultReload": "Reload from files",
  "layoutStore.badFile": "Skipped an invalid layout file: {file}",
  "layoutStore.writeFailed": 'Could not write the layout file for "{type}".',
  "layoutStore.reloaded": "Reloaded {n} layout file(s) from the vault.",
  "layoutStore.enabled": "Layouts are now stored as vault files.",
  "layoutStore.disabled": "Layouts are stored in data.json again (vault files kept).",
  "snapshot.saveFailed": "Could not write the snapshot.",
  "snapshot.readFailed": "Could not read that snapshot.",
  "snapshot.saved": "Configuration snapshot saved.",
  "snapshot.none": 'No snapshots yet. Run "Save configuration snapshot" first.',
  "snapshot.restored": "Configuration restored from snapshot.",
  "snapshot.pick": "Pick a snapshot to restore",
  "snapshot.cmd.save": "Save configuration snapshot",
  "snapshot.cmd.restore": "Restore configuration snapshot...",
  "secure.locked": "Encrypted",
  "secure.enterPass": "Passphrase for sensitive properties",
  "secure.encryptWarn": "Encrypt this value? It can only be read after unlocking with this exact passphrase. If you lose the passphrase, the value cannot be recovered.",
  "secure.encrypted": "Value encrypted.",
  "secure.decrypted": "Value decrypted.",
  "secure.failed": "Encryption failed: {error}",
  "secure.wrongPass": "Wrong passphrase - value left encrypted.",
  "secure.empty": "Nothing to encrypt (the value is empty).",
  "secure.editLocked": "Decrypt this value before editing it.",
  "secure.menu.encrypt": "Encrypt value",
  "secure.menu.decrypt": "Decrypt value",
  "secure.cmd.unlock": "Unlock encrypted properties",
  "secure.cmd.lock": "Lock encrypted properties",
  "secure.unlockedNotice": "Unlocked - encrypted values will show until you lock again.",
  "secure.lockedNotice": "Locked - encrypted values are hidden.",
  "settings.snapshots": "Auto-snapshot configuration",
  "settings.snapshotsDesc": "Once a day on load, save a snapshot of your types, layouts, derivations and settings to the layout folder's snapshots/ subfolder, so a change can be rolled back. Restore any snapshot from the button here or the command palette.",
  "settings.snapshotSaveNow": "Save snapshot now",
  "settings.snapshotRestore": "Restore...",
  "settings.abbrHeading": "Short forms",
  "settings.abbrDesc": "Short forms used in modifier denotations (INT + DEX - AGE). The default is the capitalized first three letters of the property name; overrides apply everywhere the property is shown as a source.",
  "settings.abbrDefault": "Default: {abbr}",
  "settings.abbrDelete": "Remove override",
  "settings.abbrAdd": "Add a short form",
  "settings.abbrAddBtn": "+ Short form",
  "settings.abbrPrompt": "Source property name",
  "settings.typographyHeading": "Typography",
  "settings.typographyDesc": "Sizes in px; 0 uses the theme default.",
  "settings.fontFamily": "Font family",
  "settings.fontPlaceholder": "theme default",
  "settings.baseSize": "Base size",
  "settings.listSize": "List item size",
  "settings.languageHeading": "UI text",
  "settings.overrides": "Custom wording",
  "settings.overridesDesc": "Replace any UI text with your own wording. Blank fields use the language default.",
  "settings.overridesReset": "Reset all",
  "settings.overridesSearch": "Search UI texts...",
  "settings.overridesHint": "Search for a text to override it. Overridden texts are listed here.",
  "settings.overrideDefault": 'Default: "{text}"',
  "settings.overridesMore": "{count} more - refine your search.",
  "settings.obsidianHeading": "Obsidian",
  "settings.hideShown": "Hide sidebar properties from Obsidian",
  "settings.hideShownDesc": "Override per property in its options.",
  "settings.propMenu": "Right-click hide in Obsidian properties",
  "settings.propMenuDesc": "Adds a hide toggle to the right-click menu in Obsidian's properties panel (replaces the default menu for that click).",
  "settings.hiddenHeading": "Always-hidden properties",
  "settings.hiddenDesc": "Hidden from Obsidian's properties panel everywhere, whether or not they're in the sidebar.",
  "settings.unhide": "Unhide",
  "settings.hideProperty": "Hide a property",
  "settings.hidePropertyBtn": "+ Hide property",
  "settings.hidePromptTitle": "Property name to hide",
  "settings.featuresHeading": "Features",
  "settings.featuresDesc": "Every feature can be turned off. Optional modules first; disabling one hides its widgets and templates. Layouts and note properties are always kept.",
  "settings.featuresTypes": "Value types",
  "settings.featuresTypesDesc": "Disable value types you don't use. Properties of a disabled type keep their data and render as plain text; re-enabling restores them. Text and number are the plugin's foundation and stay on.",
  "settings.featuresUi": "Interface",
  "settings.featuresUiDesc": "Interface features. Disabling one hides its commands and controls; nothing is deleted.",
  "feature.decimal": "Decimal numbers",
  "feature.decimalDesc": "The decimal value type for non-integer numbers.",
  "feature.derived": "Derived values & modifiers",
  "feature.derivedDesc": "The derived value type plus the whole modifier system: badges, toggles, denotations and derivation blocks.",
  "feature.list": "Lists",
  "feature.listDesc": "The list value type with chips, alignment and autofill.",
  "feature.checkbox": "Checkboxes",
  "feature.checkboxDesc": "The checkbox value type.",
  "feature.color": "Colors",
  "feature.colorDesc": "The color value type with swatches and a picker.",
  "feature.formula": "Formulas",
  "feature.formulaDesc": "The formula value type computed from other properties.",
  "feature.image": "Images",
  "feature.imageDesc": "The image value type for vault files and URLs.",
  "feature.media": "Audio, video & PDF",
  "feature.mediaDesc": "The audio, video and PDF embed value types, including web and streaming sources.",
  "feature.iframe": "Web embeds",
  "feature.iframeDesc": "The iframe value type that embeds web pages.",
  "feature.rating": "Ratings",
  "feature.ratingDesc": "The legacy star rating value type. Deprecated: the number type renders icon ratings under its slider settings. Existing properties keep rendering.",
  "feature.link": "Links",
  "feature.linkDesc": "The link value type for wikilinks and URLs.",
  "feature.unit": "Units",
  "feature.unitDesc": "The legacy number-with-unit value type. Deprecated: the number type carries unit suffix and display factor. Existing properties keep rendering.",
  "feature.datetime": "Dates & times",
  "feature.datetimeDesc": "The legacy native-picker date/time value type. Deprecated: superseded by the date type (custom calendars, eras, time). Existing properties keep rendering.",
  "feature.table": "Type table view",
  "feature.tableDesc": "The table listing every note of a type: ribbon icon, command and view.",
  "feature.sticky": "Section pinning",
  "feature.stickyDesc": "Pinning sections to the sticky header and footer zones. Off, every section flows with the body.",
  "feature.pool": "Autofill pool editor",
  "feature.poolDesc": "The pool key suffix (Key.p) that opens a property's autofill pool for editing.",
  "feature.secure": "Sensitive values",
  "feature.secureDesc": "Encrypting property values. Decryption stays available so existing values can always be recovered.",
  "feature.snapshots": "Config snapshots",
  "feature.snapshotsDesc": "Manual and automatic configuration snapshots.",
  "settings.rollsHeading": "Rolls",
  "settings.rollHistory": "Persistent roll history",
  "settings.rollHistoryDesc": "Keep the roll history across reloads. Off = history lives only for the current session.",
  "settings.rollHistoryLimit": "History limit",
  "settings.rollHistoryLimitDesc": "Maximum stored rolls; the oldest are dropped first.",
  "settings.rollHistoryClear": "Clear roll history",
  "settings.rollHistoryClearBtn": "Clear",
  "settings.rollHistoryClearConfirm": "Clear the entire roll history?",
  "settings.rollHistoryCleared": "Roll history cleared.",
  "settings.macrosHeading": "Saved rolls (macros)",
  "settings.macrosDesc": 'Reusable rolls shown on the roll screen and available as commands. Notation like "2d6 + 1d8 + 3"; scope to a type or leave it available to all.',
  "settings.macroName": "Name",
  "settings.macroGlobal": "All types",
  "settings.macroDelete": "Delete macro",
  "settings.macroAdd": "Add a macro",
  "settings.macroAddBtn": "+ Macro",
  "settings.macroNewName": "New macro"
};

// src/i18n/locales/en.ts
var coreEn = en_default;

// src/core/model.ts
function ext(entry) {
  return entry;
}
function sectionMode(section) {
  var _a;
  return (_a = section.layoutMode) != null ? _a : section.columns > 1 ? "columns" : "list";
}
function sectionPin(section) {
  var _a;
  return (_a = section.pin) != null ? _a : section.sticky ? "header" : "body";
}
var LAYOUT_VERSION = 4;

// src/core/expr.ts
var TWO = /* @__PURE__ */ new Set(["==", "!=", "<=", ">=", "&&", "||"]);
function tokenize(s) {
  var _a;
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      let str = "";
      while (i < s.length && s[i] !== q) str += s[i++];
      if (s[i] !== q) return null;
      i++;
      toks.push({ t: "str", v: str });
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let n = "";
      while (i < s.length && /[0-9.]/.test(s[i])) n += s[i++];
      if ((n.match(/\./g) || []).length > 1 || n === ".") return null;
      const v = parseFloat(n);
      if (!Number.isFinite(v)) return null;
      toks.push({ t: "num", v });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let id = "";
      while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) id += s[i++];
      while (s[i] === "." && /[A-Za-z_]/.test((_a = s[i + 1]) != null ? _a : "")) {
        id += s[i++];
        while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) id += s[i++];
      }
      toks.push({ t: "name", v: id });
      continue;
    }
    if (c === "[") {
      if (s[i + 1] === "[") {
        const close = s.indexOf("]]", i + 2);
        if (close < 0) return null;
        let name2 = s.slice(i, close + 2);
        i = close + 2;
        if (s[i] === ".") {
          i++;
          if (s[i] === "[") {
            const e2 = s.indexOf("]", i + 1);
            if (e2 < 0) return null;
            name2 += "." + s.slice(i + 1, e2);
            i = e2 + 1;
          } else {
            const am = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(s.slice(i));
            if (!am) return null;
            name2 += "." + am[0];
            i += am[0].length;
          }
        }
        toks.push({ t: "name", v: name2 });
        continue;
      }
      const end = s.indexOf("]", i + 1);
      if (end < 0) return null;
      const name = s.slice(i + 1, end).trim();
      if (!name) return null;
      toks.push({ t: "name", v: name });
      i = end + 1;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (TWO.has(two)) {
      toks.push({ t: "op", v: two });
      i += 2;
      continue;
    }
    if ("+-*/%^<>".includes(c)) {
      toks.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "!") {
      toks.push({ t: "op", v: "!" });
      i++;
      continue;
    }
    if (c === "(") {
      toks.push({ t: "(" });
      i++;
      continue;
    }
    if (c === ")") {
      toks.push({ t: ")" });
      i++;
      continue;
    }
    if (c === ",") {
      toks.push({ t: "," });
      i++;
      continue;
    }
    return null;
  }
  toks.push({ t: "eof" });
  return toks;
}
var BP = {
  "||": 1,
  "&&": 2,
  "==": 3,
  "!=": 3,
  "<": 4,
  "<=": 4,
  ">": 4,
  ">=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
  "^": 8
};
var PREFIX_BP = 7;
function parseExpr(text) {
  const toks = tokenize(text != null ? text : "");
  if (!toks) return null;
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  try {
    const ast = parseBp(0);
    if (peek().t !== "eof") return null;
    return ast;
  } catch (e) {
    return null;
  }
  function parseBp(minBp) {
    let left = nud();
    for (; ; ) {
      const tok = peek();
      if (tok.t !== "op" || tok.v === "!") break;
      const lbp = BP[tok.v];
      if (lbp === void 0 || lbp < minBp) break;
      next();
      const rbp = tok.v === "^" ? lbp : lbp + 1;
      const right = parseBp(rbp);
      left = { kind: "binary", op: tok.v, left, right };
    }
    return left;
  }
  function nud() {
    const tok = next();
    if (tok.t === "num") return { kind: "num", value: tok.v };
    if (tok.t === "str") return { kind: "str", value: tok.v };
    if (tok.t === "(") {
      const e = parseBp(0);
      if (next().t !== ")") throw new Error("parse");
      return e;
    }
    if (tok.t === "op" && (tok.v === "-" || tok.v === "+" || tok.v === "!")) {
      const arg = parseBp(PREFIX_BP);
      if (tok.v === "+") return arg;
      return { kind: "unary", op: tok.v, arg };
    }
    if (tok.t === "name") {
      if (peek().t === "(") {
        next();
        const args = [];
        if (peek().t !== ")") {
          args.push(parseBp(0));
          while (peek().t === ",") {
            next();
            args.push(parseBp(0));
          }
        }
        if (next().t !== ")") throw new Error("parse");
        return { kind: "call", name: tok.v, args };
      }
      return { kind: "ref", name: tok.v };
    }
    throw new Error("parse");
  }
}
var ExprError = class extends Error {
};
var truthy = (v) => typeof v === "number" ? v !== 0 : v.trim().length > 0;
function toNum(v) {
  if (typeof v === "number") return v;
  const n = parseFloat(v.trim());
  if (!Number.isFinite(n)) throw new ExprError("not numeric: " + v);
  return n;
}
function eqVal(a, b) {
  if (typeof a === "string" || typeof b === "string")
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  return a === b;
}
var CONSTS = { pi: Math.PI, e: Math.E, true: 1, false: 0 };
var FN1 = {
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  abs: Math.abs,
  sign: Math.sign,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  exp: Math.exp,
  ln: Math.log,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan
};
var AGG = /* @__PURE__ */ new Set(["sum", "avg", "count", "min", "max"]);
var strArg = (n) => n && n.kind === "str" ? n.value : "";
function evalNode(node, env) {
  var _a;
  switch (node.kind) {
    case "num":
      return node.value;
    case "str":
      return node.value;
    case "ref": {
      const lc = node.name.toLowerCase();
      if (lc in CONSTS) return CONSTS[lc];
      const v = env.resolve(node.name);
      if (v !== void 0 && Number.isFinite(v)) return v;
      const sv = (_a = env.resolveStr) == null ? void 0 : _a.call(env, node.name);
      if (sv !== void 0) return sv;
      throw new ExprError("unresolved: " + node.name);
    }
    case "unary":
      if (node.op === "!") return truthy(evalNode(node.arg, env)) ? 0 : 1;
      return -toNum(evalNode(node.arg, env));
    case "binary":
      return evalBinary(node, env);
    case "call":
      return evalCall(node, env);
  }
}
function evalBinary(node, env) {
  const { op } = node;
  if (op === "&&") return truthy(evalNode(node.left, env)) && truthy(evalNode(node.right, env)) ? 1 : 0;
  if (op === "||") return truthy(evalNode(node.left, env)) || truthy(evalNode(node.right, env)) ? 1 : 0;
  const a = evalNode(node.left, env);
  const b = evalNode(node.right, env);
  if (op === "==") return eqVal(a, b) ? 1 : 0;
  if (op === "!=") return eqVal(a, b) ? 0 : 1;
  const x = toNum(a);
  const y = toNum(b);
  switch (op) {
    case "+":
      return x + y;
    case "-":
      return x - y;
    case "*":
      return x * y;
    case "/":
      return x / y;
    case "%":
      return x % y;
    case "^":
      return Math.pow(x, y);
    case "<":
      return x < y ? 1 : 0;
    case "<=":
      return x <= y ? 1 : 0;
    case ">":
      return x > y ? 1 : 0;
    case ">=":
      return x >= y ? 1 : 0;
  }
  throw new ExprError("op: " + String(op));
}
function evalCall(node, env) {
  var _a, _b, _c, _d, _e, _f, _g;
  const name = node.name;
  const lc = name.toLowerCase();
  if (lc === "if") {
    if (node.args.length !== 3) throw new ExprError("if needs 3 args");
    return truthy(evalNode(node.args[0], env)) ? evalNode(node.args[1], env) : evalNode(node.args[2], env);
  }
  if (AGG.has(lc) && ((_a = node.args[0]) == null ? void 0 : _a.kind) === "str") {
    const r = (_b = env.agg) == null ? void 0 : _b.call(env, lc, strArg(node.args[0]), strArg(node.args[1]));
    if (r === void 0 || !Number.isFinite(r)) throw new ExprError("agg: " + name);
    return r;
  }
  if ((lc === "prop" || lc === "lookup") && ((_c = node.args[0]) == null ? void 0 : _c.kind) === "str") {
    const r = (_d = env.lookup) == null ? void 0 : _d.call(env, strArg(node.args[0]), strArg(node.args[1]));
    if (r === void 0 || !Number.isFinite(r)) throw new ExprError("lookup: " + name);
    return r;
  }
  const a = node.args.map((x) => toNum(evalNode(x, env)));
  switch (lc) {
    case "min":
      return Math.min(...a);
    case "max":
      return Math.max(...a);
    case "clamp":
      return Math.min(Math.max(a[0], a[1]), a[2]);
    case "pow":
      return Math.pow(a[0], a[1]);
    case "log":
      return a.length >= 2 ? Math.log(a[0]) / Math.log(a[1]) : Math.log10(a[0]);
    case "today":
      return Math.floor(Date.now() / 864e5);
    case "days":
      return ((_e = a[1]) != null ? _e : 0) - ((_f = a[0]) != null ? _f : 0);
  }
  if (lc in FN1) return FN1[lc](a[0]);
  const uf = (_g = env.fn) == null ? void 0 : _g.call(env, name);
  if (uf) {
    const r = uf(a);
    if (r === void 0 || !Number.isFinite(r)) throw new ExprError("fn: " + name);
    return r;
  }
  throw new ExprError("unknown fn: " + name);
}
function evalExpr(ast, env) {
  try {
    const v = evalNode(ast, env);
    const n = typeof v === "number" ? v : NaN;
    return Number.isFinite(n) ? n : void 0;
  } catch (e) {
    return void 0;
  }
}
function evalCondition(ast, env) {
  try {
    return truthy(evalNode(ast, env));
  } catch (e) {
    return void 0;
  }
}
function quote(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `[${name}]`;
}
function serializeExpr(ast, mapRef) {
  const ser = (n, parentBp) => {
    switch (n.kind) {
      case "num":
        return String(n.value);
      case "str":
        return JSON.stringify(n.value);
      case "ref":
        return mapRef ? mapRef(n.name) : quote(n.name);
      case "unary":
        return n.op + ser(n.arg, PREFIX_BP);
      case "call":
        return n.name + "(" + n.args.map((a) => ser(a, 0)).join(", ") + ")";
      case "binary": {
        const bp = BP[n.op];
        const rbp = n.op === "^" ? bp : bp + 1;
        const s = `${ser(n.left, bp)} ${n.op} ${ser(n.right, rbp)}`;
        return bp < parentBp ? `(${s})` : s;
      }
    }
  };
  return ser(ast, 0);
}

// src/utils/formula.ts
function compileFormula(expr) {
  const ast = parseExpr(expr);
  if (!ast) return null;
  const fn = (x) => {
    const v = evalExpr(ast, { resolve: (n) => n.toLowerCase() === "x" ? x : void 0 });
    return v === void 0 ? NaN : v;
  };
  const probe = fn(1);
  if (typeof probe !== "number" || !Number.isFinite(probe)) return null;
  return fn;
}
function invertFormula(f, target, min, max) {
  const N = 400;
  let bestX = min, bestD = Infinity;
  for (let k = 0; k <= N; k++) {
    const x = min + (max - min) * k / N;
    const y = f(x);
    if (Number.isFinite(y)) {
      const d = Math.abs(y - target);
      if (d < bestD) {
        bestD = d;
        bestX = x;
      }
    }
  }
  return bestX;
}

// src/utils/misc.ts
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function fmtNum(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1e3) / 1e3);
}
function fmtMod(m) {
  return (m >= 0 ? "+" : "") + m;
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function getNum(raw, key, def) {
  const n = Number(raw == null ? void 0 : raw[key]);
  return Number.isFinite(n) ? n : def;
}
function parseNumeric(v) {
  if (v === null || v === void 0 || v === "") return null;
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const ms = Date.parse(s);
      if (Number.isFinite(ms)) return Math.floor(ms / 864e5);
    }
    const m = /^-?\d+(?:\.\d+)?/.exec(s);
    if (m) return Number(m[0]);
  }
  return null;
}
function getCI(raw, key) {
  if (key in raw) return raw[key];
  const kl = key.toLowerCase();
  for (const k of Object.keys(raw)) if (k.toLowerCase() === kl) return raw[k];
  return void 0;
}
function getStr(raw, key) {
  const v = raw == null ? void 0 : raw[key];
  return v === void 0 || v === null ? "" : String(v);
}
function getList(raw, key) {
  const v = raw == null ? void 0 : raw[key];
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v === void 0 || v === null || v === "") return [];
  return [String(v)];
}
function restoreFromSnapshot(target, snapshot) {
  let value;
  try {
    value = JSON.parse(snapshot);
  } catch (e) {
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, value);
}

// src/core/influences.ts
function defaultDerivations() {
  return [
    { id: "abilityMod", name: "Ability modifier", formula: "floor((x - 10) / 2)", suffix: "am" },
    { id: "profBonus", name: "Proficiency bonus", formula: "2 + floor((max(x, 1) - 1) / 4)", suffix: "pb" }
  ];
}
function registerDerivations(registries, settings) {
  var _a;
  for (const d of (_a = settings.derivations) != null ? _a : []) {
    const f = compileFormula(d.formula);
    registries.derivations.add({
      id: d.id,
      name: () => d.name,
      apply: f != null ? f : (x) => x
    });
  }
}
function maxDepth(env) {
  const d = env.settings.modDepth;
  return typeof d === "number" && d >= 0 ? Math.floor(d) : 8;
}
function numericRaw(env, key) {
  return parseNumeric(env.note.raw[key]);
}
function findDerivedEntry(env, key) {
  if (!env.layout || !key) return null;
  const kl = key.toLowerCase();
  for (const s of env.layout.sections)
    for (const e of s.entries)
      if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl && e.dataType === "derived") return e;
  return null;
}
function offToken(entry, inf) {
  var _a;
  return `${(_a = entry.key) != null ? _a : ""}:${inf.source || entry.key || ""}`;
}
function influenceDisabled(env, entry, inf) {
  if (inf.toggle) return false;
  const prop2 = env.settings.modsOffProp || "Modifiers Off";
  const token = offToken(entry, inf).toLowerCase();
  return env.note.list(prop2).some((x) => x.toLowerCase() === token);
}
function setInfluenceDisabled(env, file, entry, inf, off) {
  const prop2 = env.settings.modsOffProp || "Modifiers Off";
  const token = offToken(entry, inf);
  const cur = env.note.list(prop2).filter((x) => x.toLowerCase() !== token.toLowerCase());
  const next = off ? [...cur, token] : cur;
  env.note.set(file, prop2, next.length ? next : void 0);
}
function influenceActive(env, entry, inf) {
  var _a, _b;
  if (!inf.toggle) return !influenceDisabled(env, entry, inf);
  const names = env.note.list(inf.toggle).map((x) => x.toLowerCase());
  const key = ((_a = entry.key) != null ? _a : "").toLowerCase();
  const alias = ((_b = entry.alias) != null ? _b : "").toLowerCase();
  return !!key && names.includes(key) || !!alias && names.includes(alias);
}
function setInfluenceActive(env, file, entry, inf, on) {
  var _a;
  if (!inf.toggle || !entry.key) return;
  const key = entry.key;
  const alias = (_a = entry.alias) != null ? _a : "";
  const without = env.note.list(inf.toggle).filter(
    (x) => x.toLowerCase() !== key.toLowerCase() && (!alias || x.toLowerCase() !== alias.toLowerCase())
  );
  const next = on ? [...without, alias || key] : without;
  env.note.set(file, inf.toggle, next.length ? next : void 0);
}
function applyDerivation(env, inf, raw) {
  var _a, _b;
  if (inf.mode === "formula") {
    const f = compileFormula((_a = inf.formula) != null ? _a : "x");
    return f ? f(raw) : raw;
  }
  const def = env.registries.derivations.get((_b = inf.mode) != null ? _b : "value");
  return def ? def.apply(raw) : raw;
}
function buildFnEnv(env) {
  var _a;
  const derivs = (_a = env.settings.derivations) != null ? _a : [];
  return (name) => {
    const d = derivs.find((x) => x.id.toLowerCase() === name.toLowerCase());
    if (!d) return void 0;
    const f = compileFormula(d.formula);
    if (!f) return void 0;
    return (args) => {
      var _a2;
      return f((_a2 = args[0]) != null ? _a2 : 0);
    };
  };
}
var NoteEval = class {
  constructor(env) {
    this.env = env;
    this.cache = /* @__PURE__ */ new Map();
    this.visiting = /* @__PURE__ */ new Set();
    /** Lower-cased keys found to participate in a cycle (for the error badge). */
    this.cycles = /* @__PURE__ */ new Set();
    this.parsed = /* @__PURE__ */ new Map();
    /** Cross-note aggregate, gated by the kill-switch and vault availability. */
    this.aggFn = (fn, type, key) => {
      if (this.env.settings.crossNote === false || !this.env.vault) return void 0;
      const vals = this.env.vault.valuesByType(type, key);
      if (fn === "count") return vals.length;
      if (vals.length === 0) return fn === "sum" ? 0 : void 0;
      const sum = vals.reduce((a, b) => a + b, 0);
      if (fn === "sum") return sum;
      if (fn === "avg") return sum / vals.length;
      if (fn === "min") return Math.min(...vals);
      if (fn === "max") return Math.max(...vals);
      return void 0;
    };
    /** `prop("LinkProp", "Key")`: value of `key` on the linked note. */
    this.lookupFn = (linkProp, key) => {
      if (this.env.settings.crossNote === false || !this.env.vault) return void 0;
      return this.env.vault.linkedValue(linkProp, key);
    };
    this.fnEnv = buildFnEnv(env);
  }
  total(entry) {
    return this.totalAt(entry, maxDepth(this.env));
  }
  term(entry, inf) {
    return this.termAt(entry, inf, maxDepth(this.env));
  }
  parseExprCached(expr) {
    var _a;
    if (!this.parsed.has(expr)) this.parsed.set(expr, parseExpr(expr));
    return (_a = this.parsed.get(expr)) != null ? _a : null;
  }
  totalAt(entry, depth) {
    var _a;
    const e = ext(entry);
    const key = entry.key || "";
    const kl = key.toLowerCase();
    if (entry.dataType === "derived" && key) {
      const stored = numericRaw(this.env, key);
      if (stored !== null) return stored;
    }
    if (e.rollOverride !== void 0) return e.rollOverride;
    if (kl) {
      if (this.visiting.has(kl)) {
        this.cycles.add(kl);
        return void 0;
      }
      if (this.cache.has(kl)) return this.cache.get(kl);
      this.visiting.add(kl);
    }
    let sum = 0;
    let bad = false;
    for (const inf of (_a = e.mods) != null ? _a : []) {
      const term = this.termAt(entry, inf, depth);
      if (term === void 0) {
        bad = true;
        break;
      }
      sum += term;
    }
    if (kl) this.visiting.delete(kl);
    const res = bad ? void 0 : sum;
    if (kl) this.cache.set(kl, res);
    return res;
  }
  termAt(entry, inf, depth) {
    if (!influenceActive(this.env, entry, inf)) return 0;
    const sign = inf.weight === -1 ? -1 : 1;
    if (inf.expr) {
      const ast = this.parseExprCached(inf.expr);
      if (!ast) return void 0;
      const v = evalExpr(ast, {
        resolve: (n) => this.refValue(n, depth),
        fn: this.fnEnv,
        agg: this.aggFn,
        lookup: this.lookupFn
      });
      return v === void 0 ? void 0 : sign * v;
    }
    const key = inf.source || entry.key || "";
    return sign * applyDerivation(this.env, inf, this.sourceValue(key, depth));
  }
  /** Legacy source resolution: never errors (absent -> 0). */
  sourceValue(key, depth) {
    var _a;
    const stored = numericRaw(this.env, key);
    if (stored !== null) return stored;
    if (depth > 0) {
      const en = findDerivedEntry(this.env, key);
      if (en) return (_a = this.totalAt(en, depth - 1)) != null ? _a : 0;
    }
    return this.env.note.num(key, 0);
  }
  /** Resolve a reference (name, short form, or `Xs` modifier) to a number. */
  resolveRef(name) {
    return this.refValue(name, maxDepth(this.env));
  }
  /**
   * Expression reference: a known property resolves to its value (0 if absent);
   * a name suffixed with `s` (e.g. `INTs`) resolves to that property's
   * *modifier* - its override-aware {@link totalAt} - instead of its value.
   */
  refValue(name, depth) {
    if (name.length > 5 && name.slice(0, 5).toLowerCase() === "this.") name = name.slice(5);
    const key = this.keyFor(name);
    if (key !== null) {
      const stored = numericRaw(this.env, key);
      if (stored !== null) return stored;
      if (depth > 0) {
        const en = findDerivedEntry(this.env, key);
        if (en) return this.totalAt(en, depth - 1);
      }
      return this.env.note.num(key, 0);
    }
    const base = modifierBaseFor(this.env.settings, name);
    if (base !== null) {
      const bk = this.keyFor(base);
      if (bk !== null) {
        const entry = this.findPropEntry(bk);
        if (entry) return this.totalAt(entry, depth);
      }
    }
    const dref = derivationBaseFor(this.env.settings, name);
    if (dref) {
      const v = this.refValue(dref.base, depth);
      if (v !== void 0) {
        const f = compileFormula(dref.formula);
        if (f) return f(v);
      }
    }
    return void 0;
  }
  /** Map a referenced name (key or short form) to a property key. */
  keyFor(name) {
    const candidates = [...Object.keys(this.env.note.raw)];
    if (this.env.layout) {
      for (const s of this.env.layout.sections)
        for (const en of s.entries) if (en.kind === "prop" && en.key) candidates.push(en.key);
    }
    return keyForShortForm(this.env.settings, name, candidates);
  }
  /** Any prop entry (number or derived) with `key` in the active layout. */
  findPropEntry(key) {
    if (!this.env.layout) return null;
    const kl = key.toLowerCase();
    for (const s of this.env.layout.sections)
      for (const e of s.entries) if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl) return e;
    return null;
  }
};
function makeRefResolver(env) {
  const ev = new NoteEval(env);
  return (name) => ev.resolveRef(name);
}
function influenceTerm(env, entry, inf) {
  var _a;
  return (_a = new NoteEval(env).term(entry, inf)) != null ? _a : 0;
}
function modifierTotal(env, entry) {
  var _a;
  return (_a = new NoteEval(env).total(entry)) != null ? _a : 0;
}
function modifierInfo(env, entry) {
  const ev = new NoteEval(env);
  const value = ev.total(entry);
  return { value, error: value === void 0 ? ev.cycles.size > 0 ? "cycle" : "expr" : null };
}
function hasNoteOverride(env, entry) {
  return entry.dataType === "derived" && !!entry.key && numericRaw(env, entry.key) !== null;
}
function defaultAbbr(key) {
  const word = (key != null ? key : "").trim();
  return word.length > 3 ? word.slice(0, 3).toUpperCase() : word.toUpperCase();
}
function abbrFor(settings, key) {
  var _a;
  const kl = (key != null ? key : "").toLowerCase();
  const abbrs = (_a = settings.sourceAbbrs) != null ? _a : {};
  for (const k of Object.keys(abbrs)) if (k.toLowerCase() === kl) return abbrs[k];
  return defaultAbbr(key);
}
function takenShortForms(settings, exceptKey) {
  var _a;
  const out = /* @__PURE__ */ new Set();
  const ex = (exceptKey != null ? exceptKey : "").toLowerCase();
  for (const k of Object.keys((_a = settings.sourceAbbrs) != null ? _a : {})) {
    if (ex && k.toLowerCase() === ex) continue;
    const v = settings.sourceAbbrs[k];
    if (v) out.add(v.toLowerCase());
  }
  return out;
}
function deriveShortForm(name, taken) {
  const letters = (name != null ? name : "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const has = (s) => taken.has(s.toLowerCase());
  if (!letters) {
    let n2 = 1;
    while (has("X" + n2)) n2++;
    return "X" + n2;
  }
  const base = letters.slice(0, 3);
  if (!has(base)) return base;
  const p2 = letters.slice(0, 2);
  for (let j = 3; j < letters.length; j++) {
    const c = p2 + letters[j];
    if (!has(c)) return c;
  }
  const p1 = letters.slice(0, 1);
  for (let a = 1; a < letters.length; a++)
    for (let b = a + 1; b < letters.length; b++) {
      const c = p1 + letters[a] + letters[b];
      if (!has(c)) return c;
    }
  let n = 2;
  while (has(base + n)) n++;
  return base + n;
}
function shortFormConflict(settings, key, abbr) {
  var _a, _b;
  const a = (abbr != null ? abbr : "").trim().toLowerCase();
  const kl = (key != null ? key : "").toLowerCase();
  if (!a) return null;
  for (const k of Object.keys((_a = settings.sourceAbbrs) != null ? _a : {})) {
    if (k.toLowerCase() === kl) continue;
    if (((_b = settings.sourceAbbrs[k]) != null ? _b : "").toLowerCase() === a) return k;
  }
  return null;
}
function assignShortForm(settings, key, abbr) {
  const kl = key.toLowerCase();
  for (const k of Object.keys(settings.sourceAbbrs)) if (k.toLowerCase() === kl) delete settings.sourceAbbrs[k];
  const v = (abbr != null ? abbr : "").trim().toUpperCase();
  if (v) settings.sourceAbbrs[key] = v;
}
function reassignDerived(settings, key) {
  const v = deriveShortForm(key, takenShortForms(settings, key));
  assignShortForm(settings, key, v);
  return v;
}
function ensureShortForm(settings, key) {
  const kl = key.toLowerCase();
  for (const k of Object.keys(settings.sourceAbbrs)) if (k.toLowerCase() === kl && settings.sourceAbbrs[k]) return false;
  assignShortForm(settings, key, deriveShortForm(key, takenShortForms(settings, key)));
  return true;
}
function materializeShortForms(settings) {
  var _a, _b, _c;
  const keys = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (k) => {
    const kl = k.toLowerCase();
    if (kl && !seen.has(kl)) {
      seen.add(kl);
      keys.push(k);
    }
  };
  for (const lk of Object.keys((_a = settings.layouts) != null ? _a : {}))
    for (const s of (_b = settings.layouts[lk].sections) != null ? _b : [])
      for (const e of (_c = s.entries) != null ? _c : []) {
        if (e.kind !== "prop" || !e.key) continue;
        const dt = e.dataType;
        if (dt === "number" || dt === "decimal" || dt === "derived") add(e.key);
        const mods2 = e.mods;
        if (Array.isArray(mods2)) {
          for (const inf of mods2) if (inf && inf.source) add(inf.source);
        }
      }
  let changed = false;
  for (const k of keys) if (ensureShortForm(settings, k)) changed = true;
  return changed;
}
function modifierSuffix(settings) {
  var _a;
  return (_a = settings.modifierSuffix) != null ? _a : "s";
}
function modifierBaseFor(settings, name) {
  const suf = modifierSuffix(settings);
  if (!suf) return null;
  const tail = "." + suf;
  if (name.length <= tail.length) return null;
  return name.toLowerCase().endsWith(tail.toLowerCase()) ? name.slice(0, name.length - tail.length) : null;
}
function derivationBaseFor(settings, name) {
  var _a, _b;
  for (const d of (_a = settings.derivations) != null ? _a : []) {
    const suf = ((_b = d.suffix) != null ? _b : "").trim();
    if (!suf) continue;
    const tail = "." + suf;
    if (name.length > tail.length && name.toLowerCase().endsWith(tail.toLowerCase()))
      return { base: name.slice(0, name.length - tail.length), formula: d.formula };
  }
  return null;
}
function poolSuffix(settings) {
  var _a;
  return (_a = settings.poolSuffix) != null ? _a : "p";
}
function poolBaseFor(settings, name) {
  const suf = poolSuffix(settings);
  if (!suf) return null;
  const tail = "." + suf;
  if (name.length <= tail.length) return null;
  return name.toLowerCase().endsWith(tail.toLowerCase()) ? name.slice(0, name.length - tail.length) : null;
}
function referenceSuggestions(settings, keys) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (text, hint) => {
    const tl = text.toLowerCase();
    if (text && !seen.has(tl)) {
      seen.add(tl);
      out.push({ text, hint });
    }
  };
  for (const k of keys) {
    const a = abbrFor(settings, k);
    add(k, a);
    add(a, k);
  }
  return out;
}
function keyForShortForm(settings, abbr, candidateKeys) {
  var _a, _b;
  const a = (abbr != null ? abbr : "").trim().toLowerCase();
  if (!a) return null;
  for (const k of Object.keys((_a = settings.sourceAbbrs) != null ? _a : {}))
    if (((_b = settings.sourceAbbrs[k]) != null ? _b : "").toLowerCase() === a) return k;
  for (const k of candidateKeys) if (k.toLowerCase() === a) return k;
  for (const k of candidateKeys) if (defaultAbbr(k).toLowerCase() === a) return k;
  return null;
}
function exprDenotation(settings, expr) {
  const ast = parseExpr(expr);
  return ast ? serializeExpr(ast, (name) => abbrFor(settings, name)) : expr;
}
function termDenotation(settings, entry, inf) {
  return inf.expr ? exprDenotation(settings, inf.expr) : abbrFor(settings, inf.source || entry.key || "");
}
function denotationText(settings, entry, mods2) {
  let out = "";
  mods2.forEach((inf, i) => {
    const neg = inf.weight === -1;
    if (i > 0) out += neg ? " - " : " + ";
    else if (neg) out += "-";
    out += termDenotation(settings, entry, inf);
  });
  return out;
}
function influenceSources(entries) {
  const out = [];
  for (const en of entries) {
    const mods2 = en.mods;
    if (!Array.isArray(mods2)) continue;
    for (const inf of mods2)
      if (inf && typeof inf === "object" && inf.source) out.push(inf.source);
  }
  return [...new Set(out)];
}

// src/core/settings.ts
var DEFAULT_DEFAULTS = {
  dataType: "text",
  colorSpace: "HSL",
  sectionColumns: 1,
  sectionTransparent: false,
  sectionSticky: false,
  sectionSize: "unlimited",
  sectionCollapsible: true,
  sectionDividers: false,
  fontFamily: "",
  baseSize: 0,
  labelSize: 0,
  valueSize: 0,
  titleSize: 0,
  listSize: 0
};
function defaultSettings() {
  return {
    types: [],
    layouts: {},
    hideShown: true,
    defaults: { ...DEFAULT_DEFAULTS },
    manualHide: [],
    propMenu: true,
    language: "en",
    stringOverrides: {},
    features: {},
    derivations: defaultDerivations(),
    sourceAbbrs: {},
    modDepth: 8,
    diceAnim: true,
    diceAnimRolls: 10,
    diceAnimMs: 1500,
    diceAnimStyle: "classic",
    dice3dAA: false,
    sound: true,
    soundVolume: 0.3,
    diceAnimStay: false,
    diceAnimBlock: true,
    modsOffProp: "Modifiers Off",
    macros: [],
    rollHistory: [],
    rollHistoryLimit: 500,
    rollHistoryEnabled: true,
    critRanges: {},
    failOnOne: true,
    modifierSuffix: "s",
    crossNote: true
  };
}
var HANDLED_KEYS = /* @__PURE__ */ new Set([
  "types",
  "layouts",
  "layout",
  "hideShown",
  "defaults",
  "manualHide",
  "propMenu",
  "language",
  "stringOverrides",
  "features",
  "derivations",
  "sourceAbbrs",
  "modDepth",
  "diceAnim",
  "diceAnimRolls",
  "diceAnimMs",
  "diceAnimStyle",
  "dice3dAA",
  "sound",
  "soundVolume",
  "diceAnimStay",
  "diceAnimBlock",
  "karmicRolls",
  "modsOffProp",
  "macros",
  "rollHistory",
  "rollHistoryLimit",
  "rollHistoryEnabled",
  "critRanges",
  "failOnOne",
  "modifierSuffix",
  "poolSuffix",
  "poolExtras",
  "dnd5ePoolsSeeded",
  "crossNote",
  "conflictGuard",
  "tableLayouts",
  "tableLastType",
  "schemaVersion",
  "soundUi",
  "soundDice",
  "soundCrit",
  "layoutVault",
  "layoutVaultFolder",
  "appVersion",
  "snapshots",
  "snapshotKeep",
  "lastSnapshot",
  "inlineEntries",
  "propTypes",
  "dateProps"
]);
function cleanTypes(raw) {
  return Array.isArray(raw) ? raw.filter((t) => typeof t === "string" && t.trim() !== "") : [];
}
function cleanLayouts(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, l] of Object.entries(raw)) {
    if (!l || typeof l !== "object" || !Array.isArray(l.sections)) continue;
    const lay = l;
    const sections = lay.sections.filter((sec) => !!sec && typeof sec === "object" && !Array.isArray(sec)).map((sec) => ({
      ...sec,
      entries: Array.isArray(sec.entries) ? sec.entries.filter((e) => !!e && typeof e === "object" && !Array.isArray(e)) : []
    }));
    out[k] = { ...lay, sections };
  }
  return out;
}
function normalizeSettings(raw, defaultLayout) {
  var _a, _b, _c;
  const s = defaultSettings();
  const data = raw && typeof raw === "object" ? raw : null;
  if (data) {
    if (data.layouts && data.types) {
      s.types = cleanTypes(data.types);
      s.layouts = cleanLayouts(data.layouts);
    } else if ((_b = (_a = data.layout) == null ? void 0 : _a.sections) == null ? void 0 : _b.length) {
      s.types = ["Character"];
      s.layouts = cleanLayouts({ character: data.layout });
    }
    if (typeof data.hideShown === "boolean") s.hideShown = data.hideShown;
    if (data.defaults) s.defaults = { ...DEFAULT_DEFAULTS, ...data.defaults };
    if (Array.isArray(data.manualHide)) s.manualHide = data.manualHide;
    if (typeof data.propMenu === "boolean") s.propMenu = data.propMenu;
    if (data.stringOverrides && typeof data.stringOverrides === "object")
      s.stringOverrides = data.stringOverrides;
    if (data.features && typeof data.features === "object") s.features = data.features;
    if (Array.isArray(data.derivations))
      s.derivations = data.derivations.filter(
        (d) => !!d && typeof d.id === "string"
      );
    if (data.sourceAbbrs && typeof data.sourceAbbrs === "object")
      s.sourceAbbrs = data.sourceAbbrs;
    if (typeof data.modDepth === "number" && data.modDepth >= 0)
      s.modDepth = Math.min(32, Math.floor(data.modDepth));
    if (typeof data.diceAnim === "boolean") s.diceAnim = data.diceAnim;
    if (typeof data.diceAnimRolls === "number" && data.diceAnimRolls >= 1)
      s.diceAnimRolls = Math.min(60, Math.floor(data.diceAnimRolls));
    if (typeof data.diceAnimMs === "number" && data.diceAnimMs >= 300)
      s.diceAnimMs = Math.min(1e4, Math.floor(data.diceAnimMs));
    if (typeof data.diceAnimStyle === "string") s.diceAnimStyle = data.diceAnimStyle;
    if (data.dice3dAA === false) s.dice3dAA = false;
    if (data.sound === false) s.sound = false;
    if (typeof data.soundVolume === "number" && data.soundVolume >= 0)
      s.soundVolume = Math.min(1, data.soundVolume);
    if (typeof data.diceAnimStay === "boolean") s.diceAnimStay = data.diceAnimStay;
    if (typeof data.diceAnimBlock === "boolean") s.diceAnimBlock = data.diceAnimBlock;
    if (data.karmicRolls === true) s.karmicRolls = true;
    if (typeof data.modsOffProp === "string" && data.modsOffProp.trim())
      s.modsOffProp = data.modsOffProp.trim();
    if (Array.isArray(data.macros))
      s.macros = data.macros.filter(
        (m) => !!m && typeof m.id === "string" && typeof m.name === "string"
      ).map((m) => {
        const o = m;
        return {
          id: o.id,
          name: o.name,
          segs: Array.isArray(o.segs) ? o.segs.filter((x) => !!x && typeof x === "object") : [],
          mode: o.mode === "advantage" || o.mode === "disadvantage" ? o.mode : void 0,
          times: typeof o.times === "number" && o.times > 1 ? Math.min(20, Math.floor(o.times)) : void 0,
          typeKey: typeof o.typeKey === "string" && o.typeKey ? o.typeKey : void 0
        };
      });
    if (Array.isArray(data.rollHistory))
      s.rollHistory = data.rollHistory.filter(
        (r) => !!r && typeof r === "object" && typeof r.id === "string"
      );
    if (typeof data.rollHistoryLimit === "number" && data.rollHistoryLimit > 0)
      s.rollHistoryLimit = Math.min(5e3, Math.floor(data.rollHistoryLimit));
    if (data.rollHistoryEnabled === false) s.rollHistoryEnabled = false;
    if (data.critRanges && typeof data.critRanges === "object") {
      const out = {};
      for (const k of Object.keys(data.critRanges)) {
        const v = Number(data.critRanges[k]);
        if (Number.isFinite(v) && v >= 1) out[k] = Math.floor(v);
      }
      s.critRanges = out;
    }
    if (data.failOnOne === false) s.failOnOne = false;
    if (typeof data.modifierSuffix === "string") s.modifierSuffix = data.modifierSuffix;
    if (typeof data.poolSuffix === "string") s.poolSuffix = data.poolSuffix;
    if (data.dnd5ePoolsSeeded === true) s.dnd5ePoolsSeeded = true;
    if (data.poolExtras && typeof data.poolExtras === "object") {
      const cleanPool = {};
      for (const [k, v] of Object.entries(data.poolExtras)) {
        if (!Array.isArray(v)) continue;
        const arr = v.filter((x) => typeof x === "string" && x.trim() !== "");
        if (arr.length) cleanPool[k.toLowerCase()] = arr;
      }
      if (Object.keys(cleanPool).length) s.poolExtras = cleanPool;
    }
    if (data.crossNote === false) s.crossNote = false;
    if (data.conflictGuard === false) s.conflictGuard = false;
    if (data.tableLayouts && typeof data.tableLayouts === "object")
      s.tableLayouts = data.tableLayouts;
    if (data.inlineEntries && typeof data.inlineEntries === "object") {
      const clean = {};
      for (const [k, v] of Object.entries(data.inlineEntries)) {
        if (v && typeof v === "object" && typeof v.kind === "string") clean[k] = v;
      }
      s.inlineEntries = clean;
    }
    if (data.dateProps && typeof data.dateProps === "object")
      s.dateProps = data.dateProps;
    if (data.propTypes && typeof data.propTypes === "object") {
      const clean = {};
      for (const [k, v] of Object.entries(data.propTypes)) {
        if (typeof v === "string" && v) clean[k.toLowerCase()] = v;
      }
      if (Object.keys(clean).length) s.propTypes = clean;
    }
    if (typeof data.tableLastType === "string") s.tableLastType = data.tableLastType;
    if (typeof data.schemaVersion === "number") s.schemaVersion = data.schemaVersion;
    if (data.soundUi === false) s.soundUi = false;
    if (data.soundDice === false) s.soundDice = false;
    if (data.soundCrit === false) s.soundCrit = false;
    if (data.layoutVault === true) s.layoutVault = true;
    if (typeof data.layoutVaultFolder === "string" && data.layoutVaultFolder.trim())
      s.layoutVaultFolder = data.layoutVaultFolder.trim();
    if (typeof data.appVersion === "string") s.appVersion = data.appVersion;
    if (data.snapshots === true) s.snapshots = true;
    if (typeof data.snapshotKeep === "number" && data.snapshotKeep > 0)
      s.snapshotKeep = Math.min(200, Math.floor(data.snapshotKeep));
    if (typeof data.lastSnapshot === "number") s.lastSnapshot = data.lastSnapshot;
    for (const k of Object.keys(data))
      if (!HANDLED_KEYS.has(k)) s[k] = data[k];
  }
  for (const t of s.types) {
    const k = t.toLowerCase();
    if (!((_c = s.layouts[k]) == null ? void 0 : _c.sections)) s.layouts[k] = defaultLayout();
  }
  return s;
}
var CURRENT_SCHEMA = 2;
var SCHEMA_MIGRATIONS = [
  {
    to: 1,
    name: "dedupe-types-and-prune-orphan-tables",
    run: (s) => {
      let changed = false;
      const seen = /* @__PURE__ */ new Set();
      const deduped = s.types.filter((tp) => {
        const k = tp.toLowerCase();
        if (seen.has(k)) {
          changed = true;
          return false;
        }
        seen.add(k);
        return true;
      });
      if (changed) s.types = deduped;
      if (s.tableLayouts) {
        for (const k of Object.keys(s.tableLayouts))
          if (!seen.has(k.toLowerCase())) {
            delete s.tableLayouts[k];
            changed = true;
          }
      }
      return changed;
    }
  },
  {
    to: 2,
    name: "unify-property-datatypes",
    run: (s) => {
      var _a, _b;
      let changed = false;
      const map = { ...(_a = s.propTypes) != null ? _a : {} };
      const each = (fn) => {
        var _a2, _b2, _c;
        for (const lk of Object.keys((_a2 = s.layouts) != null ? _a2 : {}))
          for (const sec of (_b2 = s.layouts[lk].sections) != null ? _b2 : [])
            for (const e of (_c = sec.entries) != null ? _c : []) fn(e);
      };
      each((e) => {
        if (e.kind !== "prop" || !e.key || typeof e.dataType !== "string") return;
        const kl = e.key.toLowerCase();
        if (!map[kl]) map[kl] = e.dataType;
      });
      each((e) => {
        if (e.kind !== "prop" || !e.key || e.dataType === void 0) return;
        const want = map[e.key.toLowerCase()];
        if (want && e.dataType !== want) {
          e.dataType = want;
          changed = true;
        }
      });
      if (Object.keys(map).length && JSON.stringify(map) !== JSON.stringify((_b = s.propTypes) != null ? _b : {})) {
        s.propTypes = map;
        changed = true;
      }
      return changed;
    }
  }
];
function runSchemaMigrations(s, table = SCHEMA_MIGRATIONS) {
  const from = typeof s.schemaVersion === "number" ? s.schemaVersion : 0;
  let changed = false;
  const ran = [];
  for (const m of [...table].sort((a, b) => a.to - b.to)) {
    if (m.to <= from) continue;
    if (m.run(s)) changed = true;
    ran.push(m.name);
  }
  if (s.schemaVersion !== CURRENT_SCHEMA) {
    s.schemaVersion = CURRENT_SCHEMA;
    if (from < CURRENT_SCHEMA) changed = true;
  }
  return { changed, from, to: CURRENT_SCHEMA, ran };
}

// src/core/layout-store.ts
var import_obsidian = require("obsidian");
var ENVELOPE_SCHEMA = 1;
var ECHO_MS = 1500;
var DEFAULT_FOLDER = "_extended-properties";
function cleanFolder(f) {
  return (f || "").trim().replace(/^[/\\]+|[/\\]+$/g, "");
}
function safeStem(typeKey) {
  return typeKey.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "type";
}
function isLayout(x) {
  return !!x && typeof x === "object" && Array.isArray(x.sections);
}
var LayoutStore = class {
  constructor(app, i18n, folder, getLayout, getTypeName) {
    this.app = app;
    this.i18n = i18n;
    this.folder = folder;
    this.getLayout = getLayout;
    this.getTypeName = getTypeName;
    this.timers = /* @__PURE__ */ new Map();
    this.lastWrite = /* @__PURE__ */ new Map();
    /** Last JSON written per file, to skip no-op rewrites (avoids sync churn). */
    this.lastContent = /* @__PURE__ */ new Map();
  }
  dir() {
    return cleanFolder(this.folder()) || DEFAULT_FOLDER;
  }
  pathFor(typeKey) {
    return `${this.dir()}/${safeStem(typeKey.toLowerCase())}.json`;
  }
  /** True when `path` was just written by us (ignore its vault echo). */
  isEcho(path) {
    const t = this.lastWrite.get(path);
    return t !== void 0 && Date.now() - t < ECHO_MS;
  }
  /** Whether `path` is a layout file in our folder. */
  owns(path) {
    const d = this.dir().toLowerCase();
    const p = path.toLowerCase();
    return p.startsWith(d + "/") && p.endsWith(".json");
  }
  /** Read every layout file in the folder. Bad files are skipped with a notice. */
  async readAll() {
    const out = {};
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    try {
      if (!await adapter.exists(dir)) return out;
      const listing = await adapter.list(dir);
      for (const f of listing.files) {
        if (!f.toLowerCase().endsWith(".json")) continue;
        try {
          const env = JSON.parse(await adapter.read(f));
          if (typeof env.type === "string" && isLayout(env.layout)) out[env.type.toLowerCase()] = env.layout;
          else new import_obsidian.Notice(this.i18n.t("layoutStore.badFile", { file: f }));
        } catch (e) {
          new import_obsidian.Notice(this.i18n.t("layoutStore.badFile", { file: f }));
        }
      }
    } catch (e) {
      console.error("Extended Properties: reading layout files failed", e);
    }
    return out;
  }
  /** Write one type's current layout immediately (skips a no-op rewrite). */
  async writeNow(typeKey) {
    const layout = this.getLayout(typeKey.toLowerCase());
    if (!layout) return;
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    const path = this.pathFor(typeKey);
    const env = {
      ep: "extended-properties-layout",
      schema: ENVELOPE_SCHEMA,
      type: typeKey.toLowerCase(),
      typeName: this.getTypeName(typeKey.toLowerCase()),
      layout
    };
    const json = JSON.stringify(env, null, 2);
    if (this.lastContent.get(path) === json) return;
    try {
      if (!await adapter.exists(dir)) await adapter.mkdir(dir);
      this.lastWrite.set(path, Date.now());
      await adapter.write(path, json);
      this.lastWrite.set(path, Date.now());
      this.lastContent.set(path, json);
    } catch (e) {
      console.error("Extended Properties: writing layout file failed", e);
      new import_obsidian.Notice(this.i18n.t("layoutStore.writeFailed", { type: this.getTypeName(typeKey.toLowerCase()) }));
    }
  }
  /** Debounced write of one type's layout. */
  write(typeKey) {
    const key = typeKey.toLowerCase();
    const prev = this.timers.get(key);
    if (prev) window.clearTimeout(prev);
    this.timers.set(
      key,
      window.setTimeout(() => {
        this.timers.delete(key);
        void this.writeNow(key);
      }, 400)
    );
  }
  /** Write every given type's layout now (used when enabling vault mode). */
  async writeAll(types) {
    for (const t of types) await this.writeNow(t.toLowerCase());
  }
  /** Delete a type's layout file (used when a type is removed). */
  async remove(typeKey) {
    try {
      const path = this.pathFor(typeKey);
      const adapter = this.app.vault.adapter;
      this.lastWrite.set(path, Date.now());
      this.lastContent.delete(path);
      if (await adapter.exists(path)) await adapter.remove(path);
    } catch (e) {
      console.error("Extended Properties: removing layout file failed", e);
    }
  }
  /** Flush all pending debounced writes immediately (call on unload). */
  flushAll() {
    const keys = [...this.timers.keys()];
    for (const t of this.timers.values()) window.clearTimeout(t);
    this.timers.clear();
    for (const k of keys) void this.writeNow(k);
  }
};

// src/core/snapshot-store.ts
var import_obsidian2 = require("obsidian");
var SCHEMA = 1;
var PREFIX = "ep-snapshot-";
function snapshotStem(d = /* @__PURE__ */ new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return PREFIX + `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function pruneList(names, keep) {
  const snaps = names.filter((n) => n.includes(PREFIX)).sort();
  if (keep <= 0) return snaps;
  return snaps.slice(0, Math.max(0, snaps.length - keep));
}
var SnapshotStore = class {
  constructor(app, i18n, folder, appVersion) {
    this.app = app;
    this.i18n = i18n;
    this.folder = folder;
    this.appVersion = appVersion;
  }
  dir() {
    return (cleanFolder(this.folder()) || "_extended-properties") + "/snapshots";
  }
  /** Write a snapshot of `data`; prune to the newest `keep`. Returns its path or null. */
  async save(data, keep = 20) {
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    const path = `${dir}/${snapshotStem()}.json`;
    const env = {
      ep: "extended-properties-snapshot",
      schema: SCHEMA,
      time: Date.now(),
      app: this.appVersion,
      data
    };
    try {
      if (!await adapter.exists(dir)) await adapter.mkdir(dir);
      await adapter.write(path, JSON.stringify(env, null, 2));
      await this.prune(keep);
      return path;
    } catch (e) {
      console.error("Extended Properties: snapshot save failed", e);
      new import_obsidian2.Notice(this.i18n.t("snapshot.saveFailed"));
      return null;
    }
  }
  /** All snapshots, newest first. */
  async list() {
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    try {
      if (!await adapter.exists(dir)) return [];
      const listing = await adapter.list(dir);
      return listing.files.filter((f) => f.includes(PREFIX) && f.endsWith(".json")).map((f) => {
        var _a;
        return { path: f, name: (_a = f.split("/").pop()) != null ? _a : f };
      }).sort((a, b) => b.name.localeCompare(a.name));
    } catch (e) {
      console.error("Extended Properties: snapshot list failed", e);
      return [];
    }
  }
  /** Parsed `data` payload of a snapshot, or null if unreadable. */
  async read(path) {
    var _a;
    try {
      const env = JSON.parse(await this.app.vault.adapter.read(path));
      return env && env.ep === "extended-properties-snapshot" ? (_a = env.data) != null ? _a : null : null;
    } catch (e) {
      console.error("Extended Properties: snapshot read failed", e);
      new import_obsidian2.Notice(this.i18n.t("snapshot.readFailed"));
      return null;
    }
  }
  /** Delete all but the newest `keep` snapshots. */
  async prune(keep) {
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    try {
      if (!await adapter.exists(dir)) return;
      const listing = await adapter.list(dir);
      const names = listing.files.map((f) => {
        var _a;
        return (_a = f.split("/").pop()) != null ? _a : f;
      });
      const toDelete = pruneList(names, keep);
      for (const name of toDelete) {
        const full = `${dir}/${name}`;
        if (await adapter.exists(full)) await adapter.remove(full);
      }
    } catch (e) {
      console.error("Extended Properties: snapshot prune failed", e);
    }
  }
};

// src/core/secure.ts
var PREFIX2 = "ep-enc:1:";
var ITERATIONS = 15e4;
var subtle = () => {
  const c = window.crypto;
  if (!(c == null ? void 0 : c.subtle)) throw new Error("Web Crypto unavailable");
  return c.subtle;
};
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
function toB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
async function deriveKey(passphrase, salt) {
  const material = await subtle().importKey("raw", textEncoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
function isEnvelope(v) {
  return typeof v === "string" && v.startsWith(PREFIX2);
}
async function encryptValue(plain, passphrase) {
  const c = window.crypto;
  const salt = c.getRandomValues(new Uint8Array(16));
  const iv = c.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plain)));
  return PREFIX2 + toB64(salt) + ":" + toB64(iv) + ":" + toB64(ct);
}
async function decryptValue(envelope, passphrase) {
  if (!isEnvelope(envelope)) throw new Error("not an Extended Properties envelope");
  const parts = envelope.slice(PREFIX2.length).split(":");
  if (parts.length !== 3) throw new Error("malformed envelope");
  const key = await deriveKey(passphrase, fromB64(parts[0]));
  const pt = await subtle().decrypt({ name: "AES-GCM", iv: fromB64(parts[1]) }, key, fromB64(parts[2]));
  return textDecoder.decode(pt);
}
var SecretStore = class {
  constructor() {
    this.pass = null;
    this.cache = /* @__PURE__ */ new Map();
  }
  isUnlocked() {
    return this.pass !== null;
  }
  /** Begin a session with `passphrase`; drops any previously decrypted values. */
  unlock(passphrase) {
    this.pass = passphrase;
    this.cache.clear();
  }
  /** End the session: forget the passphrase and every decrypted value. */
  lock() {
    this.pass = null;
    this.cache.clear();
  }
  /** Synchronous, cache-only plaintext for an envelope (null if not decrypted). */
  reveal(envelope) {
    var _a;
    return (_a = this.cache.get(envelope)) != null ? _a : null;
  }
  /** Encrypt `plain` for storage, caching the round-trip for instant display. */
  async encrypt(plain) {
    if (this.pass === null) throw new Error("locked");
    const env = await encryptValue(plain, this.pass);
    this.cache.set(env, plain);
    return env;
  }
  /** Decrypt an envelope (memoized); throws on a wrong passphrase. */
  async decrypt(envelope) {
    if (this.pass === null) throw new Error("locked");
    const hit = this.cache.get(envelope);
    if (hit !== void 0) return hit;
    const plain = await decryptValue(envelope, this.pass);
    this.cache.set(envelope, plain);
    return plain;
  }
  /**
   * Decrypt every envelope among `values` into the cache. Returns how many were
   * newly decrypted (so the caller can skip a re-render when nothing changed).
   * A value that fails to decrypt (wrong key / corrupt) is silently left masked
   * - never throws, never loses data.
   */
  async prime(values) {
    if (this.pass === null) return 0;
    let n = 0;
    for (const v of values) {
      if (isEnvelope(v) && !this.cache.has(v)) {
        try {
          this.cache.set(v, await decryptValue(v, this.pass));
          n++;
        } catch (e) {
        }
      }
    }
    return n;
  }
};

// src/core/registry.ts
var Registry = class {
  constructor() {
    this.items = /* @__PURE__ */ new Map();
  }
  add(item) {
    this.items.set(item.id, item);
  }
  get(id) {
    return id === void 0 ? void 0 : this.items.get(id);
  }
  all() {
    return [...this.items.values()];
  }
  clear() {
    this.items.clear();
  }
};
var Registries = class {
  constructor() {
    this.valueTypes = new Registry();
    this.entryKinds = new Registry();
    this.clusterAddons = new Registry();
    this.derivations = new Registry();
    this.sectionTemplates = new Registry();
    this.layoutPresets = new Registry();
    /** Preset used for brand-new note types. Features may claim this. */
    this.defaultPresetId = "empty";
  }
  clear() {
    this.valueTypes.clear();
    this.entryKinds.clear();
    this.clusterAddons.clear();
    this.derivations.clear();
    this.sectionTemplates.clear();
    this.layoutPresets.clear();
    this.defaultPresetId = "empty";
  }
};
var ServiceHub = class {
  constructor() {
    this.services = /* @__PURE__ */ new Map();
  }
  /** Get the service registered under `key`, creating it on first use. */
  get(key, factory) {
    let s = this.services.get(key);
    if (!s) {
      s = factory();
      this.services.set(key, s);
    }
    return s;
  }
  /** Broadcast a note switch to all services. */
  notifyFileChanged() {
    var _a;
    for (const s of this.services.values()) (_a = s.onFileChange) == null ? void 0 : _a.call(s);
  }
};

// src/core/property-index.ts
var import_obsidian3 = require("obsidian");
function linkTarget(raw) {
  const m = /\[\[([^\]|#]+)/.exec(raw);
  return (m ? m[1] : raw).trim();
}
function typesOf(fm) {
  const tv = getCI(fm, "Type");
  return Array.isArray(tv) ? tv.map((x) => String(x).toLowerCase()) : tv === void 0 || tv === null ? [] : [String(tv).toLowerCase()];
}
var PropertyIndex = class {
  constructor(app) {
    this.app = app;
    /**
     * Per-file frontmatter snapshot cache. Every query above used to call
     * `vault.getMarkdownFiles()` + `metadataCache.getFileCache()` fresh, which
     * means a single cross-note `sum()/avg()/prop()` reference re-scanned the
     * whole vault synchronously on every sidebar render. The cache is built
     * lazily on first read and kept in sync by {@link invalidateFile} /
     * {@link invalidateAll}, which `main.ts` wires to the vault's modify,
     * delete, rename and `metadataCache.changed` events.
     */
    this.cache = null;
    /**
     * Type-bucket index (N1): lower-cased `Type` value -> paths of the notes
     * carrying it. Built with the snapshot cache and maintained by the same
     * invalidation events, it serves {@link rowsByType} and the aggregate
     * candidate sets, so per-type reads cost O(notes of that type) instead of
     * scanning every snapshot in the vault.
     */
    this.buckets = /* @__PURE__ */ new Map();
    /**
     * Memoized aggregate candidate values (N1), keyed `type\u0000key` (both
     * lower-cased). Invalidated whenever any note of that type changes -
     * including notes *entering or leaving* the type: a `Type`-list change
     * dirties both the old and new buckets' aggregates.
     */
    this.aggValues = /* @__PURE__ */ new Map();
  }
  ensure() {
    var _a;
    if (!this.cache) {
      this.cache = /* @__PURE__ */ new Map();
      this.buckets.clear();
      this.aggValues.clear();
      for (const f of this.app.vault.getMarkdownFiles()) {
        const fm = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter;
        this.cache.set(f.path, { file: f, fm });
        this.bucketAdd(f.path, fm);
      }
    }
    return this.cache;
  }
  snapshots() {
    return this.ensure().values();
  }
  bucketAdd(path, fm) {
    if (!fm) return;
    for (const t of typesOf(fm)) {
      let b = this.buckets.get(t);
      if (!b) this.buckets.set(t, b = /* @__PURE__ */ new Set());
      b.add(path);
    }
  }
  bucketRemove(path, fm) {
    var _a;
    if (!fm) return;
    for (const t of typesOf(fm)) (_a = this.buckets.get(t)) == null ? void 0 : _a.delete(path);
  }
  /** Drop every memoized aggregate of the given (lower-cased) types. */
  dirtyTypes(types) {
    for (const t of types) {
      const prefix = t + "\0";
      for (const k of [...this.aggValues.keys()]) if (k.startsWith(prefix)) this.aggValues.delete(k);
    }
  }
  /** Refresh one file's cached frontmatter (called on modify/rename/metadata-changed). */
  invalidateFile(file, oldPath) {
    var _a;
    if (!this.cache) return;
    if (oldPath && oldPath !== file.path) this.invalidatePath(oldPath);
    const old = this.cache.get(file.path);
    const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    if (old) this.bucketRemove(file.path, old.fm);
    this.cache.set(file.path, { file, fm });
    this.bucketAdd(file.path, fm);
    this.dirtyTypes(/* @__PURE__ */ new Set([...(old == null ? void 0 : old.fm) ? typesOf(old.fm) : [], ...fm ? typesOf(fm) : []]));
  }
  /** Drop one file (called on delete). */
  invalidatePath(path) {
    if (!this.cache) return;
    const old = this.cache.get(path);
    if (old) {
      this.bucketRemove(path, old.fm);
      this.dirtyTypes(old.fm ? typesOf(old.fm) : []);
    }
    this.cache.delete(path);
  }
  /** Drop the whole cache - cheap escape hatch, rebuilt lazily on next read. */
  invalidateAll() {
    this.cache = null;
    this.buckets.clear();
    this.aggValues.clear();
  }
  /**
   * Numeric values of `key` across every note whose `Type` includes
   * `typeKey`. Memoized (N1): repeated reads return the cached array until a
   * note of that type - or one entering/leaving it - invalidates. Callers
   * must treat the result as read-only.
   */
  valuesByType(typeKey, key) {
    var _a, _b;
    const want = typeKey.trim().toLowerCase();
    const ck = want + "\0" + key.toLowerCase();
    const hit = this.aggValues.get(ck);
    if (hit) return hit;
    const cache = this.ensure();
    const out = [];
    for (const path of (_a = this.buckets.get(want)) != null ? _a : []) {
      const fm = (_b = cache.get(path)) == null ? void 0 : _b.fm;
      if (!fm) continue;
      const n = parseNumeric(getCI(fm, key));
      if (n !== null) out.push(n);
    }
    this.aggValues.set(ck, out);
    return out;
  }
  /**
   * Files (with their cached frontmatter) whose `Type` includes `typeKey` -
   * the row projection the type table view renders. Served from the type
   * bucket (N1), so the cost is O(notes of the type), not O(vault).
   */
  rowsByType(typeKey) {
    var _a;
    const want = typeKey.trim().toLowerCase();
    const out = [];
    if (!want) return out;
    const cache = this.ensure();
    for (const path of (_a = this.buckets.get(want)) != null ? _a : []) {
      const snap = cache.get(path);
      if (snap == null ? void 0 : snap.fm) out.push({ file: snap.file, fm: snap.fm });
    }
    return out;
  }
  /** Value of `key` on the note linked in `sourcePath`'s `linkProp` property. */
  linkedValue(sourcePath, linkProp, key) {
    var _a, _b, _c;
    const src = this.app.vault.getAbstractFileByPath(sourcePath);
    const sfm = src instanceof import_obsidian3.TFile ? (_a = this.app.metadataCache.getFileCache(src)) == null ? void 0 : _a.frontmatter : void 0;
    if (!sfm) return void 0;
    const raw = getCI(sfm, linkProp);
    if (raw === void 0 || raw === null || raw === "") return void 0;
    const target = linkTarget(String(Array.isArray(raw) ? raw[0] : raw));
    if (!target) return void 0;
    const dest = this.app.metadataCache.getFirstLinkpathDest(target, sourcePath);
    if (!dest) return void 0;
    const dfm = (_b = this.app.metadataCache.getFileCache(dest)) == null ? void 0 : _b.frontmatter;
    return dfm ? (_c = parseNumeric(getCI(dfm, key))) != null ? _c : void 0 : void 0;
  }
  /**
   * All property names known to the vault. Prefers the metadata managers;
   * falls back to scanning frontmatter of up to 1000 notes.
   */
  knownProps() {
    var _a, _b, _c, _d, _e;
    const names = /* @__PURE__ */ new Set();
    try {
      const mc = this.app.metadataCache;
      const infos = (_a = mc.getAllPropertyInfos) == null ? void 0 : _a.call(mc);
      if (infos) for (const k of Object.keys(infos)) names.add((_c = (_b = infos[k]) == null ? void 0 : _b.name) != null ? _c : k);
      const mt = this.app.metadataTypeManager;
      if (mt == null ? void 0 : mt.properties) for (const k of Object.keys(mt.properties)) names.add((_e = (_d = mt.properties[k]) == null ? void 0 : _d.name) != null ? _e : k);
    } catch (e) {
    }
    if (names.size === 0) {
      let scanned = 0;
      for (const { fm } of this.snapshots()) {
        if (++scanned > 1e3) break;
        if (fm) for (const k of Object.keys(fm)) names.add(k);
      }
    }
    return [...names];
  }
  /** Smallest and largest numeric value of `key` across all notes. */
  numberRange(key) {
    let min = Infinity;
    let max = -Infinity;
    for (const { fm } of this.snapshots()) {
      const v = fm == null ? void 0 : fm[key];
      if (v === null || v === void 0 || v === "") continue;
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      if (n < min) min = n;
      if (n > max) max = n;
    }
    return min <= max ? { min, max } : null;
  }
  /** Distinct values used for `key` anywhere in the vault, sorted. */
  valuesFor(key) {
    const set = /* @__PURE__ */ new Set();
    for (const { fm } of this.snapshots()) {
      const v = fm == null ? void 0 : fm[key];
      if (Array.isArray(v)) v.forEach((x) => set.add(String(x)));
      else if (v !== void 0 && v !== null && v !== "") set.add(String(v));
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }
  /** Basenames of notes whose `key` contains `value`. */
  notesWithValue(key, value) {
    const out = [];
    for (const { file, fm } of this.snapshots()) {
      const v = fm == null ? void 0 : fm[key];
      const has = Array.isArray(v) ? v.some((x) => String(x) === value) : v !== void 0 && v !== null && String(v) === value;
      if (has) out.push(file.basename);
    }
    return out;
  }
  /** Files whose `key` contains `value` (exact match) - pool scrubbing. */
  /** Per-file values of `key` (files where it is set, scalars only). */
  entriesFor(key) {
    const out = [];
    for (const { file, fm } of this.snapshots()) {
      const v = fm ? getCI(fm, key) : void 0;
      if (v === void 0 || v === null || v === "" || Array.isArray(v)) continue;
      out.push({ file, value: v });
    }
    return out;
  }
  /** Files whose frontmatter has `key` at all (any value). */
  filesWithKey(key) {
    const out = [];
    for (const { file, fm } of this.snapshots()) {
      const v = fm ? getCI(fm, key) : void 0;
      if (v !== void 0 && v !== null && v !== "") out.push(file);
    }
    return out;
  }
  /** Distinct raw values for `key` across the vault (dedup by string form). */
  rawValuesFor(key) {
    const seen = /* @__PURE__ */ new Map();
    for (const { fm } of this.snapshots()) {
      const v = fm ? getCI(fm, key) : void 0;
      if (v === void 0 || v === null || v === "" || Array.isArray(v)) continue;
      const k = String(v);
      if (!seen.has(k)) seen.set(k, v);
    }
    return [...seen.values()];
  }
  filesWithValue(key, value) {
    const out = [];
    for (const { file, fm } of this.snapshots()) {
      const v = fm ? getCI(fm, key) : void 0;
      const has = Array.isArray(v) ? v.some((x) => String(x) === value) : v !== void 0 && v !== null && String(v) === value;
      if (has) out.push(file);
    }
    return out;
  }
  /**
   * The value-type id corresponding to the property type assigned in
   * Obsidian's type manager, or null when unassigned/unknown.
   */
  obsidianType(key) {
    var _a, _b, _c, _d;
    try {
      const mt = this.app.metadataTypeManager;
      const t = (_d = (_a = mt == null ? void 0 : mt.getAssignedType) == null ? void 0 : _a.call(mt, key)) != null ? _d : (_c = (_b = mt == null ? void 0 : mt.properties) == null ? void 0 : _b[key.toLowerCase()]) == null ? void 0 : _c.type;
      if (!t) return null;
      if (t === "number") return "number";
      if (t === "checkbox") return "checkbox";
      if (t === "multitext" || t === "tags" || t === "aliases") return "list";
      return "text";
    } catch (e) {
      return null;
    }
  }
};

// src/core/hide-service.ts
var HideService = class {
  constructor(host) {
    this.host = host;
    this.keys = /* @__PURE__ */ new Set();
    this.observer = null;
    this.raf = 0;
  }
  /** Start hiding. Returns a disposer for `Plugin.register`. */
  install() {
    this.recompute();
    this.observer = new MutationObserver(() => this.schedule());
    this.observer.observe(activeDocument.body, { childList: true, subtree: true });
    this.apply();
    return () => {
      var _a;
      (_a = this.observer) == null ? void 0 : _a.disconnect();
      this.observer = null;
      if (this.raf) activeWindow.cancelAnimationFrame(this.raf);
      this.unapplyAll();
    };
  }
  /** Recompute the hidden set from settings and re-apply. Call after each save. */
  update() {
    this.recompute();
    this.apply();
  }
  recompute() {
    const s = this.host.settings;
    const keys = /* @__PURE__ */ new Set();
    if (s.hideShown) {
      for (const lk of Object.keys(s.layouts))
        for (const sec of s.layouts[lk].sections)
          for (const e of sec.entries)
            if (e.kind === "prop" && e.key && !e.showInObsidian) keys.add(e.key.toLowerCase());
    }
    for (const k of s.manualHide || []) keys.add(k.toLowerCase());
    this.keys = keys;
  }
  /** Coalesce bursts of DOM mutations into a single apply on the next frame. */
  schedule() {
    if (this.raf) return;
    this.raf = window.requestAnimationFrame(() => {
      this.raf = 0;
      this.apply();
    });
  }
  apply() {
    activeDocument.querySelectorAll(".metadata-property[data-property-key]").forEach((row) => {
      const key = (row.getAttribute("data-property-key") || "").toLowerCase();
      row.toggleClass("ep-prop-hidden", this.keys.has(key));
    });
  }
  unapplyAll() {
    activeDocument.querySelectorAll(".metadata-property.ep-prop-hidden").forEach((row) => row.removeClass("ep-prop-hidden"));
  }
  /** Whether `key` is currently hidden (manual or via a sidebar entry). */
  isHidden(key) {
    const s = this.host.settings;
    if (s.manualHide.some((k) => k.toLowerCase() === key.toLowerCase())) return true;
    if (!s.hideShown) return false;
    for (const lk of Object.keys(s.layouts))
      for (const sec of s.layouts[lk].sections)
        for (const en of sec.entries)
          if (en.kind === "prop" && en.key && en.key.toLowerCase() === key.toLowerCase() && !en.showInObsidian)
            return true;
    return false;
  }
  /** All hidden keys with their origin, sorted. `manual` = explicit hide. */
  hiddenKeys() {
    const s = this.host.settings;
    const out = /* @__PURE__ */ new Map();
    for (const k of s.manualHide) out.set(k, true);
    if (s.hideShown) {
      for (const lk of Object.keys(s.layouts))
        for (const sec of s.layouts[lk].sections)
          for (const e of sec.entries)
            if (e.kind === "prop" && e.key && !e.showInObsidian && !out.has(e.key)) out.set(e.key, false);
    }
    return [...out.entries()].map(([key, manual]) => ({ key, manual })).sort((a, b) => a.key.localeCompare(b.key));
  }
  /** Hide `key` everywhere (adds a manual hide). */
  hideKey(key) {
    const s = this.host.settings;
    if (!s.manualHide.includes(key)) s.manualHide.push(key);
    this.host.save();
  }
  /** Unhide `key`: drop manual hides and mark sidebar entries visible. */
  unhideKey(key) {
    const s = this.host.settings;
    s.manualHide = s.manualHide.filter((k) => k.toLowerCase() !== key.toLowerCase());
    for (const lk of Object.keys(s.layouts))
      for (const sec of s.layouts[lk].sections)
        for (const e of sec.entries)
          if (e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase()) e.showInObsidian = true;
    this.host.save();
    this.host.refreshViews();
  }
  toggle(key) {
    if (this.isHidden(key)) this.unhideKey(key);
    else this.hideKey(key);
  }
};

// src/ui/render/value-types/text.ts
var import_obsidian10 = require("obsidian");

// src/ui/components/suggest.ts
var import_obsidian4 = require("obsidian");
var PropSuggest = class extends import_obsidian4.AbstractInputSuggest {
  constructor(app, inputEl, i18n, getCandidates, onChoose, clearOnSelect = true) {
    super(app, inputEl);
    this.i18n = i18n;
    this.getCandidates = getCandidates;
    this.onChoose = onChoose;
    this.clearOnSelect = clearOnSelect;
  }
  getSuggestions(query) {
    const q = query.trim();
    const ql = q.toLowerCase();
    const cands = this.getCandidates();
    const filtered = (ql ? cands.filter((c) => c.key.toLowerCase().includes(ql)) : cands).slice(0, 50);
    const res = filtered.map((c) => ({
      key: c.key,
      kind: c.onNote ? "note" : "vault",
      typeName: c.typeName
    }));
    if (q && !cands.some((c) => c.key.toLowerCase() === ql)) res.unshift({ key: q, kind: "create" });
    return res;
  }
  renderSuggestion(c, el) {
    if (c.kind === "create") {
      el.addClass("ep-sug-create");
      el.setText(this.i18n.t("suggest.create", { key: c.key }));
      return;
    }
    el.createSpan({ text: c.key });
    if (c.typeName) el.createSpan({ cls: "ep-sug-type", text: c.typeName });
    if (c.kind === "note") el.createSpan({ cls: "ep-sug-badge", text: this.i18n.t("suggest.onNote") });
  }
  selectSuggestion(c) {
    var _a;
    this.onChoose(c.key);
    this.setValue(this.clearOnSelect ? "" : c.key);
    (_a = this.close) == null ? void 0 : _a.call(this);
  }
};
var _RefSuggest = class _RefSuggest extends import_obsidian4.AbstractInputSuggest {
  constructor(app, inputEl, getRefs) {
    super(app, inputEl);
    this.getRefs = getRefs;
    this.el = inputEl;
  }
  getSuggestions(value) {
    const m = _RefSuggest.TOKEN.exec(value);
    if (!m) return [];
    const tl = m[0].toLowerCase();
    return this.getRefs().filter((r) => r.text.toLowerCase().includes(tl)).slice(0, 30);
  }
  renderSuggestion(r, el) {
    el.createSpan({ text: r.text });
    if (r.hint) el.createSpan({ cls: "ep-sug-badge", text: r.hint });
  }
  selectSuggestion(r) {
    var _a;
    const val = this.el.value;
    const m = _RefSuggest.TOKEN.exec(val);
    const start = m ? val.length - m[0].length : val.length;
    const next = val.slice(0, start) + r.text;
    this.el.value = next;
    this.el.dispatchEvent(new Event("input"));
    this.el.focus();
    try {
      this.el.setSelectionRange(next.length, next.length);
    } catch (e) {
    }
    (_a = this.close) == null ? void 0 : _a.call(this);
  }
};
_RefSuggest.TOKEN = /[A-Za-z_][A-Za-z0-9_]*$/;
var RefSuggest = _RefSuggest;
var ValueSuggest = class extends import_obsidian4.AbstractInputSuggest {
  constructor(app, inputEl, getOptions, onChoose, clearOnSelect = true) {
    super(app, inputEl);
    this.getOptions = getOptions;
    this.onChoose = onChoose;
    this.clearOnSelect = clearOnSelect;
  }
  getSuggestions(query) {
    const q = query.trim();
    const ql = q.toLowerCase();
    const opts = this.getOptions();
    const filtered = (ql ? opts.filter((o) => o.toLowerCase().includes(ql)) : opts).slice(0, 50);
    if (q && !opts.some((o) => o.toLowerCase() === ql)) filtered.unshift(q);
    return filtered;
  }
  renderSuggestion(v, el) {
    el.setText(v);
  }
  selectSuggestion(v) {
    var _a;
    this.onChoose(v);
    this.setValue(this.clearOnSelect ? "" : v);
    (_a = this.close) == null ? void 0 : _a.call(this);
  }
};
function noteMatches(app, q, limit = 30) {
  const files = app.vault.getMarkdownFiles();
  if (!q) return files.slice().sort((a, b) => a.basename.localeCompare(b.basename)).slice(0, limit);
  const out = [];
  for (const f of files) {
    const i = f.basename.toLowerCase().indexOf(q);
    if (i < 0) continue;
    out.push({ f, rank: i === 0 ? 0 : 1 });
  }
  out.sort((a, b) => a.rank - b.rank || a.f.basename.localeCompare(b.f.basename));
  return out.slice(0, limit).map((x) => x.f);
}
var _TextLinkSuggest = class _TextLinkSuggest extends import_obsidian4.AbstractInputSuggest {
  constructor(app, inputEl, getOptions, onChoose) {
    super(app, inputEl);
    this.getOptions = getOptions;
    this.onChoose = onChoose;
    this.el = inputEl;
    this.appRef = app;
  }
  getSuggestions(value) {
    const link = _TextLinkSuggest.OPEN.exec(value);
    if (link) {
      const q2 = link[1].trim().toLowerCase();
      return noteMatches(this.appRef, q2).map((f) => ({ kind: "link", text: f.basename, file: f }));
    }
    if (!this.getOptions) return [];
    const q = value.trim();
    const ql = q.toLowerCase();
    const opts = this.getOptions();
    const filtered = (ql ? opts.filter((o) => o.toLowerCase().includes(ql)) : opts).slice(0, 50);
    const res = filtered.map((o) => ({ kind: "value", text: o }));
    if (q && !opts.some((o) => o.toLowerCase() === ql)) res.unshift({ kind: "create", text: q });
    return res;
  }
  renderSuggestion(s, el) {
    var _a;
    if (s.kind === "link") {
      el.createSpan({ cls: "ep-sug-link", text: s.text });
      const p = (_a = s.file.parent) == null ? void 0 : _a.path;
      if (p && p !== "/") el.createSpan({ cls: "ep-sug-badge", text: p });
      return;
    }
    el.setText(s.text);
  }
  selectSuggestion(s) {
    var _a, _b, _c;
    if (s.kind === "link") {
      const val = this.el.value;
      const m = _TextLinkSuggest.OPEN.exec(val);
      const start = m ? m.index : val.length;
      const next = val.slice(0, start) + `[[${s.text}]]`;
      this.el.value = next;
      this.el.dispatchEvent(new Event("input"));
      this.el.focus();
      try {
        this.el.setSelectionRange(next.length, next.length);
      } catch (e) {
      }
      (_a = this.close) == null ? void 0 : _a.call(this);
      return;
    }
    (_b = this.onChoose) == null ? void 0 : _b.call(this, s.text);
    this.setValue(s.text);
    (_c = this.close) == null ? void 0 : _c.call(this);
  }
};
/** An unclosed `[[` token (no brackets after it) ending at the caret. */
_TextLinkSuggest.OPEN = /\[\[([^[\]]*)$/;
var TextLinkSuggest = _TextLinkSuggest;

// src/utils/sound.ts
var ctx = null;
var enabled = false;
var volume = 0.3;
var cats = { ui: true, dice: true, crit: true };
function configureSound(on, vol, categories) {
  enabled = on;
  volume = Math.max(0, Math.min(1, Number.isFinite(vol) ? vol : 0.3));
  if (categories) {
    cats.ui = categories.ui !== false;
    cats.dice = categories.dice !== false;
    cats.crit = categories.crit !== false;
  }
}
function audio() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch (e) {
    return null;
  }
}
function blip({ freq, type = "sine", dur = 0.06, gain = 1, sweep = 0 }, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), t0 + dur);
  const peak = Math.max(2e-4, volume * gain * 0.14);
  g.gain.setValueAtTime(2e-4, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 4e-3);
  g.gain.exponentialRampToValueAtTime(2e-4, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
var sfx = {
  /** A faint click for steppers, value edits, ratings. */
  tick() {
    if (cats.ui) blip({ freq: 520, type: "triangle", dur: 0.03, gain: 0.5 });
  },
  /** A slightly brighter blip for checkbox/state toggles. */
  toggle() {
    if (cats.ui) blip({ freq: 680, type: "triangle", dur: 0.045, gain: 0.6 });
  },
  /** A soft tumble when a roll starts. */
  roll() {
    if (cats.dice) blip({ freq: 300, type: "sawtooth", dur: 0.05, gain: 0.4, sweep: 140 });
  },
  /** A tiny tap as a die lands. */
  settle() {
    if (cats.dice) blip({ freq: 430, type: "sine", dur: 0.025, gain: 0.3 });
  },
  /** A pleasant ascending chime for a critical hit. */
  crit() {
    if (!cats.crit) return;
    blip({ freq: 660, type: "sine", dur: 0.12, gain: 0.85 }, 0);
    blip({ freq: 990, type: "sine", dur: 0.14, gain: 0.8 }, 0.08);
    blip({ freq: 1320, type: "sine", dur: 0.18, gain: 0.7 }, 0.16);
  },
  /** A low descending buzz for a critical fail. */
  fail() {
    if (!cats.crit) return;
    blip({ freq: 220, type: "sawtooth", dur: 0.18, gain: 0.7, sweep: -110 }, 0);
    blip({ freq: 160, type: "square", dur: 0.16, gain: 0.45 }, 0.07);
  }
};

// src/ui/components/inline-edit.ts
function openNumberInput(span, value, commit2, o) {
  const input = createEl("input", { cls: "ep-edit-input" });
  input.type = "number";
  input.value = fmtNum(value);
  if (o.float) input.step = "any";
  span.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (save) => {
    var _a;
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (input.value.trim() === "") {
      if (save) (_a = o.onEmpty) == null ? void 0 : _a.call(o);
      return;
    }
    let n = Number(input.value);
    if (!Number.isFinite(n)) return;
    if (!o.float) n = Math.round(n);
    if (o.clamp) n = clamp(n, o.min, o.max);
    if (save) {
      sfx.tick();
      commit2(n);
    }
  };
  input.onblur = () => finish(true);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  };
}
function openTextInput(app, span, key, value, valuesFor, commit2) {
  const input = createEl("input", { cls: "ep-edit-input" });
  input.type = "text";
  input.value = value;
  span.replaceWith(input);
  input.focus();
  input.select();
  new TextLinkSuggest(app, input, () => valuesFor(key), (v) => commit2(v));
  input.addEventListener("focus", () => input.dispatchEvent(new Event("input")));
  input.dispatchEvent(new Event("input"));
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save) {
      sfx.tick();
      commit2(input.value.trim());
    }
  };
  input.onblur = () => window.setTimeout(() => finish(true), 150);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  };
}
function bindRename(span, current, placeholder, tooltip, commit2) {
  span.setText(current || placeholder);
  span.addClass("ep-editable");
  span.setAttr("title", tooltip);
  span.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
    input.type = "text";
    input.value = current;
    input.placeholder = placeholder;
    span.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      if (input.parentElement) input.replaceWith(span);
      if (save) commit2(input.value.trim());
    };
    input.onblur = () => finish(true);
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    };
  };
}

// src/ui/modals/dialogs.ts
var import_obsidian9 = require("obsidian");

// src/ui/modifiers.ts
var shift = false;
function isShiftHeld() {
  return shift;
}
function trackModifiers(plugin) {
  const upd = (e) => {
    shift = e.shiftKey;
  };
  plugin.registerDomEvent(activeDocument, "keydown", upd, true);
  plugin.registerDomEvent(activeDocument, "keyup", upd, true);
  plugin.registerDomEvent(activeDocument, "mousedown", upd, true);
  plugin.registerDomEvent(window, "blur", () => {
    shift = false;
  });
}

// src/ui/components/setting-helpers.ts
var import_obsidian8 = require("obsidian");

// src/utils/color.ts
var COLOR_SPACES = ["RGB", "HSL", "OKLCH", "OKLab"];
function hexToRgb(hex) {
  let h = (hex || "").trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHex(r, g, b) {
  const h = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(h / 60 % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function srgbToLin(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linToSrgb(c) {
  const v = c <= 31308e-7 ? c * 12.92 : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
  return clamp(v * 255, 0, 255);
}
function rgbToOklab(r, g, b) {
  const lr = srgbToLin(r), lg = srgbToLin(g), lb = srgbToLin(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  };
}
function oklabToLin(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return {
    lr: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    lg: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    lb: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  };
}
function oklabToRgb(L, a, b) {
  const c = oklabToLin(L, a, b);
  return { r: linToSrgb(c.lr), g: linToSrgb(c.lg), b: linToSrgb(c.lb) };
}
function rgbToOklch(r, g, b) {
  const o = rgbToOklab(r, g, b);
  const C = Math.sqrt(o.a * o.a + o.b * o.b);
  let H = Math.atan2(o.b, o.a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L: o.L, C, H };
}
function oklchToLin(L, C, H) {
  const hr = H * Math.PI / 180;
  return oklabToLin(L, C * Math.cos(hr), C * Math.sin(hr));
}
function oklchToRgb(L, C, H) {
  const c = oklchToLin(L, C, H);
  return { r: linToSrgb(c.lr), g: linToSrgb(c.lg), b: linToSrgb(c.lb) };
}
function inGamutLin(c) {
  const e = 15e-4;
  return c.lr >= -e && c.lr <= 1 + e && c.lg >= -e && c.lg <= 1 + e && c.lb >= -e && c.lb <= 1 + e;
}
function gradientStops(samples, at) {
  const stops = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const { rgb, oog } = at(t);
    const pct = Math.round(t * 100);
    const r = Math.round(rgb.r), g = Math.round(rgb.g), b = Math.round(rgb.b);
    stops.push((oog ? `rgba(${r},${g},${b},0.15)` : `rgb(${r},${g},${b})`) + ` ${pct}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

// src/ui/modals/color-picker.ts
var import_obsidian6 = require("obsidian");

// src/ui/components/long-press.ts
var import_obsidian5 = require("obsidian");
function onLongPress(el, fn, o = {}) {
  var _a, _b;
  const ms = (_a = o.ms) != null ? _a : 500;
  const tol = (_b = o.moveTol) != null ? _b : 10;
  let timer = 0;
  let sx = 0;
  let sy = 0;
  let fired = false;
  const clear = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = 0;
    }
  };
  const onDown = (e) => {
    if (e.pointerType === "mouse") return;
    sx = e.clientX;
    sy = e.clientY;
    fired = false;
    clear();
    timer = window.setTimeout(() => {
      timer = 0;
      fired = true;
      fn(sx, sy);
    }, ms);
  };
  const onMove = (e) => {
    if (timer && (Math.abs(e.clientX - sx) > tol || Math.abs(e.clientY - sy) > tol)) clear();
  };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    if (timer && t && (Math.abs(t.clientX - sx) > tol || Math.abs(t.clientY - sy) > tol)) clear();
  };
  const onUp = () => clear();
  const onClick = (e) => {
    if (fired) {
      e.preventDefault();
      e.stopPropagation();
      fired = false;
    }
  };
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("touchmove", onTouchMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("pointerleave", onUp);
  el.addEventListener("scroll", onUp, true);
  el.addEventListener("click", onClick, true);
  return () => {
    clear();
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    el.removeEventListener("pointerleave", onUp);
    el.removeEventListener("scroll", onUp, true);
    el.removeEventListener("click", onClick, true);
  };
}
function longPressContextMenu(el) {
  return onLongPress(
    el,
    (x, y) => el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y }))
  );
}
function asMobileSheet(modal) {
  if (import_obsidian5.Platform.isMobile) modal.modalEl.addClass("ep-mobile-sheet");
}
function guardScrollTaps(root, tol = 10) {
  let sx = 0;
  let sy = 0;
  let moved = false;
  const start = (x, y) => {
    sx = x;
    sy = y;
    moved = false;
  };
  const move = (x, y) => {
    if (!moved && (Math.abs(x - sx) > tol || Math.abs(y - sy) > tol)) moved = true;
  };
  const onPointerDown = (e) => start(e.clientX, e.clientY);
  const onPointerMove = (e) => move(e.clientX, e.clientY);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    if (t) start(t.clientX, t.clientY);
  };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  };
  const onCancel = () => {
    moved = true;
  };
  const onClick = (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      moved = false;
    }
  };
  root.addEventListener("pointerdown", onPointerDown, true);
  root.addEventListener("pointermove", onPointerMove, true);
  root.addEventListener("touchstart", onTouchStart, true);
  root.addEventListener("touchmove", onTouchMove, true);
  root.addEventListener("pointercancel", onCancel, true);
  root.addEventListener("click", onClick, true);
  return () => {
    root.removeEventListener("pointerdown", onPointerDown, true);
    root.removeEventListener("pointermove", onPointerMove, true);
    root.removeEventListener("touchstart", onTouchStart, true);
    root.removeEventListener("touchmove", onTouchMove, true);
    root.removeEventListener("pointercancel", onCancel, true);
    root.removeEventListener("click", onClick, true);
  };
}

// src/ui/modals/color-picker.ts
var CHANNEL_NAMES = {
  R: "colorPicker.red",
  G: "colorPicker.green",
  B: "colorPicker.blue",
  H: "colorPicker.hue",
  S: "colorPicker.saturation",
  L: "colorPicker.lightness",
  C: "colorPicker.chroma",
  a: "colorPicker.labA",
  b: "colorPicker.labB"
};
var ColorPickerModal = class extends import_obsidian6.Modal {
  constructor(host, initial, onSubmit) {
    var _a;
    super(host.app);
    this.host = host;
    this.onSubmit = onSubmit;
    this.rgb = (_a = hexToRgb(initial)) != null ? _a : { r: 136, g: 136, b: 136 };
    this.space = host.getColorSpace();
  }
  onOpen() {
    asMobileSheet(this);
    const { contentEl } = this;
    const t = this.host.i18n.t.bind(this.host.i18n);
    contentEl.addClass("ep-colorpicker");
    contentEl.createEl("h3", { text: t("colorPicker.title") });
    const tabs = contentEl.createDiv({ cls: "ep-cp-tabs" });
    for (const sp of COLOR_SPACES) {
      const b = tabs.createEl("button", { cls: "ep-mode-btn", text: sp });
      if (sp === this.space) b.addClass("is-active");
      b.onclick = () => {
        this.space = sp;
        this.host.setColorSpace(sp);
        tabs.querySelectorAll("button").forEach((x) => x.removeClass("is-active"));
        b.addClass("is-active");
        this.renderContent();
      };
    }
    const bar = contentEl.createDiv({ cls: "ep-cp-bar" });
    this.preview = bar.createDiv({ cls: "ep-cp-preview" });
    if (window.EyeDropper) {
      const ed = bar.createEl("button", { cls: "ep-icon-btn" });
      (0, import_obsidian6.setIcon)(ed, "pipette");
      ed.setAttr("title", t("colorPicker.eyedropper"));
      ed.onclick = async () => {
        try {
          const c = await new window.EyeDropper().open();
          const rgb = hexToRgb(c.sRGBHex);
          if (rgb) {
            this.rgb = rgb;
            this.updatePreviewHex();
            this.renderContent();
          }
        } catch (e) {
        }
      };
    }
    this.hexInput = bar.createEl("input");
    this.hexInput.type = "text";
    this.hexInput.addClass("ep-edit-input");
    this.hexInput.onchange = () => {
      const c = hexToRgb(this.hexInput.value);
      if (c) {
        this.rgb = c;
        this.updatePreviewHex();
        this.renderContent();
      }
    };
    this.body = contentEl.createDiv({ cls: "ep-cp-body" });
    this.updatePreviewHex();
    this.renderContent();
    new import_obsidian6.Setting(contentEl).addButton((b) => b.setButtonText(t("common.cancel")).onClick(() => this.close())).addButton(
      (b) => b.setButtonText(t("common.save")).setCta().onClick(() => {
        this.onSubmit(rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b));
        this.close();
      })
    );
  }
  updatePreviewHex() {
    const hex = rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
    this.preview.setCssStyles({ background: hex });
    if (this.hexInput) this.hexInput.value = hex;
  }
  /** One labelled gradient slider with a numeric input. */
  gslider(parent, label, min, max, step, val, grad, onInput) {
    const row = parent.createDiv({ cls: "ep-cp-channel" });
    const lbl = row.createSpan({ cls: "ep-cp-label", text: label });
    const nameKey = CHANNEL_NAMES[label];
    if (nameKey) lbl.setAttr("title", this.host.i18n.t(nameKey));
    const sw = row.createDiv({ cls: "ep-gslider" });
    const track = sw.createDiv({ cls: "ep-gtrack" });
    const thumb = sw.createDiv({ cls: "ep-gthumb" });
    const num = row.createEl("input");
    num.type = "number";
    num.min = String(min);
    num.max = String(max);
    num.step = String(step);
    num.value = String(Math.round(val * 1e3) / 1e3);
    num.addClass("ep-edit-input");
    let cur = val;
    const place = () => {
      const t = max > min ? (cur - min) / (max - min) : 0;
      thumb.setCssStyles({ left: clamp(t, 0, 1) * 100 + "%" });
    };
    const update = () => {
      track.setCssStyles({ background: grad() });
    };
    const setVal = (v, fire) => {
      cur = clamp(v, min, max);
      num.value = String(Math.round(cur * 1e3) / 1e3);
      place();
      if (fire) onInput(cur);
    };
    const fromX = (clientX) => {
      const r = sw.getBoundingClientRect();
      const tt = clamp((clientX - r.left) / r.width, 0, 1);
      let v = min + tt * (max - min);
      if (step) v = Math.round(v / step) * step;
      setVal(v, true);
    };
    sw.addEventListener("pointerdown", (e) => {
      sw.setPointerCapture(e.pointerId);
      fromX(e.clientX);
    });
    sw.addEventListener("pointermove", (e) => {
      if (e.buttons) fromX(e.clientX);
    });
    num.addEventListener("change", () => setVal(Number(num.value), true));
    update();
    place();
    return { update, setValue: (v) => setVal(v, false) };
  }
  /** A 2D canvas field (e.g. saturation x lightness) with a draggable cursor. */
  buildField(parent, colorAt, getXY, setXY) {
    const wrap = parent.createDiv({ cls: "ep-cp-field-wrap" });
    const canvas = wrap.createEl("canvas");
    canvas.width = 200;
    canvas.height = 170;
    canvas.addClass("ep-cp-field");
    const cursor = wrap.createDiv({ cls: "ep-cp-cursor" });
    const paint = () => {
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) return;
      const w = canvas.width, h = canvas.height;
      const img = ctx2.createImageData(w, h);
      const d = img.data;
      for (let py = 0; py < h; py++) {
        const yy = py / (h - 1);
        for (let px = 0; px < w; px++) {
          const xx = px / (w - 1);
          const c = colorAt(xx, yy);
          const i = (py * w + px) * 4;
          d[i] = clamp(c.r, 0, 255);
          d[i + 1] = clamp(c.g, 0, 255);
          d[i + 2] = clamp(c.b, 0, 255);
          d[i + 3] = 255;
        }
      }
      ctx2.putImageData(img, 0, 0);
    };
    const place = () => {
      const [x, y] = getXY();
      cursor.setCssStyles({ left: x * 100 + "%" });
      cursor.setCssStyles({ top: y * 100 + "%" });
    };
    const fromEv = (e) => {
      const r = canvas.getBoundingClientRect();
      setXY(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
      place();
    };
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      fromEv(e);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (e.buttons) fromEv(e);
    });
    paint();
    place();
    return { paint, place };
  }
  /** Rebuild the slider area for the active color space (with slide animation). */
  renderContent() {
    const idx = COLOR_SPACES.indexOf(this.space);
    const dir = this.lastIdx === void 0 ? 0 : idx > this.lastIdx ? 1 : idx < this.lastIdx ? -1 : 0;
    this.lastIdx = idx;
    this.body.empty();
    this.body.removeClass("ep-slide-r");
    this.body.removeClass("ep-slide-l");
    void this.body.offsetWidth;
    if (dir > 0) this.body.addClass("ep-slide-r");
    else if (dir < 0) this.body.addClass("ep-slide-l");
    const sliders = [];
    const refresh = () => {
      this.updatePreviewHex();
      sliders.forEach((s) => s.update());
    };
    if (this.space === "RGB") {
      const ch = { ...this.rgb };
      sliders.push(this.gslider(
        this.body,
        "R",
        0,
        255,
        1,
        ch.r,
        () => gradientStops(16, (t) => ({ rgb: { r: t * 255, g: ch.g, b: ch.b }, oog: false })),
        (v) => {
          ch.r = v;
          this.rgb = { ...ch };
          refresh();
        }
      ));
      sliders.push(this.gslider(
        this.body,
        "G",
        0,
        255,
        1,
        ch.g,
        () => gradientStops(16, (t) => ({ rgb: { r: ch.r, g: t * 255, b: ch.b }, oog: false })),
        (v) => {
          ch.g = v;
          this.rgb = { ...ch };
          refresh();
        }
      ));
      sliders.push(this.gslider(
        this.body,
        "B",
        0,
        255,
        1,
        ch.b,
        () => gradientStops(16, (t) => ({ rgb: { r: ch.r, g: ch.g, b: t * 255 }, oog: false })),
        (v) => {
          ch.b = v;
          this.rgb = { ...ch };
          refresh();
        }
      ));
    } else if (this.space === "HSL") {
      const ch = rgbToHsl(this.rgb.r, this.rgb.g, this.rgb.b);
      let field = null;
      const two = this.body.createDiv({ cls: "ep-cp-2col" });
      const left = two.createDiv({ cls: "ep-cp-left" });
      const right = two.createDiv({ cls: "ep-cp-right" });
      const hS = this.gslider(
        right,
        "H",
        0,
        360,
        1,
        ch.h,
        () => gradientStops(48, (t) => ({ rgb: hslToRgb(t * 360, ch.s, ch.l), oog: false })),
        (v) => {
          ch.h = v;
          this.rgb = hslToRgb(ch.h, ch.s, ch.l);
          field == null ? void 0 : field.paint();
          refresh();
        }
      );
      const sS = this.gslider(
        right,
        "S",
        0,
        100,
        1,
        ch.s,
        () => gradientStops(28, (t) => ({ rgb: hslToRgb(ch.h, t * 100, ch.l), oog: false })),
        (v) => {
          ch.s = v;
          this.rgb = hslToRgb(ch.h, ch.s, ch.l);
          field == null ? void 0 : field.place();
          refresh();
        }
      );
      const lS = this.gslider(
        right,
        "L",
        0,
        100,
        1,
        ch.l,
        () => gradientStops(28, (t) => ({ rgb: hslToRgb(ch.h, ch.s, t * 100), oog: false })),
        (v) => {
          ch.l = v;
          this.rgb = hslToRgb(ch.h, ch.s, ch.l);
          field == null ? void 0 : field.place();
          refresh();
        }
      );
      sliders.push(hS, sS, lS);
      field = this.buildField(
        left,
        (x, y) => hslToRgb(ch.h, x * 100, (1 - y) * 100),
        () => [ch.s / 100, 1 - ch.l / 100],
        (x, y) => {
          ch.s = x * 100;
          ch.l = (1 - y) * 100;
          this.rgb = hslToRgb(ch.h, ch.s, ch.l);
          sS.setValue(ch.s);
          lS.setValue(ch.l);
          refresh();
        }
      );
    } else if (this.space === "OKLCH") {
      const ch = rgbToOklch(this.rgb.r, this.rgb.g, this.rgb.b);
      sliders.push(this.gslider(
        this.body,
        "L",
        0,
        1,
        1e-3,
        ch.L,
        () => gradientStops(56, (t) => ({ rgb: oklchToRgb(t, ch.C, ch.H), oog: !inGamutLin(oklchToLin(t, ch.C, ch.H)) })),
        (v) => {
          ch.L = v;
          this.rgb = oklchToRgb(ch.L, ch.C, ch.H);
          refresh();
        }
      ));
      sliders.push(this.gslider(
        this.body,
        "C",
        0,
        0.4,
        1e-3,
        ch.C,
        () => gradientStops(56, (t) => ({ rgb: oklchToRgb(ch.L, t * 0.4, ch.H), oog: !inGamutLin(oklchToLin(ch.L, t * 0.4, ch.H)) })),
        (v) => {
          ch.C = v;
          this.rgb = oklchToRgb(ch.L, ch.C, ch.H);
          refresh();
        }
      ));
      sliders.push(this.gslider(
        this.body,
        "H",
        0,
        360,
        1,
        ch.H,
        () => gradientStops(64, (t) => ({ rgb: oklchToRgb(ch.L, ch.C, t * 360), oog: !inGamutLin(oklchToLin(ch.L, ch.C, t * 360)) })),
        (v) => {
          ch.H = v;
          this.rgb = oklchToRgb(ch.L, ch.C, ch.H);
          refresh();
        }
      ));
    } else {
      const ch = rgbToOklab(this.rgb.r, this.rgb.g, this.rgb.b);
      let field = null;
      const two = this.body.createDiv({ cls: "ep-cp-2col" });
      const left = two.createDiv({ cls: "ep-cp-left" });
      const right = two.createDiv({ cls: "ep-cp-right" });
      const lS = this.gslider(
        right,
        "L",
        0,
        1,
        1e-3,
        ch.L,
        () => gradientStops(56, (t) => ({ rgb: oklabToRgb(t, ch.a, ch.b), oog: !inGamutLin(oklabToLin(t, ch.a, ch.b)) })),
        (v) => {
          ch.L = v;
          this.rgb = oklabToRgb(ch.L, ch.a, ch.b);
          field == null ? void 0 : field.paint();
          refresh();
        }
      );
      sliders.push(lS);
      field = this.buildField(
        left,
        (x, y) => oklabToRgb(ch.L, x * 0.8 - 0.4, (1 - y) * 0.8 - 0.4),
        () => [(ch.a + 0.4) / 0.8, 1 - (ch.b + 0.4) / 0.8],
        (x, y) => {
          ch.a = x * 0.8 - 0.4;
          ch.b = (1 - y) * 0.8 - 0.4;
          this.rgb = oklabToRgb(ch.L, ch.a, ch.b);
          refresh();
        }
      );
    }
    const newH = this.body.scrollHeight;
    if (this.lastBodyH !== void 0 && this.lastBodyH !== newH) {
      this.body.setCssStyles({ height: this.lastBodyH + "px" });
      void this.body.offsetWidth;
      this.body.setCssStyles({ height: newH + "px" });
      const done = () => {
        this.body.setCssStyles({ height: "auto" });
        this.body.removeEventListener("transitionend", done);
      };
      this.body.addEventListener("transitionend", done);
    }
    this.lastBodyH = newH;
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/modals/icon-picker.ts
var import_obsidian7 = require("obsidian");
var IconPickerModal = class extends import_obsidian7.Modal {
  constructor(app, i18n, current, onPick) {
    super(app);
    this.i18n = i18n;
    this.current = current;
    this.onPick = onPick;
  }
  onOpen() {
    const c = this.contentEl;
    c.addClass("ep-iconpick");
    c.createEl("h3", { text: this.i18n.t("iconPicker.title") });
    const search = c.createEl("input");
    search.type = "text";
    search.placeholder = this.i18n.t("iconPicker.search");
    search.addClass("ep-edit-input");
    search.setCssStyles({ width: "100%" });
    const grid = c.createDiv({ cls: "ep-iconpick-grid" });
    let all = [];
    try {
      all = (0, import_obsidian7.getIconIds)();
    } catch (e) {
      all = [];
    }
    const draw = (q) => {
      grid.empty();
      const ql = q.trim().toLowerCase();
      const items = (ql ? all.filter((i) => i.toLowerCase().includes(ql)) : all).slice(0, 500);
      for (const id of items) {
        const cell = grid.createDiv({ cls: "ep-iconpick-item" });
        if (id === this.current) cell.addClass("is-active");
        (0, import_obsidian7.setIcon)(cell, id);
        cell.setAttr("title", id);
        cell.onclick = () => {
          this.onPick(id);
          this.close();
        };
      }
      if (items.length === 0) grid.createDiv({ cls: "ep-empty-sub", text: this.i18n.t("iconPicker.noMatch") });
    };
    search.addEventListener("input", () => draw(search.value));
    draw("");
    window.setTimeout(() => search.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/components/setting-helpers.ts
function destructive(b) {
  var _a;
  const anyB = b;
  if (typeof anyB.setDestructive === "function") anyB.setDestructive();
  else (_a = anyB.setWarning) == null ? void 0 : _a.call(anyB);
  return b;
}
function addColorSetting(host, container, name, desc, get, set) {
  const setting = new import_obsidian8.Setting(container).setName(name);
  if (desc) setting.setDesc(desc);
  const sw = setting.controlEl.createSpan({ cls: "ep-swatch" });
  const update = () => {
    const h = get();
    const ok = h && hexToRgb(h);
    sw.setCssStyles({ background: ok ? h : "transparent" });
    sw.toggleClass("ep-swatch-empty", !ok);
  };
  update();
  sw.onclick = () => new ColorPickerModal(host, get() || "#888888", (hex) => {
    set(hex);
    update();
  }).open();
  setting.addButton(
    (b) => b.setButtonText(host.i18n.t("common.clear")).onClick(() => {
      set(void 0);
      update();
    })
  );
  return setting;
}
function addIconSetting(app, i18n, container, name, get, set) {
  const setting = new import_obsidian8.Setting(container).setName(name).setDesc(i18n.t("options.iconDesc"));
  const prev = setting.controlEl.createSpan({ cls: "ep-icon-prev" });
  const update = () => {
    prev.empty();
    const ic = get();
    if (ic) (0, import_obsidian8.setIcon)(prev, ic);
    else prev.setText("-");
  };
  update();
  setting.addButton(
    (b) => b.setButtonText(i18n.t("common.choose")).onClick(
      () => new IconPickerModal(app, i18n, get() || "", (v) => {
        set(v || void 0);
        update();
      }).open()
    )
  );
  setting.addButton(
    (b) => b.setButtonText(i18n.t("common.clear")).onClick(() => {
      set(void 0);
      update();
    })
  );
  return setting;
}

// src/ui/modals/dialogs.ts
var ConfirmModal = class extends import_obsidian9.Modal {
  constructor(app, i18n, message, onConfirm) {
    super(app);
    this.i18n = i18n;
    this.message = message;
    this.onConfirm = onConfirm;
  }
  /** Shift-click a confirming button to skip the dialog and confirm directly. */
  open() {
    if (isShiftHeld()) {
      this.onConfirm();
      return;
    }
    super.open();
  }
  onOpen() {
    this.contentEl.createEl("p", { text: this.message });
    new import_obsidian9.Setting(this.contentEl).addButton((b) => b.setButtonText(this.i18n.t("common.cancel")).onClick(() => this.close())).addButton(
      (b) => b.setButtonText(this.i18n.t("common.confirm")).then(destructive).onClick(() => {
        this.onConfirm();
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ExitEditModal = class extends import_obsidian9.Modal {
  constructor(app, i18n, onSave, onDiscard) {
    super(app);
    this.i18n = i18n;
    this.onSave = onSave;
    this.onDiscard = onDiscard;
  }
  /** Shift-click to skip the prompt and take the default (Save). */
  open() {
    if (isShiftHeld()) {
      this.onSave();
      return;
    }
    super.open();
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.i18n.t("exitEdit.title") });
    contentEl.createEl("p", { text: this.i18n.t("exitEdit.message") });
    new import_obsidian9.Setting(contentEl).addButton((b) => b.setButtonText(this.i18n.t("exitEdit.keepEditing")).onClick(() => this.close())).addButton(
      (b) => b.setButtonText(this.i18n.t("exitEdit.undo")).then(destructive).onClick(() => {
        this.onDiscard();
        this.close();
      })
    ).addButton(
      (b) => b.setButtonText(this.i18n.t("exitEdit.save")).setCta().onClick(() => {
        this.onSave();
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ConfirmChangesModal = class extends import_obsidian9.Modal {
  constructor(app, i18n, onKeep, onUndo) {
    super(app);
    this.i18n = i18n;
    this.onKeep = onKeep;
    this.onUndo = onUndo;
  }
  /** Shift-click to skip the prompt and take the default (Keep changes). */
  open() {
    if (isShiftHeld()) {
      this.onKeep();
      return;
    }
    super.open();
  }
  onOpen() {
    const c = this.contentEl;
    c.createEl("h3", { text: this.i18n.t("confirmChanges.title") });
    c.createEl("p", { text: this.i18n.t("confirmChanges.message") });
    new import_obsidian9.Setting(c).addButton(
      (b) => b.setButtonText(this.i18n.t("confirmChanges.undo")).then(destructive).onClick(() => {
        this.onUndo();
        this.close();
      })
    ).addButton(
      (b) => b.setButtonText(this.i18n.t("confirmChanges.keep")).setCta().onClick(() => {
        this.onKeep();
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var TextPromptModal = class extends import_obsidian9.Modal {
  constructor(app, i18n, title, initial, onSubmit, suggest) {
    super(app);
    this.i18n = i18n;
    this.title = title;
    this.onSubmit = onSubmit;
    this.suggest = suggest;
    this.value = initial;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.title });
    new import_obsidian9.Setting(contentEl).setName(this.title).addText((t) => {
      t.setValue(this.value).onChange((v) => this.value = v);
      if (this.suggest) {
        new ValueSuggest(this.app, t.inputEl, this.suggest, (v) => this.value = v, false);
        t.inputEl.addEventListener("focus", () => t.inputEl.dispatchEvent(new Event("input")));
        t.inputEl.dispatchEvent(new Event("input"));
      }
      t.inputEl.focus();
      t.inputEl.select();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.onSubmit(this.value);
          this.close();
        }
      });
    });
    new import_obsidian9.Setting(contentEl).addButton((b) => b.setButtonText(this.i18n.t("common.cancel")).onClick(() => this.close())).addButton(
      (b) => b.setButtonText(this.i18n.t("common.save")).setCta().onClick(() => {
        this.onSubmit(this.value);
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/core/validate.ts
var OK = { ok: true };
function isEmpty(v) {
  return v === void 0 || v === null || v === "" || Array.isArray(v) && v.length === 0;
}
var NUMERIC = /* @__PURE__ */ new Set(["number", "decimal", "formula", "derived", "unit", "rating"]);
function validate(raw, c, type) {
  if (!c) return OK;
  if (isEmpty(raw)) return c.required ? { ok: false, code: "required" } : OK;
  if (NUMERIC.has(type)) {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      if (c.min !== void 0 && n < c.min) return { ok: false, code: "min", bound: c.min };
      if (c.max !== void 0 && n > c.max) return { ok: false, code: "max", bound: c.max };
    }
    return OK;
  }
  const items = Array.isArray(raw) ? raw.map((x) => String(x)) : [String(raw)];
  let re = null;
  if (c.pattern) {
    try {
      re = new RegExp(`^(?:${c.pattern})$`);
    } catch (e) {
      re = null;
    }
  }
  const allow = c.allowed && c.allowed.length ? c.allowed.map((a) => a.toLowerCase()) : null;
  for (const item of items) {
    if (re && !re.test(item)) return { ok: false, code: "pattern" };
    if (allow && !allow.includes(item.toLowerCase())) return { ok: false, code: "allowed" };
  }
  return OK;
}
function clampToConstraints(n, c) {
  if (!c) return n;
  let out = n;
  if (c.min !== void 0 && out < c.min) out = c.min;
  if (c.max !== void 0 && out > c.max) out = c.max;
  return out;
}
function shouldClamp(c) {
  return !!(c == null ? void 0 : c.clamp) && (c.min !== void 0 || c.max !== void 0);
}

// src/ui/render/validity.ts
function validityMessage(i18n, v) {
  switch (v.code) {
    case "required":
      return i18n.t("validate.required");
    case "min":
      return i18n.t("validate.min", { n: String(v.bound) });
    case "max":
      return i18n.t("validate.max", { n: String(v.bound) });
    case "pattern":
      return i18n.t("validate.pattern");
    case "allowed":
      return i18n.t("validate.allowed");
    default:
      return "";
  }
}
function applyValidity(el, entry, type, raw, i18n) {
  const v = validate(raw, entry.constraints, type);
  el.toggleClass("ep-invalid", !v.ok);
  el.toggleClass("ep-invalid-mark", !v.ok);
  if (v.ok) el.removeAttribute("data-ep-invalid");
  else {
    el.setAttr("data-ep-invalid", "1");
    el.setAttr("title", validityMessage(i18n, v));
  }
  return v.ok;
}

// src/core/pool.ts
function poolFor(settings, vaultValues, key) {
  var _a, _b;
  const extras = (_b = (_a = settings.poolExtras) == null ? void 0 : _a[key.toLowerCase()]) != null ? _b : [];
  const seen = new Set(vaultValues.map((v) => v.toLowerCase()));
  const out = [...vaultValues];
  for (const e of extras) {
    const el = e.toLowerCase();
    if (!seen.has(el)) {
      seen.add(el);
      out.push(e);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}
function isPoolExtra(settings, key, value) {
  var _a, _b;
  return ((_b = (_a = settings.poolExtras) == null ? void 0 : _a[key.toLowerCase()]) != null ? _b : []).some((e) => e.toLowerCase() === value.toLowerCase());
}
function addPoolExtra(settings, key, value) {
  var _a, _b;
  const v = value.trim();
  if (!v) return false;
  const kl = key.toLowerCase();
  const extras = (_b = (_a = settings.poolExtras) == null ? void 0 : _a[kl]) != null ? _b : [];
  if (extras.some((e) => e.toLowerCase() === v.toLowerCase())) return false;
  if (!settings.poolExtras) settings.poolExtras = {};
  settings.poolExtras[kl] = [...extras, v];
  return true;
}
function removePoolExtra(settings, key, value) {
  var _a;
  const kl = key.toLowerCase();
  const extras = (_a = settings.poolExtras) == null ? void 0 : _a[kl];
  if (!extras) return false;
  const next = extras.filter((e) => e.toLowerCase() !== value.toLowerCase());
  if (next.length === extras.length) return false;
  if (next.length) settings.poolExtras[kl] = next;
  else delete settings.poolExtras[kl];
  return true;
}

// src/ui/render/value-types/text.ts
var textType = {
  id: "text",
  name: (i18n) => i18n.t("type.text"),
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const v = ctx2.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueSize) v.setCssStyles({ fontSize: entry.valueSize + "px" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    const s = v.createSpan();
    const draw = () => {
      var _a, _b;
      s.empty();
      s.removeClasses(["ep-placeholder", "ep-locked", "ep-editable"]);
      const raw = view.note.raw[key];
      if (isEnvelope(raw)) {
        const plain = (_b = (_a = view.secretReveal) == null ? void 0 : _a.call(view, raw)) != null ? _b : null;
        if (plain !== null) {
          view.renderLinks(s, plain);
          s.createSpan({ cls: "ep-lock-badge", text: " [locked]" });
        } else {
          s.setText(view.i18n.t("secure.locked"));
          s.addClass("ep-locked");
        }
        applyValidity(v, entry, "text", raw, view.i18n);
        return;
      }
      const val = view.note.str(key);
      if (val === "") {
        s.setText("-");
        s.addClass("ep-placeholder");
      } else {
        view.renderLinks(s, val);
      }
      s.addClass("ep-editable");
      applyValidity(v, entry, "text", raw, view.i18n);
    };
    draw();
    view.bindOpen(s, () => {
      if (isEnvelope(view.note.raw[key])) {
        new import_obsidian10.Notice(view.i18n.t("secure.editLocked"));
        return;
      }
      openTextInput(
        view.app,
        s,
        key,
        view.note.str(key),
        (k) => poolFor(view.settings, view.props.valuesFor(k), k),
        (nv) => view.note.set(file, key, nv === "" ? void 0 : nv)
      );
    });
    view.registerUpdater(draw);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    const encrypted = isEnvelope(view.note.raw[key]);
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(() => {
        if (encrypted) {
          new import_obsidian10.Notice(view.i18n.t("secure.editLocked"));
          return;
        }
        new TextPromptModal(
          view.app,
          view.i18n,
          view.i18n.t("prompt.editValue", { name: entry.alias || key }),
          view.note.str(key),
          (v) => view.note.set(file, key, v.trim() === "" ? void 0 : v.trim()),
          () => poolFor(view.settings, view.props.valuesFor(key), key)
        ).open();
      })
    );
    if (view.encryptValueAt && !encrypted && view.settings.features["secure"] !== false) {
      menu.addItem(
        (i) => i.setTitle(view.i18n.t("secure.menu.encrypt")).setIcon("lock").onClick(() => void view.encryptValueAt(file, key))
      );
    }
    if (view.decryptValueAt && encrypted) {
      menu.addItem(
        (i) => i.setTitle(view.i18n.t("secure.menu.decrypt")).setIcon("unlock").onClick(() => void view.decryptValueAt(file, key))
      );
    }
  }
};

// src/ui/render/value-types/numeric.ts
var import_obsidian11 = require("obsidian");

// src/ui/render/cluster.ts
function addonsFor(ref) {
  return ref.view.registries.clusterAddons.all().filter((a) => a.appliesTo(ref));
}
function mergeNeeds(into, needs) {
  if (!needs) return;
  if (needs.steppers) into.steppers = true;
  const add = (target, slots) => {
    for (const s of slots != null ? slots : []) if (!target.some((x) => x.id === s.id)) target.push(s);
  };
  add(into.before, needs.before);
  add(into.after, needs.after);
}
function emptyFlags() {
  return { before: [], steppers: false, after: [] };
}
function buildCluster(head, flags, o, bindOpen) {
  var _a, _b, _c;
  const cl = head.createDiv({ cls: "ep-cluster" });
  const cols = [];
  flags.before.forEach(() => cols.push("auto"));
  if (flags.steppers) cols.push("var(--ep-step-col, 20px)");
  cols.push("minmax(2.1em, auto)");
  if (flags.steppers) cols.push("var(--ep-step-col, 20px)");
  flags.after.forEach(() => cols.push("auto"));
  cl.setCssStyles({ gridTemplateColumns: cols.join(" ") });
  const cells = {};
  const editable = !!(o.commit && o.get);
  const min = (_a = o.min) != null ? _a : -Infinity;
  const max = (_b = o.max) != null ? _b : Infinity;
  const makeSlotCell = (slot) => {
    var _a2, _b2;
    const cell = cl.createSpan({ cls: "ep-cell" + (slot.cls ? " " + slot.cls : "") });
    cell.setAttr("data-ep-slot", slot.id);
    cells[slot.id] = cell;
    (_b2 = (_a2 = o.slots) == null ? void 0 : _a2[slot.id]) == null ? void 0 : _b2.call(_a2, cell);
  };
  for (const slot of flags.before) makeSlotCell(slot);
  if (flags.steppers) {
    if (o.steppers && editable) {
      const dec = cl.createEl("button", { cls: "ep-step-btn", text: "-" });
      dec.setAttr("aria-label", "Decrease value");
      dec.onclick = () => {
        sfx.tick();
        const cur = o.get();
        o.commit(o.clamp ? clamp(cur - 1, min, max) : cur - 1);
      };
    } else {
      cl.createSpan({ cls: "ep-cell" });
    }
  }
  const val = cl.createSpan({ cls: "ep-num" });
  if (editable) {
    val.setText(fmtNum(o.get()));
    bindOpen(
      val,
      () => openNumberInput(val, o.get(), o.commit, { min, max, float: !!o.float, clamp: !!o.clamp })
    );
  } else {
    val.setText((_c = o.display) != null ? _c : "");
  }
  if (flags.steppers) {
    if (o.steppers && editable) {
      const inc = cl.createEl("button", { cls: "ep-step-btn", text: "+" });
      inc.setAttr("aria-label", "Increase value");
      inc.onclick = () => {
        sfx.tick();
        const cur = o.get();
        o.commit(o.clamp ? clamp(cur + 1, min, max) : cur + 1);
      };
    } else {
      cl.createSpan({ cls: "ep-cell" });
    }
  }
  for (const slot of flags.after) makeSlotCell(slot);
  let col = 0;
  for (const child of Array.from(cl.children)) {
    col++;
    if (child.instanceOf(HTMLElement)) child.setCssStyles({ gridColumn: String(col) });
  }
  return { val, cells };
}

// src/ui/render/value-types/numeric.ts
function defaultRange(kind) {
  if (kind === "formula") return { min: 0, max: 10 };
  if (kind === "decimal") return { min: 0, max: 1 };
  return { min: -9999, max: 99999 };
}
function wantSteppers(kind, entry) {
  return (kind === "number" || kind === "decimal") && entry.steppers !== false;
}
function curveMap(curve, t) {
  if (curve === "root") return Math.sqrt(Math.max(0, t));
  if (curve === "exp") return t * t;
  return t;
}
function curveInvert(curve, u) {
  const c = Math.min(1, Math.max(0, u));
  if (curve === "root") return c * c;
  if (curve === "exp") return Math.sqrt(c);
  return c;
}
function effectiveRange(kind, entry, vault) {
  var _a, _b, _c, _d, _e, _f;
  const range = defaultRange(kind);
  let min = (_b = (_a = entry.min) != null ? _a : vault == null ? void 0 : vault.min) != null ? _b : range.min;
  let max = (_d = (_c = entry.max) != null ? _c : vault == null ? void 0 : vault.max) != null ? _d : range.max;
  if (max <= min) {
    min = (_e = entry.min) != null ? _e : range.min;
    max = (_f = entry.max) != null ? _f : range.max;
  }
  return { min, max };
}
function clusterNeeds(kind, ref) {
  const flags = emptyFlags();
  if (wantSteppers(kind, ref.entry)) flags.steppers = true;
  for (const a of addonsFor(ref)) mergeNeeds(flags, a.needs(ref));
  return { steppers: flags.steppers, before: flags.before, after: flags.after };
}
function render(kind, ctx2) {
  var _a, _b, _c;
  const { view, file, entry } = ctx2;
  const key = entry.key;
  const isFormula = kind === "formula";
  const isDecimal = kind === "decimal";
  const vault = entry.min === void 0 || entry.max === void 0 ? view.props.numberRange(key) : null;
  const { min, max } = effectiveRange(kind, entry, vault);
  const label = (_a = entry.alias) != null ? _a : key;
  const f = isFormula ? compileFormula(entry.formula || "x") || ((x) => x) : null;
  const get = () => view.note.num(key, 0);
  const factor = Number(entry.unitFactor) > 0 ? Number(entry.unitFactor) : 1;
  const addons = addonsFor(ctx2);
  const slots = {};
  for (const a of addons) Object.assign(slots, a.fillSlots(ctx2, { get, label }));
  const refs = view.buildCluster(ctx2.head, ctx2.flags, {
    get: () => get() * factor,
    display: fmtNum(get() * factor),
    steppers: wantSteppers(kind, entry),
    min: min * factor,
    max: max * factor,
    float: isDecimal || isFormula || factor !== 1,
    clamp: !!entry.clamp,
    commit: (v) => {
      const raw = v / factor;
      view.note.set(file, key, shouldClamp(entry.constraints) ? clampToConstraints(raw, entry.constraints) : raw);
    },
    slots
  });
  if (entry.valueColor) refs.val.setCssStyles({ color: entry.valueColor });
  if (entry.valueSize) refs.val.setCssStyles({ fontSize: entry.valueSize + "px" });
  const unit = ((_b = entry.unit) != null ? _b : "").trim();
  const setVal = (v) => {
    refs.val.setText(fmtNum(v * factor));
    if (unit) refs.val.createSpan({ cls: "ep-unit-hint", text: unit });
  };
  if (unit || factor !== 1) setVal(get());
  const curve = entry.sliderCurve;
  const span = max - min;
  const toValue = (x) => {
    if (isFormula && f) return f(x);
    if (span <= 0) return x;
    return min + span * curveMap(curve, (x - min) / span);
  };
  const toPosition = (v) => {
    if (isFormula && f) return invertFormula(f, v, min, max);
    if (span <= 0) return v;
    return min + span * curveInvert(curve, (v - min) / span);
  };
  let syncKnob = null;
  if (entry.rating && !isFormula) {
    const icon = entry.ratingIcon || "star";
    const balance = !!entry.ratingBalance;
    const align = entry.ratingAlign || "left";
    const emax = Number(entry.max);
    const count = Math.min(1e3, Math.max(1, Math.round(Number.isFinite(emax) ? emax : 5)));
    const kmin = Math.round((_c = entry.min) != null ? _c : 0);
    const strip = ctx2.extra.createDiv({ cls: "ep-rating ep-rating-strip ep-ralign-" + align });
    if (entry.ratingFill) strip.addClass("ep-rating-fill");
    if (entry.valueColor) strip.setCssStyles({ color: entry.valueColor });
    const layoutBreaks = () => {
      if (!strip.isConnected) return;
      strip.findAll(".ep-rating-break").forEach((b) => b.remove());
      if (!balance) return;
      const pips = strip.findAll(".ep-rating-pip");
      if (!pips.length) return;
      const gap = 2;
      const w = strip.clientWidth;
      const pw = pips[0].offsetWidth || 1;
      const fit = Math.max(1, Math.floor((w + gap) / (pw + gap)));
      if (fit >= pips.length) return;
      const rows = Math.ceil(pips.length / fit);
      const per = Math.ceil(pips.length / rows);
      for (let i = per; i < pips.length; i += per) {
        const br = createSpan({ cls: "ep-rating-break" });
        strip.insertBefore(br, pips[i]);
      }
    };
    const ro = new ResizeObserver(() => {
      if (!strip.isConnected) {
        ro.disconnect();
        return;
      }
      window.requestAnimationFrame(layoutBreaks);
    });
    ro.observe(strip);
    strip.setAttr("role", "slider");
    strip.tabIndex = 0;
    strip.setAttr("aria-label", view.defaultLabelFor(entry));
    strip.setAttr("aria-valuemin", String(kmin));
    strip.setAttr("aria-valuemax", String(count));
    const setRating = (n) => {
      view.note.set(file, key, clamp(Math.round(n), kmin, count));
    };
    const negCount = Math.max(0, -kmin);
    const drawRating = () => {
      strip.empty();
      const cur = Math.round(get());
      strip.setAttr("aria-valuenow", String(cur));
      const divideOnNeg = cur >= 0;
      for (let k = negCount; k >= 1; k--) {
        const kk = k;
        const pip = strip.createSpan({
          cls: "ep-rating-pip pip-neg" + (cur <= -kk ? " is-on is-neg" : "") + (kk === 1 && divideOnNeg ? " pip-negend" : "")
        });
        (0, import_obsidian11.setIcon)(pip, icon);
        pip.setAttr("aria-hidden", "true");
        pip.onclick = (e2) => {
          e2.preventDefault();
          e2.stopPropagation();
          sfx.tick();
          setRating(cur === -kk ? -(kk - 1) : -kk);
        };
      }
      const fill = Math.min(Math.max(cur, 0), count);
      for (let i = 1; i <= count; i++) {
        const pip = strip.createSpan({
          cls: "ep-rating-pip" + (i <= fill ? " is-on" : "") + (i === 1 && negCount > 0 && !divideOnNeg ? " pip-posend" : "")
        });
        (0, import_obsidian11.setIcon)(pip, icon);
        pip.setAttr("aria-hidden", "true");
        pip.onclick = (e2) => {
          e2.preventDefault();
          e2.stopPropagation();
          sfx.tick();
          setRating(i === cur ? i - 1 : i);
        };
      }
      window.requestAnimationFrame(layoutBreaks);
    };
    drawRating();
    strip.addEventListener("keydown", (e2) => {
      const cur = Math.round(get());
      let n = cur;
      if (e2.key === "ArrowRight" || e2.key === "ArrowUp") n = cur + 1;
      else if (e2.key === "ArrowLeft" || e2.key === "ArrowDown") n = cur - 1;
      else if (e2.key === "Home") n = kmin;
      else if (e2.key === "End") n = count;
      else return;
      e2.preventDefault();
      sfx.tick();
      setRating(n);
    });
    view.registerUpdater(drawRating);
  } else if (entry.slider || isFormula) {
    const slider = ctx2.extra.createDiv({ cls: "ep-slider2" });
    slider.createDiv({ cls: "ep-slider2-track" });
    const knob = slider.createDiv({ cls: "ep-slider2-knob" });
    knob.tabIndex = 0;
    knob.setAttr("role", "slider");
    knob.setAttr("aria-valuemin", String(min));
    knob.setAttr("aria-valuemax", String(max));
    const fmt = (v) => isDecimal || isFormula ? v : Math.round(v);
    const pctForValue = (v) => span <= 0 ? 0 : clamp((toPosition(v) - min) / span, 0, 1) * 100;
    const place = (v) => {
      slider.setCssProps({ "--ep-knob": pctForValue(v) + "%" });
      knob.setAttr("aria-valuenow", String(fmt(v)));
    };
    syncKnob = () => place(get());
    syncKnob();
    let active = false;
    let pending2 = get();
    const drag = (clientX) => {
      var _a2;
      const r = slider.getBoundingClientRect();
      const t = r.width <= 0 ? 0 : clamp((clientX - r.left) / r.width, 0, 1);
      let out = toValue(min + t * span);
      if (!isFormula && entry.clamp) out = clamp(out, min, max);
      pending2 = fmt(out);
      place(pending2);
      setVal(pending2);
      for (const a of addons) (_a2 = a.onPreview) == null ? void 0 : _a2.call(a, ctx2, refs.cells, pending2);
    };
    knob.addEventListener("pointerdown", (e) => {
      active = true;
      pending2 = get();
      slider.addClass("is-active");
      try {
        knob.setPointerCapture(e.pointerId);
      } catch (e2) {
      }
      e.preventDefault();
      e.stopPropagation();
    });
    knob.addEventListener("pointermove", (e) => {
      if (!active) return;
      drag(e.clientX);
      e.preventDefault();
    });
    const finish = (e) => {
      if (!active) return;
      active = false;
      slider.removeClass("is-active");
      try {
        knob.releasePointerCapture(e.pointerId);
      } catch (e2) {
      }
      view.note.set(file, key, shouldClamp(entry.constraints) ? clampToConstraints(pending2, entry.constraints) : pending2);
      sfx.tick();
      syncKnob == null ? void 0 : syncKnob();
    };
    knob.addEventListener("pointerup", finish);
    knob.addEventListener("pointercancel", () => {
      if (!active) return;
      active = false;
      slider.removeClass("is-active");
      syncKnob == null ? void 0 : syncKnob();
    });
    knob.addEventListener("keydown", (e) => {
      const step = kind === "number" && !curve ? 1 : span / 100 || 1;
      let v = get();
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") v += step;
      else return;
      e.preventDefault();
      if (entry.clamp) v = clamp(v, min, max);
      view.note.set(file, key, fmt(v));
    });
  }
  const checkValid = () => applyValidity(refs.val, entry, kind, view.note.raw[key], view.i18n);
  checkValid();
  view.registerUpdater(() => {
    const v = view.note.num(key, 0);
    setVal(v);
    syncKnob == null ? void 0 : syncKnob();
    checkValid();
  });
}
function renderOptions(kind, octx) {
  var _a;
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  c.createEl("h4", { text: t("options.numberHeading") });
  new import_obsidian11.Setting(c).setName(t("options.showSlider")).addToggle((tg) => {
    tg.setValue(!!entry.slider).onChange((v) => {
      entry.slider = v || void 0;
      if (v) entry.rating = void 0;
      changed();
      octx.redraw();
    });
  });
  if (kind === "number" || kind === "decimal") {
    new import_obsidian11.Setting(c).setName(t("options.ratingToggle")).setDesc(t("options.ratingToggleDesc")).addToggle((tg) => {
      tg.setValue(!!entry.rating).onChange((v) => {
        entry.rating = v || void 0;
        if (v) {
          entry.slider = void 0;
          if (entry.max === void 0) entry.max = 5;
        }
        changed();
        octx.redraw();
      });
    });
    if (entry.rating) {
      addIconSetting(
        view.app,
        view.i18n,
        c,
        t("options.ratingIcon"),
        () => entry.ratingIcon || "star",
        (v) => {
          entry.ratingIcon = v;
          changed();
        }
      );
      new import_obsidian11.Setting(c).setName(t("options.ratingBalance")).setDesc(t("options.ratingBalanceDesc")).addToggle((tg) => {
        tg.setValue(!!entry.ratingBalance).onChange((v) => {
          entry.ratingBalance = v || void 0;
          changed();
        });
      });
      new import_obsidian11.Setting(c).setName(t("options.ratingFill")).setDesc(t("options.ratingFillDesc")).addToggle((tg) => {
        tg.setValue(!!entry.ratingFill).onChange((v) => {
          entry.ratingFill = v || void 0;
          changed();
        });
      });
      new import_obsidian11.Setting(c).setName(t("options.ratingAlign")).addDropdown((d) => {
        d.addOption("left", t("options.alignLeft"));
        d.addOption("center", t("options.alignCenter"));
        d.addOption("right", t("options.alignRight"));
        d.addOption("space", t("options.alignSpace"));
        d.setValue(entry.ratingAlign || "left");
        d.onChange((v) => {
          entry.ratingAlign = v === "left" ? void 0 : v;
          changed();
        });
      });
    }
  }
  if (kind === "number" || kind === "decimal") {
    new import_obsidian11.Setting(c).setName(t("options.showSteppers")).addToggle((tg) => {
      tg.setValue(entry.steppers !== false).onChange((v) => {
        entry.steppers = v ? void 0 : false;
        changed();
      });
    });
    new import_obsidian11.Setting(c).setName(t("options.unit")).setDesc(t("options.unitDesc")).addText((tx) => {
      var _a2;
      tx.setValue((_a2 = entry.unit) != null ? _a2 : "").onChange((v) => {
        entry.unit = v.trim() || void 0;
        changed();
      });
    });
    new import_obsidian11.Setting(c).setName(t("options.unitFactor")).setDesc(t("options.unitFactorDesc")).addText((tx) => {
      tx.setPlaceholder("1");
      tx.setValue(entry.unitFactor !== void 0 ? String(entry.unitFactor) : "").onChange((v) => {
        const n = Number(v);
        entry.unitFactor = v.trim() !== "" && Number.isFinite(n) && n > 0 && n !== 1 ? n : void 0;
        changed();
      });
    });
  }
  new import_obsidian11.Setting(c).setName(t("options.sliderCurve")).addDropdown((d) => {
    d.addOption("linear", t("options.curveLinear"));
    d.addOption("root", t("options.curveRoot"));
    d.addOption("exp", t("options.curveExp"));
    d.setValue(entry.sliderCurve || "linear");
    d.onChange((v) => {
      entry.sliderCurve = v === "linear" ? void 0 : v;
      changed();
    });
  });
  new import_obsidian11.Setting(c).setName(t("options.minimum")).setDesc(t("options.rangeAuto")).addText((tx) => {
    tx.setValue(entry.min !== void 0 ? String(entry.min) : "").onChange((v) => {
      const n = Number(v);
      entry.min = v.trim() === "" || !Number.isFinite(n) ? void 0 : n;
      changed();
    });
  });
  new import_obsidian11.Setting(c).setName(t("options.maximum")).setDesc(t("options.rangeAuto")).addText((tx) => {
    tx.setValue(entry.max !== void 0 ? String(entry.max) : "").onChange((v) => {
      const n = Number(v);
      entry.max = v.trim() === "" || !Number.isFinite(n) ? void 0 : n;
      changed();
    });
  });
  new import_obsidian11.Setting(c).setName(t("options.clamp")).addToggle((tg) => {
    tg.setValue(!!entry.clamp).onChange((v) => {
      entry.clamp = v || void 0;
      changed();
    });
  });
  if (kind === "formula") {
    new import_obsidian11.Setting(c).setName(t("options.formula")).setDesc(t("options.formulaDesc")).addText((tx) => {
      var _a2;
      tx.setValue((_a2 = entry.formula) != null ? _a2 : "x").onChange((v) => {
        if (v.trim() && !compileFormula(v.trim())) return;
        entry.formula = v.trim() || void 0;
        changed();
      });
    });
  }
  for (const a of octx.view.registries.clusterAddons.all()) (_a = a.renderOptions) == null ? void 0 : _a.call(a, octx);
}
function menuItems(kind, menu, ref) {
  const { view, file, entry } = ref;
  const key = entry.key;
  const float = kind === "decimal" || kind === "formula";
  menu.addItem(
    (i) => i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(
      () => new TextPromptModal(
        view.app,
        view.i18n,
        view.i18n.t("prompt.editValue", { name: entry.alias || key }),
        view.note.str(key),
        (v) => {
          let n = Number(v);
          if (!Number.isFinite(n)) return;
          if (!float) n = Math.round(n);
          if (entry.clamp && entry.min !== void 0 && entry.max !== void 0)
            n = clamp(n, entry.min, entry.max);
          view.note.set(file, key, n);
        }
      ).open()
    )
  );
}
function makeNumericType(kind, nameKey) {
  return {
    id: kind,
    name: (i18n) => i18n.t(nameKey),
    render: (ctx2) => render(kind, ctx2),
    clusterNeeds: (ref) => clusterNeeds(kind, ref),
    renderOptions: (octx) => renderOptions(kind, octx),
    menuItems: (menu, ref) => menuItems(kind, menu, ref)
  };
}
var numberType = makeNumericType("number", "type.number");
var decimalType = makeNumericType("decimal", "type.decimal");
var formulaType = makeNumericType("formula", "type.formula");

// src/ui/render/modifier-addon.ts
var import_obsidian13 = require("obsidian");

// src/utils/dice.ts
var DICE_PRESETS = [2, 4, 6, 8, 10, 12, 20, 100];
var DEFAULT_DICE = { count: 1, sides: 20 };
function formatDice(spec) {
  return (spec.count > 1 ? spec.count : "") + "d" + spec.sides;
}
function isDefaultDice(spec) {
  return spec.count === DEFAULT_DICE.count && spec.sides === DEFAULT_DICE.sides;
}
function parseDice(text) {
  if (!text) return null;
  const m = String(text).trim().match(/^(\d*)\s*[dD]\s*(\d+)$/);
  if (!m) return null;
  const count = m[1] ? parseInt(m[1]) : 1;
  const sides = parseInt(m[2]);
  if (!Number.isFinite(count) || !Number.isFinite(sides)) return null;
  if (count < 1 || count > 100 || sides < 2 || sides > 1e4) return null;
  return { count, sides };
}
function parseDiceOrDefault(text) {
  var _a;
  return (_a = parseDice(text)) != null ? _a : { ...DEFAULT_DICE };
}

// src/ui/render/dice-icons.ts
var import_obsidian12 = require("obsidian");
var P = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;
var DICE_ICONS = {
  // Coin: circle with an equator.
  "ep-d2": `<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="7"/>` + P("M16 62 H84"),
  // Tetrahedron: triangle with the front edge.
  "ep-d4": P("M50 10 L90 84 L10 84 Z") + P("M50 10 L50 84"),
  // Cube, isometric: hexagon silhouette + the three visible edges.
  "ep-d6": P("M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z") + P("M12 28 L50 50 L88 28 M50 50 L50 94"),
  // Octahedron: diamond split along the equator.
  "ep-d8": P("M50 6 L90 50 L50 94 L10 50 Z") + P("M10 50 H90"),
  // Pentagonal trapezohedron: kite with the visible face edges.
  "ep-d10": P("M50 6 L88 45 L50 94 L12 45 Z") + P("M12 45 L50 60 L88 45 M50 6 L50 60"),
  // Dodecahedron: pentagon silhouette + inner face.
  "ep-d12": P("M50 8 L90 39 L75 86 L25 86 L10 39 Z") + P("M50 30 L67 43 L61 63 L39 63 L33 43 Z"),
  // Icosahedron: hexagon silhouette + central face and connectors.
  "ep-d20": P("M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z") + P("M50 22 L78 66 L22 66 Z") + P("M50 6 L50 22 M88 72 L78 66 M12 72 L22 66"),
  // Percentile: a pair of d10 kites.
  "ep-d100": P("M30 18 L52 47 L30 82 L10 47 Z") + P("M70 18 L90 47 L70 82 L48 47 Z"),
  // Fallback for custom face counts.
  "ep-dx": P("M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z") + `<circle cx="50" cy="52" r="7" fill="currentColor"/>`
};
function registerDiceIcons() {
  for (const [id, svg] of Object.entries(DICE_ICONS)) (0, import_obsidian12.addIcon)(id, svg);
}
function diceIconId(sides) {
  var _a;
  const map = {
    2: "ep-d2",
    4: "ep-d4",
    6: "ep-d6",
    8: "ep-d8",
    10: "ep-d10",
    12: "ep-d12",
    20: "ep-d20",
    100: "ep-d100"
  };
  return (_a = map[sides]) != null ? _a : "ep-dx";
}

// src/ui/render/modifier-addon.ts
var MODIFIABLE_TYPE_IDS = /* @__PURE__ */ new Set(["number", "decimal", "formula", "derived"]);
function mods(entry) {
  const m = ext(entry).mods;
  return Array.isArray(m) ? m : [];
}
function togglable(entry) {
  return mods(entry).filter((m) => m.toggle && !m.hideToggle);
}
function paintDenotation(parent, view, entry, file) {
  const list = mods(entry).filter((m) => !m.hideInChain);
  if (!list.length) return null;
  const den = parent.createSpan({ cls: "ep-denote" });
  list.forEach((inf, i) => {
    var _a, _b, _c, _d;
    const neg = inf.weight === -1;
    if (i > 0) den.createSpan({ cls: "ep-denote-op", text: neg ? "-" : "+" });
    else if (neg) den.createSpan({ cls: "ep-denote-op", text: "-" });
    const srcKey = inf.source || entry.key || "";
    const term = den.createSpan({ cls: "ep-line-abbr ep-denote-term", text: termDenotation(view.settings, entry, inf) });
    let title;
    if (inf.expr) {
      title = inf.expr + (inf.toggle ? ` - ${inf.toggle}` : "");
    } else {
      const modeName = inf.mode === "formula" ? (_a = inf.formula) != null ? _a : "x" : (_d = (_c = view.registries.derivations.get((_b = inf.mode) != null ? _b : "value")) == null ? void 0 : _c.name(view.i18n)) != null ? _d : "";
      title = srcKey + (modeName ? ` - ${modeName}` : "") + (inf.toggle ? ` - ${inf.toggle}` : "");
    }
    if (!influenceActive(view, entry, inf)) term.addClass("ep-denote-off");
    if (file) {
      term.addClass("ep-denote-tog");
      title += ` - ${view.i18n.t("mods.clickToggle")}`;
      const flip = () => {
        if (inf.toggle) setInfluenceActive(view, file, entry, inf, !influenceActive(view, entry, inf));
        else setInfluenceDisabled(view, file, entry, inf, !influenceDisabled(view, entry, inf));
      };
      term.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        flip();
      };
    }
    term.setAttr("title", title);
  });
  return den;
}
function paintDice(parent, entry) {
  const e = entry;
  if (!e["roll"] || e["showDice"] === false) return;
  const spec = parseDiceOrDefault(typeof e["dice"] === "string" ? e["dice"] : void 0);
  const tag = parent.createSpan({ cls: "ep-dice-tag ep-line-abbr" });
  if (e["showDiceIcon"] !== false) {
    tag.addClass("ep-dice-stack");
    const ic = tag.createSpan({ cls: "ep-dice-ico" });
    (0, import_obsidian13.setIcon)(ic, diceIconId(spec.sides));
  }
  tag.createSpan({ text: formatDice(spec) });
}
function paintBadge(cell, ref) {
  cell.empty();
  if (ref.entry.showChain !== false) paintDenotation(cell, ref.view, ref.entry, ref.file);
  paintDice(cell, ref.entry);
  const info = modifierInfo(ref.view, ref.entry);
  if (info.value === void 0) {
    const m = cell.createSpan({ cls: "ep-expr-error", text: "-" });
    m.setAttr("title", ref.view.i18n.t(info.error === "cycle" ? "mods.errCycle" : "mods.errExpr"));
  } else {
    cell.appendText(fmtMod(info.value));
  }
}
var modifierAddon = {
  id: "core.mods",
  appliesTo(ref) {
    var _a;
    if (ref.entry.kind !== "prop") return false;
    if (!MODIFIABLE_TYPE_IDS.has(ref.view.resolveType(ref.entry))) return false;
    const e = ext(ref.entry);
    return !!(((_a = e.mods) == null ? void 0 : _a.length) || e.showMod);
  },
  needs(ref) {
    const before = [];
    if (togglable(ref.entry).length) before.push({ id: "tog", cls: "ep-tog-cell" });
    const isDerived = ref.view.resolveType(ref.entry) === "derived";
    if (ext(ref.entry).showMod && !isDerived) before.push({ id: "mod", cls: "ep-mod-badge" });
    return { before };
  },
  onRename(entry) {
    const e = ext(entry);
    e.mods = void 0;
    e.rollOverride = void 0;
    e.showMod = void 0;
  },
  fillSlots(ctx2) {
    const view = ctx2.view;
    const e = ext(ctx2.entry);
    const slots = {};
    const togs = togglable(ctx2.entry);
    if (togs.length) {
      slots["tog"] = (cell) => {
        var _a, _b;
        for (const inf of togs) {
          const cb = cell.createEl("input");
          cb.type = "checkbox";
          cb.addClass("ep-prof");
          const sync = () => cb.checked = influenceActive(view, ctx2.entry, inf);
          sync();
          const flip = () => setInfluenceActive(view, ctx2.file, ctx2.entry, inf, !influenceActive(view, ctx2.entry, inf));
          if (view.editMode) {
            cb.setAttr("title", (_a = inf.toggle) != null ? _a : "");
            cb.onchange = flip;
          } else {
            cb.setAttr("title", `${(_b = inf.toggle) != null ? _b : ""} - ${view.i18n.t("hint.dblToggle")}`);
            cb.onclick = (ev) => ev.preventDefault();
            cb.ondblclick = flip;
          }
          view.registerUpdater(sync);
        }
      };
    }
    if (e.showMod && view.resolveType(ctx2.entry) !== "derived") {
      slots["mod"] = (cell) => {
        paintBadge(cell, ctx2);
        view.registerUpdater(() => paintBadge(cell, ctx2));
      };
    }
    return slots;
  },
  /** Keep the badge live while a slider drags (only the self term reacts). */
  onPreview(ctx2, cells, value) {
    const e = ext(ctx2.entry);
    if (!e.showMod || !cells["mod"] || e.rollOverride !== void 0) return;
    const view = ctx2.view;
    let total = 0;
    for (const inf of mods(ctx2.entry)) {
      if (inf.source || inf.expr) {
        total += influenceTerm(view, ctx2.entry, inf);
        continue;
      }
      if (!influenceActive(view, ctx2.entry, inf)) continue;
      total += (inf.weight === -1 ? -1 : 1) * applyDerivation(view, inf, value);
    }
    const cell = cells["mod"];
    cell.empty();
    if (ctx2.entry.showChain !== false) paintDenotation(cell, view, ctx2.entry, ctx2.file);
    paintDice(cell, ctx2.entry);
    cell.appendText(fmtMod(total));
  },
  // -- options: the influence editor ---------------------------------------
  renderOptions(octx) {
    const { view, entry, container: c, changed, redraw } = octx;
    if (entry.kind !== "prop" || !MODIFIABLE_TYPE_IDS.has(view.resolveType(entry))) return;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext(entry);
    const isDerived = view.resolveType(entry) === "derived";
    const list = mods(entry);
    c.createEl("h4", { text: t("mods.heading") });
    if (list.length) {
      c.createEl("p", {
        cls: "setting-item-description",
        text: t("mods.preview", {
          denote: denotationText(view.settings, entry, list),
          total: fmtMod(modifierTotal(view, entry))
        })
      });
    }
    if (entry.key && entry["__multi"] !== true) {
      const key = entry.key;
      if (ensureShortForm(view.settings, key)) changed();
      new import_obsidian13.Setting(c).setName(t("mods.shortForm")).setDesc(t("mods.shortFormDesc")).addText((tx) => {
        tx.setValue(abbrFor(view.settings, key)).setPlaceholder(defaultAbbr(key));
        tx.inputEl.addClass("ep-abbr-input");
        tx.inputEl.addEventListener("change", () => {
          const desired = tx.getValue().trim().toUpperCase();
          if (!desired) {
            reassignDerived(view.settings, key);
            changed();
            tx.setValue(abbrFor(view.settings, key));
            return;
          }
          if (desired === abbrFor(view.settings, key)) return;
          const other = shortFormConflict(view.settings, key, desired);
          if (other) {
            tx.setValue(abbrFor(view.settings, key));
            new ConfirmModal(view.app, view.i18n, t("mods.shortFormConflict", { abbr: desired, other }), () => {
              assignShortForm(view.settings, key, desired);
              reassignDerived(view.settings, other);
              changed();
              redraw();
            }).open();
            return;
          }
          assignShortForm(view.settings, key, desired);
          changed();
        });
      });
    }
    list.forEach((inf, idx) => {
      const head = new import_obsidian13.Setting(c).setName(t("mods.influence", { n: idx + 1 }));
      head.addText((tx) => {
        var _a;
        tx.setPlaceholder(t("mods.sourceSelf")).setValue((_a = inf.source) != null ? _a : "");
        if (inf.expr !== void 0) tx.setDisabled(true);
        new PropSuggest(view.app, tx.inputEl, view.i18n, () => view.propCandidates(true), (k) => {
          inf.source = k || void 0;
          changed();
          redraw();
        }, false);
        tx.inputEl.addEventListener("change", () => {
          inf.source = tx.getValue().trim() || void 0;
          changed();
        });
      });
      head.addDropdown((d) => {
        var _a, _b, _c;
        d.addOption("value", (_b = (_a = view.registries.derivations.get("value")) == null ? void 0 : _a.name(view.i18n)) != null ? _b : "value");
        for (const def of view.registries.derivations.all())
          if (def.id !== "value") d.addOption(def.id, def.name(view.i18n));
        d.addOption("formula", t("mods.modeFormula"));
        d.addOption("expr", t("mods.modeExpr"));
        d.setValue(inf.expr !== void 0 ? "expr" : (_c = inf.mode) != null ? _c : "value");
        d.onChange((v) => {
          var _a2;
          if (v === "expr") {
            inf.expr = (_a2 = inf.expr) != null ? _a2 : "";
            inf.mode = void 0;
          } else {
            inf.expr = void 0;
            inf.mode = v === "value" ? void 0 : v;
          }
          changed();
          redraw();
        });
      });
      head.addExtraButton(
        (b) => b.setIcon("arrow-up").setTooltip(t("mods.moveUp")).onClick(() => {
          if (idx === 0) return;
          [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
          e.mods = list;
          changed();
          redraw();
        })
      );
      head.addExtraButton(
        (b) => b.setIcon("arrow-down").setTooltip(t("mods.moveDown")).onClick(() => {
          if (idx >= list.length - 1) return;
          [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
          e.mods = list;
          changed();
          redraw();
        })
      );
      head.addExtraButton(
        (b) => b.setIcon("trash").setTooltip(t("mods.removeInfluence")).onClick(() => {
          list.splice(idx, 1);
          e.mods = list.length ? list : void 0;
          changed();
          redraw();
        })
      );
      if (inf.expr !== void 0) {
        new import_obsidian13.Setting(c).setName(t("mods.expr")).setDesc(t("mods.exprDesc")).setClass("ep-mods-sub").addText((tx) => {
          var _a, _b;
          tx.setValue((_a = inf.expr) != null ? _a : "");
          tx.inputEl.addClass("ep-expr-input");
          new RefSuggest(
            view.app,
            tx.inputEl,
            () => referenceSuggestions(view.settings, view.propCandidates(true).map((c2) => c2.key))
          );
          const validate2 = (val) => tx.inputEl.toggleClass("ep-invalid", val.trim() !== "" && !parseExpr(val));
          validate2((_b = inf.expr) != null ? _b : "");
          tx.onChange((val) => {
            inf.expr = val;
            validate2(val);
            changed();
          });
        });
      } else if (inf.mode === "formula") {
        new import_obsidian13.Setting(c).setName(t("mods.formula")).setDesc(t("options.formulaDesc")).setClass("ep-mods-sub").addText((tx) => {
          var _a;
          tx.setValue((_a = inf.formula) != null ? _a : "x").onChange((v) => {
            inf.formula = v.trim() || void 0;
            changed();
          });
        });
      }
      const sub2 = new import_obsidian13.Setting(c).setName(t("mods.termOptions")).setClass("ep-mods-sub");
      sub2.addDropdown((d) => {
        d.addOption("1", t("mods.weightAdd"));
        d.addOption("-1", t("mods.weightSub"));
        d.setValue(inf.weight === -1 ? "-1" : "1");
        d.onChange((v) => {
          inf.weight = v === "-1" ? -1 : void 0;
          changed();
        });
      });
      sub2.addText((tx) => {
        var _a;
        tx.setPlaceholder(t("mods.togglePlaceholder")).setValue((_a = inf.toggle) != null ? _a : "");
        tx.inputEl.setAttr("aria-label", t("mods.toggleProp"));
        new PropSuggest(view.app, tx.inputEl, view.i18n, () => view.propCandidates(true), (k) => {
          inf.toggle = k || void 0;
          changed();
          redraw();
        }, false);
        tx.inputEl.addEventListener("change", () => {
          inf.toggle = tx.getValue().trim() || void 0;
          changed();
        });
      });
      sub2.setDesc(t("mods.termOptionsDesc"));
      if (inf.toggle) {
        new import_obsidian13.Setting(c).setName(t("mods.showToggle")).setDesc(t("mods.showToggleDesc", { list: inf.toggle })).setClass("ep-mods-sub").addToggle((tg) => {
          tg.setValue(!inf.hideToggle).onChange((v) => {
            inf.hideToggle = v ? void 0 : true;
            changed();
          });
        });
      }
      new import_obsidian13.Setting(c).setName(t("mods.showInChain")).setDesc(t("mods.showInChainDesc")).setClass("ep-mods-sub").addToggle((tg) => {
        tg.setValue(!inf.hideInChain).onChange((v) => {
          inf.hideInChain = v ? void 0 : true;
          changed();
        });
      });
    });
    new import_obsidian13.Setting(c).addButton(
      (b) => b.setButtonText(t("mods.addInfluence")).onClick(() => {
        e.mods = [...list, {}];
        changed();
        redraw();
      })
    );
    if (!isDerived) {
      new import_obsidian13.Setting(c).setName(t("mods.showBadge")).setDesc(t("mods.showBadgeDesc")).addToggle((tg) => {
        tg.setValue(!!e.showMod).onChange((v) => {
          e.showMod = v || void 0;
          changed();
        });
      });
    }
    new import_obsidian13.Setting(c).setName(t("mods.showChain")).setDesc(t("mods.showChainDesc")).addToggle((tg) => {
      tg.setValue(entry.showChain !== false).onChange((v) => {
        entry.showChain = v ? void 0 : false;
        changed();
      });
    });
    const isMulti = entry["__multi"] === true;
    if (isDerived && entry.key && !isMulti) {
      const key = entry.key;
      const on = hasNoteOverride(view, entry);
      const ov = new import_obsidian13.Setting(c).setName(t("mods.overrideNote")).setDesc(t("mods.overrideNoteDesc"));
      ov.addToggle((tg) => {
        tg.setValue(on).onChange((v) => {
          view.note.set(octx.file, key, v ? modifierTotal(view, entry) : void 0);
          redraw();
        });
      });
      ov.addText((tx) => {
        tx.setValue(on ? String(view.note.num(key, 0)) : "");
        tx.setPlaceholder(fmtMod(modifierTotal(view, entry)));
        tx.onChange((v) => {
          if (v.trim() === "") {
            view.note.set(octx.file, key, void 0);
            return;
          }
          const n = Number(v);
          if (Number.isFinite(n)) view.note.set(octx.file, key, n);
        });
      });
    } else {
      new import_obsidian13.Setting(c).setName(t("mods.override")).setDesc(t("mods.overrideDesc")).addText((tx) => {
        tx.setValue(e.rollOverride !== void 0 ? String(e.rollOverride) : "").onChange((v) => {
          const n = Number(v);
          e.rollOverride = v.trim() === "" || !Number.isFinite(n) ? void 0 : n;
          changed();
        });
      });
    }
  }
};

// src/ui/render/value-types/derived.ts
var derivedType = {
  id: "derived",
  name: (i18n) => i18n.t("type.derived"),
  clusterNeeds(ref) {
    const flags = emptyFlags();
    for (const a of addonsFor(ref)) mergeNeeds(flags, a.needs(ref));
    flags.before.push({ id: "den", cls: "ep-den-cell" });
    return flags;
  },
  render(ctx2) {
    const { view, entry } = ctx2;
    const compute = () => modifierTotal(view, entry);
    const label = entry.alias || entry.key || "";
    const slots = {
      den: (cell) => {
        const paint = () => {
          cell.empty();
          if (entry.showChain !== false) paintDenotation(cell, view, entry, ctx2.file);
          paintDice(cell, entry);
        };
        paint();
        view.registerUpdater(paint);
      }
    };
    for (const a of addonsFor(ctx2)) Object.assign(slots, a.fillSlots(ctx2, { get: compute, label }));
    const disp = () => {
      const r = modifierInfo(view, entry);
      return r.value === void 0 ? "-" : fmtMod(r.value);
    };
    const refs = view.buildCluster(ctx2.head, ctx2.flags, { display: disp(), slots });
    refs.val.addClass("ep-num-join");
    if (entry.valueSize) refs.val.setCssStyles({ fontSize: entry.valueSize + "px" });
    if (entry.valueColor) refs.val.setCssStyles({ color: entry.valueColor });
    const sync = () => {
      const info = modifierInfo(view, entry);
      if (info.value === void 0) {
        refs.val.setText("-");
        refs.val.addClass("ep-expr-error");
        refs.val.removeClass("ep-overridden");
        refs.val.setAttr("title", view.i18n.t(info.error === "cycle" ? "mods.errCycle" : "mods.errExpr"));
      } else {
        refs.val.setText(fmtMod(info.value));
        refs.val.removeClass("ep-expr-error");
        refs.val.removeAttribute("title");
        refs.val.toggleClass("ep-overridden", hasNoteOverride(view, entry));
      }
    };
    sync();
    view.bindOpen(
      refs.val,
      () => openNumberInput(refs.val, compute(), (v) => view.note.set(ctx2.file, entry.key, v), {
        min: -9999,
        max: 9999,
        float: false,
        clamp: false,
        onEmpty: () => view.note.set(ctx2.file, entry.key, void 0)
      })
    );
    view.registerUpdater(sync);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    if (hasNoteOverride(view, entry)) {
      menu.addItem(
        (i) => i.setTitle(view.i18n.t("mods.clearNoteOverride")).setIcon("eraser").onClick(
          () => view.note.set(file, key, void 0)
        )
      );
    }
  },
  renderOptions(octx) {
    var _a;
    for (const a of octx.view.registries.clusterAddons.all()) (_a = a.renderOptions) == null ? void 0 : _a.call(a, octx);
  }
};

// src/ui/render/value-types/basic.ts
var import_obsidian14 = require("obsidian");
function isChecked(ctx2, key) {
  const v = ctx2.view.note.raw[key];
  return v === true || String(v).toLowerCase() === "true";
}
var checkboxType = {
  id: "checkbox",
  name: (i18n) => i18n.t("type.checkbox"),
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const v = ctx2.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    const cb = v.createEl("input");
    cb.type = "checkbox";
    cb.addClass("ep-prof");
    cb.checked = isChecked(ctx2, key);
    cb.setAttr("aria-label", view.defaultLabelFor(entry));
    if (view.editMode) {
      cb.onchange = () => {
        sfx.toggle();
        view.note.set(file, key, cb.checked);
      };
    } else {
      cb.setAttr("title", view.i18n.t("hint.dblToggle"));
      cb.onclick = (e) => e.preventDefault();
      cb.ondblclick = () => {
        sfx.toggle();
        view.note.set(file, key, !isChecked(ctx2, key));
      };
      cb.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          sfx.toggle();
          view.note.set(file, key, !isChecked(ctx2, key));
        }
      };
    }
    view.registerUpdater(() => {
      cb.checked = isChecked(ctx2, key);
    });
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.toggle")).setIcon("check").onClick(
        () => view.note.set(file, key, !(view.note.raw[key] === true))
      )
    );
  }
};
function buildList(ctx2, holder, showAdd) {
  const { view, file, entry } = ctx2;
  const key = entry.key;
  const current = view.note.list(key);
  const list = holder.createDiv({ cls: "ep-list" });
  for (const item of current) {
    const chip = list.createSpan({ cls: "ep-chip" });
    const cv = chip.createSpan();
    view.renderLinks(cv, item);
    const x = chip.createSpan({ cls: "ep-chip-x", text: "x" });
    x.setAttr("role", "button");
    x.tabIndex = 0;
    x.setAttr("aria-label", view.i18n.t("a11y.removeItem", { item }));
    const removeItem = () => view.note.set(file, key, current.filter((i) => i !== item));
    x.onclick = removeItem;
    x.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        removeItem();
      }
    };
  }
  if (showAdd) {
    const addb = list.createEl("button", { cls: "ep-mini-btn ep-list-addbtn", text: view.i18n.t("list.add") });
    addb.onclick = () => {
      const r = addb.getBoundingClientRect();
      view.openListValuePicker(r.left, r.bottom + 2, key);
    };
  }
}
var listType = {
  id: "list",
  name: (i18n) => i18n.t("type.list"),
  render(ctx2) {
    const { view, entry } = ctx2;
    const holder = ctx2.extra.createDiv({ cls: "ep-list-holder" });
    const align = entry.listAlign || "";
    if (align === "center" || align === "right") holder.addClass("ep-align-" + align);
    if (entry.valueSize) holder.setCssStyles({ fontSize: entry.valueSize + "px" });
    if (entry.valueColor) holder.setCssStyles({ color: entry.valueColor });
    const key = entry.key;
    const checkValid = () => applyValidity(holder, entry, "list", view.note.raw[key], view.i18n);
    buildList(ctx2, holder, view.editMode);
    checkValid();
    view.registerUpdater(() => {
      holder.empty();
      buildList(ctx2, holder, view.editMode);
      checkValid();
    });
  },
  menuItems(menu, ref, pos) {
    const { view, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.addItem")).setIcon("plus").onClick(
        () => view.openListValuePicker(pos.x, pos.y, key)
      )
    );
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.listHeading") });
    new import_obsidian14.Setting(c).setName(t("options.listAlign")).setDesc(t("options.listAlignDesc")).addDropdown((d) => {
      d.addOption("left", t("align.left"));
      d.addOption("center", t("align.center"));
      d.addOption("right", t("align.right"));
      d.setValue(entry.listAlign || "left");
      d.onChange((v) => {
        entry.listAlign = v === "left" ? void 0 : v;
        changed();
      });
    });
  }
};
var colorType = {
  id: "color",
  name: (i18n) => i18n.t("type.color"),
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const v = ctx2.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueSize) v.setCssStyles({ fontSize: entry.valueSize + "px" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    const sw = v.createSpan({ cls: "ep-swatch" });
    const txt = v.createSpan({ cls: "ep-color-text" });
    const draw = () => {
      const hex = view.note.str(key);
      const ok = hexToRgb(hex);
      sw.setCssStyles({ background: ok ? hex : "transparent" });
      sw.toggleClass("ep-swatch-empty", !ok);
      txt.setText(hex || "-");
    };
    draw();
    const open = () => view.openColorPicker(view.note.str(key) || "#888888", (out) => view.note.set(file, key, out));
    view.bindOpen(sw, open, false);
    view.bindOpen(txt, open);
    view.registerUpdater(draw);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.pickColor")).setIcon("palette").onClick(
        () => view.openColorPicker(view.note.str(key) || "#888888", (out) => view.note.set(file, key, out))
      )
    );
  }
};

// src/ui/render/value-types/media.ts
var import_obsidian16 = require("obsidian");

// src/utils/embed.ts
var VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v|mkv)(\?[^ ]*)?$/i;
var AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|flac|aac|opus|3gp)(\?[^ ]*)?$/i;
var isWebUrl = (s) => /^https?:\/\//i.test(s.trim());
function youtubeEmbed(url) {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{6,})/i.exec(
    url
  );
  if (!m) return null;
  const t = /[?&](?:t|start)=(\d+)/.exec(url);
  return `https://www.youtube.com/embed/${m[1]}${t ? `?start=${t[1]}` : ""}`;
}
function vimeoEmbed(url) {
  const m = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(url);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}
function videoEmbed(src) {
  const s = src.trim();
  if (!isWebUrl(s)) return { kind: "file" };
  const yt = youtubeEmbed(s);
  if (yt) return { kind: "iframe", src: yt };
  const vm = vimeoEmbed(s);
  if (vm) return { kind: "iframe", src: vm };
  if (VIDEO_EXT.test(s)) return { kind: "file" };
  return { kind: "iframe", src: s };
}
function audioEmbed(src) {
  const s = src.trim();
  if (!isWebUrl(s)) return { kind: "file" };
  if (AUDIO_EXT.test(s)) return { kind: "file" };
  const sp = /open\.spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/.exec(s);
  if (sp) return { kind: "iframe", src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}` };
  if (/soundcloud\.com\//i.test(s))
    return { kind: "iframe", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(s)}` };
  return { kind: "file" };
}

// src/ui/modals/image-viewer.ts
var import_obsidian15 = require("obsidian");
var ImageViewerModal = class extends import_obsidian15.Modal {
  constructor(app, i18n, src) {
    super(app);
    this.i18n = i18n;
    this.src = src;
  }
  onOpen() {
    const c = this.contentEl;
    c.addClass("ep-imgview");
    this.modalEl.addClass("ep-imgview-modal");
    const wrap = c.createDiv({ cls: "ep-imgview-wrap" });
    const img = wrap.createEl("img");
    img.src = this.src;
    let scale = 1, tx = 0, ty = 0, dragging = false, lx = 0, ly = 0;
    const apply = () => {
      img.setCssStyles({ transform: `translate(${tx}px, ${ty}px) scale(${scale})` });
    };
    wrap.addEventListener("wheel", (e) => {
      e.preventDefault();
      const d = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      scale = clamp(scale * d, 0.2, 12);
      apply();
    });
    wrap.addEventListener("pointerdown", (e) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      tx += e.clientX - lx;
      ty += e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      apply();
    });
    wrap.addEventListener("pointerup", () => dragging = false);
    wrap.addEventListener("dblclick", () => {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    });
    c.createEl("div", { cls: "ep-imgview-hint", text: this.i18n.t("imageViewer.hint") });
    apply();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/ui/render/value-types/media.ts
var IMAGE_HEIGHTS = { s: 120, m: 240, l: 360 };
var embedHeight = (entry) => entry.iframeHeight && entry.iframeHeight > 0 ? entry.iframeHeight : 0;
var embedScale = (entry, def = 1) => entry.iframeScale && entry.iframeScale > 0 ? entry.iframeScale : def;
function addEmbedSizeRows(octx, scaleDefault, heightPlaceholder) {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  new import_obsidian16.Setting(c).setName(t("options.embedHeight")).addText((tx) => {
    if (heightPlaceholder !== void 0) tx.setPlaceholder(String(heightPlaceholder));
    tx.setValue(entry.iframeHeight !== void 0 ? String(entry.iframeHeight) : "").onChange((v) => {
      const n = Number(v);
      entry.iframeHeight = Number.isFinite(n) && n > 0 ? n : void 0;
      changed();
    });
  });
  new import_obsidian16.Setting(c).setName(t("options.embedScale")).addSlider((sl) => {
    var _a;
    sl.setLimits(0.25, 2, 0.05).setValue((_a = entry.iframeScale) != null ? _a : scaleDefault).onChange((v) => {
      entry.iframeScale = v;
      changed();
    });
  });
}
var imageType = {
  id: "image",
  name: (i18n) => i18n.t("type.image"),
  render(ctx2) {
    var _a, _b;
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const holder = ctx2.extra.createDiv({ cls: "ep-image" });
    const h = embedHeight(entry) || ((_b = IMAGE_HEIGHTS[(_a = entry.size) != null ? _a : ""]) != null ? _b : 0);
    const s = embedScale(entry);
    const draw = () => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      const src = view.note.str(key);
      if (src) {
        if (h) {
          holder.setCssStyles({ height: h + "px" });
          holder.addClass("ep-image-fixed");
        } else {
          holder.style.removeProperty("height");
          holder.removeClass("ep-image-fixed");
        }
        const img = holder.createEl("img", { cls: "ep-image-img" });
        if (s !== 1) {
          holder.addClass("ep-media-zoom");
          img.setCssStyles({ transform: `scale(${s})` });
        }
        img.src = view.resolveImage(src);
      } else {
        holder.style.removeProperty("height");
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("image.emptyHint"));
      }
    };
    draw();
    if (view.editMode) {
      view.bindOpen(
        holder,
        () => new TextPromptModal(
          view.app,
          view.i18n,
          view.i18n.t("image.linkPrompt"),
          view.note.str(key),
          (val) => view.note.set(file, key, val.trim() === "" ? void 0 : val.trim())
        ).open(),
        false
      );
    } else {
      holder.onclick = () => {
        const src = view.note.str(key);
        if (src) new ImageViewerModal(view.app, view.i18n, view.resolveImage(src)).open();
      };
    }
    view.registerUpdater(draw);
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.imageHeading") });
    new import_obsidian16.Setting(c).setName(t("options.maxHeight")).addDropdown((d) => {
      d.addOption("unlimited", t("size.unlimited"));
      d.addOption("s", t("size.small"));
      d.addOption("m", t("size.medium"));
      d.addOption("l", t("size.large"));
      d.setValue(entry.size || "unlimited");
      d.onChange((v) => {
        entry.size = v;
        changed();
      });
    });
    addEmbedSizeRows(octx, 1);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.editImage")).setIcon("image").onClick(
        () => new TextPromptModal(
          view.app,
          view.i18n,
          view.i18n.t("image.linkPromptShort"),
          view.note.str(key),
          (v) => view.note.set(file, key, v.trim() === "" ? void 0 : v.trim())
        ).open()
      )
    );
  }
};
function promptSource(ctx2, promptKey) {
  const { view, file, entry } = ctx2;
  const key = entry.key;
  new TextPromptModal(
    view.app,
    view.i18n,
    view.i18n.t(promptKey),
    view.note.str(key),
    (val) => view.note.set(file, key, val.trim() === "" ? void 0 : val.trim())
  ).open();
}
function bindEmbed(ctx2, holder, promptKey, draw) {
  const { view, entry } = ctx2;
  const key = entry.key;
  draw();
  if (view.editMode) {
    const edit = ctx2.extra.createDiv({ cls: "ep-iframe-edit" });
    const btn = edit.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("media.setSource") });
    btn.onclick = () => promptSource(ctx2, promptKey);
  } else {
    holder.onclick = () => {
      if (!view.note.str(key).trim()) promptSource(ctx2, promptKey);
    };
  }
  let cur = view.note.str(key);
  view.registerUpdater(() => {
    const u = view.note.str(key);
    if (u !== cur) {
      cur = u;
      draw();
    }
  });
}
function sourceMenuItem(promptKey) {
  return (menu, ref) => {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("media.setSource")).setIcon("link").onClick(
        () => new TextPromptModal(
          view.app,
          view.i18n,
          view.i18n.t(promptKey),
          view.note.str(key),
          (v) => view.note.set(file, key, v.trim() === "" ? void 0 : v.trim())
        ).open()
      )
    );
  };
}
var VIDEO_HEIGHTS = { s: 180, m: 300, l: 420 };
var audioType = {
  id: "audio",
  name: (i18n) => i18n.t("type.audio"),
  render(ctx2) {
    const { view, entry } = ctx2;
    const key = entry.key;
    const holder = ctx2.extra.createDiv({ cls: "ep-audio" });
    const draw = () => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      const src = view.note.str(key).trim();
      if (!src) {
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("audio.emptyHint"));
        return;
      }
      const em = audioEmbed(src);
      if (em.kind === "iframe") {
        const f = holder.createEl("iframe", { cls: "ep-audio-frame" });
        f.setAttr("src", em.src);
        f.setAttr("allow", "encrypted-media");
      } else {
        const a = holder.createEl("audio", { cls: "ep-audio-el" });
        a.controls = true;
        a.preload = "metadata";
        a.src = view.resolveImage(src);
      }
    };
    bindEmbed(ctx2, holder, "audio.srcPrompt", draw);
  },
  menuItems: sourceMenuItem("audio.srcPrompt")
};
var videoType = {
  id: "video",
  name: (i18n) => i18n.t("type.video"),
  render(ctx2) {
    var _a, _b;
    const { view, entry } = ctx2;
    const key = entry.key;
    const holder = ctx2.extra.createDiv({ cls: "ep-video" });
    const maxH = (_b = VIDEO_HEIGHTS[(_a = entry.size) != null ? _a : ""]) != null ? _b : 0;
    const hPx = embedHeight(entry);
    const s = embedScale(entry);
    const draw = () => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      const src = view.note.str(key).trim();
      if (!src) {
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("video.emptyHint"));
        return;
      }
      const em = videoEmbed(src);
      if (em.kind === "iframe") {
        const wrap = holder.createDiv({ cls: "ep-video-framewrap" });
        if (hPx) {
          wrap.setCssStyles({ aspectRatio: "auto", height: hPx + "px" });
        } else if (maxH) {
          wrap.setCssStyles({ maxHeight: maxH + "px" });
        }
        const f = wrap.createEl("iframe", { cls: "ep-video-frame" });
        f.setAttr("src", em.src);
        f.setAttr("allow", "fullscreen; encrypted-media; picture-in-picture");
        f.setAttr("allowfullscreen", "true");
        if (s !== 1)
          f.setAttr(
            "style",
            `width:${(100 / s).toFixed(2)}%;height:${(100 / s).toFixed(2)}%;transform:scale(${s});transform-origin:top left;`
          );
      } else {
        const v = holder.createEl("video", { cls: "ep-video-el" });
        v.controls = true;
        v.preload = "metadata";
        if (hPx) v.setCssStyles({ height: hPx + "px" });
        else if (maxH) v.setCssStyles({ maxHeight: maxH + "px" });
        if (s !== 1) {
          holder.addClass("ep-media-zoom");
          v.setCssStyles({ transform: `scale(${s})` });
        }
        v.src = view.resolveImage(src);
      }
    };
    bindEmbed(ctx2, holder, "video.srcPrompt", draw);
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.videoHeading") });
    new import_obsidian16.Setting(c).setName(t("options.maxHeight")).addDropdown((d) => {
      d.addOption("unlimited", t("size.unlimited"));
      d.addOption("s", t("size.small"));
      d.addOption("m", t("size.medium"));
      d.addOption("l", t("size.large"));
      d.setValue(entry.size || "unlimited");
      d.onChange((v) => {
        entry.size = v;
        changed();
      });
    });
    addEmbedSizeRows(octx, 1);
  },
  menuItems: sourceMenuItem("video.srcPrompt")
};
var pdfType = {
  id: "pdf",
  name: (i18n) => i18n.t("type.pdf"),
  render(ctx2) {
    const { view, entry } = ctx2;
    const key = entry.key;
    const holder = ctx2.extra.createDiv({ cls: "ep-pdf" });
    const height = embedHeight(entry) || 360;
    const s = embedScale(entry);
    const draw = () => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      holder.style.removeProperty("height");
      const src = view.note.str(key).trim();
      if (!src) {
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("pdf.emptyHint"));
        return;
      }
      holder.setCssStyles({ height: height + "px" });
      const f = holder.createEl("iframe", { cls: "ep-pdf-frame" });
      f.setAttr("src", view.resolveImage(src));
      if (s !== 1) {
        holder.addClass("ep-media-zoom");
        f.setAttr(
          "style",
          `width:${(100 / s).toFixed(2)}%;height:${(height / s).toFixed(0)}px;transform:scale(${s});transform-origin:top left;border:none;`
        );
      }
    };
    bindEmbed(ctx2, holder, "pdf.srcPrompt", draw);
  },
  renderOptions(octx) {
    const { view, container: c } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.embedHeading") });
    addEmbedSizeRows(octx, 1, 360);
  },
  menuItems: sourceMenuItem("pdf.srcPrompt")
};
var iframeType = {
  id: "iframe",
  name: (i18n) => i18n.t("type.iframe"),
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const holder = ctx2.extra.createDiv({ cls: "ep-iframe-wrap" });
    const scale = entry.iframeScale && entry.iframeScale > 0 ? entry.iframeScale : 0.25;
    const height = entry.iframeHeight && entry.iframeHeight > 0 ? entry.iframeHeight : 200;
    const draw = () => {
      holder.empty();
      const url = view.note.str(key).trim();
      if (!url) {
        holder.addClass("ep-image-empty");
        holder.style.removeProperty("height");
        holder.setText(view.i18n.t("iframe.emptyHint"));
        return;
      }
      holder.removeClass("ep-image-empty");
      holder.setCssStyles({ height: height + "px" });
      const f = holder.createEl("iframe");
      f.setAttr("src", url);
      f.setAttr(
        "style",
        `width:${100 / scale}%;height:${height / scale}px;transform:scale(${scale});transform-origin:top left;border:none;`
      );
    };
    draw();
    const promptUrl = () => new TextPromptModal(
      view.app,
      view.i18n,
      view.i18n.t("iframe.urlPrompt"),
      view.note.str(key),
      (val) => view.note.set(file, key, val.trim() === "" ? void 0 : val.trim())
    ).open();
    if (view.editMode) {
      const edit = ctx2.extra.createDiv({ cls: "ep-iframe-edit" });
      const btn = edit.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("iframe.setUrl") });
      btn.onclick = promptUrl;
    } else {
      view.bindOpen(holder, promptUrl, false);
    }
    let curUrl = view.note.str(key);
    view.registerUpdater(() => {
      const u = view.note.str(key);
      if (u !== curUrl) {
        curUrl = u;
        draw();
      }
    });
  },
  renderOptions(octx) {
    const { view, container: c } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.embedHeading") });
    addEmbedSizeRows(octx, 0.25, 200);
  }
};

// src/ui/render/value-types/richer.ts
var import_obsidian17 = require("obsidian");
var ratingType = {
  id: "rating",
  name: (i18n) => i18n.t("type.rating"),
  // Absorbed by the number type (rating display under the slider settings).
  deprecated: true,
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const max = Math.max(1, Math.min(20, Math.round(Number(entry.ratingMax) || 5)));
    const icon = entry.ratingIcon || "star";
    const v = ctx2.head.createDiv({ cls: "ep-val-right ep-rating" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    v.setAttr("role", "slider");
    v.tabIndex = 0;
    v.setAttr("aria-label", view.i18n.t("a11y.rating", { name: view.defaultLabelFor(entry) }));
    v.setAttr("aria-valuemin", "0");
    v.setAttr("aria-valuemax", String(max));
    const setRating = (n) => view.note.set(file, key, Math.max(0, Math.min(max, n)));
    const draw = () => {
      v.empty();
      const cur = Math.round(view.note.num(key, 0));
      v.setAttr("aria-valuenow", String(cur));
      v.setAttr("aria-valuetext", view.i18n.t("a11y.ratingValue", { value: cur, max }));
      for (let i = 1; i <= max; i++) {
        const pip = v.createSpan({ cls: "ep-rating-pip" + (i <= cur ? " is-on" : "") });
        (0, import_obsidian17.setIcon)(pip, icon);
        pip.setAttr("aria-hidden", "true");
        pip.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          sfx.tick();
          setRating(i === cur ? i - 1 : i);
        };
      }
    };
    draw();
    v.addEventListener("keydown", (e) => {
      const cur = Math.round(view.note.num(key, 0));
      let n = cur;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") n = cur + 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") n = cur - 1;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = max;
      else return;
      e.preventDefault();
      sfx.tick();
      setRating(n);
    });
    view.registerUpdater(draw);
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("type.rating") });
    new import_obsidian17.Setting(c).setName(t("options.ratingMax")).addSlider(
      (sl) => sl.setLimits(1, 10, 1).setValue(Math.round(Number(entry.ratingMax) || 5)).onChange((val) => {
        entry.ratingMax = val;
        changed();
      })
    );
    new import_obsidian17.Setting(c).setName(t("options.ratingIcon")).setDesc(t("options.ratingIconDesc")).addText(
      (tx) => tx.setPlaceholder("star").setValue(entry.ratingIcon || "").onChange((val) => {
        entry.ratingIcon = val.trim() || void 0;
        changed();
      })
    );
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.clearValue", { key })).setIcon("eraser").onClick(
        () => view.note.set(file, key, void 0)
      )
    );
  }
};
function linkTarget2(raw) {
  const m = /\[\[([^\]|#]+)/.exec(raw);
  return (m ? m[1] : raw).trim();
}
function promptLink(view, set, key) {
  new TextPromptModal(view.app, view.i18n, view.i18n.t("link.prompt"), view.note.str(key), (val) => {
    const s = val.trim();
    set(s === "" ? void 0 : s);
  }).open();
}
var linkType = {
  id: "link",
  name: (i18n) => i18n.t("type.link"),
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const v = ctx2.head.createDiv({ cls: "ep-val-right ep-linkval" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    const draw = () => {
      v.empty();
      v.removeClass("ep-link-unresolved");
      const raw = view.note.str(key);
      if (!raw) {
        v.createSpan({ cls: "ep-placeholder", text: "-" });
        return;
      }
      view.renderLinks(v, /\[\[.+?\]\]|\]\([^)]+\)/.test(raw) ? raw : `[[${raw}]]`);
      const dest = view.app.metadataCache.getFirstLinkpathDest(linkTarget2(raw), view.note.path || "");
      if (!dest) v.addClass("ep-link-unresolved");
    };
    draw();
    view.bindOpen(v, () => promptLink(view, (val) => view.note.set(file, key, val), key), false);
    view.registerUpdater(draw);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("link.edit")).setIcon("link").onClick(
        () => promptLink(view, (val) => view.note.set(file, key, val), key)
      )
    );
  }
};
var unitType = {
  id: "unit",
  name: (i18n) => i18n.t("type.unit"),
  // Absorbed by the number type (unit suffix + display factor options).
  deprecated: true,
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const unit = entry.unit || "";
    const factor = Number(entry.unitFactor) > 0 ? Number(entry.unitFactor) : 1;
    const cell = ctx2.head.createDiv({ cls: "ep-val-right ep-unitval" });
    if (entry.valueColor) cell.setCssStyles({ color: entry.valueColor });
    const num = cell.createSpan({ cls: "ep-num ep-editable" });
    if (unit) cell.createSpan({ cls: "ep-unit-suffix", text: " " + unit });
    const draw = () => num.setText(fmtNum(view.note.num(key, 0) * factor));
    draw();
    view.bindOpen(
      num,
      () => openNumberInput(num, view.note.num(key, 0) * factor, (disp) => view.note.set(file, key, disp / factor), {
        min: -1e12,
        max: 1e12,
        float: true,
        clamp: false,
        onEmpty: () => view.note.set(file, key, void 0)
      })
    );
    view.registerUpdater(draw);
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("type.unit") });
    new import_obsidian17.Setting(c).setName(t("options.unitLabel")).setDesc(t("options.unitLabelDesc")).addText(
      (tx) => tx.setValue(entry.unit || "").onChange((val) => {
        entry.unit = val.trim() || void 0;
        changed();
      })
    );
    new import_obsidian17.Setting(c).setName(t("options.unitFactor")).setDesc(t("options.unitFactorDesc")).addText(
      (tx) => tx.setPlaceholder("1").setValue(entry.unitFactor !== void 0 ? String(entry.unitFactor) : "").onChange((val) => {
        const n = Number(val);
        entry.unitFactor = val.trim() === "" || !Number.isFinite(n) || n <= 0 ? void 0 : n;
        changed();
      })
    );
  }
};
function relativeDays(i18n, d) {
  const days = Math.round((d.getTime() - Date.now()) / 864e5);
  if (days === 0) return i18n.t("date.today");
  return days > 0 ? i18n.t("date.inDays", { n: days }) : i18n.t("date.daysAgo", { n: -days });
}
var datetimeType = {
  id: "datetime",
  name: (i18n) => i18n.t("type.datetime"),
  // Superseded by the "date" type (custom calendars, eras, time systems,
  // serial storage). Existing datetime properties keep rendering; the type
  // is no longer offered for new properties.
  deprecated: true,
  render(ctx2) {
    const { view, file, entry } = ctx2;
    const key = entry.key;
    const cell = ctx2.head.createDiv({ cls: "ep-val-right ep-dateval" });
    if (entry.valueColor) cell.setCssStyles({ color: entry.valueColor });
    const txt = cell.createSpan({ cls: "ep-editable" });
    const rel = cell.createSpan({ cls: "ep-date-rel" });
    const draw = () => {
      const raw = view.note.str(key);
      const d = raw ? new Date(raw) : null;
      if (!raw || !d || isNaN(d.getTime())) {
        txt.setText(raw || "-");
        txt.toggleClass("ep-placeholder", !raw);
        rel.setText("");
        return;
      }
      txt.removeClass("ep-placeholder");
      txt.setText(d.toLocaleDateString());
      rel.setText(relativeDays(view.i18n, d));
    };
    draw();
    const edit = () => {
      const cur = view.note.str(key);
      const inp = cell.createEl("input", { cls: "ep-edit-input ep-date-input" });
      inp.type = "date";
      if (/^\d{4}-\d{2}-\d{2}/.test(cur)) inp.value = cur.slice(0, 10);
      txt.hide();
      rel.hide();
      inp.focus();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        const val = inp.value;
        inp.remove();
        txt.show();
        rel.show();
        view.note.set(file, key, val || void 0);
      };
      inp.onblur = finish;
      inp.onchange = finish;
    };
    view.bindOpen(txt, edit, false);
    view.registerUpdater(draw);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.clearValue", { key })).setIcon("eraser").onClick(
        () => view.note.set(file, key, void 0)
      )
    );
  }
};

// src/ui/render/value-types/date.ts
var import_obsidian18 = require("obsidian");

// src/core/calendar.ts
var DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
var STANDARD_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function standardSystem() {
  return { months: 12, daysPerMonth: 31, daysPerWeek: 7, monthNames: [...STANDARD_MONTHS] };
}
function systemOf(cfg) {
  var _a;
  const s = cfg.system;
  if (!s) return standardSystem();
  return {
    months: Math.max(1, Math.floor(s.months) || 1),
    daysPerMonth: Math.max(1, Math.floor(s.daysPerMonth) || 1),
    daysPerWeek: Math.max(1, Math.floor(s.daysPerWeek) || 1),
    monthNames: (_a = s.monthNames) != null ? _a : []
  };
}
var timeOn = (cfg) => !!cfg.time;
function timeOf(cfg) {
  var _a, _b, _c, _d;
  return {
    hoursPerDay: Math.max(1, Math.floor((_b = (_a = cfg.time) == null ? void 0 : _a.hoursPerDay) != null ? _b : 24) || 1),
    minutesPerHour: Math.max(1, Math.floor((_d = (_c = cfg.time) == null ? void 0 : _c.minutesPerHour) != null ? _d : 60) || 1)
  };
}
function monthName(sys, m) {
  var _a;
  return ((_a = sys.monthNames[m - 1]) != null ? _a : "").trim() || `Month ${m}`;
}
var TOKENS = ["YYYY", "MMMM", "MMM", "MM", "DD", "HH", "mm", "Y", "M", "D", "H", "m", "E"];
function formatPieces(format) {
  const out = [];
  let i = 0;
  const f = format || DEFAULT_DATE_FORMAT;
  while (i < f.length) {
    const tok = TOKENS.find((t) => f.startsWith(t, i));
    if (tok) {
      out.push({ token: tok });
      i += tok.length;
    } else {
      const last = out[out.length - 1];
      if ((last == null ? void 0 : last.literal) !== void 0) last.literal += f[i];
      else out.push({ literal: f[i] });
      i++;
    }
  }
  return out;
}
function formatDate(parts, cfg) {
  var _a, _b, _c, _d, _e;
  const sys = systemOf(cfg);
  const pad = (n, w) => String(Math.abs(n)).padStart(w, "0");
  let pieces = formatPieces(cfg.format);
  if (!parts.era) {
    pieces = pieces.filter((p, i) => {
      var _a2;
      return !(p.token === "E" || ((_a2 = pieces[i + 1]) == null ? void 0 : _a2.token) === "E");
    });
  }
  let out = "";
  for (const p of pieces) {
    if (p.literal !== void 0) {
      out += p.literal;
      continue;
    }
    switch (p.token) {
      case "YYYY":
        out += pad(parts.year, 4);
        break;
      case "Y":
        out += String(parts.year);
        break;
      case "MM":
        out += pad(parts.month, 2);
        break;
      case "M":
        out += String(parts.month);
        break;
      case "MMMM":
        out += monthName(sys, parts.month);
        break;
      case "MMM":
        out += monthName(sys, parts.month).slice(0, 3);
        break;
      case "DD":
        out += pad(parts.day, 2);
        break;
      case "D":
        out += String(parts.day);
        break;
      case "HH":
        out += pad((_a = parts.hour) != null ? _a : 0, 2);
        break;
      case "H":
        out += String((_b = parts.hour) != null ? _b : 0);
        break;
      case "mm":
        out += pad((_c = parts.minute) != null ? _c : 0, 2);
        break;
      case "m":
        out += String((_d = parts.minute) != null ? _d : 0);
        break;
      case "E":
        out += (_e = parts.era) != null ? _e : "";
        break;
    }
  }
  return out.trim();
}
var esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function parseDate(text, cfg) {
  var _a;
  const sys = systemOf(cfg);
  const pieces = formatPieces(cfg.format);
  let re = "^\\s*";
  const fields = [];
  for (let pi = 0; pi < pieces.length; pi++) {
    const p = pieces[pi];
    if (p.literal !== void 0) {
      const lit = /^\s+$/.test(p.literal) ? "\\s+" : esc(p.literal);
      if (((_a = pieces[pi + 1]) == null ? void 0 : _a.token) === "E") {
        re += "(?:" + lit + "\\s*([^\\s\\d][^\\n]*?))?";
        fields.push("E");
        pi++;
        continue;
      }
      re += lit;
      continue;
    }
    const tok = p.token;
    fields.push(tok);
    if (tok === "MMMM" || tok === "MMM") {
      const names = [];
      for (let m2 = 1; m2 <= sys.months; m2++) {
        const full = monthName(sys, m2);
        names.push(esc(full));
        if (tok === "MMM") names.push(esc(full.slice(0, 3)));
      }
      names.sort((a, b) => b.length - a.length);
      re += "(" + names.join("|") + ")";
    } else if (tok === "E") {
      re += "\\s*([^\\s\\d][^\\n]*?)?";
    } else {
      re += "(\\d+)";
    }
  }
  re += "\\s*$";
  const m = new RegExp(re, "i").exec(text);
  if (!m) return null;
  const parts = { year: 1, month: 1, day: 1 };
  let sawYear = false, sawMonth = false, sawDay = false;
  for (let i = 0; i < fields.length; i++) {
    const raw = m[i + 1];
    const tok = fields[i];
    if (tok === "E") {
      const era = (raw != null ? raw : "").trim();
      if (era) parts.era = era;
      continue;
    }
    if (raw === void 0) return null;
    if (tok === "MMMM" || tok === "MMM") {
      const low = raw.toLowerCase();
      let found = 0;
      for (let mm = 1; mm <= sys.months; mm++) {
        const name = monthName(sys, mm);
        if (name.toLowerCase() === low || tok === "MMM" && name.slice(0, 3).toLowerCase() === low) {
          found = mm;
          break;
        }
      }
      if (!found) return null;
      parts.month = found;
      sawMonth = true;
    } else {
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n)) return null;
      if (tok === "YYYY" || tok === "Y") {
        parts.year = n;
        sawYear = true;
      } else if (tok === "MM" || tok === "M") {
        parts.month = n;
        sawMonth = true;
      } else if (tok === "HH" || tok === "H") parts.hour = n;
      else if (tok === "mm" || tok === "m") parts.minute = n;
      else {
        parts.day = n;
        sawDay = true;
      }
    }
  }
  if (sawMonth && (parts.month < 1 || parts.month > sys.months)) return null;
  if (sawDay && (parts.day < 1 || parts.day > sys.daysPerMonth)) return null;
  const tm = timeOf(cfg);
  if (parts.hour !== void 0 && (parts.hour < 0 || parts.hour >= tm.hoursPerDay)) return null;
  if (parts.minute !== void 0 && (parts.minute < 0 || parts.minute >= tm.minutesPerHour)) return null;
  if (!sawYear && !sawMonth && !sawDay) return null;
  return parts;
}
var ERA_SPAN_DAY = 2e10;
var ERA_SPAN_MIN = 2e12;
var eraSpanOf = (cfg) => timeOn(cfg) ? ERA_SPAN_MIN : ERA_SPAN_DAY;
function encodeSerial(parts, cfg) {
  var _a, _b, _c;
  const sys = systemOf(cfg);
  const eras = (_a = cfg.eras) != null ? _a : [];
  let eraIdx = 0;
  if (parts.era) {
    const i = eras.findIndex((e) => e.toLowerCase() === parts.era.toLowerCase());
    eraIdx = i >= 0 ? i + 1 : eras.length + 1;
  }
  let d = (parts.year * sys.months + (parts.month - 1)) * sys.daysPerMonth + (parts.day - 1);
  if (timeOn(cfg)) {
    const tm = timeOf(cfg);
    d = d * tm.hoursPerDay * tm.minutesPerHour + ((_b = parts.hour) != null ? _b : 0) * tm.minutesPerHour + ((_c = parts.minute) != null ? _c : 0);
  }
  const span = eraSpanOf(cfg);
  const half = span / 2;
  const idx = Math.max(-half + 1, Math.min(half - 1, d));
  return eraIdx * span + idx;
}
function decodeSerial(serial, cfg) {
  var _a;
  if (!Number.isFinite(serial)) return null;
  const sys = systemOf(cfg);
  const eras = (_a = cfg.eras) != null ? _a : [];
  const span = eraSpanOf(cfg);
  const eraIdx = Math.round(serial / span);
  let d = Math.round(serial - eraIdx * span);
  let hour;
  let minute;
  if (timeOn(cfg)) {
    const tm = timeOf(cfg);
    const perDay = tm.hoursPerDay * tm.minutesPerHour;
    const dayIdx = Math.floor(d / perDay);
    const t = d - dayIdx * perDay;
    hour = Math.floor(t / tm.minutesPerHour);
    minute = t % tm.minutesPerHour;
    d = dayIdx;
  }
  const perYear = sys.months * sys.daysPerMonth;
  const year = Math.floor(d / perYear);
  const rem = d - year * perYear;
  const month = Math.floor(rem / sys.daysPerMonth) + 1;
  const day = rem % sys.daysPerMonth + 1;
  const parts = { year, month, day };
  if (hour !== void 0) parts.hour = hour;
  if (minute !== void 0) parts.minute = minute;
  const era = eraIdx > 0 ? eras[eraIdx - 1] : void 0;
  if (era) parts.era = era;
  return parts;
}
function translateSerial(serial, before, after) {
  var _a, _b, _c;
  const p = decodeSerial(serial, before);
  if (!p) return serial;
  const sys = systemOf(after);
  const q = {
    year: p.year,
    month: Math.min(Math.max(1, p.month), sys.months),
    day: Math.min(Math.max(1, p.day), sys.daysPerMonth)
  };
  if (timeOn(after)) {
    const tm = timeOf(after);
    q.hour = Math.min(Math.max(0, (_a = p.hour) != null ? _a : 0), tm.hoursPerDay - 1);
    q.minute = Math.min(Math.max(0, (_b = p.minute) != null ? _b : 0), tm.minutesPerHour - 1);
  }
  if (p.era && ((_c = after.eras) != null ? _c : []).some((e) => e.toLowerCase() === p.era.toLowerCase())) q.era = p.era;
  return encodeSerial(q, after);
}
function tokenOrder(cfg) {
  var _a;
  const out = [];
  for (const p of formatPieces(cfg.format)) {
    const k = (_a = p.token) == null ? void 0 : _a[0];
    if ((k === "Y" || k === "M" || k === "D") && !out.includes(k)) out.push(k);
  }
  for (const k of ["Y", "M", "D"]) if (!out.includes(k)) out.push(k);
  return out;
}
function checked(parts, sys) {
  if (parts.month < 1 || parts.month > sys.months) return null;
  if (parts.day < 1 || parts.day > sys.daysPerMonth) return null;
  return parts;
}
function parseDateFlexible(text, cfg) {
  var _a;
  const strict = parseDate(text, cfg);
  if (strict) return strict;
  const sys = systemOf(cfg);
  let s = text.trim();
  if (!s) return null;
  let era;
  for (const e of [...(_a = cfg.eras) != null ? _a : []].sort((a, b) => b.length - a.length)) {
    const re = new RegExp("[\\s,.-]+" + esc(e) + "\\s*$", "i");
    if (re.test(s)) {
      era = e;
      s = s.replace(re, "");
      break;
    }
  }
  let hour;
  let minute;
  const tmatch = /(\d{1,2}):(\d{1,2})/.exec(s);
  if (tmatch) {
    const tm = timeOf(cfg);
    const h = parseInt(tmatch[1], 10);
    const mi = parseInt(tmatch[2], 10);
    if (h < 0 || h >= tm.hoursPerDay || mi < 0 || mi >= tm.minutesPerHour) return null;
    hour = h;
    minute = mi;
    s = (s.slice(0, tmatch.index) + " " + s.slice(tmatch.index + tmatch[0].length)).trim();
    if (!s) return null;
  }
  const tokens = s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const nums = [];
  const words = [];
  for (const t of tokens) {
    if (/^\d+$/.test(t)) nums.push(parseInt(t, 10));
    else words.push(t);
  }
  const order = tokenOrder(cfg);
  const withEra = (p) => {
    if (!p) return p;
    if (era) p.era = era;
    if (hour !== void 0) {
      p.hour = hour;
      p.minute = minute;
    }
    return p;
  };
  if (words.length === 1) {
    const w = words[0].toLowerCase();
    const hits = [];
    for (let m = 1; m <= sys.months; m++) {
      const n = monthName(sys, m).toLowerCase();
      if (n === w || n.slice(0, 3) === w || w.length >= 3 && n.startsWith(w)) {
        if (!hits.includes(m)) hits.push(m);
      }
    }
    if (hits.length !== 1) return null;
    const month = hits[0];
    if (nums.length === 2) {
      const [a, b] = nums;
      const fitsA = a >= 1 && a <= sys.daysPerMonth;
      const fitsB = b >= 1 && b <= sys.daysPerMonth;
      if (fitsA && fitsB) {
        const dayFirst = order.indexOf("D") < order.indexOf("Y");
        return withEra(checked({ year: dayFirst ? b : a, month, day: dayFirst ? a : b }, sys));
      }
      if (fitsA) return withEra(checked({ year: b, month, day: a }, sys));
      if (fitsB) return withEra(checked({ year: a, month, day: b }, sys));
      return null;
    }
    if (nums.length === 1 && nums[0] > sys.daysPerMonth) {
      return withEra(checked({ year: nums[0], month, day: 1 }, sys));
    }
    return null;
  }
  if (words.length > 1) return null;
  if (nums.length === 3) {
    const tryOrder = (o) => {
      const p = { year: 1, month: 1, day: 1 };
      o.forEach((k, i) => {
        if (k === "Y") p.year = nums[i];
        else if (k === "M") p.month = nums[i];
        else p.day = nums[i];
      });
      return checked(p, sys);
    };
    const orders = [order, ["Y", "M", "D"], ["D", "M", "Y"], ["M", "D", "Y"]];
    for (const o of orders) {
      const p = tryOrder(o);
      if (p) return withEra(p);
    }
  }
  return null;
}

// src/ui/render/value-types/date.ts
function cfgFor(view, key) {
  var _a, _b, _c, _d;
  const store = (_b = (_a = view.settings).dateProps) != null ? _b : _a.dateProps = {};
  return (_d = store[_c = key.toLowerCase()]) != null ? _d : store[_c] = { format: DEFAULT_DATE_FORMAT };
}
function saveCfg(view, mutate) {
  mutate();
  view.saveLayout();
}
var snapshotCfg = (cfg) => JSON.parse(JSON.stringify(cfg));
function rawToParts(raw, cfg) {
  if (typeof raw === "number") return decodeSerial(raw, cfg);
  if (typeof raw === "string" && raw.trim()) return parseDateFlexible(raw.trim(), cfg);
  return null;
}
function rawSerial(raw, cfg) {
  const p = rawToParts(raw, cfg);
  return p ? encodeSerial(p, cfg) : null;
}
async function migrateDateSerials(view, key, before, after) {
  let changed = 0;
  for (const f of view.props.filesWithKey(key)) {
    try {
      await view.app.fileManager.processFrontMatter(f, (fm) => {
        const realKey = Object.keys(fm).find((k) => k.toLowerCase() === key.toLowerCase());
        if (!realKey) return;
        const cur = fm[realKey];
        let next = null;
        if (typeof cur === "number") next = translateSerial(cur, before, after);
        else if (typeof cur === "string" && cur.trim()) {
          const p = parseDateFlexible(cur.trim(), before);
          if (p) next = translateSerial(encodeSerial(p, before), before, after);
        }
        if (next !== null && next !== cur) {
          fm[realKey] = next;
          changed++;
        }
      });
    } catch (e) {
    }
  }
  if (changed) new import_obsidian18.Notice(view.i18n.t("date.migrated", { count: String(changed) }));
}
function plotRange(view, key, cfg, e, ownPath, ownSerial) {
  const fromStr = (s) => {
    const p = s ? parseDateFlexible(s, cfg) : null;
    return p ? encodeSerial(p, cfg) : null;
  };
  let min = fromStr(e.dateMin);
  let max = fromStr(e.dateMax);
  if (min === null || max === null) {
    let lo = ownSerial != null ? ownSerial : Infinity;
    let hi = ownSerial != null ? ownSerial : -Infinity;
    for (const { file, value } of view.props.entriesFor(key)) {
      if (file.path === ownPath) continue;
      const s = rawSerial(value, cfg);
      if (s === null) continue;
      if (s < lo) lo = s;
      if (s > hi) hi = s;
    }
    if (lo <= hi) {
      if (lo === hi) {
        const sys = systemOf(cfg);
        const pad = sys.months * sys.daysPerMonth;
        lo -= pad;
        hi += pad;
      }
      min != null ? min : min = lo;
      max != null ? max : max = hi;
    }
  }
  if (min === null || max === null) return null;
  if (max <= min) max = min + 1;
  return { min, max };
}
function render2(ctx2) {
  const { view, file, entry } = ctx2;
  const key = entry.key;
  const e = ext(entry);
  const cfg = cfgFor(view, key);
  const t = view.i18n.t.bind(view.i18n);
  const cell = ctx2.head.createDiv({ cls: "ep-val-right ep-dateval" });
  if (entry.valueColor) cell.setCssStyles({ color: entry.valueColor });
  if (entry.valueSize) cell.setCssStyles({ fontSize: entry.valueSize + "px" });
  const txt = cell.createSpan({ cls: "ep-editable" });
  const eraChip = cell.createSpan({ cls: "ep-era-chip" });
  const hasEraToken = /(^|[^A-Za-z])E([^A-Za-z]|$)/.test(" " + cfg.format + " ");
  const parsed = () => rawToParts(view.note.raw[key], cfg);
  const draw = () => {
    var _a, _b;
    const raw = view.note.raw[key];
    const empty = raw === void 0 || raw === null || raw === "";
    const p = empty ? null : rawToParts(raw, cfg);
    txt.setText(empty ? cfg.format : p ? formatDate(p, cfg) : String(raw));
    txt.toggleClass("ep-placeholder", empty);
    txt.toggleClass("ep-invalid", !empty && !p);
    txt.setAttr("title", !empty && !p ? t("date.invalid", { format: cfg.format }) : "");
    const era = (_a = p == null ? void 0 : p.era) != null ? _a : "";
    const pool = (_b = cfg.eras) != null ? _b : [];
    eraChip.setText(era || (pool.length ? pool[pool.length - 1] + "?" : ""));
    eraChip.toggleClass("ep-era-unset", !era);
    const show = hasEraToken && !!p && (pool.length > 0 || !!era);
    eraChip.toggleClass("ep-hidden", !show);
  };
  eraChip.onclick = (ev) => {
    var _a;
    const p = parsed();
    if (!p) return;
    const menu = new import_obsidian18.Menu();
    const setEra = (era) => {
      view.note.set(file, key, encodeSerial({ ...p, era }, cfg));
    };
    for (const era of (_a = cfg.eras) != null ? _a : []) {
      menu.addItem(
        (i) => i.setTitle(era).setChecked(!!p.era && era.toLowerCase() === p.era.toLowerCase()).onClick(() => setEra(era))
      );
    }
    if (p.era) menu.addItem((i) => i.setTitle(t("date.eraNone")).onClick(() => setEra(void 0)));
    menu.addItem(
      (i) => i.setTitle(t("date.eraCustom")).onClick(() => {
        new TextPromptModal(view.app, view.i18n, t("date.eraCustomPrompt"), "", (v) => {
          var _a2;
          const era = v.trim();
          if (!era) return;
          const pool = (_a2 = cfg.eras) != null ? _a2 : cfg.eras = [];
          if (!pool.some((x) => x.toLowerCase() === era.toLowerCase()))
            saveCfg(view, () => pool.push(era));
          setEra(era);
        }).open();
      })
    );
    menu.showAtMouseEvent(ev);
  };
  txt.onclick = () => {
    var _a;
    if (cell.querySelector("input")) return;
    const inp = cell.createEl("input", { cls: "ep-edit-input ep-date-input" });
    inp.type = "text";
    inp.placeholder = cfg.format;
    const p0 = parsed();
    inp.value = p0 ? formatDate(p0, cfg) : String((_a = view.note.raw[key]) != null ? _a : "");
    txt.hide();
    eraChip.hide();
    inp.focus();
    inp.select();
    let done = false;
    const finish = (commit2) => {
      var _a2;
      if (done) return;
      done = true;
      const v = inp.value.trim();
      inp.remove();
      txt.show();
      draw();
      if (!commit2) return;
      if (!v) {
        view.note.set(file, key, void 0);
        return;
      }
      const p = parseDateFlexible(v, cfg);
      if (p == null ? void 0 : p.era) {
        const pool = (_a2 = cfg.eras) != null ? _a2 : cfg.eras = [];
        if (!pool.some((x) => x.toLowerCase() === p.era.toLowerCase()))
          saveCfg(view, () => pool.push(p.era));
      }
      view.note.set(file, key, p ? encodeSerial(p, cfg) : v);
    };
    inp.onblur = () => finish(true);
    inp.onkeydown = (ke) => {
      if (ke.key === "Enter") finish(true);
      else if (ke.key === "Escape") finish(false);
    };
  };
  let syncPlot = null;
  if (e.slider) {
    const plot = ctx2.extra.createDiv({ cls: "ep-dateplot" });
    plot.createDiv({ cls: "ep-dateplot-track" });
    const marker = plot.createDiv({ cls: "ep-dateplot-marker" });
    const ticksEl = plot.createDiv({ cls: "ep-dateplot-ticks" });
    let pop = null;
    let popTimer = 0;
    const closePop = () => {
      window.clearTimeout(popTimer);
      pop == null ? void 0 : pop.remove();
      pop = null;
    };
    const openPop = (tick, when, files) => {
      closePop();
      pop = activeDocument.body.createDiv({ cls: "ep-popup ep-dateplot-pop" });
      pop.createDiv({ cls: "ep-dateplot-pop-when", text: when });
      for (const f of files) {
        const row = pop.createDiv({ cls: "ep-pop-row", text: f.basename });
        row.onclick = (me) => {
          void view.app.workspace.openLinkText(f.path, "", me.ctrlKey || me.metaKey);
          closePop();
        };
      }
      const r = tick.getBoundingClientRect();
      const pr = pop.getBoundingClientRect();
      const left = Math.max(4, Math.min(r.left + r.width / 2 - pr.width / 2, window.innerWidth - pr.width - 4));
      const top = r.top - pr.height - 4 < 4 ? r.bottom + 4 : r.top - pr.height - 4;
      pop.setCssStyles({ left: left + "px", top: top + "px" });
      pop.onmouseenter = () => window.clearTimeout(popTimer);
      pop.onmouseleave = () => {
        popTimer = window.setTimeout(closePop, 250);
      };
    };
    syncPlot = () => {
      var _a, _b;
      ticksEl.empty();
      closePop();
      const ownPath = (_a = view.note.path) != null ? _a : "";
      const ownParts = parsed();
      const range = plotRange(view, key, cfg, e, ownPath, ownParts ? encodeSerial(ownParts, cfg) : null);
      plot.toggleClass("ep-hidden", !range);
      if (!range) return;
      const span = range.max - range.min;
      const pct = (s) => Math.max(0, Math.min(1, (s - range.min) / span)) * 100;
      const groups = /* @__PURE__ */ new Map();
      for (const { file: file2, value } of view.props.entriesFor(key)) {
        if (file2.path === ownPath) continue;
        const p2 = rawToParts(value, cfg);
        if (!p2) continue;
        const s = encodeSerial(p2, cfg);
        const g = (_b = groups.get(s)) != null ? _b : { parts: p2, files: [] };
        g.files.push({ path: file2.path, basename: file2.basename });
        groups.set(s, g);
      }
      for (const [s, g] of groups) {
        const tick = ticksEl.createDiv({ cls: "ep-dateplot-tick" });
        if (g.files.length > 1) tick.addClass("ep-dateplot-tick-multi");
        tick.setCssStyles({ left: pct(s) + "%" });
        const when = formatDate(g.parts, cfg);
        tick.setAttr("aria-label", when);
        tick.onmouseenter = () => {
          window.clearTimeout(popTimer);
          popTimer = window.setTimeout(() => openPop(tick, when, g.files), 120);
        };
        tick.onmouseleave = () => {
          window.clearTimeout(popTimer);
          popTimer = window.setTimeout(closePop, 250);
        };
      }
      const p = parsed();
      marker.toggleClass("ep-hidden", !p);
      if (p) {
        marker.setCssStyles({ left: pct(encodeSerial(p, cfg)) + "%" });
        marker.setAttr("title", formatDate(p, cfg));
      }
    };
    syncPlot();
  }
  draw();
  view.registerUpdater(() => {
    draw();
    syncPlot == null ? void 0 : syncPlot();
  });
}
function renderOptions2(octx) {
  const { view, entry, container: c, changed } = octx;
  const key = entry.key;
  const e = ext(entry);
  const cfg = cfgFor(view, key);
  const t = view.i18n.t.bind(view.i18n);
  c.createEl("h4", { text: t("options.dateHeading") });
  new import_obsidian18.Setting(c).setName(t("options.dateFormat")).setDesc(t("options.dateFormatDesc")).addText((tx) => {
    tx.setValue(cfg.format).onChange((v) => {
      saveCfg(view, () => cfg.format = v.trim() || DEFAULT_DATE_FORMAT);
      changed();
    });
  });
  new import_obsidian18.Setting(c).setName(t("options.datePlot")).setDesc(t("options.datePlotDesc")).addToggle((tg) => {
    tg.setValue(!!e.slider).onChange((v) => {
      e.slider = v || void 0;
      changed();
    });
  });
  new import_obsidian18.Setting(c).setName(t("options.minimum")).setDesc(t("options.dateRangeAuto")).addText((tx) => {
    var _a;
    tx.setPlaceholder(cfg.format);
    tx.setValue((_a = e.dateMin) != null ? _a : "").onChange((v) => {
      e.dateMin = v.trim() || void 0;
      changed();
    });
  });
  new import_obsidian18.Setting(c).setName(t("options.maximum")).setDesc(t("options.dateRangeAuto")).addText((tx) => {
    var _a;
    tx.setPlaceholder(cfg.format);
    tx.setValue((_a = e.dateMax) != null ? _a : "").onChange((v) => {
      e.dateMax = v.trim() || void 0;
      changed();
    });
  });
  new import_obsidian18.Setting(c).setName(t("options.customCalendar")).setDesc(t("options.customCalendarDesc")).addToggle((tg) => {
    tg.setValue(!!cfg.system).onChange((v) => {
      const before = snapshotCfg(cfg);
      saveCfg(view, () => {
        cfg.system = v ? { months: 12, daysPerMonth: 30, daysPerWeek: 7, monthNames: [] } : void 0;
      });
      void migrateDateSerials(view, key, before, cfg);
      changed();
      octx.redraw();
    });
  });
  const numRow = (name, get, set, o) => {
    new import_obsidian18.Setting(c).setName(name).addText((tx) => {
      tx.inputEl.type = "number";
      tx.setValue(String(get()));
      tx.inputEl.addEventListener("change", () => {
        var _a;
        const n = Math.max(1, Math.floor(Number(tx.getValue())));
        if (!Number.isFinite(n) || n === get()) return;
        const before = snapshotCfg(cfg);
        saveCfg(view, () => set(n));
        if (o.migrates) void migrateDateSerials(view, key, before, cfg);
        changed();
        (_a = o.onDone) == null ? void 0 : _a.call(o);
      });
    });
  };
  if (cfg.system) {
    const sys = cfg.system;
    let renderMonthNames = () => void 0;
    numRow(t("options.months"), () => sys.months, (n) => sys.months = n, { migrates: true, onDone: () => renderMonthNames() });
    numRow(t("options.daysPerMonth"), () => sys.daysPerMonth, (n) => sys.daysPerMonth = n, { migrates: true });
    numRow(t("options.daysPerWeek"), () => sys.daysPerWeek, (n) => sys.daysPerWeek = n, {});
    const box = c.createDiv({ cls: "ep-monthnames" });
    renderMonthNames = () => {
      box.empty();
      for (let m = 1; m <= Math.min(sys.months, 60); m++) {
        const idx = m - 1;
        new import_obsidian18.Setting(box).setName(t("options.monthName", { n: String(m) })).addText((tx) => {
          var _a;
          tx.setPlaceholder(monthName(systemOf(cfg), m));
          tx.setValue((_a = sys.monthNames[idx]) != null ? _a : "").onChange((v) => {
            saveCfg(view, () => {
              while (sys.monthNames.length < m) sys.monthNames.push("");
              sys.monthNames[idx] = v.trim();
            });
            changed();
          });
        });
      }
    };
    renderMonthNames();
  }
  new import_obsidian18.Setting(c).setName(t("options.time")).setDesc(t("options.timeDesc")).addToggle((tg) => {
    tg.setValue(!!cfg.time).onChange((v) => {
      const before = snapshotCfg(cfg);
      saveCfg(view, () => {
        cfg.time = v ? { hoursPerDay: 24, minutesPerHour: 60 } : void 0;
      });
      void migrateDateSerials(view, key, before, cfg);
      changed();
      octx.redraw();
    });
  });
  if (cfg.time) {
    const tm = cfg.time;
    numRow(t("options.hoursPerDay"), () => tm.hoursPerDay, (n) => tm.hoursPerDay = n, { migrates: true });
    numRow(t("options.minutesPerHour"), () => tm.minutesPerHour, (n) => tm.minutesPerHour = n, { migrates: true });
  }
  new import_obsidian18.Setting(c).setName(t("options.eraPool")).setDesc(t("options.eraPoolDesc")).setHeading();
  const eraBox = c.createDiv({ cls: "ep-erapool" });
  const renderEras = () => {
    var _a;
    eraBox.empty();
    for (const era of (_a = cfg.eras) != null ? _a : []) {
      new import_obsidian18.Setting(eraBox).setName(era).addExtraButton((b) => {
        b.setIcon("x").setTooltip(t("options.eraRemove")).onClick(() => {
          const before = snapshotCfg(cfg);
          saveCfg(view, () => {
            var _a2;
            return cfg.eras = ((_a2 = cfg.eras) != null ? _a2 : []).filter((x) => x !== era);
          });
          void migrateDateSerials(view, key, before, cfg);
          changed();
          renderEras();
        });
      });
    }
    new import_obsidian18.Setting(eraBox).setName(t("options.eraAdd")).addText((tx) => {
      tx.setPlaceholder("CE");
      tx.inputEl.onkeydown = (ke) => {
        var _a2;
        if (ke.key !== "Enter") return;
        const v = tx.getValue().trim();
        if (!v) return;
        const pool = (_a2 = cfg.eras) != null ? _a2 : cfg.eras = [];
        if (!pool.some((x) => x.toLowerCase() === v.toLowerCase())) {
          saveCfg(view, () => pool.push(v));
          changed();
        }
        renderEras();
      };
    });
  };
  renderEras();
}
function menuItems2(menu, ref) {
  const { view, file, entry } = ref;
  const key = entry.key;
  const cfg = cfgFor(view, key);
  menu.addItem(
    (i) => i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(() => {
      const p0 = rawToParts(view.note.raw[key], cfg);
      new TextPromptModal(
        view.app,
        view.i18n,
        view.i18n.t("prompt.editValue", { name: entry.alias || key }),
        p0 ? formatDate(p0, cfg) : view.note.str(key),
        (v) => {
          const p = parseDateFlexible(v.trim(), cfg);
          view.note.set(file, key, p ? encodeSerial(p, cfg) : v.trim() || void 0);
        }
      ).open();
    })
  );
}
var dateType = {
  id: "date",
  name: (i18n) => i18n.t("type.date"),
  render: render2,
  renderOptions: renderOptions2,
  menuItems: menuItems2
};

// src/ui/render/entry-kinds/core-kinds.ts
var import_obsidian19 = require("obsidian");

// src/core/layout-ops.ts
function setSharedDataType(settings, key, typeId) {
  var _a, _b, _c, _d, _e;
  const kl = key.trim().toLowerCase();
  if (!kl || !typeId) return;
  if (!settings.propTypes) settings.propTypes = {};
  settings.propTypes[kl] = typeId;
  for (const lk of Object.keys((_a = settings.layouts) != null ? _a : {}))
    for (const s of (_b = settings.layouts[lk].sections) != null ? _b : [])
      for (const e of (_c = s.entries) != null ? _c : [])
        if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl) e.dataType = typeId;
  for (const k of Object.keys((_d = settings.inlineEntries) != null ? _d : {})) {
    const e = (_e = settings.inlineEntries) == null ? void 0 : _e[k];
    if (e && e.kind === "prop" && e.key && e.key.toLowerCase() === kl) e.dataType = typeId;
  }
}
function blankEntry() {
  return { id: genId(), kind: "blank" };
}
function moveSectionBy(layout, id, delta) {
  const secs = layout.sections;
  const i = secs.findIndex((s2) => s2.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= secs.length) return false;
  const [s] = secs.splice(i, 1);
  secs.splice(j, 0, s);
  return true;
}
function moveSectionTo(layout, dragId, targetId, after) {
  if (dragId === targetId) return false;
  const secs = layout.sections;
  const from = secs.findIndex((s2) => s2.id === dragId);
  if (from < 0) return false;
  const [s] = secs.splice(from, 1);
  let idx = secs.findIndex((x) => x.id === targetId);
  if (idx < 0) idx = secs.length;
  if (after) idx += 1;
  secs.splice(idx, 0, s);
  return true;
}
function swapEntries(layout, aId, bId) {
  let aS, bS, ai = -1, bi = -1;
  for (const sec of layout.sections) {
    const i = sec.entries.findIndex((e) => e.id === aId);
    if (i >= 0) {
      aS = sec;
      ai = i;
    }
    const j = sec.entries.findIndex((e) => e.id === bId);
    if (j >= 0) {
      bS = sec;
      bi = j;
    }
  }
  if (!aS || !bS || ai < 0 || bi < 0) return false;
  const t = aS.entries[ai];
  aS.entries[ai] = bS.entries[bi];
  bS.entries[bi] = t;
  return true;
}
function moveLeavingBlank(layout, entryId, fromId) {
  const sec = layout.sections.find((s) => s.id === fromId);
  if (!sec) return false;
  const i = sec.entries.findIndex((e) => e.id === entryId);
  if (i < 0) return false;
  const [en] = sec.entries.splice(i, 1);
  sec.entries.splice(i, 0, blankEntry());
  sec.entries.push(en);
  return true;
}
function reorderByDomOrder(layout, entryId, fromId, toId, order) {
  const from = layout.sections.find((s) => s.id === fromId);
  const to = layout.sections.find((s) => s.id === toId);
  if (!from || !to) return false;
  const i = from.entries.findIndex((e) => e.id === entryId);
  if (i < 0) return false;
  const [en] = from.entries.splice(i, 1);
  const map = new Map(to.entries.map((e) => [e.id, e]));
  map.set(en.id, en);
  const next = [];
  for (const id of order) {
    const e = map.get(id);
    if (e) {
      next.push(e);
      map.delete(id);
    }
  }
  for (const e of map.values()) next.push(e);
  to.entries = next;
  return true;
}
function ensurePropEntries(layout, section, keys, defaults = {}) {
  const have = /* @__PURE__ */ new Set();
  for (const s of layout.sections)
    for (const e of s.entries) if (e.kind === "prop" && e.key) have.add(e.key.toLowerCase());
  const toAdd = [];
  for (const k of keys) {
    if (!k || have.has(k.toLowerCase())) continue;
    have.add(k.toLowerCase());
    toAdd.push({ id: genId(), kind: "prop", key: k, dataType: "number", ...defaults });
  }
  section.entries.unshift(...toAdd);
  return toAdd.length;
}
function gridRows(section, cols) {
  const rows = [];
  const es = section.entries;
  for (let i = 0; i < es.length; i += cols) {
    const row = es.slice(i, i + cols);
    while (row.length < cols) row.push(blankEntry());
    rows.push(row);
  }
  return rows;
}
function addColumnAt(section, idx, isGrid) {
  if (!isGrid) {
    section.columns = (section.columns || 1) + 1;
    return;
  }
  const cols = section.columns || 1;
  const rows = gridRows(section, cols);
  const ci = Math.max(0, Math.min(idx, cols));
  for (const row of rows) row.splice(ci, 0, blankEntry());
  section.columns = cols + 1;
  section.entries = rows.flat();
}
function removeColumnAt(section, colIdx, isGrid) {
  if (!isGrid) {
    section.columns = Math.max(1, (section.columns || 1) - 1);
    return;
  }
  const cols = section.columns || 1;
  if (cols <= 1) return;
  const rows = gridRows(section, cols);
  for (const row of rows) if (colIdx < row.length) row.splice(colIdx, 1);
  section.columns = cols - 1;
  section.entries = rows.flat();
}
function addRowAt(section, idx) {
  const cols = section.columns || 1;
  const rows = gridRows(section, cols);
  const ri = Math.max(0, Math.min(idx, rows.length));
  rows.splice(ri, 0, Array.from({ length: cols }, () => blankEntry()));
  if (section.rows && section.rows > 0) section.rows = rows.length;
  section.entries = rows.flat();
}
function removeRowAt(section, rowIdx) {
  const cols = section.columns || 1;
  const rows = gridRows(section, cols);
  if (rowIdx < 0 || rowIdx >= rows.length) return;
  rows.splice(rowIdx, 1);
  if (section.rows && section.rows > 0) section.rows = rows.length;
  section.entries = rows.flat();
}

// src/ui/render/entry-kinds/core-kinds.ts
var propKind = {
  id: "prop",
  defaultLabel: (_i18n, entry) => {
    var _a;
    return (_a = entry.key) != null ? _a : "";
  },
  clusterNeeds(ref) {
    var _a, _b, _c;
    const type = ref.view.resolveType(ref.entry);
    return (_c = (_b = (_a = ref.view.registries.valueTypes.get(type)) == null ? void 0 : _a.clusterNeeds) == null ? void 0 : _b.call(_a, ref)) != null ? _c : {};
  },
  render(ctx2) {
    var _a;
    const { view, entry } = ctx2;
    view.renderLabel(ctx2.head, ctx2);
    const type = view.resolveType(entry);
    const def = (_a = view.registries.valueTypes.get(type)) != null ? _a : view.registries.valueTypes.get("text");
    def == null ? void 0 : def.render(ctx2);
  }
};
var blankKind = {
  id: "blank",
  bare: true,
  defaultLabel: (i18n) => i18n.t("kind.blank"),
  render(ctx2) {
    const { view, section, entry, wrap } = ctx2;
    if (!view.editMode) return;
    const t = view.i18n.t.bind(view.i18n);
    const grip = wrap.createSpan({ cls: "ep-grip", text: "::" });
    grip.setAttr("title", t("blank.dragHint"));
    const openMenu = (ce) => {
      ce.preventDefault();
      ce.stopPropagation();
      const m = new import_obsidian19.Menu();
      m.addItem(
        (i) => i.setTitle(t("blank.addHere")).setIcon("plus").onClick(
          () => view.openAddMenu(wrap, section, { replaceId: entry.id })
        )
      );
      m.addItem(
        (i) => i.setTitle(t("blank.remove")).setIcon("trash").onClick(() => view.removeEntry(section, entry))
      );
      const cols = section.columns || 1;
      const bi = section.entries.indexOf(entry);
      if (bi >= 0) {
        m.addSeparator();
        m.addItem(
          (i) => i.setTitle(t("grid.removeRow")).setIcon("trash").onClick(() => {
            removeRowAt(section, Math.floor(bi / cols));
            view.saveLayout();
            view.rerender();
          })
        );
        m.addItem(
          (i) => i.setTitle(t("grid.removeColumn")).setIcon("trash").onClick(() => {
            removeColumnAt(section, bi % cols, sectionMode(section) === "grid");
            view.saveLayout();
            view.rerender();
          })
        );
      }
      m.showAtMouseEvent(ce);
    };
    const mb = wrap.createSpan({ cls: "ep-menu-btn", text: "..." });
    mb.onclick = openMenu;
    wrap.addEventListener("contextmenu", openMenu);
    wrap.onclick = () => view.openAddMenu(wrap, section, { replaceId: entry.id });
  }
};
var tocKind = {
  id: "toc",
  addable: true,
  defaultLabel: (i18n) => i18n.t("kind.toc"),
  render(ctx2) {
    const { view } = ctx2;
    view.renderLabel(ctx2.head, ctx2);
    const list = ctx2.extra.createDiv({ cls: "ep-toc" });
    list.setAttr("title", view.i18n.t("toc.hint"));
    for (const s of view.layout.sections) {
      const row = list.createDiv({ cls: "ep-toc-row" });
      if (s.icon) {
        const ic = row.createSpan({ cls: "ep-picon" });
        (0, import_obsidian19.setIcon)(ic, s.icon);
      }
      row.createSpan({ text: s.title || view.i18n.t("section.untitled") });
      row.onclick = () => view.scrollToSection(s.id);
    }
  }
};

// src/core/features.ts
var featureOn = (settings, id) => settings.features[id] !== false;
var TYPE_FEATURES = [
  { id: "decimal", typeIds: ["decimal"] },
  { id: "derived", typeIds: ["derived"] },
  // + the modifier system
  { id: "list", typeIds: ["list"] },
  { id: "checkbox", typeIds: ["checkbox"] },
  { id: "color", typeIds: ["color"] },
  { id: "formula", typeIds: ["formula"] },
  { id: "image", typeIds: ["image"] },
  { id: "media", typeIds: ["audio", "video", "pdf"] },
  { id: "iframe", typeIds: ["iframe"] },
  { id: "rating", typeIds: ["rating"] },
  { id: "link", typeIds: ["link"] },
  { id: "unit", typeIds: ["unit"] },
  { id: "datetime", typeIds: ["datetime"] },
  { id: "date", typeIds: ["date"] }
];
var UI_FEATURES = [
  { id: "table" },
  // the type table view (ribbon, command)
  { id: "sticky" },
  // section pinning to the header/footer zones
  { id: "pool" },
  // the autofill pool suffix + editor
  { id: "secure" },
  // encrypting sensitive values (decryption always works)
  { id: "snapshots" }
  // config snapshot commands + automatic snapshots
];

// src/ui/render/value-types/index.ts
function registerCore(ctx2, settings) {
  const r = ctx2.registries;
  const on = (id) => featureOn(settings, id);
  r.valueTypes.add(textType);
  r.valueTypes.add(numberType);
  if (on("decimal")) r.valueTypes.add(decimalType);
  if (on("derived")) r.valueTypes.add(derivedType);
  if (on("list")) r.valueTypes.add(listType);
  if (on("checkbox")) r.valueTypes.add(checkboxType);
  if (on("color")) r.valueTypes.add(colorType);
  if (on("formula")) r.valueTypes.add(formulaType);
  if (on("image")) r.valueTypes.add(imageType);
  if (on("media")) {
    r.valueTypes.add(audioType);
    r.valueTypes.add(videoType);
    r.valueTypes.add(pdfType);
  }
  if (on("iframe")) r.valueTypes.add(iframeType);
  if (on("rating")) r.valueTypes.add(ratingType);
  if (on("link")) r.valueTypes.add(linkType);
  if (on("unit")) r.valueTypes.add(unitType);
  if (on("datetime")) r.valueTypes.add(datetimeType);
  if (on("date")) r.valueTypes.add(dateType);
  r.entryKinds.add(propKind);
  r.entryKinds.add(blankKind);
  r.entryKinds.add(tocKind);
  if (on("derived")) r.clusterAddons.add(modifierAddon);
  r.derivations.add({ id: "value", name: (i18n) => i18n.t("derive.value"), apply: (x) => x });
  r.layoutPresets.add({
    id: "empty",
    name: (i18n) => i18n.t("preset.empty"),
    build: () => ({ version: LAYOUT_VERSION, sections: [] })
  });
}

// src/api.ts
var API_VERSION = 2;

// src/ui/view.ts
var import_obsidian28 = require("obsidian");

// src/core/note-model.ts
var import_obsidian20 = require("obsidian");

// src/core/merge.ts
function valuesEqual(a, b) {
  if (a === b) return true;
  const na = a === void 0 ? null : a;
  const nb = b === void 0 ? null : b;
  try {
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch (e) {
    return false;
  }
}
function conflictingKeys(base, theirs, mine, keys) {
  const out = [];
  for (const k of keys) {
    const theyChanged = !valuesEqual(theirs[k], base[k]);
    const sameAsMine = valuesEqual(theirs[k], mine[k]);
    if (theyChanged && !sameAsMine) out.push(k);
  }
  return out;
}

// src/core/note-model.ts
var ECHO_WINDOW_MS = 600;
var WRITE_DEBOUNCE_MS = 300;
var WRITE_MAXWAIT_MS = 1e3;
var CONFLICT_EPS_MS = 400;
function writeConflictNotice(i18n, fileName, onKeepMine, onTakeTheirs, conflictKeys = []) {
  const frag = activeDocument.createDocumentFragment();
  const msg = activeDocument.createElement("div");
  msg.className = "ep-conflict-msg";
  msg.textContent = i18n.t("conflict.message", { note: fileName });
  frag.appendChild(msg);
  if (conflictKeys.length) {
    const keys = activeDocument.createElement("div");
    keys.className = "ep-conflict-keys";
    keys.textContent = i18n.t("conflict.keys", { keys: conflictKeys.join(", ") });
    frag.appendChild(keys);
  }
  const row = activeDocument.createElement("div");
  row.className = "ep-conflict-actions";
  const mine = activeDocument.createElement("button");
  mine.className = "mod-warning";
  mine.textContent = i18n.t("conflict.keepMine");
  const theirs = activeDocument.createElement("button");
  theirs.textContent = i18n.t("conflict.takeTheirs");
  row.appendChild(mine);
  row.appendChild(theirs);
  frag.appendChild(row);
  let notice;
  mine.onclick = () => {
    notice.hide();
    onKeepMine();
  };
  theirs.onclick = () => {
    notice.hide();
    onTakeTheirs();
  };
  notice = new import_obsidian20.Notice(frag, 0);
}
var NoteModel = class {
  constructor(app, i18n, host) {
    this.app = app;
    this.i18n = i18n;
    this.host = host;
    /** Raw frontmatter of the active note (shallow copy of the cache). */
    this.raw = {};
    /** Path of the note `raw` belongs to. */
    this.path = null;
    this.lastWritePath = null;
    this.lastWriteTime = 0;
    this.undo = /* @__PURE__ */ new Map();
    // Write queue (D4): per-file coalescing by key + conflict baseline.
    this.pendingKeys = /* @__PURE__ */ new Map();
    this.writeTimers = /* @__PURE__ */ new Map();
    this.batchBase = /* @__PURE__ */ new Map();
    /** Frontmatter snapshot when each batch began - the ancestor for 3-way merge. */
    this.batchBaseFm = /* @__PURE__ */ new Map();
    this.batchStart = /* @__PURE__ */ new Map();
    this.conflictPaths = /* @__PURE__ */ new Set();
  }
  // -- loading ---------------------------------------------------------
  /** Load `raw` from the metadata cache for `file`. */
  load(file) {
    var _a;
    if (this.path && this.path !== file.path) this.flushPending(this.path);
    const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    this.raw = fm ? { ...fm } : {};
    this.path = file.path;
  }
  /** Whether a metadata-changed event for `file` is an echo of our own write. */
  isEcho(file) {
    return this.lastWritePath === file.path && Date.now() - this.lastWriteTime < ECHO_WINDOW_MS;
  }
  // -- typed readers -----------------------------------------------------
  num(key, def) {
    return getNum(this.raw, key, def);
  }
  str(key) {
    return getStr(this.raw, key);
  }
  list(key) {
    return getList(this.raw, key);
  }
  /** True when the key is missing, null, "" or an empty list. */
  isEmpty(key) {
    if (!key) return true;
    const v = this.raw[key];
    return v === void 0 || v === null || v === "" || Array.isArray(v) && v.length === 0;
  }
  /** The note's `Type` property as a list (case-insensitive key match). */
  noteTypes() {
    for (const k of Object.keys(this.raw)) {
      if (k.toLowerCase() === "type") {
        const v = this.raw[k];
        return Array.isArray(v) ? v.map((x) => String(x)) : v === void 0 || v === null ? [] : [String(v)];
      }
    }
    return [];
  }
  // -- writing ----------------------------------------------------------
  /**
   * Set one property; the UI updates now, the file write is queued (debounced).
   * @param full re-render instead of in-place value refresh
   */
  set(file, key, value, full = false) {
    this.recordUndo(file, key);
    if (value === void 0) delete this.raw[key];
    else this.raw[key] = value;
    if (full) this.host.onFullChange();
    else this.host.onLightChange();
    this.queueWrite(file, key);
  }
  /** Set several properties at once (coalesced into one queued write, full re-render). */
  setMany(file, entries) {
    for (const key of Object.keys(entries)) this.recordUndo(file, key);
    Object.assign(this.raw, entries);
    this.host.onFullChange();
    for (const key of Object.keys(entries)) this.queueWrite(file, key);
  }
  /** Queue `key` for a coalesced, debounced write of `raw[key]` to `file`. */
  queueWrite(file, key) {
    var _a, _b, _c, _d, _e;
    const path = file.path;
    let keys = this.pendingKeys.get(path);
    if (!keys) {
      keys = /* @__PURE__ */ new Set();
      this.pendingKeys.set(path, keys);
      this.batchBase.set(path, (_b = (_a = file.stat) == null ? void 0 : _a.mtime) != null ? _b : 0);
      this.batchBaseFm.set(path, { ...(_d = (_c = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _c.frontmatter) != null ? _d : {} });
      this.batchStart.set(path, Date.now());
    }
    keys.add(key);
    if (this.conflictPaths.has(path)) return;
    const prev = this.writeTimers.get(path);
    if (prev) window.clearTimeout(prev);
    const elapsed = Date.now() - ((_e = this.batchStart.get(path)) != null ? _e : Date.now());
    const wait = Math.max(0, Math.min(WRITE_DEBOUNCE_MS, WRITE_MAXWAIT_MS - elapsed));
    this.writeTimers.set(path, window.setTimeout(() => void this.flushFile(file), wait));
  }
  async flushFile(file) {
    var _a, _b, _c, _d, _e, _f;
    const path = file.path;
    const timer = this.writeTimers.get(path);
    if (timer) window.clearTimeout(timer);
    this.writeTimers.delete(path);
    const keys = this.pendingKeys.get(path);
    if (!keys || keys.size === 0) {
      this.clearBatch(path);
      return;
    }
    const base = (_a = this.batchBase.get(path)) != null ? _a : 0;
    const cur = (_c = (_b = file.stat) == null ? void 0 : _b.mtime) != null ? _c : 0;
    const guard = this.host.conflictGuard ? this.host.conflictGuard() : true;
    if (guard && base && cur - base > CONFLICT_EPS_MS && !this.isEcho(file)) {
      const theirs = (_e = (_d = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _d.frontmatter) != null ? _e : {};
      const baseFm = (_f = this.batchBaseFm.get(path)) != null ? _f : {};
      const conflicts = conflictingKeys(baseFm, theirs, this.raw, [...keys]);
      if (conflicts.length === 0) {
        const n = keys.size;
        await this.applyWrites(file, [...keys]);
        new import_obsidian20.Notice(this.i18n.t("conflict.merged", { note: file.basename, n: String(n) }));
        return;
      }
      this.promptConflict(file, conflicts);
      return;
    }
    await this.applyWrites(file, [...keys]);
  }
  async applyWrites(file, keys) {
    this.clearBatch(file.path);
    this.stampWrite(file);
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        for (const k of keys) {
          const cur = this.raw[k];
          if (cur === void 0) delete fm[k];
          else fm[k] = cur;
        }
      });
      this.lastWriteTime = Date.now();
    } catch (err) {
      new import_obsidian20.Notice(this.i18n.t("notice.saveFailed", { error: String(err) }));
    }
  }
  promptConflict(file, conflicts = []) {
    const path = file.path;
    if (this.conflictPaths.has(path)) return;
    this.conflictPaths.add(path);
    writeConflictNotice(
      this.i18n,
      file.basename,
      () => {
        this.conflictPaths.delete(path);
        const keys = this.pendingKeys.get(path);
        if (keys && keys.size) void this.applyWrites(file, [...keys]);
        else this.clearBatch(path);
      },
      () => {
        this.conflictPaths.delete(path);
        this.clearBatch(path);
        const af = this.app.vault.getAbstractFileByPath(path);
        if (af instanceof import_obsidian20.TFile) this.load(af);
        this.host.onFullChange();
      },
      conflicts
    );
  }
  /** Force-write any pending changes immediately (file switch / unload). */
  flushPending(path) {
    const paths = path ? [path] : [...this.pendingKeys.keys()];
    for (const p of paths) {
      if (this.conflictPaths.has(p)) continue;
      const keys = this.pendingKeys.get(p);
      if (!keys || keys.size === 0) {
        this.clearBatch(p);
        continue;
      }
      const af = this.app.vault.getAbstractFileByPath(p);
      if (af instanceof import_obsidian20.TFile) void this.applyWrites(af, [...keys]);
      else this.clearBatch(p);
    }
  }
  clearBatch(path) {
    const t = this.writeTimers.get(path);
    if (t) window.clearTimeout(t);
    this.writeTimers.delete(path);
    this.pendingKeys.delete(path);
    this.batchBase.delete(path);
    this.batchBaseFm.delete(path);
    this.batchStart.delete(path);
  }
  stampWrite(file) {
    this.lastWritePath = file.path;
    this.lastWriteTime = Date.now();
  }
  // -- session undo (edit mode) --------------------------------------------
  recordUndo(file, key) {
    if (!this.host.captureUndo()) return;
    const id = file.path + " " + key;
    if (!this.undo.has(id)) this.undo.set(id, { path: file.path, key, old: this.raw[key] });
  }
  hasUndo() {
    return this.undo.size > 0;
  }
  clearUndo() {
    this.undo.clear();
  }
  /**
   * Write all captured original values back to their files. Resolves when
   * every write has landed (or failed with a notice), so callers can reload
   * afterwards. Deliberately NOT stamped as our own write: the metadata
   * echo is what refreshes the view once the cache reflects the revert.
   */
  async revertUndo() {
    const byFile = /* @__PURE__ */ new Map();
    for (const { path, key, old } of this.undo.values()) {
      if (!byFile.has(path)) byFile.set(path, []);
      byFile.get(path).push({ key, old });
    }
    await Promise.all(
      [...byFile].map(async ([path, changes]) => {
        const f = this.app.vault.getAbstractFileByPath(path);
        if (!(f instanceof import_obsidian20.TFile)) return;
        try {
          await this.app.fileManager.processFrontMatter(f, (fm) => {
            for (const { key, old } of changes) {
              if (old === void 0) delete fm[key];
              else fm[key] = old;
            }
          });
        } catch (err) {
          new import_obsidian20.Notice(this.i18n.t("notice.saveFailed", { error: String(err) }));
        }
      })
    );
  }
};
var NoteFacade = class {
  constructor(app, i18n, guard) {
    this.app = app;
    this.i18n = i18n;
    this.guard = guard;
    this.timers = /* @__PURE__ */ new Map();
    this.pending = /* @__PURE__ */ new Map();
    /** File mtime captured when each pending batch began (conflict baseline). */
    this.bases = /* @__PURE__ */ new Map();
    /** Frontmatter snapshot when each batch began - the ancestor for 3-way merge. */
    this.baseFm = /* @__PURE__ */ new Map();
    /** When we last wrote each file, to ignore our own echo (ms). */
    this.lastWriteAt = /* @__PURE__ */ new Map();
    /** Paths with an open conflict prompt (auto-flush suspended). */
    this.conflicts = /* @__PURE__ */ new Set();
  }
  /** Shallow copy of a file's frontmatter (empty object when none). */
  raw(file) {
    var _a;
    const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    return fm ? { ...fm } : {};
  }
  /** Raw value of `key` (case-insensitive), or undefined. */
  get(file, key) {
    const raw = this.raw(file);
    const k = Object.keys(raw).find((x) => x.toLowerCase() === key.toLowerCase());
    return k === void 0 ? void 0 : raw[k];
  }
  num(file, key, def = 0) {
    return getNum(this.raw(file), key, def);
  }
  str(file, key) {
    return getStr(this.raw(file), key);
  }
  list(file, key) {
    return getList(this.raw(file), key);
  }
  /** Queue a frontmatter write (debounced per file; `undefined` removes the key). */
  set(file, key, value) {
    var _a, _b, _c, _d;
    let m = this.pending.get(file.path);
    if (!m) {
      m = /* @__PURE__ */ new Map();
      this.pending.set(file.path, m);
      this.bases.set(file.path, (_b = (_a = file.stat) == null ? void 0 : _a.mtime) != null ? _b : 0);
      this.baseFm.set(file.path, { ...(_d = (_c = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _c.frontmatter) != null ? _d : {} });
    }
    m.set(key, value);
    if (this.conflicts.has(file.path)) return;
    const prev = this.timers.get(file.path);
    if (prev) window.clearTimeout(prev);
    this.timers.set(file.path, window.setTimeout(() => this.flush(file), WRITE_DEBOUNCE_MS));
  }
  flush(file) {
    var _a, _b, _c, _d, _e, _f, _g;
    this.timers.delete(file.path);
    const m = this.pending.get(file.path);
    if (!m || m.size === 0) {
      this.pending.delete(file.path);
      this.bases.delete(file.path);
      this.baseFm.delete(file.path);
      return;
    }
    const base = (_a = this.bases.get(file.path)) != null ? _a : 0;
    const cur = (_c = (_b = file.stat) == null ? void 0 : _b.mtime) != null ? _c : 0;
    const guard = this.guard ? this.guard() : true;
    const echoed = Date.now() - ((_d = this.lastWriteAt.get(file.path)) != null ? _d : 0) < ECHO_WINDOW_MS;
    if (guard && base && cur - base > CONFLICT_EPS_MS && !echoed) {
      const theirs = (_f = (_e = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _e.frontmatter) != null ? _f : {};
      const baseFm = (_g = this.baseFm.get(file.path)) != null ? _g : {};
      const mine = {};
      for (const [k, v] of m) mine[k] = v;
      const conflicts = conflictingKeys(baseFm, theirs, mine, [...m.keys()]);
      if (conflicts.length === 0) {
        const n = m.size;
        this.write(file);
        new import_obsidian20.Notice(this.i18n.t("conflict.merged", { note: file.basename, n: String(n) }));
        return;
      }
      this.conflicts.add(file.path);
      writeConflictNotice(
        this.i18n,
        file.basename,
        () => {
          this.conflicts.delete(file.path);
          this.write(file);
        },
        () => {
          this.conflicts.delete(file.path);
          this.pending.delete(file.path);
          this.bases.delete(file.path);
          this.baseFm.delete(file.path);
        },
        conflicts
      );
      return;
    }
    this.write(file);
  }
  /**
   * Force-write every pending batch immediately (plugin unload). Mirrors
   * {@link NoteModel.flushPending}: writes land without the conflict check -
   * there is no one left to prompt - except files with an open conflict
   * prompt, which stay suspended for the user's decision.
   */
  flushAll() {
    for (const path of [...this.pending.keys()]) {
      if (this.conflicts.has(path)) continue;
      const t = this.timers.get(path);
      if (t) window.clearTimeout(t);
      this.timers.delete(path);
      const af = this.app.vault.getAbstractFileByPath(path);
      if (af instanceof import_obsidian20.TFile) this.write(af);
      else {
        this.pending.delete(path);
        this.bases.delete(path);
        this.baseFm.delete(path);
      }
    }
  }
  write(file) {
    var _a, _b;
    const m = this.pending.get(file.path);
    if (!m) return;
    this.pending.delete(file.path);
    this.baseFm.delete(file.path);
    this.lastWriteAt.set(file.path, Date.now());
    this.bases.set(file.path, (_b = (_a = file.stat) == null ? void 0 : _a.mtime) != null ? _b : 0);
    this.app.fileManager.processFrontMatter(file, (fm) => {
      for (const [k, v] of m) {
        if (v === void 0) delete fm[k];
        else fm[k] = v;
      }
    }).then(() => this.lastWriteAt.set(file.path, Date.now())).catch((err) => new import_obsidian20.Notice(this.i18n.t("notice.saveFailed", { error: String(err) })));
  }
};

// src/core/note-ref.ts
function makeVaultAccess(props, getSourcePath) {
  return {
    valuesByType: (type, key) => props.valuesByType(type, key),
    linkedValue: (linkProp, key) => props.linkedValue(getSourcePath(), linkProp, key)
  };
}
function parseNoteRef(name) {
  var _a;
  const m = /^\[\[([^\]]+)\]\](?:\s*\.\s*(.+))?$/.exec((name != null ? name : "").trim());
  if (!m) return null;
  return { link: m[1].trim(), accessor: ((_a = m[2]) != null ? _a : "").trim() };
}
function layoutFor(settings, raw) {
  const tk = Object.keys(raw).find((k) => k.toLowerCase() === "type");
  const tv = tk !== void 0 ? raw[tk] : void 0;
  const types = Array.isArray(tv) ? tv.map(String) : tv === void 0 || tv === null ? [] : [String(tv)];
  const match = settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
  if (!match) return void 0;
  const l = settings.layouts[match.toLowerCase()];
  return l && Array.isArray(l.sections) ? l : void 0;
}
function envForFile(app, settings, registries, file) {
  var _a;
  const fm = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
  const raw = fm ? { ...fm } : {};
  const note = {
    raw,
    num: (k, d) => getNum(raw, k, d),
    list: (k) => getList(raw, k)
  };
  return { note, registries, settings, layout: layoutFor(settings, raw) };
}
function makeNoteAwareResolver(app, settings, registries, localEnv, sourcePath) {
  const local = makeRefResolver(localEnv);
  return (name) => {
    const nr = parseNoteRef(name);
    if (nr && nr.accessor) {
      if (settings.crossNote === false) return void 0;
      const f = app.metadataCache.getFirstLinkpathDest(nr.link, sourcePath);
      if (!f) return void 0;
      return makeRefResolver(envForFile(app, settings, registries, f))(nr.accessor);
    }
    return local(name);
  };
}

// src/ui/render/section-renderer.ts
var import_obsidian26 = require("obsidian");

// src/ui/render/entry-renderer.ts
var import_obsidian22 = require("obsidian");

// src/ui/menus/entry-menu.ts
var import_obsidian21 = require("obsidian");
function openEntryMenu(e, view, file, section, entry) {
  var _a, _b;
  const t = view.i18n.t.bind(view.i18n);
  const menu = new import_obsidian21.Menu();
  const cfgName = entry.alias || view.defaultLabelFor(entry);
  menu.addItem(
    (i) => i.setTitle(
      entry.kind === "prop" ? t("entry.menu.configure", { name: cfgName }) : t("entry.menu.configureObject", { name: cfgName })
    ).setIcon("settings").onClick(() => view.openEntryOptions(section, entry))
  );
  if (entry.kind === "prop" && entry.key) {
    const key = entry.key;
    menu.addSeparator();
    menu.addItem(
      (i) => i.setTitle(view.hide.isHidden(key) ? t("entry.menu.showInObsidian", { key }) : t("entry.menu.hideFromObsidian", { key })).setIcon(view.hide.isHidden(key) ? "eye" : "eye-off").onClick(() => view.hide.toggle(key))
    );
    menu.addItem(
      (i) => i.setTitle(t("entry.menu.clearValue", { key })).setIcon("eraser").onClick(
        () => view.note.set(file, key, void 0)
      )
    );
    menu.addSeparator();
    const type = view.resolveType(entry);
    (_b = (_a = view.registries.valueTypes.get(type)) == null ? void 0 : _a.menuItems) == null ? void 0 : _b.call(_a, menu, { view, file, section, entry }, { x: e.clientX, y: e.clientY });
  }
  const mode = sectionMode(section);
  const kindDef = view.registries.entryKinds.get(entry.kind);
  if ((mode === "grid" || mode === "columns") && !(kindDef == null ? void 0 : kindDef.wide)) {
    const cols = section.columns || 1;
    const idx = section.entries.indexOf(entry);
    if (idx >= 0) {
      menu.addSeparator();
      if (mode === "grid")
        menu.addItem(
          (i) => i.setTitle(t("grid.removeRow")).setIcon("trash").onClick(() => {
            removeRowAt(section, Math.floor(idx / cols));
            view.saveLayout();
            view.rerender();
          })
        );
      menu.addItem(
        (i) => i.setTitle(mode === "grid" ? t("grid.removeColumn") : t("grid.removeAColumn")).setIcon("trash").onClick(() => {
          removeColumnAt(section, idx % cols, mode === "grid");
          view.saveLayout();
          view.rerender();
        })
      );
    }
  }
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle(t("entry.menu.remove")).setIcon("trash").onClick(() => view.removeEntry(section, entry))
  );
  menu.showAtMouseEvent(e);
}

// src/ui/render/entry-renderer.ts
function isHiddenEntry(view, entry) {
  if (view.editMode) return false;
  if (entry.showWhen && !view.condVisible(entry.showWhen)) return true;
  if (entry.kind !== "prop") return false;
  if (view.resolveType(entry) === "derived") return false;
  return entry.hideIfEmpty !== false && view.note.isEmpty(entry.key);
}
function isWide(view, entry) {
  var _a, _b;
  if ((_a = view.registries.entryKinds.get(entry.kind)) == null ? void 0 : _a.wide) return true;
  if (entry.kind === "prop") return !!((_b = view.registries.valueTypes.get(view.resolveType(entry))) == null ? void 0 : _b.wide);
  return false;
}
function renderEntry(grid, view, file, section, entry, flags, drag) {
  if (isHiddenEntry(view, entry)) return;
  const kind = view.registries.entryKinds.get(entry.kind);
  const condOff = view.editMode && !!entry.showWhen && !view.condVisible(entry.showWhen);
  if (kind == null ? void 0 : kind.bare) {
    const wrap2 = grid.createDiv({ cls: "ep-entry ep-blank" });
    wrap2.setAttr("data-ep-id", "e:" + entry.id);
    if (condOff) wrap2.addClass("ep-cond-off");
    const ctx3 = { view, file, section, entry, head: wrap2, extra: wrap2, flags, wrap: wrap2 };
    kind.render(ctx3);
    if (view.editMode) {
      const grip2 = wrap2.querySelector(".ep-grip");
      if (grip2) drag.attachEntry(wrap2, grip2, section, entry);
    }
    return;
  }
  const wide = isWide(view, entry);
  const wrap = grid.createDiv({ cls: wide ? "ep-entry ep-entry-block" : "ep-entry" });
  wrap.setAttr("data-ep-id", "e:" + entry.id);
  wrap.tabIndex = -1;
  wrap.setAttr("role", "group");
  wrap.setAttr("aria-label", entry.alias || entry.key || view.defaultLabelFor(entry));
  if (condOff) {
    wrap.addClass("ep-cond-off");
    wrap.setAttr("title", view.i18n.t("options.showWhenActive", { expr: entry.showWhen }));
  }
  if (wide) wrap.setCssStyles({ gridColumn: "1 / -1" });
  if (entry.showValue === false) wrap.addClass("ep-hide-value");
  const head = wrap.createDiv({ cls: "ep-entry-head" });
  let grip = null;
  if (view.editMode) {
    grip = head.createSpan({ cls: "ep-grip", text: "::" });
    grip.setAttr("title", view.i18n.t("entry.dragHint"));
    grip.setAttr("aria-hidden", "true");
  }
  if (entry.icon) {
    const ic = head.createSpan({ cls: "ep-picon" });
    (0, import_obsidian22.setIcon)(ic, entry.icon);
    if (entry.iconColor) ic.setCssStyles({ color: entry.iconColor });
  }
  const extra = wrap.createDiv({ cls: "ep-entry-extra" });
  const ctx2 = { view, file, section, entry, head, extra, flags, wrap };
  if (kind) {
    kind.render(ctx2);
  } else {
    view.renderLabel(head, ctx2);
    const v = head.createDiv({ cls: "ep-val-right" });
    v.createSpan({ cls: "ep-placeholder", text: view.i18n.t("entry.unknownKind", { kind: entry.kind }) });
  }
  wrap.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openEntryMenu(e, view, file, section, entry);
  });
  longPressContextMenu(wrap);
  if (view.editMode) {
    const menuBtn = head.createSpan({ cls: "ep-menu-btn", text: "..." });
    menuBtn.setAttr("role", "button");
    menuBtn.tabIndex = 0;
    menuBtn.setAttr("aria-label", view.i18n.t("a11y.entryMenu"));
    menuBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEntryMenu(e, view, file, section, entry);
    };
    menuBtn.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const r = menuBtn.getBoundingClientRect();
        openEntryMenu(new MouseEvent("contextmenu", { clientX: r.left, clientY: r.bottom }), view, file, section, entry);
      }
    };
    if (grip) drag.attachEntry(wrap, grip, section, entry);
  }
}

// src/ui/menus/section-menu.ts
var import_obsidian25 = require("obsidian");

// src/core/transfer.ts
var TRANSFER_SCHEMA = 1;
var BUILTIN_DERIVATIONS = /* @__PURE__ */ new Set(["value", "formula", ""]);
function clone(x) {
  return JSON.parse(JSON.stringify(x));
}
function referencedDerivations(sections) {
  var _a;
  const out = /* @__PURE__ */ new Set();
  for (const s of sections)
    for (const e of s.entries)
      for (const inf of (_a = ext(e).mods) != null ? _a : [])
        if (inf.mode && !BUILTIN_DERIVATIONS.has(inf.mode)) out.add(inf.mode);
  return [...out];
}
function depManifest(sections, derivations) {
  const used = new Set(referencedDerivations(sections).map((d) => d.toLowerCase()));
  return derivations.filter((d) => used.has(d.id.toLowerCase())).map(clone);
}
function packType(name, layout, derivations, plugin) {
  return {
    ep: "extended-properties",
    schema: TRANSFER_SCHEMA,
    plugin,
    kind: "type",
    name,
    layout: clone(layout),
    derivations: depManifest(layout.sections, derivations)
  };
}
function packSection(section, derivations, plugin) {
  return {
    ep: "extended-properties",
    schema: TRANSFER_SCHEMA,
    plugin,
    kind: "section",
    name: section.title || "Section",
    section: clone(section),
    derivations: depManifest([section], derivations)
  };
}
function parseTransfer(text) {
  let v;
  try {
    v = JSON.parse(text);
  } catch (e) {
    return null;
  }
  const d = v;
  if (!d || d.ep !== "extended-properties" || d.kind !== "type" && d.kind !== "section") return null;
  if (typeof d.schema !== "number" || d.schema > TRANSFER_SCHEMA) return null;
  if (!Array.isArray(d.derivations)) d.derivations = [];
  if (d.kind === "type" && (!d.layout || !Array.isArray(d.layout.sections))) return null;
  if (d.kind === "section" && (!d.section || !Array.isArray(d.section.entries))) return null;
  if (typeof d.name !== "string") d.name = d.kind === "type" ? "Imported type" : "Imported section";
  return d;
}
function docSections(doc) {
  if (doc.kind === "section" && doc.section) return [doc.section];
  if (doc.kind === "type" && doc.layout) return doc.layout.sections;
  return [];
}
function missingDerivations(doc, existing) {
  const have = new Set(existing.map((d) => d.id.toLowerCase()));
  return doc.derivations.filter((d) => d && typeof d.id === "string" && !have.has(d.id.toLowerCase()));
}
function freshSection(section) {
  const s = clone(section);
  s.id = genId();
  for (const e of s.entries) e.id = genId();
  return s;
}
function freshSections(doc) {
  return docSections(doc).map(freshSection);
}

// src/ui/modals/section-options.ts
var import_obsidian24 = require("obsidian");

// src/ui/modals/entry-options.ts
var import_obsidian23 = require("obsidian");
function viewColorHost(view) {
  return {
    app: view.app,
    i18n: view.i18n,
    getColorSpace: () => view.settings.defaults.colorSpace,
    setColorSpace: (sp) => {
      view.settings.defaults.colorSpace = sp;
      view.saveLayout();
    }
  };
}
var NUMERIC_CONSTRAINT_TYPES = /* @__PURE__ */ new Set(["number", "decimal", "formula", "unit", "rating"]);
function renderConstraints(octx, type) {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const cn = () => {
    var _a;
    return (_a = entry.constraints) != null ? _a : entry.constraints = {};
  };
  c.createEl("h4", { text: t("options.constraintsHeading") });
  new import_obsidian23.Setting(c).setName(t("options.required")).setDesc(t("options.requiredDesc")).addToggle((tg) => {
    var _a;
    tg.setValue(!!((_a = entry.constraints) == null ? void 0 : _a.required)).onChange((v) => {
      cn().required = v || void 0;
      changed();
    });
  });
  if (NUMERIC_CONSTRAINT_TYPES.has(type)) {
    const numField = (name, get, set) => new import_obsidian23.Setting(c).setName(name).addText((tx) => {
      tx.setValue(get() !== void 0 ? String(get()) : "").onChange((v) => {
        const n = Number(v);
        set(v.trim() === "" || !Number.isFinite(n) ? void 0 : n);
        changed();
      });
    });
    numField(t("options.constraintMin"), () => {
      var _a;
      return (_a = entry.constraints) == null ? void 0 : _a.min;
    }, (n) => cn().min = n);
    numField(t("options.constraintMax"), () => {
      var _a;
      return (_a = entry.constraints) == null ? void 0 : _a.max;
    }, (n) => cn().max = n);
    new import_obsidian23.Setting(c).setName(t("options.constraintClamp")).setDesc(t("options.constraintClampDesc")).addToggle((tg) => {
      var _a;
      tg.setValue(!!((_a = entry.constraints) == null ? void 0 : _a.clamp)).onChange((v) => {
        cn().clamp = v || void 0;
        changed();
      });
    });
  } else {
    new import_obsidian23.Setting(c).setName(t("options.constraintPattern")).setDesc(t("options.constraintPatternDesc")).addText((tx) => {
      var _a, _b;
      tx.setValue((_b = (_a = entry.constraints) == null ? void 0 : _a.pattern) != null ? _b : "").onChange((v) => {
        cn().pattern = v.trim() || void 0;
        changed();
      });
    });
    new import_obsidian23.Setting(c).setName(t("options.constraintAllowed")).setDesc(t("options.constraintAllowedDesc")).addText((tx) => {
      var _a, _b;
      tx.setValue(((_b = (_a = entry.constraints) == null ? void 0 : _a.allowed) != null ? _b : []).join(", ")).onChange((v) => {
        const arr = v.split(",").map((x) => x.trim()).filter(Boolean);
        cn().allowed = arr.length ? arr : void 0;
        changed();
      });
    });
  }
}
function renderEntryOptionsBody(octx, onDone, onRemoved, opts = {}) {
  var _a, _b, _c, _d;
  const { view, section, entry: e, container: c, changed, redraw } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const isProp = e.kind === "prop";
  if (!opts.multi) {
    c.createEl("h4", { text: isProp ? t("options.propertyHeading") : t("options.objectHeading") });
    if (isProp) {
      new import_obsidian23.Setting(c).setName(t("options.property")).setDesc(t("options.propertyDesc")).addText((tx) => {
        var _a2;
        tx.setValue((_a2 = e.key) != null ? _a2 : "");
        new PropSuggest(view.app, tx.inputEl, view.i18n, () => view.propCandidates(true), (k) => {
          view.renameKey(e, k);
          redraw();
        }, false);
        tx.inputEl.addEventListener("change", () => {
          const v = tx.getValue().trim();
          if (v && v !== e.key) {
            view.renameKey(e, v);
            redraw();
          }
        });
      });
    }
    new import_obsidian23.Setting(c).setName(t("options.label")).setDesc(t("options.labelDesc", { default: view.defaultLabelFor(e) })).addText((tx) => {
      var _a2;
      tx.setPlaceholder(view.defaultLabelFor(e)).setValue((_a2 = e.alias) != null ? _a2 : "").onChange((v) => {
        e.alias = v.trim() || void 0;
        changed();
      });
    });
    if (isProp) {
      new import_obsidian23.Setting(c).setName(t("options.showValue")).setDesc(t("options.showValueDesc")).addToggle((tg) => {
        tg.setValue(e.showValue !== false).onChange((v) => {
          e.showValue = v ? void 0 : false;
          changed();
        });
      });
    }
  }
  if (isProp) {
    c.createEl("h4", { text: t("options.typeHeading") });
    const cur = view.resolveType(e);
    new import_obsidian23.Setting(c).setName(t("options.dataType")).setDesc(t("options.dataTypeDesc")).addDropdown((d) => {
      for (const def of view.registries.valueTypes.all()) {
        if (def.deprecated && def.id !== cur) continue;
        d.addOption(def.id, def.name(view.i18n));
      }
      d.setValue(cur);
      d.onChange((v) => {
        if (e.key) setSharedDataType(view.settings, e.key, v);
        e.dataType = v;
        changed();
        redraw();
      });
    });
    (_b = (_a = view.registries.valueTypes.get(cur)) == null ? void 0 : _a.renderOptions) == null ? void 0 : _b.call(_a, octx);
    renderConstraints(octx, cur);
  } else {
    (_d = (_c = view.registries.entryKinds.get(e.kind)) == null ? void 0 : _c.renderOptions) == null ? void 0 : _d.call(_c, octx);
  }
  const host = viewColorHost(view);
  c.createEl("h4", { text: t("options.appearanceHeading") });
  addIconSetting(view.app, view.i18n, c, t("options.icon"), () => e.icon, (v) => {
    e.icon = v;
    changed();
  });
  addColorSetting(host, c, t("options.iconColor"), "", () => e.iconColor, (v) => {
    e.iconColor = v;
    changed();
  });
  new import_obsidian23.Setting(c).setName(t("options.showLabel")).setDesc(t("options.showLabelDesc")).addToggle((tg) => {
    tg.setValue(!e.hideLabel).onChange((v) => {
      e.hideLabel = v ? void 0 : true;
      changed();
    });
  });
  if (isProp) {
    new import_obsidian23.Setting(c).setName(t("options.showType")).setDesc(t("options.showTypeDesc")).addToggle((tg) => {
      tg.setValue(e.showType !== false).onChange((v) => {
        e.showType = v ? void 0 : false;
        changed();
      });
    });
  }
  new import_obsidian23.Setting(c).setName(t("options.showWhenEmpty")).setDesc(t("options.showWhenEmptyDesc")).addToggle((tg) => {
    tg.setValue(e.hideIfEmpty === false).onChange((v) => {
      e.hideIfEmpty = v ? false : void 0;
      changed();
    });
  });
  new import_obsidian23.Setting(c).setName(t("options.showWhen")).setDesc(t("options.showWhenDesc")).addText((tx) => {
    var _a2;
    const mark = () => {
      const v = tx.getValue().trim();
      tx.inputEl.toggleClass("ep-invalid", !!v && !parseExpr(v));
    };
    tx.setPlaceholder('Class == "Wizard"').setValue((_a2 = e.showWhen) != null ? _a2 : "");
    mark();
    tx.onChange((v) => {
      e.showWhen = v.trim() || void 0;
      mark();
      changed();
    });
  });
  new import_obsidian23.Setting(c).setName(t("options.labelSize")).setDesc(t("options.sizeDesc")).addSlider((sl) => {
    var _a2;
    sl.setLimits(0, 40, 1).setValue((_a2 = e.labelSize) != null ? _a2 : 0).onChange((v) => {
      e.labelSize = v || void 0;
      changed();
    });
  });
  new import_obsidian23.Setting(c).setName(t("options.valueSize")).setDesc(t("options.sizeDesc")).addSlider((sl) => {
    var _a2;
    sl.setLimits(0, 40, 1).setValue((_a2 = e.valueSize) != null ? _a2 : 0).onChange((v) => {
      e.valueSize = v || void 0;
      changed();
    });
  });
  addColorSetting(host, c, t("options.labelColor"), "", () => e.labelColor, (v) => {
    e.labelColor = v;
    changed();
  });
  addColorSetting(host, c, t("options.valueColor"), "", () => e.valueColor, (v) => {
    e.valueColor = v;
    changed();
  });
  if (isProp) {
    c.createEl("h4", { text: t("options.obsidianHeading") });
    new import_obsidian23.Setting(c).setName(t("options.showInObsidian")).setDesc(t("options.showInObsidianDesc")).addToggle((tg) => {
      tg.setValue(!!e.showInObsidian).onChange((v) => {
        e.showInObsidian = v || void 0;
        changed();
      });
    });
  }
  if (!opts.multi) {
    c.createEl("h4", { text: t("options.placementHeading") });
    new import_obsidian23.Setting(c).addButton(
      (b) => b.setButtonText(t("entry.menu.remove")).then(destructive).onClick(() => {
        view.removeEntry(section, e);
        onRemoved();
      })
    );
  }
  new import_obsidian23.Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => onDone()));
}
var EntryOptionsModal = class extends import_obsidian23.Modal {
  constructor(view, section, entry, file) {
    super(view.app);
    this.view = view;
    this.section = section;
    this.entry = entry;
    this.file = file;
    this.snapshot = "";
  }
  changed() {
    this.view.saveLayout();
    this.view.rerender();
  }
  onOpen() {
    asMobileSheet(this);
    this.snapshot = JSON.stringify(this.entry);
    this.draw();
  }
  draw() {
    const c = this.contentEl;
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    c.empty();
    c.addClass("ep-options");
    c.createEl("h3", {
      text: t("options.title", { name: this.entry.alias || view.defaultLabelFor(this.entry) })
    });
    const octx = {
      view,
      file: this.file,
      section: this.section,
      entry: this.entry,
      container: c,
      changed: () => this.changed(),
      redraw: () => this.draw()
    };
    renderEntryOptionsBody(octx, () => this.close(), () => this.close());
  }
  onClose() {
    this.contentEl.empty();
    if (JSON.stringify(this.entry) !== this.snapshot) {
      new ConfirmChangesModal(this.view.app, this.view.i18n, () => {
      }, () => {
        restoreFromSnapshot(this.entry, this.snapshot);
        this.changed();
      }).open();
    }
  }
};

// src/ui/modals/section-options.ts
var SECTION_TAB = "::section";
var NUMERIC_SET = /* @__PURE__ */ new Set(["number", "decimal"]);
var MODIFIABLE_SET = /* @__PURE__ */ new Set(["number", "decimal", "formula", "derived"]);
var SectionOptionsModal = class extends import_obsidian24.Modal {
  /** @param initialTab entry id whose tab opens pre-selected. */
  constructor(view, section, initialTab) {
    super(view.app);
    this.view = view;
    this.section = section;
    this.snapshot = "";
    this.selected = /* @__PURE__ */ new Set([SECTION_TAB]);
    this.file = null;
    /** Tap-to-toggle selection mode (the touch alternative to drag/Ctrl). */
    this.multiTap = false;
    /** Anchor for Shift ranges and drag selection. */
    this.anchorId = null;
    if (initialTab && section.entries.some((e) => e.id === initialTab)) {
      this.selected = /* @__PURE__ */ new Set([initialTab]);
      this.anchorId = initialTab;
    }
  }
  changed() {
    this.view.saveLayout();
    this.view.rerender();
  }
  onOpen() {
    asMobileSheet(this);
    this.snapshot = JSON.stringify(this.section);
    this.file = this.view.app.workspace.getActiveFile();
    this.draw();
  }
  // -- tab plumbing ---------------------------------------------------------
  tabTargets() {
    return this.section.entries.filter((e) => this.selected.has(e.id));
  }
  entryLabel(e) {
    return e.alias || this.view.defaultLabelFor(e) || e.key || e.kind;
  }
  drawTabs(c) {
    var _a;
    const t = this.view.i18n.t.bind(this.view.i18n);
    const tabbable = this.section.entries.filter((e) => e.kind !== "blank");
    const order = [SECTION_TAB, ...tabbable.map((e) => e.id)];
    const chips = /* @__PURE__ */ new Map();
    let dragging = false;
    let dragBase = /* @__PURE__ */ new Set();
    let dragAnchor = null;
    const applySelection = () => {
      for (const [id, el] of chips) el.toggleClass("is-active", this.selected.has(id));
    };
    const rangeIds = (a, b) => {
      const i = order.indexOf(a);
      const j = order.indexOf(b);
      if (i < 0 || j < 0) return [b];
      const [lo, hi] = i < j ? [i, j] : [j, i];
      return order.slice(lo, hi + 1);
    };
    const mk = (parent, id, label) => {
      const chip = parent.createDiv({ cls: "ep-tab", text: label });
      chips.set(id, chip);
      if (this.selected.has(id)) chip.addClass("is-active");
      chip.addEventListener("pointerdown", (ev) => {
        if (ev.button !== 0) return;
        ev.preventDefault();
        if (this.multiTap) {
          if (id === SECTION_TAB) {
            this.selected = /* @__PURE__ */ new Set([SECTION_TAB]);
          } else if (this.selected.has(id)) {
            if (this.selected.size > 1) this.selected.delete(id);
          } else {
            this.selected.add(id);
            this.selected.delete(SECTION_TAB);
          }
          this.anchorId = id;
          this.draw();
          return;
        }
        if (ev.shiftKey && this.anchorId) {
          const range = rangeIds(this.anchorId, id);
          this.selected = ev.ctrlKey || ev.metaKey ? /* @__PURE__ */ new Set([...this.selected, ...range]) : new Set(range);
          dragAnchor = this.anchorId;
        } else if (ev.ctrlKey || ev.metaKey) {
          if (this.selected.has(id)) {
            if (this.selected.size > 1) this.selected.delete(id);
          } else {
            this.selected.add(id);
          }
          this.anchorId = id;
          dragAnchor = id;
        } else {
          this.selected = /* @__PURE__ */ new Set([id]);
          this.anchorId = id;
          dragAnchor = id;
        }
        dragging = true;
        dragBase = ev.ctrlKey || ev.metaKey ? new Set(this.selected) : /* @__PURE__ */ new Set();
        applySelection();
        activeDocument.addEventListener(
          "pointerup",
          () => {
            dragging = false;
            this.draw();
          },
          { once: true }
        );
      });
      chip.addEventListener("pointerenter", () => {
        if (!dragging || !dragAnchor) return;
        this.selected = /* @__PURE__ */ new Set([...dragBase, ...rangeIds(dragAnchor, id)]);
        applySelection();
      });
    };
    const bar = c.createDiv({ cls: "ep-tabs" });
    const multiBtn = bar.createDiv({ cls: "ep-tab ep-tab-multi" + (this.multiTap ? " is-active" : "") });
    (0, import_obsidian24.setIcon)(multiBtn.createSpan(), "copy-check");
    multiBtn.setAttr("title", t("sectionOptions.multiSelect"));
    multiBtn.setAttr("aria-label", t("sectionOptions.multiSelect"));
    multiBtn.onclick = () => {
      this.multiTap = !this.multiTap;
      this.draw();
    };
    mk(bar, SECTION_TAB, t("sectionOptions.tabSection"));
    const mode = sectionMode(this.section);
    const groupMode = (_a = this.section.tabGroup) != null ? _a : mode === "columns" ? "column" : mode === "grid" ? "row" : "type";
    const sel = bar.createEl("select", { cls: "dropdown ep-tab-groupsel" });
    sel.setAttr("aria-label", t("sectionOptions.groupBy"));
    for (const [v, key] of [
      ["column", "sectionOptions.groupColumn"],
      ["row", "sectionOptions.groupRow"],
      ["type", "sectionOptions.groupType"]
    ]) {
      const opt = sel.createEl("option", { text: t(key) });
      opt.value = v;
    }
    sel.value = groupMode;
    sel.onchange = () => {
      this.section.tabGroup = sel.value;
      this.changed();
      this.draw();
    };
    const groups = this.tabGroups(groupMode);
    for (const g of groups) {
      if (!g.ents.length) continue;
      const row = c.createDiv({ cls: "ep-tabs" });
      if (g.label) row.createSpan({ cls: "ep-tab-collabel", text: g.label });
      for (const e of g.ents) mk(row, e.id, this.entryLabel(e));
    }
    if (!groups.length) for (const e of tabbable) mk(bar, e.id, this.entryLabel(e));
    c.createEl("p", { cls: "setting-item-description", text: t("sectionOptions.tabsHint") });
  }
  /** Divide the entries into labeled tab groups per the chosen mode. */
  tabGroups(groupMode) {
    var _a, _b;
    const t = this.view.i18n.t.bind(this.view.i18n);
    const mode = sectionMode(this.section);
    const all = this.section.entries;
    const ncol = Math.max(1, this.section.columns || 1);
    const visible = (es) => es.filter((e) => e.kind !== "blank");
    const out = [];
    if (groupMode === "column") {
      if (mode === "grid") {
        for (let cc = 0; cc < ncol; cc++)
          out.push({
            label: t("sectionOptions.columnN", { n: cc + 1 }),
            ents: visible(all.filter((_, i) => i % ncol === cc))
          });
      } else {
        const per = Math.max(1, Math.ceil(all.length / ncol));
        for (let cc = 0; cc < ncol; cc++)
          out.push({
            label: t("sectionOptions.columnN", { n: cc + 1 }),
            ents: visible(all.slice(cc * per, (cc + 1) * per))
          });
      }
    } else if (groupMode === "row") {
      if (mode === "columns") {
        const per = Math.max(1, Math.ceil(all.length / ncol));
        for (let r = 0; r < per; r++) {
          const row = [];
          for (let cc = 0; cc < ncol; cc++) {
            const e = all[cc * per + r];
            if (e) row.push(e);
          }
          out.push({ label: t("sectionOptions.rowN", { n: r + 1 }), ents: visible(row) });
        }
      } else {
        const width = mode === "grid" ? ncol : 1;
        for (let i = 0; i < all.length; i += width)
          out.push({
            label: t("sectionOptions.rowN", { n: Math.floor(i / width) + 1 }),
            ents: visible(all.slice(i, i + width))
          });
      }
    } else {
      const byType = /* @__PURE__ */ new Map();
      for (const e of visible(all)) {
        const label = e.kind === "prop" ? (_b = (_a = this.view.registries.valueTypes.get(this.view.resolveType(e))) == null ? void 0 : _a.name(this.view.i18n)) != null ? _b : this.view.resolveType(e) : this.view.defaultLabelFor(e);
        if (!byType.has(label)) byType.set(label, []);
        byType.get(label).push(e);
      }
      for (const [label, ents] of byType) out.push({ label, ents });
    }
    return out.filter((g) => g.ents.length);
  }
  draw() {
    const c = this.contentEl;
    const t = this.view.i18n.t.bind(this.view.i18n);
    for (const id of [...this.selected])
      if (id !== SECTION_TAB && !this.section.entries.some((e) => e.id === id)) this.selected.delete(id);
    if (!this.selected.size) this.selected.add(SECTION_TAB);
    c.empty();
    c.addClass("ep-options");
    c.createEl("h3", { text: t("sectionOptions.title", { name: this.section.title }) });
    this.drawTabs(c);
    const targets = this.tabTargets();
    const withSection = this.selected.has(SECTION_TAB);
    if (withSection && !targets.length) {
      this.drawSectionBody(c);
    } else if (!withSection && targets.length === 1 && this.file) {
      const entry = targets[0];
      const octx = {
        view: this.view,
        file: this.file,
        section: this.section,
        entry,
        container: c,
        changed: () => this.changed(),
        redraw: () => this.draw()
      };
      renderEntryOptionsBody(octx, () => this.close(), () => this.draw());
    } else if (!withSection && targets.length > 1 && this.file && targets.every((e) => e.kind === "prop") && new Set(targets.map((e) => this.view.resolveType(e))).size === 1) {
      this.drawMultiSameType(c, targets);
    } else {
      this.drawSharedBody(c, targets, withSection);
    }
  }
  /**
   * Multi-edit for selections that share one data type: every option is
   * visible. The UI edits a proxy of the first entry; whenever a setting
   * changes, exactly the fields that changed are copied to all selected
   * entries (identity fields are excluded). Settings whose values differ
   * across the selection are listed in the note on top - changing one
   * writes it to all.
   */
  drawMultiSameType(c, ents) {
    var _a, _b;
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    const SKIP = /* @__PURE__ */ new Set(["id", "key", "alias", "__multi"]);
    const typeId = view.resolveType(ents[0]);
    const typeName = (_b = (_a = view.registries.valueTypes.get(typeId)) == null ? void 0 : _a.name(view.i18n)) != null ? _b : typeId;
    const allKeys = /* @__PURE__ */ new Set();
    for (const e of ents) for (const k of Object.keys(e)) if (!SKIP.has(k)) allKeys.add(k);
    const mixed = [...allKeys].filter((k) => {
      const first = JSON.stringify(ents[0][k]);
      return ents.some((e) => JSON.stringify(e[k]) !== first);
    });
    let note = t("options.multiNote", { n: ents.length, type: typeName });
    if (mixed.length) note += " " + t("options.multiMixed", { list: mixed.sort().join(", ") });
    c.createEl("p", { cls: "setting-item-description ep-multi-note", text: note });
    const proxy = JSON.parse(JSON.stringify(ents[0]));
    proxy["__multi"] = true;
    let snap = JSON.stringify(proxy);
    const applyDiff = () => {
      const cur = proxy;
      const old = JSON.parse(snap);
      for (const k of /* @__PURE__ */ new Set([...Object.keys(cur), ...Object.keys(old)])) {
        if (SKIP.has(k)) continue;
        const now = JSON.stringify(cur[k]);
        if (now === JSON.stringify(old[k])) continue;
        for (const e of ents) {
          if (cur[k] === void 0) delete e[k];
          else e[k] = JSON.parse(now);
        }
      }
      snap = JSON.stringify(proxy);
      this.changed();
    };
    const octx = {
      view,
      file: this.file,
      section: this.section,
      entry: proxy,
      container: c,
      changed: applyDiff,
      redraw: () => this.draw()
    };
    renderEntryOptionsBody(octx, () => this.close(), () => this.draw(), { multi: true });
  }
  // -- shared multi-edit ------------------------------------------------------
  /**
   * Settings common to every selected target. Each control shows the first
   * target's value (with a "mixed" note when they differ) and writes to all
   * targets only when the user changes it.
   */
  drawSharedBody(c, ents, withSection) {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    const targets = withSection ? [this.section, ...ents] : [...ents];
    c.createEl("h4", { text: t("options.sharedHeading", { n: targets.length }) });
    const read = (get) => {
      const first = get(targets[0]);
      return { v: first, mixed: targets.some((x) => get(x) !== first) };
    };
    const apply = (set) => {
      for (const x of targets) set(x);
      this.changed();
    };
    const mixedDesc = (mixed) => mixed ? t("options.mixed") : "";
    const host = viewColorHost(view);
    addIconSetting(
      view.app,
      view.i18n,
      c,
      t("options.icon"),
      () => read((x) => x["icon"]).v,
      (v) => apply((x) => x["icon"] = v)
    );
    addColorSetting(
      host,
      c,
      t("options.iconColor"),
      "",
      () => read((x) => x["iconColor"]).v,
      (v) => apply((x) => x["iconColor"] = v)
    );
    {
      const s = read((x) => !x["hideLabel"]);
      new import_obsidian24.Setting(c).setName(t("options.showLabel")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => x["hideLabel"] = v ? void 0 : true));
      });
    }
    {
      const s = read((x) => x["hideIfEmpty"] === false);
      new import_obsidian24.Setting(c).setName(t("options.showWhenEmpty")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => x["hideIfEmpty"] = v ? false : void 0));
      });
    }
    if (withSection) {
      const sec = this.section;
      new import_obsidian24.Setting(c).setName(t("options.showWhen")).setDesc(t("sectionOptions.showWhenDesc")).addText((tx) => {
        var _a;
        const mark = () => {
          const v = tx.getValue().trim();
          tx.inputEl.toggleClass("ep-invalid", !!v && !parseExpr(v));
        };
        tx.setPlaceholder('Class == "Wizard"').setValue((_a = sec.showWhen) != null ? _a : "");
        mark();
        tx.onChange((v) => {
          sec.showWhen = v.trim() || void 0;
          mark();
          this.changed();
        });
      });
    }
    if (!withSection) {
      const sizeRow = (nameKey, field) => {
        const s = read((x) => {
          var _a;
          return (_a = x[field]) != null ? _a : 0;
        });
        new import_obsidian24.Setting(c).setName(t(nameKey)).setDesc(s.mixed ? t("options.mixed") : t("options.sizeDesc")).addSlider((sl) => {
          sl.setLimits(0, 40, 1).setValue(s.v).onChange((v) => apply((x) => x[field] = v || void 0));
        });
      };
      sizeRow("options.labelSize", "labelSize");
      sizeRow("options.valueSize", "valueSize");
      addColorSetting(
        host,
        c,
        t("options.labelColor"),
        "",
        () => read((x) => x["labelColor"]).v,
        (v) => apply((x) => x["labelColor"] = v)
      );
      addColorSetting(
        host,
        c,
        t("options.valueColor"),
        "",
        () => read((x) => x["valueColor"]).v,
        (v) => apply((x) => x["valueColor"] = v)
      );
      const allProps = ents.every((e) => e.kind === "prop");
      if (allProps) {
        const s = read((x) => !!x["showInObsidian"]);
        new import_obsidian24.Setting(c).setName(t("options.showInObsidian")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
          tg.setValue(s.v).onChange((v) => apply((x) => x["showInObsidian"] = v || void 0));
        });
        {
          const ty = read((x) => x["showType"] !== false);
          new import_obsidian24.Setting(c).setName(t("options.showType")).setDesc(mixedDesc(ty.mixed)).addToggle((tg) => {
            tg.setValue(ty.v).onChange((v) => apply((x) => x["showType"] = v ? void 0 : false));
          });
        }
        const types = ents.map((e) => view.resolveType(e));
        if (types.every((ty) => NUMERIC_SET.has(ty))) {
          c.createEl("h4", { text: t("options.numberHeading") });
          const sl = read((x) => !!x["slider"]);
          new import_obsidian24.Setting(c).setName(t("options.showSlider")).setDesc(mixedDesc(sl.mixed)).addToggle((tg) => {
            tg.setValue(sl.v).onChange((v) => apply((x) => x["slider"] = v || void 0));
          });
          const st = read((x) => x["steppers"] !== false);
          new import_obsidian24.Setting(c).setName(t("options.showSteppers")).setDesc(mixedDesc(st.mixed)).addToggle((tg) => {
            tg.setValue(st.v).onChange((v) => apply((x) => x["steppers"] = v ? void 0 : false));
          });
          const cu = read((x) => x["sliderCurve"] || "linear");
          new import_obsidian24.Setting(c).setName(t("options.sliderCurve")).setDesc(mixedDesc(cu.mixed)).addDropdown((d) => {
            d.addOption("linear", t("options.curveLinear"));
            d.addOption("root", t("options.curveRoot"));
            d.addOption("exp", t("options.curveExp"));
            d.setValue(cu.v);
            d.onChange((v) => apply((x) => x["sliderCurve"] = v === "linear" ? void 0 : v));
          });
          const numRow = (nameKey, field) => {
            const s2 = read((x) => x[field]);
            new import_obsidian24.Setting(c).setName(t(nameKey)).setDesc(s2.mixed ? t("options.mixed") : t("options.rangeAuto")).addText((tx) => {
              tx.setValue(s2.mixed || s2.v === void 0 ? "" : String(s2.v)).onChange((v) => {
                const n = Number(v);
                const val = v.trim() === "" || !Number.isFinite(n) ? void 0 : n;
                apply((x) => x[field] = val);
              });
            });
          };
          numRow("options.minimum", "min");
          numRow("options.maximum", "max");
          const cl = read((x) => !!x["clamp"]);
          new import_obsidian24.Setting(c).setName(t("options.clamp")).setDesc(mixedDesc(cl.mixed)).addToggle((tg) => {
            tg.setValue(cl.v).onChange((v) => apply((x) => x["clamp"] = v || void 0));
          });
        }
        if (types.every((ty) => MODIFIABLE_SET.has(ty))) {
          const ro = read((x) => !!x["roll"]);
          new import_obsidian24.Setting(c).setName(t("roll.options.rollButton")).setDesc(mixedDesc(ro.mixed)).addToggle((tg) => {
            tg.setValue(ro.v).onChange((v) => apply((x) => x["roll"] = v || void 0));
          });
          const ch = read((x) => x["showChain"] !== false);
          new import_obsidian24.Setting(c).setName(t("mods.showChain")).setDesc(mixedDesc(ch.mixed)).addToggle((tg) => {
            tg.setValue(ch.v).onChange((v) => apply((x) => x["showChain"] = v ? void 0 : false));
          });
          const di = read((x) => x["showDice"] !== false);
          new import_obsidian24.Setting(c).setName(t("mods.showDice")).setDesc(mixedDesc(di.mixed)).addToggle((tg) => {
            tg.setValue(di.v).onChange((v) => apply((x) => x["showDice"] = v ? void 0 : false));
          });
        }
      }
    }
    new import_obsidian24.Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
  }
  // -- the section's own tab ---------------------------------------------------
  drawSectionBody(c) {
    const s = this.section;
    const t = this.view.i18n.t.bind(this.view.i18n);
    const host = viewColorHost(this.view);
    c.createEl("h4", { text: t("sectionOptions.sectionHeading") });
    new import_obsidian24.Setting(c).setName(t("sectionOptions.name")).setDesc(t("sectionOptions.nameDesc")).addText((tx) => {
      tx.setPlaceholder(t("section.namePlaceholder")).setValue(s.title).onChange((v) => {
        s.title = v.trim() || t("section.namePlaceholder");
        this.changed();
      });
    });
    addIconSetting(this.view.app, this.view.i18n, c, t("options.icon"), () => s.icon, (v) => {
      s.icon = v;
      this.changed();
    });
    addColorSetting(host, c, t("options.iconColor"), "", () => s.iconColor, (v) => {
      s.iconColor = v;
      this.changed();
    });
    new import_obsidian24.Setting(c).setName(t("options.showLabel")).addToggle((tg) => {
      tg.setValue(!s.hideLabel).onChange((v) => {
        s.hideLabel = v ? void 0 : true;
        this.changed();
      });
    });
    new import_obsidian24.Setting(c).setName(t("sectionOptions.collapsible")).addToggle((tg) => {
      tg.setValue(s.collapsible !== false).onChange((v) => {
        s.collapsible = v;
        if (!v) s.collapsed = false;
        this.changed();
      });
    });
    new import_obsidian24.Setting(c).setName(t("sectionOptions.dividers")).addToggle((tg) => {
      tg.setValue(!!s.dividers).onChange((v) => {
        s.dividers = v || void 0;
        this.changed();
      });
    });
    if (sectionMode(s) === "grid") {
      new import_obsidian24.Setting(c).setName(t("sectionOptions.trimEmptyRows")).setDesc(t("sectionOptions.trimEmptyRowsDesc")).addToggle((tg) => {
        tg.setValue(!!s.trimEmptyRows).onChange((v) => {
          s.trimEmptyRows = v || void 0;
          this.view.saveLayout();
          this.view.rerender();
        });
      });
    }
    new import_obsidian24.Setting(c).setName(t("sectionOptions.vdividers")).addToggle((tg) => {
      tg.setValue(!!s.vdividers).onChange((v) => {
        s.vdividers = v || void 0;
        this.changed();
      });
    });
    new import_obsidian24.Setting(c).setName(t("options.showWhenEmpty")).setDesc(t("sectionOptions.showWhenEmptyDesc")).addToggle((tg) => {
      tg.setValue(s.hideIfEmpty === false).onChange((v) => {
        s.hideIfEmpty = v ? false : void 0;
        this.changed();
      });
    });
    c.createEl("h4", { text: t("sectionOptions.layoutHeading") });
    const mode = sectionMode(s);
    new import_obsidian24.Setting(c).setName(t("sectionOptions.layout")).setDesc(t("sectionOptions.layoutDesc")).addDropdown((d) => {
      d.addOption("list", t("layout.list"));
      d.addOption("columns", t("layout.columns"));
      d.addOption("grid", t("layout.grid"));
      d.setValue(mode);
      d.onChange((v) => {
        s.layoutMode = v;
        this.changed();
        this.draw();
      });
    });
    const colSet = new import_obsidian24.Setting(c).setName(t("sectionOptions.columns"));
    colSet.addText((tx) => {
      tx.setDisabled(mode === "list");
      tx.setValue(String(s.columns || 2)).onChange((v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n > 0) {
          s.columns = n;
          this.changed();
        }
      });
    });
    if (mode === "list") colSet.settingEl.addClass("ep-disabled");
    const rowSet = new import_obsidian24.Setting(c).setName(t("sectionOptions.rows")).setDesc(t("sectionOptions.rowsDesc"));
    rowSet.addText((tx) => {
      tx.setDisabled(mode !== "grid");
      tx.setValue(String(s.rows || 0)).onChange((v) => {
        const n = parseInt(v);
        s.rows = Number.isFinite(n) && n > 0 ? n : void 0;
        this.changed();
      });
    });
    if (mode !== "grid") rowSet.settingEl.addClass("ep-disabled");
    new import_obsidian24.Setting(c).setName(t("sectionOptions.transparent")).addToggle((tg) => {
      tg.setValue(!!s.transparent).onChange((v) => {
        s.transparent = v || void 0;
        this.changed();
      });
    });
    new import_obsidian24.Setting(c).setName(t("sectionOptions.pin")).setDesc(t("sectionOptions.pinDesc")).addDropdown((d) => {
      d.addOption("body", t("pin.body"));
      d.addOption("header", t("pin.header"));
      d.addOption("footer", t("pin.footer"));
      d.setValue(sectionPin(s));
      d.onChange((v) => {
        s.pin = v === "body" ? void 0 : v;
        s.sticky = void 0;
        this.changed();
      });
    });
    new import_obsidian24.Setting(c).setName(t("sectionOptions.height")).setDesc(t("sectionOptions.heightDesc")).addDropdown((d) => {
      d.addOption("unlimited", t("size.unlimited"));
      d.addOption("s", t("size.smallRows"));
      d.addOption("m", t("size.mediumRows"));
      d.addOption("l", t("size.largeRows"));
      d.setValue(s.size || "unlimited");
      d.onChange((v) => {
        s.size = v;
        this.changed();
      });
    });
    c.createEl("h4", { text: t("sectionOptions.colorsHeading") });
    addColorSetting(host, c, t("sectionOptions.accent"), t("sectionOptions.accentDesc"), () => s.accent, (v) => {
      s.accent = v;
      this.changed();
    });
    addColorSetting(host, c, t("sectionOptions.background"), "", () => s.bg, (v) => {
      s.bg = v;
      this.changed();
    });
    addColorSetting(host, c, t("sectionOptions.controls"), t("sectionOptions.controlsDesc"), () => s.controlColor, (v) => {
      s.controlColor = v;
      this.changed();
    });
    c.createEl("h4", { text: t("sectionOptions.titleHeading") });
    new import_obsidian24.Setting(c).setName(t("sectionOptions.titleSize")).setDesc(t("options.sizeDesc")).addSlider((sl) => {
      var _a;
      sl.setLimits(0, 48, 1).setValue((_a = s.titleSize) != null ? _a : 0).onChange((v) => {
        s.titleSize = v || void 0;
        this.changed();
      });
    });
    new import_obsidian24.Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
  }
  onClose() {
    this.contentEl.empty();
    if (JSON.stringify(this.section) !== this.snapshot) {
      new ConfirmChangesModal(this.view.app, this.view.i18n, () => {
      }, () => {
        restoreFromSnapshot(this.section, this.snapshot);
        this.changed();
      }).open();
    }
  }
};

// src/ui/drag.ts
function flipMove(view, fn) {
  const first = /* @__PURE__ */ new Map();
  view.containerEl.findAll("[data-ep-id]").forEach((el) => first.set(el.getAttribute("data-ep-id"), el.getBoundingClientRect()));
  fn();
  window.requestAnimationFrame(() => {
    view.containerEl.findAll("[data-ep-id]").forEach((el) => {
      const id = el.getAttribute("data-ep-id");
      const f = id ? first.get(id) : void 0;
      if (!f) return;
      const n = el.getBoundingClientRect();
      const dx = f.left - n.left, dy = f.top - n.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const h = el;
      h.setCssStyles({ transition: "none", transform: `translate(${dx}px, ${dy}px)` });
      window.requestAnimationFrame(() => {
        h.setCssStyles({ transition: "transform .25s ease", transform: "" });
        const done = () => {
          h.setCssStyles({ transition: "", transform: "" });
          h.removeEventListener("transitionend", done);
        };
        h.addEventListener("transitionend", done);
      });
    });
  });
}
var DragController = class {
  constructor(view) {
    this.view = view;
  }
  // -- sections (pointer drag, touch-friendly) ------------------------------
  attachSection(det, _grid, section) {
    const grip = det.querySelector(".ep-section-title .ep-grip");
    if (!grip) return;
    grip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      this.startSectionDrag(e, det, section);
    });
  }
  startSectionDrag(ev, det, section) {
    ev.preventDefault();
    ev.stopPropagation();
    const view = this.view;
    det.addClass("ep-drag-placeholder");
    let target = null;
    let after = false;
    const onMove = (e) => {
      var _a;
      const under = activeDocument.elementFromPoint(e.clientX, e.clientY);
      const sec = (_a = under == null ? void 0 : under.closest(".ep-section")) != null ? _a : null;
      this.clearMarks();
      target = null;
      if (!sec || sec === det) return;
      const r = sec.getBoundingClientRect();
      after = e.clientY - r.top > r.height / 2;
      this.mark(sec, after);
      target = sec;
    };
    const onUp = () => {
      activeDocument.removeEventListener("pointermove", onMove);
      activeDocument.removeEventListener("pointerup", onUp);
      activeDocument.removeEventListener("pointercancel", onUp);
      det.removeClass("ep-drag-placeholder");
      const t = target;
      const a = after;
      this.clearMarks();
      if (!t) return;
      const targetId = (t.getAttribute("data-ep-id") || "").slice(2);
      if (!targetId) return;
      flipMove(view, () => {
        if (moveSectionTo(view.layout, section.id, targetId, a)) {
          view.saveLayout();
          view.rerender();
        }
      });
    };
    activeDocument.addEventListener("pointermove", onMove);
    activeDocument.addEventListener("pointerup", onUp);
    activeDocument.addEventListener("pointercancel", onUp);
  }
  // -- entries (pointer drag with clone) ------------------------------------
  attachEntry(wrap, grip, section, entry) {
    grip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      this.startEntryDrag(e, wrap, section, entry);
    });
  }
  startEntryDrag(ev, wrap, section, entry) {
    ev.preventDefault();
    const view = this.view;
    const rect = wrap.getBoundingClientRect();
    const ox = ev.clientX - rect.left, oy = ev.clientY - rect.top;
    const clone2 = wrap.cloneNode(true);
    clone2.addClass("ep-drag-clone");
    clone2.setCssStyles({
      position: "fixed",
      left: "0",
      top: "0",
      width: rect.width + "px",
      margin: "0",
      pointerEvents: "none",
      zIndex: "9999"
    });
    activeDocument.body.appendChild(clone2);
    const moveClone = (cx, cy) => {
      clone2.setCssStyles({ transform: `translate(${cx - ox}px, ${cy - oy}px)` });
    };
    moveClone(ev.clientX, ev.clientY);
    wrap.addClass("ep-drag-placeholder");
    let swapEl = null;
    let gridTarget = null;
    const clearSwap = () => {
      if (swapEl) {
        swapEl.removeClass("ep-swap-target");
        swapEl = null;
      }
      if (gridTarget) {
        gridTarget.removeClass("ep-swap-target");
        gridTarget = null;
      }
    };
    const flip = (container, fn) => {
      const els = Array.from(container.querySelectorAll(".ep-entry"));
      const first = /* @__PURE__ */ new Map();
      els.forEach((el) => first.set(el, el.getBoundingClientRect()));
      fn();
      els.forEach((el) => {
        const f = first.get(el);
        if (!f) return;
        const n = el.getBoundingClientRect();
        const dx = f.left - n.left, dy = f.top - n.top;
        if (!dx && !dy) return;
        el.setCssStyles({ transition: "none", transform: `translate(${dx}px, ${dy}px)` });
        window.requestAnimationFrame(() => {
          el.setCssStyles({ transition: "transform .18s ease", transform: "" });
          const done = () => {
            el.setCssStyles({ transition: "" });
            el.removeEventListener("transitionend", done);
          };
          el.addEventListener("transitionend", done);
        });
      });
    };
    const onMove = (e) => {
      moveClone(e.clientX, e.clientY);
      const under = activeDocument.elementFromPoint(e.clientX, e.clientY);
      if (!under) return;
      const grid = under.closest(".ep-grid");
      if (!grid) return;
      const isGrid = grid.classList.contains("ep-mode-grid");
      clearSwap();
      if (isGrid) {
        const cell = under.closest(".ep-entry, .ep-empty-cell");
        if (cell && cell !== wrap) {
          gridTarget = cell;
          cell.addClass("ep-swap-target");
        }
        return;
      }
      const targetEntry = under.closest(".ep-entry");
      if (targetEntry && targetEntry !== wrap) {
        const r = targetEntry.getBoundingClientRect();
        const relX = e.clientX - (r.left + r.width / 2);
        const relY = e.clientY - (r.top + r.height / 2);
        const after = Math.abs(relX) > Math.abs(relY) ? relX > 0 : relY > 0;
        const parent = targetEntry.parentElement;
        const refNode = after ? targetEntry.nextSibling : targetEntry;
        if (wrap.parentElement !== parent || wrap.nextSibling !== refNode)
          flip(grid, () => parent.insertBefore(wrap, refNode));
      } else {
        const cell = under.closest(".ep-empty-cell");
        if (cell) {
          flip(grid, () => grid.insertBefore(wrap, cell));
        } else {
          const cont = under.closest(".ep-col") || grid;
          if ((cont.classList.contains("ep-col") || cont.classList.contains("ep-grid")) && wrap.parentElement !== cont)
            flip(grid, () => cont.appendChild(wrap));
        }
      }
    };
    const onUp = () => {
      activeDocument.removeEventListener("pointermove", onMove);
      activeDocument.removeEventListener("pointerup", onUp);
      activeDocument.removeEventListener("pointercancel", onUp);
      clone2.remove();
      wrap.removeClass("ep-drag-placeholder");
      const commit2 = (mutate) => {
        if (mutate()) {
          view.saveLayout();
        }
        view.rerender();
      };
      if (gridTarget) {
        const tid = (gridTarget.getAttribute("data-ep-id") || "").slice(2);
        gridTarget.removeClass("ep-swap-target");
        if (tid) commit2(() => swapEntries(view.layout, entry.id, tid));
        else commit2(() => moveLeavingBlank(view.layout, entry.id, section.id));
        return;
      }
      if (swapEl) {
        const otherId = (swapEl.getAttribute("data-ep-id") || "").slice(2);
        swapEl.removeClass("ep-swap-target");
        if (otherId) {
          commit2(() => swapEntries(view.layout, entry.id, otherId));
          return;
        }
      }
      const secEl = wrap.closest(".ep-section");
      const toId = secEl ? (secEl.getAttribute("data-ep-id") || "s:").slice(2) : section.id;
      const order = secEl ? Array.from(secEl.querySelectorAll(".ep-entry")).map((el) => (el.getAttribute("data-ep-id") || "").slice(2)).filter(Boolean) : [];
      commit2(() => reorderByDomOrder(view.layout, entry.id, section.id, toId, order));
    };
    activeDocument.addEventListener("pointermove", onMove);
    activeDocument.addEventListener("pointerup", onUp);
    activeDocument.addEventListener("pointercancel", onUp);
  }
  // -- drop markers ---------------------------------------------------------
  mark(el, after) {
    el.removeClasses(["ep-drop-top", "ep-drop-bottom"]);
    el.addClass(after ? "ep-drop-bottom" : "ep-drop-top");
  }
  clearMarks() {
    this.view.containerEl.findAll(".ep-drop-top, .ep-drop-bottom").forEach(
      (el) => el.removeClasses(["ep-drop-top", "ep-drop-bottom"])
    );
    this.view.containerEl.findAll(".ep-dragging").forEach((el) => el.removeClass("ep-dragging"));
  }
};

// src/ui/menus/section-menu.ts
function openSectionMenu(e, view, section) {
  const t = view.i18n.t.bind(view.i18n);
  const menu = new import_obsidian25.Menu();
  menu.addItem(
    (i) => i.setTitle(t("section.menu.configure", { name: section.title })).setIcon("settings").onClick(() => new SectionOptionsModal(view, section).open())
  );
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle(section.dividers ? t("section.menu.hideDividers") : t("section.menu.showDividers")).onClick(() => {
      section.dividers = !section.dividers;
      view.saveLayout();
      view.rerender();
    })
  );
  menu.addItem(
    (i) => i.setTitle(section.vdividers ? t("section.menu.hideVDividers") : t("section.menu.showVDividers")).onClick(() => {
      section.vdividers = !section.vdividers;
      view.saveLayout();
      view.rerender();
    })
  );
  menu.addItem(
    (i) => i.setTitle(section.collapsible === false ? t("section.menu.enableCollapse") : t("section.menu.disableCollapse")).onClick(() => {
      section.collapsible = section.collapsible === false;
      if (section.collapsible === false) section.collapsed = false;
      view.saveLayout();
      view.rerender();
    })
  );
  const addable = view.registries.entryKinds.all().filter((k) => k.addable);
  if (addable.length) {
    menu.addItem(
      (i) => i.setTitle(t("section.menu.addObject")).setIcon("plus-circle").onClick(() => {
        const m2 = new import_obsidian25.Menu();
        for (const kind of addable) {
          m2.addItem(
            (x) => x.setTitle(kind.defaultLabel(view.i18n, { id: "", kind: kind.id })).onClick(() => {
              section.entries.push({ id: genId(), kind: kind.id });
              view.saveLayout();
              view.rerender();
            })
          );
        }
        m2.showAtMouseEvent(e);
      })
    );
  }
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle(t("section.menu.moveUp")).setIcon("arrow-up").onClick(
      () => flipMove(view, () => {
        if (moveSectionBy(view.layout, section.id, -1)) {
          view.saveLayout();
          view.rerender();
        }
      })
    )
  );
  menu.addItem(
    (i) => i.setTitle(t("section.menu.moveDown")).setIcon("arrow-down").onClick(
      () => flipMove(view, () => {
        if (moveSectionBy(view.layout, section.id, 1)) {
          view.saveLayout();
          view.rerender();
        }
      })
    )
  );
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle(t("section.menu.export")).setIcon("clipboard-copy").onClick(() => {
      var _a;
      const doc = packSection(section, view.settings.derivations);
      void ((_a = navigator.clipboard) == null ? void 0 : _a.writeText(JSON.stringify(doc, null, 2)));
      new import_obsidian25.Notice(t("transfer.copied"));
    })
  );
  menu.addItem(
    (i) => i.setTitle(t("section.menu.delete")).setIcon("trash").onClick(() => {
      view.layout.sections = view.layout.sections.filter((s) => s.id !== section.id);
      view.saveLayout();
      view.rerender();
    })
  );
  menu.showAtMouseEvent(e);
}

// src/ui/render/section-renderer.ts
var SIZE_ROWS = { s: 4, m: 8, l: 12 };
var ROW_PX = 32;
function computeFlags(view, file, section) {
  var _a;
  const flags = emptyFlags();
  for (const entry of section.entries) {
    const kind = view.registries.entryKinds.get(entry.kind);
    mergeNeeds(flags, (_a = kind == null ? void 0 : kind.clusterNeeds) == null ? void 0 : _a.call(kind, { view, file, section, entry }));
  }
  return flags;
}
function entryFlags(view, file, section, entry) {
  var _a;
  const flags = emptyFlags();
  const kind = view.registries.entryKinds.get(entry.kind);
  mergeNeeds(flags, (_a = kind == null ? void 0 : kind.clusterNeeds) == null ? void 0 : _a.call(kind, { view, file, section, entry }));
  return flags;
}
function alignClustersNow(det) {
  var _a, _b;
  for (const el of det.findAll(".ep-mode-grid .ep-cluster [data-ep-slot], .ep-mode-grid .ep-cluster .ep-num")) {
    el.setCssStyles({ minWidth: "" });
    const w = el.offsetWidth;
    if (w > 0) el.setCssStyles({ minWidth: w + "px" });
  }
  const groups = /* @__PURE__ */ new Map();
  for (const el of det.findAll(".ep-cluster [data-ep-slot]")) {
    if (el.closest(".ep-mode-grid")) continue;
    const id = (_a = el.getAttribute("data-ep-slot")) != null ? _a : "";
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(el);
  }
  groups.set(" num", det.findAll(".ep-cluster .ep-num").filter((n) => !n.closest(".ep-mode-grid")));
  for (const els of groups.values()) {
    if (els.length < 2) continue;
    let max = 0;
    const widths = /* @__PURE__ */ new Map();
    for (const el of els) {
      el.setCssStyles({ minWidth: "" });
      const w = el.offsetWidth;
      widths.set(el, w);
      max = Math.max(max, w);
    }
    if (max <= 0) continue;
    for (const el of els) {
      el.setCssStyles({ minWidth: ((_b = widths.get(el)) != null ? _b : 0) > 0 ? max + "px" : "" });
    }
  }
}
function alignClusters(det) {
  window.requestAnimationFrame(() => alignClustersNow(det));
}
function renderSection(parent, view, file, section, drag, host) {
  var _a;
  const t = view.i18n.t.bind(view.i18n);
  if (!view.editMode && section.showWhen && !view.condVisible(section.showWhen)) return;
  if (!view.editMode && section.hideIfEmpty !== false) {
    const hasContent = section.entries.some((e) => !isHiddenEntry(view, e));
    if (!hasContent) return;
  }
  const det = parent.createDiv({ cls: "ep-section" });
  host.registerSectionEl(section.id, det);
  if (view.editMode && section.showWhen && !view.condVisible(section.showWhen)) det.addClass("ep-cond-off");
  det.setAttr("data-ep-id", "s:" + section.id);
  if (sectionPin(section) === "body") det.addClass("ep-flow-section");
  if (section.transparent) det.addClass("ep-transparent");
  if (section.accent) det.setCssProps({ "--ep-accent": section.accent });
  if (section.controlColor) det.setCssProps({ "--ep-control": section.controlColor });
  det.setCssProps({
    "--ep-title-bg": section.transparent ? "var(--background-primary)" : section.bg || "var(--background-secondary)"
  });
  if (section.bg && !section.transparent) det.setCssStyles({ background: section.bg });
  const collapsible = section.collapsible !== false;
  const sum = det.createDiv({ cls: "ep-section-title" });
  if (collapsible) {
    const chev = sum.createSpan({ cls: "ep-chev" });
    (0, import_obsidian26.setIcon)(chev, "chevron-right");
    chev.toggleClass("ep-open", !section.collapsed);
  }
  if (view.editMode) {
    const grip = sum.createSpan({ cls: "ep-grip", text: "::" });
    grip.setAttr("title", t("section.dragHint"));
    grip.onclick = (e) => e.stopPropagation();
  }
  if (section.icon) {
    const ic = sum.createSpan({ cls: "ep-ticon" });
    (0, import_obsidian26.setIcon)(ic, section.icon);
    if (section.iconColor) ic.setCssStyles({ color: section.iconColor });
  }
  const showLabel = view.editMode || !section.hideLabel;
  if (showLabel) {
    const titleSpan = sum.createSpan({ cls: "ep-sec-name" });
    if (section.titleSize) titleSpan.setCssStyles({ fontSize: section.titleSize + "px" });
    if (section.accent) titleSpan.setCssStyles({ color: section.accent });
    if (view.editMode) {
      bindRename(titleSpan, section.title, t("section.namePlaceholder"), t("section.renameHint"), (v) => {
        section.title = v || t("section.namePlaceholder");
        view.saveLayout();
        view.rerender();
      });
      if (section.hideLabel) titleSpan.addClass("ep-dim");
    } else {
      titleSpan.setText(section.title);
    }
  }
  sum.createSpan({ cls: "ep-spacer" });
  if (view.editMode) {
    const cmode = sectionMode(section);
    const modeBtn = sum.createSpan({ cls: "ep-icon-btn" });
    (0, import_obsidian26.setIcon)(modeBtn, cmode === "grid" ? "layout-grid" : cmode === "columns" ? "columns" : "list");
    modeBtn.setAttr("title", t("section.layoutHint", { mode: t("layout." + cmode) }));
    modeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const order = ["list", "columns", "grid"];
      section.layoutMode = order[(order.indexOf(cmode) + 1) % 3];
      view.saveLayout();
      view.rerender();
    };
    const pin = sectionPin(section);
    const pinBtn = sum.createSpan({ cls: "ep-icon-btn" });
    (0, import_obsidian26.setIcon)(pinBtn, pin === "header" ? "arrow-up-to-line" : pin === "footer" ? "arrow-down-to-line" : "pin");
    pinBtn.setAttr("title", t("section.pinCycleHint", { zone: t("pin." + pin) }));
    if (pin !== "body") pinBtn.addClass("is-active");
    pinBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const order = ["body", "header", "footer"];
      const next = order[(order.indexOf(pin) + 1) % order.length];
      section.pin = next === "body" ? void 0 : next;
      section.sticky = void 0;
      view.saveLayout();
      view.rerender();
    };
    const menuBtn = sum.createSpan({ cls: "ep-menu-btn", text: "..." });
    menuBtn.setAttr("title", t("section.optionsHint"));
    menuBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSectionMenu(e, view, section);
    };
  }
  sum.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openSectionMenu(e, view, section);
  });
  const collapseWrap = det.createDiv({ cls: "ep-collapse" });
  const body = collapseWrap.createDiv({ cls: "ep-section-body" });
  const flags = computeFlags(view, file, section);
  const mode = sectionMode(section);
  const ncol = Math.max(1, section.columns || 1);
  let colRail = null;
  let rowRail = null;
  if (view.editMode && mode !== "list") colRail = body.createDiv({ cls: "ep-colrail" });
  const gflex = view.editMode && mode === "grid" ? body.createDiv({ cls: "ep-gridflex" }) : body;
  if (view.editMode && mode === "grid") rowRail = gflex.createDiv({ cls: "ep-rowrail" });
  const grid = gflex.createDiv({ cls: "ep-grid ep-mode-" + mode });
  if (mode !== "list") grid.setAttr("data-ep-cols", String(ncol));
  if (section.dividers) grid.addClass("ep-dividers");
  if (section.vdividers) grid.addClass("ep-vdividers");
  if (section.size && section.size !== "unlimited") {
    const rows = (_a = SIZE_ROWS[section.size]) != null ? _a : 12;
    grid.setCssStyles({ maxHeight: rows * ROW_PX + "px", overflowY: "auto" });
  }
  if (mode === "list") {
    for (const entry of section.entries) renderEntry(grid, view, file, section, entry, flags, drag);
    if (view.editMode) {
      const add = body.createDiv({ cls: "ep-add" });
      const ab = add.createEl("button", { cls: "ep-add-input ep-addbtn", text: t("entry.addProperty") });
      ab.onclick = () => view.openAddMenu(ab, section);
    }
  } else if (mode === "columns") {
    grid.setCssStyles({ gridTemplateColumns: `repeat(${ncol}, minmax(0, 1fr))` });
    const per = Math.max(1, Math.ceil(section.entries.length / ncol));
    for (let cc = 0; cc < ncol; cc++) {
      const col = grid.createDiv({ cls: "ep-col" });
      for (const entry of section.entries.slice(cc * per, (cc + 1) * per))
        renderEntry(col, view, file, section, entry, flags, drag);
      if (view.editMode) {
        const insertAt = Math.min((cc + 1) * per, section.entries.length);
        const ab = col.createEl("button", { cls: "ep-mini-btn ep-coladd", text: t("entry.addProperty") });
        ab.setAttr("title", t("entry.addToColumnHint", { section: section.title }));
        ab.onclick = () => view.openAddMenu(ab, section, { index: insertAt });
      }
    }
  } else {
    grid.setCssStyles({ gridTemplateColumns: `repeat(${ncol}, minmax(0, 1fr))` });
    if (section.rows && section.rows > 0) grid.setCssStyles({ gridTemplateRows: `repeat(${section.rows}, auto)` });
    let entries = section.entries;
    if (section.trimEmptyRows && !view.editMode && ncol > 0) {
      const rowHasContent = (r) => {
        for (const e of section.entries.slice(r * ncol, (r + 1) * ncol)) {
          if (e.kind === "prop" ? !isHiddenEntry(view, e) : e.kind !== "blank") return true;
        }
        return false;
      };
      const rows = Math.ceil(section.entries.length / ncol);
      let first = 0;
      let last = rows - 1;
      while (first <= last && !rowHasContent(first)) first++;
      while (last >= first && !rowHasContent(last)) last--;
      entries = first > last ? [] : section.entries.slice(first * ncol, (last + 1) * ncol);
    }
    for (const entry of entries) {
      if (isHiddenEntry(view, entry)) {
        grid.createDiv({ cls: "ep-empty-cell" });
        continue;
      }
      const cell = grid.createDiv({ cls: "ep-col ep-gridcell" });
      renderEntry(cell, view, file, section, entry, entryFlags(view, file, section, entry), drag);
      const wideEntry = cell.querySelector(":scope > .ep-entry");
      if (wideEntry && wideEntry.style.gridColumn) {
        cell.setCssStyles({ gridColumn: wideEntry.style.gridColumn });
        wideEntry.setCssStyles({ gridColumn: "" });
      }
    }
    if (view.editMode) {
      const pad = (ncol - section.entries.length % ncol) % ncol;
      for (let z = 0; z < pad; z++) {
        const cell = grid.createDiv({ cls: "ep-empty-cell ep-empty-pad" });
        cell.createSpan({ cls: "ep-pad-plus", text: t("entry.addProperty") });
        cell.setAttr("title", t("entry.addToSectionHint", { section: section.title }));
        cell.onclick = () => view.openAddMenu(cell, section, { index: section.entries.length });
        cell.addEventListener("contextmenu", (ce) => {
          ce.preventDefault();
          const m = new import_obsidian26.Menu();
          m.addItem(
            (i) => i.setTitle(t("blank.addHere")).setIcon("plus").onClick(
              () => view.openAddMenu(cell, section, { index: section.entries.length })
            )
          );
          m.showAtMouseEvent(ce);
        });
      }
      const add = body.createDiv({ cls: "ep-add" });
      const ab = add.createEl("button", { cls: "ep-add-input ep-addbtn", text: t("entry.addProperty") });
      ab.onclick = () => view.openAddMenu(ab, section, { index: section.entries.length });
    }
  }
  alignClusters(det);
  if (colRail || rowRail) renderRails(view, section, grid, colRail, rowRail);
  if (view.editMode) drag.attachSection(det, grid, section);
  if (collapsible) {
    collapseWrap.setCssStyles({ overflow: "hidden" });
    if (section.collapsed) collapseWrap.setCssStyles({ height: "0px" });
    sum.setAttr("role", "button");
    sum.tabIndex = 0;
    sum.setAttr("aria-label", t("a11y.toggleSection", { name: section.title }));
    sum.setAttr("aria-expanded", String(!section.collapsed));
    const toggle = () => {
      toggleSection(view, section, det, collapseWrap, host);
      sum.setAttr("aria-expanded", String(!section.collapsed));
    };
    sum.onclick = toggle;
    sum.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target === sum) {
        e.preventDefault();
        toggle();
      }
    });
  }
}
function toggleSection(view, section, det, wrap, host) {
  section.collapsed = !section.collapsed;
  view.saveLayout();
  const chev = det.querySelector(".ep-chev");
  if (chev) chev.toggleClass("ep-open", !section.collapsed);
  if (section.collapsed) {
    const h = wrap.scrollHeight;
    wrap.setCssStyles({ height: h + "px" });
    window.requestAnimationFrame(() => {
      wrap.setCssStyles({ height: "0px" });
    });
  } else {
    wrap.setCssStyles({ height: "0px" });
    const target = wrap.scrollHeight;
    window.requestAnimationFrame(() => {
      wrap.setCssStyles({ height: target + "px" });
    });
    const done = () => {
      wrap.setCssStyles({ height: "auto" });
      wrap.removeEventListener("transitionend", done);
    };
    wrap.addEventListener("transitionend", done);
  }
  window.requestAnimationFrame(() => host.reflowSticky());
}
function clusterSpans(spans) {
  const sorted = [...spans].sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(a - last[0]) < 2) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}
function renderRails(view, section, grid, colRail, rowRail) {
  const t = view.i18n.t.bind(view.i18n);
  const isGrid = sectionMode(section) === "grid";
  const layout = () => {
    if (!grid.isConnected) return;
    const gr = grid.getBoundingClientRect();
    const cells = Array.from(grid.children).filter(
      (c) => (c.classList.contains("ep-entry") || c.classList.contains("ep-empty-cell") || c.classList.contains("ep-col")) && !c.style.gridColumn
    );
    const spansOf = (axis) => clusterSpans(
      cells.map((c) => {
        const r = c.getBoundingClientRect();
        return axis === "x" ? [r.left - gr.left, r.right - gr.left] : [r.top - gr.top, r.bottom - gr.top];
      })
    );
    const boundsOf = (spans) => {
      const out = [];
      spans.forEach(([a, b], i) => {
        out.push(i === 0 ? a : (spans[i - 1][1] + a) / 2);
        if (i === spans.length - 1) out.push(b);
      });
      return out;
    };
    const mkBtn = (rail, cls, icon, title, onClick) => {
      const el = rail.createDiv({ cls });
      const sp = el.createSpan();
      (0, import_obsidian26.setIcon)(sp, icon);
      el.setAttr("title", title);
      el.onclick = onClick;
      return el;
    };
    const commit2 = (fn) => {
      fn();
      view.saveLayout();
      view.rerender();
    };
    if (colRail && colRail.isConnected) {
      colRail.empty();
      const off = gr.left - colRail.getBoundingClientRect().left;
      const spans = spansOf("x");
      boundsOf(spans).forEach((x, i) => {
        mkBtn(
          colRail,
          "ep-addbar",
          "plus",
          t("grid.addColumnHint"),
          () => commit2(() => addColumnAt(section, i, isGrid))
        ).setCssStyles({ left: off + x + "px" });
      });
      if (spans.length > 1)
        spans.forEach(([a, b], i) => {
          mkBtn(
            colRail,
            "ep-rmbar",
            "minus",
            t("grid.removeColumnHint"),
            () => commit2(() => removeColumnAt(section, i, isGrid))
          ).setCssStyles({ left: off + (a + b) / 2 + "px" });
        });
    }
    if (rowRail && rowRail.isConnected) {
      rowRail.empty();
      const off = gr.top - rowRail.getBoundingClientRect().top;
      const spans = spansOf("y");
      boundsOf(spans).forEach((y, i) => {
        mkBtn(
          rowRail,
          "ep-addbar",
          "plus",
          t("grid.addRowHint"),
          () => commit2(() => addRowAt(section, i))
        ).setCssStyles({ top: off + y + "px" });
      });
      spans.forEach(([a, b], i) => {
        mkBtn(
          rowRail,
          "ep-rmbar",
          "minus",
          t("grid.removeRowHint"),
          () => commit2(() => removeRowAt(section, i))
        ).setCssStyles({ top: off + (a + b) / 2 + "px" });
      });
    }
  };
  window.requestAnimationFrame(layout);
  const ro = new ResizeObserver(() => {
    if (!grid.isConnected) {
      ro.disconnect();
      return;
    }
    window.requestAnimationFrame(layout);
  });
  ro.observe(grid);
}

// src/ui/components/popups.ts
var import_obsidian27 = require("obsidian");
var PopupManager = class {
  constructor(view) {
    this.view = view;
    this.popups = [];
    this.notesWin = null;
  }
  /** Close all open popups (with a short fade-out). */
  closeAll() {
    const old = this.popups;
    this.popups = [];
    this.notesWin = null;
    for (const p of old) {
      p.addClass("ep-closing");
      window.setTimeout(() => p.remove(), 140);
    }
  }
  /** Keep a popup on-screen, flipping left/up when it would overflow. */
  fitToViewport(pop, leftPx, anchorLeft) {
    const w = pop.offsetWidth;
    if (leftPx + w > window.innerWidth - 4) pop.setCssStyles({ left: Math.max(4, anchorLeft - w - 4) + "px" });
    const h = pop.offsetHeight;
    const top = parseFloat(pop.style.top || "0");
    if (top + h > window.innerHeight - 4) pop.setCssStyles({ top: Math.max(4, window.innerHeight - h - 4) + "px" });
  }
  /** Dismiss when clicking outside the popups and their anchor. */
  dismissOnOutsideClick(anchor) {
    const cleanup = () => {
      activeDocument.removeEventListener("mousedown", h);
      activeDocument.removeEventListener("keydown", esc2, true);
    };
    const h = (e) => {
      var _a;
      const t = e.target;
      if ((_a = t == null ? void 0 : t.closest) == null ? void 0 : _a.call(t, ".suggestion-container")) return;
      if (this.popups.some((p) => p.contains(t)) || anchor.contains(t)) return;
      cleanup();
      this.closeAll();
    };
    const esc2 = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cleanup();
      this.closeAll();
    };
    window.setTimeout(() => {
      activeDocument.addEventListener("mousedown", h);
      activeDocument.addEventListener("keydown", esc2, true);
    }, 0);
  }
  // -- add-property menu --------------------------------------------------
  /** Candidates grouped for the add menu, each with its resolved data type. */
  addCandidates() {
    const view = this.view;
    const shown = /* @__PURE__ */ new Set();
    for (const sec of view.layout.sections)
      for (const e of sec.entries) if (e.kind === "prop" && e.key) shown.add(e.key.toLowerCase());
    const all = /* @__PURE__ */ new Set([
      ...Object.keys(view.note.raw).filter((k) => k.toLowerCase() !== "position"),
      ...view.props.knownProps()
    ]);
    const typed = (k) => {
      const id = view.deriveType(k);
      const def = view.registries.valueTypes.get(id);
      return { key: k, typeName: def ? def.name(view.i18n) : id };
    };
    const onNote = [], onSidebar = [], others = [];
    for (const k of all) {
      if (view.note.raw[k] !== void 0) onNote.push(typed(k));
      else if (shown.has(k.toLowerCase())) onSidebar.push(typed(k));
      else others.push(typed(k));
    }
    const srt = (a) => a.sort((x, y) => x.typeName.localeCompare(y.typeName) || x.key.localeCompare(y.key));
    return { onNote: srt(onNote), onSidebar: srt(onSidebar), others: srt(others) };
  }
  allKeys() {
    return [.../* @__PURE__ */ new Set([...Object.keys(this.view.note.raw), ...this.view.props.knownProps()])];
  }
  /** Create the entry (and optionally a value) and refresh. */
  addEntryWithValue(file, section, key, value, target) {
    var _a;
    const view = this.view;
    key = (key || "").trim();
    if (!key) return;
    const existing = view.note.raw[key];
    const isList = Array.isArray(value) || Array.isArray(existing);
    const entry = { id: genId(), kind: "prop", key, dataType: isList ? "list" : view.deriveType(key), hideIfEmpty: false };
    let idx = (_a = target == null ? void 0 : target.index) != null ? _a : section.entries.length;
    if (target == null ? void 0 : target.replaceId) {
      const ri = section.entries.findIndex((e) => e.id === target.replaceId);
      if (ri >= 0) {
        section.entries.splice(ri, 1);
        idx = ri;
      }
    }
    section.entries.splice(Math.max(0, Math.min(idx, section.entries.length)), 0, entry);
    view.saveLayout();
    if (Array.isArray(value)) {
      const cur = view.note.list(key);
      const curL = cur.map((x) => x.toLowerCase());
      const add = value.filter((v) => typeof v === "string" && !curL.includes(v.toLowerCase()));
      if (add.length || existing === void 0) view.note.set(file, key, [...cur, ...add], true);
      else view.rerender();
    } else if (value !== void 0) {
      view.note.set(file, key, value, true);
    } else {
      view.rerender();
    }
  }
  /** Open the add-property popup anchored below `anchor`. */
  openAddMenu(anchor, file, section, target) {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    this.closeAll();
    const pop = activeDocument.body.createDiv({ cls: "ep-popup ep-addmenu" });
    this.popups.push(pop);
    const r = anchor.getBoundingClientRect();
    pop.setCssStyles({ left: r.left + "px", top: r.bottom + 2 + "px", minWidth: "220px" });
    const fit = () => {
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      let left = r.left;
      let top = r.bottom + 2;
      if (left + w > window.innerWidth - 4) left = Math.max(4, window.innerWidth - w - 4);
      if (top + h > window.innerHeight - 4) top = r.top - h - 2;
      if (top < 4) top = Math.max(4, Math.min(r.bottom + 2, window.innerHeight - h - 4));
      pop.setCssStyles({ left: left + "px" });
      pop.setCssStyles({ top: top + "px" });
    };
    const search = pop.createEl("input", { cls: "ep-edit-input ep-addsearch" });
    search.type = "text";
    search.placeholder = t("add.searchPlaceholder", { section: section.title });
    const listEl = pop.createDiv({ cls: "ep-addlist" });
    const groups = this.addCandidates();
    const render3 = () => {
      listEl.empty();
      const q = search.value.trim().toLowerCase();
      const addRow = (c) => {
        const row = listEl.createDiv({ cls: "ep-pop-row" });
        row.createSpan({ text: c.key });
        if (view.hide.isHidden(c.key))
          row.createSpan({ cls: "ep-sug-badge ep-badge-hidden", text: t("add.hiddenBadge") });
        const isList = view.props.obsidianType(c.key) === "list" || Array.isArray(view.note.raw[c.key]);
        let timer = 0;
        row.onmouseenter = () => {
          timer = window.setTimeout(() => this.openValueSidePanel(row, file, section, c.key, isList, target), 450);
        };
        row.onmouseleave = () => window.clearTimeout(timer);
        row.onclick = () => {
          if (isList && view.note.raw[c.key] === void 0) {
            this.openValueSidePanel(row, file, section, c.key, true, target);
          } else {
            this.addEntryWithValue(file, section, c.key, void 0, target);
            this.closeAll();
          }
        };
      };
      const grp = (title, arr) => {
        const f = arr.filter((c) => !q || c.key.toLowerCase().includes(q));
        if (!f.length) return;
        listEl.createDiv({ cls: "ep-pop-group", text: title });
        let lastType = null;
        for (const c of f.slice(0, 60)) {
          if (c.typeName !== lastType) {
            lastType = c.typeName;
            listEl.createDiv({ cls: "ep-pop-subgroup", text: c.typeName });
          }
          addRow(c);
        }
      };
      const poolBase = q && featureOn(view.settings, "pool") ? poolBaseFor(view.settings, search.value.trim()) : null;
      if (poolBase) {
        const row = listEl.createDiv({ cls: "ep-pop-row ep-pop-create" });
        row.setText(t("pool.editRow", { key: poolBase }));
        row.onclick = () => {
          const r2 = row.getBoundingClientRect();
          this.openPoolEditor(r2.left, r2.bottom + 2, poolBase);
        };
      } else if (q && !this.allKeys().some((k) => k.toLowerCase() === q)) {
        const row = listEl.createDiv({ cls: "ep-pop-row ep-pop-create" });
        row.setText(t("add.create", { key: search.value.trim() }));
        row.onclick = () => {
          this.addEntryWithValue(file, section, search.value.trim(), void 0, target);
          this.closeAll();
        };
      }
      grp(t("add.groupOnNote"), groups.onNote);
      grp(t("add.groupOnSidebar"), groups.onSidebar);
      grp(t("add.groupOthers"), groups.others);
    };
    search.oninput = () => {
      render3();
      fit();
    };
    search.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = search.value.trim();
        const base = featureOn(view.settings, "pool") ? poolBaseFor(view.settings, v) : null;
        if (base) {
          const r2 = search.getBoundingClientRect();
          this.openPoolEditor(r2.left, r2.bottom + 2, base);
        } else if (v) {
          this.addEntryWithValue(file, section, v, void 0, target);
          this.closeAll();
        }
      } else if (e.key === "Escape") {
        this.closeAll();
      }
    };
    render3();
    fit();
    window.setTimeout(() => {
      fit();
      search.focus();
    }, 0);
    this.dismissOnOutsideClick(anchor);
  }
  /** Side panel listing existing values for `key` (multi-select for lists). */
  openValueSidePanel(row, file, section, key, multi, target) {
    var _a;
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    while (this.popups.length > 1) (_a = this.popups.pop()) == null ? void 0 : _a.remove();
    const side = activeDocument.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    const r = row.getBoundingClientRect();
    side.setCssStyles({ left: r.right + 2 + "px", top: r.top + "px", minWidth: "170px" });
    side.createDiv({ cls: "ep-side-title", text: multi ? t("add.pickValues", { key }) : key });
    const body = side.createDiv({ cls: "ep-side-body" });
    const curVals = view.note.list(key).map((x) => x.toLowerCase());
    const vals = poolFor(view.settings, view.props.valuesFor(key), key).filter(
      (v) => !curVals.includes(v.toLowerCase())
    );
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = multi ? t("add.customValue") : t("add.typeValue");
    new TextLinkSuggest(view.app, custom);
    let appended = false;
    const instantAdd = (v, it) => {
      if (appended) view.note.set(file, key, [...view.note.list(key), v]);
      else {
        this.addEntryWithValue(file, section, key, [v], target);
        appended = true;
      }
      it.remove();
      if (!body.querySelector(".ep-pop-row")) body.createDiv({ cls: "ep-empty-sub", text: t("add.noValues") });
    };
    const commit2 = (single) => {
      if (multi) {
        const v = custom.value.trim();
        if (v) {
          if (appended) view.note.set(file, key, [...view.note.list(key), v]);
          else this.addEntryWithValue(file, section, key, [v], target);
        } else if (!appended) {
          this.addEntryWithValue(file, section, key, [], target);
        }
      } else {
        const v = single != null ? single : custom.value.trim();
        this.addEntryWithValue(file, section, key, v === "" ? void 0 : v, target);
      }
      this.closeAll();
    };
    for (const v of vals) {
      const it = body.createDiv({ cls: "ep-pop-row" });
      let nt = 0;
      it.onmouseenter = () => {
        nt = window.setTimeout(() => this.openNotesWindow(it, key, v), 500);
      };
      it.onmouseleave = () => window.clearTimeout(nt);
      it.createSpan({ text: v });
      it.onclick = () => multi ? instantAdd(v, it) : commit2(v);
    }
    if (!vals.length) body.createDiv({ cls: "ep-empty-sub", text: t("add.noValues") });
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit2();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    if (multi) {
      const addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addCustom") });
      addBtn.onclick = () => commit2();
    } else {
      const ab = foot.createEl("button", { cls: "ep-mini-btn", text: t("add.addEmpty") });
      ab.onclick = () => {
        this.addEntryWithValue(file, section, key, void 0, target);
        this.closeAll();
      };
    }
    this.fitToViewport(side, r.right + 2, r.left);
  }
  /** Floating window listing notes that use `value` for `key`. */
  openNotesWindow(anchor, key, value) {
    const view = this.view;
    if (this.notesWin) {
      this.notesWin.remove();
      const k = this.popups.indexOf(this.notesWin);
      if (k >= 0) this.popups.splice(k, 1);
    }
    const w = activeDocument.body.createDiv({ cls: "ep-popup ep-noteswin" });
    this.popups.push(w);
    this.notesWin = w;
    const r = anchor.getBoundingClientRect();
    w.setCssStyles({ left: r.right + 4 + "px", top: r.top + "px", minWidth: "160px" });
    w.createDiv({ cls: "ep-side-title", text: view.i18n.t("add.notesWith", { value }) });
    const body = w.createDiv({ cls: "ep-side-body" });
    const notes = view.props.notesWithValue(key, value);
    if (!notes.length) body.createDiv({ cls: "ep-empty-sub", text: view.i18n.t("add.noNotes") });
    for (const n of notes.slice(0, 100)) body.createDiv({ cls: "ep-pop-row", text: n });
    this.fitToViewport(w, r.right + 4, r.left);
  }
  // -- list value picker --------------------------------------------------
  /** Multi-select picker appending values to an existing list property. */
  openListValuePicker(left, top, file, key) {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    this.closeAll();
    const cur = view.note.list(key);
    const side = activeDocument.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    side.setCssStyles({ left: left + "px", top: top + "px", minWidth: "170px" });
    side.createDiv({ cls: "ep-side-title", text: t("list.addTo", { key }) });
    const body = side.createDiv({ cls: "ep-side-body" });
    const opts = poolFor(view.settings, view.props.valuesFor(key), key).filter(
      (o) => !cur.some((c) => c.toLowerCase() === o.toLowerCase())
    );
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = t("add.customValue");
    new TextLinkSuggest(view.app, custom);
    for (const v of opts) {
      const it = body.createDiv({ cls: "ep-pop-row" });
      it.createSpan({ text: v });
      it.onclick = () => {
        view.note.set(file, key, [...view.note.list(key), v]);
        it.remove();
        if (!body.querySelector(".ep-pop-row"))
          body.createDiv({ cls: "ep-empty-sub", text: t("list.noMoreValues") });
      };
    }
    if (!opts.length) body.createDiv({ cls: "ep-empty-sub", text: t("list.noMoreValues") });
    let addBtn;
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addBtn.click();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addCustom") });
    addBtn.onclick = () => {
      const v = custom.value.trim();
      if (v) view.note.set(file, key, [...view.note.list(key), v]);
      this.closeAll();
    };
    this.fitToViewport(side, left, left);
    this.dismissOnOutsideClick(side);
  }
  // -- autofill pool editor (the `.p` suffix) --------------------------------
  /**
   * Editor for a property's autofill pool - everything autocomplete offers
   * for it (vault values + user-added extras). Adding an option makes it
   * show up in autocomplete fields even before any note uses it; removing an
   * option also scrubs the value from every note that carries it (confirmed
   * first, with the affected note count).
   */
  openPoolEditor(left, top, key) {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    this.closeAll();
    const side = activeDocument.body.createDiv({ cls: "ep-popup ep-side ep-pool" });
    this.popups.push(side);
    side.setCssStyles({ left: left + "px", top: top + "px", minWidth: "220px" });
    side.createDiv({ cls: "ep-side-title", text: t("pool.title", { key }) });
    const body = side.createDiv({ cls: "ep-side-body" });
    const rebuild = () => {
      body.empty();
      const options = poolFor(view.settings, view.props.valuesFor(key), key);
      if (!options.length) body.createDiv({ cls: "ep-empty-sub", text: t("pool.empty") });
      for (const v of options) {
        const row = body.createDiv({ cls: "ep-pop-row ep-pool-row" });
        row.createSpan({ cls: "ep-pool-val", text: v });
        const uses = view.props.filesWithValue(key, v).length;
        row.createSpan({
          cls: "ep-sug-type",
          text: !uses && isPoolExtra(view.settings, key, v) ? t("pool.addedTag") : t("pool.usesTag", { n: String(uses) })
        });
        const x = row.createEl("button", { cls: "ep-chip-x ep-pool-x", text: "x" });
        x.setAttr("aria-label", t("pool.removeAria", { value: v }));
        x.onclick = () => void this.removePoolOption(key, v, rebuild);
      }
    };
    rebuild();
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = t("pool.addPlaceholder");
    const foot = side.createDiv({ cls: "ep-side-foot" });
    const addBtn = foot.createEl("button", { cls: "mod-cta", text: t("pool.addBtn") });
    const addNow = () => {
      if (addPoolExtra(view.settings, key, custom.value)) {
        view.saveLayout();
        custom.value = "";
        rebuild();
      }
    };
    addBtn.onclick = addNow;
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addNow();
      }
    };
    this.fitToViewport(side, left, left);
    this.dismissOnOutsideClick(side);
  }
  /**
   * Remove a pool option: drop the user-added extra and scrub the value from
   * every note that carries it (list items are removed from the list, a
   * matching scalar clears the key). Vault writes are confirmed first.
   */
  async removePoolOption(key, value, done) {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    const files = view.props.filesWithValue(key, value);
    if (!files.length) {
      removePoolExtra(view.settings, key, value);
      view.saveLayout();
      done();
      return;
    }
    const apply = async () => {
      removePoolExtra(view.settings, key, value);
      view.saveLayout();
      let n = 0;
      for (const f of files) {
        try {
          await view.app.fileManager.processFrontMatter(f, (fm) => {
            const realKey = Object.keys(fm).find((k) => k.toLowerCase() === key.toLowerCase());
            if (!realKey) return;
            const cur = fm[realKey];
            if (Array.isArray(cur)) {
              const next = cur.filter((x) => String(x) !== value);
              if (next.length !== cur.length) {
                fm[realKey] = next;
                n++;
              }
            } else if (String(cur) === value) {
              delete fm[realKey];
              n++;
            }
          });
        } catch (err) {
          console.error("Extended Properties: pool scrub failed for", f.path, err);
        }
      }
      new import_obsidian27.Notice(t("pool.scrubbed", { value, n: String(n) }));
      done();
    };
    new ConfirmModal(view.app, view.i18n, t("pool.removeConfirm", { value, n: String(files.length) }), () => {
      void apply();
    }).open();
  }
};

// src/ui/components/links.ts
function renderLinkedText(app, el, text, sourcePath) {
  var _a;
  const re = /(!?)\[\[([^\]]+?)\]\]|\[([^\]]+?)\]\(([^)]+?)\)/g;
  let last = 0;
  let m;
  while (m = re.exec(text)) {
    if (m.index > last) el.appendText(text.slice(last, m.index));
    if (m[2] !== void 0) {
      const parts = m[2].split("|");
      const target = parts[0].trim();
      const label = ((_a = parts[1]) != null ? _a : parts[0]).trim();
      if (m[1] === "!") {
        el.appendText(m[0]);
      } else {
        const a = el.createEl("a", { cls: "internal-link", text: label });
        a.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          void app.workspace.openLinkText(target, sourcePath, ev.ctrlKey || ev.metaKey);
        };
      }
    } else {
      const url = m[4];
      const a = el.createEl("a", { cls: "external-link", text: m[3] });
      a.setAttr("href", url);
      a.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        window.open(url, "_blank");
      };
    }
    last = re.lastIndex;
  }
  if (last < text.length) el.appendText(text.slice(last));
}

// src/ui/view.ts
var VIEW_TYPE = "extended-properties-character";
var SidebarView = class extends import_obsidian28.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.hub = new ServiceHub();
    this.editMode = false;
    /** Lower-cased type key whose layout is shown (null = no match). */
    this.activeTypeKey = null;
    this.drag = new DragController(this);
    this.popupsMgr = new PopupManager(this);
    this.updaters = [];
    this.sectionEls = {};
    this.headerEl = null;
    this.stickyZoneEl = null;
    this.footerZoneEl = null;
    this.flowEl = null;
    this.resizeObs = null;
    this.lastEmptySig = "";
    /** Parsed `showWhen` ASTs, keyed by expression text (null = unparseable). */
    this.condCache = /* @__PURE__ */ new Map();
    /**
     * Evaluated `showWhen` results for the current pass, keyed by expression
     * text. `emptySig` and the render both evaluate the same conditions; this
     * cache makes each condition evaluate once per pass. Cleared whenever note
     * values may have changed (render, refreshValues, maybeRefresh).
     */
    this.condVals = /* @__PURE__ */ new Map();
    /** Responsive-pass signature per section id - skip re-measuring unchanged ones (F2). */
    this.respSig = /* @__PURE__ */ new Map();
    this.hlTimer = 0;
    this.scrollTimer = 0;
    /** Animate the next render (entering/leaving edit mode). */
    this.modeAnim = false;
    /** Layout JSON at edit-mode entry, for session undo. */
    this.layoutSnapshot = null;
    this.plugin = plugin;
    this.note = new NoteModel(this.app, plugin.i18n, {
      onLightChange: () => this.refreshValues(),
      onFullChange: () => this.render(),
      captureUndo: () => this.editMode,
      conflictGuard: () => this.plugin.settings.conflictGuard !== false
    });
  }
  // -- ViewCtx surface ----------------------------------------------------
  get i18n() {
    return this.plugin.i18n;
  }
  get settings() {
    return this.plugin.settings;
  }
  get registries() {
    return this.plugin.registries;
  }
  get props() {
    return this.plugin.props;
  }
  get hide() {
    return this.plugin.hide;
  }
  get history() {
    return this.plugin.history;
  }
  get layout() {
    return this.plugin.ensureLayout(this.activeTypeKey || "character");
  }
  /** Vault reads for cross-note aggregates / `prop()` in expressions. */
  get vault() {
    return makeVaultAccess(this.plugin.props, () => {
      var _a;
      return (_a = this.note.path) != null ? _a : "";
    });
  }
  saveLayout() {
    void this.plugin.saveSettings();
  }
  rerender() {
    this.render();
  }
  refreshValues() {
    this.condVals.clear();
    for (const u of this.updaters) {
      try {
        u();
      } catch (e) {
      }
    }
    this.respSig.clear();
    this.responsivePass();
  }
  registerUpdater(fn) {
    this.updaters.push(fn);
  }
  // -- keyboard navigation (E1) ----------------------------------------------
  /** One roving tab-stop across entries; the rest are arrow-reachable only. */
  initRovingFocus() {
    const entries = Array.from(this.content.querySelectorAll(".ep-entry"));
    entries.forEach((el, i) => el.tabIndex = i === 0 ? 0 : -1);
  }
  /** Arrow/Home/End move focus between entries; Enter/Space opens the entry menu. */
  onSidebarKey(e) {
    const target = e.target;
    if (!target || target.matches("input, textarea, select, [contenteditable='true']")) return;
    const entry = target.closest(".ep-entry");
    if (!entry || !this.content.contains(entry)) return;
    const entries = Array.from(this.content.querySelectorAll(".ep-entry"));
    const i = entries.indexOf(entry);
    if (i < 0) return;
    const focusAt = (j) => {
      const n = entries[Math.max(0, Math.min(entries.length - 1, j))];
      if (!n) return;
      entries.forEach((x) => x.tabIndex = -1);
      n.tabIndex = 0;
      n.focus();
    };
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(entries.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        this.openEntryMenuForElement(entry);
        break;
    }
  }
  /** Open an entry's context menu by keyboard, positioned at the entry. */
  openEntryMenuForElement(el) {
    var _a;
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const id = ((_a = el.getAttribute("data-ep-id")) != null ? _a : "").replace(/^e:/, "");
    for (const section of this.layout.sections) {
      const entry = section.entries.find((x) => x.id === id);
      if (entry) {
        const r = el.getBoundingClientRect();
        const ev = new MouseEvent("contextmenu", { clientX: r.left + 8, clientY: r.bottom, bubbles: true });
        openEntryMenu(ev, this, file, section, entry);
        return;
      }
    }
  }
  // -- sensitive property encryption (L1) ----------------------------------
  /** Synchronous plaintext for an encrypted value, if the session has it. */
  secretReveal(envelope) {
    return this.plugin.secrets.reveal(envelope);
  }
  /** Ensure the session is unlocked, prompting for the passphrase if needed. */
  ensureUnlocked() {
    if (this.plugin.secrets.isUnlocked()) return Promise.resolve(true);
    return new Promise((resolve) => {
      new TextPromptModal(this.app, this.i18n, this.i18n.t("secure.enterPass"), "", (v) => {
        if (!v) {
          resolve(false);
          return;
        }
        this.plugin.secrets.unlock(v);
        void this.plugin.primeSecrets();
        resolve(true);
      }).open();
    });
  }
  /** Encrypt a property's current value in place (explicit, confirmed, warns about lockout). */
  async encryptValueAt(file, key) {
    if (isEnvelope(this.note.raw[key])) return;
    const cur = this.note.str(key);
    if (cur === "") {
      new import_obsidian28.Notice(this.i18n.t("secure.empty"));
      return;
    }
    if (!await this.ensureUnlocked()) return;
    new ConfirmModal(this.app, this.i18n, this.i18n.t("secure.encryptWarn"), () => {
      void (async () => {
        try {
          const env = await this.plugin.secrets.encrypt(cur);
          this.note.set(file, key, env);
          new import_obsidian28.Notice(this.i18n.t("secure.encrypted"));
        } catch (e) {
          new import_obsidian28.Notice(this.i18n.t("secure.failed", { error: String(e) }));
        }
      })();
    }).open();
  }
  /** Decrypt a property's value back to plaintext (non-destructive on a wrong passphrase). */
  async decryptValueAt(file, key) {
    const raw = this.note.raw[key];
    if (!isEnvelope(raw)) return;
    if (!await this.ensureUnlocked()) return;
    try {
      const plain = await this.plugin.secrets.decrypt(raw);
      this.note.set(file, key, plain);
      new import_obsidian28.Notice(this.i18n.t("secure.decrypted"));
    } catch (e) {
      new import_obsidian28.Notice(this.i18n.t("secure.wrongPass"));
    }
  }
  resolveType(entry) {
    var _a, _b;
    const shared = entry.key ? (_a = this.settings.propTypes) == null ? void 0 : _a[entry.key.toLowerCase()] : void 0;
    if (shared) return shared;
    if (entry.dataType) return entry.dataType;
    return this.deriveType((_b = entry.key) != null ? _b : "");
  }
  deriveType(key) {
    var _a;
    const shared = (_a = this.settings.propTypes) == null ? void 0 : _a[key.toLowerCase()];
    if (shared) return shared;
    const assigned = this.props.obsidianType(key);
    if (assigned) return assigned;
    const v = this.note.raw[key];
    if (Array.isArray(v)) return "list";
    if (typeof v === "number") return "number";
    if (typeof v === "boolean") return "checkbox";
    return this.settings.defaults.dataType;
  }
  /** @see ViewCtx.condVisible */
  condVisible(showWhen) {
    const expr = (showWhen != null ? showWhen : "").trim();
    if (!expr) return true;
    const hit = this.condVals.get(expr);
    if (hit !== void 0) return hit;
    let ast = this.condCache.get(expr);
    if (ast === void 0) {
      ast = parseExpr(expr);
      this.condCache.set(expr, ast);
    }
    let vis = true;
    if (ast) {
      const r = evalCondition(ast, this.condEnv());
      if (r !== void 0) vis = r;
    }
    this.condVals.set(expr, vis);
    return vis;
  }
  /** Expression env resolving names against the active note's frontmatter. */
  condEnv() {
    const raw = this.note.raw;
    const find = (name) => {
      if (name in raw) return raw[name];
      const lc = name.toLowerCase();
      for (const k in raw) if (k.toLowerCase() === lc) return raw[k];
      return void 0;
    };
    return {
      resolve: (name) => {
        const v = find(name);
        if (typeof v === "number") return v;
        if (typeof v === "boolean") return v ? 1 : 0;
        if (typeof v === "string") {
          const f = parseFloat(v);
          return Number.isFinite(f) ? f : void 0;
        }
        return void 0;
      },
      resolveStr: (name) => {
        const v = find(name);
        if (v === void 0 || v === null) return void 0;
        return Array.isArray(v) ? v.map(String).join(", ") : String(v);
      }
    };
  }
  defaultLabelFor(entry) {
    const kind = this.registries.entryKinds.get(entry.kind);
    return kind ? kind.defaultLabel(this.i18n, entry) : entry.kind;
  }
  buildCluster(head, flags, o) {
    return buildCluster(head, flags, o, (el, open) => this.bindOpen(el, open));
  }
  bindOpen(el, open, markEditable = true) {
    if (markEditable) el.addClass("ep-editable");
    el.tabIndex = 0;
    el.setAttr("role", "button");
    el.setAttr("aria-label", this.i18n.t("a11y.editValue"));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    if (this.editMode) {
      el.setAttr("title", this.i18n.t("hint.clickEdit"));
      el.onclick = (e) => {
        e.preventDefault();
        open();
      };
    } else {
      el.setAttr("title", this.i18n.t("hint.dblEdit"));
      el.ondblclick = () => open();
    }
  }
  renderLinks(el, text) {
    renderLinkedText(this.app, el, text, this.note.path || "");
  }
  resolveImage(src) {
    src = (src || "").trim();
    const m = src.match(/!?\[\[(.*?)\]\]/);
    const path = m ? m[1].split("|")[0].split("#")[0].trim() : src;
    if (/^(https?:|data:|app:|file:)/.test(path)) return path;
    const f = this.app.metadataCache.getFirstLinkpathDest(path, this.note.path || "");
    if (f) return this.app.vault.getResourcePath(f);
    const af = this.app.vault.getAbstractFileByPath(path);
    if (af instanceof import_obsidian28.TFile) return this.app.vault.getResourcePath(af);
    return path;
  }
  openColorPicker(initial, onPick) {
    new ColorPickerModal(
      {
        app: this.app,
        i18n: this.i18n,
        getColorSpace: () => this.settings.defaults.colorSpace,
        setColorSpace: (sp) => {
          this.settings.defaults.colorSpace = sp;
          void this.plugin.saveSettings();
        }
      },
      initial,
      onPick
    ).open();
  }
  highlight(el) {
    var _a;
    const wrap = el.closest(".ep-entry");
    const c = this.content;
    if (!wrap) return;
    c.findAll(".ep-highlight").forEach((x) => x.removeClass("ep-highlight"));
    c.findAll(".ep-has-highlight").forEach((x) => x.removeClass("ep-has-highlight"));
    wrap.addClass("ep-highlight");
    (_a = wrap.closest(".ep-section")) == null ? void 0 : _a.addClass("ep-has-highlight");
    c.addClass("ep-highlighting");
    window.clearTimeout(this.hlTimer);
    this.hlTimer = window.setTimeout(() => {
      c.removeClass("ep-highlighting");
      wrap.removeClass("ep-highlight");
      c.findAll(".ep-has-highlight").forEach((x) => x.removeClass("ep-has-highlight"));
    }, 1e3);
  }
  removeEntry(section, entry) {
    const key = entry.kind === "prop" ? entry.key : void 0;
    section.entries = section.entries.filter((x) => x.id !== entry.id);
    this.saveLayout();
    if (key) {
      const stillUsed = Object.keys(this.settings.layouts).some(
        (lk) => this.settings.layouts[lk].sections.some(
          (s) => s.entries.some((e) => e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase())
        )
      );
      if (!stillUsed) this.hide.unhideKey(key);
      else this.render();
    } else {
      this.render();
    }
  }
  renameKey(entry, newKey) {
    var _a;
    newKey = newKey.trim();
    if (!newKey || newKey === entry.key) return;
    const poolBase = featureOn(this.settings, "pool") ? poolBaseFor(this.settings, newKey) : null;
    if (poolBase) {
      const r = this.containerEl.getBoundingClientRect();
      this.popupsMgr.openPoolEditor(r.left + 24, r.top + 96, poolBase);
      return;
    }
    entry.key = newKey;
    entry.alias = void 0;
    entry.slider = void 0;
    entry.sliderCurve = void 0;
    entry.steppers = void 0;
    entry.showChain = void 0;
    entry.showDice = void 0;
    entry.min = void 0;
    entry.max = void 0;
    entry.clamp = void 0;
    entry.formula = void 0;
    entry.unit = void 0;
    entry.unitFactor = void 0;
    entry.listAlign = void 0;
    for (const addon of this.registries.clusterAddons.all()) {
      try {
        (_a = addon.onRename) == null ? void 0 : _a.call(addon, entry);
      } catch (e) {
      }
    }
    entry.dataType = Array.isArray(this.note.raw[newKey]) ? "list" : this.deriveType(newKey);
    entry.hideIfEmpty = false;
    this.saveLayout();
    this.render();
  }
  openEntryOptions(section, entry) {
    new SectionOptionsModal(this, section, entry.id).open();
  }
  openAddMenu(anchor, section, o) {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    this.popupsMgr.openAddMenu(anchor, file, section, o);
  }
  openListValuePicker(x, y, key) {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    this.popupsMgr.openListValuePicker(x, y, file, key);
  }
  scrollToSection(id) {
    const sec = this.layout.sections.find((s) => s.id === id);
    if (sec && sec.collapsed) {
      sec.collapsed = false;
      this.saveLayout();
      this.render();
      window.requestAnimationFrame(() => this.scrollToSection(id));
      return;
    }
    const el = this.sectionEls[id];
    if (!el) return;
    const c = this.content;
    const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - this.stickyTopPx() - 4;
    c.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
  propCandidates(includeShown = false) {
    const shown = /* @__PURE__ */ new Set();
    if (!includeShown) {
      for (const sec of this.layout.sections)
        for (const e of sec.entries) if (e.kind === "prop" && e.key) shown.add(e.key.toLowerCase());
    }
    const all = /* @__PURE__ */ new Set([
      ...Object.keys(this.note.raw).filter((k) => k.toLowerCase() !== "position"),
      ...this.props.knownProps()
    ]);
    const list = [];
    for (const k of all) {
      if (shown.has(k.toLowerCase())) continue;
      const type = this.deriveType(k);
      const def = this.registries.valueTypes.get(type);
      list.push({
        key: k,
        onNote: this.note.raw[k] !== void 0,
        type,
        typeName: def ? def.name(this.i18n) : type
      });
    }
    list.sort(
      (a, b) => (a.onNote === b.onNote ? 0 : a.onNote ? -1 : 1) || a.typeName.localeCompare(b.typeName) || a.key.localeCompare(b.key)
    );
    return list;
  }
  // -- ItemView lifecycle ---------------------------------------------------
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return this.i18n.t("view.title");
  }
  getIcon() {
    return "panel-right";
  }
  async onOpen() {
    this.registerDomEvent(window, "resize", () => {
      this.reflowSticky();
      this.responsivePass();
    });
    this.resizeObs = new ResizeObserver(() => {
      this.reflowSticky();
      this.responsivePass();
    });
    this.register(() => {
      var _a;
      return (_a = this.resizeObs) == null ? void 0 : _a.disconnect();
    });
    this.registerDomEvent(this.content, "scroll", () => {
      this.content.addClass("ep-scrolling");
      window.clearTimeout(this.scrollTimer);
      this.scrollTimer = window.setTimeout(() => this.content.removeClass("ep-scrolling"), 800);
    });
    this.register(guardScrollTaps(this.content));
    this.registerDomEvent(this.content, "keydown", (e) => this.onSidebarKey(e));
    this.render();
  }
  async onClose() {
    this.note.flushPending();
    this.popupsMgr.closeAll();
  }
  get content() {
    return this.containerEl.children[1];
  }
  // -- refresh strategy ------------------------------------------------------
  /**
   * Called on workspace/metadata events. Decides between: do nothing (echo
   * of our own write), in-place value refresh, or full re-render.
   */
  maybeRefresh(file) {
    this.condVals.clear();
    const active = this.app.workspace.getActiveFile();
    if (!active) {
      this.note.path = null;
      this.render();
      return;
    }
    if (file) {
      if (file.path !== active.path) {
        this.refreshValues();
        return;
      }
      if (this.note.isEcho(file)) return;
    }
    if (active.path !== this.note.path) {
      this.note.load(active);
      this.render();
      return;
    }
    this.note.load(active);
    if (this.activeTypeKey && this.emptySig() === this.lastEmptySig) {
      this.refreshValues();
      return;
    }
    this.render();
  }
  /** Signature of which prop entries are empty - visibility changes need a re-render. */
  emptySig() {
    let sig = "";
    for (const s of this.layout.sections) {
      if (s.showWhen) sig += this.condVisible(s.showWhen) ? "S" : "s";
      for (const e of s.entries) {
        if (e.kind === "prop" && e.key) sig += this.note.isEmpty(e.key) ? "0" : "1";
        if (e.showWhen) sig += this.condVisible(e.showWhen) ? "V" : "v";
      }
    }
    return sig;
  }
  // -- edit mode session ------------------------------------------------------
  enterEdit() {
    this.editMode = true;
    this.layoutSnapshot = JSON.stringify(this.layout);
    this.note.clearUndo();
    this.render();
  }
  hasChanges() {
    return this.layoutSnapshot !== null && this.layoutSnapshot !== JSON.stringify(this.layout) || this.note.hasUndo();
  }
  requestExit() {
    const finish = () => {
      this.editMode = false;
      this.layoutSnapshot = null;
      this.note.clearUndo();
      this.render();
    };
    if (!this.hasChanges()) {
      finish();
      return;
    }
    new ExitEditModal(
      this.app,
      this.i18n,
      finish,
      () => {
        if (this.layoutSnapshot && this.activeTypeKey) {
          this.settings.layouts[this.activeTypeKey] = JSON.parse(this.layoutSnapshot);
          void this.plugin.saveSettings();
        }
        void this.note.revertUndo().then(() => {
          const active = this.app.workspace.getActiveFile();
          if (active) this.note.load(active);
          finish();
        });
      }
    ).open();
  }
  // -- label rendering (shared by entry kinds) ----------------------------------
  renderLabel(head, ctx2) {
    var _a, _b;
    const { entry } = ctx2;
    const showLabel = this.editMode || !entry.hideLabel;
    if (!showLabel) return;
    const span = head.createSpan({ cls: "ep-line-name" });
    if (entry.labelSize) span.setCssStyles({ fontSize: entry.labelSize + "px" });
    if (entry.labelColor) span.setCssStyles({ color: entry.labelColor });
    if (this.editMode && entry.hideLabel) span.addClass("ep-dim");
    if (this.editMode && entry.kind === "prop") {
      span.setText(entry.alias || ((_a = entry.key) != null ? _a : ""));
      span.addClass("ep-editable");
      span.setAttr("title", this.i18n.t("entry.changeKeyHint"));
      span.onclick = (ev) => {
        var _a2;
        ev.preventDefault();
        const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
        input.type = "text";
        input.value = (_a2 = entry.key) != null ? _a2 : "";
        span.replaceWith(input);
        input.focus();
        input.select();
        new PropSuggest(this.app, input, this.i18n, () => this.propCandidates(), (key) => this.renameKey(entry, key));
        let done = false;
        const finish = (save) => {
          if (done) return;
          done = true;
          if (input.parentElement) input.replaceWith(span);
          if (save) {
            const v = input.value.trim();
            if (v && v !== entry.key) this.renameKey(entry, v);
          }
        };
        input.onblur = () => window.setTimeout(() => finish(true), 120);
        input.onkeydown = (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            finish(false);
          }
        };
      };
    } else if (this.editMode) {
      bindRename(span, (_b = entry.alias) != null ? _b : "", this.defaultLabelFor(entry), this.i18n.t("entry.renameHint"), (v) => {
        entry.alias = v || void 0;
        this.saveLayout();
        this.render();
      });
    } else {
      span.setText(entry.alias || this.defaultLabelFor(entry));
      span.addClass("ep-clickname");
      span.onclick = () => this.highlight(span);
    }
    if (entry.kind === "prop" && entry.showType !== false) {
      const typeId = this.resolveType(entry);
      const def = this.registries.valueTypes.get(typeId);
      const hint = span.createSpan({ cls: "ep-type-hint", text: def ? def.name(this.i18n) : typeId });
      if (this.editMode) {
        hint.addClass("ep-editable");
        hint.tabIndex = 0;
        hint.setAttr("role", "button");
        hint.setAttr("title", this.i18n.t("entry.typeHint"));
        hint.setAttr("aria-label", this.i18n.t("entry.typeHint"));
        const openTypeMenu = (x, y) => {
          const menu = new import_obsidian28.Menu();
          for (const vt of this.registries.valueTypes.all()) {
            if (vt.deprecated && vt.id !== typeId) continue;
            menu.addItem(
              (mi) => mi.setTitle(vt.name(this.i18n)).setChecked(vt.id === typeId).onClick(() => {
                if (entry.key) setSharedDataType(this.settings, entry.key, vt.id);
                entry.dataType = vt.id;
                this.saveLayout();
                this.render();
              })
            );
          }
          menu.showAtPosition({ x, y });
        };
        hint.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openTypeMenu(e.clientX, e.clientY);
        };
        hint.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            const r = hint.getBoundingClientRect();
            openTypeMenu(r.left, r.bottom + 2);
          }
        });
      }
    }
  }
  /**
   * Width-responsive decorations: per section, progressively hide the
   * data-type hints, then the modifier chains, then the dice tags while
   * any row overflows - and bring them back when the sidebar grows.
   * Re-run on every render and on container resize.
   */
  responsivePass() {
    var _a, _b;
    const fs = parseFloat(getComputedStyle(this.content).fontSize) || 16;
    const SLACK = 1.5 * fs;
    const TIERS = [".ep-type-hint", ".ep-dice-tag", ".ep-denote", ".ep-tog-cell", ".ep-mod-badge"];
    const mode = this.editMode ? "e" : "v";
    for (const el of this.content.findAll(".ep-section")) {
      const sec = el;
      if (sec.clientWidth === 0) continue;
      const heads = sec.findAll(".ep-entry-head").filter((h) => h.clientWidth > 0);
      const id = (_a = sec.getAttribute("data-ep-id")) != null ? _a : "";
      const sig = sec.clientWidth + "|" + heads.length + "|" + mode;
      if (id && this.respSig.get(id) === sig) continue;
      sec.addClass("ep-measuring");
      sec.findAll(".ep-squeezed").forEach((x) => x.removeClass("ep-squeezed"));
      const cgrid = sec.querySelector(".ep-grid.ep-mode-columns, .ep-grid.ep-mode-grid");
      const ncol = cgrid ? Math.max(1, parseInt((_b = cgrid.getAttribute("data-ep-cols")) != null ? _b : "1", 10)) : 1;
      if (cgrid) {
        cgrid.removeClass("ep-compact");
        cgrid.removeClass("ep-compact-steppers");
        cgrid.setCssStyles({ gridTemplateColumns: `repeat(${ncol}, minmax(0, 1fr))` });
      }
      alignClustersNow(sec);
      let safetyNet = null;
      if (cgrid && !this.editMode) {
        const cheads = cgrid.findAll(".ep-entry-head").filter((h) => h.clientWidth > 0);
        if (cheads.length) {
          const maxCluster = () => {
            let m = 0;
            for (const h of cheads) {
              const c = h.querySelector(".ep-cluster");
              if (c) m = Math.max(m, c.offsetWidth);
            }
            return m;
          };
          const gridW = cgrid.clientWidth;
          const gapPx = parseFloat(window.getComputedStyle(cgrid).columnGap || "0") || 0;
          const inset = 8;
          const colW = (n) => (gridW - gapPx * (n - 1)) / n - inset;
          const maxOf = (sel) => {
            let m = 0;
            for (const h of cheads) {
              const c = h.querySelector(sel);
              if (c) m = Math.max(m, c.offsetWidth);
            }
            return m;
          };
          const rollW = maxOf(".ep-cluster .ep-roll-cell");
          const numW = maxOf(".ep-cluster .ep-num");
          const labelMin = (rollW || 2.6 * fs) + 5;
          const floorNeed = labelMin + numW + (numW && rollW ? 2 : 0) + rollW;
          const fullNeed = labelMin + maxCluster();
          cgrid.addClass("ep-compact-steppers");
          const noStepNeed = labelMin + maxCluster();
          cgrid.addClass("ep-compact");
          let cols = ncol;
          while (cols > 1 && colW(cols) < floorNeed) cols--;
          if (colW(cols) >= fullNeed) {
            cgrid.removeClass("ep-compact");
            cgrid.removeClass("ep-compact-steppers");
          } else if (colW(cols) >= noStepNeed) {
            cgrid.removeClass("ep-compact");
          }
          cgrid.setCssStyles({ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` });
          safetyNet = () => {
            while (cols > 1 && cheads.some((h) => h.scrollWidth > h.clientWidth + 1)) {
              cols--;
              cgrid.setCssStyles({ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` });
            }
            const flowed = cols < ncol;
            const cells = [];
            for (const child of Array.from(cgrid.children)) {
              if (child.instanceOf(HTMLElement)) cells.push(child);
            }
            let firstTop = Infinity;
            for (const el2 of cells) firstTop = Math.min(firstTop, el2.offsetTop);
            for (const el2 of cells) el2.toggleClass("ep-rowflow", flowed && el2.offsetTop > firstTop + 1);
          };
        }
      }
      const range = sec.ownerDocument.createRange();
      const spareOf = (n) => {
        range.selectNodeContents(n);
        const cw = range.getBoundingClientRect().width;
        return n.getBoundingClientRect().width - cw;
      };
      const isTight = (h) => {
        const name = h.querySelector(".ep-line-name");
        return h.scrollWidth > h.clientWidth + 1 || !!name && spareOf(name) < SLACK;
      };
      let candidates = heads;
      for (const cls of TIERS) {
        candidates = candidates.filter(isTight);
        if (!candidates.length) break;
        for (const h of candidates) {
          h.findAll(cls).forEach((x) => {
            x.addClass("ep-squeezed");
            const cell = x.closest("[data-ep-slot]");
            if (cell) cell.setCssStyles({ minWidth: "" });
          });
        }
      }
      safetyNet == null ? void 0 : safetyNet();
      void sec.offsetWidth;
      sec.removeClass("ep-measuring");
      if (id) this.respSig.set(id, sig);
    }
  }
  // -- layout & rendering -------------------------------------------------------
  stickyTopPx() {
    var _a, _b;
    const hh = ((_a = this.headerEl) == null ? void 0 : _a.offsetHeight) || 0;
    const zh = ((_b = this.stickyZoneEl) == null ? void 0 : _b.offsetHeight) || 0;
    return hh + zh;
  }
  reflowSticky() {
    if (this.headerEl && this.stickyZoneEl) this.stickyZoneEl.setCssStyles({ top: this.headerEl.offsetHeight + "px" });
    const cap = Math.max(90, Math.floor(this.content.clientHeight * 0.34));
    this.content.setCssProps({ "--ep-zone-max": cap + "px", "--ep-sticky-top": this.stickyTopPx() + "px" });
  }
  /** Animate a container's height change (edit-mode transitions). */
  animateHeight(el, fromH) {
    if (!el || fromH <= 0) return;
    const toH = el.scrollHeight;
    if (Math.abs(toH - fromH) < 2) return;
    const prevO = el.style.overflow;
    el.setCssStyles({ overflow: "hidden", height: fromH + "px" });
    void el.offsetWidth;
    el.setCssStyles({ transition: "height .28s ease", height: toH + "px" });
    const done = () => {
      el.setCssStyles({ height: "", transition: "", overflow: prevO });
      el.removeEventListener("transitionend", done);
    };
    el.addEventListener("transitionend", done);
  }
  applyTypography(container) {
    const d = this.settings.defaults;
    const set = (k, v) => {
      if (v && v > 0) container.setCssProps({ [k]: v + "px" });
      else container.style.removeProperty(k);
    };
    if (d.fontFamily) container.setCssProps({ "--ep-font": d.fontFamily });
    else container.style.removeProperty("--ep-font");
    set("--ep-size-base", d.baseSize);
    set("--ep-size-label", d.labelSize);
    set("--ep-size-value", d.valueSize);
    set("--ep-size-title", d.titleSize);
    set("--ep-size-list", d.listSize);
  }
  render() {
    const t = this.i18n.t.bind(this.i18n);
    const container = this.content;
    const prevScroll = container.scrollTop;
    const animate = this.modeAnim;
    const oldFlowH = animate && this.flowEl ? this.flowEl.offsetHeight : 0;
    const oldZoneH = animate && this.stickyZoneEl ? this.stickyZoneEl.offsetHeight : 0;
    const oldFootH = animate && this.footerZoneEl ? this.footerZoneEl.offsetHeight : 0;
    container.empty();
    container.addClass("ep-sidebar");
    container.toggleClass("ep-editing", this.editMode);
    this.applyTypography(container);
    if (animate) {
      container.addClass("ep-mode-anim");
      this.modeAnim = false;
      window.setTimeout(() => container.removeClass("ep-mode-anim"), 320);
    }
    this.updaters = [];
    this.sectionEls = {};
    this.respSig.clear();
    this.condVals.clear();
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      this.note.path = null;
      container.createDiv({ cls: "ep-empty", text: t("view.noNote") });
      return;
    }
    if (this.note.path !== file.path) {
      this.note.load(file);
      this.hub.notifyFileChanged();
    }
    const types = this.note.noteTypes();
    let match = this.settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
    if (!match && types.length) {
      match = types[0];
      if (!this.settings.types.some((tp) => tp.toLowerCase() === match.toLowerCase())) this.settings.types.push(match);
      this.plugin.ensureLayout(match.toLowerCase());
      void this.plugin.saveSettings();
    }
    this.activeTypeKey = match ? match.toLowerCase() : null;
    if (!match) {
      const box = container.createDiv({ cls: "ep-empty" });
      box.createDiv({ text: t("view.noType", { note: file.basename }) });
      if (this.settings.types.length) {
        box.createDiv({ cls: "ep-empty-sub", text: t("view.noTypeHint") });
        for (const tp of this.settings.types) {
          const b = box.createEl("button", { text: t("view.setType", { type: tp }), cls: "mod-cta" });
          b.onclick = () => this.note.set(file, "Type", tp, true);
        }
      } else {
        box.createDiv({ cls: "ep-empty-sub", text: t("view.noTypesConfigured") });
      }
      return;
    }
    const header = container.createDiv({ cls: "ep-header" });
    this.headerEl = header;
    const titleRow = header.createDiv({ cls: "ep-titlerow" });
    titleRow.createDiv({ cls: "ep-title", text: file.basename });
    const badge = titleRow.createSpan({ cls: "ep-type-badge", text: match });
    badge.setAttr("title", t("view.typeBadgeHint"));
    const editBtn = titleRow.createEl("button", {
      cls: "ep-edit-toggle",
      text: this.editMode ? t("view.done") : t("view.edit")
    });
    if (this.editMode) editBtn.addClass("is-active");
    editBtn.setAttr("title", this.editMode ? t("view.doneHint") : t("view.editHint"));
    editBtn.onclick = () => {
      this.modeAnim = true;
      if (this.editMode) this.requestExit();
      else this.enterEdit();
    };
    if (this.editMode) {
      const tools = header.createDiv({ cls: "ep-toolbar" });
      const addSec = tools.createEl("button", { text: t("view.addSection"), cls: "ep-tool-btn" });
      addSec.onclick = () => {
        const d = this.settings.defaults;
        this.layout.sections.unshift({
          id: genId(),
          title: t("section.newName"),
          columns: d.sectionColumns,
          transparent: d.sectionTransparent,
          pin: d.sectionSticky ? "header" : void 0,
          size: d.sectionSize,
          collapsible: d.sectionCollapsible,
          dividers: d.sectionDividers,
          entries: []
        });
        this.saveLayout();
        this.render();
      };
      const reset = tools.createEl("button", { text: t("view.resetAll"), cls: "ep-tool-btn" });
      reset.onclick = () => new ConfirmModal(
        this.app,
        this.i18n,
        t("view.resetConfirm", { type: match }),
        () => this.plugin.resetLayout(this.activeTypeKey)
      ).open();
      const templates = this.registries.sectionTemplates.all();
      if (templates.length) {
        const defRow = header.createDiv({ cls: "ep-default-row" });
        defRow.createSpan({ cls: "ep-default-lbl", text: t("view.addTemplates") });
        for (const tpl of templates) {
          const b = defRow.createEl("button", { text: tpl.name(this.i18n), cls: "ep-mini-btn" });
          b.onclick = () => this.addOrResetTemplate(tpl.id);
        }
      }
    }
    this.stickyZoneEl = container.createDiv({ cls: "ep-sticky-zone" });
    const flow = container.createDiv({ cls: "ep-flow" });
    this.flowEl = flow;
    this.footerZoneEl = container.createDiv({ cls: "ep-footer-zone" });
    const host = {
      registerSectionEl: (id, el) => this.sectionEls[id] = el,
      reflowSticky: () => this.reflowSticky()
    };
    const stickyOn = featureOn(this.settings, "sticky");
    for (const section of this.layout.sections) {
      const pin = stickyOn ? sectionPin(section) : "body";
      const zone = pin === "header" ? this.stickyZoneEl : pin === "footer" ? this.footerZoneEl : flow;
      renderSection(zone, this, file, section, this.drag, host);
    }
    this.lastEmptySig = this.emptySig();
    this.initRovingFocus();
    container.scrollTop = prevScroll;
    window.requestAnimationFrame(() => {
      this.reflowSticky();
      window.requestAnimationFrame(() => this.responsivePass());
    });
    if (this.resizeObs) {
      this.resizeObs.disconnect();
      if (this.headerEl) this.resizeObs.observe(this.headerEl);
      if (this.stickyZoneEl) this.resizeObs.observe(this.stickyZoneEl);
      if (this.footerZoneEl) this.resizeObs.observe(this.footerZoneEl);
      if (this.flowEl) this.resizeObs.observe(this.flowEl);
    }
    if (animate)
      window.requestAnimationFrame(() => {
        this.animateHeight(this.flowEl, oldFlowH);
        this.animateHeight(this.stickyZoneEl, oldZoneH);
        this.animateHeight(this.footerZoneEl, oldFootH);
      });
  }
  /** Add a template section, or offer to reset it when it already exists. */
  addOrResetTemplate(id) {
    const tpl = this.registries.sectionTemplates.get(id);
    if (!tpl) return;
    const existing = this.layout.sections.find((s) => s.id === id);
    const apply = () => {
      const fresh = tpl.build(this.i18n);
      if (existing) {
        const idx = this.layout.sections.findIndex((s) => s.id === id);
        this.layout.sections[idx] = fresh;
      } else {
        this.layout.sections.unshift(fresh);
      }
      this.provisionTemplateSources(tpl, fresh);
      this.seedTemplateProperties(fresh);
      this.saveLayout();
      this.render();
    };
    if (existing)
      new ConfirmModal(this.app, this.i18n, this.i18n.t("view.templateResetConfirm", { name: existing.title }), apply).open();
    else apply();
  }
  /**
   * Make every modifier source a template refers to a real, editable
   * property entry: first the entries the template declares (with their
   * full configuration, e.g. a derived proficiency bonus), then plain
   * number entries for any remaining influence sources.
   */
  provisionTemplateSources(tpl, fresh) {
    var _a, _b;
    const have = /* @__PURE__ */ new Set();
    for (const s of this.layout.sections)
      for (const e of s.entries) if (e.kind === "prop" && e.key) have.add(e.key.toLowerCase());
    const declared = ((_b = (_a = tpl.sources) == null ? void 0 : _a.call(tpl, this.i18n)) != null ? _b : []).filter(
      (e) => e.key && !have.has(e.key.toLowerCase())
    );
    for (const e of declared) have.add(e.key.toLowerCase());
    fresh.entries.unshift(...declared);
    ensurePropEntries(this.layout, fresh, influenceSources(fresh.entries));
  }
  /**
   * Template properties become real note properties right away (value
   * `null` for the ones the note doesn't have yet). They stay hidden from
   * Obsidian's properties panel through the usual hide-shown rule, since
   * they are now shown in the sidebar.
   */
  seedTemplateProperties(fresh) {
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const missing = {};
    for (const e of fresh.entries)
      if (e.kind === "prop" && e.key && this.note.raw[e.key] === void 0) missing[e.key] = null;
    if (Object.keys(missing).length) this.note.setMany(file, missing);
  }
};

// src/ui/table-view.ts
var import_obsidian29 = require("obsidian");
var VIEW_TYPE_TABLE = "extended-properties-table";
var NUMERIC2 = /* @__PURE__ */ new Set(["number", "decimal", "unit", "formula", "derived"]);
var VIRT_THRESHOLD = 150;
var ROW_H = 29;
function fmtCell(v) {
  if (v === void 0 || v === null) return "";
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  return String(v);
}
function linkTarget3(raw) {
  const m = /\[\[([^\]|#]+)/.exec(raw);
  return (m ? m[1] : raw).trim();
}
var TableView = class extends import_obsidian29.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.typeKey = "";
    this.filter = "";
    /** Paths rendered as rows of the current type (refresh scoping). */
    this.shownPaths = /* @__PURE__ */ new Set();
    /** Active virtualization scroll listener, cleaned up between renders. */
    this.scrollEl = null;
    this.scrollFn = null;
  }
  getViewType() {
    return VIEW_TYPE_TABLE;
  }
  getDisplayText() {
    return this.plugin.i18n.t("table.title");
  }
  getIcon() {
    return "table";
  }
  async onOpen() {
    var _a;
    const s = this.plugin.settings;
    const remembered = s.tableLastType && s.types.some((tp) => tp.toLowerCase() === s.tableLastType.toLowerCase()) ? s.tableLastType : (_a = s.types[0]) != null ? _a : "";
    this.typeKey = remembered != null ? remembered : "";
    this.render();
  }
  /**
   * Re-render on external metadata / workspace changes. When the changed file
   * is known, skip the rebuild unless that file is a row of the shown type -
   * or was one before the change (so losing the type removes the row).
   */
  refresh(file) {
    var _a;
    if (file && !this.shownPaths.has(file.path)) {
      const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
      const tv = fm ? getCI(fm, "Type") : void 0;
      const types = Array.isArray(tv) ? tv.map((x) => String(x).toLowerCase()) : tv === void 0 || tv === null ? [] : [String(tv).toLowerCase()];
      if (!types.includes(this.typeKey.trim().toLowerCase())) return;
    }
    this.render();
  }
  get body() {
    return this.containerEl.children[1];
  }
  // -- data ------------------------------------------------------------------
  rows(typeKey) {
    return this.plugin.props.rowsByType(typeKey);
  }
  layoutFor(typeKey) {
    const s = this.plugin.settings;
    if (!s.tableLayouts) s.tableLayouts = {};
    const k = typeKey.toLowerCase();
    if (!s.tableLayouts[k]) s.tableLayouts[k] = { columns: this.defaultColumns(typeKey) };
    return s.tableLayouts[k];
  }
  defaultColumns(typeKey) {
    var _a;
    const layout = this.plugin.settings.layouts[typeKey.toLowerCase()];
    const keys = [];
    if (layout) {
      for (const sec of layout.sections)
        for (const e of sec.entries)
          if (e.kind === "prop" && e.key && !keys.includes(e.key)) keys.push(e.key);
    }
    if (keys.length) return keys.slice(0, 6);
    const freq = /* @__PURE__ */ new Map();
    for (const r of this.rows(typeKey))
      for (const k of Object.keys(r.fm)) {
        const lk = k.toLowerCase();
        if (lk === "type" || lk === "position") continue;
        freq.set(k, ((_a = freq.get(k)) != null ? _a : 0) + 1);
      }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
  }
  /** Resolve type / rollability / dice / rating-max for each column. */
  colMetas(cols, rows) {
    const layout = this.plugin.settings.layouts[this.typeKey.toLowerCase()];
    const rolling = this.plugin.settings.features["rolling"] !== false;
    const findEntry = (key) => {
      if (!layout) return void 0;
      for (const sec of layout.sections)
        for (const e of sec.entries)
          if (e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase()) return e;
      return void 0;
    };
    return cols.map((key) => {
      var _a;
      const entry = findEntry(key);
      let type = ((_a = this.plugin.settings.propTypes) == null ? void 0 : _a[key.toLowerCase()]) || (entry == null ? void 0 : entry.dataType) || this.plugin.props.obsidianType(key) || "";
      if (!type) {
        for (const r of rows) {
          const v = getCI(r.fm, key);
          if (v === void 0 || v === null) continue;
          type = typeof v === "boolean" ? "checkbox" : typeof v === "number" ? "number" : Array.isArray(v) ? "list" : "text";
          break;
        }
        if (!type) type = "text";
      }
      const roll = entry ? entry["roll"] : void 0;
      const rollable = rolling && !!roll && (NUMERIC2.has(type) || type === "rating");
      const dice = entry ? entry["dice"] : void 0;
      return { key, type, rollable, dice, max: entry == null ? void 0 : entry.max };
    });
  }
  // -- render ----------------------------------------------------------------
  render() {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const s = this.plugin.settings;
    const c = this.body;
    this.detachScroll();
    c.empty();
    c.addClass("ep-table-view");
    if (!s.types.length) {
      c.createDiv({ cls: "ep-empty", text: t("table.noTypes") });
      return;
    }
    if (!this.typeKey || !s.types.some((tp) => tp.toLowerCase() === this.typeKey.toLowerCase()))
      this.typeKey = s.types[0];
    const bar = c.createDiv({ cls: "ep-table-bar" });
    const sel = bar.createEl("select", { cls: "dropdown ep-table-type" });
    for (const tp of s.types) {
      const o = sel.createEl("option", { text: tp });
      o.value = tp;
      if (tp.toLowerCase() === this.typeKey.toLowerCase()) o.selected = true;
    }
    sel.onchange = () => {
      this.typeKey = sel.value;
      s.tableLastType = sel.value;
      void this.plugin.saveSettings();
      this.render();
    };
    const colBtn = bar.createEl("button", { cls: "ep-table-btn", text: t("table.columns") });
    colBtn.onclick = (e) => this.openColumnsMenu(e);
    const filt = bar.createEl("input", { cls: "ep-table-filter" });
    filt.type = "search";
    filt.placeholder = t("table.filter");
    filt.value = this.filter;
    const count = bar.createSpan({ cls: "ep-table-count" });
    const scroll = c.createDiv({ cls: "ep-table-scroll" });
    filt.oninput = () => {
      this.filter = filt.value;
      this.renderTable(scroll, count);
    };
    this.renderTable(scroll, count);
  }
  renderTable(scroll, count) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    this.detachScroll();
    scroll.empty();
    const layout = this.layoutFor(this.typeKey);
    const cols = layout.columns;
    const rows = this.rows(this.typeKey);
    this.shownPaths = new Set(rows.map((r) => r.file.path));
    const metas = this.colMetas(cols, rows);
    let data = rows;
    const q = this.filter.trim().toLowerCase();
    if (q)
      data = data.filter(
        (r) => r.file.basename.toLowerCase().includes(q) || cols.some((k) => fmtCell(getCI(r.fm, k)).toLowerCase().includes(q))
      );
    const sort = layout.sort;
    data = data.slice().sort((a, b) => {
      if (!sort || !sort.key) return a.file.basename.localeCompare(b.file.basename);
      const av = getCI(a.fm, sort.key);
      const bv = getCI(b.fm, sort.key);
      const an = parseNumeric(av);
      const bn = parseNumeric(bv);
      const cmp = an !== null && bn !== null ? an - bn : fmtCell(av).localeCompare(fmtCell(bv));
      return sort.dir === "desc" ? -cmp : cmp;
    });
    count.setText(t("table.count", { n: String(data.length) }));
    const table = scroll.createEl("table", { cls: "ep-table" });
    const htr = table.createEl("thead").createEl("tr");
    this.headerCell(htr, "", t("table.name"), layout, null);
    metas.forEach((m) => this.headerCell(htr, m.key, m.key, layout, m));
    const tbody = table.createEl("tbody");
    if (data.length <= VIRT_THRESHOLD) {
      for (const r of data) this.renderRow(tbody, r, metas);
      return;
    }
    const colspan = metas.length + 1;
    const renderWindow = () => {
      const top = scroll.scrollTop;
      const vh = scroll.clientHeight || 400;
      const start = Math.max(0, Math.floor(top / ROW_H) - 6);
      const end = Math.min(data.length, start + Math.ceil(vh / ROW_H) + 12);
      tbody.empty();
      if (start > 0) this.spacer(tbody, colspan, start * ROW_H);
      for (let i = start; i < end; i++) this.renderRow(tbody, data[i], metas);
      if (end < data.length) this.spacer(tbody, colspan, (data.length - end) * ROW_H);
    };
    this.scrollEl = scroll;
    this.scrollFn = renderWindow;
    scroll.addEventListener("scroll", renderWindow);
    renderWindow();
  }
  spacer(tbody, colspan, h) {
    const tr = tbody.createEl("tr", { cls: "ep-table-spacer" });
    const td = tr.createEl("td", { attr: { colspan: String(colspan) } });
    td.setCssStyles({ height: h + "px", padding: "0" });
  }
  detachScroll() {
    if (this.scrollEl && this.scrollFn) this.scrollEl.removeEventListener("scroll", this.scrollFn);
    this.scrollEl = null;
    this.scrollFn = null;
  }
  renderRow(tbody, r, metas) {
    const tr = tbody.createEl("tr");
    const nameTd = tr.createEl("td", { cls: "ep-table-name" });
    const a = nameTd.createEl("a", { text: r.file.basename, cls: "ep-table-link" });
    const open = () => void this.app.workspace.getLeaf(false).openFile(r.file);
    a.onclick = (e) => {
      e.preventDefault();
      open();
    };
    a.tabIndex = 0;
    a.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        open();
      }
    });
    for (const m of metas) {
      const td = tr.createEl("td", { cls: "ep-table-cell" });
      this.renderValue(td, r.file, r.fm, m);
    }
  }
  // -- cell rendering --------------------------------------------------------
  renderValue(td, file, fm, m) {
    var _a;
    const raw = getCI(fm, m.key);
    const type = m.type;
    if (type === "checkbox") {
      const cb = td.createEl("input");
      cb.type = "checkbox";
      cb.checked = raw === true || raw === "true";
      cb.onclick = (e) => {
        e.stopPropagation();
        this.plugin.facade.set(file, m.key, cb.checked);
      };
      return;
    }
    if (type === "rating") {
      const n = Math.max(0, Math.round((_a = parseNumeric(raw)) != null ? _a : 0));
      const max = m.max && m.max > 0 ? m.max : 5;
      const wrap = td.createSpan({ cls: "ep-cell-rating" });
      for (let i = 1; i <= max; i++) wrap.createSpan({ text: i <= n ? "\u2605" : "\u2606" });
      this.maybeRoll(td, file, m, raw);
      return;
    }
    if (type === "color") {
      const s = fmtCell(raw);
      if (s) {
        const sw = td.createSpan({ cls: "ep-cell-swatch" });
        sw.setCssStyles({ background: s });
      }
      td.createSpan({ cls: "ep-cell-muted", text: s });
      return;
    }
    if (type === "link") {
      const s = fmtCell(raw);
      const target = linkTarget3(s);
      const a = td.createEl("a", { cls: "ep-table-link", text: target || s });
      a.onclick = (e) => {
        e.preventDefault();
        if (target) void this.app.workspace.openLinkText(target, file.path, false);
      };
      return;
    }
    if (type === "image") {
      const url = this.resolveImage(fmtCell(raw), file);
      if (url) {
        const img = td.createEl("img", { cls: "ep-cell-img" });
        img.src = url;
      }
      return;
    }
    if (type === "list" || Array.isArray(raw)) {
      const arr = Array.isArray(raw) ? raw : raw === void 0 || raw === null || raw === "" ? [] : [raw];
      for (const x of arr) td.createSpan({ cls: "ep-cell-chip", text: String(x) });
      return;
    }
    if (NUMERIC2.has(type)) {
      td.addClass("ep-cell-num");
      td.createSpan({ text: fmtCell(raw) });
      this.maybeRoll(td, file, m, raw);
      this.bindCellEdit(td, file, m.key);
      return;
    }
    td.createSpan({ text: fmtCell(raw) });
    this.bindCellEdit(td, file, m.key);
  }
  maybeRoll(td, file, m, raw) {
    if (!m.rollable) return;
    const btn = td.createEl("button", { cls: "ep-table-roll" });
    (0, import_obsidian29.setIcon)(btn, "dices");
    btn.setAttr("title", this.plugin.i18n.t("table.roll"));
    btn.setAttr("aria-label", this.plugin.i18n.t("table.roll"));
    btn.onclick = (e) => {
      var _a;
      e.stopPropagation();
      try {
        const mod = (_a = parseNumeric(raw)) != null ? _a : 0;
        this.plugin.rollService().roll(`${file.basename} - ${m.key}`, mod, parseDiceOrDefault(m.dice));
      } catch (e2) {
        new import_obsidian29.Notice(this.plugin.i18n.t("table.rollFailed"));
      }
    };
  }
  bindCellEdit(td, file, key) {
    td.addClass("ep-editable-cell");
    td.tabIndex = 0;
    td.setAttr("role", "button");
    td.setAttr("aria-label", this.plugin.i18n.t("a11y.editValue"));
    td.addEventListener("keydown", (e) => {
      if (e.target === td && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        start();
      }
    });
    const start = () => {
      var _a, _b;
      const fm = (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) != null ? _b : {};
      const cur = fmtCell(getCI(fm, key));
      const input = createEl("input", { cls: "ep-table-edit" });
      input.type = "text";
      input.value = cur;
      td.empty();
      td.appendChild(input);
      input.focus();
      input.select();
      new TextLinkSuggest(this.app, input);
      let done = false;
      const finish = (save) => {
        if (done) return;
        done = true;
        if (save && input.value !== cur) {
          this.writeCellText(file, key, input.value);
          td.empty();
          td.createSpan({ text: input.value.trim() });
        } else this.render();
      };
      input.onblur = () => window.setTimeout(() => finish(true), 150);
      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          input.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      };
    };
    td.ondblclick = start;
  }
  /**
   * Write a cell edit through the plugin's shared {@link NoteFacade} - the
   * same batched, conflict-guarded, merge-aware path the sidebar and inline
   * chips use - never a raw `processFrontMatter`. Empty clears the key;
   * numeric-looking text is stored as a number.
   */
  writeCellText(file, key, value) {
    const v = value.trim();
    if (v === "") {
      this.plugin.facade.set(file, key, void 0);
      return;
    }
    const n = Number(v);
    this.plugin.facade.set(file, key, Number.isFinite(n) && String(n) === v ? n : value);
  }
  /** Resolve an image property value to a displayable URL (best effort). */
  resolveImage(src, file) {
    src = (src || "").trim();
    if (!src) return "";
    const m = src.match(/!?\[\[(.*?)\]\]/);
    const path = m ? m[1].split("|")[0].split("#")[0].trim() : src;
    if (/^(https?:|data:|app:|file:)/.test(path)) return path;
    const dest = this.app.metadataCache.getFirstLinkpathDest(path, file.path);
    if (dest) return this.app.vault.getResourcePath(dest);
    const af = this.app.vault.getAbstractFileByPath(path);
    return af instanceof import_obsidian29.TFile ? this.app.vault.getResourcePath(af) : "";
  }
  // -- header (sort + resize) ------------------------------------------------
  headerCell(tr, key, label, layout, meta) {
    var _a, _b;
    const th = tr.createEl("th", { cls: "ep-table-col ep-sortable" });
    th.createEl("button", { cls: "ep-th-label", text: label });
    if (meta) {
      const w = (_a = layout.widths) == null ? void 0 : _a[key];
      if (w && w > 0) {
        th.setCssStyles({ width: w + "px" });
        th.setCssStyles({ minWidth: w + "px" });
      }
    } else {
      th.addClass("ep-table-namecol");
    }
    const sort = layout.sort;
    const sorted = ((_b = sort == null ? void 0 : sort.key) != null ? _b : "") === key && (sort || key === "");
    if (sorted) th.addClass((sort == null ? void 0 : sort.dir) === "desc" ? "ep-sort-desc" : "ep-sort-asc");
    th.setAttr("aria-sort", sorted ? (sort == null ? void 0 : sort.dir) === "desc" ? "descending" : "ascending" : "none");
    th.onclick = () => {
      var _a2;
      const cur = layout.sort;
      if (cur && ((_a2 = cur.key) != null ? _a2 : "") === key) layout.sort = cur.dir === "asc" ? { key, dir: "desc" } : void 0;
      else layout.sort = { key, dir: "asc" };
      void this.plugin.saveSettings();
      this.render();
    };
    if (key)
      th.oncontextmenu = (e) => {
        e.preventDefault();
        const menu = new import_obsidian29.Menu();
        menu.addItem(
          (i) => i.setTitle(this.plugin.i18n.t("table.removeColumn")).setIcon("x").onClick(() => {
            layout.columns = layout.columns.filter((c) => c !== key);
            void this.plugin.saveSettings();
            this.render();
          })
        );
        menu.showAtMouseEvent(e);
      };
    if (meta) this.attachResize(th, key, layout);
  }
  attachResize(th, key, layout) {
    const grip = th.createSpan({ cls: "ep-col-resize" });
    grip.tabIndex = 0;
    grip.setAttr("role", "separator");
    grip.setAttr("aria-orientation", "vertical");
    grip.setAttr("aria-label", this.plugin.i18n.t("table.resize", { name: key }));
    grip.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      e.stopPropagation();
      const w = Math.max(48, th.offsetWidth + (e.key === "ArrowRight" ? 8 : -8));
      th.setCssStyles({ width: w + "px" });
      th.setCssStyles({ minWidth: w + "px" });
      if (!layout.widths) layout.widths = {};
      layout.widths[key] = w;
      void this.plugin.saveSettings();
    });
    grip.onclick = (e) => e.stopPropagation();
    grip.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = th.offsetWidth;
      grip.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const w = Math.max(48, startW + (ev.clientX - startX));
        th.setCssStyles({ width: w + "px" });
        th.setCssStyles({ minWidth: w + "px" });
      };
      const up = (ev) => {
        grip.releasePointerCapture(e.pointerId);
        grip.removeEventListener("pointermove", move);
        grip.removeEventListener("pointerup", up);
        if (!layout.widths) layout.widths = {};
        layout.widths[key] = Math.max(48, startW + (ev.clientX - startX));
        void this.plugin.saveSettings();
      };
      grip.addEventListener("pointermove", move);
      grip.addEventListener("pointerup", up);
    };
  }
  openColumnsMenu(e) {
    const layout = this.layoutFor(this.typeKey);
    const candidates = new Set(layout.columns);
    for (const r of this.rows(this.typeKey))
      for (const k of Object.keys(r.fm)) {
        const lk = k.toLowerCase();
        if (lk !== "type" && lk !== "position") candidates.add(k);
      }
    const typeNameOf = (k) => {
      var _a;
      const id = ((_a = this.plugin.settings.propTypes) == null ? void 0 : _a[k.toLowerCase()]) || this.plugin.props.obsidianType(k) || "";
      if (!id) return "";
      const def = this.plugin.registries.valueTypes.get(id);
      return def ? def.name(this.plugin.i18n) : id;
    };
    const sorted = [...candidates].sort(
      (a, b) => (typeNameOf(a) || "\uFFFF").localeCompare(typeNameOf(b) || "\uFFFF") || a.localeCompare(b)
    );
    const menu = new import_obsidian29.Menu();
    for (const k of sorted) {
      const tn = typeNameOf(k);
      menu.addItem(
        (i) => i.setTitle(tn ? `${k} - ${tn}` : k).setChecked(layout.columns.includes(k)).onClick(() => {
          layout.columns = layout.columns.includes(k) ? layout.columns.filter((c) => c !== k) : [...layout.columns, k];
          void this.plugin.saveSettings();
          this.render();
        })
      );
    }
    menu.showAtMouseEvent(e);
  }
  async onClose() {
    this.detachScroll();
  }
};

// src/ui/settings-tab.ts
var import_obsidian32 = require("obsidian");

// src/ui/modals/transfer-modal.ts
var import_obsidian30 = require("obsidian");
var ImportModal = class extends import_obsidian30.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.text = "";
    this.createMissing = true;
    this.target = "";
  }
  onOpen() {
    var _a, _b;
    asMobileSheet(this);
    this.draw();
    void ((_b = (_a = navigator.clipboard) == null ? void 0 : _a.readText) == null ? void 0 : _b.call(_a).then((t) => {
      if (!this.text && parseTransfer(t || "")) {
        this.text = t;
        this.draw();
      }
    }).catch(() => {
    }));
  }
  draw() {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const c = this.contentEl;
    c.empty();
    c.addClass("ep-import");
    c.createEl("h3", { text: t("transfer.importTitle") });
    const ta = c.createEl("textarea", { cls: "ep-import-text" });
    ta.placeholder = t("transfer.importPlaceholder");
    ta.value = this.text;
    ta.rows = 6;
    ta.oninput = () => {
      this.text = ta.value;
      this.drawAudit(body);
    };
    const body = c.createDiv();
    this.drawAudit(body);
  }
  drawAudit(body) {
    var _a;
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    body.empty();
    const doc = parseTransfer(this.text);
    if (!doc) {
      if (this.text.trim()) body.createEl("p", { cls: "ep-import-err", text: t("transfer.invalid") });
      return;
    }
    const sections = docSections(doc);
    const entries = sections.reduce((n, s) => n + s.entries.length, 0);
    body.createEl("p", {
      cls: "setting-item-description",
      text: t("transfer.summary", {
        kind: doc.kind === "type" ? t("transfer.kindType") : t("transfer.kindSection"),
        name: doc.name,
        sections: String(sections.length),
        entries: String(entries)
      })
    });
    const missing = missingDerivations(doc, this.plugin.settings.derivations);
    if (missing.length) {
      body.createEl("p", {
        cls: "ep-import-warn",
        text: t("transfer.missingDerivations", { list: missing.map((d) => d.name || d.id).join(", ") })
      });
      new import_obsidian30.Setting(body).setName(t("transfer.createMissing")).addToggle(
        (tg) => tg.setValue(this.createMissing).onChange((v) => this.createMissing = v)
      );
    }
    if (!this.target) this.target = doc.kind === "type" ? doc.name : (_a = this.plugin.settings.types[0]) != null ? _a : "";
    new import_obsidian30.Setting(body).setName(t("transfer.targetType")).setDesc(t("transfer.targetTypeDesc", { types: this.plugin.settings.types.join(", ") || "-" })).addText((tx) => tx.setValue(this.target).onChange((v) => this.target = v.trim()));
    new import_obsidian30.Setting(body).addButton(
      (b) => b.setButtonText(t("transfer.importBtn")).setCta().onClick(() => this.apply(doc))
    );
  }
  apply(doc) {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const p = this.plugin;
    const typeName = (this.target || doc.name).trim();
    if (!typeName) {
      new import_obsidian30.Notice(t("transfer.pickType"));
      return;
    }
    if (this.createMissing) {
      const miss = missingDerivations(doc, p.settings.derivations);
      if (miss.length) {
        p.settings.derivations.push(...miss);
        p.rebuildRegistries();
      }
    }
    const key = typeName.toLowerCase();
    if (!p.settings.types.some((x) => x.toLowerCase() === key)) p.settings.types.push(typeName);
    const layout = p.ensureLayout(key);
    layout.sections.push(...freshSections(doc));
    void p.saveSettings();
    p.refreshViews();
    new import_obsidian30.Notice(t("transfer.imported", { name: doc.name, type: typeName }));
    this.close();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/utils/dice-expr.ts
var MAX_DICE = 500;
var MAX_ITERS = 200;
function parseRoll(text) {
  const s = (text != null ? text : "").trim();
  if (!s) return { terms: [] };
  let i = 0;
  const ws = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const parseOps = () => {
    const ops = [];
    for (; ; ) {
      const rest = s.slice(i);
      let m;
      if (m = /^(kh|kl|dh|dl)(\d+)?/i.exec(rest)) {
        ops.push({ t: m[1].toLowerCase(), n: m[2] ? parseInt(m[2]) : 1 });
      } else if (m = /^!(\d+)?/.exec(rest)) {
        ops.push({ t: "explode", on: m[1] ? parseInt(m[1]) : -1 });
      } else if (m = /^(ro|r)(\d+)/i.exec(rest)) {
        ops.push({ t: "reroll", max: parseInt(m[2]), once: m[1].toLowerCase() === "ro" });
      } else if (m = /^(>=|<=|>|<|=)(\d+)/.exec(rest)) {
        ops.push({ t: "success", cmp: m[1], v: parseInt(m[2]) });
      } else break;
      i += m[0].length;
    }
    return ops;
  };
  const parseRef = () => {
    ws();
    if (s[i] === "[") {
      if (s[i + 1] === "[") {
        const close = s.indexOf("]]", i + 2);
        if (close < 0) return null;
        let name2 = s.slice(i, close + 2);
        i = close + 2;
        if (s[i] === ".") {
          i++;
          if (s[i] === "[") {
            const e2 = s.indexOf("]", i + 1);
            if (e2 < 0) return null;
            name2 += "." + s.slice(i + 1, e2);
            i = e2 + 1;
          } else {
            const am = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(s.slice(i));
            if (!am) return null;
            name2 += "." + am[0];
            i += am[0].length;
          }
        }
        return { kind: "ref", name: name2 };
      }
      const end = s.indexOf("]", i + 1);
      if (end < 0) return null;
      const name = s.slice(i + 1, end).trim();
      i = end + 1;
      return name ? { kind: "ref", name } : null;
    }
    const m = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(s.slice(i));
    if (m) {
      i += m[0].length;
      return { kind: "ref", name: m[0] };
    }
    return null;
  };
  const parseNode = () => {
    ws();
    const start = i;
    let digits = "";
    while (i < s.length && /\d/.test(s[i])) digits += s[i++];
    if (i < s.length && (s[i] === "d" || s[i] === "D")) {
      i++;
      let sides = 0;
      if (s[i] === "%") {
        sides = 100;
        i++;
      } else {
        let sd = "";
        while (i < s.length && /\d/.test(s[i])) sd += s[i++];
        if (!sd) {
          i = start;
          return parseRef();
        }
        sides = parseInt(sd);
      }
      const count = digits ? parseInt(digits) : 1;
      if (count < 1 || sides < 2) return null;
      return { kind: "dice", count, sides, ops: parseOps() };
    }
    if (digits) return { kind: "num", value: parseInt(digits) };
    return parseRef();
  };
  const terms = [];
  ws();
  let neg = false;
  if (s[i] === "+" || s[i] === "-") {
    neg = s[i] === "-";
    i++;
  }
  for (; ; ) {
    const node = parseNode();
    if (!node) return null;
    terms.push({ neg, node });
    ws();
    if (i >= s.length) break;
    if (s[i] === "+" || s[i] === "-") {
      neg = s[i] === "-";
      i++;
      continue;
    }
    return null;
  }
  return { terms };
}
function serializeNode(n, mapRef) {
  if (n.kind === "num") return String(n.value);
  if (n.kind === "ref") {
    if (mapRef) return mapRef(n.name);
    if (n.name.startsWith("[[")) return n.name;
    return /[^A-Za-z0-9_]/.test(n.name) ? `[${n.name}]` : n.name;
  }
  let s = (n.count > 1 ? n.count : "") + "d" + n.sides;
  for (const op of n.ops) {
    if (op.t === "kh" || op.t === "kl" || op.t === "dh" || op.t === "dl") s += op.t + (op.n !== 1 ? op.n : "");
    else if (op.t === "explode") s += "!" + (op.on > 0 ? op.on : "");
    else if (op.t === "reroll") s += (op.once ? "ro" : "r") + op.max;
    else if (op.t === "success") s += op.cmp + op.v;
  }
  return s;
}
function serializeRoll(ast, mapRef) {
  let out = "";
  ast.terms.forEach((term, idx) => {
    const txt = serializeNode(term.node, mapRef);
    if (idx === 0) out = term.neg ? "-" + txt : txt;
    else out += (term.neg ? " - " : " + ") + txt;
  });
  return out;
}
function cmpHit(face, cmp, v) {
  switch (cmp) {
    case ">=":
      return face >= v;
    case ">":
      return face > v;
    case "<=":
      return face <= v;
    case "<":
      return face < v;
    case "=":
      return face === v;
  }
  return false;
}
function rollDice(node, env) {
  const sides = node.sides;
  const count = Math.min(MAX_DICE, Math.max(1, node.count));
  const reroll = node.ops.find((o) => o.t === "reroll");
  const explode = node.ops.find((o) => o.t === "explode");
  const explodeOn = explode ? explode.on < 0 ? sides : explode.on : Infinity;
  const faces = [];
  const dropped = [];
  const counted = [];
  const push = (v, drop) => {
    faces.push(v);
    dropped.push(drop);
    return faces.length - 1;
  };
  for (let d = 0; d < count; d++) {
    let v = env.roll1(sides);
    if (reroll) {
      if (reroll.once) {
        if (v <= reroll.max) {
          push(v, true);
          v = env.roll1(sides);
        }
      } else {
        let it2 = 0;
        while (v <= reroll.max && it2++ < MAX_ITERS) {
          push(v, true);
          v = env.roll1(sides);
        }
      }
    }
    counted.push(push(v, false));
    let cur = v;
    let it = 0;
    while (cur >= explodeOn && faces.length < MAX_DICE && it++ < MAX_ITERS) {
      cur = env.roll1(sides);
      counted.push(push(cur, false));
    }
  }
  let active = counted.slice();
  for (const op of node.ops) {
    if (op.t !== "kh" && op.t !== "kl" && op.t !== "dh" && op.t !== "dl") continue;
    const asc = active.slice().sort((a, b) => faces[a] - faces[b]);
    const n = Math.max(0, Math.min(asc.length, op.n));
    let dropIdx = [];
    if (op.t === "kh") dropIdx = asc.slice(0, asc.length - n);
    else if (op.t === "kl") dropIdx = asc.slice(n);
    else if (op.t === "dh") dropIdx = asc.slice(asc.length - n);
    else if (op.t === "dl") dropIdx = asc.slice(0, n);
    for (const di of dropIdx) dropped[di] = true;
    active = active.filter((idx) => !dropped[idx]);
  }
  const keptFaces = counted.filter((idx) => !dropped[idx]).map((idx) => faces[idx]);
  const success = node.ops.find((o) => o.t === "success");
  const value = success ? keptFaces.filter((f) => cmpHit(f, success.cmp, success.v)).length : keptFaces.reduce((a, b) => a + b, 0);
  return { sides, faces, dropped, value, success: !!success };
}
var DEFAULT_CRIT = { critFrom: (s) => s, failAt: 1 };
function computeTone(primary, crit) {
  if (!primary) return "normal";
  const kept = primary.faces.filter((_, k) => !primary.dropped[k]);
  if (kept.length === 0) return "normal";
  const from = crit.critFrom(primary.sides);
  if (kept.every((f) => f >= from)) return "crit";
  if (crit.failAt != null && kept.every((f) => f === crit.failAt)) return "fail";
  return "normal";
}
function evalRoll(ast, env) {
  var _a, _b;
  const crit = (_a = env.crit) != null ? _a : DEFAULT_CRIT;
  const groups = [];
  const parts = [];
  let total = 0;
  let primary = null;
  for (const term of ast.terms) {
    const sign = term.neg ? -1 : 1;
    const node = term.node;
    if (node.kind === "num") {
      parts.push({ value: sign * node.value });
      total += sign * node.value;
    } else if (node.kind === "ref") {
      const r = (_b = env.resolve) == null ? void 0 : _b.call(env, node.name);
      const v = typeof r === "number" && Number.isFinite(r) ? r : 0;
      parts.push({ ref: node.name, value: sign * v });
      total += sign * v;
    } else {
      const g = rollDice(node, env);
      groups.push(g);
      total += sign * g.value;
      if (!primary && !g.success) primary = g;
    }
  }
  return { groups, parts, total, tone: computeTone(primary, crit) };
}

// src/features/rolling/macros.ts
function segsToAst(segs) {
  var _a;
  const terms = [];
  for (const s of segs != null ? segs : []) {
    if (s.dice !== void 0) {
      const parsed = parseRoll(s.dice);
      const node = parsed && ((_a = parsed.terms[0]) == null ? void 0 : _a.node.kind) === "dice" ? parsed.terms[0].node : { kind: "dice", count: 1, sides: 20, ops: [] };
      terms.push({ neg: !!s.neg, node });
    } else if (typeof s.add === "number") {
      terms.push(
        s.add < 0 ? { neg: true, node: { kind: "num", value: -s.add } } : { neg: !!s.neg, node: { kind: "num", value: s.add } }
      );
    } else if (s.ref) {
      terms.push({ neg: !!s.neg, node: { kind: "ref", name: s.ref } });
    }
  }
  return { terms };
}
function astToSegs(ast) {
  return ast.terms.map((t) => {
    const n = t.node;
    if (n.kind === "dice") return { dice: serializeNode(n), neg: t.neg || void 0 };
    if (n.kind === "num") return { add: t.neg ? -n.value : n.value };
    return { ref: n.name, neg: t.neg || void 0 };
  });
}
function segsToText(segs) {
  return serializeRoll(segsToAst(segs));
}
function textToSegs(text) {
  const ast = parseRoll(text);
  return ast ? astToSegs(ast) : null;
}
function asMode(mode) {
  return mode === "advantage" || mode === "disadvantage" ? mode : "normal";
}
function runRoll(svc2, i18n, o) {
  var _a;
  const mode = asMode(o.mode);
  const n = Math.max(1, Math.min(20, (_a = o.times) != null ? _a : 1));
  const tag = mode === "advantage" ? " " + i18n.t("roll.tagAdvantage") : mode === "disadvantage" ? " " + i18n.t("roll.tagDisadvantage") : "";
  for (let i = 0; i < n; i++) {
    const ast = segsToAst(o.segs);
    if (mode !== "normal") {
      const first = ast.terms.find((t) => t.node.kind === "dice");
      if (first) {
        const dn = first.node;
        dn.count += 1;
        dn.ops = [mode === "advantage" ? { t: "dl", n: 1 } : { t: "dh", n: 1 }, ...dn.ops];
      }
    }
    svc2.rollAst(n > 1 ? `${o.label} #${i + 1}` : o.label, ast, { stay: n > 1, tag, mode, resolve: o.resolve });
  }
}
function runMacro(svc2, i18n, m, resolve) {
  var _a;
  runRoll(svc2, i18n, {
    segs: (_a = m.segs) != null ? _a : [],
    mode: m.mode,
    times: m.times,
    label: m.name || i18n.t("roller.title"),
    resolve
  });
}
function applicableMacros(settings, typeKey) {
  const list = Array.isArray(settings.macros) ? settings.macros : [];
  return list.filter((m) => !m.typeKey || !!typeKey && m.typeKey === typeKey);
}

// src/features/rolling/dice-styles.ts
var import_obsidian31 = require("obsidian");

// src/utils/polyhedra.ts
var PHI = (1 + Math.sqrt(5)) / 2;
var SCALE = 28;
var BOX = 64;
var GAP = 3;
var sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
var cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
var len = (a) => Math.sqrt(dot(a, a));
var norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
var mean = (vs) => {
  const s = [0, 0, 0];
  for (const v of vs) {
    s[0] += v[0];
    s[1] += v[1];
    s[2] += v[2];
  }
  return [s[0] / vs.length, s[1] / vs.length, s[2] / vs.length];
};
function signs(x, y, z) {
  const out = [];
  const sx = x === 0 ? [0] : [x, -x];
  const sy = y === 0 ? [0] : [y, -y];
  const sz = z === 0 ? [0] : [z, -z];
  for (const a of sx) for (const b of sy) for (const c of sz) out.push([a, b, c]);
  return out;
}
function cyc(a, b, c) {
  return [...signs(a, b, c), ...signs(b, c, a), ...signs(c, a, b)];
}
function trapezohedron() {
  const verts = [];
  const ringR = 1;
  const ringZ = 0.16;
  const c36 = Math.cos(Math.PI / 5);
  const apexZ = ringZ * (1 + c36) / (1 - c36);
  verts.push([0, 0, apexZ]);
  verts.push([0, 0, -apexZ]);
  for (let i = 0; i < 5; i++) {
    const a = i * 2 * Math.PI / 5;
    verts.push([ringR * Math.cos(a), ringR * Math.sin(a), ringZ]);
  }
  for (let i = 0; i < 5; i++) {
    const a = i * 2 * Math.PI / 5 + Math.PI / 5;
    verts.push([ringR * Math.cos(a), ringR * Math.sin(a), -ringZ]);
  }
  const U = (i) => 2 + i % 5;
  const L = (i) => 7 + i % 5;
  const faces = [];
  for (let i = 0; i < 5; i++) faces.push([0, U(i), L(i), U(i + 1)]);
  for (let i = 0; i < 5; i++) faces.push([1, L(i), U(i + 1), L(i + 1)]);
  return { verts, faces };
}
var SOLIDS = {
  4: { verts: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] },
  // tetrahedron
  6: { verts: signs(1, 1, 1) },
  // cube
  8: { verts: [...signs(1, 0, 0), ...signs(0, 1, 0), ...signs(0, 0, 1)] },
  // octahedron
  12: { verts: [...signs(1, 1, 1), ...cyc(0, 1 / PHI, PHI)] },
  // dodecahedron
  20: { verts: cyc(0, 1, PHI) },
  // icosahedron
  10: trapezohedron()
  // pentagonal trapezohedron (explicit kite faces)
};
function hullFaces(verts) {
  const eps = 1e-4;
  const n = verts.length;
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const nrm = cross(sub(verts[j], verts[i]), sub(verts[k], verts[i]));
        if (len(nrm) < eps) continue;
        const u = norm(nrm);
        const d = dot(u, verts[i]);
        let pos = false;
        let neg = false;
        const on = [];
        for (let l = 0; l < n; l++) {
          const s = dot(u, verts[l]) - d;
          if (s > eps) pos = true;
          else if (s < -eps) neg = true;
          else on.push(l);
        }
        if (pos && neg) continue;
        if (on.length < 3) continue;
        const key = [...on].sort((a, b) => a - b).join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(orderAround(on.map((idx) => verts[idx])));
      }
  return out;
}
function numberFeature(face) {
  const k = face.length;
  const ang = face.map((v, i) => {
    const a = norm(sub(face[(i - 1 + k) % k], v));
    const b = norm(sub(face[(i + 1) % k], v));
    return Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  });
  if (k === 4 && Math.max(...ang) - Math.min(...ang) < 0.05) return mean([face[0], face[1]]);
  let idx = 0;
  for (let i = 1; i < k; i++) if (ang[i] < ang[idx]) idx = i;
  return face[idx];
}
function orderAround(face) {
  const c = mean(face);
  let n = norm(cross(sub(face[1], face[0]), sub(face[2], face[0])));
  if (dot(n, c) < 0) n = [-n[0], -n[1], -n[2]];
  const right = norm(sub(face[0], c));
  const up = cross(n, right);
  return [...face].sort((a, b) => {
    const aa = Math.atan2(dot(sub(a, c), up), dot(sub(a, c), right));
    const bb = Math.atan2(dot(sub(b, c), up), dot(sub(b, c), right));
    return aa - bb;
  });
}
function f3(x) {
  return Math.abs(x) < 1e-6 ? "0" : x.toFixed(4);
}
function makeFace(face, ss) {
  const scale = SCALE * ss;
  const box = BOX * ss;
  const gap = GAP * ss;
  const c = mean(face);
  let n = norm(cross(sub(face[1], face[0]), sub(face[2], face[0])));
  if (dot(n, c) < 0) n = [-n[0], -n[1], -n[2]];
  const d0 = dot(n, face[0]);
  const p = [n[0] * d0, n[1] * d0, n[2] * d0];
  const right = norm(sub(face[0], p));
  const up = cross(n, right);
  const place = `matrix3d(${f3(right[0])},${f3(right[1])},${f3(right[2])},0,${f3(up[0])},${f3(up[1])},${f3(up[2])},0,${f3(n[0])},${f3(n[1])},${f3(n[2])},0,${f3(p[0] * scale)},${f3(p[1] * scale)},${f3(p[2] * scale)},1)`;
  const land = `matrix3d(${f3(right[0])},${f3(up[0])},${f3(n[0])},0,${f3(right[1])},${f3(up[1])},${f3(n[1])},0,${f3(right[2])},${f3(up[2])},${f3(n[2])},0,0,0,0,1)`;
  const mid = box / 2;
  const px = face.map((v) => {
    const dd = sub(v, p);
    return [mid + dot(dd, right) * scale, mid + dot(dd, up) * scale];
  });
  const poly = (pts) => `polygon(${pts.map((p2) => `${p2[0].toFixed(1)}px ${p2[1].toFixed(1)}px`).join(", ")})`;
  const inner = px.map(([x, y]) => {
    const dx = x - mid;
    const dy = y - mid;
    const m = Math.hypot(dx, dy) || 1;
    const f = Math.max(0, 1 - gap / m);
    return [mid + dx * f, mid + dy * f];
  });
  const feat = numberFeature(face);
  const fx = dot(sub(feat, p), right);
  const fy = dot(sub(feat, p), up);
  const numRot = Math.atan2(fx, -fy) * 180 / Math.PI;
  const landUp = -90 - Math.atan2(fy, fx) * 180 / Math.PI;
  return { place, land, clip: poly(px), clipInner: poly(inner), n, sidesOfFace: face.length, numRot, landUp };
}
function buildSolid(sides, ss = 1) {
  const def = SOLIDS[sides];
  if (!def) return null;
  const maxR = Math.max(...def.verts.map((v) => len(v))) || 1;
  const verts = def.verts.map((v) => [v[0] / maxR, v[1] / maxR, v[2] / maxR]);
  const faces = def.faces ? def.faces.map((idx) => orderAround(idx.map((i) => verts[i]))) : hullFaces(verts);
  return faces.map((f) => makeFace(f, ss));
}
var SOLID_SIDES = Object.keys(SOLIDS).map(Number);

// src/features/rolling/dice-styles.ts
var rnd = (sides) => 1 + Math.floor(Math.random() * Math.max(1, sides));
function classicView(el, sides) {
  el.addClass("ep-rolling");
  const ico = el.createDiv({ cls: "ep-roll-die-ico" });
  (0, import_obsidian31.setIcon)(ico, diceIconId(sides));
  const num = el.createDiv({ cls: "ep-roll-die-num" });
  return {
    tick: () => num.setText(String(rnd(sides))),
    settle: (v) => {
      el.removeClass("ep-rolling");
      el.addClass("ep-settled");
      num.setText(String(v));
    }
  };
}
var classic = {
  id: "classic",
  name: (i) => i.t("roll.style.classic"),
  create: (el, sides) => classicView(el, sides)
};
var spin = {
  id: "spin",
  name: (i) => i.t("roll.style.spin"),
  create(el, sides) {
    el.addClass("ep-spin");
    const ico = el.createDiv({ cls: "ep-roll-die-ico" });
    (0, import_obsidian31.setIcon)(ico, diceIconId(sides));
    const num = el.createDiv({ cls: "ep-roll-die-num", text: String(rnd(sides)) });
    let timer = 0;
    let done = false;
    let owned = false;
    return {
      tick: () => {
        if (!owned && !done) num.setText(String(rnd(sides)));
      },
      roll: (_v, durationMs) => {
        owned = true;
        const dur = Math.max(300, durationMs || 700);
        const t0 = performance.now();
        const step = () => {
          if (done) return;
          num.setText(String(rnd(sides)));
          const p = Math.min(1, (performance.now() - t0) / dur);
          if (p >= 1) return;
          timer = window.setTimeout(step, 55 + 230 * p * p);
        };
        step();
      },
      settle: (v) => {
        done = true;
        window.clearTimeout(timer);
        el.removeClass("ep-spin");
        el.addClass("ep-settled");
        num.setText(String(v));
      }
    };
  }
};
var cube3d = {
  id: "3d",
  name: (i) => i.t("roll.style.threeD"),
  create(el, sides, ss) {
    const SS = ss && ss > 1 ? Math.floor(ss) : 1;
    const solid = buildSolid(sides, SS);
    if (!solid) return classicView(el, sides);
    el.addClass("ep-die3d");
    const wrap = el.createDiv({ cls: "ep-solid" });
    const k = (1 / SS).toFixed(4);
    const sc = SS > 1 ? `scale3d(${k}, ${k}, ${k}) ` : "";
    if (SS > 1) {
      wrap.setCssStyles({ width: `${BOX * SS}px`, height: `${BOX * SS}px` });
      wrap.setCssStyles({ transform: sc.trim() });
    }
    const faceEls = solid.map((f, k2) => {
      const fe = wrap.createDiv({ cls: "ep-solid-face" });
      fe.setCssStyles({ transform: f.place });
      const edge = fe.createDiv({ cls: "ep-solid-edge" });
      edge.setCssStyles({ clipPath: f.clip });
      const fill = fe.createDiv({ cls: "ep-solid-fill" });
      fill.setCssStyles({ clipPath: f.clipInner });
      const num = fe.createDiv({ cls: "ep-solid-num", text: String(k2 + 1) });
      if (SS > 1) num.setCssStyles({ fontSize: `${(1.05 * SS).toFixed(3)}em` });
      num.setCssStyles({ transform: `rotate(${f.numRot.toFixed(1)}deg)` });
      return fe;
    });
    const idxOf = (v) => v >= 1 && v <= solid.length ? v - 1 : 0;
    const landed = (idx) => `${sc}rotateZ(${solid[idx].landUp.toFixed(1)}deg) ${solid[idx].land}`;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return {
      // The motion is one continuous decelerating spin kicked off by roll();
      // there's nothing to update per frame (no more jarring re-orientations).
      tick: () => {
      },
      roll: (v, durationMs) => {
        const idx = idxOf(v);
        const ax = Math.random() * 2 - 1;
        const ay = Math.random() * 2 - 1;
        const az = (Math.random() * 2 - 1) * 0.35;
        const L = Math.hypot(ax, ay, az) || 1;
        const pre = `${sc}rotate3d(${(ax / L).toFixed(3)}, ${(ay / L).toFixed(3)}, ${(az / L).toFixed(3)}, `;
        const post = `deg) rotateZ(${solid[idx].landUp.toFixed(1)}deg) ${solid[idx].land}`;
        const tf = (ang) => `${pre}${ang}${post}`;
        const end = tf(0);
        if (reduce) {
          wrap.setCssStyles({ transform: end });
          return;
        }
        const spins = 3 + Math.floor(Math.random() * 2);
        const dur = Math.max(450, Math.min(1600, durationMs || 700));
        wrap.setCssStyles({ transform: tf(360 * spins) });
        wrap.animate(
          [
            // Decelerate quickly from the wound-up spin down onto the face...
            { transform: tf(360 * spins), offset: 0, easing: "cubic-bezier(.12,.75,.16,1)" },
            // ...carry a touch past it (the bounce)...
            { transform: tf(-9), offset: 0.86, easing: "cubic-bezier(.33,0,.5,1)" },
            // ...then settle back exactly on the face.
            { transform: end, offset: 1 }
          ],
          { duration: dur, fill: "forwards" }
        );
      },
      settle: (v) => {
        var _a;
        const idx = idxOf(v);
        wrap.setCssStyles({ transform: landed(idx) });
        (_a = faceEls[idx]) == null ? void 0 : _a.addClass("ep-solid-on");
        el.addClass("ep-settled");
      }
    };
  }
};
var STYLES = { classic, spin, "3d": cube3d };
var DICE_STYLES = [classic, spin, cube3d];
function pickDiceStyle(id) {
  return id !== void 0 && STYLES[id] || classic;
}

// src/ui/settings-tab.ts
var OVERRIDE_ROW_LIMIT = 25;
var EPSettingTab = class extends import_obsidian32.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.render();
  }
  render() {
    const c = this.containerEl;
    const plugin = this.plugin;
    const i18n = plugin.i18n;
    const t = i18n.t.bind(i18n);
    const save = () => {
      void plugin.saveSettings();
      plugin.refreshViews();
    };
    c.empty();
    c.addClass("ep-settings");
    c.createEl("p", { text: t("settings.intro") });
    new import_obsidian32.Setting(c).setName(t("settings.typesHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.typesDesc") });
    for (const type of plugin.settings.types) {
      new import_obsidian32.Setting(c).setName(type).addButton(
        (b) => b.setButtonText(t("settings.resetLayout")).onClick(
          () => new ConfirmModal(
            this.app,
            i18n,
            t("settings.resetLayoutConfirm", { type }),
            () => plugin.resetLayout(type.toLowerCase())
          ).open()
        )
      ).addButton(
        (b) => b.setButtonText(t("transfer.exportType")).setTooltip(t("transfer.exportTypeTip")).onClick(() => {
          var _a;
          const doc = packType(type, plugin.ensureLayout(type.toLowerCase()), plugin.settings.derivations, plugin.manifest.version);
          void ((_a = navigator.clipboard) == null ? void 0 : _a.writeText(JSON.stringify(doc, null, 2)));
          new import_obsidian32.Notice(t("transfer.copied"));
        })
      ).addButton(
        (b) => b.setButtonText(t("settings.deleteType")).then(destructive).onClick(() => {
          var _a;
          plugin.settings.types = plugin.settings.types.filter((x) => x !== type);
          delete plugin.settings.layouts[type.toLowerCase()];
          if (plugin.settings.layoutVault === true) void ((_a = plugin.layoutStore) == null ? void 0 : _a.remove(type));
          save();
          this.render();
        })
      );
    }
    new import_obsidian32.Setting(c).setName(t("settings.addType")).addButton(
      (b) => b.setButtonText(t("settings.addTypeBtn")).setCta().onClick(
        () => new TextPromptModal(this.app, i18n, t("settings.newTypePrompt"), "", (v) => {
          const name = v.trim();
          if (!name) return;
          if (plugin.settings.types.some((x) => x.toLowerCase() === name.toLowerCase())) {
            new import_obsidian32.Notice(t("settings.typeExists"));
            return;
          }
          plugin.settings.types.push(name);
          plugin.ensureLayout(name.toLowerCase());
          save();
          this.render();
        }).open()
      )
    );
    new import_obsidian32.Setting(c).setName(t("transfer.importHeading")).setDesc(t("transfer.importHeadingDesc")).addButton((b) => b.setButtonText(t("transfer.importBtn")).setCta().onClick(() => new ImportModal(plugin).open()));
    const d = plugin.settings.defaults;
    new import_obsidian32.Setting(c).setName(t("settings.defaultsHeading")).setHeading();
    new import_obsidian32.Setting(c).setName(t("settings.defaultDataType")).setDesc(t("settings.defaultDataTypeDesc")).addDropdown((dd) => {
      for (const def of plugin.registries.valueTypes.all()) {
        if (def.deprecated) continue;
        dd.addOption(def.id, def.name(i18n));
      }
      dd.setValue(d.dataType);
      dd.onChange((v) => {
        d.dataType = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.defaultColorSpace")).addDropdown((dd) => {
      for (const sp of COLOR_SPACES) dd.addOption(sp, sp);
      dd.setValue(d.colorSpace);
      dd.onChange((v) => {
        d.colorSpace = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.newSectionHeading")).setHeading();
    new import_obsidian32.Setting(c).setName(t("sectionOptions.columns")).addDropdown((dd) => {
      dd.addOption("1", "1");
      dd.addOption("2", "2");
      dd.setValue(String(d.sectionColumns));
      dd.onChange((v) => {
        d.sectionColumns = Number(v);
        save();
      });
    });
    const toggleRow = (name, get, set) => new import_obsidian32.Setting(c).setName(name).addToggle((tg) => {
      tg.setValue(get()).onChange((v) => {
        set(v);
        save();
      });
    });
    toggleRow(t("sectionOptions.transparent"), () => d.sectionTransparent, (v) => d.sectionTransparent = v);
    toggleRow(t("sectionOptions.pinDefault"), () => d.sectionSticky, (v) => d.sectionSticky = v);
    toggleRow(t("sectionOptions.collapsible"), () => d.sectionCollapsible, (v) => d.sectionCollapsible = v);
    toggleRow(t("settings.entryDividers"), () => d.sectionDividers, (v) => d.sectionDividers = v);
    new import_obsidian32.Setting(c).setName(t("sectionOptions.height")).addDropdown((dd) => {
      dd.addOption("unlimited", t("size.unlimited"));
      dd.addOption("s", t("size.small"));
      dd.addOption("m", t("size.medium"));
      dd.addOption("l", t("size.large"));
      dd.setValue(d.sectionSize);
      dd.onChange((v) => {
        d.sectionSize = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.derivationsHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.derivationsDesc") });
    const applyDerivations = () => {
      plugin.rebuildRegistries();
      save();
    };
    for (const dv of [...plugin.settings.derivations]) {
      new import_obsidian32.Setting(c).setName(dv.name || dv.id).addText((tx) => {
        tx.setPlaceholder(t("settings.derivationName")).setValue(dv.name).onChange((v) => {
          dv.name = v.trim() || dv.id;
          applyDerivations();
        });
      }).addText((tx) => {
        tx.setPlaceholder("f(x)").setValue(dv.formula).onChange((v) => {
          const invalid = !!v.trim() && !compileFormula(v.trim());
          tx.inputEl.toggleClass("ep-invalid", invalid);
          if (invalid) return;
          dv.formula = v.trim() || "x";
          applyDerivations();
        });
      }).addText((tx) => {
        var _a;
        tx.inputEl.addClass("ep-suffix-input");
        tx.setPlaceholder(t("settings.blockSuffix")).setValue((_a = dv.suffix) != null ? _a : "").onChange((v) => {
          dv.suffix = v.trim().replace(/^\./, "") || void 0;
          applyDerivations();
        });
        tx.inputEl.setAttr("title", t("settings.blockSuffixDesc"));
      }).addExtraButton(
        (b) => b.setIcon("trash").setTooltip(t("settings.derivationDelete")).onClick(() => {
          plugin.settings.derivations = plugin.settings.derivations.filter((x) => x !== dv);
          applyDerivations();
          this.render();
        })
      );
    }
    new import_obsidian32.Setting(c).setName(t("settings.modSuffix")).setDesc(t("settings.modSuffixDesc")).addText((tx) => {
      var _a;
      tx.setPlaceholder("s").setValue((_a = plugin.settings.modifierSuffix) != null ? _a : "s").onChange((v) => {
        plugin.settings.modifierSuffix = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.modDepth")).setDesc(t("settings.modDepthDesc")).addSlider((sl) => {
      var _a;
      sl.setLimits(0, 16, 1).setValue((_a = plugin.settings.modDepth) != null ? _a : 8).onChange((v) => {
        plugin.settings.modDepth = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.modsOffProp")).setDesc(t("settings.modsOffPropDesc")).addText((tx) => {
      tx.setValue(plugin.settings.modsOffProp).onChange((v) => {
        plugin.settings.modsOffProp = v.trim() || "Modifiers Off";
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.derivationAdd")).addButton(
      (b) => b.setButtonText(t("settings.derivationAddBtn")).onClick(() => {
        plugin.settings.derivations.push({ id: genId(), name: t("settings.newDerivation"), formula: "x" });
        applyDerivations();
        this.render();
      })
    ).addButton(
      (b) => b.setButtonText(t("settings.derivationReseed")).onClick(() => {
        const have = new Set(plugin.settings.derivations.map((x) => x.id));
        for (const dv of defaultDerivations()) if (!have.has(dv.id)) plugin.settings.derivations.push(dv);
        applyDerivations();
        this.render();
      })
    );
    new import_obsidian32.Setting(c).setName(t("settings.abbrHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.abbrDesc") });
    new import_obsidian32.Setting(c).setName(t("settings.poolSuffix")).setDesc(t("settings.poolSuffixDesc")).addText((tx) => {
      var _a;
      tx.setPlaceholder("p").setValue((_a = plugin.settings.poolSuffix) != null ? _a : "p").onChange((v) => {
        plugin.settings.poolSuffix = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.crossNote")).setDesc(t("settings.crossNoteDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.crossNote !== false).onChange((v) => {
        plugin.settings.crossNote = v ? void 0 : false;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.conflictGuard")).setDesc(t("settings.conflictGuardDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.conflictGuard !== false).onChange((v) => {
        plugin.settings.conflictGuard = v ? void 0 : false;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.snapshots")).setDesc(t("settings.snapshotsDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.snapshots === true).onChange((v) => {
        plugin.settings.snapshots = v ? true : void 0;
        save();
      });
    }).addButton((b) => b.setButtonText(t("settings.snapshotSaveNow")).onClick(() => void plugin.saveSnapshot(true))).addButton((b) => b.setButtonText(t("settings.snapshotRestore")).onClick(() => void plugin.restoreSnapshotFlow()));
    new import_obsidian32.Setting(c).setName(t("settings.layoutVault")).setDesc(t("settings.layoutVaultDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.layoutVault === true).onChange(async (v) => {
        if (v) await plugin.enableLayoutVault();
        else await plugin.disableLayoutVault();
        this.render();
      });
    });
    if (plugin.settings.layoutVault === true) {
      new import_obsidian32.Setting(c).setName(t("settings.layoutVaultFolder")).setDesc(t("settings.layoutVaultFolderDesc")).addText(
        (tx) => {
          var _a;
          return tx.setPlaceholder("_extended-properties").setValue((_a = plugin.settings.layoutVaultFolder) != null ? _a : "").onChange((v) => {
            plugin.settings.layoutVaultFolder = v.trim() || void 0;
            save();
          });
        }
      ).addButton(
        (b) => b.setButtonText(t("settings.layoutVaultReload")).onClick(() => void plugin.reloadVaultLayouts())
      );
    }
    for (const key of Object.keys(plugin.settings.sourceAbbrs).sort((a, b) => a.localeCompare(b))) {
      new import_obsidian32.Setting(c).setName(key).setDesc(t("settings.abbrDefault", { abbr: defaultAbbr(key) })).addText((tx) => {
        tx.setPlaceholder(defaultAbbr(key)).setValue(plugin.settings.sourceAbbrs[key]).onChange((v) => {
          const a = v.trim();
          if (a && a !== defaultAbbr(key)) plugin.settings.sourceAbbrs[key] = a;
          else delete plugin.settings.sourceAbbrs[key];
          save();
        });
      }).addExtraButton(
        (b) => b.setIcon("trash").setTooltip(t("settings.abbrDelete")).onClick(() => {
          delete plugin.settings.sourceAbbrs[key];
          save();
          this.render();
        })
      );
    }
    new import_obsidian32.Setting(c).setName(t("settings.abbrAdd")).addButton(
      (b) => b.setButtonText(t("settings.abbrAddBtn")).onClick(
        () => new TextPromptModal(this.app, i18n, t("settings.abbrPrompt"), "", (v) => {
          const k = v.trim();
          if (!k) return;
          if (!Object.keys(plugin.settings.sourceAbbrs).some((x) => x.toLowerCase() === k.toLowerCase()))
            plugin.settings.sourceAbbrs[k] = defaultAbbr(k);
          save();
          this.render();
        }, () => plugin.props.knownProps()).open()
      )
    );
    new import_obsidian32.Setting(c).setName(t("settings.diceHeading")).setHeading();
    new import_obsidian32.Setting(c).setName(t("settings.diceAnim")).setDesc(t("settings.diceAnimDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.diceAnim).onChange((v) => {
        plugin.settings.diceAnim = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.diceStyle")).setDesc(t("settings.diceStyleDesc")).addDropdown((dd) => {
      var _a;
      for (const st of DICE_STYLES) dd.addOption(st.id, st.name(i18n));
      dd.setValue((_a = plugin.settings.diceAnimStyle) != null ? _a : "classic").onChange((v) => {
        plugin.settings.diceAnimStyle = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.diceAa")).setDesc(t("settings.diceAaDesc")).addToggle((tg) => {
      tg.setValue(false).setDisabled(true);
    });
    new import_obsidian32.Setting(c).setName(t("settings.diceAnimMs")).setDesc(t("settings.diceAnimMsDesc")).addSlider((sl) => {
      var _a;
      sl.setLimits(0.3, 5, 0.1).setValue(((_a = plugin.settings.diceAnimMs) != null ? _a : 1500) / 1e3).onChange((v) => {
        plugin.settings.diceAnimMs = Math.round(v * 1e3);
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.diceAnimStay")).setDesc(t("settings.diceAnimStayDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.diceAnimStay).onChange((v) => {
        plugin.settings.diceAnimStay = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.diceAnimBlock")).setDesc(t("settings.diceAnimBlockDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.diceAnimBlock !== false).onChange((v) => {
        plugin.settings.diceAnimBlock = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.sound")).setDesc(t("settings.soundDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.sound !== false).onChange((v) => {
        plugin.settings.sound = v;
        save();
        this.render();
      });
    });
    if (plugin.settings.sound !== false) {
      new import_obsidian32.Setting(c).setName(t("settings.soundVolume")).setDesc(t("settings.soundVolumeDesc")).addSlider((sl) => {
        var _a;
        sl.setLimits(0, 1, 0.05).setValue((_a = plugin.settings.soundVolume) != null ? _a : 0.3).onChange((v) => {
          plugin.settings.soundVolume = v;
          save();
        });
      });
      const soundCat = (nameKey, descKey, get, set) => new import_obsidian32.Setting(c).setName(t(nameKey)).setDesc(t(descKey)).addToggle((tg) => {
        tg.setValue(get()).onChange((v) => {
          set(v);
          save();
        });
      });
      soundCat("settings.soundUi", "settings.soundUiDesc", () => plugin.settings.soundUi !== false, (v) => {
        plugin.settings.soundUi = v ? void 0 : false;
      });
      soundCat("settings.soundDice", "settings.soundDiceDesc", () => plugin.settings.soundDice !== false, (v) => {
        plugin.settings.soundDice = v ? void 0 : false;
      });
      soundCat("settings.soundCrit", "settings.soundCritDesc", () => plugin.settings.soundCrit !== false, (v) => {
        plugin.settings.soundCrit = v ? void 0 : false;
      });
    }
    new import_obsidian32.Setting(c).setName(t("settings.failOnOne")).setDesc(t("settings.failOnOneDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.failOnOne !== false).onChange((v) => {
        plugin.settings.failOnOne = v;
        save();
      });
    });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.critRangesDesc") });
    for (const sides of Object.keys(plugin.settings.critRanges).sort((a, b) => Number(a) - Number(b))) {
      new import_obsidian32.Setting(c).setName(t("settings.critRangeFrom", { sides })).addText((tx) => {
        tx.setValue(String(plugin.settings.critRanges[sides])).onChange((v) => {
          const n = parseInt(v);
          if (Number.isFinite(n) && n >= 1) {
            plugin.settings.critRanges[sides] = n;
            save();
          }
        });
      }).addExtraButton(
        (b) => b.setIcon("trash").setTooltip(t("settings.critRangeDelete")).onClick(() => {
          delete plugin.settings.critRanges[sides];
          save();
          this.render();
        })
      );
    }
    new import_obsidian32.Setting(c).setName(t("settings.critRangeAdd")).addButton(
      (b) => b.setButtonText(t("settings.critRangeAddBtn")).onClick(
        () => new TextPromptModal(this.app, i18n, t("settings.critRangePrompt"), "20", (v) => {
          const sides = parseInt(v);
          if (!Number.isFinite(sides) || sides < 2) return;
          if (plugin.settings.critRanges[String(sides)] === void 0)
            plugin.settings.critRanges[String(sides)] = sides;
          save();
          this.render();
        }).open()
      )
    );
    if (plugin.settings.features["rolling"] !== false) {
      new import_obsidian32.Setting(c).setName(t("settings.rollsHeading")).setHeading();
      new import_obsidian32.Setting(c).setName(t("settings.rollHistory")).setDesc(t("settings.rollHistoryDesc")).addToggle((tg) => {
        tg.setValue(plugin.settings.rollHistoryEnabled !== false).onChange((v) => {
          plugin.settings.rollHistoryEnabled = v;
          plugin.history.setEnabled(v);
          save();
        });
      });
      new import_obsidian32.Setting(c).setName(t("settings.rollHistoryLimit")).setDesc(t("settings.rollHistoryLimitDesc")).addSlider((sl) => {
        var _a;
        sl.setLimits(50, 2e3, 50).setValue((_a = plugin.settings.rollHistoryLimit) != null ? _a : 500).onChange((v) => {
          plugin.settings.rollHistoryLimit = v;
          plugin.history.applyLimit();
          save();
        });
      });
      new import_obsidian32.Setting(c).setName(t("settings.rollHistoryClear")).addButton(
        (b) => b.setButtonText(t("settings.rollHistoryClearBtn")).then(destructive).onClick(
          () => new ConfirmModal(this.app, i18n, t("settings.rollHistoryClearConfirm"), () => {
            plugin.history.clear();
            new import_obsidian32.Notice(t("settings.rollHistoryCleared"));
          }).open()
        )
      );
      new import_obsidian32.Setting(c).setName(t("settings.macrosHeading")).setHeading();
      c.createEl("p", { cls: "setting-item-description", text: t("settings.macrosDesc") });
      const macros = plugin.settings.macros;
      for (const m of [...macros]) {
        new import_obsidian32.Setting(c).addText(
          (tx) => tx.setPlaceholder(t("settings.macroName")).setValue(m.name).onChange((v) => {
            m.name = v.trim() || m.name;
            save();
          })
        ).addText((tx) => {
          tx.setPlaceholder("2d6 + 3").setValue(segsToText(m.segs));
          new RefSuggest(this.app, tx.inputEl, () => referenceSuggestions(plugin.settings, plugin.props.knownProps()));
          tx.onChange((v) => {
            const segs = textToSegs(v);
            if (!segs) {
              tx.inputEl.addClass("ep-invalid");
              return;
            }
            tx.inputEl.removeClass("ep-invalid");
            m.segs = segs;
            save();
          });
        }).addDropdown((dd) => {
          dd.addOption("normal", t("roll.modeNormal"));
          dd.addOption("advantage", t("roll.modeAdvantage"));
          dd.addOption("disadvantage", t("roll.modeDisadvantage"));
          dd.setValue(m.mode === "advantage" || m.mode === "disadvantage" ? m.mode : "normal");
          dd.onChange((v) => {
            m.mode = v === "normal" ? void 0 : v;
            save();
          });
        }).addDropdown((dd) => {
          var _a;
          dd.addOption("", t("settings.macroGlobal"));
          for (const tp of plugin.settings.types) dd.addOption(tp.toLowerCase(), tp);
          dd.setValue((_a = m.typeKey) != null ? _a : "");
          dd.onChange((v) => {
            m.typeKey = v || void 0;
            save();
          });
        }).addExtraButton(
          (b) => b.setIcon("trash").setTooltip(t("settings.macroDelete")).onClick(() => {
            plugin.settings.macros = macros.filter((x) => x.id !== m.id);
            save();
            this.render();
          })
        );
      }
      new import_obsidian32.Setting(c).setName(t("settings.macroAdd")).addButton(
        (b) => b.setButtonText(t("settings.macroAddBtn")).onClick(() => {
          macros.push({ id: genId(), name: t("settings.macroNewName"), segs: [{ dice: "d20" }] });
          save();
          this.render();
        })
      );
    }
    new import_obsidian32.Setting(c).setName(t("settings.typographyHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.typographyDesc") });
    new import_obsidian32.Setting(c).setName(t("settings.fontFamily")).addText((tx) => {
      tx.setPlaceholder(t("settings.fontPlaceholder")).setValue(d.fontFamily).onChange((v) => {
        d.fontFamily = v.trim();
        save();
      });
    });
    const sizeRow = (name, get, set) => new import_obsidian32.Setting(c).setName(name).addSlider((sl) => {
      sl.setLimits(0, 32, 1).setValue(get()).onChange((v) => {
        set(v);
        save();
      });
    });
    sizeRow(t("settings.baseSize"), () => d.baseSize, (n) => d.baseSize = n);
    sizeRow(t("options.labelSize"), () => d.labelSize, (n) => d.labelSize = n);
    sizeRow(t("options.valueSize"), () => d.valueSize, (n) => d.valueSize = n);
    sizeRow(t("sectionOptions.titleSize"), () => d.titleSize, (n) => d.titleSize = n);
    sizeRow(t("settings.listSize"), () => d.listSize, (n) => d.listSize = n);
    new import_obsidian32.Setting(c).setName(t("settings.languageHeading")).setHeading();
    this.renderOverrideEditor(c);
    new import_obsidian32.Setting(c).setName(t("settings.obsidianHeading")).setHeading();
    new import_obsidian32.Setting(c).setName(t("settings.hideShown")).setDesc(t("settings.hideShownDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.hideShown).onChange((v) => {
        plugin.settings.hideShown = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.propMenu")).setDesc(t("settings.propMenuDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.propMenu).onChange((v) => {
        plugin.settings.propMenu = v;
        save();
      });
    });
    new import_obsidian32.Setting(c).setName(t("settings.hiddenHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.hiddenDesc") });
    for (const k of plugin.settings.manualHide) {
      new import_obsidian32.Setting(c).setName(k).addButton(
        (b) => b.setButtonText(t("settings.unhide")).onClick(() => {
          plugin.settings.manualHide = plugin.settings.manualHide.filter((x) => x !== k);
          save();
          this.render();
        })
      );
    }
    new import_obsidian32.Setting(c).setName(t("settings.hideProperty")).addButton(
      (b) => b.setButtonText(t("settings.hidePropertyBtn")).onClick(
        () => new TextPromptModal(this.app, i18n, t("settings.hidePromptTitle"), "", (v) => {
          const k = v.trim();
          if (!k) return;
          if (!plugin.settings.manualHide.includes(k)) plugin.settings.manualHide.push(k);
          save();
          this.render();
        }, () => plugin.props.knownProps()).open()
      )
    );
    const featureToggle = (st, id) => {
      st.addToggle((tg) => {
        tg.setValue(plugin.settings.features[id] !== false).onChange((v) => {
          plugin.settings.features[id] = v;
          plugin.rebuildRegistries();
          plugin.applyFeatureGates();
          plugin.refreshViews();
          save();
          this.render();
        });
      });
    };
    new import_obsidian32.Setting(c).setName(t("settings.featuresHeading")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresDesc") });
    for (const mod of plugin.featureModules) {
      featureToggle(new import_obsidian32.Setting(c).setName(mod.name(i18n)).setDesc(mod.description(i18n)), mod.id);
    }
    new import_obsidian32.Setting(c).setName(t("settings.featuresTypes")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresTypesDesc") });
    for (const f of TYPE_FEATURES) {
      featureToggle(new import_obsidian32.Setting(c).setName(t("feature." + f.id)).setDesc(t("feature." + f.id + "Desc")), f.id);
    }
    new import_obsidian32.Setting(c).setName(t("settings.featuresUi")).setHeading();
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresUiDesc") });
    for (const f of UI_FEATURES) {
      featureToggle(new import_obsidian32.Setting(c).setName(t("feature." + f.id)).setDesc(t("feature." + f.id + "Desc")), f.id);
    }
  }
  /**
   * Searchable per-string override editor. Every UI string can be replaced;
   * a blank field returns the string to its locale default.
   */
  renderOverrideEditor(c) {
    const plugin = this.plugin;
    const i18n = plugin.i18n;
    const t = i18n.t.bind(i18n);
    new import_obsidian32.Setting(c).setName(t("settings.overrides")).setDesc(t("settings.overridesDesc")).addButton(
      (b) => b.setButtonText(t("settings.overridesReset")).onClick(() => {
        plugin.settings.stringOverrides = {};
        i18n.setOverrides({});
        void plugin.saveSettings();
        plugin.refreshViews();
        this.render();
      })
    );
    const search = c.createEl("input", { cls: "ep-edit-input" });
    search.type = "text";
    search.placeholder = t("settings.overridesSearch");
    search.setCssStyles({ width: "100%" });
    const listEl = c.createDiv();
    const renderList = () => {
      listEl.empty();
      const q = search.value.trim().toLowerCase();
      const keys = i18n.keys();
      const matches = keys.filter((k) => {
        if (!q) return plugin.settings.stringOverrides[k] !== void 0;
        return k.toLowerCase().includes(q) || i18n.baseText(k).toLowerCase().includes(q);
      });
      const shown = matches.slice(0, OVERRIDE_ROW_LIMIT);
      if (!q && !shown.length)
        listEl.createDiv({ cls: "setting-item-description", text: t("settings.overridesHint") });
      for (const key of shown) {
        new import_obsidian32.Setting(listEl).setName(key).setDesc(t("settings.overrideDefault", { text: i18n.baseText(key) })).addText((tx) => {
          var _a;
          tx.setPlaceholder(i18n.baseText(key)).setValue((_a = plugin.settings.stringOverrides[key]) != null ? _a : "").onChange((v) => {
            if (v) plugin.settings.stringOverrides[key] = v;
            else delete plugin.settings.stringOverrides[key];
            i18n.setOverrides(plugin.settings.stringOverrides);
            void plugin.saveSettings();
            plugin.refreshViews();
          });
        });
      }
      if (matches.length > shown.length)
        listEl.createDiv({
          cls: "setting-item-description",
          text: t("settings.overridesMore", { count: matches.length - shown.length })
        });
    };
    search.addEventListener("input", renderList);
    renderList();
    new import_obsidian32.Setting(c).setName(t("settings.resetHeading")).setHeading();
    new import_obsidian32.Setting(c).setName(t("settings.resetAll")).setDesc(t("settings.resetAllDesc")).addButton(
      (b) => b.setButtonText(t("settings.resetAllBtn")).then(destructive).onClick(
        () => new ConfirmModal(this.app, i18n, t("settings.resetAllConfirm"), () => {
          void plugin.resetAll().then(() => {
            new import_obsidian32.Notice(t("settings.resetAllDone"));
            this.render();
          });
        }).open()
      )
    );
  }
};

// src/ui/modals/snapshot-picker.ts
var import_obsidian33 = require("obsidian");
function pretty(name) {
  const m = name.match(/(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : name;
}
var SnapshotPickerModal = class extends import_obsidian33.FuzzySuggestModal {
  constructor(app, i18n, snaps, onPick) {
    super(app);
    this.snaps = snaps;
    this.onPick = onPick;
    this.setPlaceholder(i18n.t("snapshot.pick"));
  }
  getItems() {
    return this.snaps;
  }
  getItemText(m) {
    return pretty(m.name);
  }
  onChooseItem(m) {
    this.onPick(m);
  }
};

// src/ui/menus/prop-panel-menu.ts
var import_obsidian34 = require("obsidian");
function showPropMenu(host, e, key) {
  var _a, _b, _c;
  const { app, i18n, settings, hide } = host;
  const t = i18n.t.bind(i18n);
  const menu = new import_obsidian34.Menu();
  const hidden = hide.isHidden(key);
  menu.addItem(
    (i) => i.setTitle(hidden ? t("propPanel.showEverywhere", { key }) : t("propPanel.hideEverywhere", { key })).setIcon(hidden ? "eye" : "eye-off").onClick(() => hide.toggle(key))
  );
  const af = app.workspace.getActiveFile();
  const fm = af ? (_a = app.metadataCache.getFileCache(af)) == null ? void 0 : _a.frontmatter : null;
  const noteKeys = /* @__PURE__ */ new Set();
  if (fm) {
    for (const k of Object.keys(fm)) if (k.toLowerCase() !== "position") noteKeys.add(k);
  }
  const typeValues = [];
  if (fm) {
    const raw = (_b = fm["Type"]) != null ? _b : fm["type"];
    if (Array.isArray(raw)) raw.forEach((x) => typeValues.push(String(x)));
    else if (raw != null) typeValues.push(String(raw));
  }
  const typeKey = (_c = settings.types.find((tp) => typeValues.some((x) => x.toLowerCase() === tp.toLowerCase()))) == null ? void 0 : _c.toLowerCase();
  const layout = typeKey ? settings.layouts[typeKey] : void 0;
  const inSection = /* @__PURE__ */ new Set();
  const groups = [];
  if (layout)
    for (const sec of layout.sections) {
      const ks = [];
      for (const en of sec.entries)
        if (en.kind === "prop" && en.key) {
          ks.push(en.key);
          inSection.add(en.key.toLowerCase());
        }
      if (ks.length) groups.push({ title: sec.title, keys: ks });
    }
  const inNotes = [...noteKeys].filter((k) => !inSection.has(k.toLowerCase()));
  const others = [...settings.manualHide].filter((k) => !inSection.has(k.toLowerCase()) && !noteKeys.has(k));
  if (groups.length || inNotes.length || others.length) {
    menu.addItem((i) => {
      i.setTitle(t("propPanel.hideShow")).setIcon("eye");
      const withSub = i;
      const sub2 = withSub.setSubmenu ? withSub.setSubmenu() : null;
      if (!sub2) return;
      const addGroup = (title, keys) => {
        if (!keys.length) return;
        sub2.addItem((h) => h.setTitle(title).setDisabled(true));
        for (const k of [...new Set(keys)].sort((a, b) => a.localeCompare(b))) {
          const kHidden = hide.isHidden(k);
          sub2.addItem(
            (si) => si.setTitle(kHidden ? t("propPanel.showKey", { key: k }) : t("propPanel.hideKey", { key: k })).setIcon(kHidden ? "eye" : "eye-off").onClick(() => {
              hide.toggle(k);
              window.setTimeout(() => showPropMenu(host, e, key), 0);
            })
          );
        }
      };
      for (const g of groups) addGroup(g.title, g.keys);
      addGroup(t("propPanel.groupInNotes"), inNotes);
      addGroup(t("propPanel.groupOther"), others);
    });
  }
  menu.showAtMouseEvent(e);
}
function augmentPropsMenu(host) {
  const { i18n, hide } = host;
  const t = i18n.t.bind(i18n);
  const menus = activeDocument.querySelectorAll(".menu");
  const menu = menus[menus.length - 1];
  if (!menu || menu.querySelector(".ep-injected")) return;
  menu.createDiv({ cls: "menu-separator ep-injected" });
  const hidden = hide.hiddenKeys();
  const head = menu.createDiv({ cls: "menu-item ep-injected is-disabled" });
  head.createDiv({ cls: "menu-item-title", text: t("propPanel.hiddenHeading") });
  if (!hidden.length) {
    const none = menu.createDiv({ cls: "menu-item ep-injected is-disabled" });
    none.createDiv({ cls: "menu-item-title", text: t("propPanel.noneHidden") });
    return;
  }
  for (const h of hidden) {
    const it = menu.createDiv({ cls: "menu-item ep-injected" });
    const ic = it.createDiv({ cls: "menu-item-icon" });
    (0, import_obsidian34.setIcon)(ic, "eye");
    it.createDiv({ cls: "menu-item-title", text: h.manual ? h.key : t("propPanel.sidebarSuffix", { key: h.key }) });
    it.addEventListener("click", () => {
      hide.unhideKey(h.key);
      menu.remove();
    });
  }
  if (hidden.length > 1) {
    const all = menu.createDiv({ cls: "menu-item ep-injected" });
    const ic = all.createDiv({ cls: "menu-item-icon" });
    (0, import_obsidian34.setIcon)(ic, "eye");
    all.createDiv({ cls: "menu-item-title", text: t("propPanel.showAll") });
    all.addEventListener("click", () => {
      for (const h of hidden) hide.unhideKey(h.key);
      menu.remove();
    });
  }
}

// src/features/rolling/rolls-panel.ts
var rollsKind = {
  id: "rolls",
  addable: true,
  defaultLabel: (i18n) => i18n.t("roll.rolls"),
  render(ctx2) {
    const { view } = ctx2;
    const t = view.i18n.t.bind(view.i18n);
    view.renderLabel(ctx2.head, ctx2);
    const history = view.history;
    const e = ext(ctx2.entry);
    const tools = ctx2.extra.createDiv({ cls: "ep-log-tools" });
    const rngBtn = tools.createEl("button", { cls: "ep-mode-btn" });
    rngBtn.setAttr("title", t("roll.rngHint"));
    rngBtn.onclick = () => {
      view.settings.karmicRolls = view.settings.karmicRolls ? void 0 : true;
      view.saveLayout();
      redraw();
    };
    const chainBtn = tools.createEl("button", { cls: "ep-mode-btn", text: t("roll.logChains") });
    chainBtn.setAttr("title", t("roll.logChainsHint"));
    chainBtn.onclick = () => {
      e.rollsBrief = e.rollsBrief ? void 0 : true;
      view.saveLayout();
      redraw();
    };
    const noteBtn = tools.createEl("button", { cls: "ep-mode-btn", text: t("roll.logNoteOnly") });
    noteBtn.setAttr("title", t("roll.logNoteOnlyHint"));
    noteBtn.onclick = () => {
      e.rollsNoteOnly = e.rollsNoteOnly ? void 0 : true;
      view.saveLayout();
      redraw();
    };
    const clearBtn = tools.createEl("button", { cls: "ep-mode-btn", text: t("roll.logClear") });
    clearBtn.setAttr("title", t("roll.logClearHint"));
    clearBtn.onclick = () => {
      const noteOnly = !!e.rollsNoteOnly && !!view.note.path;
      new ConfirmModal(
        view.app,
        view.i18n,
        t(noteOnly ? "roll.logClearNoteConfirm" : "roll.logClearConfirm"),
        () => history.clear(noteOnly ? view.note.path : void 0)
      ).open();
    };
    const logEl = ctx2.extra.createDiv({ cls: "ep-log" });
    const redraw = () => {
      var _a;
      rngBtn.setText(view.settings.karmicRolls ? t("roll.rngKarmic") : t("roll.rngRandom"));
      rngBtn.toggleClass("is-active", view.settings.karmicRolls === true);
      chainBtn.toggleClass("is-active", !e.rollsBrief);
      noteBtn.toggleClass("is-active", !!e.rollsNoteOnly);
      logEl.empty();
      const records = history.query({ note: e.rollsNoteOnly ? view.note.path : void 0 });
      if (records.length === 0) {
        logEl.createDiv({ cls: "ep-log-empty", text: t("roll.logEmpty") });
        return;
      }
      for (const r of records) {
        const row = logEl.createDiv({ cls: "ep-log-row" });
        if (r.tone === "crit") row.addClass("ep-crit");
        if (r.tone === "fail") row.addClass("ep-fail");
        row.setText(e.rollsBrief ? (_a = r.brief) != null ? _a : r.text : r.text);
        const redo = history.redoFor(r.id);
        if (redo) {
          row.addClass("ep-log-click");
          row.setAttr("title", t("roll.redoHint"));
          row.onclick = () => redo();
        }
      }
    };
    redraw();
    const unsub = history.subscribe(() => {
      if (!logEl.isConnected) {
        unsub();
        return;
      }
      redraw();
    });
  }
};

// src/features/rolling/roller.ts
var import_obsidian38 = require("obsidian");

// src/features/rolling/roll-service.ts
var import_obsidian36 = require("obsidian");

// src/utils/a11y.ts
var region = null;
function live() {
  if (!region || !region.isConnected) {
    region = activeDocument.createElement("div");
    region.className = "ep-sr-only";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    activeDocument.body.appendChild(region);
  }
  return region;
}
function announce(text) {
  if (!text) return;
  const el = live();
  el.textContent = "";
  window.setTimeout(() => {
    el.textContent = text;
  }, 30);
}

// src/features/rolling/karma.ts
var INTERVENTION_RATE = 0.25;
var INTERVENTION_SPEND = 0.5;
var INTERVENTION_CAP = 0.9;
var luckDebt = 0;
function rollFace(sides, karmic) {
  const s = Math.max(2, Math.floor(sides));
  const uniform = () => 1 + Math.floor(Math.random() * s);
  if (!karmic) return uniform();
  const successFrom = Math.floor(s / 2) + 1;
  const successCount = s - successFrom + 1;
  const p = successCount / s;
  if (Math.random() < Math.min(INTERVENTION_CAP, luckDebt * INTERVENTION_RATE)) {
    luckDebt = Math.max(0, luckDebt - INTERVENTION_SPEND);
    return successFrom + Math.floor(Math.random() * successCount);
  }
  const face = uniform();
  if (face < successFrom) luckDebt += p;
  return face;
}

// src/features/rolling/dice-anim.ts
var import_obsidian35 = require("obsidian");
var uiCtx = null;
function configureRollUi(settings, save) {
  uiCtx = { settings, save };
}
var MAX_DICE_SHOWN = 200;
var TICK_MS = 80;
var AA_SS = 2;
var AA_LOCKED = true;
var layer = null;
var summaryEl = null;
var summarySig = "";
var summaryIndex = 0;
var summaryOpen = false;
var closers = /* @__PURE__ */ new Set();
var lives = /* @__PURE__ */ new Map();
var pending = 0;
function closeAllRolls() {
  for (const close of [...closers]) close();
}
function getLayer(block) {
  if (!layer || !layer.isConnected) {
    layer = activeDocument.body.createDiv({ cls: "ep-roll-layer" });
    layer.createDiv({ cls: "ep-roll-cards" });
  }
  if (block) layer.addClass("ep-roll-block");
  return layer;
}
function cardsHost(block) {
  var _a;
  const l = getLayer(block);
  return (_a = l.querySelector(".ep-roll-cards")) != null ? _a : l;
}
function dropBox(box) {
  box.remove();
  if (layer && !layer.querySelector(".ep-roll-box")) {
    layer.remove();
    layer = null;
    summaryEl = null;
    summarySig = "";
  }
}
function prepareCardFlip(host, except) {
  if (!host) return () => void 0;
  const firsts = Array.from(host.children).filter((el) => el !== except && el.classList.contains("ep-roll-box")).map((el) => ({ el, rect: el.getBoundingClientRect() }));
  return () => {
    for (const { el, rect } of firsts) {
      const now = el.getBoundingClientRect();
      const dx = rect.left - now.left;
      const dy = rect.top - now.top;
      if (!dx && !dy) continue;
      el.setCssStyles({ transition: "none", transform: `translate(${dx}px, ${dy}px)` });
      window.requestAnimationFrame(() => {
        el.setCssStyles({ transition: "transform .18s ease", transform: "" });
        window.setTimeout(() => el.setCssStyles({ transition: "" }), 240);
      });
    }
  };
}
function measureReserve() {
  if (!layer) return;
  if (summaryEl && summaryEl.isConnected) {
    layer.setCssProps({ "--ep-roll-reserve": Math.max(150, summaryEl.offsetHeight + 32) + "px" });
  } else {
    layer.style.removeProperty("--ep-roll-reserve");
  }
}
function updateSummary(i18n) {
  if (!layer) return;
  if (pending > 0 || lives.size === 0) {
    summaryEl == null ? void 0 : summaryEl.remove();
    summaryEl = null;
    summarySig = "";
    measureReserve();
    return;
  }
  const rolls = [...lives.values()];
  const uniq = [...new Set(rolls.map((r) => r.total))].sort((a, b) => a - b);
  const sig = rolls.map((r) => r.total).sort((a, b) => a - b).join(",");
  if (sig !== summarySig) {
    summarySig = sig;
    summaryIndex = Math.floor((uniq.length - 1) / 2);
  }
  summaryIndex = Math.max(0, Math.min(uniq.length - 1, summaryIndex));
  const isNew = !summaryEl;
  const prevRect = summaryEl && summaryEl.isConnected ? summaryEl.getBoundingClientRect() : null;
  summaryEl == null ? void 0 : summaryEl.remove();
  summaryEl = layer.createDiv({ cls: "ep-roll-summary" });
  if (isNew) summaryEl.addClass("ep-sum-in");
  const top = summaryEl.createDiv({ cls: "ep-roll-sum-top" });
  const valEl = top.createSpan({ cls: "ep-roll-sum-val" });
  const rerollAll = top.createEl("button", { cls: "ep-roll-sum-dismiss", text: i18n.t("roll.rerollAll") });
  rerollAll.onclick = () => {
    const redos = [...lives.values()].map((l) => l.reroll).filter((r) => !!r);
    closeAllRolls();
    for (const r of redos) r();
  };
  const dismiss = top.createEl("button", { cls: "ep-roll-sum-dismiss", text: i18n.t("roll.closeAll") });
  dismiss.onclick = closeAllRolls;
  const slider = summaryEl.createEl("input", { cls: "ep-roll-sum-slider", type: "range" });
  slider.min = "0";
  slider.max = String(uniq.length - 1);
  slider.step = "1";
  slider.value = String(summaryIndex);
  slider.disabled = uniq.length < 2;
  const groupsRow = summaryEl.createDiv({ cls: "ep-roll-sum-groups" });
  const ltGroup = groupsRow.createDiv({ cls: "ep-roll-sum-group" });
  const ltHead = ltGroup.createDiv({ cls: "ep-roll-sum-head" });
  const ltGrid = ltGroup.createDiv({ cls: "ep-roll-sum-dice" });
  const geGroup = groupsRow.createDiv({ cls: "ep-roll-sum-group" });
  const geHead = geGroup.createDiv({ cls: "ep-roll-sum-head" });
  const geGrid = geGroup.createDiv({ cls: "ep-roll-sum-dice" });
  const els = rolls.map((r) => {
    const el = createDiv({ cls: "ep-roll-sum-die" });
    const ic = el.createDiv({ cls: "ep-roll-sum-ico" });
    (0, import_obsidian35.setIcon)(ic, diceIconId(r.sides));
    el.createDiv({ cls: "ep-roll-sum-num", text: String(r.total) });
    return { total: r.total, el };
  });
  els.sort((a, b) => b.total - a.total);
  const apply = (animate) => {
    const v = uniq[summaryIndex];
    valEl.setText(String(v));
    const firsts = animate ? new Map(els.map((x) => [x.el, x.el.getBoundingClientRect()])) : null;
    let ge = 0;
    let lt = 0;
    for (const x of els) {
      if (x.total >= v) {
        geGrid.appendChild(x.el);
        ge++;
      } else {
        ltGrid.appendChild(x.el);
        lt++;
      }
    }
    geHead.setText(`>= ${v} - ${ge}`);
    ltHead.setText(`< ${v} - ${lt}`);
    if (firsts) {
      for (const x of els) {
        const a = firsts.get(x.el);
        if (!a) continue;
        const b = x.el.getBoundingClientRect();
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        if (!dx && !dy) continue;
        x.el.setCssStyles({ transition: "none", transform: `translate(${dx}px, ${dy}px)` });
        window.requestAnimationFrame(() => {
          x.el.setCssStyles({ transition: "", transform: "" });
        });
      }
    }
  };
  slider.oninput = () => {
    summaryIndex = parseInt(slider.value) || 0;
    apply(true);
  };
  apply(false);
  renderSummarySettings(summaryEl, i18n);
  if (prevRect) {
    const el = summaryEl;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (Math.abs(w - prevRect.width) >= 1 || Math.abs(h - prevRect.height) >= 1) {
      el.setCssStyles({ transition: "none", overflow: "hidden", width: prevRect.width + "px", height: prevRect.height + "px" });
      void el.offsetWidth;
      el.setCssStyles({ transition: "width .2s ease-out, height .2s ease-out", width: w + "px", height: h + "px" });
      window.setTimeout(() => {
        el.setCssStyles({ transition: "", width: "", height: "", overflow: "" });
        measureReserve();
      }, 230);
    }
  }
  window.requestAnimationFrame(measureReserve);
}
var rsId = 0;
function renderSummarySettings(host, i18n) {
  var _a, _b;
  if (!uiCtx) return;
  const { settings, save } = uiCtx;
  const wrap = host.createDiv({ cls: "ep-roll-sum-settings" });
  wrap.toggleClass("ep-open", summaryOpen);
  const tog = wrap.createEl("button", { cls: "ep-roll-sum-toggle" });
  tog.setAttr("aria-expanded", String(summaryOpen));
  const chev = tog.createSpan({ cls: "ep-chev" });
  (0, import_obsidian35.setIcon)(chev, "chevron-right");
  chev.toggleClass("ep-open", summaryOpen);
  tog.createSpan({ text: i18n.t("roll.summary.settings") });
  const acc = wrap.createDiv({ cls: "ep-roll-sum-acc" });
  const clip = acc.createDiv({ cls: "ep-roll-sum-clip" });
  const body = clip.createDiv({ cls: "ep-roll-sum-body" });
  tog.onclick = () => {
    summaryOpen = !summaryOpen;
    wrap.toggleClass("ep-open", summaryOpen);
    chev.toggleClass("ep-open", summaryOpen);
    tog.setAttr("aria-expanded", String(summaryOpen));
    host.toggleClass("ep-sum-open", summaryOpen);
    window.requestAnimationFrame(measureReserve);
    window.setTimeout(measureReserve, 120);
    window.setTimeout(measureReserve, 260);
  };
  host.toggleClass("ep-sum-open", summaryOpen);
  const labelled = (text, make) => {
    const id = "ep-rs-" + ++rsId;
    const lab = body.createEl("label", { text });
    lab.htmlFor = id;
    const el = make();
    el.id = id;
    return el;
  };
  const styleSel = labelled(i18n.t("settings.diceStyle"), () => body.createEl("select"));
  for (const st of DICE_STYLES) {
    const o = styleSel.createEl("option", { text: st.name(i18n) });
    o.value = st.id;
  }
  styleSel.value = (_a = settings.diceAnimStyle) != null ? _a : "classic";
  styleSel.onchange = () => {
    settings.diceAnimStyle = styleSel.value;
    save();
  };
  const dur = labelled(i18n.t("settings.diceAnimMs"), () => body.createEl("input"));
  dur.type = "range";
  dur.min = "300";
  dur.max = "5000";
  dur.step = "100";
  dur.value = String((_b = settings.diceAnimMs) != null ? _b : 1500);
  dur.onchange = () => {
    settings.diceAnimMs = Math.round(Number(dur.value) || 1500);
    save();
  };
  const stay = labelled(i18n.t("settings.diceAnimStay"), () => body.createEl("input"));
  stay.type = "checkbox";
  stay.checked = settings.diceAnimStay;
  stay.onchange = () => {
    settings.diceAnimStay = stay.checked;
    save();
  };
  const block = labelled(i18n.t("settings.diceAnimBlock"), () => body.createEl("input"));
  block.type = "checkbox";
  block.checked = settings.diceAnimBlock !== false;
  block.onchange = () => {
    settings.diceAnimBlock = block.checked;
    layer == null ? void 0 : layer.toggleClass("ep-roll-block", block.checked);
    save();
  };
  const snd = labelled(i18n.t("settings.sound"), () => body.createEl("input"));
  snd.type = "checkbox";
  snd.checked = settings.sound !== false;
  snd.onchange = () => {
    settings.sound = snd.checked;
    save();
  };
}
function playRollAnimation(job, i18n, done) {
  var _a, _b, _c, _d;
  if ((_b = (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-reduced-motion: reduce)")) == null ? void 0 : _b.matches) {
    done();
    return;
  }
  pending++;
  sfx.roll();
  const token = {};
  const host = cardsHost(job.block);
  const playJoin = prepareCardFlip(host);
  const box = host.createDiv({ cls: "ep-roll-box" });
  box.createDiv({ cls: "ep-roll-label", text: job.label });
  const diceRow = box.createDiv({ cls: "ep-roll-dice" });
  const diceTrack = diceRow.createDiv({ cls: "ep-roll-dice-track" });
  const chain = box.createDiv({ cls: "ep-roll-chain" });
  window.requestAnimationFrame(() => {
    host.scrollLeft = host.scrollWidth;
  });
  const flat = [];
  for (const grp of job.groups) grp.faces.forEach((_, idx) => flat.push({ grp, idx }));
  const style = pickDiceStyle(job.style);
  const aaSS = AA_LOCKED || job.aa === false ? 1 : AA_SS;
  const shown = Math.min(flat.length, MAX_DICE_SHOWN);
  const dies = [];
  for (let i = 0; i < shown; i++) {
    const sides = flat[i].grp.sides;
    const el = diceTrack.createDiv({ cls: "ep-roll-die" });
    dies.push({ el, view: style.create(el, sides, aaSS), sides });
  }
  playJoin();
  const conveyor = (i) => {
    if (i < 0 || i >= dies.length) return;
    const cw = diceRow.clientWidth;
    const die = dies[i].el;
    const offset = Math.max(0, die.offsetLeft + die.offsetWidth - cw);
    diceRow.toggleClass("ep-overflow", offset > 0);
    diceTrack.setCssStyles({ transform: offset > 0 ? `translateX(${-offset}px)` : "" });
  };
  const timers = [];
  let interval = 0;
  let pinned = job.stay;
  let resolved = false;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    if (!resolved) pending--;
    lives.delete(token);
    closers.delete(close);
    window.clearInterval(interval);
    for (const id of timers) window.clearTimeout(id);
    box.addClass("ep-closing");
    window.setTimeout(() => {
      const play = prepareCardFlip(box.parentElement, box);
      dropBox(box);
      play();
    }, 160);
    updateSummary(i18n);
  };
  closers.add(close);
  const later = (fn, ms) => {
    timers.push(window.setTimeout(() => {
      if (!closed) fn();
    }, ms));
  };
  box.toggleClass("ep-pinned", pinned);
  box.onclick = () => {
    pinned = !pinned;
    box.toggleClass("ep-pinned", pinned);
    if (resolved && !pinned) close();
  };
  const chainText = () => {
    const kept = [];
    const drops = [];
    for (const grp of job.groups) {
      grp.faces.forEach((f, i) => {
        if (grp.dropped[i]) drops.push(`(${i18n.t("roll.partDrop")} ${f})`);
        else kept.push(f);
      });
    }
    let txt = kept.join(" + ");
    if (drops.length) txt += " " + drops.join(" ");
    for (const p of job.parts) txt += ` ${fmtMod(p.value)} (${p.label})`;
    return `${txt} = ${job.total}`;
  };
  box.oncontextmenu = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const menu = new import_obsidian35.Menu();
    menu.addItem(
      (mi) => mi.setTitle(i18n.t("roll.card.copyValue")).setIcon("copy").onClick(() => {
        var _a2;
        void ((_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(String(job.total)));
      })
    );
    menu.addItem(
      (mi) => mi.setTitle(i18n.t("roll.card.copyChain")).setIcon("list").onClick(() => {
        var _a2;
        void ((_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(chainText()));
      })
    );
    if (job.reroll) {
      menu.addItem(
        (mi) => mi.setTitle(i18n.t("roll.card.reroll")).setIcon("dices").onClick(() => {
          var _a2;
          close();
          (_a2 = job.reroll) == null ? void 0 : _a2.call(job);
        })
      );
    }
    menu.addItem((mi) => mi.setTitle(i18n.t("roll.card.dismiss")).setIcon("x").onClick(close));
    menu.addItem((mi) => mi.setTitle(i18n.t("roll.closeAll")).setIcon("x-circle").onClick(closeAllRolls));
    menu.showAtMouseEvent(ev);
  };
  let sizeTimer = 0;
  const addCell = (op, valueText, labelText, cls = "") => {
    const before = box.getBoundingClientRect();
    if (op) chain.createSpan({ cls: "ep-roll-op", text: op });
    const cell = chain.createDiv({ cls: "ep-roll-cell" + (cls ? " " + cls : "") });
    cell.createDiv({ cls: "ep-roll-cellval", text: valueText });
    cell.createDiv({ cls: "ep-roll-celllab", text: labelText });
    box.setCssStyles({ transition: "none" });
    box.setCssStyles({ width: "" });
    box.setCssStyles({ height: "" });
    chain.setCssStyles({ width: "" });
    const nat = box.getBoundingClientRect();
    const w = nat.width;
    const h = nat.height;
    if (Math.abs(w - before.width) >= 1 || Math.abs(h - before.height) >= 1) {
      chain.setCssStyles({ width: Math.ceil(chain.getBoundingClientRect().width) + 1 + "px" });
      box.setCssStyles({ overflow: "hidden", width: before.width + "px", height: before.height + "px" });
      void box.offsetWidth;
      box.setCssStyles({ transition: "width .2s ease-out, height .2s ease-out", width: w + "px", height: h + "px" });
      window.clearTimeout(sizeTimer);
      sizeTimer = window.setTimeout(() => {
        box.setCssStyles({ transition: "", width: "", height: "", overflow: "" });
        chain.setCssStyles({ width: "" });
      }, 230);
    } else {
      box.setCssStyles({ transition: "" });
    }
    window.requestAnimationFrame(() => cell.addClass("ep-in"));
  };
  const resolve = () => {
    var _a2, _b2;
    resolved = true;
    pending--;
    lives.set(token, { total: job.total, sides: (_b2 = (_a2 = job.groups[0]) == null ? void 0 : _a2.sides) != null ? _b2 : 20, reroll: job.reroll });
    done();
    updateSummary(i18n);
    if (job.tone === "crit") sfx.crit();
    else if (job.tone === "fail") sfx.fail();
    if (!pinned) later(() => {
      if (!pinned) close();
    }, 1400);
  };
  const settled = [];
  let keptShown = 0;
  const settleDie = (i) => {
    settled[i] = true;
    const { grp, idx } = flat[i];
    const dropped = grp.dropped[idx];
    if (i < dies.length) {
      sfx.settle();
      dies[i].view.settle(grp.faces[idx], dropped);
      if (dropped) dies[i].el.addClass("ep-roll-drop");
      conveyor(i + 1 < dies.length ? i + 1 : i);
    }
    if (dropped) {
      addCell(null, String(grp.faces[idx]), i18n.t("roll.partDrop"), "ep-roll-dropped");
    } else {
      addCell(keptShown > 0 ? "+" : null, String(grp.faces[idx]), formatDice({ count: 1, sides: grp.sides }));
      keptShown++;
    }
  };
  const budget = Math.max(300, Math.min(1e4, job.durationMs || 1500));
  const count = flat.length + job.parts.length;
  const step = budget / (count + 1);
  for (let i = 0; i < dies.length; i++) {
    const { grp, idx } = flat[i];
    (_d = (_c = dies[i].view).roll) == null ? void 0 : _d.call(_c, grp.faces[idx], Math.round((i + 1) * step));
  }
  flat.forEach((_, i) => later(() => settleDie(i), Math.round((i + 1) * step)));
  job.parts.forEach(
    (part, p) => later(() => addCell("+", fmtMod(part.value), part.label), Math.round((flat.length + p + 1) * step))
  );
  later(() => {
    addCell("=", String(job.total), i18n.t("roll.partTotal"), "ep-roll-totalcell");
    resolve();
  }, budget);
  interval = window.setInterval(() => {
    let rolling = false;
    for (let i = 0; i < dies.length; i++) {
      if (settled[i]) continue;
      rolling = true;
      dies[i].view.tick();
    }
    if (!rolling) window.clearInterval(interval);
  }, TICK_MS);
}

// src/features/rolling/roll-service.ts
var ROLL_SERVICE = "rolling.rolls";
var RollService = class {
  /**
   * @param history plugin-level store every resolved roll is recorded into
   * @param app     used to attribute each record to the active note and resolve references
   */
  constructor(i18n, settings, history, app) {
    this.i18n = i18n;
    this.settings = settings;
    this.history = history;
    this.app = app;
    /** Default roll mode for this view (overridable per roll via {@link RollOpts.mode}). */
    this.mode = "normal";
  }
  /** {@link ViewService} hook. The history is plugin-level, so a note switch needs no per-view reaction. */
  onFileChange() {
  }
  /**
   * Roll `spec` + `modifier` under the current (or overridden) mode. Builds a
   * trivial AST: advantage/disadvantage become an extra die dropped low/high,
   * extra pools become extra dice terms, the modifier a number term.
   * @param spec dice pool to roll (defaults to a single d20)
   */
  roll(label, modifier, spec = { ...DEFAULT_DICE }, opts = {}) {
    var _a, _b;
    const mode = (_a = opts.mode) != null ? _a : this.mode;
    const primary = {
      kind: "dice",
      count: Math.max(1, spec.count) + (mode === "normal" ? 0 : 1),
      sides: spec.sides,
      ops: mode === "advantage" ? [{ t: "dl", n: 1 }] : mode === "disadvantage" ? [{ t: "dh", n: 1 }] : []
    };
    const terms = [{ neg: false, node: primary }];
    for (const ex of (_b = opts.extra) != null ? _b : [])
      terms.push({ neg: false, node: { kind: "dice", count: Math.max(1, ex.count), sides: ex.sides, ops: [] } });
    if (modifier) terms.push({ neg: modifier < 0, node: { kind: "num", value: Math.abs(modifier) } });
    this.rollAst(label, { terms }, {
      parts: opts.parts,
      stay: opts.stay,
      tag: this.modeTag(mode),
      mode,
      reroll: () => this.roll(label, modifier, spec, opts)
    });
  }
  /** Evaluate and resolve a full roll AST: animate, toast, and record it. */
  rollAst(label, ast, opts = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const karmic = ((_a = this.settings) == null ? void 0 : _a.karmicRolls) === true;
    const env = {
      roll1: (sides) => rollFace(sides, karmic),
      resolve: (_b = opts.resolve) != null ? _b : this.noteResolver(),
      crit: this.critRules()
    };
    const res = evalRoll(ast, env);
    const tag = (_c = opts.tag) != null ? _c : "";
    const total = res.total;
    const groups = res.groups.map((g) => ({ sides: g.sides, faces: g.faces, dropped: g.dropped }));
    const parts = (_d = opts.parts) != null ? _d : res.parts.filter((p) => p.ref !== void 0 || p.value !== 0).map((p) => ({ label: p.ref ? this.refLabel(p.ref) : this.i18n.t("roll.partMod"), value: p.value }));
    const notation = serializeRoll(ast);
    const brief = `${label}${tag}: ${total}`;
    const redo = (_e = opts.reroll) != null ? _e : () => this.rollAst(label, ast, opts);
    const commit2 = (silent = false) => {
      var _a2, _b2, _c2, _d2;
      const file = (_a2 = this.app) == null ? void 0 : _a2.workspace.getActiveFile();
      const rec = {
        id: genId(),
        time: Date.now(),
        note: (_b2 = file == null ? void 0 : file.path) != null ? _b2 : null,
        noteName: file == null ? void 0 : file.basename,
        label: `${label}${tag}`,
        text: `${brief}   (${this.detailText(res)})`,
        brief,
        total,
        mode: (_c2 = opts.mode) != null ? _c2 : "normal",
        tone: res.tone,
        dice: notation
      };
      (_d2 = this.history) == null ? void 0 : _d2.append(rec, redo);
      if (!silent) new import_obsidian36.Notice(brief, 4e3);
      announce(brief);
    };
    if ((_f = this.settings) == null ? void 0 : _f.diceAnim) {
      playRollAnimation(
        {
          label: `${label}${tag}`,
          groups,
          parts,
          total,
          spins: (_g = this.settings.diceAnimRolls) != null ? _g : 10,
          durationMs: (_h = this.settings.diceAnimMs) != null ? _h : 1500,
          style: (_i = this.settings.diceAnimStyle) != null ? _i : "classic",
          aa: this.settings.dice3dAA !== false,
          tone: res.tone,
          stay: opts.stay || this.settings.diceAnimStay === true,
          block: this.settings.diceAnimBlock !== false,
          reroll: redo
        },
        this.i18n,
        () => commit2(true)
        // the roll card is the result display; no extra Notice
      );
    } else {
      sfx.roll();
      if (res.tone === "crit") sfx.crit();
      else if (res.tone === "fail") sfx.fail();
      commit2();
    }
  }
  // -- helpers ---------------------------------------------------------------
  modeTag(mode) {
    return mode === "advantage" ? " " + this.i18n.t("roll.tagAdvantage") : mode === "disadvantage" ? " " + this.i18n.t("roll.tagDisadvantage") : "";
  }
  /** Short form for a property reference shown in the chain (reuses modifier short forms). */
  refLabel(name) {
    return this.settings ? abbrFor(this.settings, name) : name;
  }
  /** Resolve a reference against the active note's frontmatter numbers (pre-A1 resolver). */
  noteResolver() {
    const app = this.app;
    return (name) => {
      var _a;
      const file = app == null ? void 0 : app.workspace.getActiveFile();
      if (!file || !app) return void 0;
      const fm = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
      if (!fm) return void 0;
      const key = Object.keys(fm).find((k) => k.toLowerCase() === name.toLowerCase());
      if (key === void 0) return void 0;
      const v = Number(fm[key]);
      return Number.isFinite(v) ? v : void 0;
    };
  }
  /** Crit/fail policy from settings: per-die crit thresholds plus the fail-on-1 toggle. */
  critRules() {
    var _a, _b, _c;
    const ranges = (_b = (_a = this.settings) == null ? void 0 : _a.critRanges) != null ? _b : {};
    const failOnOne = ((_c = this.settings) == null ? void 0 : _c.failOnOne) !== false;
    return {
      critFrom: (sides) => {
        const r = ranges[String(sides)];
        return typeof r === "number" && r >= 1 ? r : sides;
      },
      failAt: failOnOne ? 1 : null
    };
  }
  /** Readable breakdown for the log: per-group faces (dropped parenthesized) plus the modifier parts. */
  detailText(res) {
    const segs = [];
    for (const g of res.groups) {
      if (g.faces.length === 1 && !g.success && !g.dropped[0]) {
        segs.push(String(g.value));
        continue;
      }
      const inner = g.faces.map((f, k) => g.dropped[k] ? `(${f})` : String(f)).join(", ");
      segs.push(`[${inner}]${g.success ? " => " : " -> "}${g.value}`);
    }
    let txt = segs.join(" + ");
    for (const p of res.parts) {
      if (p.ref === void 0 && p.value === 0) continue;
      txt += ` ${fmtMod(p.value)}${p.ref ? " " + this.refLabel(p.ref) : ""}`;
    }
    return txt;
  }
};

// src/features/rolling/dice-ui.ts
var import_obsidian37 = require("obsidian");
function commit(binding, spec) {
  binding.set(isDefaultDice(spec) ? void 0 : formatDice(spec));
}
function openDiceMenu(e, app, i18n, binding) {
  const cur = parseDiceOrDefault(binding.get());
  const menu = new import_obsidian37.Menu();
  for (const sides of DICE_PRESETS) {
    menu.addItem(
      (i) => i.setTitle(formatDice({ count: cur.count, sides })).setIcon(diceIconId(sides)).setChecked(cur.sides === sides).onClick(() => commit(binding, { count: cur.count, sides }))
    );
  }
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle(i18n.t("dice.customSize")).onClick(
      () => new TextPromptModal(app, i18n, i18n.t("dice.customSizePrompt"), String(cur.sides), (v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n >= 2) commit(binding, { count: cur.count, sides: n });
      }).open()
    )
  );
  menu.addItem(
    (i) => i.setTitle(i18n.t("dice.count")).onClick(
      () => new TextPromptModal(app, i18n, i18n.t("dice.countPrompt"), String(cur.count), (v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n >= 1) commit(binding, { count: n, sides: cur.sides });
      }).open()
    )
  );
  menu.addItem((i) => i.setTitle(i18n.t("dice.reset")).onClick(() => binding.set(void 0)));
  menu.showAtMouseEvent(e);
}
function addDiceSettings(container, i18n, binding) {
  const cur = () => parseDiceOrDefault(binding.get());
  let sizeBox = null;
  const setSizeActive = (on) => {
    if (!sizeBox) return;
    sizeBox.setDisabled(!on);
    sizeBox.inputEl.toggleClass("ep-disabled", !on);
  };
  new import_obsidian37.Setting(container).setName(i18n.t("dice.die")).setDesc(i18n.t("dice.dieDesc")).addDropdown((d) => {
    for (const sides of DICE_PRESETS) d.addOption(String(sides), "d" + sides);
    d.addOption("custom", i18n.t("dice.custom"));
    const c = cur();
    d.setValue(DICE_PRESETS.includes(c.sides) ? String(c.sides) : "custom");
    d.onChange((v) => {
      if (v === "custom") {
        setSizeActive(true);
        sizeBox == null ? void 0 : sizeBox.inputEl.focus();
        return;
      }
      setSizeActive(false);
      commit(binding, { count: cur().count, sides: parseInt(v) });
    });
  }).addText((t) => {
    sizeBox = t;
    t.setPlaceholder(i18n.t("dice.customSizeShort"));
    const c = cur();
    const isCustom = !DICE_PRESETS.includes(c.sides);
    t.setValue(isCustom ? String(c.sides) : "");
    setSizeActive(isCustom);
    t.onChange((v) => {
      const n = parseInt(v);
      if (Number.isFinite(n) && n >= 2) commit(binding, { count: cur().count, sides: n });
    });
  });
  new import_obsidian37.Setting(container).setName(i18n.t("dice.countLabel")).addText((t) => {
    t.setValue(String(cur().count)).onChange((v) => {
      const n = parseInt(v);
      if (Number.isFinite(n) && n >= 1) commit(binding, { count: n, sides: cur().sides });
    });
  });
}
function openRollMenu(ev, i18n, current, run, opts) {
  const pop = activeDocument.body.createDiv({ cls: "ep-popup ep-rollmenu" });
  pop.setCssStyles({ left: ev.clientX + "px" });
  pop.setCssStyles({ top: ev.clientY + 2 + "px" });
  let mode = current;
  const row = pop.createDiv({ cls: "ep-mode" });
  const btns = /* @__PURE__ */ new Map();
  const modes = [
    ["disadvantage", i18n.t("roll.modeDisadvantage")],
    ["normal", i18n.t("roll.modeNormal")],
    ["advantage", i18n.t("roll.modeAdvantage")]
  ];
  for (const [m, lbl] of modes) {
    const b = row.createEl("button", { cls: "ep-mode-btn", text: lbl });
    btns.set(m, b);
    b.onclick = () => {
      mode = m;
      for (const [k, el] of btns) el.toggleClass("is-active", k === mode);
    };
  }
  for (const [k, el] of btns) el.toggleClass("is-active", k === mode);
  const cntRow = pop.createDiv({ cls: "ep-rollmenu-count" });
  cntRow.createSpan({ text: i18n.t("roll.menu.count") });
  const input = cntRow.createEl("input", { cls: "ep-edit-input" });
  input.type = "number";
  input.min = "1";
  input.max = "20";
  input.value = "1";
  const dismiss = () => {
    pop.remove();
    activeDocument.removeEventListener("mousedown", outside);
  };
  const go = pop.createEl("button", { cls: "mod-cta ep-rollmenu-go", text: i18n.t("roll.menu.go") });
  go.onclick = () => {
    const n = clamp(Math.round(Number(input.value) || 1), 1, 20);
    dismiss();
    run(mode, n);
  };
  if (opts == null ? void 0 : opts.onEdit) {
    const edit = pop.createEl("button", { cls: "ep-mode-btn ep-rollmenu-edit", text: i18n.t("roll.menu.edit") });
    edit.onclick = () => {
      var _a;
      dismiss();
      (_a = opts.onEdit) == null ? void 0 : _a.call(opts);
    };
  }
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go.click();
    } else if (e.key === "Escape") {
      dismiss();
    }
  };
  const outside = (e) => {
    if (!pop.contains(e.target)) dismiss();
  };
  window.setTimeout(() => activeDocument.addEventListener("mousedown", outside), 0);
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  if (ev.clientX + w > window.innerWidth - 4) pop.setCssStyles({ left: Math.max(4, window.innerWidth - w - 4) + "px" });
  if (ev.clientY + h > window.innerHeight - 4) pop.setCssStyles({ top: Math.max(4, ev.clientY - h - 2) + "px" });
}

// src/features/rolling/roller.ts
function svc(view) {
  return view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings, view.history, view.app));
}
var rollerKind = {
  id: "diceroller",
  addable: true,
  defaultLabel: (i18n) => i18n.t("roller.title"),
  render(ctx2) {
    var _a;
    const { view } = ctx2;
    const t = view.i18n.t.bind(view.i18n);
    view.renderLabel(ctx2.head, ctx2);
    const e = ext(ctx2.entry);
    const wrap = ctx2.extra.createDiv({ cls: "ep-roller" });
    const segs = () => Array.isArray(e.rollerSegs) ? e.rollerSegs : [];
    const setSegs = (next) => {
      e.rollerSegs = next.length ? next : void 0;
      save();
      drawChain();
    };
    const save = () => view.saveLayout();
    const chainEl = wrap.createDiv({ cls: "ep-roller-chain" });
    const exprRow = wrap.createDiv({ cls: "ep-roller-expr" });
    const exprInput = exprRow.createEl("input", { cls: "ep-edit-input ep-roller-exprinput", type: "text" });
    exprInput.setAttr("placeholder", t("roller.exprPlaceholder"));
    exprInput.setAttr("title", t("roller.exprHint"));
    const refreshExpr = () => {
      exprInput.value = segsToText(segs());
      exprInput.removeClass("ep-invalid");
    };
    const commitExpr = () => {
      const parsed = textToSegs(exprInput.value);
      if (!parsed) {
        exprInput.addClass("ep-invalid");
        return;
      }
      setSegs(parsed);
    };
    exprInput.onkeydown = (ke) => {
      if (ke.key === "Enter") {
        ke.preventDefault();
        commitExpr();
      } else if (ke.key === "Escape") {
        refreshExpr();
      }
    };
    exprInput.onblur = commitExpr;
    new RefSuggest(
      view.app,
      exprInput,
      () => referenceSuggestions(view.settings, view.propCandidates(true).map((c) => c.key))
    );
    const insertToken = (token) => {
      var _a2, _b;
      const s = (_a2 = exprInput.selectionStart) != null ? _a2 : exprInput.value.length;
      const eEnd = (_b = exprInput.selectionEnd) != null ? _b : exprInput.value.length;
      exprInput.value = exprInput.value.slice(0, s) + token + exprInput.value.slice(eEnd);
      const pos = s + token.length;
      exprInput.focus();
      try {
        exprInput.setSelectionRange(pos, pos);
      } catch (e2) {
      }
    };
    const fnBar = wrap.createDiv({ cls: "ep-roller-fns" });
    const fnBtn = (label, title, onClick) => {
      const b = fnBar.createEl("button", { cls: "ep-roller-fn", text: label });
      b.setAttr("title", title);
      b.onmousedown = (ev) => ev.preventDefault();
      b.onclick = onClick;
    };
    fnBtn(
      t("roller.fnDie"),
      t("roller.fnDieHint"),
      (ev) => openDiceMenu(ev, view.app, view.i18n, { get: () => void 0, set: (n) => insertToken(n || "d20") })
    );
    fnBtn("kh", t("roller.fnKeepHigh"), () => insertToken("kh1"));
    fnBtn("kl", t("roller.fnKeepLow"), () => insertToken("kl1"));
    fnBtn("!", t("roller.fnExplode"), () => insertToken("!"));
    fnBtn("r", t("roller.fnReroll"), () => insertToken("r1"));
    fnBtn(">=", t("roller.fnSuccess"), () => insertToken(">="));
    fnBtn("+", t("roller.fnPlus"), () => insertToken(" + "));
    const inlineChipText = (chip, initial, apply) => {
      chip.empty();
      const inp = chip.createEl("input", { cls: "ep-roller-textedit", type: "text" });
      inp.value = initial;
      inp.focus();
      inp.select();
      let done = false;
      const finish = (commit2) => {
        if (done) return;
        done = true;
        if (commit2) apply(inp.value);
        else drawChain();
      };
      inp.onblur = () => finish(true);
      inp.onkeydown = (ke) => {
        if (ke.key === "Enter") {
          ke.preventDefault();
          finish(true);
        } else if (ke.key === "Escape") finish(false);
      };
    };
    const drawChain = () => {
      chainEl.empty();
      const list = segs();
      list.forEach((seg, idx) => {
        var _a2;
        if (idx > 0) chainEl.createSpan({ cls: "ep-roll-op", text: seg.neg ? "-" : "+" });
        else if (seg.neg) chainEl.createSpan({ cls: "ep-roll-op", text: "-" });
        const chip = chainEl.createSpan({ cls: "ep-roller-chip" });
        const label = seg.dice !== void 0 ? seg.dice : seg.ref !== void 0 ? seg.ref : String((_a2 = seg.add) != null ? _a2 : 0);
        chip.createSpan({ cls: "ep-roller-chiplab", text: label });
        chip.setAttr("title", t("roller.chipHint"));
        chip.onclick = (ev) => {
          var _a3, _b;
          ev.stopPropagation();
          if (seg.dice !== void 0) {
            if (parseDice(seg.dice)) {
              openDiceMenu(ev, view.app, view.i18n, {
                get: () => seg.dice,
                set: (n) => {
                  seg.dice = n || "d20";
                  save();
                  drawChain();
                }
              });
            } else {
              inlineChipText(chip, (_a3 = seg.dice) != null ? _a3 : "", (val) => {
                const parsed = textToSegs(val);
                if (parsed && parsed.length === 1 && parsed[0].dice) seg.dice = parsed[0].dice;
                save();
                drawChain();
              });
            }
          } else if (seg.ref !== void 0) {
            inlineChipText(chip, seg.ref, (val) => {
              const v = val.trim();
              if (v) seg.ref = v;
              save();
              drawChain();
            });
          } else {
            inlineChipText(chip, String((_b = seg.add) != null ? _b : 0), (val) => {
              const v = Math.round(Number(val));
              seg.add = Number.isFinite(v) ? v : 0;
              seg.neg = void 0;
              save();
              drawChain();
            });
          }
        };
        const x = chip.createSpan({ cls: "ep-roller-x", text: "x" });
        x.setAttr("title", t("roller.removeSeg"));
        x.onclick = (ev) => {
          ev.stopPropagation();
          const next = segs().slice();
          next.splice(idx, 1);
          setSegs(next);
        };
      });
      const addDie = chainEl.createEl("button", { cls: "ep-roller-add", text: t("roller.addDie") });
      addDie.onclick = (ev) => openDiceMenu(ev, view.app, view.i18n, {
        get: () => void 0,
        set: (n) => setSegs([...segs(), { dice: n || "d20" }])
      });
      const addNum = chainEl.createEl("button", { cls: "ep-roller-add", text: t("roller.addNum") });
      addNum.onclick = () => setSegs([...segs(), { add: 0 }]);
      refreshExpr();
    };
    drawChain();
    const ctl = wrap.createDiv({ cls: "ep-roller-controls" });
    const modeRow = ctl.createDiv({ cls: "ep-mode" });
    modeRow.setAttr("title", t("roll.modeHint"));
    const modes = [
      { key: "disadvantage", label: t("roll.modeDisadvantage") },
      { key: "normal", label: t("roll.modeNormal") },
      { key: "advantage", label: t("roll.modeAdvantage") }
    ];
    const btns = /* @__PURE__ */ new Map();
    const curMode = () => e.rollerMode === "advantage" || e.rollerMode === "disadvantage" ? e.rollerMode : "normal";
    const paintMode = () => {
      for (const [k, b] of btns) b.toggleClass("is-active", curMode() === k);
    };
    for (const m of modes) {
      const b = modeRow.createEl("button", { text: m.label, cls: "ep-mode-btn" });
      btns.set(m.key, b);
      b.onclick = () => {
        e.rollerMode = m.key === "normal" ? void 0 : m.key;
        save();
        paintMode();
      };
    }
    paintMode();
    const timesWrap = ctl.createSpan({ cls: "ep-roller-times" });
    timesWrap.createSpan({ text: t("roller.times") });
    const times = timesWrap.createEl("input", { type: "number" });
    times.min = "1";
    times.max = "20";
    times.value = String((_a = e.rollerTimes) != null ? _a : 1);
    times.onchange = () => {
      const v = Math.max(1, Math.min(20, Math.round(Number(times.value)) || 1));
      times.value = String(v);
      e.rollerTimes = v === 1 ? void 0 : v;
      save();
    };
    const go = ctl.createEl("button", { cls: "ep-roll-btn ep-roller-go", text: t("roll.roll") });
    go.onclick = () => {
      var _a2, _b;
      const label = ctx2.entry.alias || t("roller.title");
      runRoll(svc(view), view.i18n, {
        segs: segs(),
        mode: curMode(),
        times: (_a2 = e.rollerTimes) != null ? _a2 : 1,
        label,
        resolve: makeNoteAwareResolver(view.app, view.settings, view.registries, view, (_b = view.note.path) != null ? _b : "")
      });
    };
    const macrosEl = wrap.createDiv({ cls: "ep-macros" });
    const loadMacro = (m) => {
      var _a2, _b;
      const next = ((_a2 = m.segs) != null ? _a2 : []).map((s) => ({ ...s }));
      e.rollerSegs = next.length ? next : void 0;
      e.rollerMode = m.mode === "advantage" || m.mode === "disadvantage" ? m.mode : void 0;
      e.rollerTimes = m.times && m.times > 1 ? m.times : void 0;
      save();
      drawChain();
      paintMode();
      times.value = String((_b = e.rollerTimes) != null ? _b : 1);
    };
    const drawMacros = () => {
      macrosEl.empty();
      const list = applicableMacros(view.settings, view.activeTypeKey);
      if (list.length) {
        macrosEl.createSpan({ cls: "ep-macros-lbl", text: t("roller.macros") });
        for (const m of list) {
          const chip = macrosEl.createSpan({ cls: "ep-roller-chip ep-macro-chip" });
          chip.createSpan({ cls: "ep-roller-chiplab", text: m.name });
          chip.setAttr("title", segsToText(m.segs) || t("roller.macroRun"));
          chip.onclick = (ev) => {
            var _a2;
            ev.stopPropagation();
            runMacro(svc(view), view.i18n, m, makeNoteAwareResolver(view.app, view.settings, view.registries, view, (_a2 = view.note.path) != null ? _a2 : ""));
          };
          chip.oncontextmenu = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const menu = new import_obsidian38.Menu();
            menu.addItem(
              (i) => i.setTitle(t("roller.macroRun")).setIcon("dices").onClick(() => {
                var _a2;
                return runMacro(svc(view), view.i18n, m, makeNoteAwareResolver(view.app, view.settings, view.registries, view, (_a2 = view.note.path) != null ? _a2 : ""));
              })
            );
            menu.addItem((i) => i.setTitle(t("roller.macroLoad")).setIcon("download").onClick(() => loadMacro(m)));
            menu.addItem(
              (i) => i.setTitle(t("roller.macroRename")).setIcon("pencil").onClick(
                () => new TextPromptModal(view.app, view.i18n, t("roller.macroRenamePrompt"), m.name, (v) => {
                  const nm = v.trim();
                  if (!nm) return;
                  m.name = nm;
                  save();
                  drawMacros();
                }).open()
              )
            );
            menu.addItem(
              (i) => i.setTitle(t("roller.macroDelete")).setIcon("trash").onClick(() => {
                var _a2;
                view.settings.macros = ((_a2 = view.settings.macros) != null ? _a2 : []).filter((x) => x.id !== m.id);
                save();
                drawMacros();
              })
            );
            menu.showAtMouseEvent(ev);
          };
        }
      }
      const saveBtn = macrosEl.createEl("button", { cls: "ep-roller-add", text: t("roller.saveMacro") });
      saveBtn.onclick = () => {
        if (!segs().some((s) => s.dice !== void 0)) {
          new import_obsidian38.Notice(t("roller.saveMacroEmpty"));
          return;
        }
        new TextPromptModal(view.app, view.i18n, t("roller.saveMacroPrompt"), "", (v) => {
          var _a2;
          const nm = v.trim();
          if (!nm) return;
          const macro = {
            id: genId(),
            name: nm,
            segs: segs().map((s) => ({ ...s })),
            mode: curMode() === "normal" ? void 0 : curMode(),
            times: e.rollerTimes && e.rollerTimes > 1 ? e.rollerTimes : void 0
          };
          view.settings.macros = [...(_a2 = view.settings.macros) != null ? _a2 : [], macro];
          save();
          drawMacros();
          new import_obsidian38.Notice(t("roller.macroSaved", { name: nm }));
        }).open();
      };
    };
    drawMacros();
  }
};

// src/features/rolling/numeric-addon.ts
var import_obsidian39 = require("obsidian");
var rollAddon = {
  id: "rolling.roll",
  appliesTo(ref) {
    if (ref.entry.kind !== "prop") return false;
    if (!ext(ref.entry).roll) return false;
    return MODIFIABLE_TYPE_IDS.has(ref.view.resolveType(ref.entry));
  },
  needs() {
    return { after: [{ id: "roll", cls: "ep-roll-cell" }] };
  },
  onRename(entry) {
    const e = ext(entry);
    e.roll = void 0;
    e.dice = void 0;
  },
  fillSlots(ctx2, num) {
    const view = ctx2.view;
    const e = ext(ctx2.entry);
    const slots = {};
    slots["roll"] = (cell) => {
      const btn = cell.createEl("button", { cls: "ep-roll-btn", text: view.i18n.t("roll.roll") });
      btn.setAttr("aria-label", view.i18n.t("roll.rollAria", { name: num.label }));
      const svc2 = () => view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings, view.history, view.app));
      const partsFor = () => {
        var _a;
        const me = ext(ctx2.entry);
        if (hasNoteOverride(view, ctx2.entry) || me.rollOverride !== void 0)
          return [{ label: view.i18n.t("roll.partOverride"), value: modifierTotal(view, ctx2.entry) }];
        return ((_a = me.mods) != null ? _a : []).filter((inf) => influenceActive(view, ctx2.entry, inf)).map((inf) => ({
          label: abbrFor(view.settings, inf.source || ctx2.entry.key || ""),
          value: influenceTerm(view, ctx2.entry, inf)
        }));
      };
      btn.onclick = () => svc2().roll(num.label, modifierTotal(view, ctx2.entry), parseDiceOrDefault(e.dice), {
        parts: partsFor()
      });
      btn.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openRollMenu(ev, view.i18n, svc2().mode, (mode, times) => {
          for (let i = 0; i < times; i++)
            svc2().roll(
              times > 1 ? `${num.label} #${i + 1}` : num.label,
              modifierTotal(view, ctx2.entry),
              parseDiceOrDefault(e.dice),
              { parts: partsFor(), mode, stay: times > 1 }
            );
        });
      });
      longPressContextMenu(btn);
    };
    return slots;
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed, redraw } = octx;
    if (entry.kind !== "prop" || !MODIFIABLE_TYPE_IDS.has(view.resolveType(entry))) return;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext(entry);
    c.createEl("h4", { text: t("roll.options.heading") });
    new import_obsidian39.Setting(c).setName(t("roll.options.rollButton")).setDesc(t("roll.options.rollButtonDesc")).addToggle((tg) => {
      tg.setValue(!!e.roll).onChange((v) => {
        var _a;
        e.roll = v || void 0;
        if (v && !((_a = e.mods) == null ? void 0 : _a.length) && e.rollOverride === void 0 && view.resolveType(entry) !== "derived")
          e.mods = [{}];
        changed();
        redraw();
      });
    });
    if (e.roll) {
      addDiceSettings(c, view.i18n, {
        get: () => e.dice,
        set: (n) => {
          e.dice = n;
          changed();
        }
      });
      new import_obsidian39.Setting(c).setName(t("mods.showDice")).setDesc(t("mods.showDiceDesc")).addToggle((tg) => {
        tg.setValue(entry.showDice !== false).onChange((v) => {
          entry.showDice = v ? void 0 : false;
          changed();
        });
      });
      new import_obsidian39.Setting(c).setName(t("mods.showDiceIcon")).setDesc(t("mods.showDiceIconDesc")).addToggle((tg) => {
        tg.setValue(entry.showDiceIcon !== false).onChange((v) => {
          entry.showDiceIcon = v ? void 0 : false;
          changed();
        });
      });
    }
  }
};

// src/features/rolling/skills-type.ts
var import_obsidian40 = require("obsidian");

// src/features/rolling/modifiers.ts
function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}
function levelProfBonus(level) {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}
function deriveModifier(mode, raw) {
  return mode === "abilityMod" ? abilityMod(raw) : raw;
}

// src/features/rolling/skills-type.ts
function parseRecords(value) {
  var _a;
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item.trim()) out.push({ name: item.trim() });
    } else if (item && typeof item === "object") {
      const o = item;
      const rec = { name: String((_a = o.name) != null ? _a : "").trim() || "?" };
      if (o.source !== void 0 && o.source !== null && o.source !== "") rec.source = String(o.source);
      if (o.prof === true || String(o.prof).toLowerCase() === "true") rec.prof = true;
      if (o.dice !== void 0 && parseDice(String(o.dice))) rec.dice = String(o.dice);
      const m = Number(o.mod);
      if (o.mod !== void 0 && o.mod !== null && o.mod !== "" && Number.isFinite(m)) rec.mod = m;
      out.push(rec);
    }
  }
  return out;
}
function readRecords(view, key) {
  return parseRecords(view.note.raw[key]);
}
function profBonus(view, e) {
  var _a;
  if (e.profMode === "fixed") return (_a = e.profFixed) != null ? _a : 0;
  if (e.profMode === "level") return levelProfBonus(view.note.num(e.profSource || "Level", 1));
  return 0;
}
function effectiveMod(view, e, rec) {
  const base = rec.mod !== void 0 ? rec.mod : rec.source ? deriveModifier(e.skillMode, view.note.num(rec.source, 0)) : 0;
  return base + (rec.prof ? profBonus(view, e) : 0);
}
function keyTaken(view, key, except) {
  const kl = key.toLowerCase();
  for (const s of view.layout.sections)
    for (const en of s.entries)
      if (en !== except && en.kind === "prop" && en.key && en.key.toLowerCase() === kl) return true;
  return false;
}
function convertToProperties(ref) {
  var _a;
  const { view, file, section, entry } = ref;
  const t = view.i18n.t.bind(view.i18n);
  const e = ext(entry);
  const key = entry.key;
  const records = readRecords(view, key);
  if (!records.length) {
    new import_obsidian40.Notice(t("skills.convertEmpty"));
    return;
  }
  const useProf = e.profMode === "level" || e.profMode === "fixed";
  const profKey = t("skills.convertProfProperty");
  const profListKey = t("skills.convertProfList", { name: entry.alias || key });
  let profInf = null;
  if (useProf) {
    profInf = { source: profKey, toggle: profListKey };
    if (!keyTaken(view, profKey, entry)) {
      if (e.profMode === "level") {
        const levelKey = e.profSource || "Level";
        section.entries.unshift({
          id: genId(),
          kind: "prop",
          key: profKey,
          dataType: "derived",
          hideIfEmpty: false,
          mods: [{ source: levelKey, mode: "profBonus" }]
        });
        ensurePropEntries(view.layout, section, [levelKey]);
      } else {
        ensurePropEntries(view.layout, section, [profKey]);
        view.note.set(file, profKey, (_a = e.profFixed) != null ? _a : 0);
      }
    }
    const have = view.note.list(profListKey);
    const haveL = have.map((x) => x.toLowerCase());
    const add = records.filter((r) => r.prof && !haveL.includes(r.name.toLowerCase())).map((r) => r.name);
    if (add.length) view.note.set(file, profListKey, [...have, ...add]);
  }
  const fresh = records.map((rec) => {
    var _a2, _b;
    let k = rec.name;
    if (rec.source && k.toLowerCase() === rec.source.toLowerCase() || keyTaken(view, k, entry))
      k = t("skills.convertKeySuffix", { name: rec.name });
    const mods2 = [];
    if (rec.source)
      mods2.push({ source: rec.source, mode: e.skillMode === "abilityMod" ? "abilityMod" : void 0 });
    if (profInf) mods2.push({ ...profInf });
    const en = {
      id: genId(),
      kind: "prop",
      key: k,
      dataType: "derived",
      hideIfEmpty: false,
      roll: true,
      mods: mods2
    };
    if (k !== rec.name) en.alias = rec.name;
    if ((_a2 = rec.dice) != null ? _a2 : e.dice) en.dice = (_b = rec.dice) != null ? _b : e.dice;
    if (rec.mod !== void 0) en.rollOverride = rec.mod + (rec.prof ? profBonus(view, e) : 0);
    return en;
  });
  const idx = section.entries.findIndex((x) => x.id === entry.id);
  section.entries.splice(idx < 0 ? section.entries.length : idx, 1, ...fresh);
  ensurePropEntries(view.layout, section, [...new Set(records.map((r) => r.source).filter((x) => !!x))]);
  view.saveLayout();
  view.rerender();
  new import_obsidian40.Notice(t("skills.convertDone", { n: fresh.length }));
}
function confirmConvert(ref) {
  new ConfirmModal(
    ref.view.app,
    ref.view.i18n,
    ref.view.i18n.t("skills.convertConfirm"),
    () => convertToProperties(ref)
  ).open();
}
var skillsType = {
  id: "skills",
  wide: true,
  deprecated: true,
  // hidden from type dropdowns; renders legacy data only
  name: (i18n) => i18n.t("type.skills"),
  render(ctx2) {
    const { view, entry } = ctx2;
    const key = entry.key;
    const e = ext(entry);
    const holder = ctx2.extra.createDiv({ cls: "ep-block-list" });
    const build = () => {
      holder.empty();
      holder.createDiv({ cls: "ep-skills-deprecated", text: view.i18n.t("skills.removed") });
      const records = readRecords(view, key);
      if (!records.length) {
        holder.createDiv({ cls: "ep-empty-sub", text: view.i18n.t("skills.empty") });
      } else {
        for (const rec of records) {
          const row = holder.createDiv({ cls: "ep-line" });
          row.createSpan({ cls: "ep-line-name", text: (rec.prof ? "* " : "") + rec.name });
          if (rec.source) row.createSpan({ cls: "ep-line-abbr", text: abbrFor(view.settings, rec.source) });
          row.createSpan({ cls: "ep-line-mod", text: fmtMod(effectiveMod(view, e, rec)) });
        }
      }
      const btn = holder.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("skills.convertBtn") });
      btn.onclick = () => confirmConvert({ view, file: ctx2.file, section: ctx2.section, entry: ctx2.entry });
    };
    build();
    view.registerUpdater(build);
  },
  menuItems(menu, ref) {
    menu.addItem(
      (i) => i.setTitle(ref.view.i18n.t("skills.convert")).setIcon("wand").onClick(() => confirmConvert(ref))
    );
  },
  renderOptions(octx) {
    const { view, container: c } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("skills.options.heading") });
    c.createDiv({ cls: "ep-skills-deprecated", text: t("skills.removed") });
    new import_obsidian40.Setting(c).setName(t("skills.convert")).setDesc(t("skills.convertDesc")).addButton((b) => b.setButtonText(t("skills.convertBtn")).onClick(() => confirmConvert(octx)));
  }
};

// src/features/rolling/strings.json
var strings_default = {
  "roll.featureName": "Dice & rolls",
  "roll.featureDesc": "Roll buttons on properties, configurable dice (d2-d100 or custom), the roll log panel, and the skills data type.",
  "roll.roll": "Roll",
  "roll.rollAria": "Roll {name}",
  "roll.rolls": "Rolls",
  "roll.checkLabel": "{name} check",
  "roll.tagAdvantage": "(adv)",
  "roll.tagDisadvantage": "(dis)",
  "roll.modeHint": "Roll mode - applies to all roll buttons",
  "roll.modeDisadvantage": "Disadv",
  "roll.modeNormal": "Normal",
  "roll.modeAdvantage": "Advantage",
  "roll.logEmpty": "Roll results will appear here.",
  "roll.options.heading": "Rolling",
  "roll.options.rollButton": "Roll button",
  "roll.options.rollButtonDesc": "Rolls the dice plus this entry's modifier (see Modifier above)",
  "roll.partDrop": "drop",
  "roll.closeAll": "Dismiss all",
  "roll.card.copyValue": "Copy value",
  "roll.card.copyChain": "Copy chain",
  "roll.card.reroll": "Reroll",
  "roll.card.dismiss": "Dismiss",
  "roll.style.classic": "Classic (cycling numbers)",
  "roll.style.spin": "Spinning icon",
  "roll.style.threeD": "3D dice",
  "roll.redoHint": "Click to roll this again",
  "roll.logChains": "Chains",
  "roll.logChainsHint": "Show the full roll chain (off = label and result only)",
  "roll.rerollAll": "Reroll all",
  "roll.rngRandom": "Random",
  "roll.rngKarmic": "Karmic",
  "roll.rngHint": "Toggle the global roll system: pure random, or adaptive (karmic) - failures build hidden luck debt that converts some future failures into successes; streaks of bad luck fade out.",
  "roll.logNoteOnly": "This note",
  "roll.logNoteOnlyHint": "Show only rolls made on the current note",
  "roll.logClear": "Clear",
  "roll.logClearHint": "Clear the roll history",
  "roll.logClearConfirm": "Clear the entire roll history?",
  "roll.logClearNoteConfirm": "Clear this note's roll history?",
  "roll.cmd.exportHistory": "Export roll history to a note",
  "roll.cmd.macroPrefix": "Roll macro: {name}",
  "roll.export.title": "Roll history",
  "roll.export.fileName": "Roll history",
  "roll.export.time": "Time",
  "roll.export.note": "Note",
  "roll.export.label": "Roll",
  "roll.export.total": "Total",
  "roll.export.mode": "Mode",
  "roll.export.detail": "Detail",
  "roll.export.done": "Roll history exported.",
  "roll.export.failed": "Export failed: {error}",
  "roller.title": "Dice roller",
  "roller.addDie": "+ die",
  "roller.addNum": "+ number",
  "roller.times": "Rolls",
  "roller.chipHint": "Click to edit, x to remove",
  "roller.removeSeg": "Remove",
  "roller.exprPlaceholder": "e.g. 2d6kh1 + 1d8 + DEX + 3",
  "roller.exprHint": "Type a roll. kh/kl/dh/dl keep or drop dice, ! explodes, rN/roN reroll <= N, >=N counts successes; names like DEX read the note's property.",
  "roller.fnDie": "die",
  "roller.fnDieHint": "Insert a die (pick the size)",
  "roller.fnKeepHigh": "Keep highest (advantage)",
  "roller.fnKeepLow": "Keep lowest (disadvantage)",
  "roller.fnExplode": "Explode on max",
  "roller.fnReroll": "Reroll <= 1",
  "roller.fnSuccess": "Count successes (>= N)",
  "roller.fnPlus": "Add a term",
  "roller.macros": "Macros",
  "roller.saveMacro": "+ save as macro",
  "roller.saveMacroPrompt": "Macro name",
  "roller.saveMacroEmpty": "Add at least one die before saving a macro.",
  "roller.macroRun": "Roll",
  "roller.macroLoad": "Load into builder",
  "roller.macroRename": "Rename",
  "roller.macroRenamePrompt": "Macro name",
  "roller.macroDelete": "Delete macro",
  "roller.macroSaved": 'Saved macro "{name}".',
  "dice.die": "Die",
  "dice.dieDesc": "Preset die, or type a custom size next to it",
  "dice.custom": "Custom...",
  "dice.customSize": "Custom die size...",
  "dice.customSizePrompt": "Die size (number of faces)",
  "dice.customSizeShort": "size",
  "dice.count": "Number of dice...",
  "dice.countPrompt": "Number of dice",
  "dice.countLabel": "Number of dice",
  "dice.reset": "Default (d20)",
  "type.skills": "skills (legacy list)",
  "skills.convert": "Convert to property entries...",
  "skills.convertBtn": "Convert",
  "skills.convertDesc": "Replace this list with one derived number property per row. Proficiency becomes a togglable influence backed by a list property; sources stay referenced by name.",
  "skills.convertConfirm": "Convert this skills list into individual derived property entries? The rows of the current note define the new entries; the record property itself is left untouched.",
  "skills.convertEmpty": "No rows to convert.",
  "skills.convertDone": "Created {n} property entries.",
  "skills.convertKeySuffix": "{name} Save",
  "skills.convertProfProperty": "Proficiency Bonus",
  "skills.convertProfList": "{name} Proficiencies",
  "skills.empty": "No skills yet.",
  "skills.options.heading": "Skills",
  "skills.removed": "The skills value type was removed in v4.0. The stored rows are shown read-only - convert them to regular properties to keep working with them."
};

// src/features/rolling/strings.ts
var rollingEn = strings_default;

// src/features/rolling/index.ts
var rollingModule = {
  id: "rolling",
  name: (i18n) => i18n.t("roll.featureName"),
  description: (i18n) => i18n.t("roll.featureDesc"),
  register(ctx2) {
    ctx2.i18n.register("en", rollingEn);
    ctx2.registries.valueTypes.add(skillsType);
    ctx2.registries.entryKinds.add(rollsKind);
    ctx2.registries.entryKinds.add(rollerKind);
    ctx2.registries.clusterAddons.add(rollAddon);
    ctx2.registries.sectionTemplates.add({
      id: "diceroller",
      name: (i18n) => i18n.t("roller.title"),
      build: (i18n) => ({
        id: "diceroller",
        title: i18n.t("roller.title"),
        columns: 2,
        layoutMode: "columns",
        collapsible: true,
        entries: [
          { id: genId(), kind: "diceroller" },
          { id: genId(), kind: "rolls" }
        ]
      })
    });
  },
  /**
   * v2.x entries stored the modifier source as `roll: "value"|"abilityMod"`
   * plus `rollSource`. Convert that to an explicit influence list of the
   * core modifier system; `roll` becomes a plain on/off flag.
   */
  migrate(settings) {
    let changed = false;
    for (const lk of Object.keys(settings.layouts)) {
      for (const section of settings.layouts[lk].sections) {
        for (const e of section.entries) {
          const x = e;
          if (x["roll"] !== "value" && x["roll"] !== "abilityMod") continue;
          changed = true;
          if (!Array.isArray(x["mods"])) {
            const inf = {};
            if (typeof x["rollSource"] === "string" && x["rollSource"]) inf.source = x["rollSource"];
            if (x["roll"] === "abilityMod") inf.mode = "abilityMod";
            x["mods"] = [inf];
          }
          x["roll"] = true;
          delete x["rollSource"];
        }
      }
    }
    return changed;
  }
};

// src/features/dnd5e/rules.ts
var SAVE_PROF_KEY = "Saving Throw Proficiencies";
var SKILL_PROF_KEY = "Skill Proficiencies";
var LEVEL_KEY = "Level";
var PROF_KEY = "Proficiency Bonus";
var INIT_KEY = "Initiative";
var ABILITIES = [
  { key: "Strength", abbr: "STR" },
  { key: "Dexterity", abbr: "DEX" },
  { key: "Constitution", abbr: "CON" },
  { key: "Intelligence", abbr: "INT" },
  { key: "Wisdom", abbr: "WIS" },
  { key: "Charisma", abbr: "CHA" }
];
var SKILLS = [
  { name: "Acrobatics", ability: "Dexterity" },
  { name: "Animal Handling", ability: "Wisdom" },
  { name: "Arcana", ability: "Intelligence" },
  { name: "Athletics", ability: "Strength" },
  { name: "Deception", ability: "Charisma" },
  { name: "History", ability: "Intelligence" },
  { name: "Insight", ability: "Wisdom" },
  { name: "Intimidation", ability: "Charisma" },
  { name: "Investigation", ability: "Intelligence" },
  { name: "Medicine", ability: "Wisdom" },
  { name: "Nature", ability: "Intelligence" },
  { name: "Perception", ability: "Wisdom" },
  { name: "Performance", ability: "Charisma" },
  { name: "Persuasion", ability: "Charisma" },
  { name: "Religion", ability: "Intelligence" },
  { name: "Sleight of Hand", ability: "Dexterity" },
  { name: "Stealth", ability: "Dexterity" },
  { name: "Survival", ability: "Wisdom" }
];

// src/features/dnd5e/sections.ts
function prop(key, extra = {}) {
  return { id: genId(), kind: "prop", key, hideIfEmpty: false, ...extra };
}
function derived(key, mods2, extra = {}) {
  return prop(key, { dataType: "derived", hideIfEmpty: false, mods: mods2, ...extra });
}
function profBonusEntry() {
  return derived(PROF_KEY, [{ source: LEVEL_KEY, mode: "profBonus" }]);
}
function initiativeEntry() {
  return derived(INIT_KEY, [{ source: "Dexterity", mode: "abilityMod" }], { roll: true });
}
function saveEntry(ability) {
  return derived(
    `${ability} Save`,
    [
      { source: ability, mode: "abilityMod" },
      { source: PROF_KEY, toggle: SAVE_PROF_KEY }
    ],
    { roll: true, alias: ability }
  );
}
function skillEntry(name, ability) {
  return derived(
    name,
    [
      { source: ability, mode: "abilityMod" },
      { source: PROF_KEY, toggle: SKILL_PROF_KEY }
    ],
    { roll: true }
  );
}
function savesEntries() {
  return ABILITIES.map((a) => saveEntry(a.key));
}
function skillsEntries() {
  return SKILLS.map((s) => skillEntry(s.name, s.ability));
}
function abilityEntry(key) {
  return prop(key, {
    dataType: "number",
    slider: true,
    min: 1,
    max: 30,
    clamp: true,
    roll: true,
    showMod: true,
    mods: [{ mode: "abilityMod" }]
  });
}
function rollSources() {
  return [profBonusEntry(), ...ABILITIES.map((a) => prop(a.key, { dataType: "number" }))];
}
var builders = {
  rolls: (i18n) => ({
    id: "rolls",
    title: i18n.t("dnd.tpl.contents"),
    columns: 2,
    layoutMode: "columns",
    pin: "header",
    collapsible: true,
    entries: [{ id: genId(), kind: "toc" }]
  }),
  details: (i18n) => ({
    id: "details",
    title: i18n.t("dnd.tpl.details"),
    columns: 1,
    dividers: true,
    entries: [prop("Class"), prop("Subclass"), prop("Race"), prop("Background"), prop("Alignment")]
  }),
  vitals: (i18n) => ({
    id: "vitals",
    title: i18n.t("dnd.tpl.vitals"),
    columns: 2,
    layoutMode: "columns",
    dividers: true,
    entries: [
      prop(LEVEL_KEY, { dataType: "number", min: 1, max: 20 }),
      profBonusEntry(),
      prop("Armor Class", { dataType: "number", min: 0, max: 40, unit: "AC" }),
      prop("Speed", { dataType: "number", min: 0, max: 200, unit: "ft" }),
      prop("Current HP", { dataType: "number", min: 0, max: 9999, unit: "HP" }),
      prop("Max HP", { dataType: "number", min: 0, max: 9999, unit: "HP" }),
      prop("Temporary HP", { dataType: "number", min: 0, max: 9999, unit: "HP" }),
      prop("Hit Dice"),
      prop("Death Save Successes", { dataType: "number", min: 0, max: 3 }),
      prop("Death Save Failures", { dataType: "number", min: 0, max: 3 }),
      prop("Inspiration", { dataType: "checkbox" }),
      prop("Passive Perception", { dataType: "number", min: 0, max: 40 }),
      prop("Experience Points", { dataType: "number", min: 0, max: 999999, unit: "XP" }),
      initiativeEntry()
    ]
  }),
  abilities: (i18n) => ({
    id: "abilities",
    title: i18n.t("dnd.tpl.abilities"),
    columns: 1,
    dividers: true,
    entries: ABILITIES.map((a) => abilityEntry(a.key))
  }),
  saves: (i18n) => ({
    id: "saves",
    title: i18n.t("dnd.savingThrows"),
    columns: 1,
    dividers: true,
    entries: savesEntries()
  }),
  skills: (i18n) => ({
    id: "skills",
    title: i18n.t("dnd.skills"),
    columns: 1,
    dividers: true,
    entries: skillsEntries()
  }),
  spellcasting: (i18n) => ({
    id: "spellcasting",
    title: i18n.t("dnd.tpl.spellcasting"),
    columns: 2,
    layoutMode: "columns",
    dividers: true,
    entries: [
      prop("Spellcasting Ability"),
      prop("Spell Save DC", { dataType: "number", min: 0, max: 40, unit: "DC" }),
      prop("Spell Attack Bonus", { dataType: "number", min: -5, max: 40 }),
      prop("Cantrips Known", { dataType: "number", min: 0, max: 30 })
    ]
  }),
  proficiencies: (i18n) => ({
    id: "proficiencies",
    title: i18n.t("dnd.tpl.proficiencies"),
    columns: 1,
    dividers: true,
    entries: [
      prop("Armor Proficiencies", { dataType: "list" }),
      prop("Weapon Proficiencies", { dataType: "list" }),
      prop("Tool Proficiencies", { dataType: "list" }),
      prop("Languages", { dataType: "list" })
    ]
  }),
  features: (i18n) => ({
    id: "features",
    title: i18n.t("dnd.tpl.features"),
    columns: 1,
    entries: [prop("Features & Traits")]
  }),
  equipment: (i18n) => ({
    id: "equipment",
    title: i18n.t("dnd.tpl.equipment"),
    columns: 1,
    dividers: true,
    entries: [
      prop("Equipment", { dataType: "list" }),
      prop("Copper", { dataType: "number", min: 0, unit: "cp" }),
      prop("Silver", { dataType: "number", min: 0, unit: "sp" }),
      prop("Electrum", { dataType: "number", min: 0, unit: "ep" }),
      prop("Gold", { dataType: "number", min: 0, unit: "gp" }),
      prop("Platinum", { dataType: "number", min: 0, unit: "pp" })
    ]
  }),
  personality: (i18n) => ({
    id: "personality",
    title: i18n.t("dnd.tpl.personality"),
    columns: 1,
    dividers: true,
    entries: [prop("Personality Traits"), prop("Ideals"), prop("Bonds"), prop("Flaws")]
  }),
  description: (i18n) => ({
    id: "description",
    title: i18n.t("dnd.tpl.description"),
    columns: 2,
    layoutMode: "columns",
    dividers: true,
    entries: [
      prop("Age", { dataType: "number", min: 0, unit: "yrs" }),
      prop("Height", { dataType: "decimal", min: 0, unit: "ft" }),
      prop("Weight", { dataType: "number", min: 0, unit: "lb" }),
      prop("Eyes", { dataType: "color" }),
      prop("Skin", { dataType: "color" }),
      prop("Hair", { dataType: "color" })
    ]
  })
};
var TEMPLATE_ORDER = [
  "rolls",
  "details",
  "description",
  "vitals",
  "abilities",
  "saves",
  "skills",
  "spellcasting",
  "proficiencies",
  "features",
  "equipment",
  "personality"
];
var TEMPLATE_NAMES = {
  rolls: "dnd.tpl.contents",
  details: "dnd.tpl.details",
  description: "dnd.tpl.description",
  vitals: "dnd.tpl.vitals",
  abilities: "dnd.tpl.abilities",
  saves: "dnd.savingThrows",
  skills: "dnd.skills",
  spellcasting: "dnd.tpl.spellcasting",
  proficiencies: "dnd.tpl.proficiencies",
  features: "dnd.tpl.features",
  equipment: "dnd.tpl.equipment",
  personality: "dnd.tpl.personality"
};
var NEEDS_SOURCES = /* @__PURE__ */ new Set(["vitals", "saves", "skills"]);
function sectionTemplates() {
  return TEMPLATE_ORDER.map((id) => ({
    id,
    name: (i18n) => i18n.t(TEMPLATE_NAMES[id]),
    build: (i18n) => ({ ...builders[id](i18n), hideIfEmpty: false }),
    sources: NEEDS_SOURCES.has(id) ? () => rollSources() : void 0
  }));
}
var characterPreset = {
  id: "dnd5e-character",
  name: (i18n) => i18n.t("dnd.presetName"),
  build: (i18n) => ({
    version: LAYOUT_VERSION,
    sections: TEMPLATE_ORDER.map((id) => ({ ...builders[id](i18n), hideIfEmpty: false }))
  })
};

// src/features/dnd5e/strings.json
var strings_default2 = {
  "dnd.featureName": "D&D 5e character sheet",
  "dnd.featureDesc": "Character sheet templates, ability scores, 5e saving throw & skill presets, proficiency and initiative.",
  "dnd.presetName": "D&D 5e character",
  "dnd.proficiency": "Proficiency",
  "dnd.initiative": "Initiative",
  "dnd.savingThrows": "Saving throws",
  "dnd.skills": "Skills",
  "dnd.tpl.contents": "Contents",
  "dnd.tpl.details": "Details",
  "dnd.tpl.vitals": "Vitals",
  "dnd.tpl.abilities": "Ability scores",
  "dnd.tpl.description": "Description",
  "dnd.tpl.spellcasting": "Spellcasting",
  "dnd.tpl.proficiencies": "Proficiencies & Languages",
  "dnd.tpl.features": "Features & Traits",
  "dnd.tpl.equipment": "Equipment",
  "dnd.tpl.personality": "Personality"
};

// src/features/dnd5e/strings.ts
var dndEn = strings_default2;

// src/features/dnd5e/index.ts
var dnd5eModule = {
  id: "dnd5e",
  name: (i18n) => i18n.t("dnd.featureName"),
  description: (i18n) => i18n.t("dnd.featureDesc"),
  register(ctx2) {
    ctx2.i18n.register("en", dndEn);
    for (const tpl of sectionTemplates()) ctx2.registries.sectionTemplates.add(tpl);
    ctx2.registries.layoutPresets.add(characterPreset);
  },
  /**
   * Upgrade layouts written by older versions:
   *
   * - v2.0 "saves"/"skills" entry kinds become per-record derived property
   *   entries. Their proficiencies already live in the legacy list
   *   properties, which are exactly the toggle lists of the new entries,
   *   so per-note data survives unchanged.
   * - "computed" entries (proficiency / initiative) become the equivalent
   *   derived property entries; appearance fields carry over.
   *
   * v2.1 record-based skills *properties* keep working through the legacy
   * skills value type, which offers its own one-click conversion.
   */
  migrate(settings) {
    var _a, _b;
    let changed = false;
    if (!settings.dnd5ePoolsSeeded) {
      const PRESET_POOLS = {
        class: ["Artificer", "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"],
        subclass: ["Champion", "Battle Master", "Eldritch Knight", "Thief", "Assassin", "Arcane Trickster", "Life Domain", "Light Domain", "Circle of the Land", "Circle of the Moon", "College of Lore", "College of Valor", "Draconic Bloodline", "Wild Magic", "The Fiend", "School of Evocation", "Oath of Devotion", "Hunter", "Beast Master", "Way of the Open Hand", "Path of the Berserker", "Path of the Totem Warrior"],
        race: ["Human", "Elf", "Half-Elf", "Dwarf", "Halfling", "Gnome", "Half-Orc", "Tiefling", "Dragonborn", "Aasimar", "Goliath", "Orc", "Tabaxi", "Firbolg", "Kenku", "Genasi"],
        alignment: ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"],
        background: ["Acolyte", "Charlatan", "Criminal", "Entertainer", "Folk Hero", "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage", "Sailor", "Soldier", "Urchin"],
        "spellcasting ability": ["Intelligence", "Wisdom", "Charisma"],
        languages: ["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon"]
      };
      const pools = (_a = settings.poolExtras) != null ? _a : settings.poolExtras = {};
      for (const [key, values] of Object.entries(PRESET_POOLS)) {
        const pool = (_b = pools[key]) != null ? _b : pools[key] = [];
        for (const v of values) {
          if (!pool.some((x) => x.toLowerCase() === v.toLowerCase())) pool.push(v);
        }
      }
      settings.dnd5ePoolsSeeded = true;
      changed = true;
    }
    for (const lk of Object.keys(settings.layouts)) {
      for (const section of settings.layouts[lk].sections) {
        const out = [];
        for (const e of section.entries) {
          if (e.kind === "saves") {
            changed = true;
            out.push(...savesEntries());
          } else if (e.kind === "skills") {
            changed = true;
            out.push(...skillsEntries());
          } else if (e.kind === "computed") {
            changed = true;
            const fresh = e["computed"] === "proficiency" ? profBonusEntry() : initiativeEntry();
            out.push({ ...e, ...fresh, id: e.id, alias: e.alias, computed: void 0 });
          } else {
            out.push(e);
          }
        }
        section.entries = out;
      }
    }
    return changed;
  }
};

// src/features/rolling/history.ts
var DEFAULT_LIMIT = 500;
var FLUSH_MS = 1500;
var HistoryService = class {
  constructor(settings, save, store) {
    this.settings = settings;
    this.save = save;
    this.store = store;
    /** Most-recent-first. The source of truth the panel renders from. */
    this.entries = [];
    /** id -> re-roll closure (this session only; not persisted). */
    this.redos = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
    this.flushTimer = 0;
    this.dirty = false;
  }
  /**
   * Load persisted records. Any legacy copy still in `settings.rollHistory`
   * is merged in and migrated to the store once (deduplicated by id), so the
   * history stops living inside `data.json`. Without a store (tests, missing
   * plugin dir) the legacy settings key remains the backing storage.
   */
  async init() {
    let stored = [];
    if (this.store) {
      try {
        stored = await this.store.load();
      } catch (e) {
        console.error("Extended Properties: roll history load failed", e);
      }
    }
    const legacy = Array.isArray(this.settings.rollHistory) ? this.settings.rollHistory : [];
    const seen = /* @__PURE__ */ new Set();
    this.entries = [...stored, ...legacy].filter((r) => !!r && typeof r.id === "string" && !seen.has(r.id) && (seen.add(r.id), true)).map((r) => ({ ...r })).sort((a, b) => b.time - a.time);
    this.prune();
    if (this.store && legacy.length) {
      this.settings.rollHistory = [];
      this.dirty = true;
      this.flushNow();
      this.save();
    }
    this.emit();
  }
  enabled() {
    return this.settings.rollHistoryEnabled !== false;
  }
  limit() {
    const n = this.settings.rollHistoryLimit;
    return typeof n === "number" && n > 0 ? Math.min(5e3, Math.floor(n)) : DEFAULT_LIMIT;
  }
  /** All entries (most-recent-first). */
  all() {
    return this.entries;
  }
  /** Entries, optionally limited to one note and/or a tail length. */
  query(o = {}) {
    let list = this.entries;
    if (o.note) list = list.filter((r) => r.note === o.note);
    return typeof o.limit === "number" ? list.slice(0, o.limit) : list;
  }
  /** Re-roll closure for a record made this session, if any. */
  redoFor(id) {
    return this.redos.get(id);
  }
  /** Append a freshly resolved roll. `redo` re-runs it (kept in-session only). */
  append(rec, redo) {
    this.entries.unshift(rec);
    if (redo) this.redos.set(rec.id, redo);
    this.prune();
    this.dirty = true;
    this.emit();
    this.scheduleFlush();
  }
  /** Clear all entries, or just those of `note`. Persists immediately. */
  clear(note) {
    if (note) {
      this.entries = this.entries.filter((r) => r.note !== note);
    } else {
      this.entries = [];
      this.redos.clear();
    }
    this.dirty = true;
    this.emit();
    this.flushNow();
  }
  /** React to the on/off setting changing: flush when turned on, drop the persisted copy when off. */
  setEnabled(on) {
    if (on) {
      this.dirty = true;
      this.flushNow();
    } else {
      this.dirty = false;
      if (this.store) void this.store.save([]);
      else {
        this.settings.rollHistory = [];
        this.save();
      }
    }
  }
  /** React to the limit setting changing: prune now and persist. */
  applyLimit() {
    this.prune();
    this.dirty = true;
    this.flushNow();
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const fn of [...this.listeners]) fn();
  }
  prune() {
    const lim = this.limit();
    if (this.entries.length > lim) {
      const removed = this.entries.splice(lim);
      for (const r of removed) this.redos.delete(r.id);
    }
  }
  scheduleFlush() {
    if (!this.enabled() || this.flushTimer) return;
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = 0;
      this.flush();
    }, FLUSH_MS);
  }
  /** Persist now, cancelling any pending debounce (clear, unload, setting change). */
  flushNow() {
    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = 0;
    }
    this.flush();
  }
  flush() {
    if (!this.dirty) return;
    this.dirty = false;
    const out = this.enabled() ? this.entries.slice(0, this.limit()) : [];
    if (this.store) void this.store.save(out);
    else {
      this.settings.rollHistory = out;
      this.save();
    }
  }
  /** Render the history (optionally one note's) as a Markdown table activeDocument. */
  exportMarkdown(i18n, note) {
    const rows = this.query({ note: note != null ? note : void 0 });
    const cell = (s) => (s != null ? s : "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    const head = `| ${i18n.t("roll.export.time")} | ${i18n.t("roll.export.note")} | ${i18n.t("roll.export.label")} | ${i18n.t("roll.export.total")} | ${i18n.t("roll.export.mode")} | ${i18n.t("roll.export.detail")} |`;
    const sep = "| --- | --- | --- | ---: | --- | --- |";
    const body = rows.map((r) => {
      const time = new Date(r.time).toLocaleString();
      const noteName = cell(r.noteName || r.note || "");
      return `| ${cell(time)} | ${noteName} | ${cell(r.label)} | ${r.total} | ${cell(r.mode)} | ${cell(r.text)} |`;
    });
    return [`# ${i18n.t("roll.export.title")}`, "", head, sep, ...body, ""].join("\n");
  }
};

// src/features/inline/inline-render.ts
var import_obsidian42 = require("obsidian");

// src/features/inline/inline-view.ts
var import_obsidian41 = require("obsidian");
function layoutForFile(ctx2, file) {
  const raw = ctx2.facade.raw(file);
  const tk = Object.keys(raw).find((k) => k.toLowerCase() === "type");
  const tv = tk !== void 0 ? raw[tk] : void 0;
  const types = Array.isArray(tv) ? tv.map(String) : tv === void 0 || tv === null ? [] : [String(tv)];
  const match = ctx2.settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
  if (!match) return null;
  const layout = ctx2.settings.layouts[match.toLowerCase()];
  return layout && Array.isArray(layout.sections) ? layout : null;
}
function findPropEntry(layout, key) {
  const kl = key.toLowerCase();
  for (const section of layout.sections)
    for (const entry of section.entries)
      if (entry.kind === "prop" && entry.key && entry.key.toLowerCase() === kl)
        return { section, entry };
  return null;
}
var InlineViewCtx = class {
  constructor(ctx2, target, layout, mount, redraw, srcFile = null, srcBody = "") {
    this.ctx = ctx2;
    this.target = target;
    this.redraw = redraw;
    this.srcFile = srcFile;
    this.srcBody = srcBody;
    this.hub = new ServiceHub();
    this.editMode = false;
    this.activeTypeKey = null;
    this.updaters = [];
    this.popupsMgr = null;
    this.app = ctx2.app;
    this.i18n = ctx2.i18n;
    this.settings = ctx2.settings;
    this.registries = ctx2.registries;
    this.props = ctx2.props;
    this.hide = ctx2.hide;
    this.history = ctx2.history;
    this.containerEl = mount;
    this.layout = layout != null ? layout : { version: 0, sections: [] };
    this.note = new NoteModel(this.app, this.i18n, {
      onLightChange: () => this.refreshValues(),
      onFullChange: () => this.redraw(),
      captureUndo: () => false,
      conflictGuard: () => this.settings.conflictGuard !== false
    });
    this.note.load(target);
  }
  // -- refresh -----------------------------------------------------------------
  refreshValues() {
    for (const u of this.updaters) {
      try {
        u();
      } catch (e) {
      }
    }
  }
  registerUpdater(fn) {
    this.updaters.push(fn);
  }
  saveLayout() {
    this.ctx.save();
  }
  rerender() {
    this.redraw();
  }
  /** Vault reads for cross-note aggregates / `prop()` in a card's derived value. */
  get vault() {
    return makeVaultAccess(this.ctx.props, () => this.target.path);
  }
  // -- entry helpers -----------------------------------------------------------
  resolveType(entry) {
    var _a;
    if (entry.dataType) return entry.dataType;
    return this.deriveType((_a = entry.key) != null ? _a : "");
  }
  deriveType(key) {
    const assigned = this.props.obsidianType(key);
    if (assigned) return assigned;
    const v = this.note.raw[key];
    if (Array.isArray(v)) return "list";
    if (typeof v === "number") return "number";
    if (typeof v === "boolean") return "checkbox";
    return this.settings.defaults.dataType;
  }
  defaultLabelFor(entry) {
    const kind = this.registries.entryKinds.get(entry.kind);
    return kind ? kind.defaultLabel(this.i18n, entry) : entry.kind;
  }
  /** Inline cards reference a single value and never hide by condition. */
  condVisible() {
    return true;
  }
  renderLabel(head, ctx2) {
    const { entry } = ctx2;
    if (entry.hideLabel) return;
    const span = head.createSpan({ cls: "ep-line-name" });
    if (entry.labelSize) span.setCssStyles({ fontSize: entry.labelSize + "px" });
    if (entry.labelColor) span.setCssStyles({ color: entry.labelColor });
    span.setText(entry.alias || this.defaultLabelFor(entry));
    span.addClass("ep-clickname");
    if (entry.kind === "prop" && entry.showType !== false) {
      const def = this.registries.valueTypes.get(this.resolveType(entry));
      span.createSpan({ cls: "ep-type-hint", text: def ? def.name(this.i18n) : this.resolveType(entry) });
    }
  }
  buildCluster(head, flags, o) {
    return buildCluster(head, flags, o, (el, open) => this.bindOpen(el, open));
  }
  bindOpen(el, open, markEditable = true) {
    if (markEditable) el.addClass("ep-editable");
    el.setAttr("title", this.i18n.t("hint.dblEdit"));
    el.tabIndex = 0;
    el.setAttr("role", "button");
    el.setAttr("aria-label", this.i18n.t("a11y.editValue"));
    el.ondblclick = () => open();
    el.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    };
  }
  renderLinks(el, text) {
    renderLinkedText(this.app, el, text, this.note.path || "");
  }
  resolveImage(src) {
    src = (src || "").trim();
    const m = src.match(/!?\[\[(.*?)\]\]/);
    const path = m ? m[1].split("|")[0].split("#")[0].trim() : src;
    if (/^(https?:|data:|app:|file:)/.test(path)) return path;
    const f = this.app.metadataCache.getFirstLinkpathDest(path, this.note.path || "");
    if (f) return this.app.vault.getResourcePath(f);
    const af = this.app.vault.getAbstractFileByPath(path);
    if (af instanceof import_obsidian41.TFile) return this.app.vault.getResourcePath(af);
    return path;
  }
  openColorPicker(initial, onPick) {
    new ColorPickerModal(
      {
        app: this.app,
        i18n: this.i18n,
        getColorSpace: () => this.settings.defaults.colorSpace,
        setColorSpace: (sp) => {
          this.settings.defaults.colorSpace = sp;
          this.ctx.save();
        }
      },
      initial,
      onPick
    ).open();
  }
  highlight() {
  }
  openEntryOptions(section, entry) {
    new EntryOptionsModal(this, section, entry, this.target).open();
  }
  // -- structural ops (a single inline card has no layout) --------------------
  renameKey(entry, newKey) {
    newKey = newKey.trim();
    if (!newKey || newKey === entry.key) return;
    const oldBody = this.srcBody;
    const store = this.ctx.settings.inlineEntries;
    if (store && entry.id.startsWith("ep-inline:")) {
      const oldId = entry.id.slice("ep-inline:".length);
      const noteRef = oldBody ? parseNoteRef(oldBody) : null;
      const newId = ((noteRef == null ? void 0 : noteRef.accessor) ? noteRef.link.toLowerCase() + "/" : "") + newKey.toLowerCase();
      if (oldId !== newId) {
        delete store[oldId];
        entry.id = "ep-inline:" + newId;
        store[newId] = entry;
      }
    }
    entry.key = newKey;
    delete entry.dataType;
    this.ctx.save();
    if (this.srcFile && oldBody) {
      const noteRef = parseNoteRef(oldBody);
      const newBody = (noteRef == null ? void 0 : noteRef.accessor) ? oldBody.slice(0, oldBody.length - noteRef.accessor.length) + newKey : newKey;
      const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp("(`(?:vals|val)\\s*:\\s*)" + escRe(oldBody) + "(\\s*`)", "g");
      void this.app.vault.process(this.srcFile, (text) => text.replace(re, "$1" + newBody.replace(/\$/g, "$$$$") + "$2"));
    }
  }
  removeEntry() {
  }
  openAddMenu() {
  }
  openListValuePicker(x, y, key) {
    var _a;
    ((_a = this.popupsMgr) != null ? _a : this.popupsMgr = new PopupManager(this)).openListValuePicker(x, y, this.target, key);
  }
  scrollToSection() {
  }
  propCandidates() {
    return Object.keys(this.note.raw).map((key) => {
      const type = this.deriveType(key);
      const def = this.registries.valueTypes.get(type);
      return { key, onNote: true, type, typeName: def ? def.name(this.i18n) : type };
    }).sort((a, b) => a.typeName.localeCompare(b.typeName) || a.key.localeCompare(b.key));
  }
};
function makeValsEl(ctx2, file, body, onEditSource) {
  const wrap = createDiv({ cls: "ep-inline-vals" });
  wrap.setCssStyles({ display: "inline-block", verticalAlign: "middle" });
  const t = ctx2.i18n.t.bind(ctx2.i18n);
  const draw = () => {
    var _a, _b, _c, _d, _e, _f;
    wrap.empty();
    let view;
    let target;
    let entry;
    let section;
    try {
      const noteRef = parseNoteRef(body);
      target = file;
      let ref = body;
      if (noteRef && noteRef.accessor) {
        const lf = ctx2.app.metadataCache.getFirstLinkpathDest(noteRef.link, file.path);
        if (!lf) throw new Error("unresolved note link");
        target = lf;
        ref = noteRef.accessor;
      }
      const layout = layoutForFile(ctx2, target);
      view = new InlineViewCtx(ctx2, target, layout, wrap, draw, file, body);
      const key = (_a = keyForShortForm(ctx2.settings, ref, Object.keys(view.note.raw))) != null ? _a : ref;
      const inLayout = layout ? findPropEntry(layout, key) : null;
      if (inLayout) {
        section = inLayout.section;
        entry = inLayout.entry;
      } else {
        const id = (noteRef ? noteRef.link.toLowerCase() + "/" : "") + key.toLowerCase();
        const store = (_c = (_b = ctx2.settings).inlineEntries) != null ? _c : _b.inlineEntries = {};
        entry = (_d = store[id]) != null ? _d : store[id] = { id: "ep-inline:" + id, kind: "prop", key };
        if (!entry.key) entry.key = key;
        section = { id: "ep-inline", title: "", columns: 1, layoutMode: "list", entries: [entry] };
      }
    } catch (e) {
      wrap.appendChild(makeValEl(ctx2, file, body, onEditSource));
      return;
    }
    const def = (_e = view.registries.valueTypes.get(view.resolveType(entry))) != null ? _e : view.registries.valueTypes.get("text");
    const wide = entry.kind === "prop" && !!(def == null ? void 0 : def.wide);
    wrap.addClass("ep-entry");
    wrap.toggleClass("ep-entry-block", wide);
    const head = wrap.createDiv({ cls: "ep-entry-head" });
    if (entry.icon) {
      const ic = head.createSpan({ cls: "ep-picon" });
      (0, import_obsidian41.setIcon)(ic, entry.icon);
      if (entry.iconColor) ic.setCssStyles({ color: entry.iconColor });
    }
    const extra = wrap.createDiv({ cls: "ep-entry-extra" });
    const flags = emptyFlags();
    mergeNeeds(flags, (_f = def == null ? void 0 : def.clusterNeeds) == null ? void 0 : _f.call(def, { view, file: target, section, entry }));
    const ectx = { view, file: target, section, entry, head, extra, flags, wrap };
    view.renderLabel(head, ectx);
    try {
      def == null ? void 0 : def.render(ectx);
    } catch (e) {
      console.error("extended-properties: vals value render failed", e);
      const v = ctx2.facade.get(target, entry.key);
      head.createDiv({ cls: "ep-val-right" }).setText(v === void 0 || v === null || v === "" ? "-" : Array.isArray(v) ? v.join(", ") : String(v));
    }
    wrap.addEventListener("contextmenu", (ev) => {
      var _a2, _b2;
      ev.preventDefault();
      ev.stopPropagation();
      const menu = new import_obsidian41.Menu();
      const name = entry.alias || view.defaultLabelFor(entry);
      menu.addItem(
        (i) => i.setTitle(t("entry.menu.configure", { name })).setIcon("settings").onClick(
          () => view.openEntryOptions(section, entry)
        )
      );
      if (entry.kind === "prop" && entry.key) {
        const key2 = entry.key;
        menu.addSeparator();
        menu.addItem(
          (i) => i.setTitle(t("entry.menu.clearValue", { key: key2 })).setIcon("eraser").onClick(
            () => view.note.set(target, key2, void 0)
          )
        );
        (_b2 = (_a2 = view.registries.valueTypes.get(view.resolveType(entry))) == null ? void 0 : _a2.menuItems) == null ? void 0 : _b2.call(_a2, menu, { view, file: target, section, entry }, { x: ev.clientX, y: ev.clientY });
      }
      if (onEditSource) {
        menu.addSeparator();
        menu.addItem((i) => i.setTitle(t("inline.editSource")).setIcon("code").onClick(onEditSource));
      }
      menu.showAtMouseEvent(ev);
    });
    longPressContextMenu(wrap);
    guardScrollTaps(wrap);
  };
  draw();
  return wrap;
}

// src/utils/chart.ts
function extent(values) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (Number.isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min)) return { min: 0, max: 1 };
  if (min === max) return { min: min - 1, max: max + 1 };
  return { min, max };
}
function sparklinePath(values, w, h, pad = 1) {
  if (values.length === 0) return "";
  const { min, max } = extent(values);
  const n = values.length;
  const span = max - min;
  const x = (i) => n === 1 ? w / 2 : pad + i * (w - 2 * pad) / (n - 1);
  const y = (v) => h - pad - (v - min) / span * (h - 2 * pad);
  let d = "";
  values.forEach((v, i) => {
    d += (i === 0 ? "M" : "L") + x(i).toFixed(2) + " " + y(v).toFixed(2) + (i < n - 1 ? " " : "");
  });
  return d;
}
function barLayout(values, w, h, gap = 1) {
  const n = values.length;
  if (n === 0) return [];
  const peak = Math.max(0, ...values.map((v) => Number.isFinite(v) ? v : 0));
  const base = peak <= 0 ? 1 : peak;
  const bw = Math.max(0, (w - gap * (n - 1)) / n);
  return values.map((v, i) => {
    const bh = Math.max(0, Math.max(Number.isFinite(v) ? v : 0, 0) / base * h);
    return { x: i * (bw + gap), y: h - bh, w: bw, h: bh };
  });
}
function radarPoints(values, max, cx, cy, r) {
  const n = values.length;
  return values.map((v, i) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / n;
    const frac = max > 0 && Number.isFinite(v) ? Math.max(0, Math.min(1, v / max)) : 0;
    return { x: cx + frac * r * Math.cos(ang), y: cy + frac * r * Math.sin(ang) };
  });
}
function ringPoints(n, cx, cy, r) {
  return radarPoints(new Array(n).fill(1), 1, cx, cy, r);
}
function pointsAttr(pts) {
  return pts.map((p) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
}
function clampFrac(value, max) {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value / max));
}

// src/ui/render/charts.ts
var NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs) {
  const e = activeDocument.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
}
function frame(parent, w, h, aria) {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${w} ${h}`,
    class: "ep-chart-svg",
    role: "img",
    "aria-label": aria,
    preserveAspectRatio: "xMidYMid meet"
  });
  parent.appendChild(svg);
  parent.createSpan({ cls: "ep-sr-only", text: aria });
  return svg;
}
function renderSparkline(parent, values, opts) {
  const w = 64;
  const h = 16;
  const svg = frame(parent, w, h, opts.aria);
  svg.appendChild(svgEl("path", { d: sparklinePath(values, w, h, 2), class: "ep-chart-line", fill: "none" }));
}
function renderBars(parent, values, opts) {
  const w = Math.max(24, values.length * 8);
  const h = 16;
  const svg = frame(parent, w, h, opts.aria);
  for (const r of barLayout(values, w, h, 1.5))
    svg.appendChild(svgEl("rect", { x: r.x, y: r.y, width: r.w, height: r.h, rx: 1, class: "ep-chart-bar" }));
}
function renderRadar(parent, values, _labels, opts) {
  const s = 64;
  const c = s / 2;
  const r = 26;
  const max = opts.max && opts.max > 0 ? opts.max : Math.max(1, ...values);
  const svg = frame(parent, s, s, opts.aria);
  const ring = ringPoints(values.length, c, c, r);
  svg.appendChild(svgEl("polygon", { points: pointsAttr(ring), class: "ep-chart-grid", fill: "none" }));
  for (const p of ring) svg.appendChild(svgEl("line", { x1: c, y1: c, x2: p.x, y2: p.y, class: "ep-chart-grid" }));
  svg.appendChild(svgEl("polygon", { points: pointsAttr(radarPoints(values, max, c, c, r)), class: "ep-chart-area" }));
}
function renderProgress(parent, value, max, opts) {
  const w = 64;
  const h = 10;
  const svg = frame(parent, w, h, opts.label);
  svg.appendChild(svgEl("rect", { x: 0, y: 0, width: w, height: h, rx: h / 2, class: "ep-chart-track" }));
  const fw = clampFrac(value, max) * w;
  if (fw > 0)
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: Math.max(fw, h / 2), height: h, rx: h / 2, class: "ep-chart-fill" }));
}

// src/features/inline/inline-render.ts
var enabled2 = (ctx2) => ctx2.settings.features["inline"] !== false;
function processInline(el, mdctx, ctx2) {
  var _a, _b;
  if (!enabled2(ctx2)) return;
  const codes = Array.from(el.querySelectorAll("code"));
  if (!codes.length) return;
  const file = ctx2.app.vault.getAbstractFileByPath(mdctx.sourcePath);
  if (!(file instanceof import_obsidian42.TFile)) return;
  for (const code of codes) {
    if (code.closest("pre")) continue;
    const m = /^(roll|prop|vals|val|spark|bar|radar|progress)(?:\(([^)]*)\))?:\s*(.+)$/i.exec(
      ((_a = code.textContent) != null ? _a : "").trim()
    );
    if (!m) continue;
    const kind = m[1].toLowerCase();
    const opt = ((_b = m[2]) != null ? _b : "").trim();
    const body = m[3].trim();
    try {
      if (kind === "roll") {
        code.replaceWith(makeRollChip(ctx2, file, body, opt));
      } else if (kind === "spark" || kind === "bar" || kind === "radar" || kind === "progress") {
        const span = createSpan();
        code.replaceWith(span);
        mdctx.addChild(new ChartInline(span, ctx2, file, kind, body));
      } else {
        const span = createSpan();
        code.replaceWith(span);
        const child = kind === "val" ? new ValInline(span, ctx2, file, body) : kind === "vals" ? new ValsInline(span, ctx2, file, body) : new PropInline(span, ctx2, file, body);
        mdctx.addChild(child);
      }
    } catch (e) {
      console.error("Extended Properties: inline render failed", e);
    }
  }
}
function refResolver(ctx2, file) {
  return makeNoteAwareResolver(ctx2.app, ctx2.settings, ctx2.registries, envFor(ctx2, file), file.path);
}
function primarySides(ast) {
  if (ast) {
    for (const term of ast.terms) if (term.node.kind === "dice") return term.node.sides;
  }
  return 20;
}
function withDefaultDie(ast) {
  if (ast.terms.some((tm) => tm.node.kind === "dice")) return ast;
  return { terms: [{ neg: false, node: { kind: "dice", count: 1, sides: 20, ops: [] } }, ...ast.terms] };
}
function applyMode(ast, mode) {
  if (mode === "normal") return ast;
  const terms = ast.terms.map(
    (tm) => tm.node.kind === "dice" ? { neg: tm.neg, node: { ...tm.node, ops: [...tm.node.ops] } } : tm
  );
  const first = terms.find((tm) => tm.node.kind === "dice");
  if (first) {
    const dn = first.node;
    dn.count += 1;
    dn.ops.unshift(mode === "advantage" ? { t: "dl", n: 1 } : { t: "dh", n: 1 });
  }
  return { terms };
}
function runInlineRoll(ctx2, file, body, mode, times) {
  const t = ctx2.i18n.t.bind(ctx2.i18n);
  if (!parseRoll(body)) {
    new import_obsidian42.Notice(t("inline.rollInvalid"));
    return;
  }
  const tag = mode === "advantage" ? " " + t("roll.tagAdvantage") : mode === "disadvantage" ? " " + t("roll.tagDisadvantage") : "";
  const n = Math.max(1, Math.min(20, times || 1));
  const resolve = refResolver(ctx2, file);
  for (let i = 0; i < n; i++) {
    ctx2.roll.rollAst(n > 1 ? `${body} #${i + 1}` : body, applyMode(withDefaultDie(parseRoll(body)), mode), {
      tag,
      mode,
      stay: n > 1,
      resolve
    });
  }
}
function makeRollChip(ctx2, file, body, opt, onEdit) {
  const t = ctx2.i18n.t.bind(ctx2.i18n);
  const parsed = parseRoll(body);
  const ast = parsed ? withDefaultDie(parsed) : null;
  const resolve = refResolver(ctx2, file);
  const chip = createSpan({ cls: "ep-inline-roll" });
  const ic = chip.createSpan({ cls: "ep-inline-roll-ico" });
  (0, import_obsidian42.setIcon)(ic, diceIconId(primarySides(ast)));
  chip.createSpan({
    cls: "ep-inline-roll-lab",
    text: ast ? serializeRoll(ast, (name) => {
      const v = resolve(name);
      return v === void 0 ? name : String(v);
    }) : body
  });
  const mode = /^adv/i.test(opt) ? "advantage" : /^dis/i.test(opt) ? "disadvantage" : "normal";
  if (!ast) chip.addClass("ep-expr-error");
  chip.setAttr("title", ast ? t("inline.rollHint", { expr: body }) : t("inline.rollInvalid"));
  chip.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    runInlineRoll(ctx2, file, body, mode, 1);
  };
  chip.oncontextmenu = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openRollMenu(ev, ctx2.i18n, mode, (mo, ti) => runInlineRoll(ctx2, file, body, mo, ti), onEdit ? { onEdit } : void 0);
  };
  longPressContextMenu(chip);
  guardScrollTaps(chip);
  return chip;
}
function renderPropValue(ctx2, file, key) {
  const t = ctx2.i18n.t.bind(ctx2.i18n);
  const raw = ctx2.facade.get(file, key);
  const text = raw === void 0 || raw === null || raw === "" ? t("inline.empty") : Array.isArray(raw) ? raw.join(", ") : String(raw);
  const val = createSpan({ cls: "ep-inline-val ep-inline-editable", text });
  val.setAttr("title", t("inline.propHint", { key }));
  val.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const isNum = typeof raw === "number" || typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw));
    if (isNum) {
      openNumberInput(
        val,
        Number(raw != null ? raw : 0),
        (v) => {
          ctx2.facade.set(file, key, v);
          val.setText(fmtNum(v));
        },
        {
          min: -1e5,
          max: 1e5,
          float: true,
          clamp: false,
          onEmpty: () => {
            ctx2.facade.set(file, key, void 0);
            val.setText(t("inline.empty"));
          }
        }
      );
    } else {
      openTextInput(ctx2.app, val, key, raw == null ? "" : String(raw), () => [], (v) => {
        ctx2.facade.set(file, key, v || void 0);
        val.setText(v || t("inline.empty"));
      });
    }
  };
  return val;
}
var PropInline = class extends import_obsidian42.MarkdownRenderChild {
  constructor(root, ctx2, file, key) {
    super(root);
    this.root = root;
    this.ctx = ctx2;
    this.file = file;
    this.key = key;
  }
  onload() {
    this.root.addClass("ep-inline-prop");
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  draw() {
    this.root.empty();
    this.root.appendChild(renderPropValue(this.ctx, this.file, this.key));
  }
};
function findInlineEntry(ctx2, file, key) {
  const layout = layoutForFile2(ctx2, file);
  if (!layout) return null;
  const kl = key.toLowerCase();
  for (const s of layout.sections)
    for (const e of s.entries) if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl) return e;
  return null;
}
function makeValEl(ctx2, file, body, onEditSource) {
  var _a, _b;
  const t = ctx2.i18n.t.bind(ctx2.i18n);
  const noteRef = parseNoteRef(body);
  const noteKeys = Object.keys(ctx2.facade.raw(file));
  const directKey = noteRef ? null : keyForShortForm(ctx2.settings, body, noteKeys);
  const base = directKey || noteRef ? null : modifierBaseFor(ctx2.settings, body);
  const baseKey = base ? keyForShortForm(ctx2.settings, base, noteKeys) : null;
  const chip = createSpan({ cls: "ep-inline-roll ep-inline-valchip" });
  const iconKey = directKey != null ? directKey : baseKey;
  const entry = iconKey ? findInlineEntry(ctx2, file, iconKey) : null;
  if (entry == null ? void 0 : entry.icon) {
    const ic = chip.createSpan({ cls: "ep-inline-roll-ico" });
    (0, import_obsidian42.setIcon)(ic, entry.icon);
    if (entry.iconColor) ic.setCssStyles({ color: entry.iconColor });
  }
  let crossName = null;
  if (noteRef) {
    let prop2 = noteRef.accessor;
    const lf = ctx2.app.metadataCache.getFirstLinkpathDest(noteRef.link, file.path);
    if (lf) prop2 = (_a = keyForShortForm(ctx2.settings, noteRef.accessor, Object.keys(ctx2.facade.raw(lf)))) != null ? _a : noteRef.accessor;
    crossName = noteRef.accessor ? `${noteRef.link}/${prop2}` : noteRef.link;
  }
  const fullName = (_b = directKey != null ? directKey : baseKey) != null ? _b : crossName;
  if (fullName) chip.createSpan({ cls: "ep-inline-val-name", text: fullName });
  const lab = chip.createSpan({ cls: "ep-inline-roll-lab" });
  let editValue = null;
  if (directKey) {
    const key = directKey;
    const raw = ctx2.facade.get(file, key);
    const str = raw === void 0 || raw === null || raw === "" ? "" : Array.isArray(raw) ? raw.join(", ") : String(raw);
    editValue = () => {
      const isNum = typeof raw === "number" || str.trim() !== "" && Number.isFinite(Number(str));
      if (isNum) {
        openNumberInput(lab, Number(raw != null ? raw : 0), (v) => {
          ctx2.facade.set(file, key, v);
          lab.setText(fmtNum(v));
        }, {
          min: -1e5,
          max: 1e5,
          float: true,
          clamp: false,
          onEmpty: () => {
            ctx2.facade.set(file, key, void 0);
            lab.setText(t("inline.empty"));
          }
        });
      } else {
        openTextInput(ctx2.app, lab, key, str, () => [], (v) => {
          ctx2.facade.set(file, key, v || void 0);
          lab.setText(v || t("inline.empty"));
        });
      }
    };
    if (str && /\[\[.+?\]\]|\]\([^)]+\)/.test(str)) {
      renderLinkedText(ctx2.app, lab, str, file.path);
    } else {
      lab.setText(str || t("inline.empty"));
      lab.addClass("ep-inline-editable");
      lab.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        editValue == null ? void 0 : editValue();
      };
    }
    chip.setAttr("title", t("inline.propHint", { key }));
  } else {
    const v = makeNoteAwareResolver(ctx2.app, ctx2.settings, ctx2.registries, envFor(ctx2, file), file.path)(body);
    lab.setText(v === void 0 ? t("inline.empty") : base ? fmtMod(v) : String(v));
    if (v === void 0) chip.addClass("ep-expr-error");
    chip.setAttr("title", body);
  }
  if (editValue || onEditSource) {
    chip.oncontextmenu = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const menu = new import_obsidian42.Menu();
      if (editValue && directKey)
        menu.addItem((i) => i.setTitle(t("inline.editValue", { prop: directKey })).setIcon("pencil").onClick(editValue));
      if (onEditSource) menu.addItem((i) => i.setTitle(t("inline.editSource")).setIcon("code").onClick(onEditSource));
      menu.showAtMouseEvent(ev);
    };
    longPressContextMenu(chip);
  }
  guardScrollTaps(chip);
  return chip;
}
var ValInline = class extends import_obsidian42.MarkdownRenderChild {
  constructor(root, ctx2, file, body) {
    super(root);
    this.root = root;
    this.ctx = ctx2;
    this.file = file;
    this.body = body;
  }
  onload() {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  draw() {
    this.root.empty();
    this.root.appendChild(makeValEl(this.ctx, this.file, this.body));
  }
};
var ValsInline = class extends import_obsidian42.MarkdownRenderChild {
  constructor(root, ctx2, file, body) {
    super(root);
    this.root = root;
    this.ctx = ctx2;
    this.file = file;
    this.body = body;
  }
  onload() {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  draw() {
    this.root.empty();
    this.root.appendChild(makeValsEl(this.ctx, this.file, this.body));
  }
};
function resolveMax(max, resolve) {
  if (max === void 0 || max === "") return void 0;
  const n = Number(max);
  return Number.isFinite(n) ? n : resolve(max);
}
function renderChartSpec(parent, ctx2, file, spec) {
  var _a, _b;
  const t = ctx2.i18n.t.bind(ctx2.i18n);
  const resolve = refResolver(ctx2, file);
  const err = () => void parent.createSpan({ cls: "ep-chart-err", text: t("inline.chartInvalid") });
  if (spec.kind === "progress") {
    const ref = (_b = (_a = spec.value) != null ? _a : spec.refs[0]) != null ? _b : "";
    const value = resolve(ref);
    const max = resolveMax(spec.max, resolve);
    if (value === void 0 || max === void 0 || max <= 0) return err();
    renderProgress(parent, value, max, { label: `${ref} ${fmtNum(value)} / ${fmtNum(max)}` });
    return;
  }
  const valid = spec.refs.map((r) => ({ name: r, v: resolve(r) })).filter((p) => p.v !== void 0);
  if (valid.length < (spec.kind === "radar" ? 3 : 2)) return err();
  const values = valid.map((p) => p.v);
  const labels = valid.map((p) => p.name);
  const aria = t("inline.chartAria", {
    kind: spec.kind,
    data: labels.map((l, i) => `${l} ${fmtNum(values[i])}`).join(", ")
  });
  if (spec.kind === "spark") renderSparkline(parent, values, { aria });
  else if (spec.kind === "bar") renderBars(parent, values, { aria });
  else renderRadar(parent, values, labels, { aria, max: resolveMax(spec.max, resolve) });
}
function makeChartEl(ctx2, file, kind, body) {
  const chip = createSpan({ cls: "ep-inline-chart" });
  try {
    let spec;
    if (kind === "progress") {
      const [v, m] = body.split("/").map((s) => s.trim());
      spec = { kind: "progress", refs: [], value: v, max: m };
    } else {
      spec = { kind, refs: body.split(",").map((s) => s.trim()).filter(Boolean) };
    }
    renderChartSpec(chip, ctx2, file, spec);
  } catch (e) {
    console.error("Extended Properties: chart render failed", e);
    chip.empty();
    chip.addClass("ep-chart-err");
    chip.setText(ctx2.i18n.t("inline.chartInvalid"));
  }
  return chip;
}
var ChartInline = class extends import_obsidian42.MarkdownRenderChild {
  constructor(root, ctx2, file, kind, body) {
    super(root);
    this.root = root;
    this.ctx = ctx2;
    this.file = file;
    this.kind = kind;
    this.body = body;
  }
  onload() {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  draw() {
    this.root.empty();
    this.root.appendChild(makeChartEl(this.ctx, this.file, this.kind, this.body));
  }
};
var CHART_KINDS = /* @__PURE__ */ new Set(["spark", "bar", "radar", "progress"]);
function parseChartConfig(src) {
  const spec = { kind: "bar", refs: [] };
  for (const line of src.split("\n")) {
    const m = /^(\w+)\s*:\s*(.+)$/.exec(line.trim());
    if (!m) continue;
    const k = m[1].toLowerCase();
    const v = m[2].trim();
    if (k === "type") spec.kind = CHART_KINDS.has(v.toLowerCase()) ? v.toLowerCase() : "bar";
    else if (k === "props" || k === "properties") spec.refs = v.split(",").map((s) => s.trim()).filter(Boolean);
    else if (k === "value") spec.value = v;
    else if (k === "max" || k === "of") spec.max = v;
    else if (k === "title") spec.title = v;
  }
  return spec;
}
function renderChart(src, el, mdctx, ctx2) {
  const file = ctx2.app.vault.getAbstractFileByPath(mdctx.sourcePath);
  if (!(file instanceof import_obsidian42.TFile)) return;
  mdctx.addChild(new ChartBlock(el, ctx2, file, src));
}
var ChartBlock = class extends import_obsidian42.MarkdownRenderChild {
  constructor(root, ctx2, file, src) {
    super(root);
    this.root = root;
    this.ctx = ctx2;
    this.file = file;
    this.src = src;
  }
  onload() {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  draw() {
    this.root.empty();
    this.root.addClass("ep-chart-block");
    if (!enabled2(this.ctx)) return;
    const spec = parseChartConfig(this.src);
    if (spec.title) this.root.createDiv({ cls: "ep-chart-title", text: spec.title });
    renderChartSpec(this.root, this.ctx, this.file, spec);
  }
};
function buildEnv(ctx2, file, layout) {
  const raw = ctx2.facade.raw(file);
  const note = {
    raw,
    num: (k, d) => getNum(raw, k, d),
    list: (k) => getList(raw, k)
  };
  return {
    note,
    registries: ctx2.registries,
    settings: ctx2.settings,
    layout: layout != null ? layout : void 0,
    vault: makeVaultAccess(ctx2.props, () => file.path)
  };
}
function envFor(ctx2, file) {
  return buildEnv(ctx2, file, layoutForFile2(ctx2, file));
}
function layoutForFile2(ctx2, file) {
  const raw = ctx2.facade.raw(file);
  const tk = Object.keys(raw).find((k) => k.toLowerCase() === "type");
  const tv = tk !== void 0 ? raw[tk] : void 0;
  const types = Array.isArray(tv) ? tv.map(String) : tv === void 0 || tv === null ? [] : [String(tv)];
  const match = ctx2.settings.types.find((tp) => types.some((x) => x.toLowerCase() === tp.toLowerCase()));
  if (!match) return null;
  const layout = ctx2.settings.layouts[match.toLowerCase()];
  return layout && Array.isArray(layout.sections) ? layout : null;
}
function renderSheet(src, el, mdctx, ctx2) {
  const file = ctx2.app.vault.getAbstractFileByPath(mdctx.sourcePath);
  if (!(file instanceof import_obsidian42.TFile)) return;
  mdctx.addChild(new SheetInline(el, ctx2, file, src));
}
var SheetInline = class extends import_obsidian42.MarkdownRenderChild {
  constructor(root, ctx2, file, src) {
    super(root);
    this.root = root;
    this.ctx = ctx2;
    this.file = file;
    this.src = src;
  }
  onload() {
    this.draw();
    this.registerEvent(
      this.ctx.app.metadataCache.on("changed", (f) => {
        if (f.path === this.file.path) this.draw();
      })
    );
  }
  draw() {
    const t = this.ctx.i18n.t.bind(this.ctx.i18n);
    this.root.empty();
    this.root.addClass("ep-inline-sheet");
    if (!enabled2(this.ctx)) return;
    const layout = layoutForFile2(this.ctx, this.file);
    if (!layout) {
      this.root.createDiv({ cls: "ep-inline-note", text: t("inline.sheetNoType") });
      return;
    }
    const wanted = this.src.split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const env = buildEnv(this.ctx, this.file, layout);
    let any = false;
    for (const section of layout.sections) {
      if (wanted.length && !wanted.includes((section.title || "").toLowerCase())) continue;
      const entries = section.entries.filter((e) => e.kind === "prop" && e.key);
      if (!entries.length) continue;
      any = true;
      const sec = this.root.createDiv({ cls: "ep-inline-sheet-sec" });
      if (section.title) sec.createDiv({ cls: "ep-inline-sheet-title", text: section.title });
      for (const entry of entries) this.row(sec, env, entry);
    }
    if (!any) this.root.createDiv({ cls: "ep-inline-note", text: t("inline.sheetEmpty") });
  }
  row(parent, env, entry) {
    const t = this.ctx.i18n.t.bind(this.ctx.i18n);
    const row = parent.createDiv({ cls: "ep-inline-sheet-row" });
    row.createSpan({ cls: "ep-inline-sheet-lab", text: entry.alias || entry.key });
    const valEl = row.createSpan({ cls: "ep-inline-sheet-val" });
    if (entry.dataType === "derived") {
      const info = modifierInfo(env, entry);
      if (info.value === void 0) {
        valEl.addClass("ep-expr-error");
        valEl.setText(t("inline.empty"));
        valEl.setAttr("title", t(info.error === "cycle" ? "mods.errCycle" : "mods.errExpr"));
      } else {
        valEl.setText(fmtMod(info.value));
      }
    } else {
      const raw = this.ctx.facade.get(this.file, entry.key);
      valEl.setText(
        raw === void 0 || raw === null || raw === "" ? t("inline.empty") : Array.isArray(raw) ? raw.join(", ") : String(raw)
      );
    }
    const e = ext(entry);
    if (e.roll) {
      const chip = row.createSpan({ cls: "ep-inline-roll ep-inline-sheet-roll" });
      const spec = parseDiceOrDefault(typeof e.dice === "string" ? e.dice : void 0);
      const ic = chip.createSpan({ cls: "ep-inline-roll-ico" });
      (0, import_obsidian42.setIcon)(ic, diceIconId(spec.sides));
      chip.createSpan({ cls: "ep-inline-roll-lab", text: t("roll.roll") });
      const label = entry.alias || entry.key || t("roll.roll");
      chip.setAttr("title", t("inline.rollHint", { expr: label }));
      chip.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.ctx.roll.roll(label, modifierTotal(env, entry), spec, {});
      };
    }
  }
};

// src/features/inline/live-preview.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var import_language = require("@codemirror/language");
var import_obsidian43 = require("obsidian");
var PREFIX3 = /^(roll|prop|vals|val|spark|bar|radar|progress)(?:\(([^)]*)\))?:\s*(.+)$/i;
function backtickSpan(doc, from, to) {
  let s = from;
  while (s > 0 && doc.sliceString(s - 1, s) === "`") s--;
  let e = to;
  while (e < doc.length && doc.sliceString(e, e + 1) === "`") e++;
  return { from: s, to: e };
}
var InlineWidget = class extends import_view.WidgetType {
  constructor(ctx2, file, kind, opt, body) {
    super();
    this.ctx = ctx2;
    this.file = file;
    this.kind = kind;
    this.opt = opt;
    this.body = body;
    /** Live metadata subscriptions per mounted DOM (cleared in destroy). */
    this.evtRefs = /* @__PURE__ */ new Map();
  }
  /**
   * Position is deliberately NOT part of equality. An edit *above* a widget
   * shifts its position but not its content; if `eq` included the position,
   * CM6 would rebuild the whole widget every keystroke and re-attach its DOM -
   * a path that drops the heavier `vals:` card. Comparing content only lets
   * CM6 reuse and reposition the existing DOM, so cards survive edits above.
   */
  eq(o) {
    return o.kind === this.kind && o.opt === this.opt && o.body === this.body && o.file.path === this.file.path;
  }
  toDOM(view) {
    const holder = createSpan({ cls: "ep-inline-holder" });
    const reveal = () => {
      const pos = view.posAtDOM(holder);
      view.dispatch({ selection: { anchor: pos + 1 } });
      view.focus();
    };
    holder.appendChild(this.render(reveal));
    const ref = this.ctx.app.metadataCache.on("changed", (f) => {
      const crossNote = this.kind === "vals" || this.kind === "spark" || this.kind === "bar" || this.kind === "radar" || this.kind === "progress";
      if (!crossNote && f.path !== this.file.path) return;
      if (holder.querySelector("input:focus, textarea:focus, select:focus")) return;
      holder.empty();
      holder.appendChild(this.render(reveal));
    });
    this.evtRefs.set(holder, ref);
    return holder;
  }
  /** Render the widget content (one attempt; the holder owns the result). */
  render(reveal) {
    let dom = null;
    try {
      if (this.kind === "roll") dom = makeRollChip(this.ctx, this.file, this.body, this.opt, reveal);
      else if (this.kind === "vals") dom = makeValsEl(this.ctx, this.file, this.body, reveal);
      else if (this.kind === "val") dom = makeValEl(this.ctx, this.file, this.body, reveal);
      else if (this.kind === "spark" || this.kind === "bar" || this.kind === "radar" || this.kind === "progress")
        dom = makeChartEl(this.ctx, this.file, this.kind, this.body);
      else {
        const wrap = createSpan({ cls: "ep-inline-prop" });
        wrap.appendChild(renderPropValue(this.ctx, this.file, this.body));
        wrap.oncontextmenu = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const menu = new import_obsidian43.Menu();
          menu.addItem((i) => i.setTitle(this.ctx.i18n.t("inline.editSource")).setIcon("pencil").onClick(reveal));
          menu.showAtMouseEvent(ev);
        };
        dom = wrap;
      }
      return dom;
    } catch (e) {
      console.error("extended-properties: inline widget render failed", e);
      dom = createSpan({ cls: "ep-inline-error", text: `${this.kind}: ${this.body}` });
      dom.onclick = reveal;
      return dom;
    }
  }
  destroy(dom) {
    const ref = this.evtRefs.get(dom);
    if (ref) {
      this.ctx.app.metadataCache.offref(ref);
      this.evtRefs.delete(dom);
    }
    super.destroy(dom);
  }
  ignoreEvent() {
    return true;
  }
};
function buildDecos(view, ctx2) {
  var _a, _b, _c;
  const b = new import_state.RangeSetBuilder();
  if (ctx2.settings.features["inline"] === false) return b.finish();
  if (!view.state.field(import_obsidian43.editorLivePreviewField, false)) return b.finish();
  const file = (_b = (_a = view.state.field(import_obsidian43.editorInfoField, false)) == null ? void 0 : _a.file) != null ? _b : ctx2.app.workspace.getActiveFile();
  if (!file) return b.finish();
  const sel = view.state.selection;
  const doc = view.state.doc;
  const items = [];
  for (const { from, to } of view.visibleRanges) {
    const tree = (_c = (0, import_language.ensureSyntaxTree)(view.state, to, 50)) != null ? _c : (0, import_language.syntaxTree)(view.state);
    tree.iterate({
      from,
      to,
      enter: (node) => {
        var _a2;
        const name = node.type.name;
        if (!name.includes("inline-code") || name.includes("formatting")) return;
        const m = PREFIX3.exec(doc.sliceString(node.from, node.to).trim());
        if (!m) return;
        const span = backtickSpan(doc, node.from, node.to);
        if (view.hasFocus && sel.ranges.some((r) => r.from <= span.to && r.to >= span.from)) return;
        items.push({
          from: span.from,
          to: span.to,
          deco: import_view.Decoration.replace({
            widget: new InlineWidget(ctx2, file, m[1].toLowerCase(), ((_a2 = m[2]) != null ? _a2 : "").trim(), m[3].trim())
          })
        });
      }
    });
  }
  items.sort((a, z) => a.from - z.from || a.to - z.to);
  let last = -1;
  for (const it of items) {
    if (it.from < last) continue;
    b.add(it.from, it.to, it.deco);
    last = it.to;
  }
  return b.finish();
}
function inlineLivePreview(ctx2) {
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = buildDecos(view, ctx2);
      }
      update(u) {
        if (u.docChanged) this.decorations = this.decorations.map(u.changes);
        if (u.docChanged || u.viewportChanged || u.selectionSet || u.focusChanged || u.startState.field(import_obsidian43.editorLivePreviewField, false) !== u.state.field(import_obsidian43.editorLivePreviewField, false) || // Background parsing finished (after an edit above, the tree under a
        // widget may be momentarily stale): rebuild so a dropped chip/card
        // reappears on its own instead of waiting to be re-touched.
        (0, import_language.syntaxTree)(u.startState) !== (0, import_language.syntaxTree)(u.state)) {
          try {
            this.decorations = buildDecos(u.view, ctx2);
          } catch (e) {
            console.error("extended-properties: live-preview rebuild failed", e);
          }
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
}

// src/features/inline/strings.json
var strings_default3 = {
  "inline.featureName": "Inline rolls & properties",
  "inline.featureDesc": "Render `roll: 2d6+DEX` as a clickable roll and `prop: Strength` as a live, editable value in note bodies (reading mode), plus an `ep-sheet` code block that projects a note-type section.",
  "inline.rollHint": "Click to roll - {expr}",
  "inline.rollInvalid": "Invalid roll expression.",
  "inline.propHint": "{key} - click to edit",
  "inline.editSource": "Edit source",
  "inline.editValue": "Edit {prop} value",
  "inline.empty": "-",
  "inline.sheetNoType": "ep-sheet: this note has no matching type.",
  "inline.sheetEmpty": "ep-sheet: nothing to show.",
  "inline.chartInvalid": "Not enough values to chart.",
  "inline.chartAria": "{kind} chart: {data}"
};

// src/features/inline/strings.ts
var inlineEn = strings_default3;

// src/features/inline/index.ts
var inlineModule = {
  id: "inline",
  name: (i18n) => i18n.t("inline.featureName"),
  description: (i18n) => i18n.t("inline.featureDesc"),
  register(ctx2) {
    ctx2.i18n.register("en", inlineEn);
  }
};
function registerInline(plugin, ctx2) {
  plugin.registerMarkdownPostProcessor((el, mdctx) => processInline(el, mdctx, ctx2));
  plugin.registerMarkdownCodeBlockProcessor("ep-sheet", (src, el, mdctx) => renderSheet(src, el, mdctx, ctx2));
  plugin.registerMarkdownCodeBlockProcessor("ep-chart", (src, el, mdctx) => renderChart(src, el, mdctx, ctx2));
  plugin.registerEditorExtension(inlineLivePreview(ctx2));
}

// src/main.ts
var FEATURE_MODULES = [rollingModule, dnd5eModule, inlineModule];
var ExtendedPropertiesPlugin = class extends import_obsidian44.Plugin {
  constructor() {
    super(...arguments);
    this.i18n = new I18n();
    this.registries = new Registries();
    /** Third-party feature modules registered through the public API. */
    this.externalModules = [];
    /** Type-table ribbon icon; hidden while the table feature is disabled. */
    this.tableRibbon = null;
    this.layoutReloadTimer = 0;
    /** Session passphrase + decrypted-value cache for sensitive properties (L1). */
    this.secrets = new SecretStore();
    /** Command ids registered for the current macro set (for clean removal). */
    this.macroCmdIds = [];
    /** Signature of the registered macro set; guards needless re-registration. */
    this.macroSig = "";
  }
  /** All known feature modules (enabled or not) - the settings tab lists them. */
  get featureModules() {
    return FEATURE_MODULES;
  }
  async onload() {
    var _a, _b, _c;
    this.props = new PropertyIndex(this.app);
    registerDiceIcons();
    trackModifiers(this);
    this.i18n.register("en", coreEn, "English");
    let data = null;
    try {
      data = await this.loadData();
    } catch (e) {
      console.error("Extended Properties: data.json is unreadable; starting from defaults", e);
      await this.backupCorruptData();
    }
    this.settings = normalizeSettings(data, () => ({ version: 4, sections: [] }));
    this.rebuildRegistries();
    this.settings = normalizeSettings(data, () => this.defaultLayout());
    configureSound(this.settings.sound !== false, (_a = this.settings.soundVolume) != null ? _a : 0.3, {
      ui: this.settings.soundUi !== false,
      dice: this.settings.soundDice !== false,
      crit: this.settings.soundCrit !== false
    });
    this.i18n.setLocale(this.settings.language);
    this.i18n.setOverrides(this.settings.stringOverrides);
    configureRollUi(this.settings, () => void this.saveSettings());
    let migrated = false;
    for (const mod of FEATURE_MODULES) {
      if (this.settings.features[mod.id] !== false && ((_b = mod.migrate) == null ? void 0 : _b.call(mod, this.settings))) migrated = true;
    }
    if (materializeShortForms(this.settings)) migrated = true;
    this.hide = new HideService({
      settings: this.settings,
      save: () => void this.saveSettings(),
      refreshViews: () => this.refreshViews()
    });
    this.register(this.hide.install());
    this.history = new HistoryService(
      this.settings,
      () => {
        void this.saveData(this.settings);
      },
      this.historyStore()
    );
    await this.history.init();
    const isFresh = !data || Object.keys(data).length === 0;
    if (runSchemaMigrations(this.settings).changed) migrated = true;
    if (this.settings.appVersion !== this.manifest.version) {
      this.settings.appVersion = this.manifest.version;
      migrated = true;
    }
    if (migrated) {
      if (!isFresh) await this.backupData(data);
      await this.saveSettings();
    }
    this.layoutStore = new LayoutStore(
      this.app,
      this.i18n,
      () => {
        var _a2;
        return (_a2 = this.settings.layoutVaultFolder) != null ? _a2 : "_extended-properties";
      },
      (k) => this.settings.layouts[k],
      (k) => this.typeNameFor(k)
    );
    if (this.settings.layoutVault === true) {
      const fromFiles = await this.layoutStore.readAll();
      for (const k of Object.keys(fromFiles)) this.settings.layouts[k] = fromFiles[k];
    }
    this.registerEvent(this.app.vault.on("modify", (f) => this.onLayoutFileEvent(f.path)));
    this.registerEvent(this.app.vault.on("create", (f) => this.onLayoutFileEvent(f.path)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.onLayoutFileEvent(f.path)));
    this.snapshotStore = new SnapshotStore(
      this.app,
      this.i18n,
      () => {
        var _a2;
        return (_a2 = this.settings.layoutVaultFolder) != null ? _a2 : "_extended-properties";
      },
      this.manifest.version
    );
    if (featureOn(this.settings, "snapshots") && this.settings.snapshots === true && Date.now() - ((_c = this.settings.lastSnapshot) != null ? _c : 0) > 24 * 3600 * 1e3)
      void this.saveSnapshot(false);
    this.registerView(VIEW_TYPE, (leaf) => new SidebarView(leaf, this));
    this.addRibbonIcon("panel-right", this.i18n.t("command.openSidebar"), () => this.activateView());
    this.addCommand({
      id: "open-character-sidebar",
      name: this.i18n.t("command.openSidebar"),
      callback: () => this.activateView()
    });
    this.registerView(VIEW_TYPE_TABLE, (leaf) => new TableView(leaf, this));
    this.tableRibbon = this.addRibbonIcon("table", this.i18n.t("command.openTable"), () => {
      if (!featureOn(this.settings, "table")) return;
      void this.activateTableView();
    });
    this.addCommand({
      id: "open-type-table",
      name: this.i18n.t("command.openTable"),
      checkCallback: (checking) => {
        if (!featureOn(this.settings, "table")) return false;
        if (!checking) void this.activateTableView();
        return true;
      }
    });
    this.applyFeatureGates();
    this.addCommand({
      id: "hide-property-from-obsidian",
      name: this.i18n.t("command.hideProperty"),
      callback: () => new TextPromptModal(this.app, this.i18n, this.i18n.t("settings.hidePromptTitle"), "", (v) => {
        const k = v.trim();
        if (!k) return;
        this.hide.hideKey(k);
        new import_obsidian44.Notice(this.i18n.t("notice.hiding", { key: k }));
      }, () => this.props.knownProps()).open()
    });
    this.addSettingTab(new EPSettingTab(this.app, this));
    this.addCommand({
      id: "save-config-snapshot",
      name: this.i18n.t("snapshot.cmd.save"),
      checkCallback: (checking) => {
        if (!featureOn(this.settings, "snapshots")) return false;
        if (!checking) void this.saveSnapshot(true);
        return true;
      }
    });
    this.addCommand({
      id: "restore-config-snapshot",
      name: this.i18n.t("snapshot.cmd.restore"),
      checkCallback: (checking) => {
        if (!featureOn(this.settings, "snapshots")) return false;
        if (!checking) void this.restoreSnapshotFlow();
        return true;
      }
    });
    this.addCommand({
      id: "unlock-sensitive",
      name: this.i18n.t("secure.cmd.unlock"),
      checkCallback: (checking) => {
        if (!featureOn(this.settings, "secure")) return false;
        if (!checking) this.unlockSecrets();
        return true;
      }
    });
    this.addCommand({
      id: "lock-sensitive",
      name: this.i18n.t("secure.cmd.lock"),
      callback: () => {
        this.secrets.lock();
        this.refreshViews();
        new import_obsidian44.Notice(this.i18n.t("secure.lockedNotice"));
      }
    });
    if (this.settings.features["rolling"] !== false) {
      this.addCommand({
        id: "export-roll-history",
        name: this.i18n.t("roll.cmd.exportHistory"),
        callback: () => void this.exportRollHistory()
      });
    }
    this.syncMacroCommands();
    this.facade = new NoteFacade(this.app, this.i18n, () => this.settings.conflictGuard !== false);
    registerInline(this, {
      app: this.app,
      i18n: this.i18n,
      settings: this.settings,
      registries: this.registries,
      facade: this.facade,
      roll: this.rollService(),
      props: this.props,
      hide: this.hide,
      history: this.history,
      save: () => void this.saveSettings()
    });
    this.registerEvent(this.app.metadataCache.on("changed", (file) => this.props.invalidateFile(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.props.invalidatePath(file.path)));
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof import_obsidian44.TFile) this.props.invalidateFile(file, oldPath);
        else this.props.invalidatePath(oldPath);
      })
    );
    const refresh = (file) => {
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
        const v = leaf.view;
        if (v instanceof SidebarView) v.maybeRefresh(file);
      }
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TABLE)) {
        const v = leaf.view;
        if (v instanceof TableView) v.refresh(file);
      }
    };
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => refresh()));
    this.registerEvent(this.app.workspace.on("file-open", () => refresh()));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => refresh(file)));
    this.registerEvent(this.app.workspace.on("file-open", () => void this.primeSecrets()));
    const host = { app: this.app, i18n: this.i18n, settings: this.settings, hide: this.hide };
    this.registerDomEvent(
      activeDocument,
      "contextmenu",
      (e) => {
        var _a2;
        if (!this.settings.propMenu) return;
        const target = e.target;
        const el = (_a2 = target == null ? void 0 : target.closest) == null ? void 0 : _a2.call(target, ".metadata-property");
        if (!el) return;
        const key = el.getAttribute("data-property-key");
        if (!key) return;
        e.preventDefault();
        e.stopPropagation();
        showPropMenu(host, e, key);
      },
      true
    );
    this.registerDomEvent(activeDocument, "contextmenu", (e) => {
      var _a2;
      if (!this.settings.propMenu) return;
      const target = e.target;
      if (!((_a2 = target == null ? void 0 : target.closest) == null ? void 0 : _a2.call(target, ".metadata-properties-heading"))) return;
      window.setTimeout(() => augmentPropsMenu(host), 0);
    });
    this.exposeApi();
  }
  // -- public module API (F5) ---------------------------------------------
  /** Build and expose the public API on `this.api` and `window.ExtendedProperties`. */
  exposeApi() {
    this.api = {
      apiVersion: API_VERSION,
      version: this.manifest.version,
      register: (module2) => this.registerExternalModule(module2),
      t: (key, vars) => this.i18n.t(key, vars)
    };
    window.ExtendedProperties = this.api;
    this.register(() => {
      if (window.ExtendedProperties === this.api)
        delete window.ExtendedProperties;
    });
  }
  /** @see ExtendedPropertiesApi.register - incorporate a third-party module. */
  registerExternalModule(module2) {
    if (!module2 || typeof module2.id !== "string" || typeof module2.register !== "function") {
      console.error("Extended Properties: invalid module passed to register()");
      return;
    }
    const declared = module2.apiVersion;
    if (typeof declared === "number" && declared > API_VERSION) {
      new import_obsidian44.Notice("A plugin needs a newer Extended Properties API (v" + declared + " > v" + API_VERSION + ").");
      return;
    }
    if (FEATURE_MODULES.some((m) => m.id === module2.id) || this.externalModules.some((m) => m.id === module2.id)) return;
    this.externalModules.push(module2);
    this.rebuildRegistries();
    this.refreshViews();
  }
  onunload() {
    var _a, _b, _c;
    (_a = this.history) == null ? void 0 : _a.flushNow();
    (_b = this.layoutStore) == null ? void 0 : _b.flushAll();
    (_c = this.facade) == null ? void 0 : _c.flushAll();
  }
  // -- rolling: history export & macro commands -------------------------------
  /** Lazily-created roll service for view-less rolls (macro commands). */
  /** Lazily-created roll service for view-less rolls (macro commands, table cells). */
  rollService() {
    if (!this.rollSvc) this.rollSvc = new RollService(this.i18n, this.settings, this.history, this.app);
    return this.rollSvc;
  }
  /**
   * Keep exactly one command per saved macro registered, removing commands of
   * deleted macros. A signature check makes the frequent {@link saveSettings}
   * caller a no-op unless the macro set actually changed. When the rolling
   * feature is disabled, all macro commands are removed.
   */
  syncMacroCommands() {
    var _a;
    const enabled3 = this.settings.features["rolling"] !== false;
    const macros = enabled3 && Array.isArray(this.settings.macros) ? this.settings.macros : [];
    const sig = (enabled3 ? "" : "off|") + macros.map((m) => `${m.id}:${m.name}`).join("|");
    if (sig === this.macroSig) return;
    this.macroSig = sig;
    const cmds = this.app.commands;
    for (const id of this.macroCmdIds) (_a = cmds == null ? void 0 : cmds.removeCommand) == null ? void 0 : _a.call(cmds, `${this.manifest.id}:${id}`);
    this.macroCmdIds = [];
    for (const m of macros) {
      const cmdId = `roll-macro-${m.id}`;
      this.addCommand({
        id: cmdId,
        name: this.i18n.t("roll.cmd.macroPrefix", { name: m.name }),
        callback: () => runMacro(this.rollService(), this.i18n, m)
      });
      this.macroCmdIds.push(cmdId);
    }
  }
  /**
   * File-backed roll-history store: `roll-history.json` next to `data.json`,
   * so a settings save never reserializes hundreds of roll records and a
   * roll never rewrites the whole configuration. Best-effort - errors are
   * logged, never thrown into the roll path.
   */
  historyStore() {
    const dir = this.manifest.dir;
    if (!dir) return void 0;
    const path = `${dir}/roll-history.json`;
    const adapter = this.app.vault.adapter;
    return {
      async load() {
        if (!await adapter.exists(path)) return [];
        const raw = JSON.parse(await adapter.read(path));
        return Array.isArray(raw) ? raw.filter(
          (r) => !!r && typeof r === "object" && typeof r.id === "string"
        ) : [];
      },
      async save(records) {
        try {
          await adapter.write(path, JSON.stringify(records));
        } catch (e) {
          console.error("Extended Properties: roll history save failed", e);
        }
      }
    };
  }
  /** Export the roll history to a new note as a Markdown table. */
  async exportRollHistory() {
    const md = this.history.exportMarkdown(this.i18n);
    const base = this.i18n.t("roll.export.fileName");
    let path = `${base}.md`;
    let n = 2;
    while (this.app.vault.getAbstractFileByPath(path)) path = `${base} ${n++}.md`;
    try {
      const f = await this.app.vault.create(path, md);
      await this.app.workspace.getLeaf(true).openFile(f);
      new import_obsidian44.Notice(this.i18n.t("roll.export.done"));
    } catch (err) {
      new import_obsidian44.Notice(this.i18n.t("roll.export.failed", { error: String(err) }));
    }
  }
  // -- registries -------------------------------------------------------------
  /** Reflect feature toggles in chrome that exists outside the views. */
  applyFeatureGates() {
    var _a;
    (_a = this.tableRibbon) == null ? void 0 : _a.toggleClass("ep-feature-hidden", !featureOn(this.settings, "table"));
  }
  /** (Re)build all registries from core + enabled feature modules. */
  rebuildRegistries() {
    this.registries.clear();
    const ctx2 = { i18n: this.i18n, registries: this.registries };
    registerCore(ctx2, this.settings);
    for (const mod of FEATURE_MODULES) {
      if (this.settings.features[mod.id] !== false) mod.register(ctx2);
    }
    for (const mod of this.externalModules) {
      if (this.settings.features[mod.id] === false) continue;
      try {
        mod.register(ctx2);
      } catch (e) {
        console.error("Extended Properties: external module '" + mod.id + "' failed to register", e);
      }
    }
    registerDerivations(this.registries, this.settings);
  }
  /** Default layout for new note types (preset claimed by features, or empty). */
  defaultLayout() {
    var _a;
    const preset = (_a = this.registries.layoutPresets.get(this.registries.defaultPresetId)) != null ? _a : this.registries.layoutPresets.get("empty");
    return preset ? preset.build(this.i18n) : { version: 4, sections: [] };
  }
  // -- settings & layouts --------------------------------------------------------
  async saveSettings() {
    var _a;
    await this.saveData(this.settings);
    configureSound(this.settings.sound !== false, (_a = this.settings.soundVolume) != null ? _a : 0.3, {
      ui: this.settings.soundUi !== false,
      dice: this.settings.soundDice !== false,
      crit: this.settings.soundCrit !== false
    });
    this.hide.update();
    this.syncMacroCommands();
    if (this.settings.layoutVault === true && this.layoutStore)
      for (const t of this.settings.types) this.layoutStore.write(t);
  }
  /**
   * Snapshot the pre-migration `data.json` to the plugin's `backups/` folder,
   * keeping the most recent 5. Best-effort - a failure must never block load.
   */
  async backupData(rawData) {
    try {
      if (!this.manifest.dir) return;
      const dir = `${this.manifest.dir}/backups`;
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(dir)) await adapter.mkdir(dir);
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      await adapter.write(`${dir}/data-${stamp}.json`, JSON.stringify(rawData, null, 2));
      const listing = await adapter.list(dir);
      const backups = listing.files.filter((f) => /data-.*\.json$/.test(f)).sort();
      for (const old of backups.slice(0, Math.max(0, backups.length - 5))) await adapter.remove(old);
    } catch (e) {
      console.error("Extended Properties: settings backup failed", e);
    }
  }
  /** Copy an unreadable `data.json` aside (raw, not re-serialized) before defaults overwrite it. */
  async backupCorruptData() {
    try {
      if (!this.manifest.dir) return;
      const adapter = this.app.vault.adapter;
      const path = `${this.manifest.dir}/data.json`;
      if (!await adapter.exists(path)) return;
      const raw = await adapter.read(path);
      const dir = `${this.manifest.dir}/backups`;
      if (!await adapter.exists(dir)) await adapter.mkdir(dir);
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      await adapter.write(`${dir}/data-corrupt-${stamp}.json`, raw);
    } catch (e) {
      console.error("Extended Properties: could not back up corrupt data.json", e);
    }
  }
  // -- L1: config snapshots & sensitive-value encryption -------------------
  /** Curated customization state to snapshot (everything a user arranges). */
  snapshotData() {
    const s = this.settings;
    return {
      types: s.types,
      layouts: s.layouts,
      derivations: s.derivations,
      sourceAbbrs: s.sourceAbbrs,
      defaults: s.defaults,
      critRanges: s.critRanges,
      macros: s.macros,
      stringOverrides: s.stringOverrides,
      features: s.features,
      modDepth: s.modDepth,
      modifierSuffix: s.modifierSuffix,
      tableLayouts: s.tableLayouts
    };
  }
  /** Write a configuration snapshot; `manual` controls the success notice. */
  async saveSnapshot(manual) {
    var _a;
    if (!this.snapshotStore) return;
    const path = await this.snapshotStore.save(this.snapshotData(), (_a = this.settings.snapshotKeep) != null ? _a : 20);
    if (path) {
      this.settings.lastSnapshot = Date.now();
      await this.saveSettings();
      if (manual) new import_obsidian44.Notice(this.i18n.t("snapshot.saved"));
    }
  }
  /** Pick a snapshot, back up current settings, then restore it. */
  async restoreSnapshotFlow() {
    if (!this.snapshotStore) return;
    const snaps = await this.snapshotStore.list();
    if (!snaps.length) {
      new import_obsidian44.Notice(this.i18n.t("snapshot.none"));
      return;
    }
    new SnapshotPickerModal(this.app, this.i18n, snaps, (meta) => {
      void (async () => {
        var _a;
        const data = await this.snapshotStore.read(meta.path);
        if (!data || typeof data !== "object") return;
        await this.backupData(this.settings);
        Object.assign(this.settings, data);
        await this.saveSettings();
        if (this.settings.layoutVault === true) await ((_a = this.layoutStore) == null ? void 0 : _a.writeAll(this.settings.types));
        this.rebuildRegistries();
        this.refreshViews();
        new import_obsidian44.Notice(this.i18n.t("snapshot.restored"));
      })();
    }).open();
  }
  /** Prompt for the passphrase, unlock the session, decrypt the active note. */
  unlockSecrets() {
    new TextPromptModal(this.app, this.i18n, this.i18n.t("secure.enterPass"), "", (v) => {
      if (!v) return;
      this.secrets.unlock(v);
      void this.primeSecrets();
      new import_obsidian44.Notice(this.i18n.t("secure.unlockedNotice"));
    }).open();
  }
  /** Decrypt the active note's encrypted values into the cache, then refresh. */
  async primeSecrets() {
    var _a;
    if (!this.secrets.isUnlocked()) return;
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    if (!fm) return;
    const n = await this.secrets.prime(Object.values(fm));
    if (n > 0) this.refreshViews();
  }
  ensureLayout(typeKey) {
    var _a;
    if (!((_a = this.settings.layouts[typeKey]) == null ? void 0 : _a.sections)) this.settings.layouts[typeKey] = this.defaultLayout();
    return this.settings.layouts[typeKey];
  }
  resetLayout(typeKey) {
    this.settings.layouts[typeKey] = this.defaultLayout();
    void this.saveSettings();
    this.refreshViews();
  }
  /** Reset the plugin completely: all settings, types and layouts back to their
   *  defaults. The current `data.json` is backed up first (to the plugin's
   *  `backups/` folder) so a reset can be recovered. */
  async resetAll() {
    try {
      await this.backupData(this.settings);
    } catch (e) {
      console.error("Extended Properties: pre-reset backup failed", e);
    }
    this.settings = normalizeSettings(null, () => ({ version: 4, sections: [] }));
    this.rebuildRegistries();
    this.settings = normalizeSettings(null, () => this.defaultLayout());
    await this.saveSettings();
    this.rebuildRegistries();
    this.refreshViews();
  }
  refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const v = leaf.view;
      if (v instanceof SidebarView) v.render();
    }
  }
  // -- D2: vault-file layouts -------------------------------------------------
  /** Display name for a lower-cased type key (falls back to the key). */
  typeNameFor(key) {
    var _a;
    return (_a = this.settings.types.find((t) => t.toLowerCase() === key)) != null ? _a : key;
  }
  /** A vault file changed - if it's one of our layout files (not our echo), reload (debounced). */
  onLayoutFileEvent(path) {
    if (this.settings.layoutVault !== true || !this.layoutStore) return;
    if (!this.layoutStore.owns(path) || this.layoutStore.isEcho(path)) return;
    window.clearTimeout(this.layoutReloadTimer);
    this.layoutReloadTimer = window.setTimeout(() => void this.reloadVaultLayouts(), 300);
  }
  /** Re-read layout files into memory (files win) and refresh open views. */
  async reloadVaultLayouts() {
    if (!this.layoutStore) return;
    const fromFiles = await this.layoutStore.readAll();
    for (const k of Object.keys(fromFiles)) this.settings.layouts[k] = fromFiles[k];
    await this.saveData(this.settings);
    this.refreshViews();
    new import_obsidian44.Notice(this.i18n.t("layoutStore.reloaded", { n: String(Object.keys(fromFiles).length) }));
  }
  /** Turn on vault-file storage, exporting current layouts to files. */
  async enableLayoutVault() {
    this.settings.layoutVault = true;
    await this.saveSettings();
    if (this.layoutStore) await this.layoutStore.writeAll(this.settings.types);
    new import_obsidian44.Notice(this.i18n.t("layoutStore.enabled"));
  }
  /** Turn off vault-file storage (layouts stay in data.json; the files remain). */
  async disableLayoutVault() {
    this.settings.layoutVault = void 0;
    await this.saveSettings();
    new import_obsidian44.Notice(this.i18n.t("layoutStore.disabled"));
  }
  // -- view activation --------------------------------------------------------------
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const right = workspace.getRightLeaf(false);
      if (!right) return;
      leaf = right;
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    void workspace.revealLeaf(leaf);
  }
  /** Open (or focus) the type table view in a main tab. */
  async activateTableView() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TABLE)[0];
    const leaf = existing != null ? existing : this.app.workspace.getLeaf(true);
    if (!existing) await leaf.setViewState({ type: VIEW_TYPE_TABLE, active: true });
    void this.app.workspace.revealLeaf(leaf);
  }
};
