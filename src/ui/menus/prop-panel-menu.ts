/**
 * Integration with Obsidian's own properties panel:
 *
 * - a replacement right-click menu on individual properties offering
 *   hide/show (with a submenu grouped by sidebar section / note / other),
 * - extra "Hidden properties" rows injected into the panel heading's menu.
 *
 * Lives outside the sidebar view because it operates on the editor DOM and
 * must work even when the sidebar is closed.
 */

import { App, Menu, setIcon } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { EPSettings } from "../../core/model";
import type { HideService } from "../../core/hide-service";

export interface PropPanelHost {
  app: App;
  i18n: I18n;
  settings: EPSettings;
  hide: HideService;
}

/** Replacement context menu for one property row in the properties panel. */
export function showPropMenu(host: PropPanelHost, e: MouseEvent, key: string): void {
  const { app, i18n, settings, hide } = host;
  const t = i18n.t.bind(i18n);
  const menu = new Menu();
  const hidden = hide.isHidden(key);
  menu.addItem((i) =>
    i.setTitle(hidden ? t("propPanel.showEverywhere", { key }) : t("propPanel.hideEverywhere", { key }))
      .setIcon(hidden ? "eye" : "eye-off")
      .onClick(() => hide.toggle(key))
  );

  // Build the grouped hide/show submenu from the active note's layout.
  const af = app.workspace.getActiveFile();
  const fm = af ? app.metadataCache.getFileCache(af)?.frontmatter : null;
  const noteKeys = new Set<string>();
  if (fm) for (const k of Object.keys(fm)) if (k.toLowerCase() !== "position") noteKeys.add(k);
  const typeValues: string[] = [];
  if (fm) {
    const raw: any = (fm as any)["Type"] ?? (fm as any)["type"];
    if (Array.isArray(raw)) raw.forEach((x) => typeValues.push(String(x)));
    else if (raw != null) typeValues.push(String(raw));
  }
  const typeKey = settings.types.find((tp) => typeValues.some((x) => x.toLowerCase() === tp.toLowerCase()))?.toLowerCase();
  const layout = typeKey ? settings.layouts[typeKey] : undefined;
  const inSection = new Set<string>();
  const groups: { title: string; keys: string[] }[] = [];
  if (layout)
    for (const sec of layout.sections) {
      const ks: string[] = [];
      for (const en of sec.entries)
        if (en.kind === "prop" && en.key) {
          ks.push(en.key);
          inSection.add(en.key.toLowerCase());
        }
      if (ks.length) groups.push({ title: sec.title, keys: ks });
    }
  const inNotes = [...noteKeys].filter((k) => !inSection.has(k.toLowerCase()));
  const others = [...settings.manualHide].filter((k) => !inSection.has(k.toLowerCase()) && !noteKeys.has(k));

  if (groups.length || inNotes.length || others.length) {
    menu.addItem((i) => {
      i.setTitle(t("propPanel.hideShow")).setIcon("eye");
      const sub = (i as any).setSubmenu ? (i as any).setSubmenu() : null;
      if (!sub) return;
      const addGroup = (title: string, keys: string[]) => {
        if (!keys.length) return;
        sub.addItem((h: any) => h.setTitle(title).setDisabled(true));
        for (const k of [...new Set(keys)].sort((a, b) => a.localeCompare(b))) {
          const kHidden = hide.isHidden(k);
          sub.addItem((si: any) =>
            si.setTitle(kHidden ? t("propPanel.showKey", { key: k }) : t("propPanel.hideKey", { key: k }))
              .setIcon(kHidden ? "eye" : "eye-off")
              .onClick(() => {
                hide.toggle(k);
                // Re-open so the menu reflects the new state.
                window.setTimeout(() => showPropMenu(host, e, key), 0);
              })
          );
        }
      };
      for (const g of groups) addGroup(g.title, g.keys);
      addGroup(t("propPanel.groupInNotes"), inNotes);
      addGroup(t("propPanel.groupOther"), others);
    });
  }
  menu.showAtMouseEvent(e);
}

/** Inject "Hidden properties" rows into the properties heading's menu. */
export function augmentPropsMenu(host: PropPanelHost): void {
  const { i18n, hide } = host;
  const t = i18n.t.bind(i18n);
  const menus = activeDocument.querySelectorAll(".menu");
  const menu = menus[menus.length - 1] as HTMLElement | undefined;
  if (!menu || menu.querySelector(".ep-injected")) return;
  menu.createDiv({ cls: "menu-separator ep-injected" });
  const hidden = hide.hiddenKeys();
  const head = menu.createDiv({ cls: "menu-item ep-injected is-disabled" });
  head.createDiv({ cls: "menu-item-title", text: t("propPanel.hiddenHeading") });
  if (!hidden.length) {
    const none = menu.createDiv({ cls: "menu-item ep-injected is-disabled" });
    none.createDiv({ cls: "menu-item-title", text: t("propPanel.noneHidden") });
    return;
  }
  for (const h of hidden) {
    const it = menu.createDiv({ cls: "menu-item ep-injected" });
    const ic = it.createDiv({ cls: "menu-item-icon" });
    setIcon(ic, "eye");
    it.createDiv({ cls: "menu-item-title", text: h.manual ? h.key : t("propPanel.sidebarSuffix", { key: h.key }) });
    it.addEventListener("click", () => {
      hide.unhideKey(h.key);
      menu.remove();
    });
  }
  if (hidden.length > 1) {
    const all = menu.createDiv({ cls: "menu-item ep-injected" });
    const ic = all.createDiv({ cls: "menu-item-icon" });
    setIcon(ic, "eye");
    all.createDiv({ cls: "menu-item-title", text: t("propPanel.showAll") });
    all.addEventListener("click", () => {
      for (const h of hidden) hide.unhideKey(h.key);
      menu.remove();
    });
  }
}
