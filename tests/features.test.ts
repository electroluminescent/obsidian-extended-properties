/**
 * Feature gating (settings.features): every optional value type and the
 * modifier system honor their toggle in registerCore, defaults keep
 * everything on, and disabled types leave the fallback path intact.
 */

import { describe, expect, it } from "vitest";
import { Registries } from "../src/core/registry";
import { registerCore } from "../src/ui/render/value-types/index";
import { defaultSettings } from "../src/core/settings";
import { TYPE_FEATURES, featureForType, featureOn } from "../src/core/features";
import { fakeI18n } from "./stubs/fake-app";

const build = (features: Record<string, boolean>): Registries => {
  const r = new Registries();
  const s = defaultSettings();
  s.features = features;
  registerCore({ i18n: fakeI18n, registries: r }, s);
  return r;
};

describe("feature gating (core registrations)", () => {
  it("defaults register every value type and the modifier addon", () => {
    const r = build({});
    for (const f of TYPE_FEATURES)
      for (const id of f.typeIds ?? []) expect(r.valueTypes.get(id), id).toBeTruthy();
    expect(r.valueTypes.get("text")).toBeTruthy();
    expect(r.valueTypes.get("number")).toBeTruthy();
    expect(r.clusterAddons.all().some((a) => a.id === "core.mods")).toBe(true);
  });

  it("each type feature removes exactly its own types", () => {
    for (const f of TYPE_FEATURES) {
      const r = build({ [f.id]: false });
      for (const id of f.typeIds ?? []) expect(r.valueTypes.get(id), id).toBeUndefined();
      // Everything else survives, including the fallback pair.
      expect(r.valueTypes.get("text")).toBeTruthy();
      expect(r.valueTypes.get("number")).toBeTruthy();
      for (const other of TYPE_FEATURES) {
        if (other.id === f.id) continue;
        for (const id of other.typeIds ?? []) expect(r.valueTypes.get(id), `${f.id} kept ${id}`).toBeTruthy();
      }
    }
  });

  it("disabling derived also removes the modifier system", () => {
    const r = build({ derived: false });
    expect(r.clusterAddons.all().some((a) => a.id === "core.mods")).toBe(false);
  });

  it("featureOn / featureForType agree with the catalog", () => {
    const s = defaultSettings();
    expect(featureOn(s, "media")).toBe(true);
    s.features["media"] = false;
    expect(featureOn(s, "media")).toBe(false);
    expect(featureForType("video")).toBe("media");
    expect(featureForType("derived")).toBe("derived");
    expect(featureForType("text")).toBeUndefined();
  });
});
