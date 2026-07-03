/**
 * Media value types rendered in the entry's full-width area: "image",
 * "iframe", and the embedded players — "audio", "video" and "pdf".
 *
 * Audio and video accept vault-local files (paths or wikilinks, resolved
 * like image sources) and web URLs; service pages rewrite to their embed
 * players (YouTube/Vimeo for video, Spotify/SoundCloud for audio — see
 * `utils/embed.ts`, pure and unit-tested).
 */

import { Setting } from "obsidian";
import type { EntryRenderCtx, OptionsCtx } from "../../../core/context";
import type { ValueTypeDef } from "../../../core/registry";
import type { SectionSize } from "../../../core/model";
import { audioEmbed, videoEmbed } from "../../../utils/embed";
import { TextPromptModal } from "../../modals/dialogs";
import { ImageViewerModal } from "../../modals/image-viewer";

/** Image height presets in px (0 = natural height). */
const IMAGE_HEIGHTS: Record<string, number> = { s: 120, m: 240, l: 360 };

/** Explicit height in px (`iframeHeight`), 0 = unset. Shared by all media. */
const embedHeight = (entry: { iframeHeight?: number }): number =>
  entry.iframeHeight && entry.iframeHeight > 0 ? entry.iframeHeight : 0;

/** Zoom/scale factor (`iframeScale`); `def` is the type's natural default. */
const embedScale = (entry: { iframeScale?: number }, def = 1): number =>
  entry.iframeScale && entry.iframeScale > 0 ? entry.iframeScale : def;

/**
 * The iframe's sizing rows — Height (px) and Scale — shared by every media
 * type so images, audio players, videos, PDFs and iframes size the same way.
 */
function addEmbedSizeRows(octx: OptionsCtx, scaleDefault: number, heightPlaceholder?: number): void {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  new Setting(c).setName(t("options.embedHeight")).addText((tx) => {
    if (heightPlaceholder !== undefined) tx.setPlaceholder(String(heightPlaceholder));
    tx.setValue(entry.iframeHeight !== undefined ? String(entry.iframeHeight) : "").onChange((v) => {
      const n = Number(v);
      entry.iframeHeight = Number.isFinite(n) && n > 0 ? n : undefined;
      changed();
    });
  });
  new Setting(c).setName(t("options.embedScale")).addSlider((sl) => {
    sl.setLimits(0.25, 2, 0.05)
      .setValue(entry.iframeScale ?? scaleDefault)
      .setDynamicTooltip()
      .onChange((v) => {
        entry.iframeScale = v;
        changed();
      });
  });
}

export const imageType: ValueTypeDef = {
  id: "image",
  name: (i18n) => i18n.t("type.image"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const holder = ctx.extra.createDiv({ cls: "ep-image" });
    // Explicit height (px) wins over the preset; scale zooms within the box.
    const h = embedHeight(entry) || (IMAGE_HEIGHTS[(entry.size as string) ?? ""] ?? 0);
    const s = embedScale(entry);
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
        if (s !== 1) {
          holder.addClass("ep-media-zoom");
          img.style.transform = `scale(${s})`;
        }
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
    addEmbedSizeRows(octx, 1);
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

// ---------------------------------------------------------------------------
// Shared plumbing for the embedded players (audio / video / pdf)
// ---------------------------------------------------------------------------

/** Prompt for the entry's source (path, wikilink or URL) and store it. */
function promptSource(ctx: EntryRenderCtx, promptKey: string): void {
  const { view, file, entry } = ctx;
  const key = entry.key as string;
  new TextPromptModal(view.app, view.i18n, view.i18n.t(promptKey), view.note.str(key), (val) =>
    view.note.set(file, key, val.trim() === "" ? undefined : val.trim())
  ).open();
}

/**
 * Wire an embed holder: a "Set source" row in edit mode (the players own
 * their clicks, so the holder can't double as the editor), plus a rebuild
 * only when the value actually changed — media elements are expensive.
 */
function bindEmbed(ctx: EntryRenderCtx, holder: HTMLElement, promptKey: string, draw: () => void): void {
  const { view, entry } = ctx;
  const key = entry.key as string;
  draw();
  if (view.editMode) {
    const edit = ctx.extra.createDiv({ cls: "ep-iframe-edit" });
    const btn = edit.createEl("button", { cls: "ep-mini-btn", text: view.i18n.t("media.setSource") });
    btn.onclick = () => promptSource(ctx, promptKey);
  } else {
    // Empty state is clickable to set a source even outside edit mode.
    holder.onclick = () => {
      if (!view.note.str(key).trim()) promptSource(ctx, promptKey);
    };
  }
  let cur = view.note.str(key);
  view.registerUpdater(() => {
    const u = view.note.str(key);
    if (u !== cur) {
      cur = u;
      draw();
    }
  });
}

/** Shared "Set source…" context-menu item for the embed types. */
function sourceMenuItem(promptKey: string): ValueTypeDef["menuItems"] {
  return (menu, ref) => {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("media.setSource")).setIcon("link").onClick(() =>
        new TextPromptModal(view.app, view.i18n, view.i18n.t(promptKey), view.note.str(key), (v) =>
          view.note.set(file, key, v.trim() === "" ? undefined : v.trim())
        ).open()
      )
    );
  };
}

