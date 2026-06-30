import { describe, it, expect } from "vitest";
import { restoreFromSnapshot } from "../src/utils/misc";

describe("restoreFromSnapshot (hardening)", () => {
  it("replaces the target's keys with the snapshot's", () => {
    const target: Record<string, unknown> = { a: 1, b: 2 };
    restoreFromSnapshot(target, JSON.stringify({ b: 9, c: 3 }));
    expect(target).toEqual({ b: 9, c: 3 });
  });

  it("leaves the target unchanged on a corrupt snapshot (does not throw)", () => {
    const target: Record<string, unknown> = { a: 1 };
    expect(() => restoreFromSnapshot(target, "{ not valid json ]")).not.toThrow();
    expect(target).toEqual({ a: 1 });
  });

  it("ignores a non-object snapshot", () => {
    const target: Record<string, unknown> = { a: 1 };
    restoreFromSnapshot(target, "42");
    expect(target).toEqual({ a: 1 });
    restoreFromSnapshot(target, "null");
    expect(target).toEqual({ a: 1 });
  });
});
