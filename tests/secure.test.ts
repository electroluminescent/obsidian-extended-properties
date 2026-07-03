import { describe, it, expect } from "vitest";
import { encryptValue, decryptValue, isEnvelope, SecretStore } from "../src/core/secure";

describe("secure (AES-GCM round-trip)", () => {
  it("round-trips a value with the right passphrase", async () => {
    const env = await encryptValue("hunter2 - secret", "correct horse");
    expect(isEnvelope(env)).toBe(true);
    expect(env).not.toContain("hunter2");
    expect(await decryptValue(env, "correct horse")).toBe("hunter2 - secret");
  });

  it("rejects a wrong passphrase (never returns garbage)", async () => {
    const env = await encryptValue("top secret", "right");
    await expect(decryptValue(env, "wrong")).rejects.toBeTruthy();
  });

  it("uses a fresh salt/iv each time (different ciphertext for same input)", async () => {
    const a = await encryptValue("same", "pw");
    const b = await encryptValue("same", "pw");
    expect(a).not.toBe(b);
    expect(await decryptValue(a, "pw")).toBe("same");
    expect(await decryptValue(b, "pw")).toBe("same");
  });

  it("isEnvelope only matches our prefix", () => {
    expect(isEnvelope("ep-enc:1:a:b:c")).toBe(true);
    expect(isEnvelope("plain text")).toBe(false);
    expect(isEnvelope(42)).toBe(false);
    expect(isEnvelope(undefined)).toBe(false);
  });

  it("malformed envelopes throw rather than corrupt", async () => {
    await expect(decryptValue("ep-enc:1:only-one-part", "pw")).rejects.toBeTruthy();
  });
});

describe("SecretStore", () => {
  it("locks and unlocks, caching the round-trip for sync reveal", async () => {
    const s = new SecretStore();
    expect(s.isUnlocked()).toBe(false);
    s.unlock("pw");
    const env = await s.encrypt("value");
    expect(s.reveal(env)).toBe("value"); // cached from encrypt
    s.lock();
    expect(s.isUnlocked()).toBe(false);
    expect(s.reveal(env)).toBeNull();
  });

  it("primes envelopes into the cache and ignores undecryptable ones", async () => {
    const s = new SecretStore();
    s.unlock("pw");
    const env = await encryptValue("hello", "pw");
    const bad = await encryptValue("nope", "different");
    const n = await s.prime(["plain", env, bad]);
    expect(n).toBe(1);
    expect(s.reveal(env)).toBe("hello");
    expect(s.reveal(bad)).toBeNull();
  });

  it("throws when encrypting while locked", async () => {
    const s = new SecretStore();
    await expect(s.encrypt("x")).rejects.toBeTruthy();
  });
});
