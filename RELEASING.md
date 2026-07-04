# Releasing & community submission

This is the maintainer guide for cutting releases and (eventually) submitting to
Obsidian's community plugin directory. The plumbing - CI, a tag-triggered release
workflow, `LICENSE`, `.gitignore`, `versions.json` discipline - is already in the
repo; this document is the runbook.

> Repo: <https://github.com/electroluminescent/obsidian-extended-properties>.

## 1. Local development

```bash
npm install --legacy-peer-deps   # obsidian pins @codemirror/state
npm run typecheck                # tsc --noEmit (strict)
npm test                         # vitest over the pure modules
npm run build                    # esbuild -> main.js
```

CI (`.github/workflows/test.yml`) runs typecheck -> test -> build on every push and
PR, so the same three gates protect `main`.

## 2. Cut a release

The version lives in three files (`package.json`, `manifest.json`, `versions.json`);
`npm version` keeps them in sync via `version-bump.mjs`:

```bash
npm version patch        # or: minor | major  -> bumps all three, commits, tags
git push --follow-tags
```

Pushing a `MAJOR.MINOR.PATCH` tag triggers `.github/workflows/release.yml`, which
type-checks, tests, builds, verifies the tag equals `manifest.json`'s version, and
opens a **draft** GitHub Release with `main.js`, `manifest.json`, `styles.css`, and
the full project zip attached. Review the draft, then publish it.

> The build artifact `main.js` is committed to the repo as well, so manual and BRAT
> installs work straight from the latest release.
>
> Vault-local `data.json` is git-ignored (along with `backups/`), so it is never
> tracked or shipped in a release - an update can't overwrite a user's live
> settings and layouts.

## 3. Install paths (also in the README)

- **Manual:** copy `main.js`, `manifest.json`, `styles.css` from the release into
  `<vault>/.obsidian/plugins/extended-properties/` and enable the plugin.
- **BRAT (beta):** install [BRAT](https://github.com/TfTHacker/obsidian42-brat),
  then *Add beta plugin* with `https://github.com/electroluminescent/obsidian-extended-properties`.
  BRAT tracks the latest GitHub release - no community listing required.

## 4. Community plugin submission

Once the repo is public and at least one published (non-draft) release exists with
the three assets attached, submit to the directory:

1. `authorUrl` is already set in `manifest.json`; optionally add `fundingUrl`
   too - optional for review but recommended.
2. Fork [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases)
   and add this entry to the **end** of `community-plugins.json`:

   ```json
   {
     "id": "extended-properties",
     "name": "Extended Properties",
     "author": "electroluminescent",
     "description": "A configurable properties sidebar with rich value types, derived numbers, dice rolling, inline rolls/properties, and per-type layouts.",
     "repo": "electroluminescent/obsidian-extended-properties"
   }
   ```

3. Open the PR and work through the automated review bot + maintainer feedback.

### Review checklist (current state)

- [x] `id` is unique and matches `manifest.json` (`extended-properties`).
- [x] No `innerHTML` / `outerHTML` / `insertAdjacentHTML` - DOM is built with
  Obsidian's `createEl`/`createDiv` helpers.
- [x] `console.*` only inside error `catch` blocks (not routine logging).
- [x] `isDesktopOnly: false` and the plugin is verified to work on mobile
  (touch menus, scroll-safe sliders, bottom-sheet modals).
- [x] MIT `LICENSE` present.
- [x] `manifest.json` has `id`, `name`, `version`, `minAppVersion`, `description`,
  `author`, `isDesktopOnly`.
- [x] `authorUrl` set (`https://github.com/electroluminescent/obsidian-extended-properties`); `fundingUrl` optional - add if desired.
- [ ] Repo pushed public with a published release.

### Developer-policy compliance ([policy](https://docs.obsidian.md/Developer+policies))

- [x] No obfuscation - `main.js` is a plain esbuild bundle of the public TS source.
- [x] No dynamic or static ads anywhere.
- [x] No client-side telemetry / analytics - the plugin makes no network calls at
  all (verified: no `fetch` / `requestUrl` / `XMLHttpRequest` / `WebSocket` /
  `sendBeacon` in `src/`).
- [x] No plugin self-update mechanism and no remote code execution.
- [x] No network use by the plugin itself; the Image / Iframe value types render
  only user-entered URLs (browser-level), disclosed under *Privacy & network use*
  in the README.
- [x] No file access outside the vault (note frontmatter plus the plugin folder's
  `data.json` / layouts / snapshots / backups only).
- [x] No payment or account required; every feature works offline.
- [x] MIT `LICENSE` present and indicated (README + `package.json`); no bundled
  third-party runtime code (no runtime `dependencies`), so no attribution owed.
- [x] "Obsidian" trademark used only descriptively; the plugin is named "Extended
  Properties" (the `obsidian-` repo prefix is the recommended community convention).
