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
var import_obsidian27 = require("obsidian");

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
  /** Every known string key (union over all locales) — used by the override editor. */
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

// src/i18n/locales/en.ts
var coreEn = {
  // -- common -----------------------------------------------------------
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.save": "Save",
  "common.clear": "Clear",
  "common.choose": "Choose",
  "common.done": "Done",
  // -- view chrome ------------------------------------------------------
  "view.title": "Extended properties",
  "view.noNote": "Open a note to see its properties here.",
  "view.noType": "\u201C{note}\u201D has no matching Type.",
  "view.noTypeHint": "Set its Type property to one of:",
  "view.setType": "Set Type: {type}",
  "view.noTypesConfigured": "No types are configured yet. Give this note any Type value to create one (it starts empty), or add types in the plugin settings.",
  "view.typeBadgeHint": "This note\u2019s Type \u2014 selects which saved layout is shown",
  "view.edit": "Edit",
  "view.done": "Done",
  "view.editHint": "Edit: rearrange sections & properties, change types, colors, etc.",
  "view.doneHint": "Finish editing \u2014 keep or undo your changes",
  "view.addSection": "+ Section",
  "view.resetAll": "Reset all",
  "view.resetConfirm": "Reset the \u201C{type}\u201D layout to defaults? Note properties are not changed.",
  "view.addTemplates": "Add:",
  "view.templateResetConfirm": "The \u201C{name}\u201D section already exists. Reset it to its original section and properties?",
  // -- generic hints ------------------------------------------------------
  "hint.clickEdit": "Click to edit",
  "hint.dblEdit": "Double-click to edit",
  "hint.dblToggle": "Double-click to toggle",
  // -- sections ------------------------------------------------------------
  "section.namePlaceholder": "Section",
  "section.newName": "New section",
  "section.untitled": "Untitled",
  "section.renameHint": "Click to rename",
  "section.dragHint": "Drag to reorder section",
  "section.layoutHint": "Layout: {mode} (click to cycle)",
  "section.pinHint": "Pin to top (sticky)",
  "section.unpinHint": "Pinned (sticky) \u2014 click to unpin",
  "section.optionsHint": "Section options",
  "layout.list": "list",
  "layout.columns": "columns",
  "layout.grid": "grid",
  "section.menu.configure": "Configure \u201C{name}\u201D section\u2026",
  "section.menu.showDividers": "Show horizontal dividers",
  "section.menu.hideDividers": "Hide horizontal dividers",
  "section.menu.showVDividers": "Show vertical dividers",
  "section.menu.hideVDividers": "Hide vertical dividers",
  "section.menu.enableCollapse": "Enable collapsing",
  "section.menu.disableCollapse": "Disable collapsing",
  "section.menu.addObject": "Add object",
  "section.menu.moveUp": "Move up",
  "section.menu.moveDown": "Move down",
  "section.menu.delete": "Delete section",
  // -- entries ----------------------------------------------------------------
  "entry.addProperty": "+ add property",
  "entry.addToColumnHint": "Add a property to this column of \u201C{section}\u201D",
  "entry.addToSectionHint": "Add a property to \u201C{section}\u201D",
  "entry.dragHint": "Drag to move",
  "entry.changeKeyHint": "Click to change which property this shows",
  "entry.renameHint": "Click to rename",
  "entry.unknownKind": "Unavailable: {kind}",
  "entry.menu.configure": "Configure \u201C{name}\u201D property\u2026",
  "entry.menu.configureObject": "Configure \u201C{name}\u201D object\u2026",
  "entry.menu.showInObsidian": "Show \u201C{key}\u201D in Obsidian properties",
  "entry.menu.hideFromObsidian": "Hide \u201C{key}\u201D from Obsidian properties",
  "entry.menu.clearValue": "Remove value from \u201C{key}\u201D",
  "entry.menu.remove": "Remove from sidebar",
  "entry.menu.editValue": "Edit value\u2026",
  "entry.menu.toggle": "Toggle",
  "entry.menu.addItem": "Add item\u2026",
  "entry.menu.pickColor": "Pick color\u2026",
  "entry.menu.editImage": "Edit image link\u2026",
  "prompt.editValue": "Edit {name}",
  // -- entry kinds -----------------------------------------------------------
  "kind.blank": "Blank",
  "kind.toc": "Contents",
  "toc.hint": "Contents \u2014 click a section to scroll to it",
  "blank.dragHint": "Blank cell \u2014 drag to move",
  "blank.addHere": "Add property here",
  "blank.remove": "Remove blank",
  // -- grid editing --------------------------------------------------------------
  "grid.removeRow": "Remove this row",
  "grid.removeColumn": "Remove this column",
  "grid.removeAColumn": "Remove a column",
  "grid.addColumnHint": "Add a column here",
  "grid.removeColumnHint": "Remove this column",
  "grid.addRowHint": "Add a row here",
  "grid.removeRowHint": "Remove this row",
  // -- value types -------------------------------------------------------------
  "type.text": "text",
  "type.number": "number",
  "type.decimal": "decimal",
  "type.derived": "derived",
  "type.list": "list",
  "type.checkbox": "checkbox",
  "type.color": "color",
  "type.formula": "formula",
  "type.image": "image",
  "type.iframe": "iframe",
  // -- modifiers (influence engine) ----------------------------------------------
  "derive.value": "Value as-is",
  "mods.heading": "Modifier",
  "mods.preview": "{denote} = {total}",
  "mods.influence": "Influence {n}",
  "mods.sourceSelf": "(this property)",
  "mods.modeFormula": "Custom formula\u2026",
  "mods.formula": "Formula f(x)",
  "mods.termOptions": "Sign \xB7 toggle \xB7 short form",
  "mods.termOptionsDesc": "How this term enters the sum; a list property that toggles it per note (the way proficiency works); the short form shown in denotations; and whether the row shows this term's checkbox.",
  "mods.showToggle": "Show checkbox on the row",
  "mods.weightAdd": "+ add",
  "mods.weightSub": "\u2212 subtract",
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
  "mods.showToggleDesc": "On = the checkbox bound to \u201C{list}\u201D is shown on the row",
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
  "image.emptyHint": "No image \u2014 click to set",
  "image.linkPrompt": "Image link (URL or ![[embed]])",
  "image.linkPromptShort": "Image link",
  "iframe.emptyHint": "No URL \u2014 click to set",
  "iframe.urlPrompt": "Embed URL",
  "iframe.setUrl": "Set URL",
  // -- add-property popup -----------------------------------------------------
  "add.searchPlaceholder": "Add a property to \u201C{section}\u201D\u2026",
  "add.hiddenBadge": "hidden",
  "add.create": "Create \u201C{key}\u201D",
  "add.groupOnNote": "On note",
  "add.groupOnSidebar": "On sidebar",
  "add.groupOthers": "Others",
  "add.pickValues": "{key} \u2014 pick values",
  "add.customValue": "Custom value\u2026",
  "add.typeValue": "Type a value\u2026",
  "add.addN": "Add {n}",
  "add.addEmpty": "Add empty",
  "add.noValues": "No existing values.",
  "add.notesWith": "Notes with \u201C{value}\u201D",
  "add.noNotes": "No notes use this value.",
  // -- suggestions ----------------------------------------------------------------
  "suggest.create": "Create \u201C{key}\u201D (text)",
  "suggest.onNote": "on note",
  // -- dialogs -----------------------------------------------------------------------
  "exitEdit.title": "Leave edit mode",
  "exitEdit.message": "You made changes while editing. Keep them, or undo everything from this session?",
  "exitEdit.keepEditing": "Keep editing",
  "exitEdit.undo": "Undo changes",
  "exitEdit.save": "Save changes",
  "confirmChanges.title": "Apply changes?",
  "confirmChanges.message": "Keep the changes you made here, or undo them?",
  "confirmChanges.keep": "Keep changes",
  "confirmChanges.undo": "Undo changes",
  // -- pickers --------------------------------------------------------------------------
  "iconPicker.title": "Choose an icon",
  "iconPicker.search": "Search icons\u2026",
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
  "colorPicker.labA": "a (green\u2013red)",
  "colorPicker.labB": "b (blue\u2013yellow)",
  "imageViewer.hint": "Scroll to zoom \xB7 drag to pan \xB7 double-click to reset",
  // -- entry options modal -----------------------------------------------------------------
  "options.title": "\u201C{name}\u201D options",
  "options.propertyHeading": "Property",
  "options.objectHeading": "Object",
  "options.property": "Property",
  "options.propertyDesc": "Which note property this entry shows",
  "options.label": "Display label",
  "options.labelDesc": "Optional \u2014 leave blank to use \u201C{default}\u201D",
  "options.typeHeading": "Type",
  "options.dataType": "Data type",
  "options.dataTypeDesc": "Defaults to the Obsidian property type",
  "options.numberHeading": "Number & slider",
  "options.showSlider": "Show slider",
  "options.showSteppers": "Show \u2212 / + buttons",
  "options.sliderCurve": "Slider curve",
  "options.curveLinear": "Linear",
  "options.curveRoot": "Root",
  "options.curveExp": "Exponential",
  "options.rangeAuto": "Blank = this property's lowest/highest value across notes",
  "options.sharedHeading": "Shared settings ({n} selected)",
  "options.mixed": "Mixed values \u2014 changing this writes it to every selected tab.",
  "options.multiNote": "Editing {n} {type} properties together \u2014 every setting you change here is written to all of them.",
  "options.multiMixed": "Currently differing across the selection: {list}.",
  "options.showLabel": "Show label",
  "options.showLabelDesc": "On = the label is visible outside edit mode",
  "options.showWhenEmpty": "Show when empty",
  "options.showWhenEmptyDesc": "On = stays visible outside edit mode even without a value",
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
  // -- section options modal ----------------------------------------------------------------
  "sectionOptions.title": "Format \u201C{name}\u201D",
  "sectionOptions.tabSection": "Section",
  "sectionOptions.tabsHint": "Click a tab to edit it. Ctrl/Cmd-click toggles single tabs, Shift-click selects a range, and dragging across tabs selects several \u2014 the body then shows their shared settings, and only settings you change are written to all selected tabs.",
  "sectionOptions.columnN": "Column {n}",
  "sectionOptions.rowN": "Row {n}",
  "sectionOptions.groupBy": "Group tabs",
  "sectionOptions.groupColumn": "By column",
  "sectionOptions.groupRow": "By row",
  "sectionOptions.groupType": "By data type",
  "sectionOptions.showWhenEmptyDesc": "On = the section stays visible even when it has no visible properties (outside edit mode)",
  "sectionOptions.sectionHeading": "Section",
  "sectionOptions.name": "Name",
  "sectionOptions.nameDesc": "Optional \u2014 blank shows \u201CSection\u201D",
  "sectionOptions.collapsible": "Collapsible",
  "sectionOptions.dividers": "Horizontal dividers",
  "sectionOptions.vdividers": "Vertical dividers",
  "sectionOptions.hideIfEmptyDesc": "Hide the whole section when it has no visible properties (outside edit mode)",
  "sectionOptions.layoutHeading": "Layout",
  "sectionOptions.layout": "Layout",
  "sectionOptions.layoutDesc": "List = one column; Columns = vertical, independent columns; Grid = fixed 2D cells",
  "sectionOptions.columns": "Columns",
  "sectionOptions.rows": "Rows",
  "sectionOptions.rowsDesc": "Grid only",
  "sectionOptions.transparent": "Transparent",
  "sectionOptions.sticky": "Sticky",
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
  // -- sizes ------------------------------------------------------------------------------------
  "size.unlimited": "Unlimited",
  "size.small": "Small",
  "size.medium": "Medium",
  "size.large": "Large",
  "size.smallRows": "Small (~4)",
  "size.mediumRows": "Medium (~8)",
  "size.largeRows": "Large (~12)",
  // -- Obsidian properties-panel integration ---------------------------------------------------------
  "propPanel.hideEverywhere": "Hide \u201C{key}\u201D in properties (all notes)",
  "propPanel.showEverywhere": "Show \u201C{key}\u201D in properties (all notes)",
  "propPanel.hideShow": "Hide / show properties",
  "propPanel.hideKey": "  Hide \u201C{key}\u201D",
  "propPanel.showKey": "  Show \u201C{key}\u201D",
  "propPanel.groupInNotes": "In notes",
  "propPanel.groupOther": "Other",
  "propPanel.hiddenHeading": "Hidden properties",
  "propPanel.noneHidden": "None hidden",
  "propPanel.sidebarSuffix": "{key} (sidebar)",
  "propPanel.showAll": "Show all hidden",
  // -- commands & notices ------------------------------------------------------------------------------
  "command.openSidebar": "Open properties sidebar",
  "command.hideProperty": "Hide a property from Obsidian\u2019s properties panel",
  "notice.hiding": "Hiding \u201C{key}\u201D from Obsidian properties.",
  "notice.saveFailed": "Could not save property: {error}",
  // -- presets -------------------------------------------------------------------------------------------
  "preset.empty": "Empty",
  // -- settings tab -----------------------------------------------------------------------------------------
  "settings.intro": "Open a note whose Type matches one below, then click Edit (or right-click anything) to arrange it. Drag handles, use \u22EF / right-click for options (Configure for the full panel), click labels to rename, add properties at each section\u2019s bottom.",
  "settings.typesHeading": "Types",
  "settings.typesDesc": "Each Type has its own layout; a note\u2019s Type property selects it.",
  "settings.resetLayout": "Reset layout",
  "settings.resetLayoutConfirm": "Reset the \u201C{type}\u201D layout to defaults?",
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
  "settings.derivationsDesc": "Named formulas (in x) that influences can apply to a source value \u2014 e.g. an ability modifier. Fully editable; influences reference them by name.",
  "settings.derivationName": "Name",
  "settings.derivationDelete": "Delete",
  "settings.derivationAdd": "Add a building block",
  "settings.derivationAddBtn": "+ Block",
  "settings.derivationReseed": "Restore defaults",
  "settings.newDerivation": "New derivation",
  "settings.diceHeading": "Dice",
  "settings.diceAnim": "Roll animation",
  "settings.diceAnimDesc": "Tumble the rolled dice in 3D before settling; the modifier and total animate in afterwards, and the notice/log appear only once the roll resolves. Click the overlay to skip a roll.",
  "settings.diceAnimRolls": "Rolls before settling",
  "settings.diceAnimRollsDesc": "How many times the dice faces cycle before the result settles.",
  "settings.modDepth": "Modifier chain depth",
  "settings.modDepthDesc": "How many property\u2192property hops are resolved when derived values influence other derived values.",
  "settings.abbrHeading": "Short forms",
  "settings.abbrDesc": "Short forms used in modifier denotations (INT + DEX \u2212 AGE). The default is the capitalized first three letters of the property name; overrides apply everywhere the property is shown as a source.",
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
  "settings.languageHeading": "Language",
  "settings.language": "UI language",
  "settings.languageDesc": "Language of the sidebar and this settings tab.",
  "settings.overrides": "Custom wording",
  "settings.overridesDesc": "Replace any UI text with your own wording. Blank fields use the language default.",
  "settings.overridesReset": "Reset all",
  "settings.overridesSearch": "Search UI texts\u2026",
  "settings.overridesHint": "Search for a text to override it. Overridden texts are listed here.",
  "settings.overrideDefault": "Default: \u201C{text}\u201D",
  "settings.overridesMore": "{count} more \u2014 refine your search.",
  "settings.obsidianHeading": "Obsidian",
  "settings.hideShown": "Hide sidebar properties from Obsidian",
  "settings.hideShownDesc": "Override per property in its options.",
  "settings.propMenu": "Right-click hide in Obsidian properties",
  "settings.propMenuDesc": "Adds a hide toggle to the right-click menu in Obsidian\u2019s properties panel (replaces the default menu for that click).",
  "settings.hiddenHeading": "Always-hidden properties",
  "settings.hiddenDesc": "Hidden from Obsidian\u2019s properties panel everywhere, whether or not they\u2019re in the sidebar.",
  "settings.unhide": "Unhide",
  "settings.hideProperty": "Hide a property",
  "settings.hidePropertyBtn": "+ Hide property",
  "settings.hidePromptTitle": "Property name to hide",
  "settings.featuresHeading": "Features",
  "settings.featuresDesc": "Optional modules. Disabling one hides its widgets and templates; layouts and note properties are kept."
};

