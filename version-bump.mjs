/**
 * Sync manifest.json + versions.json to package.json's version.
 *
 * Run automatically by `npm version <patch|minor|major>` (see the "version"
 * script in package.json), so a release is a single command:
 *
 *   npm version minor   # bumps package.json, manifest.json, versions.json
 *   git push --follow-tags   # the Release workflow publishes a draft
 *
 * Keeps the versions.json discipline the community-release process expects:
 * every plugin version maps to the minimum Obsidian version it supports.
 */
import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;
if (!targetVersion) {
  console.error("version-bump: run via `npm version` (npm_package_version unset).");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const minAppVersion = manifest.minAppVersion;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, 2) + "\n");

const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, 2) + "\n");

console.log(`version-bump: set manifest + versions to ${targetVersion} (minAppVersion ${minAppVersion}).`);
