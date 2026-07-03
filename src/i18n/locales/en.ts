/**
 * English - the reference dictionary. The strings live as data in `en.json`
 * (F4: i18n as data) so they can be type-checked, diffed and translated without
 * touching code; this file is just the typed loader. Other locales fall back to
 * these texts for missing keys.
 */
import type { StringDict } from "../i18n";
import data from "./en.json";

export const coreEn = data as StringDict;