// src/i18n/locales/de.ts
var coreDe = {
  // -- common -----------------------------------------------------------
  "common.cancel": "Abbrechen",
  "common.confirm": "Best\xE4tigen",
  "common.save": "Speichern",
  "common.clear": "Entfernen",
  "common.choose": "Ausw\xE4hlen",
  "common.done": "Fertig",
  // -- view chrome ------------------------------------------------------
  "view.title": "Erweiterte Eigenschaften",
  "view.noNote": "\xD6ffne eine Notiz, um ihre Eigenschaften hier zu sehen.",
  "view.noType": "\u201E{note}\u201C hat keinen passenden Typ.",
  "view.noTypeHint": "Setze die Type-Eigenschaft auf einen dieser Werte:",
  "view.setType": "Type setzen: {type}",
  "view.noTypesConfigured": "Noch keine Typen konfiguriert. Gib dieser Notiz einen beliebigen Type-Wert, um einen zu erstellen (er beginnt leer), oder lege Typen in den Plugin-Einstellungen an.",
  "view.typeBadgeHint": "Type dieser Notiz \u2014 bestimmt, welches gespeicherte Layout angezeigt wird",
  "view.edit": "Bearbeiten",
  "view.done": "Fertig",
  "view.editHint": "Bearbeiten: Abschnitte & Eigenschaften anordnen, Typen, Farben usw. \xE4ndern",
  "view.doneHint": "Bearbeitung beenden \u2014 \xC4nderungen behalten oder verwerfen",
  "view.addSection": "+ Abschnitt",
  "view.resetAll": "Alles zur\xFCcksetzen",
  "view.resetConfirm": "Layout \u201E{type}\u201C auf Standard zur\xFCcksetzen? Notiz-Eigenschaften bleiben unver\xE4ndert.",
  "view.addTemplates": "Hinzuf\xFCgen:",
  "view.templateResetConfirm": "Der Abschnitt \u201E{name}\u201C existiert bereits. Auf seinen urspr\xFCnglichen Inhalt zur\xFCcksetzen?",
  // -- generic hints ------------------------------------------------------
  "hint.clickEdit": "Zum Bearbeiten klicken",
  "hint.dblEdit": "Zum Bearbeiten doppelklicken",
  "hint.dblToggle": "Zum Umschalten doppelklicken",
  // -- sections ------------------------------------------------------------
  "section.namePlaceholder": "Abschnitt",
  "section.newName": "Neuer Abschnitt",
  "section.untitled": "Ohne Titel",
  "section.renameHint": "Zum Umbenennen klicken",
  "section.dragHint": "Ziehen, um den Abschnitt zu verschieben",
  "section.layoutHint": "Layout: {mode} (klicken zum Wechseln)",
  "section.pinHint": "Oben anheften (fixiert)",
  "section.unpinHint": "Angeheftet \u2014 klicken zum L\xF6sen",
  "section.optionsHint": "Abschnittsoptionen",
  "layout.list": "Liste",
  "layout.columns": "Spalten",
  "layout.grid": "Raster",
  "section.menu.configure": "Abschnitt \u201E{name}\u201C konfigurieren\u2026",
  "section.menu.showDividers": "Horizontale Trennlinien anzeigen",
  "section.menu.hideDividers": "Horizontale Trennlinien ausblenden",
  "section.menu.showVDividers": "Vertikale Trennlinien anzeigen",
  "section.menu.hideVDividers": "Vertikale Trennlinien ausblenden",
  "section.menu.enableCollapse": "Einklappen aktivieren",
  "section.menu.disableCollapse": "Einklappen deaktivieren",
  "section.menu.addObject": "Objekt hinzuf\xFCgen",
  "section.menu.moveUp": "Nach oben",
  "section.menu.moveDown": "Nach unten",
  "section.menu.delete": "Abschnitt l\xF6schen",
  // -- entries ----------------------------------------------------------------
  "entry.addProperty": "+ Eigenschaft hinzuf\xFCgen",
  "entry.addToColumnHint": "Eigenschaft zu dieser Spalte von \u201E{section}\u201C hinzuf\xFCgen",
  "entry.addToSectionHint": "Eigenschaft zu \u201E{section}\u201C hinzuf\xFCgen",
  "entry.dragHint": "Ziehen zum Verschieben",
  "entry.changeKeyHint": "Klicken, um die angezeigte Eigenschaft zu \xE4ndern",
  "entry.renameHint": "Zum Umbenennen klicken",
  "entry.unknownKind": "Nicht verf\xFCgbar: {kind}",
  "entry.menu.configure": "Eigenschaft \u201E{name}\u201C konfigurieren\u2026",
  "entry.menu.configureObject": "Objekt \u201E{name}\u201C konfigurieren\u2026",
  "entry.menu.showInObsidian": "\u201E{key}\u201C in Obsidian-Eigenschaften anzeigen",
  "entry.menu.hideFromObsidian": "\u201E{key}\u201C aus Obsidian-Eigenschaften ausblenden",
  "entry.menu.clearValue": "Wert von \u201E{key}\u201C entfernen",
  "entry.menu.remove": "Aus der Seitenleiste entfernen",
  "entry.menu.editValue": "Wert bearbeiten\u2026",
  "entry.menu.toggle": "Umschalten",
  "entry.menu.addItem": "Eintrag hinzuf\xFCgen\u2026",
  "entry.menu.pickColor": "Farbe w\xE4hlen\u2026",
  "entry.menu.editImage": "Bildlink bearbeiten\u2026",
  "prompt.editValue": "{name} bearbeiten",
  // -- entry kinds -----------------------------------------------------------
  "kind.blank": "Leer",
  "kind.toc": "Inhalt",
  "toc.hint": "Inhalt \u2014 klicke einen Abschnitt, um dorthin zu springen",
  "blank.dragHint": "Leere Zelle \u2014 ziehen zum Verschieben",
  "blank.addHere": "Eigenschaft hier hinzuf\xFCgen",
  "blank.remove": "Leere Zelle entfernen",
  // -- grid editing --------------------------------------------------------------
  "grid.removeRow": "Diese Zeile entfernen",
  "grid.removeColumn": "Diese Spalte entfernen",
  "grid.removeAColumn": "Eine Spalte entfernen",
  "grid.addColumnHint": "Hier eine Spalte einf\xFCgen",
  "grid.removeColumnHint": "Diese Spalte entfernen",
  "grid.addRowHint": "Hier eine Zeile einf\xFCgen",
  "grid.removeRowHint": "Diese Zeile entfernen",
  // -- value types -------------------------------------------------------------
  "type.text": "Text",
  "type.number": "Zahl",
  "type.decimal": "Dezimalzahl",
  "type.derived": "abgeleitet",
  "type.list": "Liste",
  "type.checkbox": "Kontrollk\xE4stchen",
  "type.color": "Farbe",
  "type.formula": "Formel",
  "type.image": "Bild",
  "type.iframe": "Iframe",
  // -- modifiers (influence engine) ----------------------------------------------
  "derive.value": "Wert unver\xE4ndert",
  "mods.heading": "Modifikator",
  "mods.preview": "{denote} = {total}",
  "mods.influence": "Einfluss {n}",
  "mods.sourceSelf": "(diese Eigenschaft)",
  "mods.modeFormula": "Eigene Formel\u2026",
  "mods.formula": "Formel f(x)",
  "mods.termOptions": "Vorzeichen \xB7 Umschalter \xB7 K\xFCrzel",
  "mods.termOptionsDesc": "Wie dieser Term in die Summe eingeht; eine Listen-Eigenschaft, die ihn pro Notiz umschaltet (wie \xDCbung); das K\xFCrzel f\xFCr Anzeigen; und ob die Zeile das Kontrollk\xE4stchen dieses Terms zeigt.",
  "mods.showToggle": "Kontrollk\xE4stchen in der Zeile anzeigen",
  "mods.weightAdd": "+ addieren",
  "mods.weightSub": "\u2212 subtrahieren",
  "mods.toggleProp": "Umschalt-Listeneigenschaft",
  "mods.togglePlaceholder": "immer aktiv",
  "mods.abbr": "K\xFCrzel",
  "mods.addInfluence": "+ Einfluss hinzuf\xFCgen",
  "mods.removeInfluence": "Einfluss entfernen",
  "mods.moveUp": "Nach oben",
  "mods.moveDown": "Nach unten",
  "mods.showBadge": "Modifikator-Anzeige",
  "mods.showBadgeDesc": "K\xFCrzel-Summe plus berechneter Gesamtwert neben dem Wert",
  "mods.showChain": "Modifikator-Kette anzeigen",
  "mods.showChainDesc": "Die K\xFCrzel-Summe (INT + DEX); wird bei Platzmangel automatisch ausgeblendet",
  "mods.showDice": "W\xFCrfel anzeigen",
  "mods.showDiceDesc": "Die W\xFCrfel-Aufschl\xFCsselung (2W20) vor dem Modifikator; wird bei Platzmangel automatisch ausgeblendet",
  "mods.showToggleDesc": "An = das an \u201E{list}\u201C gebundene Kontrollk\xE4stchen wird in der Zeile angezeigt",
  "mods.showInChain": "In der Kette anzeigen",
  "mods.showInChainDesc": "An = dieser Term erscheint in der Ketten-Anzeige (er z\xE4hlt immer zur Summe)",
  "mods.showDiceIcon": "W\xFCrfel-Symbol anzeigen",
  "mods.showDiceIconDesc": "An = ein W\xFCrfel-Piktogramm steht vor der W\xFCrfel-Aufschl\xFCsselung",
  "mods.overrideNote": "Modifikator-\xDCberschreibung (diese Notiz)",
  "mods.overrideNoteDesc": "An = diese Notiz speichert einen festen Wert statt der abgeleiteten Summe. Bearbeiten des Werts in der Seitenleiste schaltet dies ein; Leeren des Felds schaltet es aus.",
  "mods.override": "Modifikator-\xDCberschreibung",
  "mods.overrideDesc": "Fester Wert statt der berechneten Summe f\xFCr alle Notizen. Eine in der Eigenschaft der Notiz gespeicherte Zahl \xFCberschreibt pro Notiz (Wert in der Zeile anklicken); leer = aus den Einfl\xFCssen abgeleitet.",
  "mods.clearNoteOverride": "\xDCberschreibung dieser Notiz entfernen",
  "list.add": "+ hinzuf\xFCgen",
  "list.addTo": "Zu {key} hinzuf\xFCgen",
  "list.noMoreValues": "Keine weiteren Werte.",
  "image.emptyHint": "Kein Bild \u2014 klicken zum Festlegen",
  "image.linkPrompt": "Bildlink (URL oder ![[Einbettung]])",
  "image.linkPromptShort": "Bildlink",
  "iframe.emptyHint": "Keine URL \u2014 klicken zum Festlegen",
  "iframe.urlPrompt": "Einbettungs-URL",
  "iframe.setUrl": "URL festlegen",
  // -- add-property popup -----------------------------------------------------
  "add.searchPlaceholder": "Eigenschaft zu \u201E{section}\u201C hinzuf\xFCgen\u2026",
  "add.hiddenBadge": "ausgeblendet",
  "add.create": "\u201E{key}\u201C erstellen",
  "add.groupOnNote": "In der Notiz",
  "add.groupOnSidebar": "In der Seitenleiste",
  "add.groupOthers": "Weitere",
  "add.pickValues": "{key} \u2014 Werte w\xE4hlen",
  "add.customValue": "Eigener Wert\u2026",
  "add.typeValue": "Wert eingeben\u2026",
  "add.addN": "{n} hinzuf\xFCgen",
  "add.addEmpty": "Leer hinzuf\xFCgen",
  "add.noValues": "Keine vorhandenen Werte.",
  "add.notesWith": "Notizen mit \u201E{value}\u201C",
  "add.noNotes": "Keine Notiz verwendet diesen Wert.",
  // -- suggestions ----------------------------------------------------------------
  "suggest.create": "\u201E{key}\u201C erstellen (Text)",
  "suggest.onNote": "in der Notiz",
  // -- dialogs -----------------------------------------------------------------------
  "exitEdit.title": "Bearbeitungsmodus verlassen",
  "exitEdit.message": "Du hast beim Bearbeiten \xC4nderungen vorgenommen. Behalten oder alles aus dieser Sitzung verwerfen?",
  "exitEdit.keepEditing": "Weiter bearbeiten",
  "exitEdit.undo": "\xC4nderungen verwerfen",
  "exitEdit.save": "\xC4nderungen speichern",
  "confirmChanges.title": "\xC4nderungen \xFCbernehmen?",
  "confirmChanges.message": "Die hier vorgenommenen \xC4nderungen behalten oder verwerfen?",
  "confirmChanges.keep": "\xC4nderungen behalten",
  "confirmChanges.undo": "\xC4nderungen verwerfen",
  // -- pickers --------------------------------------------------------------------------
  "iconPicker.title": "Symbol ausw\xE4hlen",
  "iconPicker.search": "Symbole durchsuchen\u2026",
  "iconPicker.noMatch": "Keine passenden Symbole.",
  "colorPicker.title": "Farbe w\xE4hlen",
  "colorPicker.eyedropper": "Vom Bildschirm aufnehmen",
  "colorPicker.red": "Rot",
  "colorPicker.green": "Gr\xFCn",
  "colorPicker.blue": "Blau",
  "colorPicker.hue": "Farbton",
  "colorPicker.saturation": "S\xE4ttigung",
  "colorPicker.lightness": "Helligkeit",
  "colorPicker.chroma": "Chroma",
  "colorPicker.labA": "a (Gr\xFCn\u2013Rot)",
  "colorPicker.labB": "b (Blau\u2013Gelb)",
  "imageViewer.hint": "Scrollen zum Zoomen \xB7 Ziehen zum Verschieben \xB7 Doppelklick zum Zur\xFCcksetzen",
  // -- entry options modal -----------------------------------------------------------------
  "options.title": "Optionen f\xFCr \u201E{name}\u201C",
  "options.propertyHeading": "Eigenschaft",
  "options.objectHeading": "Objekt",
  "options.property": "Eigenschaft",
  "options.propertyDesc": "Welche Notiz-Eigenschaft dieser Eintrag anzeigt",
  "options.label": "Anzeigename",
  "options.labelDesc": "Optional \u2014 leer lassen f\xFCr \u201E{default}\u201C",
  "options.typeHeading": "Typ",
  "options.dataType": "Datentyp",
  "options.dataTypeDesc": "Standard ist der Obsidian-Eigenschaftstyp",
  "options.numberHeading": "Zahl & Schieberegler",
  "options.showSlider": "Schieberegler anzeigen",
  "options.showSteppers": "\u2212/+-Schaltfl\xE4chen anzeigen",
  "options.sliderCurve": "Regler-Kennlinie",
  "options.curveLinear": "Linear",
  "options.curveRoot": "Wurzel",
  "options.curveExp": "Exponentiell",
  "options.rangeAuto": "Leer = kleinster/gr\xF6\xDFter Wert dieser Eigenschaft \xFCber alle Notizen",
  "options.sharedHeading": "Gemeinsame Einstellungen ({n} ausgew\xE4hlt)",
  "options.mixed": "Unterschiedliche Werte \u2014 eine \xC4nderung schreibt sie in alle ausgew\xE4hlten Tabs.",
  "options.multiNote": "{n} {type}-Eigenschaften werden gemeinsam bearbeitet \u2014 jede hier ge\xE4nderte Einstellung wird in alle geschrieben.",
  "options.multiMixed": "Derzeit unterschiedlich in der Auswahl: {list}.",
  "options.showLabel": "Namen anzeigen",
  "options.showLabelDesc": "An = der Name ist au\xDFerhalb des Bearbeitungsmodus sichtbar",
  "options.showWhenEmpty": "Auch leer anzeigen",
  "options.showWhenEmptyDesc": "An = bleibt au\xDFerhalb des Bearbeitungsmodus auch ohne Wert sichtbar",
  "options.showType": "Datentyp anzeigen",
  "options.showTypeDesc": "Kleines kursives K\xFCrzel neben dem Namen; wird bei Platzmangel automatisch ausgeblendet",
  "options.minimum": "Minimum",
  "options.maximum": "Maximum",
  "options.clamp": "Eingegebene Werte begrenzen",
  "options.formula": "Regler-Formel f(x)",
  "options.formulaDesc": "z. B. sqrt(x), x^2, 2*x+1",
  "options.imageHeading": "Bild",
  "options.maxHeight": "Maximale H\xF6he",
  "options.embedHeading": "Einbettung",
  "options.embedHeight": "H\xF6he (px)",
  "options.embedScale": "Skalierung",
  "options.appearanceHeading": "Darstellung",
  "options.icon": "Symbol",
  "options.iconDesc": "Optionales Symbol links neben dem Namen",
  "options.iconColor": "Symbolfarbe",
  "options.hideLabel": "Namen ausblenden",
  "options.hideLabelDesc": "Namen au\xDFerhalb des Bearbeitungsmodus ausblenden",
  "options.hideIfEmpty": "Ausblenden, wenn leer",
  "options.hideIfEmptyDesc": "Ohne Wert wird dieser Eintrag au\xDFerhalb des Bearbeitungsmodus komplett ausgeblendet",
  "options.labelSize": "Namensgr\xF6\xDFe",
  "options.valueSize": "Wertgr\xF6\xDFe",
  "options.sizeDesc": "0 = Theme-Standard",
  "options.labelColor": "Namensfarbe",
  "options.valueColor": "Wertfarbe",
  "options.obsidianHeading": "Obsidian",
  "options.showInObsidian": "In Obsidian-Eigenschaften anzeigen",
  "options.showInObsidianDesc": "Aus = im Eigenschaften-Panel ausgeblendet",
  "options.placementHeading": "Platzierung",
  // -- section options modal ----------------------------------------------------------------
  "sectionOptions.title": "\u201E{name}\u201C formatieren",
  "sectionOptions.tabSection": "Abschnitt",
  "sectionOptions.tabsHint": "Tab anklicken zum Bearbeiten. Strg/Cmd-Klick schaltet einzelne Tabs um, Umschalt-Klick w\xE4hlt einen Bereich, und Ziehen \xFCber Tabs w\xE4hlt mehrere \u2014 der Bereich zeigt dann die gemeinsamen Einstellungen, und nur ge\xE4nderte Einstellungen werden in alle ausgew\xE4hlten Tabs geschrieben.",
  "sectionOptions.columnN": "Spalte {n}",
  "sectionOptions.rowN": "Zeile {n}",
  "sectionOptions.groupBy": "Tabs gruppieren",
  "sectionOptions.groupColumn": "Nach Spalte",
  "sectionOptions.groupRow": "Nach Zeile",
  "sectionOptions.groupType": "Nach Datentyp",
  "sectionOptions.showWhenEmptyDesc": "An = der Abschnitt bleibt sichtbar, auch wenn er keine sichtbaren Eigenschaften hat (au\xDFerhalb des Bearbeitungsmodus)",
  "sectionOptions.sectionHeading": "Abschnitt",
  "sectionOptions.name": "Name",
  "sectionOptions.nameDesc": "Optional \u2014 leer zeigt \u201EAbschnitt\u201C",
  "sectionOptions.collapsible": "Einklappbar",
  "sectionOptions.dividers": "Horizontale Trennlinien",
  "sectionOptions.vdividers": "Vertikale Trennlinien",
  "sectionOptions.hideIfEmptyDesc": "Abschnitt ausblenden, wenn er keine sichtbaren Eigenschaften hat (au\xDFerhalb des Bearbeitungsmodus)",
  "sectionOptions.layoutHeading": "Layout",
  "sectionOptions.layout": "Layout",
  "sectionOptions.layoutDesc": "Liste = eine Spalte; Spalten = unabh\xE4ngige vertikale Spalten; Raster = festes 2D-Raster",
  "sectionOptions.columns": "Spalten",
  "sectionOptions.rows": "Zeilen",
  "sectionOptions.rowsDesc": "Nur im Raster",
  "sectionOptions.transparent": "Transparent",
  "sectionOptions.sticky": "Fixiert",
  "sectionOptions.height": "H\xF6he",
  "sectionOptions.heightDesc": "Scrollt innerhalb des Abschnitts, wenn begrenzt",
  "sectionOptions.colorsHeading": "Farben",
  "sectionOptions.accent": "Akzentfarbe",
  "sectionOptions.accentDesc": "Titel & Hervorhebungen",
  "sectionOptions.background": "Hintergrundfarbe",
  "sectionOptions.controls": "Farbe der Bedienelemente",
  "sectionOptions.controlsDesc": "Schaltfl\xE4chen & Listen-Chips",
  "sectionOptions.titleHeading": "Titel",
  "sectionOptions.titleSize": "Titelgr\xF6\xDFe",
  // -- sizes ------------------------------------------------------------------------------------
  "size.unlimited": "Unbegrenzt",
  "size.small": "Klein",
  "size.medium": "Mittel",
  "size.large": "Gro\xDF",
  "size.smallRows": "Klein (~4)",
  "size.mediumRows": "Mittel (~8)",
  "size.largeRows": "Gro\xDF (~12)",
  // -- Obsidian properties-panel integration ---------------------------------------------------------
  "propPanel.hideEverywhere": "\u201E{key}\u201C in Eigenschaften ausblenden (alle Notizen)",
  "propPanel.showEverywhere": "\u201E{key}\u201C in Eigenschaften anzeigen (alle Notizen)",
  "propPanel.hideShow": "Eigenschaften aus-/einblenden",
  "propPanel.hideKey": "  \u201E{key}\u201C ausblenden",
  "propPanel.showKey": "  \u201E{key}\u201C anzeigen",
  "propPanel.groupInNotes": "In Notizen",
  "propPanel.groupOther": "Weitere",
  "propPanel.hiddenHeading": "Ausgeblendete Eigenschaften",
  "propPanel.noneHidden": "Keine ausgeblendet",
  "propPanel.sidebarSuffix": "{key} (Seitenleiste)",
  "propPanel.showAll": "Alle wieder anzeigen",
  // -- commands & notices ------------------------------------------------------------------------------
  "command.openSidebar": "Eigenschaften-Seitenleiste \xF6ffnen",
  "command.hideProperty": "Eigenschaft aus Obsidians Eigenschaften-Panel ausblenden",
  "notice.hiding": "\u201E{key}\u201C wird aus Obsidian-Eigenschaften ausgeblendet.",
  "notice.saveFailed": "Eigenschaft konnte nicht gespeichert werden: {error}",
  // -- presets -------------------------------------------------------------------------------------------
  "preset.empty": "Leer",
  // -- settings tab -----------------------------------------------------------------------------------------
  "settings.intro": "\xD6ffne eine Notiz, deren Type unten aufgef\xFChrt ist, und klicke auf Bearbeiten (oder Rechtsklick), um sie anzuordnen. Greifer ziehen, \u22EF / Rechtsklick f\xFCr Optionen (Konfigurieren f\xFCr das volle Panel), Namen anklicken zum Umbenennen, Eigenschaften unten in jedem Abschnitt hinzuf\xFCgen.",
  "settings.typesHeading": "Typen",
  "settings.typesDesc": "Jeder Typ hat ein eigenes Layout; die Type-Eigenschaft einer Notiz w\xE4hlt es aus.",
  "settings.resetLayout": "Layout zur\xFCcksetzen",
  "settings.resetLayoutConfirm": "Layout \u201E{type}\u201C auf Standard zur\xFCcksetzen?",
  "settings.deleteType": "L\xF6schen",
  "settings.addType": "Typ hinzuf\xFCgen",
  "settings.addTypeBtn": "+ Typ",
  "settings.newTypePrompt": "Name des neuen Typs",
  "settings.typeExists": "Dieser Typ existiert bereits.",
  "settings.defaultsHeading": "Standards",
  "settings.defaultDataType": "Standard-Datentyp",
  "settings.defaultDataTypeDesc": "F\xFCr neue Eigenschaften ohne Obsidian-Typ",
  "settings.defaultColorSpace": "Standard-Farbraum",
  "settings.newSectionHeading": "Standards f\xFCr neue Abschnitte",
  "settings.entryDividers": "Trennlinien zwischen Eigenschaften",
  "settings.derivationsHeading": "Modifikator-Bausteine",
  "settings.derivationsDesc": "Benannte Formeln (in x), die Einfl\xFCsse auf einen Quellwert anwenden k\xF6nnen \u2014 z. B. ein Attributsmodifikator. Frei bearbeitbar; Einfl\xFCsse verweisen \xFCber den Namen darauf.",
  "settings.derivationName": "Name",
  "settings.derivationDelete": "L\xF6schen",
  "settings.derivationAdd": "Baustein hinzuf\xFCgen",
  "settings.derivationAddBtn": "+ Baustein",
  "settings.derivationReseed": "Standards wiederherstellen",
  "settings.newDerivation": "Neue Ableitung",
  "settings.diceHeading": "W\xFCrfel",
  "settings.diceAnim": "Wurf-Animation",
  "settings.diceAnimDesc": "Die geworfenen W\xFCrfel taumeln in 3D, bevor sie liegen bleiben; Modifikator und Gesamtwert werden danach eingeblendet, und Hinweis/Protokoll erscheinen erst, wenn der Wurf abgeschlossen ist. Klick auf die \xDCberlagerung \xFCberspringt einen Wurf.",
  "settings.diceAnimRolls": "W\xFCrfe bis zum Ergebnis",
  "settings.diceAnimRollsDesc": "Wie oft die W\xFCrfelseiten durchwechseln, bevor das Ergebnis liegen bleibt.",
  "settings.modDepth": "Modifikator-Kettentiefe",
  "settings.modDepthDesc": "Wie viele Eigenschaft\u2192Eigenschaft-Schritte aufgel\xF6st werden, wenn abgeleitete Werte andere abgeleitete Werte beeinflussen.",
  "settings.abbrHeading": "K\xFCrzel",
  "settings.abbrDesc": "K\xFCrzel f\xFCr Modifikator-Anzeigen (INT + DEX \u2212 ALT). Standard sind die ersten drei Gro\xDFbuchstaben des Eigenschaftsnamens; \xDCberschreibungen gelten \xFCberall, wo die Eigenschaft als Quelle erscheint.",
  "settings.abbrDefault": "Standard: {abbr}",
  "settings.abbrDelete": "\xDCberschreibung entfernen",
  "settings.abbrAdd": "K\xFCrzel hinzuf\xFCgen",
  "settings.abbrAddBtn": "+ K\xFCrzel",
  "settings.abbrPrompt": "Name der Quell-Eigenschaft",
  "settings.typographyHeading": "Typografie",
  "settings.typographyDesc": "Gr\xF6\xDFen in px; 0 verwendet den Theme-Standard.",
  "settings.fontFamily": "Schriftfamilie",
  "settings.fontPlaceholder": "Theme-Standard",
  "settings.baseSize": "Grundgr\xF6\xDFe",
  "settings.listSize": "Listeneintragsgr\xF6\xDFe",
  "settings.languageHeading": "Sprache",
  "settings.language": "Sprache der Oberfl\xE4che",
  "settings.languageDesc": "Sprache der Seitenleiste und dieses Einstellungs-Tabs.",
  "settings.overrides": "Eigene Formulierungen",
  "settings.overridesDesc": "Ersetze beliebige UI-Texte durch eigene Formulierungen. Leere Felder verwenden den Sprachstandard.",
  "settings.overridesReset": "Alle zur\xFCcksetzen",
  "settings.overridesSearch": "UI-Texte durchsuchen\u2026",
  "settings.overridesHint": "Suche nach einem Text, um ihn zu ersetzen. Ersetzte Texte werden hier aufgef\xFChrt.",
  "settings.overrideDefault": "Standard: \u201E{text}\u201C",
  "settings.overridesMore": "{count} weitere \u2014 Suche verfeinern.",
  "settings.obsidianHeading": "Obsidian",
  "settings.hideShown": "Seitenleisten-Eigenschaften in Obsidian ausblenden",
  "settings.hideShownDesc": "Pro Eigenschaft in deren Optionen \xFCbersteuerbar.",
  "settings.propMenu": "Rechtsklick-Ausblenden in Obsidian-Eigenschaften",
  "settings.propMenuDesc": "Erg\xE4nzt das Rechtsklick-Men\xFC im Eigenschaften-Panel um einen Ausblenden-Schalter (ersetzt dort das Standardmen\xFC).",
  "settings.hiddenHeading": "Dauerhaft ausgeblendete Eigenschaften",
  "settings.hiddenDesc": "\xDCberall aus Obsidians Eigenschaften-Panel ausgeblendet, ob in der Seitenleiste oder nicht.",
  "settings.unhide": "Einblenden",
  "settings.hideProperty": "Eigenschaft ausblenden",
  "settings.hidePropertyBtn": "+ Eigenschaft ausblenden",
  "settings.hidePromptTitle": "Name der auszublendenden Eigenschaft",
  "settings.featuresHeading": "Funktionen",
  "settings.featuresDesc": "Optionale Module. Beim Deaktivieren verschwinden Widgets und Vorlagen; Layouts und Notiz-Eigenschaften bleiben erhalten."
};

