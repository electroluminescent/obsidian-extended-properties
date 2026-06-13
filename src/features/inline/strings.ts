/** Locale strings owned by the inline (note-body) feature. */

import type { StringDict } from "../../i18n/i18n";

export const inlineEn: StringDict = {
  "inline.featureName": "Inline rolls & properties",
  "inline.featureDesc":
    "Render `roll: 2d6+DEX` as a clickable roll and `prop: Strength` as a live, editable value in note bodies (reading mode), plus an `ep-sheet` code block that projects a note-type section.",
  "inline.rollHint": "Click to roll · {expr}",
  "inline.rollInvalid": "Invalid roll expression.",
  "inline.propHint": "{key} — click to edit",
  "inline.editSource": "Edit source",
  "inline.editValue": "Edit {prop} value",
  "inline.empty": "—",
  "inline.sheetNoType": "ep-sheet: this note has no matching type.",
  "inline.sheetEmpty": "ep-sheet: nothing to show.",
};

export const inlineDe: StringDict = {
  "inline.featureName": "Inline-Würfe & Eigenschaften",
  "inline.featureDesc":
    "Stellt `roll: 2d6+DEX` als anklickbaren Wurf und `prop: Stärke` als lebenden, bearbeitbaren Wert im Notiztext dar (Lesemodus), plus einen `ep-sheet`-Codeblock, der einen Abschnitt des Notiztyps projiziert.",
  "inline.rollHint": "Zum Würfeln klicken · {expr}",
  "inline.rollInvalid": "Ungültiger Wurf-Ausdruck.",
  "inline.propHint": "{key} — zum Bearbeiten klicken",
  "inline.editSource": "Quelle bearbeiten",
  "inline.editValue": "Wert von {prop} bearbeiten",
  "inline.empty": "—",
  "inline.sheetNoType": "ep-sheet: Diese Notiz hat keinen passenden Typ.",
  "inline.sheetEmpty": "ep-sheet: Nichts anzuzeigen.",
};