/** Video max-height presets in px (0 = natural / aspect-driven). */
const VIDEO_HEIGHTS: Record<string, number> = { s: 180, m: 300, l: 420 };

export const audioType: ValueTypeDef = {
  id: "audio",
  name: (i18n) => i18n.t("type.audio"),

  render(ctx) {
    const { view, entry } = ctx;
    const key = entry.key as string;
    const holder = ctx.extra.createDiv({ cls: "ep-audio" });
    const draw = (): void => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      const src = view.note.str(key).trim();
      if (!src) {
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("audio.emptyHint"));
        return;
      }
      const em = audioEmbed(src);
      if (em.kind === "iframe") {
        const f = holder.createEl("iframe", { cls: "ep-audio-frame" });
        f.setAttr("src", em.src);
        f.setAttr("allow", "encrypted-media");
      } else {
        const a = holder.createEl("audio", { cls: "ep-audio-el" });
        a.controls = true;
        a.preload = "metadata";
        a.src = view.resolveImage(src); // resolves wikilinks/vault paths; URLs pass through
      }
    };
    bindEmbed(ctx, holder, "audio.srcPrompt", draw);
  },

  menuItems: sourceMenuItem("audio.srcPrompt"),
};

export const videoType: ValueTypeDef = {
  id: "video",
  name: (i18n) => i18n.t("type.video"),

  render(ctx) {
    const { view, entry } = ctx;
    const key = entry.key as string;
    const holder = ctx.extra.createDiv({ cls: "ep-video" });
    const maxH = VIDEO_HEIGHTS[(entry.size as string) ?? ""] ?? 0;
    const hPx = embedHeight(entry); // explicit height wins over the preset
    const s = embedScale(entry);
    const draw = (): void => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      const src = view.note.str(key).trim();
      if (!src) {
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("video.emptyHint"));
        return;
      }
      const em = videoEmbed(src);
      if (em.kind === "iframe") {
        // Service player (YouTube, Vimeo, …): a 16:9 frame, or a fixed-height
        // one when an explicit height is set.
        const wrap = holder.createDiv({ cls: "ep-video-framewrap" });
        if (hPx) {
          wrap.style.aspectRatio = "auto";
          wrap.style.height = hPx + "px";
        } else if (maxH) {
          wrap.style.maxHeight = maxH + "px";
        }
        const f = wrap.createEl("iframe", { cls: "ep-video-frame" });
        f.setAttr("src", em.src);
        f.setAttr("allow", "fullscreen; encrypted-media; picture-in-picture");
        f.setAttr("allowfullscreen", "true");
        // The iframe scaling technique, in % so it works with both wrap modes.
        if (s !== 1)
          f.setAttr(
            "style",
            `width:${(100 / s).toFixed(2)}%;height:${(100 / s).toFixed(2)}%;transform:scale(${s});transform-origin:top left;`
          );
      } else {
        const v = holder.createEl("video", { cls: "ep-video-el" });
        v.controls = true;
        v.preload = "metadata";
        if (hPx) v.style.height = hPx + "px";
        else if (maxH) v.style.maxHeight = maxH + "px";
        if (s !== 1) {
          holder.addClass("ep-media-zoom");
          v.style.transform = `scale(${s})`;
        }
        v.src = view.resolveImage(src);
      }
    };
    bindEmbed(ctx, holder, "video.srcPrompt", draw);
  },

  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.videoHeading") });
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
    addEmbedSizeRows(octx, 1);
  },

  menuItems: sourceMenuItem("video.srcPrompt"),
};

export const pdfType: ValueTypeDef = {
  id: "pdf",
  name: (i18n) => i18n.t("type.pdf"),

  render(ctx) {
    const { view, entry } = ctx;
    const key = entry.key as string;
    const holder = ctx.extra.createDiv({ cls: "ep-pdf" });
    const height = embedHeight(entry) || 360;
    const s = embedScale(entry);
    const draw = (): void => {
      holder.empty();
      holder.removeClass("ep-image-empty");
      holder.style.removeProperty("height");
      const src = view.note.str(key).trim();
      if (!src) {
        holder.addClass("ep-image-empty");
        holder.setText(view.i18n.t("pdf.emptyHint"));
        return;
      }
      holder.style.height = height + "px";
      const f = holder.createEl("iframe", { cls: "ep-pdf-frame" });
      f.setAttr("src", view.resolveImage(src)); // local PDFs resolve to app:// resources
      // Same scaling technique as the iframe type.
      if (s !== 1) {
        holder.addClass("ep-media-zoom");
        f.setAttr(
          "style",
          `width:${(100 / s).toFixed(2)}%;height:${(height / s).toFixed(0)}px;transform:scale(${s});transform-origin:top left;border:none;`
        );
      }
    };
    bindEmbed(ctx, holder, "pdf.srcPrompt", draw);
  },

  renderOptions(octx) {
    const { view, container: c } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.embedHeading") });
    addEmbedSizeRows(octx, 1, 360);
  },

  menuItems: sourceMenuItem("pdf.srcPrompt"),
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
    const { view, container: c } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.embedHeading") });
    addEmbedSizeRows(octx, 0.25, 200);
  },
};
