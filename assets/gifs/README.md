# README GIFs & demos

Put demo clips for the main [README](../../README.md) here — `.gif` works best on
GitHub (it autoplays and loops inline); `.png` screenshots and `.mp4` are fine too.

## How to reference one

From the main `README.md`, use a repo-relative path:

```markdown
![Arranging a layout](assets/gifs/arrange-layout.gif)
```

Or, to control the width, use HTML:

```html
<img src="assets/gifs/dice-roll-3d.gif" alt="Rolling 3D dice" width="360">
```

## Tips

- **Name them descriptively** and hyphenated, e.g. `arrange-layout.gif`,
  `dice-roll-3d.gif`, `inline-rolls.gif`, `type-table.gif`.
- **Keep them small.** GitHub will not render a file above ~10 MB and large GIFs
  make the README slow to load — aim for short clips (a few seconds) and a modest
  frame size. Tools like Gifski, ScreenToGif, or `ffmpeg` help shrink them.
- These files **are committed to the repo** (that is how GitHub serves them) — the
  `.gitignore` rules for `data.json` / `backups/` do not touch this folder.
- Suggested clips to capture: enabling the panel + setting a `Type`, arranging a
  layout in edit mode, a dice roll (3D style), inline `` `roll:` `` / `` `val:` ``
  chips, and the type table view.
