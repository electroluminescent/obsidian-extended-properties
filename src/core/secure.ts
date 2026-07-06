/**
 * Opt-in, user-initiated encryption of sensitive property values (roadmap L1).
 *
 * A value is encrypted into a self-describing envelope string -
 * `ep-enc:1:<salt>:<iv>:<ciphertext>` (all base64) - stored in place of the
 * plaintext in the note's frontmatter. Encryption is AES-256-GCM with a key
 * derived from a session passphrase via PBKDF2; GCM's authentication tag means
 * a wrong passphrase fails loudly (it never returns garbage), so decryption
 * failure is always non-destructive - the ciphertext is left untouched and the
 * value simply shows as locked.
 *
 * IMPORTANT (lockout): the passphrase is held only in memory for the session
 * and is never written anywhere. If it is lost, encrypted values cannot be
 * recovered. The UI warns about this before the first encryption.
 *
 * Pure (Web Crypto only, no Obsidian) so the round-trip is unit-tested. Web
 * Crypto is present in the Obsidian (Electron) renderer and in Node >= 20.
 */

const PREFIX = "ep-enc:1:";
const ITERATIONS = 150_000;

const subtle = (): SubtleCrypto => {
  const c = window.crypto;
  if (!c?.subtle) throw new Error("Web Crypto unavailable");
  return c.subtle;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await subtle().importKey("raw", textEncoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** True when `v` is one of our encryption envelopes. */
export function isEnvelope(v: unknown): v is string {
  return typeof v === "string" && v.startsWith(PREFIX);
}

/** Encrypt `plain` under `passphrase`, returning a self-describing envelope. */
export async function encryptValue(plain: string, passphrase: string): Promise<string> {
  const c = window.crypto;
  const salt = c.getRandomValues(new Uint8Array(16));
  const iv = c.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plain)));
  return PREFIX + toB64(salt) + ":" + toB64(iv) + ":" + toB64(ct);
}

/** Decrypt an envelope; throws on a malformed envelope or wrong passphrase. */
export async function decryptValue(envelope: string, passphrase: string): Promise<string> {
  if (!isEnvelope(envelope)) throw new Error("not an Extended Properties envelope");
  const parts = envelope.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("malformed envelope");
  const key = await deriveKey(passphrase, fromB64(parts[0]));
  const pt = await subtle().decrypt({ name: "AES-GCM", iv: fromB64(parts[1]) }, key, fromB64(parts[2]));
  return textDecoder.decode(pt);
}

/**
 * Session-scoped passphrase + decrypted-value cache. The passphrase lives only
 * here, in memory, for the lifetime of the unlock. `reveal` is the synchronous
 * read the renderers use; `prime` fills the cache asynchronously after an
 * unlock so display can flip from masked to plaintext on the next refresh.
 */
export class SecretStore {
  private pass: string | null = null;
  private cache = new Map<string, string>();

  isUnlocked(): boolean {
    return this.pass !== null;
  }

  /** Begin a session with `passphrase`; drops any previously decrypted values. */
  unlock(passphrase: string): void {
    this.pass = passphrase;
    this.cache.clear();
  }

  /** End the session: forget the passphrase and every decrypted value. */
  lock(): void {
    this.pass = null;
    this.cache.clear();
  }

  /** Synchronous, cache-only plaintext for an envelope (null if not decrypted). */
  reveal(envelope: string): string | null {
    return this.cache.get(envelope) ?? null;
  }

  /** Encrypt `plain` for storage, caching the round-trip for instant display. */
  async encrypt(plain: string): Promise<string> {
    if (this.pass === null) throw new Error("locked");
    const env = await encryptValue(plain, this.pass);
    this.cache.set(env, plain);
    return env;
  }

  /** Decrypt an envelope (memoized); throws on a wrong passphrase. */
  async decrypt(envelope: string): Promise<string> {
    if (this.pass === null) throw new Error("locked");
    const hit = this.cache.get(envelope);
    if (hit !== undefined) return hit;
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
  async prime(values: Iterable<unknown>): Promise<number> {
    if (this.pass === null) return 0;
    let n = 0;
    for (const v of values) {
      if (isEnvelope(v) && !this.cache.has(v)) {
        try {
          this.cache.set(v, await decryptValue(v, this.pass));
          n++;
        } catch {
          /* leave masked */
        }
      }
    }
    return n;
  }
}
