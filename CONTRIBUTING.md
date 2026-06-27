# Contributing

## Translating Extended Properties

UI strings live as **JSON data**, with English as the reference schema:

| File | Owns |
| --- | --- |
| `src/i18n/locales/en.json` | core UI strings |
| `src/features/rolling/strings.json` | dice / rolls module |
| `src/features/dnd5e/strings.json` | D&D 5e module |
| `src/features/inline/strings.json` | inline rolls / properties module |

To add a language (e.g. French, `fr`):

1. Copy each English file to its locale sibling and translate the **values** only (keep the keys and any `{placeholder}` tokens):
   - `src/i18n/locales/en.json` → `src/i18n/locales/fr.json`
   - `src/features/<mod>/strings.json` → `src/features/<mod>/strings.fr.json`
2. Register the dictionaries in `src/main.ts` / each module's `index.ts` via `i18n.register("fr", <dict>, "Français")` (mirroring the English registration), importing the JSON.
3. Run the parity check and fix anything it reports:
   ```bash
   npm run i18n
   ```
   It verifies every English key is present, flags unknown keys, and checks that `{placeholder}` tokens match. CI runs the same check.

You don't have to translate everything at once — missing keys fall back to English at runtime (resolution order: per-string override → active locale → English → humanized key). The parity check lists what's still missing.

> German (`de`) was retired in v2.41.0; the loader and override editor remain, so a community dictionary can be slotted back in at any time.

## Development

See the README's *Development* section for build/test commands. In short: `npm install --legacy-peer-deps`, then `npm run typecheck`, `npm test`, `npm run i18n`, `npm run build`.
