/**
 * The interface renders the user's configured type property wherever the
 * note-type concept is named: t() resolves {typeProp} globally, so a string
 * never has to be threaded through a special call site.
 */

import { describe, expect, it } from "vitest";
import { I18n } from "../src/i18n/i18n";
import en from "../src/i18n/locales/en.json";

describe("typeProp substitution", () => {
  it("renders the configured property name in every parameterized string", () => {
    const i18n = new I18n();
    i18n.register("en", en as Record<string, string>, "English");
    i18n.setTypeProp(() => "Category");
    expect(i18n.t("settings.layoutVaultDesc")).toContain("Save each Category's layout");
    expect(i18n.t("settings.addType")).toBe("Add a Category");
    expect(i18n.t("settings.typesHeading")).toBe("Category");
    expect(i18n.t("view.createType")).toBe("+ New Category");
    expect(i18n.t("command.openTable")).toBe("Open Category table");
    // A string with its own vars still resolves both.
    expect(i18n.t("view.noType", { note: "N" })).toBe('"N" has no matching Category.');
  });
  it("falls back to Type when the setting is unset", () => {
    const i18n = new I18n();
    i18n.register("en", en as Record<string, string>, "English");
    expect(i18n.t("settings.addType")).toBe("Add a Type");
  });
});
