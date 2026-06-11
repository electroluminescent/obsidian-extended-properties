/**
 * "image" and "iframe" value types — media rendered in the entry's
 * full-width area.
 */

import { Setting } from "obsidian";
import type { ValueTypeDef } from "../../../core/registry";
import type { SectionSize } from "../../../core/model";
import { TextPromptModal } from "../../modals/dialogs";
import { ImageViewerModal } from "../../modals/image-viewer";

/** Image height presets in px (0 = natural height). */
const IMAGE_HEIGHTS: Record<string, number> = { s: 120, m: 240, l: 360 };

export const imageType: ValueTypeDef = {
  id: "image",
  name: (i18n) => i18n.t("type.image"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const holder = ctx.extra.createDiv({ cls: "ep-image" });
    const h = IMAGE_HEIGHTS[(entry.size as string) ?? ""] ?? 0;
    const draw = () => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      const src = view.note.str(key);
      if (src) {
        if (h) {
          holder.style.height = h + "px";
          holder.addClass("ep-image-fixed");
        } else {
          holder.style.removeProperty("height");
          holder.removeClass("ep-image-fixed");
        }
        const img = holder.createEl("img", { cls: "ep-image-img" });
        img.src = view.resolveImage(src);
      } else {
        holder.style.removeProperty("height");
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("image.emptyHint"));
      }
    };
    draw();
    if (view.editMode) {
      view.bindOpen(
        holder,
        () =>
          new TextPromptModal(view.app, view.i18n, view.i18n.t("image.linkPrompt"), view.note.str(key), (val) =>
            view.note.set(file, key, val.trim() === "" ? undefined : val.trim())
          ).open(),
        false
      );
    } else {
      holder.onclick = () => {
        const src = view.note.str(key);
        if (src) new ImageViewerModal(view.app, view.i18n, view.resolveImage(src)).open();
      };
    }
    view.registerUpdater(draw);
  },

  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.imageHeading") });
    new Setting(c).setName(t("options.maxHeight")).addDropdown((d) => {
      d.addOption("unlimited", t("size.unlimited"));
      d.addOption("s", t("size.small"));
      d.addOption("m", t("size.medium"));
      d.addOption("l", t("size.large"));
      d.setValue((entry.size as string) || "unlimited");
      d.onChange((v) => {
        entry.size = v as SectionSize;
        changed();
      });
    });
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.editImage")).setIcon("image").onClick(() =>
        new TextPromptModal(view.app, view.i18n, view.i18n.t("image.linkPromptShort"), view.note.str(key), (v) =>
          view.note.set(file, key, v.trim() === "" ? undefined : v.trim())
        ).open()
      )
    );
  },
};

export const iframeType: ValueTypeDef = {
  id: "iframe",
  name: (i18n) => i18n.t("type.iframe"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const holder = ctx.extra.createDiv({ cls: "ep-iframe-wrap" });
    const scale = entry.iframeScale && entry.iframeScale > 0 ? entry.iframeScale : 0.25;
    const height = entry.iframeHeight && entry.iframeHeight > 0 ? entry.iframeHeight : 200;
    const draw = () => {
      holder.empty();
      const url = view.note.str(key).trim();
      if (!url) {
        holder.addClass("ep-image-empty");
        holder.style.removeProperty("height");
        holder.setText(view.i18n.t("iframe.emptyHint"));
        return;
      }
      holder.removeClass("ep-image-empty");
      holder.style.height = height + "px";
      const f = holder.createEl("iframe");
      f.setAttr("src", url);
      f.setAttr(
        "style",
        `width:${100 / scale}%;height:${height / scale}px;transform:scale(${scale});transform-origin:top left;border:none;`
      );
    };
    draw();
    const promptUrl = () =>
      new TextPromptModal(view.app, view.i18n, view.i18n.t("iframe.urlPrompt"), view.note.str(key), (val) =>
        view.note.set(file, key, val.trim() === "" ? undefined : val.trim())
      ).open();
    if (view.editMode) {
      const edit = ctx.extra.createDiv({ cls: "ep-iframe-edit" });
      const btn = edit.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("iframe.setUrl") });
      btn.onclick = promptUrl;
    } else {
      view.bindOpen(holder, promptUrl, false);
    }
    // Only rebuild when the URL actually changed (iframes are expensive).
    let curUrl = view.note.str(key);
    view.registerUpdater(() => {
      const u = view.note.str(key);
      if (u !== curUrl) {
        curUrl = u;
        draw();
      }
    });
  },

  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.embedHeading") });
    new Setting(c).setName(t("options.embedHeight")).addText((tx) => {
      tx.setValue(String(entry.iframeHeight ?? 200)).onChange((v) => {
        const n = Number(v);
        entry.iframeHeight = Number.isFinite(n) && n > 0 ? n : undefined;
        changed();
      });
    });
    new Setting(c).setName(t("options.embedScale")).addSlider((sl) => {
      sl.setLimits(0.25, 2, 0.05)
        .setValue(entry.iframeScale ?? 0.25)
        .setDynamicTooltip()
        .onChange((v) => {
          entry.iframeScale = v;
          changed();
        });
    });
  },
};