// src/core/model.ts
function ext(entry) {
  return entry;
}
function sectionMode(section) {
  var _a;
  return (_a = section.layoutMode) != null ? _a : section.columns > 1 ? "columns" : "list";
}
var LAYOUT_VERSION = 4;

// src/utils/formula.ts
var UNARY = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  ln: Math.log,
  log: (v) => Math.log10(v)
};
function compileFormula(expr) {
  const s = expr;
  let i = 0;
  const ws = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const peek = () => s[i];
  function parseExpr() {
    let n = parseTerm();
    ws();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const r = parseTerm();
      const a = n;
      n = op === "+" ? (x) => a(x) + r(x) : (x) => a(x) - r(x);
      ws();
    }
    return n;
  }
  function parseTerm() {
    let n = parseFactor();
    ws();
    while (peek() === "*" || peek() === "/") {
      const op = s[i++];
      const r = parseFactor();
      const a = n;
      n = op === "*" ? (x) => a(x) * r(x) : (x) => a(x) / r(x);
      ws();
    }
    return n;
  }
  function parseFactor() {
    ws();
    if (peek() === "-") {
      i++;
      const f = parseFactor();
      return (x) => -f(x);
    }
    if (peek() === "+") {
      i++;
      return parseFactor();
    }
    let n = parseBase();
    ws();
    while (peek() === "^") {
      i++;
      const r = parseFactor();
      const a = n;
      n = (x) => Math.pow(a(x), r(x));
      ws();
    }
    return n;
  }
  function parseBase() {
    ws();
    const c = peek();
    if (c === "(") {
      i++;
      const e = parseExpr();
      ws();
      if (peek() === ")") i++;
      else throw 0;
      return e;
    }
    if (c !== void 0 && /[0-9.]/.test(c)) {
      let num = "";
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      if ((num.match(/\./g) || []).length > 1 || num === ".") throw 0;
      const v = parseFloat(num);
      if (!Number.isFinite(v)) throw 0;
      return () => v;
    }
    if (c !== void 0 && /[a-zA-Z_]/.test(c)) {
      let id = "";
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) id += s[i++];
      ws();
      if (peek() === "(") {
        i++;
        const args = [parseExpr()];
        ws();
        while (peek() === ",") {
          i++;
          args.push(parseExpr());
          ws();
        }
        if (peek() === ")") i++;
        else throw 0;
        const a0 = args[0];
        if (id === "log" && args.length === 2) {
          const b = args[1];
          return (x) => Math.log(a0(x)) / Math.log(b(x));
        }
        if (UNARY[id]) {
          const fn = UNARY[id];
          return (x) => fn(a0(x));
        }
        if (id === "pow") {
          const b = args[1];
          return (x) => Math.pow(a0(x), b(x));
        }
        if (id === "min") return (x) => Math.min(...args.map((a) => a(x)));
        if (id === "max") return (x) => Math.max(...args.map((a) => a(x)));
        throw 0;
      }
      if (id === "x") return (x) => x;
      if (id === "pi") return () => Math.PI;
      if (id === "e") return () => Math.E;
      throw 0;
    }
    throw 0;
  }
  try {
    ws();
    const fn = parseExpr();
    ws();
    if (i !== s.length) return null;
    const probe = fn(1);
    if (typeof probe !== "number" || Number.isNaN(probe)) return null;
    return fn;
  } catch (e) {
    return null;
  }
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

