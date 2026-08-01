/**
 * Activation outside edit mode. Every surface carries its own setting, and the
 * default is the double click every existing vault already has - a stored
 * value only ever means "this one was changed".
 */

import { describe, expect, it } from "vitest";
import {
  ACTIVATION_SURFACES,
  activationFor,
  setActivation,
  type ActivationSurface,
} from "../src/core/activation";
import { normalizeSettings } from "../src/core/settings";
import type { Layout } from "../src/core/model";

const layout = (): Layout => ({ version: 6, sections: [] }) as unknown as Layout;

describe("activationFor", () => {
  it("defaults every surface to double click", () => {
    for (const s of ACTIVATION_SURFACES) expect(activationFor({}, s)).toBe("double");
  });

  it("reads a stored single-click choice", () => {
    expect(activationFor({ activation: { values: "single" } }, "values")).toBe("single");
    // Surfaces are independent.
    expect(activationFor({ activation: { values: "single" } }, "checkboxes")).toBe("double");
  });

  it("treats anything unrecognized as the default", () => {
    expect(activationFor({ activation: { values: "triple" } }, "values")).toBe("double");
  });
});

describe("setActivation", () => {
  it("stores single and forgets double", () => {
    const s: { activation?: Record<string, string> } = {};
    setActivation(s, "values", "single");
    expect(s.activation).toEqual({ values: "single" });
    setActivation(s, "values", "double");
    expect(s.activation).toEqual({});
    expect(activationFor(s, "values")).toBe("double");
  });

  it("leaves other surfaces alone", () => {
    const s: { activation?: Record<string, string> } = {};
    for (const surface of ["values", "table"] as ActivationSurface[]) setActivation(s, surface, "single");
    setActivation(s, "values", "double");
    expect(s.activation).toEqual({ table: "single" });
  });
});

describe("persistence", () => {
  it("round-trips single-click surfaces and drops anything else", () => {
    const s = normalizeSettings({ activation: { values: "single", table: "double", junk: 7 } }, layout);
    expect(s.activation).toEqual({ values: "single" });
  });

  it("stores nothing when every surface is default", () => {
    const s = normalizeSettings({ activation: { values: "double" } }, layout);
    expect(s.activation).toBeUndefined();
    expect(activationFor(s, "values")).toBe("double");
  });

  it("survives a vault that has never seen the setting", () => {
    const s = normalizeSettings({}, layout);
    expect(s.activation).toBeUndefined();
    for (const surface of ACTIVATION_SURFACES) expect(activationFor(s, surface)).toBe("double");
  });
});
