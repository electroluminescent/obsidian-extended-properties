import esbuild from "esbuild";

const production = process.argv.includes("production");

esbuild
  .build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian", "electron"],
    format: "cjs",
    target: "es2018",
    outfile: "main.js",
    sourcemap: false,
    // Keep output readable so it can be edited by hand if desired.
    minify: false,
    logLevel: "info",
  })
  .catch(() => process.exit(1));
