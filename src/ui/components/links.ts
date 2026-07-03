/**
 * Render text containing `[[wikilinks]]` and `[markdown](links)` as
 * clickable links, leaving everything else as plain text.
 */

import { App } from "obsidian";

/**
 * Append `text` to `el`, converting links.
 * - `[[target|label]]` opens in the workspace (Ctrl/Cmd-click -> new pane).
 * - `![[embeds]]` are left as literal text (the sidebar doesn't embed).
 * - `[label](url)` opens externally.
 */
export function renderLinkedText(app: App, el: HTMLElement, text: string, sourcePath: string): void {
  const re = /(!?)\[\[([^\]]+?)\]\]|\[([^\]]+?)\]\(([^)]+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) el.appendText(text.slice(last, m.index));
    if (m[2] !== undefined) {
      const parts = m[2].split("|");
      const target = parts[0].trim();
      const label = (parts[1] ?? parts[0]).trim();
      if (m[1] === "!") {
        el.appendText(m[0]);
      } else {
        const a = el.createEl("a", { cls: "internal-link", text: label });
        a.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          app.workspace.openLinkText(target, sourcePath, ev.ctrlKey || ev.metaKey);
        };
      }
    } else {
      const url = m[4];
      const a = el.createEl("a", { cls: "external-link", text: m[3] });
      a.setAttr("href", url);
      a.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        window.open(url, "_blank");
      };
    }
    last = re.lastIndex;
  }
  if (last < text.length) el.appendText(text.slice(last));
}