// src/core/influences.ts
function defaultDerivations() {
  return [
    { id: "abilityMod", name: "Ability modifier", formula: "floor((x - 10) / 2)" },
    { id: "profBonus", name: "Proficiency bonus", formula: "2 + floor((max(x, 1) - 1) / 4)" }
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
  const v = env.note.raw[key];
  if (v === null || v === void 0 || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function findDerivedEntry(env, key) {
  if (!env.layout || !key) return null;
  const kl = key.toLowerCase();
  for (const s of env.layout.sections)
    for (const e of s.entries)
      if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl && e.dataType === "derived") return e;
  return null;
}
function sourceValue(env, key, depth) {
  const stored = numericRaw(env, key);
  if (stored !== null) return stored;
  if (depth > 0) {
    const en = findDerivedEntry(env, key);
    if (en) return totalAt(env, en, depth - 1);
  }
  return env.note.num(key, 0);
}
function influenceActive(env, entry, inf) {
  var _a, _b;
  if (!inf.toggle) return true;
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
function termAt(env, entry, inf, depth) {
  if (!influenceActive(env, entry, inf)) return 0;
  const key = inf.source || entry.key || "";
  const raw = sourceValue(env, key, depth);
  const sign = inf.weight === -1 ? -1 : 1;
  return sign * applyDerivation(env, inf, raw);
}
function totalAt(env, entry, depth) {
  var _a;
  const e = ext(entry);
  if (entry.dataType === "derived" && entry.key) {
    const stored = numericRaw(env, entry.key);
    if (stored !== null) return stored;
  }
  if (e.rollOverride !== void 0) return e.rollOverride;
  return ((_a = e.mods) != null ? _a : []).reduce((sum, inf) => sum + termAt(env, entry, inf, depth), 0);
}
function influenceTerm(env, entry, inf) {
  return termAt(env, entry, inf, maxDepth(env));
}
function modifierTotal(env, entry) {
  return totalAt(env, entry, maxDepth(env));
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
function setAbbr(settings, key, abbr) {
  const kl = (key != null ? key : "").toLowerCase();
  for (const k of Object.keys(settings.sourceAbbrs))
    if (k.toLowerCase() === kl) delete settings.sourceAbbrs[k];
  const v = (abbr != null ? abbr : "").trim();
  if (v && v !== defaultAbbr(key)) settings.sourceAbbrs[key] = v;
}
function denotationText(settings, entry, mods2) {
  let out = "";
  mods2.forEach((inf, i) => {
    const neg = inf.weight === -1;
    if (i > 0) out += neg ? " \u2212 " : " + ";
    else if (neg) out += "\u2212";
    out += abbrFor(settings, inf.source || entry.key || "");
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
    diceAnimRolls: 10
  };
}
function normalizeSettings(data, defaultLayout) {
  var _a, _b, _c;
  const s = defaultSettings();
  if (data) {
    if (data.layouts && data.types) {
      s.types = data.types;
      s.layouts = data.layouts;
    } else if ((_b = (_a = data.layout) == null ? void 0 : _a.sections) == null ? void 0 : _b.length) {
      s.types = ["Character"];
      s.layouts = { character: data.layout };
    }
    if (typeof data.hideShown === "boolean") s.hideShown = data.hideShown;
    if (data.defaults) s.defaults = { ...DEFAULT_DEFAULTS, ...data.defaults };
    if (Array.isArray(data.manualHide)) s.manualHide = data.manualHide;
    if (typeof data.propMenu === "boolean") s.propMenu = data.propMenu;
    if (typeof data.language === "string") s.language = data.language;
    if (data.stringOverrides && typeof data.stringOverrides === "object") s.stringOverrides = data.stringOverrides;
    if (data.features && typeof data.features === "object") s.features = data.features;
    if (Array.isArray(data.derivations))
      s.derivations = data.derivations.filter((d) => d && typeof d.id === "string");
    if (data.sourceAbbrs && typeof data.sourceAbbrs === "object") s.sourceAbbrs = data.sourceAbbrs;
    if (typeof data.modDepth === "number" && data.modDepth >= 0)
      s.modDepth = Math.min(32, Math.floor(data.modDepth));
    if (typeof data.diceAnim === "boolean") s.diceAnim = data.diceAnim;
    if (typeof data.diceAnimRolls === "number" && data.diceAnimRolls >= 1)
      s.diceAnimRolls = Math.min(60, Math.floor(data.diceAnimRolls));
  }
  for (const t of s.types) {
    const k = t.toLowerCase();
    if (!((_c = s.layouts[k]) == null ? void 0 : _c.sections)) s.layouts[k] = defaultLayout();
  }
  return s;
}

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
    this.skillPresets = new Registry();
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
    this.skillPresets.clear();
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
var PropertyIndex = class {
  constructor(app) {
    this.app = app;
  }
  /**
   * All property names known to the vault. Prefers the metadata managers;
   * falls back to scanning frontmatter of up to 1000 notes.
   */
  knownProps() {
    var _a, _b, _c, _d, _e, _f;
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
      for (const f of this.app.vault.getMarkdownFiles().slice(0, 1e3)) {
        const fm = (_f = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _f.frontmatter;
        if (fm) for (const k of Object.keys(fm)) names.add(k);
      }
    }
    return [...names];
  }
  /** Smallest and largest numeric value of `key` across all notes. */
  numberRange(key) {
    var _a, _b;
    let min = Infinity;
    let max = -Infinity;
    for (const f of this.app.vault.getMarkdownFiles()) {
      const v = (_b = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[key];
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
    var _a, _b;
    const set = /* @__PURE__ */ new Set();
    for (const f of this.app.vault.getMarkdownFiles()) {
      const v = (_b = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[key];
      if (Array.isArray(v)) v.forEach((x) => set.add(String(x)));
      else if (v !== void 0 && v !== null && v !== "") set.add(String(v));
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }
  /** Basenames of notes whose `key` contains `value`. */
  notesWithValue(key, value) {
    var _a, _b;
    const out = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const v = (_b = (_a = this.app.metadataCache.getFileCache(f)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b[key];
      const has = Array.isArray(v) ? v.some((x) => String(x) === value) : v !== void 0 && v !== null && String(v) === value;
      if (has) out.push(f.basename);
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
var HIDE_STYLE_ID = "ep-hide-properties";
var HideService = class {
  constructor(host) {
    this.host = host;
    this.styleEl = null;
  }
  /** Create the style element. Returns a disposer for `Plugin.register`. */
  install() {
    this.styleEl = document.head.createEl("style", { attr: { id: HIDE_STYLE_ID } });
    this.update();
    return () => {
      var _a;
      return (_a = this.styleEl) == null ? void 0 : _a.remove();
    };
  }
  /** Recompute the CSS from current settings. Call after every save. */
  update() {
    if (!this.styleEl) return;
    const s = this.host.settings;
    const keys = /* @__PURE__ */ new Set();
    if (s.hideShown) {
      for (const lk of Object.keys(s.layouts))
        for (const sec of s.layouts[lk].sections)
          for (const e of sec.entries)
            if (e.kind === "prop" && e.key && !e.showInObsidian) keys.add(e.key.toLowerCase());
    }
    for (const k of s.manualHide || []) keys.add(k.toLowerCase());
    const esc = (k) => k.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    this.styleEl.textContent = [...keys].map((k) => `.metadata-property[data-property-key="${esc(k)}"]{display:none!important;}`).join("\n");
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
  const value = JSON.parse(snapshot);
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, value);
}

// src/ui/components/suggest.ts
var import_obsidian = require("obsidian");
var PropSuggest = class extends import_obsidian.AbstractInputSuggest {
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
    const res = filtered.map((c) => ({ key: c.key, kind: c.onNote ? "note" : "vault" }));
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
    if (c.kind === "note") el.createSpan({ cls: "ep-sug-badge", text: this.i18n.t("suggest.onNote") });
  }
  selectSuggestion(c) {
    var _a;
    this.onChoose(c.key);
    this.setValue(this.clearOnSelect ? "" : c.key);
    (_a = this.close) == null ? void 0 : _a.call(this);
  }
};
var ValueSuggest = class extends import_obsidian.AbstractInputSuggest {
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
    if (save) commit2(n);
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
  new ValueSuggest(app, input, () => valuesFor(key), (v) => commit2(v), false);
  input.addEventListener("focus", () => input.dispatchEvent(new Event("input")));
  input.dispatchEvent(new Event("input"));
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save) commit2(input.value.trim());
  };
  input.onblur = () => setTimeout(() => finish(true), 150);
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
var import_obsidian2 = require("obsidian");
var ConfirmModal = class extends import_obsidian2.Modal {
  constructor(app, i18n, message, onConfirm) {
    super(app);
    this.i18n = i18n;
    this.message = message;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    this.contentEl.createEl("p", { text: this.message });
    new import_obsidian2.Setting(this.contentEl).addButton((b) => b.setButtonText(this.i18n.t("common.cancel")).onClick(() => this.close())).addButton(
      (b) => b.setButtonText(this.i18n.t("common.confirm")).setWarning().onClick(() => {
        this.onConfirm();
        this.close();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ExitEditModal = class extends import_obsidian2.Modal {
  constructor(app, i18n, onSave, onDiscard) {
    super(app);
    this.i18n = i18n;
    this.onSave = onSave;
    this.onDiscard = onDiscard;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.i18n.t("exitEdit.title") });
    contentEl.createEl("p", { text: this.i18n.t("exitEdit.message") });
    new import_obsidian2.Setting(contentEl).addButton((b) => b.setButtonText(this.i18n.t("exitEdit.keepEditing")).onClick(() => this.close())).addButton(
      (b) => b.setButtonText(this.i18n.t("exitEdit.undo")).setWarning().onClick(() => {
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
var ConfirmChangesModal = class extends import_obsidian2.Modal {
  constructor(app, i18n, onKeep, onUndo) {
    super(app);
    this.i18n = i18n;
    this.onKeep = onKeep;
    this.onUndo = onUndo;
  }
  onOpen() {
    const c = this.contentEl;
    c.createEl("h3", { text: this.i18n.t("confirmChanges.title") });
    c.createEl("p", { text: this.i18n.t("confirmChanges.message") });
    new import_obsidian2.Setting(c).addButton(
      (b) => b.setButtonText(this.i18n.t("confirmChanges.undo")).setWarning().onClick(() => {
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
var TextPromptModal = class extends import_obsidian2.Modal {
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
    new import_obsidian2.Setting(contentEl).setName(this.title).addText((t) => {
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
    new import_obsidian2.Setting(contentEl).addButton((b) => b.setButtonText(this.i18n.t("common.cancel")).onClick(() => this.close())).addButton(
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

// src/ui/render/value-types/text.ts
var textType = {
  id: "text",
  name: (i18n) => i18n.t("type.text"),
  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueSize) v.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) v.style.color = entry.valueColor;
    const s = v.createSpan();
    const draw = () => {
      const val = view.note.str(key);
      s.empty();
      if (val === "") {
        s.setText("\u2014");
        s.addClass("ep-placeholder");
      } else {
        s.removeClass("ep-placeholder");
        view.renderLinks(s, val);
      }
      s.addClass("ep-editable");
    };
    draw();
    view.bindOpen(
      s,
      () => openTextInput(
        view.app,
        s,
        key,
        view.note.str(key),
        (k) => view.props.valuesFor(k),
        (nv) => view.note.set(file, key, nv === "" ? void 0 : nv)
      )
    );
    view.registerUpdater(draw);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(() => {
        new TextPromptModal(
          view.app,
          view.i18n,
          view.i18n.t("prompt.editValue", { name: entry.alias || key }),
          view.note.str(key),
          (v) => view.note.set(file, key, v.trim() === "" ? void 0 : v.trim()),
          () => view.props.valuesFor(key)
        ).open();
      })
    );
  }
};

// src/ui/render/value-types/numeric.ts
var import_obsidian3 = require("obsidian");

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
  for (const _ of flags.before) cols.push("auto");
  if (flags.steppers) cols.push("20px");
  cols.push("minmax(2.1em, auto)");
  if (flags.steppers) cols.push("20px");
  for (const _ of flags.after) cols.push("auto");
  cl.style.gridTemplateColumns = cols.join(" ");
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
      const dec = cl.createEl("button", { cls: "ep-step-btn", text: "\u2212" });
      dec.onclick = () => {
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
      inc.onclick = () => {
        const cur = o.get();
        o.commit(o.clamp ? clamp(cur + 1, min, max) : cur + 1);
      };
    } else {
      cl.createSpan({ cls: "ep-cell" });
    }
  }
  for (const slot of flags.after) makeSlotCell(slot);
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
function render(kind, ctx) {
  var _a;
  const { view, file, entry } = ctx;
  const key = entry.key;
  const isFormula = kind === "formula";
  const isDecimal = kind === "decimal";
  const vault = entry.min === void 0 || entry.max === void 0 ? view.props.numberRange(key) : null;
  const { min, max } = effectiveRange(kind, entry, vault);
  const label = (_a = entry.alias) != null ? _a : key;
  const f = isFormula ? compileFormula(entry.formula || "x") || ((x) => x) : null;
  const get = () => view.note.num(key, 0);
  const addons = addonsFor(ctx);
  const slots = {};
  for (const a of addons) Object.assign(slots, a.fillSlots(ctx, { get, label }));
  const refs = view.buildCluster(ctx.head, ctx.flags, {
    get,
    display: fmtNum(get()),
    steppers: wantSteppers(kind, entry),
    min,
    max,
    float: isDecimal || isFormula,
    clamp: !!entry.clamp,
    commit: (v) => view.note.set(file, key, v),
    slots
  });
  if (entry.valueColor) refs.val.style.color = entry.valueColor;
  if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";
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
  let slider = null;
  if (entry.slider || isFormula) {
    slider = ctx.extra.createEl("input", { cls: "ep-slider" });
    slider.type = "range";
    slider.min = String(min);
    slider.max = String(max);
    slider.step = kind === "number" && !curve ? "1" : "any";
    slider.value = String(toPosition(get()));
    slider.addEventListener("input", () => {
      var _a2;
      const out = toValue(Number(slider.value));
      refs.val.setText(fmtNum(isDecimal || isFormula ? out : Math.round(out)));
      for (const a of addons) (_a2 = a.onPreview) == null ? void 0 : _a2.call(a, ctx, refs.cells, out);
    });
    slider.addEventListener("change", () => {
      let out = toValue(Number(slider.value));
      if (!isFormula && entry.clamp) out = clamp(out, min, max);
      view.note.set(file, key, isDecimal || isFormula ? out : Math.round(out));
    });
  }
  view.registerUpdater(() => {
    const v = view.note.num(key, 0);
    refs.val.setText(fmtNum(v));
    if (slider) slider.value = String(toPosition(v));
  });
}
function renderOptions(kind, octx) {
  var _a;
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  c.createEl("h4", { text: t("options.numberHeading") });
  new import_obsidian3.Setting(c).setName(t("options.showSlider")).addToggle((tg) => {
    tg.setValue(!!entry.slider).onChange((v) => {
      entry.slider = v || void 0;
      changed();
    });
  });
  if (kind === "number" || kind === "decimal") {
    new import_obsidian3.Setting(c).setName(t("options.showSteppers")).addToggle((tg) => {
      tg.setValue(entry.steppers !== false).onChange((v) => {
        entry.steppers = v ? void 0 : false;
        changed();
      });
    });
  }
  new import_obsidian3.Setting(c).setName(t("options.sliderCurve")).addDropdown((d) => {
    d.addOption("linear", t("options.curveLinear"));
    d.addOption("root", t("options.curveRoot"));
    d.addOption("exp", t("options.curveExp"));
    d.setValue(entry.sliderCurve || "linear");
    d.onChange((v) => {
      entry.sliderCurve = v === "linear" ? void 0 : v;
      changed();
    });
  });
  new import_obsidian3.Setting(c).setName(t("options.minimum")).setDesc(t("options.rangeAuto")).addText((tx) => {
    tx.setValue(entry.min !== void 0 ? String(entry.min) : "").onChange((v) => {
      const n = Number(v);
      entry.min = v.trim() === "" || !Number.isFinite(n) ? void 0 : n;
      changed();
    });
  });
  new import_obsidian3.Setting(c).setName(t("options.maximum")).setDesc(t("options.rangeAuto")).addText((tx) => {
    tx.setValue(entry.max !== void 0 ? String(entry.max) : "").onChange((v) => {
      const n = Number(v);
      entry.max = v.trim() === "" || !Number.isFinite(n) ? void 0 : n;
      changed();
    });
  });
  new import_obsidian3.Setting(c).setName(t("options.clamp")).addToggle((tg) => {
    tg.setValue(!!entry.clamp).onChange((v) => {
      entry.clamp = v || void 0;
      changed();
    });
  });
  if (kind === "formula") {
    new import_obsidian3.Setting(c).setName(t("options.formula")).setDesc(t("options.formulaDesc")).addText((tx) => {
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
    render: (ctx) => render(kind, ctx),
    clusterNeeds: (ref) => clusterNeeds(kind, ref),
    renderOptions: (octx) => renderOptions(kind, octx),
    menuItems: (menu, ref) => menuItems(kind, menu, ref)
  };
}
var numberType = makeNumericType("number", "type.number");
var decimalType = makeNumericType("decimal", "type.decimal");
var formulaType = makeNumericType("formula", "type.formula");

// src/ui/render/modifier-addon.ts
var import_obsidian5 = require("obsidian");

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
function rollPool(spec) {
  const faces = [];
  for (let i = 0; i < spec.count; i++) faces.push(1 + Math.floor(Math.random() * spec.sides));
  return { faces, total: faces.reduce((a, b) => a + b, 0) };
}
function isMaxPool(spec, pool) {
  return pool.faces.every((f) => f === spec.sides);
}
function isMinPool(pool) {
  return pool.faces.every((f) => f === 1);
}

// src/ui/render/dice-icons.ts
var import_obsidian4 = require("obsidian");
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
  for (const [id, svg] of Object.entries(DICE_ICONS)) (0, import_obsidian4.addIcon)(id, svg);
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
    if (i > 0) den.createSpan({ cls: "ep-denote-op", text: neg ? "\u2212" : "+" });
    else if (neg) den.createSpan({ cls: "ep-denote-op", text: "\u2212" });
    const srcKey = inf.source || entry.key || "";
    const term = den.createSpan({ cls: "ep-line-abbr ep-denote-term", text: abbrFor(view.settings, srcKey) });
    const modeName = inf.mode === "formula" ? (_a = inf.formula) != null ? _a : "x" : (_d = (_c = view.registries.derivations.get((_b = inf.mode) != null ? _b : "value")) == null ? void 0 : _c.name(view.i18n)) != null ? _d : "";
    let title = srcKey + (modeName ? ` \xB7 ${modeName}` : "") + (inf.toggle ? ` \xB7 ${inf.toggle}` : "");
    if (!influenceActive(view, entry, inf)) term.addClass("ep-denote-off");
    if (inf.toggle && file) {
      term.addClass("ep-denote-tog");
      title += ` \xB7 ${view.i18n.t("hint.dblToggle")}`;
      const flip = () => setInfluenceActive(view, file, entry, inf, !influenceActive(view, entry, inf));
      if (view.editMode) {
        term.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          flip();
        };
      } else {
        term.ondblclick = (ev) => {
          ev.stopPropagation();
          flip();
        };
      }
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
    (0, import_obsidian5.setIcon)(ic, diceIconId(spec.sides));
  }
  tag.createSpan({ text: formatDice(spec) });
}
function paintBadge(cell, ref) {
  cell.empty();
  if (ref.entry.showChain !== false) paintDenotation(cell, ref.view, ref.entry, ref.file);
  paintDice(cell, ref.entry);
  cell.appendText(fmtMod(modifierTotal(ref.view, ref.entry)));
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
  fillSlots(ctx) {
    const view = ctx.view;
    const e = ext(ctx.entry);
    const slots = {};
    const togs = togglable(ctx.entry);
    if (togs.length) {
      slots["tog"] = (cell) => {
        var _a, _b;
        for (const inf of togs) {
          const cb = cell.createEl("input");
          cb.type = "checkbox";
          cb.addClass("ep-prof");
          const sync = () => cb.checked = influenceActive(view, ctx.entry, inf);
          sync();
          const flip = () => setInfluenceActive(view, ctx.file, ctx.entry, inf, !influenceActive(view, ctx.entry, inf));
          if (view.editMode) {
            cb.setAttr("title", (_a = inf.toggle) != null ? _a : "");
            cb.onchange = flip;
          } else {
            cb.setAttr("title", `${(_b = inf.toggle) != null ? _b : ""} \u2014 ${view.i18n.t("hint.dblToggle")}`);
            cb.onclick = (ev) => ev.preventDefault();
            cb.ondblclick = flip;
          }
          view.registerUpdater(sync);
        }
      };
    }
    if (e.showMod && view.resolveType(ctx.entry) !== "derived") {
      slots["mod"] = (cell) => {
        paintBadge(cell, ctx);
        view.registerUpdater(() => paintBadge(cell, ctx));
      };
    }
    return slots;
  },
  /** Keep the badge live while a slider drags (only the self term reacts). */
  onPreview(ctx, cells, value) {
    const e = ext(ctx.entry);
    if (!e.showMod || !cells["mod"] || e.rollOverride !== void 0) return;
    const view = ctx.view;
    let total = 0;
    for (const inf of mods(ctx.entry)) {
      if (inf.source) {
        total += influenceTerm(view, ctx.entry, inf);
        continue;
      }
      if (!influenceActive(view, ctx.entry, inf)) continue;
      total += (inf.weight === -1 ? -1 : 1) * applyDerivation(view, inf, value);
    }
    const cell = cells["mod"];
    cell.empty();
    if (ctx.entry.showChain !== false) paintDenotation(cell, view, ctx.entry, ctx.file);
    paintDice(cell, ctx.entry);
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
    list.forEach((inf, idx) => {
      const srcKey = () => inf.source || entry.key || "";
      const head = new import_obsidian5.Setting(c).setName(t("mods.influence", { n: idx + 1 }));
      head.addText((tx) => {
        var _a;
        tx.setPlaceholder(t("mods.sourceSelf")).setValue((_a = inf.source) != null ? _a : "");
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
        d.setValue((_c = inf.mode) != null ? _c : "value");
        d.onChange((v) => {
          inf.mode = v === "value" ? void 0 : v;
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
      if (inf.mode === "formula") {
        new import_obsidian5.Setting(c).setName(t("mods.formula")).setDesc(t("options.formulaDesc")).setClass("ep-mods-sub").addText((tx) => {
          var _a;
          tx.setValue((_a = inf.formula) != null ? _a : "x").onChange((v) => {
            inf.formula = v.trim() || void 0;
            changed();
          });
        });
      }
      const sub = new import_obsidian5.Setting(c).setName(t("mods.termOptions")).setClass("ep-mods-sub");
      sub.addDropdown((d) => {
        d.addOption("1", t("mods.weightAdd"));
        d.addOption("-1", t("mods.weightSub"));
        d.setValue(inf.weight === -1 ? "-1" : "1");
        d.onChange((v) => {
          inf.weight = v === "-1" ? -1 : void 0;
          changed();
        });
      });
      sub.addText((tx) => {
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
      sub.addText((tx) => {
        tx.setPlaceholder(defaultAbbr(srcKey())).setValue(
          abbrFor(view.settings, srcKey()) === defaultAbbr(srcKey()) ? "" : abbrFor(view.settings, srcKey())
        );
        tx.inputEl.setAttr("aria-label", t("mods.abbr"));
        tx.inputEl.addClass("ep-abbr-input");
        tx.onChange((v) => {
          setAbbr(view.settings, srcKey(), v);
          changed();
        });
      });
      sub.setDesc(t("mods.termOptionsDesc"));
      if (inf.toggle) {
        new import_obsidian5.Setting(c).setName(t("mods.showToggle")).setDesc(t("mods.showToggleDesc", { list: inf.toggle })).setClass("ep-mods-sub").addToggle((tg) => {
          tg.setValue(!inf.hideToggle).onChange((v) => {
            inf.hideToggle = v ? void 0 : true;
            changed();
          });
        });
      }
      new import_obsidian5.Setting(c).setName(t("mods.showInChain")).setDesc(t("mods.showInChainDesc")).setClass("ep-mods-sub").addToggle((tg) => {
        tg.setValue(!inf.hideInChain).onChange((v) => {
          inf.hideInChain = v ? void 0 : true;
          changed();
        });
      });
    });
    new import_obsidian5.Setting(c).addButton(
      (b) => b.setButtonText(t("mods.addInfluence")).onClick(() => {
        e.mods = [...list, {}];
        changed();
        redraw();
      })
    );
    if (!isDerived) {
      new import_obsidian5.Setting(c).setName(t("mods.showBadge")).setDesc(t("mods.showBadgeDesc")).addToggle((tg) => {
        tg.setValue(!!e.showMod).onChange((v) => {
          e.showMod = v || void 0;
          changed();
        });
      });
    }
    new import_obsidian5.Setting(c).setName(t("mods.showChain")).setDesc(t("mods.showChainDesc")).addToggle((tg) => {
      tg.setValue(entry.showChain !== false).onChange((v) => {
        entry.showChain = v ? void 0 : false;
        changed();
      });
    });
    const isMulti = entry["__multi"] === true;
    if (isDerived && entry.key && !isMulti) {
      const key = entry.key;
      const on = hasNoteOverride(view, entry);
      const ov = new import_obsidian5.Setting(c).setName(t("mods.overrideNote")).setDesc(t("mods.overrideNoteDesc"));
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
      new import_obsidian5.Setting(c).setName(t("mods.override")).setDesc(t("mods.overrideDesc")).addText((tx) => {
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
  render(ctx) {
    const { view, entry } = ctx;
    const compute = () => modifierTotal(view, entry);
    const label = entry.alias || entry.key || "";
    const slots = {
      den: (cell) => {
        const paint = () => {
          cell.empty();
          if (entry.showChain !== false) paintDenotation(cell, view, entry, ctx.file);
          paintDice(cell, entry);
        };
        paint();
        view.registerUpdater(paint);
      }
    };
    for (const a of addonsFor(ctx)) Object.assign(slots, a.fillSlots(ctx, { get: compute, label }));
    const refs = view.buildCluster(ctx.head, ctx.flags, { display: fmtMod(compute()), slots });
    refs.val.addClass("ep-num-join");
    if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) refs.val.style.color = entry.valueColor;
    const sync = () => {
      refs.val.setText(fmtMod(compute()));
      refs.val.toggleClass("ep-overridden", hasNoteOverride(view, entry));
    };
    sync();
    view.bindOpen(
      refs.val,
      () => openNumberInput(refs.val, compute(), (v) => view.note.set(ctx.file, entry.key, v), {
        min: -9999,
        max: 9999,
        float: false,
        clamp: false,
        onEmpty: () => view.note.set(ctx.file, entry.key, void 0)
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

// src/ui/render/value-types/basic.ts
function isChecked(ctx, key) {
  const v = ctx.view.note.raw[key];
  return v === true || String(v).toLowerCase() === "true";
}
var checkboxType = {
  id: "checkbox",
  name: (i18n) => i18n.t("type.checkbox"),
  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueColor) v.style.color = entry.valueColor;
    const cb = v.createEl("input");
    cb.type = "checkbox";
    cb.addClass("ep-prof");
    cb.checked = isChecked(ctx, key);
    if (view.editMode) {
      cb.onchange = () => view.note.set(file, key, cb.checked);
    } else {
      cb.setAttr("title", view.i18n.t("hint.dblToggle"));
      cb.onclick = (e) => e.preventDefault();
      cb.ondblclick = () => view.note.set(file, key, !isChecked(ctx, key));
    }
    view.registerUpdater(() => {
      cb.checked = isChecked(ctx, key);
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
function buildList(ctx, holder, showAdd) {
  const { view, file, entry } = ctx;
  const key = entry.key;
  const current = view.note.list(key);
  const list = holder.createDiv({ cls: "ep-list" });
  for (const item of current) {
    const chip = list.createSpan({ cls: "ep-chip" });
    const cv = chip.createSpan();
    view.renderLinks(cv, item);
    const x = chip.createSpan({ cls: "ep-chip-x", text: "\xD7" });
    x.onclick = () => view.note.set(file, key, current.filter((i) => i !== item));
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
  render(ctx) {
    const { view, entry } = ctx;
    const holder = ctx.extra.createDiv({ cls: "ep-list-holder" });
    if (entry.valueSize) holder.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) holder.style.color = entry.valueColor;
    buildList(ctx, holder, view.editMode);
    view.registerUpdater(() => {
      holder.empty();
      buildList(ctx, holder, view.editMode);
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
  }
};
var colorType = {
  id: "color",
  name: (i18n) => i18n.t("type.color"),
  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueSize) v.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) v.style.color = entry.valueColor;
    const sw = v.createSpan({ cls: "ep-swatch" });
    const txt = v.createSpan({ cls: "ep-color-text" });
    const draw = () => {
      const hex = view.note.str(key);
      const ok = hexToRgb(hex);
      sw.style.background = ok ? hex : "transparent";
      sw.toggleClass("ep-swatch-empty", !ok);
      txt.setText(hex || "\u2014");
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
var import_obsidian7 = require("obsidian");

// src/ui/modals/image-viewer.ts
var import_obsidian6 = require("obsidian");
var ImageViewerModal = class extends import_obsidian6.Modal {
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
      img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
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
var imageType = {
  id: "image",
  name: (i18n) => i18n.t("type.image"),
  render(ctx) {
    var _a, _b;
    const { view, file, entry } = ctx;
    const key = entry.key;
    const holder = ctx.extra.createDiv({ cls: "ep-image" });
    const h = (_b = IMAGE_HEIGHTS[(_a = entry.size) != null ? _a : ""]) != null ? _b : 0;
    const draw = () => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      const src = view.note.str(key);
      if (src) {
        if (h) {
          holder.style.height = h + "px";
          holder.addClass("ep-image-fixed");
        } else {
          holder.style.removeProperty("height");
          holder.removeClass("ep-image-fixed");
        }
        const img = holder.createEl("img", { cls: "ep-image-img" });
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
    new import_obsidian7.Setting(c).setName(t("options.maxHeight")).addDropdown((d) => {
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
var iframeType = {
  id: "iframe",
  name: (i18n) => i18n.t("type.iframe"),
  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key;
    const holder = ctx.extra.createDiv({ cls: "ep-iframe-wrap" });
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
      holder.style.height = height + "px";
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
      const edit = ctx.extra.createDiv({ cls: "ep-iframe-edit" });
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
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.embedHeading") });
    new import_obsidian7.Setting(c).setName(t("options.embedHeight")).addText((tx) => {
      var _a;
      tx.setValue(String((_a = entry.iframeHeight) != null ? _a : 200)).onChange((v) => {
        const n = Number(v);
        entry.iframeHeight = Number.isFinite(n) && n > 0 ? n : void 0;
        changed();
      });
    });
    new import_obsidian7.Setting(c).setName(t("options.embedScale")).addSlider((sl) => {
      var _a;
      sl.setLimits(0.25, 2, 0.05).setValue((_a = entry.iframeScale) != null ? _a : 0.25).setDynamicTooltip().onChange((v) => {
        entry.iframeScale = v;
        changed();
      });
    });
  }
};

// src/ui/render/entry-kinds/core-kinds.ts
var import_obsidian8 = require("obsidian");

// src/core/layout-ops.ts
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
  render(ctx) {
    var _a;
    const { view, entry } = ctx;
    view.renderLabel(ctx.head, ctx);
    const type = view.resolveType(entry);
    const def = (_a = view.registries.valueTypes.get(type)) != null ? _a : view.registries.valueTypes.get("text");
    def == null ? void 0 : def.render(ctx);
  }
};
var blankKind = {
  id: "blank",
  bare: true,
  defaultLabel: (i18n) => i18n.t("kind.blank"),
  render(ctx) {
    const { view, section, entry, wrap } = ctx;
    if (!view.editMode) return;
    const t = view.i18n.t.bind(view.i18n);
    const grip = wrap.createSpan({ cls: "ep-grip", text: "\u283F" });
    grip.setAttr("title", t("blank.dragHint"));
    const openMenu = (ce) => {
      ce.preventDefault();
      ce.stopPropagation();
      const m = new import_obsidian8.Menu();
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
    const mb = wrap.createSpan({ cls: "ep-menu-btn", text: "\u22EF" });
    mb.onclick = openMenu;
    wrap.addEventListener("contextmenu", openMenu);
    wrap.onclick = () => view.openAddMenu(wrap, section, { replaceId: entry.id });
  }
};
var tocKind = {
  id: "toc",
  addable: true,
  defaultLabel: (i18n) => i18n.t("kind.toc"),
  render(ctx) {
    const { view } = ctx;
    view.renderLabel(ctx.head, ctx);
    const list = ctx.extra.createDiv({ cls: "ep-toc" });
    list.setAttr("title", view.i18n.t("toc.hint"));
    for (const s of view.layout.sections) {
      const row = list.createDiv({ cls: "ep-toc-row" });
      if (s.icon) {
        const ic = row.createSpan({ cls: "ep-picon" });
        (0, import_obsidian8.setIcon)(ic, s.icon);
      }
      row.createSpan({ text: s.title || view.i18n.t("section.untitled") });
      row.onclick = () => view.scrollToSection(s.id);
    }
  }
};

// src/ui/render/value-types/index.ts
function registerCore(ctx) {
  const r = ctx.registries;
  r.valueTypes.add(textType);
  r.valueTypes.add(numberType);
  r.valueTypes.add(decimalType);
  r.valueTypes.add(derivedType);
  r.valueTypes.add(listType);
  r.valueTypes.add(checkboxType);
  r.valueTypes.add(colorType);
  r.valueTypes.add(formulaType);
  r.valueTypes.add(imageType);
  r.valueTypes.add(iframeType);
  r.entryKinds.add(propKind);
  r.entryKinds.add(blankKind);
  r.entryKinds.add(tocKind);
  r.clusterAddons.add(modifierAddon);
  r.derivations.add({ id: "value", name: (i18n) => i18n.t("derive.value"), apply: (x) => x });
  r.layoutPresets.add({
    id: "empty",
    name: (i18n) => i18n.t("preset.empty"),
    build: () => ({ version: LAYOUT_VERSION, sections: [] })
  });
}

// src/ui/view.ts
var import_obsidian19 = require("obsidian");

// src/core/note-model.ts
var import_obsidian9 = require("obsidian");
var ECHO_WINDOW_MS = 600;
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
  }
  // -- loading ---------------------------------------------------------
  /** Load `raw` from the metadata cache for `file`. */
  load(file) {
    var _a;
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
   * Set one property and persist it.
   * @param full re-render instead of in-place value refresh
   */
  set(file, key, value, full = false) {
    this.recordUndo(file, key);
    if (value === void 0) delete this.raw[key];
    else this.raw[key] = value;
    if (full) this.host.onFullChange();
    else this.host.onLightChange();
    this.persist(file, key);
  }
  /** Set several properties at once (single frontmatter write, full re-render). */
  setMany(file, entries) {
    for (const key of Object.keys(entries)) this.recordUndo(file, key);
    Object.assign(this.raw, entries);
    this.host.onFullChange();
    this.stampWrite(file);
    this.app.fileManager.processFrontMatter(file, (fm) => {
      for (const k of Object.keys(entries)) fm[k] = this.raw[k];
    }).then(() => this.lastWriteTime = Date.now()).catch((err) => new import_obsidian9.Notice(this.i18n.t("notice.saveFailed", { error: String(err) })));
  }
  persist(file, key) {
    this.stampWrite(file);
    this.app.fileManager.processFrontMatter(file, (fm) => {
      const cur = this.raw[key];
      if (cur === void 0) delete fm[key];
      else fm[key] = cur;
    }).then(() => this.lastWriteTime = Date.now()).catch((err) => new import_obsidian9.Notice(this.i18n.t("notice.saveFailed", { error: String(err) })));
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
  /** Write all captured original values back to their files. */
  revertUndo() {
    const byFile = /* @__PURE__ */ new Map();
    for (const { path, key, old } of this.undo.values()) {
      if (!byFile.has(path)) byFile.set(path, []);
      byFile.get(path).push({ key, old });
    }
    for (const [path, changes] of byFile) {
      const f = this.app.vault.getAbstractFileByPath(path);
      if (f instanceof import_obsidian9.TFile) {
        this.app.fileManager.processFrontMatter(f, (fm) => {
          for (const { key, old } of changes) {
            if (old === void 0) delete fm[key];
            else fm[key] = old;
          }
        });
      }
    }
  }
};

// src/ui/render/section-renderer.ts
var import_obsidian18 = require("obsidian");

// src/ui/render/entry-renderer.ts
var import_obsidian11 = require("obsidian");

// src/ui/menus/entry-menu.ts
var import_obsidian10 = require("obsidian");
function openEntryMenu(e, view, file, section, entry) {
  var _a, _b;
  const t = view.i18n.t.bind(view.i18n);
  const menu = new import_obsidian10.Menu();
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
  if (entry.kind !== "prop" || view.editMode) return false;
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
  if (kind == null ? void 0 : kind.bare) {
    const wrap2 = grid.createDiv({ cls: "ep-entry ep-blank" });
    wrap2.setAttr("data-ep-id", "e:" + entry.id);
    const ctx2 = { view, file, section, entry, head: wrap2, extra: wrap2, flags, wrap: wrap2 };
    kind.render(ctx2);
    if (view.editMode) {
      const grip2 = wrap2.querySelector(".ep-grip");
      if (grip2) drag.attachEntry(wrap2, grip2, section, entry);
    }
    return;
  }
  const wide = isWide(view, entry);
  const wrap = grid.createDiv({ cls: wide ? "ep-entry ep-entry-block" : "ep-entry" });
  wrap.setAttr("data-ep-id", "e:" + entry.id);
  if (wide) wrap.style.gridColumn = "1 / -1";
  const head = wrap.createDiv({ cls: "ep-entry-head" });
  let grip = null;
  if (view.editMode) {
    grip = head.createSpan({ cls: "ep-grip", text: "\u283F" });
    grip.setAttr("title", view.i18n.t("entry.dragHint"));
  }
  if (entry.icon) {
    const ic = head.createSpan({ cls: "ep-picon" });
    (0, import_obsidian11.setIcon)(ic, entry.icon);
    if (entry.iconColor) ic.style.color = entry.iconColor;
  }
  const extra = wrap.createDiv({ cls: "ep-entry-extra" });
  const ctx = { view, file, section, entry, head, extra, flags, wrap };
  if (kind) {
    kind.render(ctx);
  } else {
    view.renderLabel(head, ctx);
    const v = head.createDiv({ cls: "ep-val-right" });
    v.createSpan({ cls: "ep-placeholder", text: view.i18n.t("entry.unknownKind", { kind: entry.kind }) });
  }
  wrap.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openEntryMenu(e, view, file, section, entry);
  });
  if (view.editMode) {
    const menuBtn = head.createSpan({ cls: "ep-menu-btn", text: "\u22EF" });
    menuBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEntryMenu(e, view, file, section, entry);
    };
    if (grip) drag.attachEntry(wrap, grip, section, entry);
  }
}

// src/ui/menus/section-menu.ts
var import_obsidian17 = require("obsidian");

// src/ui/modals/section-options.ts
var import_obsidian16 = require("obsidian");

// src/ui/components/setting-helpers.ts
var import_obsidian14 = require("obsidian");

// src/ui/modals/color-picker.ts
var import_obsidian12 = require("obsidian");
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
var ColorPickerModal = class extends import_obsidian12.Modal {
  constructor(host, initial, onSubmit) {
    var _a;
    super(host.app);
    this.host = host;
    this.onSubmit = onSubmit;
    this.rgb = (_a = hexToRgb(initial)) != null ? _a : { r: 136, g: 136, b: 136 };
    this.space = host.getColorSpace();
  }
  onOpen() {
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
      (0, import_obsidian12.setIcon)(ed, "pipette");
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
    new import_obsidian12.Setting(contentEl).addButton((b) => b.setButtonText(t("common.cancel")).onClick(() => this.close())).addButton(
      (b) => b.setButtonText(t("common.save")).setCta().onClick(() => {
        this.onSubmit(rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b));
        this.close();
      })
    );
  }
  updatePreviewHex() {
    const hex = rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
    this.preview.style.background = hex;
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
      thumb.style.left = clamp(t, 0, 1) * 100 + "%";
    };
    const update = () => {
      track.style.background = grad();
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
  /** A 2D canvas field (e.g. saturation × lightness) with a draggable cursor. */
  buildField(parent, colorAt, getXY, setXY) {
    const wrap = parent.createDiv({ cls: "ep-cp-field-wrap" });
    const canvas = wrap.createEl("canvas");
    canvas.width = 200;
    canvas.height = 170;
    canvas.addClass("ep-cp-field");
    const cursor = wrap.createDiv({ cls: "ep-cp-cursor" });
    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      const img = ctx.createImageData(w, h);
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
      ctx.putImageData(img, 0, 0);
    };
    const place = () => {
      const [x, y] = getXY();
      cursor.style.left = x * 100 + "%";
      cursor.style.top = y * 100 + "%";
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
      this.body.style.height = this.lastBodyH + "px";
      void this.body.offsetWidth;
      this.body.style.height = newH + "px";
      const done = () => {
        this.body.style.height = "auto";
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
var import_obsidian13 = require("obsidian");
var IconPickerModal = class extends import_obsidian13.Modal {
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
    search.style.width = "100%";
    const grid = c.createDiv({ cls: "ep-iconpick-grid" });
    let all = [];
    try {
      all = (0, import_obsidian13.getIconIds)();
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
        (0, import_obsidian13.setIcon)(cell, id);
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
function addColorSetting(host, container, name, desc, get, set) {
  const setting = new import_obsidian14.Setting(container).setName(name);
  if (desc) setting.setDesc(desc);
  const sw = setting.controlEl.createSpan({ cls: "ep-swatch" });
  const update = () => {
    const h = get();
    const ok = h && hexToRgb(h);
    sw.style.background = ok ? h : "transparent";
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
  const setting = new import_obsidian14.Setting(container).setName(name).setDesc(i18n.t("options.iconDesc"));
  const prev = setting.controlEl.createSpan({ cls: "ep-icon-prev" });
  const update = () => {
    prev.empty();
    const ic = get();
    if (ic) (0, import_obsidian14.setIcon)(prev, ic);
    else prev.setText("\u2014");
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

// src/ui/modals/entry-options.ts
var import_obsidian15 = require("obsidian");
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
function renderEntryOptionsBody(octx, onDone, onRemoved, opts = {}) {
  var _a, _b, _c, _d;
  const { view, section, entry: e, container: c, changed, redraw } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const isProp = e.kind === "prop";
  if (!opts.multi) {
    c.createEl("h4", { text: isProp ? t("options.propertyHeading") : t("options.objectHeading") });
    if (isProp) {
      new import_obsidian15.Setting(c).setName(t("options.property")).setDesc(t("options.propertyDesc")).addText((tx) => {
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
    new import_obsidian15.Setting(c).setName(t("options.label")).setDesc(t("options.labelDesc", { default: view.defaultLabelFor(e) })).addText((tx) => {
      var _a2;
      tx.setPlaceholder(view.defaultLabelFor(e)).setValue((_a2 = e.alias) != null ? _a2 : "").onChange((v) => {
        e.alias = v.trim() || void 0;
        changed();
      });
    });
  }
  if (isProp) {
    c.createEl("h4", { text: t("options.typeHeading") });
    const cur = view.resolveType(e);
    new import_obsidian15.Setting(c).setName(t("options.dataType")).setDesc(t("options.dataTypeDesc")).addDropdown((d) => {
      for (const def of view.registries.valueTypes.all()) d.addOption(def.id, def.name(view.i18n));
      d.setValue(cur);
      d.onChange((v) => {
        e.dataType = v;
        changed();
        redraw();
      });
    });
    (_b = (_a = view.registries.valueTypes.get(cur)) == null ? void 0 : _a.renderOptions) == null ? void 0 : _b.call(_a, octx);
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
  new import_obsidian15.Setting(c).setName(t("options.showLabel")).setDesc(t("options.showLabelDesc")).addToggle((tg) => {
    tg.setValue(!e.hideLabel).onChange((v) => {
      e.hideLabel = v ? void 0 : true;
      changed();
    });
  });
  if (isProp) {
    new import_obsidian15.Setting(c).setName(t("options.showType")).setDesc(t("options.showTypeDesc")).addToggle((tg) => {
      tg.setValue(e.showType !== false).onChange((v) => {
        e.showType = v ? void 0 : false;
        changed();
      });
    });
  }
  new import_obsidian15.Setting(c).setName(t("options.showWhenEmpty")).setDesc(t("options.showWhenEmptyDesc")).addToggle((tg) => {
    tg.setValue(e.hideIfEmpty === false).onChange((v) => {
      e.hideIfEmpty = v ? false : void 0;
      changed();
    });
  });
  new import_obsidian15.Setting(c).setName(t("options.labelSize")).setDesc(t("options.sizeDesc")).addSlider((sl) => {
    var _a2;
    sl.setLimits(0, 40, 1).setValue((_a2 = e.labelSize) != null ? _a2 : 0).setDynamicTooltip().onChange((v) => {
      e.labelSize = v || void 0;
      changed();
    });
  });
  new import_obsidian15.Setting(c).setName(t("options.valueSize")).setDesc(t("options.sizeDesc")).addSlider((sl) => {
    var _a2;
    sl.setLimits(0, 40, 1).setValue((_a2 = e.valueSize) != null ? _a2 : 0).setDynamicTooltip().onChange((v) => {
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
    new import_obsidian15.Setting(c).setName(t("options.showInObsidian")).setDesc(t("options.showInObsidianDesc")).addToggle((tg) => {
      tg.setValue(!!e.showInObsidian).onChange((v) => {
        e.showInObsidian = v || void 0;
        changed();
      });
    });
  }
  if (!opts.multi) {
    c.createEl("h4", { text: t("options.placementHeading") });
    new import_obsidian15.Setting(c).addButton(
      (b) => b.setButtonText(t("entry.menu.remove")).setWarning().onClick(() => {
        view.removeEntry(section, e);
        onRemoved();
      })
    );
  }
  new import_obsidian15.Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => onDone()));
}

// src/ui/modals/section-options.ts
var SECTION_TAB = "::section";
var NUMERIC_SET = /* @__PURE__ */ new Set(["number", "decimal"]);
var MODIFIABLE_SET = /* @__PURE__ */ new Set(["number", "decimal", "formula", "derived"]);
var SectionOptionsModal = class extends import_obsidian16.Modal {
  /** @param initialTab entry id whose tab opens pre-selected. */
  constructor(view, section, initialTab) {
    super(view.app);
    this.view = view;
    this.section = section;
    this.snapshot = "";
    this.selected = /* @__PURE__ */ new Set([SECTION_TAB]);
    this.file = null;
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
        document.addEventListener(
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
   * across the selection are listed in the note on top — changing one
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
      new import_obsidian16.Setting(c).setName(t("options.showLabel")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => x["hideLabel"] = v ? void 0 : true));
      });
    }
    {
      const s = read((x) => x["hideIfEmpty"] === false);
      new import_obsidian16.Setting(c).setName(t("options.showWhenEmpty")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
        tg.setValue(s.v).onChange((v) => apply((x) => x["hideIfEmpty"] = v ? false : void 0));
      });
    }
    if (!withSection) {
      const sizeRow = (nameKey, field) => {
        const s = read((x) => {
          var _a;
          return (_a = x[field]) != null ? _a : 0;
        });
        new import_obsidian16.Setting(c).setName(t(nameKey)).setDesc(s.mixed ? t("options.mixed") : t("options.sizeDesc")).addSlider((sl) => {
          sl.setLimits(0, 40, 1).setValue(s.v).setDynamicTooltip().onChange((v) => apply((x) => x[field] = v || void 0));
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
        new import_obsidian16.Setting(c).setName(t("options.showInObsidian")).setDesc(mixedDesc(s.mixed)).addToggle((tg) => {
          tg.setValue(s.v).onChange((v) => apply((x) => x["showInObsidian"] = v || void 0));
        });
        {
          const ty = read((x) => x["showType"] !== false);
          new import_obsidian16.Setting(c).setName(t("options.showType")).setDesc(mixedDesc(ty.mixed)).addToggle((tg) => {
            tg.setValue(ty.v).onChange((v) => apply((x) => x["showType"] = v ? void 0 : false));
          });
        }
        const types = ents.map((e) => view.resolveType(e));
        if (types.every((ty) => NUMERIC_SET.has(ty))) {
          c.createEl("h4", { text: t("options.numberHeading") });
          const sl = read((x) => !!x["slider"]);
          new import_obsidian16.Setting(c).setName(t("options.showSlider")).setDesc(mixedDesc(sl.mixed)).addToggle((tg) => {
            tg.setValue(sl.v).onChange((v) => apply((x) => x["slider"] = v || void 0));
          });
          const st = read((x) => x["steppers"] !== false);
          new import_obsidian16.Setting(c).setName(t("options.showSteppers")).setDesc(mixedDesc(st.mixed)).addToggle((tg) => {
            tg.setValue(st.v).onChange((v) => apply((x) => x["steppers"] = v ? void 0 : false));
          });
          const cu = read((x) => x["sliderCurve"] || "linear");
          new import_obsidian16.Setting(c).setName(t("options.sliderCurve")).setDesc(mixedDesc(cu.mixed)).addDropdown((d) => {
            d.addOption("linear", t("options.curveLinear"));
            d.addOption("root", t("options.curveRoot"));
            d.addOption("exp", t("options.curveExp"));
            d.setValue(cu.v);
            d.onChange((v) => apply((x) => x["sliderCurve"] = v === "linear" ? void 0 : v));
          });
          const numRow = (nameKey, field) => {
            const s2 = read((x) => x[field]);
            new import_obsidian16.Setting(c).setName(t(nameKey)).setDesc(s2.mixed ? t("options.mixed") : t("options.rangeAuto")).addText((tx) => {
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
          new import_obsidian16.Setting(c).setName(t("options.clamp")).setDesc(mixedDesc(cl.mixed)).addToggle((tg) => {
            tg.setValue(cl.v).onChange((v) => apply((x) => x["clamp"] = v || void 0));
          });
        }
        if (types.every((ty) => MODIFIABLE_SET.has(ty))) {
          const ro = read((x) => !!x["roll"]);
          new import_obsidian16.Setting(c).setName(t("roll.options.rollButton")).setDesc(mixedDesc(ro.mixed)).addToggle((tg) => {
            tg.setValue(ro.v).onChange((v) => apply((x) => x["roll"] = v || void 0));
          });
          const ch = read((x) => x["showChain"] !== false);
          new import_obsidian16.Setting(c).setName(t("mods.showChain")).setDesc(mixedDesc(ch.mixed)).addToggle((tg) => {
            tg.setValue(ch.v).onChange((v) => apply((x) => x["showChain"] = v ? void 0 : false));
          });
          const di = read((x) => x["showDice"] !== false);
          new import_obsidian16.Setting(c).setName(t("mods.showDice")).setDesc(mixedDesc(di.mixed)).addToggle((tg) => {
            tg.setValue(di.v).onChange((v) => apply((x) => x["showDice"] = v ? void 0 : false));
          });
        }
      }
    }
    new import_obsidian16.Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
  }
  // -- the section's own tab ---------------------------------------------------
  drawSectionBody(c) {
    const s = this.section;
    const t = this.view.i18n.t.bind(this.view.i18n);
    const host = viewColorHost(this.view);
    c.createEl("h4", { text: t("sectionOptions.sectionHeading") });
    new import_obsidian16.Setting(c).setName(t("sectionOptions.name")).setDesc(t("sectionOptions.nameDesc")).addText((tx) => {
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
    new import_obsidian16.Setting(c).setName(t("options.showLabel")).addToggle((tg) => {
      tg.setValue(!s.hideLabel).onChange((v) => {
        s.hideLabel = v ? void 0 : true;
        this.changed();
      });
    });
    new import_obsidian16.Setting(c).setName(t("sectionOptions.collapsible")).addToggle((tg) => {
      tg.setValue(s.collapsible !== false).onChange((v) => {
        s.collapsible = v;
        if (!v) s.collapsed = false;
        this.changed();
      });
    });
    new import_obsidian16.Setting(c).setName(t("sectionOptions.dividers")).addToggle((tg) => {
      tg.setValue(!!s.dividers).onChange((v) => {
        s.dividers = v || void 0;
        this.changed();
      });
    });
    new import_obsidian16.Setting(c).setName(t("sectionOptions.vdividers")).addToggle((tg) => {
      tg.setValue(!!s.vdividers).onChange((v) => {
        s.vdividers = v || void 0;
        this.changed();
      });
    });
    new import_obsidian16.Setting(c).setName(t("options.showWhenEmpty")).setDesc(t("sectionOptions.showWhenEmptyDesc")).addToggle((tg) => {
      tg.setValue(s.hideIfEmpty === false).onChange((v) => {
        s.hideIfEmpty = v ? false : void 0;
        this.changed();
      });
    });
    c.createEl("h4", { text: t("sectionOptions.layoutHeading") });
    const mode = sectionMode(s);
    new import_obsidian16.Setting(c).setName(t("sectionOptions.layout")).setDesc(t("sectionOptions.layoutDesc")).addDropdown((d) => {
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
    const colSet = new import_obsidian16.Setting(c).setName(t("sectionOptions.columns"));
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
    const rowSet = new import_obsidian16.Setting(c).setName(t("sectionOptions.rows")).setDesc(t("sectionOptions.rowsDesc"));
    rowSet.addText((tx) => {
      tx.setDisabled(mode !== "grid");
      tx.setValue(String(s.rows || 0)).onChange((v) => {
        const n = parseInt(v);
        s.rows = Number.isFinite(n) && n > 0 ? n : void 0;
        this.changed();
      });
    });
    if (mode !== "grid") rowSet.settingEl.addClass("ep-disabled");
    new import_obsidian16.Setting(c).setName(t("sectionOptions.transparent")).addToggle((tg) => {
      tg.setValue(!!s.transparent).onChange((v) => {
        s.transparent = v || void 0;
        this.changed();
      });
    });
    new import_obsidian16.Setting(c).setName(t("sectionOptions.sticky")).addToggle((tg) => {
      tg.setValue(!!s.sticky).onChange((v) => {
        s.sticky = v || void 0;
        this.changed();
      });
    });
    new import_obsidian16.Setting(c).setName(t("sectionOptions.height")).setDesc(t("sectionOptions.heightDesc")).addDropdown((d) => {
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
    new import_obsidian16.Setting(c).setName(t("sectionOptions.titleSize")).setDesc(t("options.sizeDesc")).addSlider((sl) => {
      var _a;
      sl.setLimits(0, 48, 1).setValue((_a = s.titleSize) != null ? _a : 0).setDynamicTooltip().onChange((v) => {
        s.titleSize = v || void 0;
        this.changed();
      });
    });
    new import_obsidian16.Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
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
  requestAnimationFrame(() => {
    view.containerEl.findAll("[data-ep-id]").forEach((el) => {
      const id = el.getAttribute("data-ep-id");
      const f = id ? first.get(id) : void 0;
      if (!f) return;
      const n = el.getBoundingClientRect();
      const dx = f.left - n.left, dy = f.top - n.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const h = el;
      h.style.transition = "none";
      h.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        h.style.transition = "transform .25s ease";
        h.style.transform = "";
        const done = () => {
          h.style.transition = "";
          h.style.transform = "";
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
      const under = document.elementFromPoint(e.clientX, e.clientY);
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
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
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
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
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
    const clone = wrap.cloneNode(true);
    clone.addClass("ep-drag-clone");
    clone.style.position = "fixed";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.width = rect.width + "px";
    clone.style.margin = "0";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "9999";
    document.body.appendChild(clone);
    const moveClone = (cx, cy) => {
      clone.style.transform = `translate(${cx - ox}px, ${cy - oy}px)`;
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
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform .18s ease";
          el.style.transform = "";
          const done = () => {
            el.style.transition = "";
            el.removeEventListener("transitionend", done);
          };
          el.addEventListener("transitionend", done);
        });
      });
    };
    const onMove = (e) => {
      moveClone(e.clientX, e.clientY);
      const under = document.elementFromPoint(e.clientX, e.clientY);
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
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      clone.remove();
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
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
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
  const menu = new import_obsidian17.Menu();
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
        const m2 = new import_obsidian17.Menu();
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
function alignClustersNow(det) {
  var _a;
  const groups = /* @__PURE__ */ new Map();
  for (const el of det.findAll(".ep-cluster [data-ep-slot]")) {
    const id = (_a = el.getAttribute("data-ep-slot")) != null ? _a : "";
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(el);
  }
  groups.set(" num", det.findAll(".ep-cluster .ep-num"));
  for (const els of groups.values()) {
    if (els.length < 2) continue;
    let max = 0;
    for (const el of els) {
      el.style.minWidth = "";
      max = Math.max(max, el.offsetWidth);
    }
    if (max <= 0) continue;
    for (const el of els) el.style.minWidth = max + "px";
  }
}
function alignClusters(det) {
  requestAnimationFrame(() => alignClustersNow(det));
}
function renderSection(parent, view, file, section, drag, host) {
  var _a;
  const t = view.i18n.t.bind(view.i18n);
  if (!view.editMode && section.hideIfEmpty !== false) {
    const hasContent = section.entries.some((e) => !isHiddenEntry(view, e));
    if (!hasContent) return;
  }
  const det = parent.createDiv({ cls: "ep-section" });
  host.registerSectionEl(section.id, det);
  det.setAttr("data-ep-id", "s:" + section.id);
  if (!section.sticky) det.addClass("ep-flow-section");
  if (section.transparent) det.addClass("ep-transparent");
  if (section.accent) det.style.setProperty("--ep-accent", section.accent);
  if (section.controlColor) det.style.setProperty("--ep-control", section.controlColor);
  det.style.setProperty(
    "--ep-title-bg",
    section.transparent ? "var(--background-primary)" : section.bg || "var(--background-secondary)"
  );
  if (section.bg && !section.transparent) det.style.background = section.bg;
  const collapsible = section.collapsible !== false;
  const sum = det.createDiv({ cls: "ep-section-title" });
  if (collapsible) {
    const chev = sum.createSpan({ cls: "ep-chev" });
    (0, import_obsidian18.setIcon)(chev, "chevron-right");
    chev.toggleClass("ep-open", !section.collapsed);
  }
  if (view.editMode) {
    const grip = sum.createSpan({ cls: "ep-grip", text: "\u283F" });
    grip.setAttr("title", t("section.dragHint"));
    grip.onclick = (e) => e.stopPropagation();
  }
  if (section.icon) {
    const ic = sum.createSpan({ cls: "ep-ticon" });
    (0, import_obsidian18.setIcon)(ic, section.icon);
    if (section.iconColor) ic.style.color = section.iconColor;
  }
  const showLabel = view.editMode || !section.hideLabel;
  if (showLabel) {
    const titleSpan = sum.createSpan({ cls: "ep-sec-name" });
    if (section.titleSize) titleSpan.style.fontSize = section.titleSize + "px";
    if (section.accent) titleSpan.style.color = section.accent;
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
    (0, import_obsidian18.setIcon)(modeBtn, cmode === "grid" ? "layout-grid" : cmode === "columns" ? "columns" : "list");
    modeBtn.setAttr("title", t("section.layoutHint", { mode: t("layout." + cmode) }));
    modeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const order = ["list", "columns", "grid"];
      section.layoutMode = order[(order.indexOf(cmode) + 1) % 3];
      view.saveLayout();
      view.rerender();
    };
    const pinBtn = sum.createSpan({ cls: "ep-icon-btn" });
    (0, import_obsidian18.setIcon)(pinBtn, "pin");
    pinBtn.setAttr("title", section.sticky ? t("section.unpinHint") : t("section.pinHint"));
    if (section.sticky) pinBtn.addClass("is-active");
    pinBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      section.sticky = !section.sticky;
      view.saveLayout();
      view.rerender();
    };
    const menuBtn = sum.createSpan({ cls: "ep-menu-btn", text: "\u22EF" });
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
  if (section.dividers) grid.addClass("ep-dividers");
  if (section.vdividers) grid.addClass("ep-vdividers");
  if (section.size && section.size !== "unlimited") {
    const rows = (_a = SIZE_ROWS[section.size]) != null ? _a : 12;
    grid.style.maxHeight = rows * ROW_PX + "px";
    grid.style.overflowY = "auto";
  }
  if (mode === "list") {
    for (const entry of section.entries) renderEntry(grid, view, file, section, entry, flags, drag);
    if (view.editMode) {
      const add = body.createDiv({ cls: "ep-add" });
      const ab = add.createEl("button", { cls: "ep-add-input ep-addbtn", text: t("entry.addProperty") });
      ab.onclick = () => view.openAddMenu(ab, section);
    }
  } else if (mode === "columns") {
    grid.style.gridTemplateColumns = `repeat(${ncol}, minmax(0, 1fr))`;
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
    grid.style.gridTemplateColumns = `repeat(${ncol}, minmax(0, 1fr))`;
    if (section.rows && section.rows > 0) grid.style.gridTemplateRows = `repeat(${section.rows}, auto)`;
    for (const entry of section.entries) {
      if (isHiddenEntry(view, entry)) grid.createDiv({ cls: "ep-empty-cell" });
      else renderEntry(grid, view, file, section, entry, flags, drag);
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
          const m = new import_obsidian18.Menu();
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
    collapseWrap.style.overflow = "hidden";
    if (section.collapsed) collapseWrap.style.height = "0px";
    sum.onclick = () => toggleSection(view, section, det, collapseWrap, host);
  }
}
function toggleSection(view, section, det, wrap, host) {
  section.collapsed = !section.collapsed;
  view.saveLayout();
  const chev = det.querySelector(".ep-chev");
  if (chev) chev.toggleClass("ep-open", !section.collapsed);
  if (section.collapsed) {
    const h = wrap.scrollHeight;
    wrap.style.height = h + "px";
    requestAnimationFrame(() => {
      wrap.style.height = "0px";
    });
  } else {
    wrap.style.height = "0px";
    const target = wrap.scrollHeight;
    requestAnimationFrame(() => {
      wrap.style.height = target + "px";
    });
    const done = () => {
      wrap.style.height = "auto";
      wrap.removeEventListener("transitionend", done);
    };
    wrap.addEventListener("transitionend", done);
  }
  requestAnimationFrame(() => host.reflowSticky());
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
  requestAnimationFrame(() => {
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
      (0, import_obsidian18.setIcon)(sp, icon);
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
        ).style.left = off + x + "px";
      });
      if (spans.length > 1)
        spans.forEach(([a, b], i) => {
          mkBtn(
            colRail,
            "ep-rmbar",
            "minus",
            t("grid.removeColumnHint"),
            () => commit2(() => removeColumnAt(section, i, isGrid))
          ).style.left = off + (a + b) / 2 + "px";
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
        ).style.top = off + y + "px";
      });
      spans.forEach(([a, b], i) => {
        mkBtn(
          rowRail,
          "ep-rmbar",
          "minus",
          t("grid.removeRowHint"),
          () => commit2(() => removeRowAt(section, i))
        ).style.top = off + (a + b) / 2 + "px";
      });
    }
  });
}

// src/ui/components/popups.ts
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
    if (leftPx + w > window.innerWidth - 4) pop.style.left = Math.max(4, anchorLeft - w - 4) + "px";
    const h = pop.offsetHeight;
    const top = parseFloat(pop.style.top || "0");
    if (top + h > window.innerHeight - 4) pop.style.top = Math.max(4, window.innerHeight - h - 4) + "px";
  }
  /** Dismiss when clicking outside the popups and their anchor. */
  dismissOnOutsideClick(anchor) {
    const h = (e) => {
      const t = e.target;
      if (this.popups.some((p) => p.contains(t)) || anchor.contains(t)) return;
      this.closeAll();
      document.removeEventListener("mousedown", h);
    };
    window.setTimeout(() => document.addEventListener("mousedown", h), 0);
  }
  // -- add-property menu --------------------------------------------------
  /** Candidates grouped for the add menu. */
  addCandidates() {
    const view = this.view;
    const shown = /* @__PURE__ */ new Set();
    for (const sec of view.layout.sections)
      for (const e of sec.entries) if (e.kind === "prop" && e.key) shown.add(e.key.toLowerCase());
    const all = /* @__PURE__ */ new Set([
      ...Object.keys(view.note.raw).filter((k) => k.toLowerCase() !== "position"),
      ...view.props.knownProps()
    ]);
    const onNote = [], onSidebar = [], others = [];
    for (const k of all) {
      if (view.note.raw[k] !== void 0) onNote.push({ key: k });
      else if (shown.has(k.toLowerCase())) onSidebar.push({ key: k });
      else others.push({ key: k });
    }
    const srt = (a) => a.sort((x, y) => x.key.localeCompare(y.key));
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
    const isList = Array.isArray(value);
    const entry = { id: genId(), kind: "prop", key, dataType: isList ? "list" : view.deriveType(key) };
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
    if (value !== void 0) view.note.set(file, key, value, true);
    else view.rerender();
  }
  /** Open the add-property popup anchored below `anchor`. */
  openAddMenu(anchor, file, section, target) {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    this.closeAll();
    const pop = document.body.createDiv({ cls: "ep-popup ep-addmenu" });
    this.popups.push(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = r.left + "px";
    pop.style.top = r.bottom + 2 + "px";
    pop.style.minWidth = "220px";
    const fit = () => {
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      let left = r.left;
      let top = r.bottom + 2;
      if (left + w > window.innerWidth - 4) left = Math.max(4, window.innerWidth - w - 4);
      if (top + h > window.innerHeight - 4) top = r.top - h - 2;
      if (top < 4) top = Math.max(4, Math.min(r.bottom + 2, window.innerHeight - h - 4));
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    };
    const search = pop.createEl("input", { cls: "ep-edit-input ep-addsearch" });
    search.type = "text";
    search.placeholder = t("add.searchPlaceholder", { section: section.title });
    const listEl = pop.createDiv({ cls: "ep-addlist" });
    const groups = this.addCandidates();
    const render2 = () => {
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
          if (isList) {
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
        for (const c of f.slice(0, 60)) addRow(c);
      };
      if (q && !this.allKeys().some((k) => k.toLowerCase() === q)) {
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
      render2();
      fit();
    };
    search.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = search.value.trim();
        if (v) {
          this.addEntryWithValue(file, section, v, void 0, target);
          this.closeAll();
        }
      } else if (e.key === "Escape") {
        this.closeAll();
      }
    };
    render2();
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
    const side = document.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    const r = row.getBoundingClientRect();
    side.style.left = r.right + 2 + "px";
    side.style.top = r.top + "px";
    side.style.minWidth = "170px";
    side.createDiv({ cls: "ep-side-title", text: multi ? t("add.pickValues", { key }) : key });
    const body = side.createDiv({ cls: "ep-side-body" });
    const sel = /* @__PURE__ */ new Set();
    const vals = view.props.valuesFor(key);
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = multi ? t("add.customValue") : t("add.typeValue");
    let addBtn = null;
    const updateCount = () => {
      if (addBtn) addBtn.setText(t("add.addN", { n: sel.size + (custom.value.trim() ? 1 : 0) }));
    };
    const commit2 = (single) => {
      if (multi) {
        const arr = [...sel];
        if (custom.value.trim()) arr.push(custom.value.trim());
        this.addEntryWithValue(file, section, key, arr, target);
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
      if (multi) {
        const cb = it.createEl("input");
        cb.type = "checkbox";
        it.createSpan({ text: v });
        it.onclick = (e) => {
          if (e.target !== cb) cb.checked = !cb.checked;
          if (cb.checked) sel.add(v);
          else sel.delete(v);
          updateCount();
        };
      } else {
        it.createSpan({ text: v });
        it.onclick = () => commit2(v);
      }
    }
    if (!vals.length) body.createDiv({ cls: "ep-empty-sub", text: t("add.noValues") });
    custom.oninput = () => updateCount();
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit2();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    if (multi) {
      addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addN", { n: 0 }) });
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
    const w = document.body.createDiv({ cls: "ep-popup ep-noteswin" });
    this.popups.push(w);
    this.notesWin = w;
    const r = anchor.getBoundingClientRect();
    w.style.left = r.right + 4 + "px";
    w.style.top = r.top + "px";
    w.style.minWidth = "160px";
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
    const side = document.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    side.style.left = left + "px";
    side.style.top = top + "px";
    side.style.minWidth = "170px";
    side.createDiv({ cls: "ep-side-title", text: t("list.addTo", { key }) });
    const body = side.createDiv({ cls: "ep-side-body" });
    const sel = /* @__PURE__ */ new Set();
    const opts = view.props.valuesFor(key).filter((o) => !cur.some((c) => c.toLowerCase() === o.toLowerCase()));
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = t("add.customValue");
    let addBtn;
    const updateCount = () => addBtn.setText(t("add.addN", { n: sel.size + (custom.value.trim() ? 1 : 0) }));
    for (const v of opts) {
      const it = body.createDiv({ cls: "ep-pop-row" });
      const cb = it.createEl("input");
      cb.type = "checkbox";
      it.createSpan({ text: v });
      it.onclick = (e) => {
        if (e.target !== cb) cb.checked = !cb.checked;
        if (cb.checked) sel.add(v);
        else sel.delete(v);
        updateCount();
      };
    }
    if (!opts.length) body.createDiv({ cls: "ep-empty-sub", text: t("list.noMoreValues") });
    custom.oninput = () => updateCount();
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addBtn.click();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addN", { n: 0 }) });
    addBtn.onclick = () => {
      const add = [...sel];
      if (custom.value.trim()) add.push(custom.value.trim());
      if (add.length) view.note.set(file, key, [...cur, ...add]);
      this.closeAll();
    };
    this.fitToViewport(side, left, left);
    this.dismissOnOutsideClick(side);
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
          app.workspace.openLinkText(target, sourcePath, ev.ctrlKey || ev.metaKey);
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
var SidebarView = class extends import_obsidian19.ItemView {
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
    this.flowEl = null;
    this.resizeObs = null;
    this.lastEmptySig = "";
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
      captureUndo: () => this.editMode
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
  get layout() {
    return this.plugin.ensureLayout(this.activeTypeKey || "character");
  }
  saveLayout() {
    this.plugin.saveSettings();
  }
  rerender() {
    this.render();
  }
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
  buildCluster(head, flags, o) {
    return buildCluster(head, flags, o, (el, open) => this.bindOpen(el, open));
  }
  bindOpen(el, open, markEditable = true) {
    if (markEditable) el.addClass("ep-editable");
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
    if (af instanceof import_obsidian19.TFile) return this.app.vault.getResourcePath(af);
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
          this.plugin.saveSettings();
        }
      },
      initial,
      onPick
    ).open();
  }
  highlight(el) {
    const wrap = el.closest(".ep-entry");
    const c = this.content;
    if (!wrap) return;
    c.findAll(".ep-highlight").forEach((x) => x.removeClass("ep-highlight"));
    wrap.addClass("ep-highlight");
    c.addClass("ep-highlighting");
    window.clearTimeout(this.hlTimer);
    this.hlTimer = window.setTimeout(() => {
      c.removeClass("ep-highlighting");
      wrap.removeClass("ep-highlight");
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
    newKey = newKey.trim();
    if (!newKey || newKey === entry.key) return;
    entry.key = newKey;
    entry.alias = void 0;
    entry.slider = void 0;
    entry.sliderCurve = void 0;
    entry.steppers = void 0;
    entry.roll = void 0;
    entry.showMod = void 0;
    entry.showChain = void 0;
    entry.showDice = void 0;
    entry.mods = void 0;
    entry.rollOverride = void 0;
    entry.dice = void 0;
    entry.min = void 0;
    entry.max = void 0;
    entry.clamp = void 0;
    entry.formula = void 0;
    entry.dataType = this.deriveType(newKey);
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
      requestAnimationFrame(() => this.scrollToSection(id));
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
      list.push({ key: k, onNote: this.note.raw[k] !== void 0 });
    }
    list.sort((a, b) => a.onNote === b.onNote ? a.key.localeCompare(b.key) : a.onNote ? -1 : 1);
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
    this.render();
  }
  async onClose() {
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
    const active = this.app.workspace.getActiveFile();
    if (!active) {
      this.note.path = null;
      this.render();
      return;
    }
    if (file) {
      if (file.path !== active.path) return;
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
  /** Signature of which prop entries are empty — visibility changes need a re-render. */
  emptySig() {
    let sig = "";
    for (const s of this.layout.sections)
      for (const e of s.entries) if (e.kind === "prop" && e.key) sig += this.note.isEmpty(e.key) ? "0" : "1";
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
          this.plugin.saveSettings();
        }
        this.note.revertUndo();
        const active = this.app.workspace.getActiveFile();
        if (active) this.note.load(active);
        finish();
      }
    ).open();
  }
  // -- label rendering (shared by entry kinds) ----------------------------------
  renderLabel(head, ctx) {
    var _a, _b;
    const { entry } = ctx;
    const showLabel = this.editMode || !entry.hideLabel;
    if (!showLabel) return;
    const span = head.createSpan({ cls: "ep-line-name" });
    if (entry.labelSize) span.style.fontSize = entry.labelSize + "px";
    if (entry.labelColor) span.style.color = entry.labelColor;
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
        input.onblur = () => setTimeout(() => finish(true), 120);
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
      span.createSpan({ cls: "ep-type-hint", text: def ? def.name(this.i18n) : typeId });
    }
  }
  /**
   * Width-responsive decorations: per section, progressively hide the
   * data-type hints, then the modifier chains, then the dice tags while
   * any row overflows — and bring them back when the sidebar grows.
   * Re-run on every render and on container resize.
   */
  responsivePass() {
    for (const secEl of this.content.findAll(".ep-section")) {
      secEl.findAll(".ep-squeezed").forEach((el) => el.removeClass("ep-squeezed"));
      alignClustersNow(secEl);
      const overflowing = () => secEl.findAll(".ep-entry-head").some((h) => h.scrollWidth > h.clientWidth + 1);
      for (const cls of ["ep-type-hint", "ep-denote", "ep-dice-tag"]) {
        if (!overflowing()) break;
        secEl.findAll(".ep-entry-head ." + cls).forEach((el) => {
          el.addClass("ep-squeezed");
          const cell = el.closest("[data-ep-slot]");
          if (cell) cell.style.minWidth = "";
        });
      }
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
    if (this.headerEl && this.stickyZoneEl) this.stickyZoneEl.style.top = this.headerEl.offsetHeight + "px";
    this.content.style.setProperty("--ep-sticky-top", this.stickyTopPx() + "px");
  }
  /** Animate a container's height change (edit-mode transitions). */
  animateHeight(el, fromH) {
    if (!el || fromH <= 0) return;
    const toH = el.scrollHeight;
    if (Math.abs(toH - fromH) < 2) return;
    const prevO = el.style.overflow;
    el.style.overflow = "hidden";
    el.style.height = fromH + "px";
    void el.offsetWidth;
    el.style.transition = "height .28s ease";
    el.style.height = toH + "px";
    const done = () => {
      el.style.height = "";
      el.style.transition = "";
      el.style.overflow = prevO;
      el.removeEventListener("transitionend", done);
    };
    el.addEventListener("transitionend", done);
  }
  applyTypography(container) {
    const d = this.settings.defaults;
    const set = (k, v) => {
      if (v && v > 0) container.style.setProperty(k, v + "px");
      else container.style.removeProperty(k);
    };
    if (d.fontFamily) container.style.setProperty("--ep-font", d.fontFamily);
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
      this.plugin.saveSettings();
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
          sticky: d.sectionSticky,
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
    const host = {
      registerSectionEl: (id, el) => this.sectionEls[id] = el,
      reflowSticky: () => this.reflowSticky()
    };
    for (const section of this.layout.sections)
      renderSection(section.sticky ? this.stickyZoneEl : flow, this, file, section, this.drag, host);
    this.lastEmptySig = this.emptySig();
    container.scrollTop = prevScroll;
    requestAnimationFrame(() => {
      this.reflowSticky();
      requestAnimationFrame(() => this.responsivePass());
    });
    if (this.resizeObs) {
      this.resizeObs.disconnect();
      if (this.headerEl) this.resizeObs.observe(this.headerEl);
      if (this.stickyZoneEl) this.resizeObs.observe(this.stickyZoneEl);
      if (this.flowEl) this.resizeObs.observe(this.flowEl);
    }
    if (animate)
      requestAnimationFrame(() => {
        this.animateHeight(this.flowEl, oldFlowH);
        this.animateHeight(this.stickyZoneEl, oldZoneH);
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

// src/ui/settings-tab.ts
var import_obsidian20 = require("obsidian");
var OVERRIDE_ROW_LIMIT = 25;
var EPSettingTab = class extends import_obsidian20.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const c = this.containerEl;
    const plugin = this.plugin;
    const i18n = plugin.i18n;
    const t = i18n.t.bind(i18n);
    const save = () => {
      plugin.saveSettings();
      plugin.refreshViews();
    };
    c.empty();
    c.addClass("ep-settings");
    c.createEl("p", { text: t("settings.intro") });
    c.createEl("h3", { text: t("settings.typesHeading") });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.typesDesc") });
    for (const type of plugin.settings.types) {
      new import_obsidian20.Setting(c).setName(type).addButton(
        (b) => b.setButtonText(t("settings.resetLayout")).onClick(
          () => new ConfirmModal(
            this.app,
            i18n,
            t("settings.resetLayoutConfirm", { type }),
            () => plugin.resetLayout(type.toLowerCase())
          ).open()
        )
      ).addButton(
        (b) => b.setButtonText(t("settings.deleteType")).setWarning().onClick(() => {
          plugin.settings.types = plugin.settings.types.filter((x) => x !== type);
          delete plugin.settings.layouts[type.toLowerCase()];
          save();
          this.display();
        })
      );
    }
    new import_obsidian20.Setting(c).setName(t("settings.addType")).addButton(
      (b) => b.setButtonText(t("settings.addTypeBtn")).setCta().onClick(
        () => new TextPromptModal(this.app, i18n, t("settings.newTypePrompt"), "", (v) => {
          const name = v.trim();
          if (!name) return;
          if (plugin.settings.types.some((x) => x.toLowerCase() === name.toLowerCase())) {
            new import_obsidian20.Notice(t("settings.typeExists"));
            return;
          }
          plugin.settings.types.push(name);
          plugin.ensureLayout(name.toLowerCase());
          save();
          this.display();
        }).open()
      )
    );
    const d = plugin.settings.defaults;
    c.createEl("h3", { text: t("settings.defaultsHeading") });
    new import_obsidian20.Setting(c).setName(t("settings.defaultDataType")).setDesc(t("settings.defaultDataTypeDesc")).addDropdown((dd) => {
      for (const def of plugin.registries.valueTypes.all()) dd.addOption(def.id, def.name(i18n));
      dd.setValue(d.dataType);
      dd.onChange((v) => {
        d.dataType = v;
        save();
      });
    });
    new import_obsidian20.Setting(c).setName(t("settings.defaultColorSpace")).addDropdown((dd) => {
      for (const sp of COLOR_SPACES) dd.addOption(sp, sp);
      dd.setValue(d.colorSpace);
      dd.onChange((v) => {
        d.colorSpace = v;
        save();
      });
    });
    c.createEl("h3", { text: t("settings.newSectionHeading") });
    new import_obsidian20.Setting(c).setName(t("sectionOptions.columns")).addDropdown((dd) => {
      dd.addOption("1", "1");
      dd.addOption("2", "2");
      dd.setValue(String(d.sectionColumns));
      dd.onChange((v) => {
        d.sectionColumns = Number(v);
        save();
      });
    });
    const toggleRow = (name, get, set) => new import_obsidian20.Setting(c).setName(name).addToggle((tg) => {
      tg.setValue(get()).onChange((v) => {
        set(v);
        save();
      });
    });
    toggleRow(t("sectionOptions.transparent"), () => d.sectionTransparent, (v) => d.sectionTransparent = v);
    toggleRow(t("sectionOptions.sticky"), () => d.sectionSticky, (v) => d.sectionSticky = v);
    toggleRow(t("sectionOptions.collapsible"), () => d.sectionCollapsible, (v) => d.sectionCollapsible = v);
    toggleRow(t("settings.entryDividers"), () => d.sectionDividers, (v) => d.sectionDividers = v);
    new import_obsidian20.Setting(c).setName(t("sectionOptions.height")).addDropdown((dd) => {
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
    c.createEl("h3", { text: t("settings.derivationsHeading") });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.derivationsDesc") });
    const applyDerivations = () => {
      plugin.rebuildRegistries();
      save();
    };
    for (const dv of [...plugin.settings.derivations]) {
      new import_obsidian20.Setting(c).setName(dv.name || dv.id).addText((tx) => {
        tx.setPlaceholder(t("settings.derivationName")).setValue(dv.name).onChange((v) => {
          dv.name = v.trim() || dv.id;
          applyDerivations();
        });
      }).addText((tx) => {
        tx.setPlaceholder("f(x)").setValue(dv.formula).onChange((v) => {
          if (v.trim() && !compileFormula(v.trim())) return;
          dv.formula = v.trim() || "x";
          applyDerivations();
        });
      }).addExtraButton(
        (b) => b.setIcon("trash").setTooltip(t("settings.derivationDelete")).onClick(() => {
          plugin.settings.derivations = plugin.settings.derivations.filter((x) => x !== dv);
          applyDerivations();
          this.display();
        })
      );
    }
    new import_obsidian20.Setting(c).setName(t("settings.modDepth")).setDesc(t("settings.modDepthDesc")).addSlider((sl) => {
      var _a;
      sl.setLimits(0, 16, 1).setValue((_a = plugin.settings.modDepth) != null ? _a : 8).setDynamicTooltip().onChange((v) => {
        plugin.settings.modDepth = v;
        save();
      });
    });
    new import_obsidian20.Setting(c).setName(t("settings.derivationAdd")).addButton(
      (b) => b.setButtonText(t("settings.derivationAddBtn")).onClick(() => {
        plugin.settings.derivations.push({ id: genId(), name: t("settings.newDerivation"), formula: "x" });
        applyDerivations();
        this.display();
      })
    ).addButton(
      (b) => b.setButtonText(t("settings.derivationReseed")).onClick(() => {
        const have = new Set(plugin.settings.derivations.map((x) => x.id));
        for (const dv of defaultDerivations()) if (!have.has(dv.id)) plugin.settings.derivations.push(dv);
        applyDerivations();
        this.display();
      })
    );
    c.createEl("h3", { text: t("settings.abbrHeading") });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.abbrDesc") });
    for (const key of Object.keys(plugin.settings.sourceAbbrs).sort((a, b) => a.localeCompare(b))) {
      new import_obsidian20.Setting(c).setName(key).setDesc(t("settings.abbrDefault", { abbr: defaultAbbr(key) })).addText((tx) => {
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
          this.display();
        })
      );
    }
    new import_obsidian20.Setting(c).setName(t("settings.abbrAdd")).addButton(
      (b) => b.setButtonText(t("settings.abbrAddBtn")).onClick(
        () => new TextPromptModal(this.app, i18n, t("settings.abbrPrompt"), "", (v) => {
          const k = v.trim();
          if (!k) return;
          if (!Object.keys(plugin.settings.sourceAbbrs).some((x) => x.toLowerCase() === k.toLowerCase()))
            plugin.settings.sourceAbbrs[k] = defaultAbbr(k);
          save();
          this.display();
        }, () => plugin.props.knownProps()).open()
      )
    );
    c.createEl("h3", { text: t("settings.diceHeading") });
    new import_obsidian20.Setting(c).setName(t("settings.diceAnim")).setDesc(t("settings.diceAnimDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.diceAnim).onChange((v) => {
        plugin.settings.diceAnim = v;
        save();
      });
    });
    new import_obsidian20.Setting(c).setName(t("settings.diceAnimRolls")).setDesc(t("settings.diceAnimRollsDesc")).addSlider((sl) => {
      var _a;
      sl.setLimits(1, 30, 1).setValue((_a = plugin.settings.diceAnimRolls) != null ? _a : 10).setDynamicTooltip().onChange((v) => {
        plugin.settings.diceAnimRolls = v;
        save();
      });
    });
    c.createEl("h3", { text: t("settings.typographyHeading") });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.typographyDesc") });
    new import_obsidian20.Setting(c).setName(t("settings.fontFamily")).addText((tx) => {
      tx.setPlaceholder(t("settings.fontPlaceholder")).setValue(d.fontFamily).onChange((v) => {
        d.fontFamily = v.trim();
        save();
      });
    });
    const sizeRow = (name, get, set) => new import_obsidian20.Setting(c).setName(name).addSlider((sl) => {
      sl.setLimits(0, 32, 1).setValue(get()).setDynamicTooltip().onChange((v) => {
        set(v);
        save();
      });
    });
    sizeRow(t("settings.baseSize"), () => d.baseSize, (n) => d.baseSize = n);
    sizeRow(t("options.labelSize"), () => d.labelSize, (n) => d.labelSize = n);
    sizeRow(t("options.valueSize"), () => d.valueSize, (n) => d.valueSize = n);
    sizeRow(t("sectionOptions.titleSize"), () => d.titleSize, (n) => d.titleSize = n);
    sizeRow(t("settings.listSize"), () => d.listSize, (n) => d.listSize = n);
    c.createEl("h3", { text: t("settings.languageHeading") });
    new import_obsidian20.Setting(c).setName(t("settings.language")).setDesc(t("settings.languageDesc")).addDropdown((dd) => {
      for (const loc of i18n.availableLocales()) dd.addOption(loc.code, loc.name);
      dd.setValue(plugin.settings.language);
      dd.onChange((v) => {
        plugin.settings.language = v;
        i18n.setLocale(v);
        save();
        this.display();
      });
    });
    this.renderOverrideEditor(c);
    c.createEl("h3", { text: t("settings.obsidianHeading") });
    new import_obsidian20.Setting(c).setName(t("settings.hideShown")).setDesc(t("settings.hideShownDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.hideShown).onChange((v) => {
        plugin.settings.hideShown = v;
        save();
      });
    });
    new import_obsidian20.Setting(c).setName(t("settings.propMenu")).setDesc(t("settings.propMenuDesc")).addToggle((tg) => {
      tg.setValue(plugin.settings.propMenu).onChange((v) => {
        plugin.settings.propMenu = v;
        save();
      });
    });
    c.createEl("h3", { text: t("settings.hiddenHeading") });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.hiddenDesc") });
    for (const k of plugin.settings.manualHide) {
      new import_obsidian20.Setting(c).setName(k).addButton(
        (b) => b.setButtonText(t("settings.unhide")).onClick(() => {
          plugin.settings.manualHide = plugin.settings.manualHide.filter((x) => x !== k);
          save();
          this.display();
        })
      );
    }
    new import_obsidian20.Setting(c).setName(t("settings.hideProperty")).addButton(
      (b) => b.setButtonText(t("settings.hidePropertyBtn")).onClick(
        () => new TextPromptModal(this.app, i18n, t("settings.hidePromptTitle"), "", (v) => {
          const k = v.trim();
          if (!k) return;
          if (!plugin.settings.manualHide.includes(k)) plugin.settings.manualHide.push(k);
          save();
          this.display();
        }, () => plugin.props.knownProps()).open()
      )
    );
    c.createEl("h3", { text: t("settings.featuresHeading") });
    c.createEl("p", { cls: "setting-item-description", text: t("settings.featuresDesc") });
    for (const mod of plugin.featureModules) {
      new import_obsidian20.Setting(c).setName(mod.name(i18n)).setDesc(mod.description(i18n)).addToggle((tg) => {
        tg.setValue(plugin.settings.features[mod.id] !== false).onChange((v) => {
          plugin.settings.features[mod.id] = v;
          plugin.rebuildRegistries();
          save();
          this.display();
        });
      });
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
    new import_obsidian20.Setting(c).setName(t("settings.overrides")).setDesc(t("settings.overridesDesc")).addButton(
      (b) => b.setButtonText(t("settings.overridesReset")).onClick(() => {
        plugin.settings.stringOverrides = {};
        i18n.setOverrides({});
        plugin.saveSettings();
        plugin.refreshViews();
        this.display();
      })
    );
    const search = c.createEl("input", { cls: "ep-edit-input" });
    search.type = "text";
    search.placeholder = t("settings.overridesSearch");
    search.style.width = "100%";
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
        new import_obsidian20.Setting(listEl).setName(key).setDesc(t("settings.overrideDefault", { text: i18n.baseText(key) })).addText((tx) => {
          var _a;
          tx.setPlaceholder(i18n.baseText(key)).setValue((_a = plugin.settings.stringOverrides[key]) != null ? _a : "").onChange((v) => {
            if (v) plugin.settings.stringOverrides[key] = v;
            else delete plugin.settings.stringOverrides[key];
            i18n.setOverrides(plugin.settings.stringOverrides);
            plugin.saveSettings();
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
  }
};

// src/ui/menus/prop-panel-menu.ts
var import_obsidian21 = require("obsidian");
function showPropMenu(host, e, key) {
  var _a, _b, _c;
  const { app, i18n, settings, hide } = host;
  const t = i18n.t.bind(i18n);
  const menu = new import_obsidian21.Menu();
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
      const sub = i.setSubmenu ? i.setSubmenu() : null;
      if (!sub) return;
      const addGroup = (title, keys) => {
        if (!keys.length) return;
        sub.addItem((h) => h.setTitle(title).setDisabled(true));
        for (const k of [...new Set(keys)].sort((a, b) => a.localeCompare(b))) {
          const kHidden = hide.isHidden(k);
          sub.addItem(
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
  const menus = document.querySelectorAll(".menu");
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
    (0, import_obsidian21.setIcon)(ic, "eye");
    it.createDiv({ cls: "menu-item-title", text: h.manual ? h.key : t("propPanel.sidebarSuffix", { key: h.key }) });
    it.addEventListener("click", () => {
      hide.unhideKey(h.key);
      menu.remove();
    });
  }
  if (hidden.length > 1) {
    const all = menu.createDiv({ cls: "menu-item ep-injected" });
    const ic = all.createDiv({ cls: "menu-item-icon" });
    (0, import_obsidian21.setIcon)(ic, "eye");
    all.createDiv({ cls: "menu-item-title", text: t("propPanel.showAll") });
    all.addEventListener("click", () => {
      for (const h of hidden) hide.unhideKey(h.key);
      menu.remove();
    });
  }
}

// src/features/rolling/roll-service.ts
var import_obsidian23 = require("obsidian");

// src/features/rolling/dice-anim.ts
var import_obsidian22 = require("obsidian");
var MAX_DICE_SHOWN = 12;
var TICK_MS = 80;
function playRollAnimation(job, done) {
  var _a, _b;
  if ((_b = (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-reduced-motion: reduce)")) == null ? void 0 : _b.matches) {
    done();
    return;
  }
  const overlay = document.body.createDiv({ cls: "ep-roll-overlay" });
  const box = overlay.createDiv({ cls: "ep-roll-box" });
  box.createDiv({ cls: "ep-roll-label", text: job.label });
  const diceRow = box.createDiv({ cls: "ep-roll-dice" });
  const sum = box.createDiv({ cls: "ep-roll-sum" });
  const shown = Math.min(job.faces.length, MAX_DICE_SHOWN);
  const dies = [];
  for (let i = 0; i < shown; i++) {
    const el = diceRow.createDiv({ cls: "ep-roll-die ep-rolling" });
    const ic = el.createDiv({ cls: "ep-roll-die-ico" });
    (0, import_obsidian22.setIcon)(ic, diceIconId(job.spec.sides));
    const num = el.createDiv({ cls: "ep-roll-die-num" });
    dies.push({ el, num });
  }
  let timer = 0;
  let t1 = 0;
  let t2 = 0;
  let t3 = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearInterval(timer);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    window.clearTimeout(t3);
    overlay.addClass("ep-closing");
    window.setTimeout(() => overlay.remove(), 160);
    done();
  };
  overlay.onclick = finish;
  const diceTotal = job.faces.reduce((a, b) => a + b, 0);
  const settle = () => {
    window.clearInterval(timer);
    dies.forEach((d, i) => {
      d.el.removeClass("ep-rolling");
      d.el.addClass("ep-settled");
      d.num.setText(String(job.faces[i]));
    });
    t1 = window.setTimeout(() => {
      if (finished) return;
      const breakdown = job.faces.length > 1 && job.faces.length <= MAX_DICE_SHOWN ? `${job.faces.join(" + ")} = ${diceTotal}` : String(diceTotal);
      sum.createSpan({ text: breakdown });
      if (job.modifier !== 0) {
        const m = sum.createSpan({ cls: "ep-roll-mod", text: fmtMod(job.modifier) });
        requestAnimationFrame(() => m.addClass("ep-in"));
      }
      const tot = sum.createSpan({ cls: "ep-roll-total", text: "= " + job.total });
      t2 = window.setTimeout(() => {
        if (finished) return;
        tot.addClass("ep-in");
        t3 = window.setTimeout(finish, 950);
      }, job.modifier !== 0 ? 380 : 120);
    }, 300);
  };
  let spin = 0;
  const spins = Math.max(1, Math.floor(job.spins) || 1);
  timer = window.setInterval(() => {
    for (const d of dies) d.num.setText(String(1 + Math.floor(Math.random() * job.spec.sides)));
    spin++;
    if (spin >= spins) settle();
  }, TICK_MS);
}

// src/features/rolling/roll-service.ts
var ROLL_SERVICE = "rolling.rolls";
var LOG_LIMIT = 6;
var RollService = class {
  constructor(i18n, settings) {
    this.i18n = i18n;
    this.settings = settings;
    this.mode = "normal";
    this.log = [];
    this.listeners = /* @__PURE__ */ new Set();
  }
  /** The log is per-note; the mode survives note switches. */
  onFileChange() {
    this.log = [];
    this.emit();
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const fn of this.listeners) fn();
  }
  setMode(mode) {
    this.mode = mode;
    this.emit();
  }
  /**
   * Roll `spec` + `modifier` under the current mode; log and toast the result.
   * @param spec dice pool to roll (defaults to a single d20)
   */
  roll(label, modifier, spec = { ...DEFAULT_DICE }) {
    var _a, _b;
    const pools = [rollPool(spec)];
    if (this.mode !== "normal") pools.push(rollPool(spec));
    const used = pools.length === 1 ? pools[0] : this.mode === "advantage" ? pools.reduce((a, b) => b.total > a.total ? b : a) : pools.reduce((a, b) => b.total < a.total ? b : a);
    const total = used.total + modifier;
    const tag = this.mode === "advantage" ? " " + this.i18n.t("roll.tagAdvantage") : this.mode === "disadvantage" ? " " + this.i18n.t("roll.tagDisadvantage") : "";
    const detail = pools.length > 1 ? `[${pools.map((p) => p.total).join(", ")}] -> ${used.total}` : spec.count > 1 ? `[${used.faces.join(", ")}] -> ${used.total}` : `${used.total}`;
    const tone = isMaxPool(spec, used) ? "crit" : isMinPool(used) ? "fail" : "normal";
    const commit2 = () => {
      this.log.unshift({ text: `${label}${tag}: ${total}   (${formatDice(spec)} ${detail} ${fmtMod(modifier)})`, tone });
      if (this.log.length > LOG_LIMIT) this.log.pop();
      this.emit();
      new import_obsidian23.Notice(`${label}${tag}: ${total}`, 4e3);
    };
    if ((_a = this.settings) == null ? void 0 : _a.diceAnim) {
      playRollAnimation(
        {
          label: `${label}${tag}`,
          spec,
          faces: used.faces,
          modifier,
          total,
          spins: (_b = this.settings.diceAnimRolls) != null ? _b : 10
        },
        commit2
      );
    } else {
      commit2();
    }
  }
};

// src/features/rolling/rolls-panel.ts
function rollService(view) {
  return view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings));
}
var rollsKind = {
  id: "rolls",
  addable: true,
  defaultLabel: (i18n) => i18n.t("roll.rolls"),
  render(ctx) {
    const { view } = ctx;
    const t = view.i18n.t.bind(view.i18n);
    view.renderLabel(ctx.head, ctx);
    const service = rollService(view);
    const modeWrap = ctx.extra.createDiv({ cls: "ep-mode" });
    modeWrap.setAttr("title", t("roll.modeHint"));
    const modes = [
      { key: "disadvantage", label: t("roll.modeDisadvantage") },
      { key: "normal", label: t("roll.modeNormal") },
      { key: "advantage", label: t("roll.modeAdvantage") }
    ];
    const btns = /* @__PURE__ */ new Map();
    for (const m of modes) {
      const b = modeWrap.createEl("button", { text: m.label, cls: "ep-mode-btn" });
      btns.set(m.key, b);
      b.onclick = () => service.setMode(m.key);
    }
    const logEl = ctx.extra.createDiv({ cls: "ep-log" });
    const redraw = () => {
      for (const [k, b] of btns) b.toggleClass("is-active", service.mode === k);
      logEl.empty();
      if (service.log.length === 0) {
        logEl.createDiv({ cls: "ep-log-empty", text: t("roll.logEmpty") });
        return;
      }
      for (const e of service.log) {
        const row = logEl.createDiv({ cls: "ep-log-row" });
        if (e.tone === "crit") row.addClass("ep-crit");
        if (e.tone === "fail") row.addClass("ep-fail");
        row.setText(e.text);
      }
    };
    redraw();
    const unsub = service.subscribe(() => {
      if (!logEl.isConnected) {
        unsub();
        return;
      }
      redraw();
    });
  }
};

// src/features/rolling/numeric-addon.ts
var import_obsidian25 = require("obsidian");

// src/features/rolling/dice-ui.ts
var import_obsidian24 = require("obsidian");
function commit(binding, spec) {
  binding.set(isDefaultDice(spec) ? void 0 : formatDice(spec));
}
function openDiceMenu(e, app, i18n, binding) {
  const cur = parseDiceOrDefault(binding.get());
  const menu = new import_obsidian24.Menu();
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
  new import_obsidian24.Setting(container).setName(i18n.t("dice.die")).setDesc(i18n.t("dice.dieDesc")).addDropdown((d) => {
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
  new import_obsidian24.Setting(container).setName(i18n.t("dice.countLabel")).addText((t) => {
    t.setValue(String(cur().count)).onChange((v) => {
      const n = parseInt(v);
      if (Number.isFinite(n) && n >= 1) commit(binding, { count: n, sides: cur().sides });
    });
  });
}
function renderDiceTag(parent, notation, alwaysShow = false) {
  const spec = parseDice(notation);
  if (!spec && !alwaysShow) return null;
  const eff = spec != null ? spec : parseDiceOrDefault(void 0);
  return parent.createSpan({ cls: "ep-dice-tag ep-line-abbr", text: formatDice(eff) });
}

// src/features/rolling/numeric-addon.ts
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
  fillSlots(ctx, num) {
    const view = ctx.view;
    const e = ext(ctx.entry);
    const slots = {};
    slots["roll"] = (cell) => {
      const btn = cell.createEl("button", { cls: "ep-roll-btn", text: view.i18n.t("roll.roll") });
      btn.onclick = () => view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings)).roll(num.label, modifierTotal(view, ctx.entry), parseDiceOrDefault(e.dice));
    };
    return slots;
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed, redraw } = octx;
    if (entry.kind !== "prop" || !MODIFIABLE_TYPE_IDS.has(view.resolveType(entry))) return;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext(entry);
    c.createEl("h4", { text: t("roll.options.heading") });
    new import_obsidian25.Setting(c).setName(t("roll.options.rollButton")).setDesc(t("roll.options.rollButtonDesc")).addToggle((tg) => {
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
      new import_obsidian25.Setting(c).setName(t("mods.showDice")).setDesc(t("mods.showDiceDesc")).addToggle((tg) => {
        tg.setValue(entry.showDice !== false).onChange((v) => {
          entry.showDice = v ? void 0 : false;
          changed();
        });
      });
      new import_obsidian25.Setting(c).setName(t("mods.showDiceIcon")).setDesc(t("mods.showDiceIconDesc")).addToggle((tg) => {
        tg.setValue(entry.showDiceIcon !== false).onChange((v) => {
          entry.showDiceIcon = v ? void 0 : false;
          changed();
        });
      });
    }
  }
};

// src/features/rolling/skills-type.ts
var import_obsidian26 = require("obsidian");

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
function cleanRecords(records) {
  return records.map((r) => {
    const o = { name: r.name };
    if (r.source) o.source = r.source;
    if (r.prof) o.prof = true;
    if (r.dice) o.dice = r.dice;
    if (r.mod !== void 0) o.mod = r.mod;
    return o;
  });
}
function readRecords(view, key) {
  return parseRecords(view.note.raw[key]);
}
function writeRecords(view, file, key, records) {
  view.note.set(file, key, cleanRecords(records));
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
  var _a, _b;
  const { view, file, section, entry } = ref;
  const t = view.i18n.t.bind(view.i18n);
  const e = ext(entry);
  const key = entry.key;
  let records = readRecords(view, key);
  const preset = view.registries.skillPresets.get(e.skillsPreset);
  if (!records.length && preset) records = preset.records();
  if (!records.length) {
    new import_obsidian26.Notice(t("skills.convertEmpty"));
    return;
  }
  const useProf = e.profMode === "level" || e.profMode === "fixed";
  const profKey = t("skills.convertProfProperty");
  const profListKey = (_a = preset == null ? void 0 : preset.legacyProfKey) != null ? _a : t("skills.convertProfList", { name: entry.alias || key });
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
        view.note.set(file, profKey, (_b = e.profFixed) != null ? _b : 0);
      }
    }
    const have = view.note.list(profListKey);
    const haveL = have.map((x) => x.toLowerCase());
    const add = records.filter((r) => r.prof && !haveL.includes(r.name.toLowerCase())).map((r) => r.name);
    if (add.length) view.note.set(file, profListKey, [...have, ...add]);
  }
  const fresh = records.map((rec) => {
    var _a2, _b2;
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
    if ((_a2 = rec.dice) != null ? _a2 : e.dice) en.dice = (_b2 = rec.dice) != null ? _b2 : e.dice;
    if (rec.mod !== void 0) en.rollOverride = rec.mod + (rec.prof ? profBonus(view, e) : 0);
    return en;
  });
  const idx = section.entries.findIndex((x) => x.id === entry.id);
  section.entries.splice(idx < 0 ? section.entries.length : idx, 1, ...fresh);
  ensurePropEntries(view.layout, section, [...new Set(records.map((r) => r.source).filter((x) => !!x))]);
  view.saveLayout();
  view.rerender();
  new import_obsidian26.Notice(t("skills.convertDone", { n: fresh.length }));
}
function confirmConvert(ref) {
  new ConfirmModal(
    ref.view.app,
    ref.view.i18n,
    ref.view.i18n.t("skills.convertConfirm"),
    () => convertToProperties(ref)
  ).open();
}
function updateRecord(ctx, index, change) {
  const key = ctx.entry.key;
  const records = readRecords(ctx.view, key);
  if (!records[index]) return;
  change(records[index]);
  writeRecords(ctx.view, ctx.file, key, records);
}
function populateFromPreset(view, file, key, preset) {
  const fresh = preset.records();
  if (preset.legacyProfKey) {
    const legacy = view.note.list(preset.legacyProfKey).map((x) => x.toLowerCase());
    for (const r of fresh) if (legacy.includes(r.name.toLowerCase())) r.prof = true;
  }
  const existing = readRecords(view, key);
  const have = new Set(existing.map((r) => r.name.toLowerCase()));
  const merged = [...existing, ...fresh.filter((r) => !have.has(r.name.toLowerCase()))];
  writeRecords(view, file, key, merged);
}
function addBlankSkill(view, file, key) {
  new TextPromptModal(view.app, view.i18n, view.i18n.t("skills.newSkillPrompt"), "", (v) => {
    const name = v.trim();
    if (!name) return;
    writeRecords(view, file, key, [...readRecords(view, key), { name }]);
  }).open();
}
function openAddSkillsMenu(e, view, file, key) {
  const menu = new import_obsidian26.Menu();
  for (const preset of view.registries.skillPresets.all()) {
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("skills.menu.addPreset", { name: preset.name(view.i18n) })).setIcon("list-plus").onClick(() => populateFromPreset(view, file, key, preset))
    );
  }
  menu.addSeparator();
  menu.addItem(
    (i) => i.setTitle(view.i18n.t("skills.newSkill")).setIcon("plus").onClick(() => addBlankSkill(view, file, key))
  );
  menu.showAtMouseEvent(e);
}
function inlineText(span, value, commit2) {
  const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
  input.type = "text";
  input.value = value;
  span.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const finish = (save) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save && input.value.trim()) commit2(input.value.trim());
  };
  input.onblur = () => finish(true);
  input.onkeydown = (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      finish(true);
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      finish(false);
    }
  };
}
function inlineSource(ctx, span, index) {
  var _a, _b;
  const view = ctx.view;
  const input = createEl("input", { cls: "ep-edit-input ep-edit-label" });
  input.type = "text";
  input.value = (_b = (_a = readRecords(view, ctx.entry.key)[index]) == null ? void 0 : _a.source) != null ? _b : "";
  span.replaceWith(input);
  input.focus();
  input.select();
  let done = false;
  const choose = (key) => updateRecord(ctx, index, (r) => r.source = key || void 0);
  new PropSuggest(view.app, input, view.i18n, () => view.propCandidates(true), (key) => {
    done = true;
    if (input.parentElement) input.replaceWith(span);
    choose(key);
  }, false);
  const finish = (save) => {
    if (done) return;
    done = true;
    if (input.parentElement) input.replaceWith(span);
    if (save) choose(input.value.trim());
  };
  input.onblur = () => setTimeout(() => finish(true), 120);
  input.onkeydown = (ev) => {
    if (ev.key === "Escape") {
      ev.preventDefault();
      finish(false);
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      finish(true);
    }
  };
}
function renderRow(ctx, list, records, index) {
  var _a;
  const view = ctx.view;
  const t = view.i18n.t.bind(view.i18n);
  const e = ext(ctx.entry);
  const rec = records[index];
  const row = list.createDiv({ cls: "ep-line" });
  const cb = row.createEl("input");
  cb.type = "checkbox";
  cb.addClass("ep-prof");
  cb.checked = !!rec.prof;
  if (view.editMode) {
    cb.setAttr("title", t("skills.proficientHint"));
    cb.onchange = () => updateRecord(ctx, index, (r) => r.prof = cb.checked || void 0);
  } else {
    cb.setAttr("title", t("hint.dblToggle"));
    cb.onclick = (ev) => ev.preventDefault();
    cb.ondblclick = () => updateRecord(ctx, index, (r) => r.prof = !r.prof || void 0);
  }
  const nameSpan = row.createSpan({ cls: "ep-line-name", text: rec.name });
  view.bindOpen(
    nameSpan,
    () => inlineText(nameSpan, rec.name, (v) => updateRecord(ctx, index, (r) => r.name = v))
  );
  const abbrSpan = row.createSpan({
    cls: "ep-line-abbr",
    text: rec.source ? abbrFor(view.settings, rec.source) : "\u2014"
  });
  abbrSpan.setAttr("aria-label", rec.source || t("skills.menu.setSource"));
  view.bindOpen(abbrSpan, () => inlineSource(ctx, abbrSpan, index));
  const diceNotation = (_a = rec.dice) != null ? _a : e.dice;
  const diceTag = renderDiceTag(row, diceNotation);
  if (diceTag) {
    view.bindOpen(diceTag, () => {
      const r2 = diceTag.getBoundingClientRect();
      const fakeEvent = new MouseEvent("click", { clientX: r2.left, clientY: r2.bottom });
      openDiceMenu(fakeEvent, view.app, view.i18n, {
        get: () => {
          var _a2, _b;
          return (_b = (_a2 = readRecords(view, ctx.entry.key)[index]) == null ? void 0 : _a2.dice) != null ? _b : e.dice;
        },
        set: (n) => updateRecord(ctx, index, (r) => r.dice = n)
      });
    });
  }
  const modSpan = row.createSpan({ cls: "ep-line-mod", text: fmtMod(effectiveMod(view, e, rec)) });
  view.bindOpen(
    modSpan,
    () => openNumberInput(modSpan, effectiveMod(view, e, rec), (v) => {
      const prof = rec.prof ? profBonus(view, e) : 0;
      updateRecord(ctx, index, (r) => r.mod = v - prof);
    }, { min: -999, max: 999, float: false, clamp: false })
  );
  const rb = row.createEl("button", { cls: "ep-roll-btn", text: t("roll.roll") });
  rb.onclick = () => {
    var _a2;
    return view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings)).roll(rec.name, effectiveMod(view, e, rec), parseDiceOrDefault((_a2 = rec.dice) != null ? _a2 : e.dice));
  };
  row.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const menu = new import_obsidian26.Menu();
    menu.addItem(
      (i) => i.setTitle(t("skills.menu.setSource")).setIcon("link").onClick(() => inlineSource(ctx, abbrSpan, index))
    );
    menu.addItem(
      (i) => i.setTitle(t("skills.menu.setDice")).setIcon("dice").onClick(
        () => openDiceMenu(ev, view.app, view.i18n, {
          get: () => {
            var _a2, _b;
            return (_b = (_a2 = readRecords(view, ctx.entry.key)[index]) == null ? void 0 : _a2.dice) != null ? _b : e.dice;
          },
          set: (n) => updateRecord(ctx, index, (r) => r.dice = n)
        })
      )
    );
    if (rec.mod !== void 0)
      menu.addItem(
        (i) => i.setTitle(t("skills.menu.clearOverride")).setIcon("eraser").onClick(
          () => updateRecord(ctx, index, (r) => r.mod = void 0)
        )
      );
    menu.addSeparator();
    const move = (delta) => {
      const key = ctx.entry.key;
      const rs = readRecords(view, key);
      const j = index + delta;
      if (j < 0 || j >= rs.length) return;
      [rs[index], rs[j]] = [rs[j], rs[index]];
      writeRecords(view, ctx.file, key, rs);
    };
    menu.addItem((i) => i.setTitle(t("skills.menu.moveUp")).setIcon("arrow-up").onClick(() => move(-1)));
    menu.addItem((i) => i.setTitle(t("skills.menu.moveDown")).setIcon("arrow-down").onClick(() => move(1)));
    menu.addItem(
      (i) => i.setTitle(t("skills.menu.remove")).setIcon("trash").onClick(() => {
        const key = ctx.entry.key;
        const rs = readRecords(view, key);
        rs.splice(index, 1);
        writeRecords(view, ctx.file, key, rs);
      })
    );
    menu.showAtMouseEvent(ev);
  });
}
var skillsType = {
  id: "skills",
  wide: true,
  name: (i18n) => i18n.t("type.skills"),
  render(ctx) {
    const { view, entry } = ctx;
    const key = entry.key;
    const holder = ctx.extra.createDiv({ cls: "ep-block-list" });
    const build = () => {
      holder.empty();
      const records = readRecords(view, key);
      if (!records.length) {
        const empty = holder.createDiv({ cls: "ep-empty-sub", text: view.i18n.t("skills.empty") });
        const btn = empty.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("skills.addMenu") });
        btn.onclick = (ev) => openAddSkillsMenu(ev, view, ctx.file, key);
        return;
      }
      for (let i = 0; i < records.length; i++) renderRow(ctx, holder, records, i);
      if (view.editMode) {
        const add = holder.createEl("button", { cls: "ep-mini-btn ep-list-addbtn", text: view.i18n.t("skills.addSkill") });
        add.onclick = (ev) => openAddSkillsMenu(ev, view, ctx.file, key);
      }
    };
    build();
    view.registerUpdater(build);
  },
  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key;
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("skills.newSkill")).setIcon("plus").onClick(() => addBlankSkill(view, file, key))
    );
    for (const preset of view.registries.skillPresets.all()) {
      menu.addItem(
        (i) => i.setTitle(view.i18n.t("skills.menu.addPreset", { name: preset.name(view.i18n) })).setIcon("list-plus").onClick(() => populateFromPreset(view, file, key, preset))
      );
    }
    menu.addItem(
      (i) => i.setTitle(view.i18n.t("skills.convert")).setIcon("wand").onClick(() => confirmConvert(ref))
    );
  },
  renderOptions(octx) {
    const { view, entry, container: c, changed, redraw } = octx;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext(entry);
    c.createEl("h4", { text: t("skills.options.heading") });
    c.createEl("p", { cls: "setting-item-description", text: t("skills.options.editHint") });
    new import_obsidian26.Setting(c).setName(t("skills.convert")).setDesc(t("skills.convertDesc")).addButton(
      (b) => b.setButtonText(t("skills.convertBtn")).onClick(() => confirmConvert(octx))
    );
    new import_obsidian26.Setting(c).setName(t("skills.options.sourceMode")).addDropdown((d) => {
      var _a;
      d.addOption("value", t("skills.options.modeValue"));
      d.addOption("abilityMod", t("skills.options.modeAbilityMod"));
      d.setValue((_a = e.skillMode) != null ? _a : "value");
      d.onChange((v) => {
        e.skillMode = v;
        changed();
      });
    });
    new import_obsidian26.Setting(c).setName(t("skills.options.profMode")).addDropdown((d) => {
      var _a;
      d.addOption("none", t("skills.options.profNone"));
      d.addOption("level", t("skills.options.profLevel"));
      d.addOption("fixed", t("skills.options.profFixed"));
      d.setValue((_a = e.profMode) != null ? _a : "none");
      d.onChange((v) => {
        e.profMode = v === "none" ? void 0 : v;
        changed();
        redraw();
      });
    });
    if (e.profMode === "level") {
      new import_obsidian26.Setting(c).setName(t("skills.options.profSource")).addText((tx) => {
        var _a;
        tx.setPlaceholder("Level").setValue((_a = e.profSource) != null ? _a : "").onChange((v) => {
          e.profSource = v.trim() || void 0;
          changed();
        });
      });
    }
    if (e.profMode === "fixed") {
      new import_obsidian26.Setting(c).setName(t("skills.options.profFixedValue")).addText((tx) => {
        tx.setValue(e.profFixed !== void 0 ? String(e.profFixed) : "").onChange((v) => {
          const n = Number(v);
          e.profFixed = v.trim() === "" || !Number.isFinite(n) ? void 0 : n;
          changed();
        });
      });
    }
    addDiceSettings(c, view.i18n, {
      get: () => e.dice,
      set: (n) => {
        e.dice = n;
        changed();
      }
    });
    const presets = view.registries.skillPresets.all();
    if (presets.length) {
      c.createEl("h4", { text: t("skills.options.presets") });
      for (const preset of presets) {
        new import_obsidian26.Setting(c).setName(preset.name(view.i18n)).addButton(
          (b) => b.setButtonText(t("skills.options.addPreset")).onClick(() => {
            populateFromPreset(view, octx.file, entry.key, preset);
            changed();
          })
        );
      }
    }
  }
};

// src/features/rolling/strings.ts
var rollingEn = {
  "roll.featureName": "Dice & rolls",
  "roll.featureDesc": "Roll buttons on properties, configurable dice (d2\u2013d100 or custom), the roll log panel, and the skills data type.",
  "roll.roll": "Roll",
  "roll.rolls": "Rolls",
  "roll.checkLabel": "{name} check",
  "roll.tagAdvantage": "(adv)",
  "roll.tagDisadvantage": "(dis)",
  "roll.modeHint": "Roll mode \u2014 applies to all roll buttons",
  "roll.modeDisadvantage": "Disadv",
  "roll.modeNormal": "Normal",
  "roll.modeAdvantage": "Advantage",
  "roll.logEmpty": "Roll results will appear here.",
  "roll.options.heading": "Rolling",
  "roll.options.rollButton": "Roll button",
  "roll.options.rollButtonDesc": "Rolls the dice plus this entry's modifier (see Modifier above)",
  "dice.die": "Die",
  "dice.dieDesc": "Preset die, or type a custom size next to it",
  "dice.custom": "Custom\u2026",
  "dice.customSize": "Custom die size\u2026",
  "dice.customSizePrompt": "Die size (number of faces)",
  "dice.customSizeShort": "size",
  "dice.count": "Number of dice\u2026",
  "dice.countPrompt": "Number of dice",
  "dice.countLabel": "Number of dice",
  "dice.reset": "Default (d20)",
  "type.skills": "skills (legacy list)",
  "skills.convert": "Convert to property entries\u2026",
  "skills.convertBtn": "Convert",
  "skills.convertDesc": "Replace this list with one derived number property per row. Proficiency becomes a togglable influence backed by a list property; sources stay referenced by name.",
  "skills.convertConfirm": "Convert this skills list into individual derived property entries? The rows of the current note (or the preset) define the new entries; the record property itself is left untouched.",
  "skills.convertEmpty": "No rows to convert.",
  "skills.convertDone": "Created {n} property entries.",
  "skills.convertKeySuffix": "{name} Save",
  "skills.convertProfProperty": "Proficiency Bonus",
  "skills.convertProfList": "{name} Proficiencies",
  "skills.empty": "No skills yet.",
  "skills.addMenu": "Add skills\u2026",
  "skills.addSkill": "+ add skill",
  "skills.newSkill": "New skill\u2026",
  "skills.newSkillPrompt": "Skill name",
  "skills.proficientHint": "Proficient",
  "skills.menu.addPreset": "Add preset: {name}",
  "skills.menu.setSource": "Set modifier source\u2026",
  "skills.menu.setDice": "Set dice\u2026",
  "skills.menu.clearOverride": "Clear modifier override",
  "skills.menu.moveUp": "Move up",
  "skills.menu.moveDown": "Move down",
  "skills.menu.remove": "Remove skill",
  "skills.options.heading": "Skills",
  "skills.options.editHint": "Rows are edited directly in the sidebar: click (or double-click outside edit mode) a name, source tag or modifier; right-click a row for dice, ordering and removal.",
  "skills.options.sourceMode": "Modifier from source",
  "skills.options.modeValue": "Source value as-is",
  "skills.options.modeAbilityMod": "Ability modifier ((value \u2212 10) / 2)",
  "skills.options.profMode": "Proficiency bonus",
  "skills.options.profNone": "None",
  "skills.options.profLevel": "From a level property",
  "skills.options.profFixed": "Fixed value",
  "skills.options.profSource": "Level property",
  "skills.options.profFixedValue": "Bonus",
  "skills.options.presets": "Skill presets",
  "skills.options.addPreset": "Add"
};
var rollingDe = {
  "roll.featureName": "W\xFCrfel & W\xFCrfe",
  "roll.featureDesc": "W\xFCrfeln-Schaltfl\xE4chen an Eigenschaften, konfigurierbare W\xFCrfel (W2\u2013W100 oder eigene), das Wurfprotokoll und der Fertigkeiten-Datentyp.",
  "roll.roll": "W\xFCrfeln",
  "roll.rolls": "W\xFCrfe",
  "roll.checkLabel": "{name}-Probe",
  "roll.tagAdvantage": "(Vorteil)",
  "roll.tagDisadvantage": "(Nachteil)",
  "roll.modeHint": "Wurfmodus \u2014 gilt f\xFCr alle W\xFCrfeln-Schaltfl\xE4chen",
  "roll.modeDisadvantage": "Nachteil",
  "roll.modeNormal": "Normal",
  "roll.modeAdvantage": "Vorteil",
  "roll.logEmpty": "Wurfergebnisse erscheinen hier.",
  "roll.options.heading": "W\xFCrfeln",
  "roll.options.rollButton": "W\xFCrfeln-Schaltfl\xE4che",
  "roll.options.rollButtonDesc": "W\xFCrfelt die W\xFCrfel plus den Modifikator dieses Eintrags (siehe Modifikator oben)",
  "dice.die": "W\xFCrfel",
  "dice.dieDesc": "Vordefinierter W\xFCrfel, oder eigene Gr\xF6\xDFe daneben eintragen",
  "dice.custom": "Eigene\u2026",
  "dice.customSize": "Eigene W\xFCrfelgr\xF6\xDFe\u2026",
  "dice.customSizePrompt": "W\xFCrfelgr\xF6\xDFe (Anzahl Seiten)",
  "dice.customSizeShort": "Gr\xF6\xDFe",
  "dice.count": "Anzahl W\xFCrfel\u2026",
  "dice.countPrompt": "Anzahl W\xFCrfel",
  "dice.countLabel": "Anzahl W\xFCrfel",
  "dice.reset": "Standard (W20)",
  "type.skills": "Fertigkeiten (Legacy-Liste)",
  "skills.convert": "In Eigenschafts-Eintr\xE4ge umwandeln\u2026",
  "skills.convertBtn": "Umwandeln",
  "skills.convertDesc": "Ersetzt diese Liste durch je eine abgeleitete Zahlen-Eigenschaft pro Zeile. \xDCbung wird zu einem umschaltbaren Einfluss mit Listen-Eigenschaft; Quellen bleiben namentlich referenziert.",
  "skills.convertConfirm": "Diese Fertigkeitenliste in einzelne abgeleitete Eigenschafts-Eintr\xE4ge umwandeln? Die Zeilen der aktuellen Notiz (oder der Vorlage) bestimmen die neuen Eintr\xE4ge; die Listen-Eigenschaft selbst bleibt unver\xE4ndert.",
  "skills.convertEmpty": "Keine Zeilen zum Umwandeln.",
  "skills.convertDone": "{n} Eigenschafts-Eintr\xE4ge erstellt.",
  "skills.convertKeySuffix": "{name} Save",
  "skills.convertProfProperty": "Proficiency Bonus",
  "skills.convertProfList": "{name} Proficiencies",
  "skills.empty": "Noch keine Fertigkeiten.",
  "skills.addMenu": "Fertigkeiten hinzuf\xFCgen\u2026",
  "skills.addSkill": "+ Fertigkeit hinzuf\xFCgen",
  "skills.newSkill": "Neue Fertigkeit\u2026",
  "skills.newSkillPrompt": "Name der Fertigkeit",
  "skills.proficientHint": "Ge\xFCbt",
  "skills.menu.addPreset": "Vorlage hinzuf\xFCgen: {name}",
  "skills.menu.setSource": "Modifikator-Quelle festlegen\u2026",
  "skills.menu.setDice": "W\xFCrfel festlegen\u2026",
  "skills.menu.clearOverride": "Modifikator-\xDCberschreibung entfernen",
  "skills.menu.moveUp": "Nach oben",
  "skills.menu.moveDown": "Nach unten",
  "skills.menu.remove": "Fertigkeit entfernen",
  "skills.options.heading": "Fertigkeiten",
  "skills.options.editHint": "Zeilen werden direkt in der Seitenleiste bearbeitet: Name, Quellen-K\xFCrzel oder Modifikator anklicken (au\xDFerhalb des Bearbeitungsmodus doppelklicken); Rechtsklick f\xFCr W\xFCrfel, Reihenfolge und Entfernen.",
  "skills.options.sourceMode": "Modifikator aus der Quelle",
  "skills.options.modeValue": "Quellwert unver\xE4ndert",
  "skills.options.modeAbilityMod": "Attributsmodifikator ((Wert \u2212 10) / 2)",
  "skills.options.profMode": "\xDCbungsbonus",
  "skills.options.profNone": "Keiner",
  "skills.options.profLevel": "Aus einer Stufen-Eigenschaft",
  "skills.options.profFixed": "Fester Wert",
  "skills.options.profSource": "Stufen-Eigenschaft",
  "skills.options.profFixedValue": "Bonus",
  "skills.options.presets": "Fertigkeiten-Vorlagen",
  "skills.options.addPreset": "Hinzuf\xFCgen"
};

// src/features/rolling/index.ts
var rollingModule = {
  id: "rolling",
  name: (i18n) => i18n.t("roll.featureName"),
  description: (i18n) => i18n.t("roll.featureDesc"),
  register(ctx) {
    ctx.i18n.register("en", rollingEn);
    ctx.i18n.register("de", rollingDe);
    ctx.registries.valueTypes.add(skillsType);
    ctx.registries.entryKinds.add(rollsKind);
    ctx.registries.clusterAddons.add(rollAddon);
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
  return { id: genId(), kind: "prop", key, ...extra };
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
var savesPreset = {
  id: "dnd5e-saves",
  name: (i18n) => i18n.t("dnd.savingThrows"),
  records: () => ABILITIES.map((a) => ({ name: a.key, source: a.key })),
  legacyProfKey: SAVE_PROF_KEY
};
var skillsPreset = {
  id: "dnd5e-skills",
  name: (i18n) => i18n.t("dnd.skills"),
  records: () => SKILLS.map((s) => ({ name: s.name, source: s.ability })),
  legacyProfKey: SKILL_PROF_KEY
};
var builders = {
  rolls: (i18n) => ({
    id: "rolls",
    title: i18n.t("dnd.tpl.contents"),
    columns: 2,
    layoutMode: "columns",
    sticky: true,
    collapsible: true,
    entries: [{ id: genId(), kind: "toc" }, { id: genId(), kind: "rolls" }]
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
      prop("Armor Class", { dataType: "number", min: 0, max: 40 }),
      prop("Speed", { dataType: "number", min: 0, max: 200 }),
      prop("Current HP", { dataType: "number", min: 0, max: 9999 }),
      prop("Max HP", { dataType: "number", min: 0, max: 9999 }),
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
  })
};
var TEMPLATE_ORDER = ["rolls", "details", "vitals", "abilities", "saves", "skills"];
var TEMPLATE_NAMES = {
  rolls: "dnd.tpl.contents",
  details: "dnd.tpl.details",
  vitals: "dnd.tpl.vitals",
  abilities: "dnd.tpl.abilities",
  saves: "dnd.savingThrows",
  skills: "dnd.skills"
};
var NEEDS_SOURCES = /* @__PURE__ */ new Set(["vitals", "saves", "skills"]);
function sectionTemplates() {
  return TEMPLATE_ORDER.map((id) => ({
    id,
    name: (i18n) => i18n.t(TEMPLATE_NAMES[id]),
    build: (i18n) => builders[id](i18n),
    sources: NEEDS_SOURCES.has(id) ? () => rollSources() : void 0
  }));
}
var characterPreset = {
  id: "dnd5e-character",
  name: (i18n) => i18n.t("dnd.presetName"),
  build: (i18n) => ({
    version: LAYOUT_VERSION,
    sections: TEMPLATE_ORDER.map((id) => builders[id](i18n))
  })
};

// src/features/dnd5e/strings.ts
var dndEn = {
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
  "dnd.tpl.abilities": "Ability scores"
};
var dndDe = {
  "dnd.featureName": "D&D-5e-Charakterbogen",
  "dnd.featureDesc": "Charakterbogen-Vorlagen, Attributswerte, 5e-Vorlagen f\xFCr Rettungsw\xFCrfe & Fertigkeiten, \xDCbungsbonus und Initiative.",
  "dnd.presetName": "D&D-5e-Charakter",
  "dnd.proficiency": "\xDCbungsbonus",
  "dnd.initiative": "Initiative",
  "dnd.savingThrows": "Rettungsw\xFCrfe",
  "dnd.skills": "Fertigkeiten",
  "dnd.tpl.contents": "Inhalt",
  "dnd.tpl.details": "Details",
  "dnd.tpl.vitals": "Vitalwerte",
  "dnd.tpl.abilities": "Attributswerte"
};

// src/features/dnd5e/index.ts
var dnd5eModule = {
  id: "dnd5e",
  name: (i18n) => i18n.t("dnd.featureName"),
  description: (i18n) => i18n.t("dnd.featureDesc"),
  register(ctx) {
    ctx.i18n.register("en", dndEn);
    ctx.i18n.register("de", dndDe);
    ctx.registries.skillPresets.add(savesPreset);
    ctx.registries.skillPresets.add(skillsPreset);
    for (const tpl of sectionTemplates()) ctx.registries.sectionTemplates.add(tpl);
    ctx.registries.layoutPresets.add(characterPreset);
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
    let changed = false;
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

// src/main.ts
var FEATURE_MODULES = [rollingModule, dnd5eModule];
var ExtendedPropertiesPlugin = class extends import_obsidian27.Plugin {
  constructor() {
    super(...arguments);
    this.i18n = new I18n();
    this.registries = new Registries();
  }
  /** All known feature modules (enabled or not) — the settings tab lists them. */
  get featureModules() {
    return FEATURE_MODULES;
  }
  async onload() {
    var _a;
    this.props = new PropertyIndex(this.app);
    registerDiceIcons();
    this.i18n.register("en", coreEn, "English");
    this.i18n.register("de", coreDe, "Deutsch");
    const data = await this.loadData();
    this.settings = normalizeSettings(data, () => ({ version: 4, sections: [] }));
    this.rebuildRegistries();
    this.settings = normalizeSettings(data, () => this.defaultLayout());
    this.i18n.setLocale(this.settings.language);
    this.i18n.setOverrides(this.settings.stringOverrides);
    let migrated = false;
    for (const mod of FEATURE_MODULES) {
      if (this.settings.features[mod.id] !== false && ((_a = mod.migrate) == null ? void 0 : _a.call(mod, this.settings))) migrated = true;
    }
    this.hide = new HideService({
      settings: this.settings,
      save: () => this.saveSettings(),
      refreshViews: () => this.refreshViews()
    });
    this.register(this.hide.install());
    if (migrated) await this.saveSettings();
    this.registerView(VIEW_TYPE, (leaf) => new SidebarView(leaf, this));
    this.addRibbonIcon("panel-right", this.i18n.t("command.openSidebar"), () => this.activateView());
    this.addCommand({
      id: "open-character-sidebar",
      name: this.i18n.t("command.openSidebar"),
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "hide-property-from-obsidian",
      name: this.i18n.t("command.hideProperty"),
      callback: () => new TextPromptModal(this.app, this.i18n, this.i18n.t("settings.hidePromptTitle"), "", (v) => {
        const k = v.trim();
        if (!k) return;
        this.hide.hideKey(k);
        new import_obsidian27.Notice(this.i18n.t("notice.hiding", { key: k }));
      }, () => this.props.knownProps()).open()
    });
    this.addSettingTab(new EPSettingTab(this.app, this));
    const refresh = (file) => {
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
        const v = leaf.view;
        if (v instanceof SidebarView) v.maybeRefresh(file);
      }
    };
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => refresh()));
    this.registerEvent(this.app.workspace.on("file-open", () => refresh()));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => refresh(file)));
    const host = { app: this.app, i18n: this.i18n, settings: this.settings, hide: this.hide };
    this.registerDomEvent(
      document,
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
    this.registerDomEvent(document, "contextmenu", (e) => {
      var _a2;
      if (!this.settings.propMenu) return;
      const target = e.target;
      if (!((_a2 = target == null ? void 0 : target.closest) == null ? void 0 : _a2.call(target, ".metadata-properties-heading"))) return;
      window.setTimeout(() => augmentPropsMenu(host), 0);
    });
  }
  // -- registries -------------------------------------------------------------
  /** (Re)build all registries from core + enabled feature modules. */
  rebuildRegistries() {
    this.registries.clear();
    const ctx = { i18n: this.i18n, registries: this.registries };
    registerCore(ctx);
    for (const mod of FEATURE_MODULES) {
      if (this.settings.features[mod.id] !== false) mod.register(ctx);
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
    await this.saveData(this.settings);
    this.hide.update();
  }
  ensureLayout(typeKey) {
    var _a;
    if (!((_a = this.settings.layouts[typeKey]) == null ? void 0 : _a.sections)) this.settings.layouts[typeKey] = this.defaultLayout();
    return this.settings.layouts[typeKey];
  }
  resetLayout(typeKey) {
    this.settings.layouts[typeKey] = this.defaultLayout();
    this.saveSettings();
    this.refreshViews();
  }
  refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const v = leaf.view;
      if (v instanceof SidebarView) v.render();
    }
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
    workspace.revealLeaf(leaf);
  }
};
