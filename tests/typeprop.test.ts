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

describe("tintTypeNames (fake DOM)", () => {
  // Minimal stand-ins for the few DOM APIs the helper touches.
  class FakeText {
    parentElement: FakeEl | null = null;
    constructor(public nodeValue: string) {}
    replaceWith(frag: FakeFrag): void {
      const p = this.parentElement;
      if (!p) return;
      const i = p.children.indexOf(this);
      p.children.splice(i, 1, ...frag.children);
      for (const c of frag.children) c.parentElement = p;
    }
  }
  class FakeFrag {
    children: (FakeText | FakeEl)[] = [];
    appendText(t: string): void {
      this.children.push(new FakeText(t));
    }
    createSpan(o: { cls: string; text: string }): FakeEl {
      const e = new FakeEl("span", o.cls);
      e.children.push(new FakeText(o.text));
      this.children.push(e);
      return e;
    }
  }
  class FakeEl {
    children: (FakeText | FakeEl)[] = [];
    constructor(public tag: string, public cls = "") {}
    get text(): string {
      return this.children.map((c) => (c instanceof FakeText ? c.nodeValue : c.text)).join("");
    }
    matchesSkip(sel: string): boolean {
      return sel.split(", ").some((s) => (s.startsWith(".") ? this.cls.split(" ").includes(s.slice(1)) : this.tag === s));
    }
    closest(sel: string): FakeEl | null {
      let n: FakeEl | null = this;
      while (n) {
        if (n.matchesSkip(sel)) return n;
        n = n.parentEl;
      }
      return null;
    }
    parentEl: FakeEl | null = null;
    add(child: FakeText | FakeEl): void {
      this.children.push(child);
      if (child instanceof FakeText) child.parentElement = this;
      else child.parentEl = this;
    }
    texts(): FakeText[] {
      const out: FakeText[] = [];
      for (const c of this.children) {
        if (c instanceof FakeText) out.push(c);
        else out.push(...c.texts());
      }
      return out;
    }
  }

  /** The helper's core: split a text node's value on the name. */
  const tint = (root: FakeEl, name: string): void => {
    const re = new RegExp("\\b" + name + "\\b", "gi");
    const SKIP = "input, textarea, select, code, pre, .ep-typename, .ep-type-badge, .ep-title";
    for (const text of root.texts()) {
      const value = text.nodeValue;
      if (!re.test(value)) continue;
      re.lastIndex = 0;
      if (text.parentElement?.closest(SKIP)) continue;
      const frag = new FakeFrag();
      let last = 0;
      re.lastIndex = 0;
      for (let m = re.exec(value); m; m = re.exec(value)) {
        if (m.index > last) frag.appendText(value.slice(last, m.index));
        frag.createSpan({ cls: "ep-typename", text: m[0] });
        last = m.index + m[0].length;
      }
      if (last < value.length) frag.appendText(value.slice(last));
      text.replaceWith(frag);
    }
  };

  const spans = (root: FakeEl): FakeEl[] =>
    root.children.flatMap((c) => (c instanceof FakeEl ? (c.cls === "ep-typename" ? [c] : spans(c)) : []));

  it("tints the name in prose and preserves the sentence", () => {
    const root = new FakeEl("div", "setting-item-description");
    root.add(new FakeText("Save each Category's layout as a file."));
    tint(root, "Category");
    expect(spans(root).length).toBe(1);
    expect(spans(root)[0].text).toBe("Category");
    expect(root.text).toBe("Save each Category's layout as a file.");
  });

  it("leaves fields, code and the chip alone", () => {
    for (const [tag, cls] of [["input", ""], ["code", ""], ["span", "ep-type-badge"]] as const) {
      const root = new FakeEl("div");
      const holder = new FakeEl(tag, cls);
      holder.add(new FakeText("Category"));
      root.add(holder);
      tint(root, "Category");
      expect(spans(root).length).toBe(0);
    }
  });

  it("is idempotent: a second pass adds nothing", () => {
    const root = new FakeEl("p");
    root.add(new FakeText("Add a Category"));
    tint(root, "Category");
    tint(root, "Category");
    expect(spans(root).length).toBe(1);
  });
});
