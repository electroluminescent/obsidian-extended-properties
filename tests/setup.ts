// Node test env: alias `window` to globalThis so modules reading `window.crypto`
// (src/core/secure.ts) resolve to Node's Web Crypto implementation.
const g = globalThis as { window?: unknown };
if (typeof g.window === "undefined") g.window = globalThis;
export {};
