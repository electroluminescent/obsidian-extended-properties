/** Full-size image viewer with wheel zoom, drag pan and double-click reset. */

import { App, Modal } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import { clamp } from "../../utils/misc";

export class ImageViewerModal extends Modal {
  constructor(app: App, private i18n: I18n, private src: string) {
    super(app);
  }

  onOpen(): void {
    const c = this.contentEl;
    c.addClass("ep-imgview");
    (this.modalEl as HTMLElement).addClass("ep-imgview-modal");
    const wrap = c.createDiv({ cls: "ep-imgview-wrap" });
    const img = wrap.createEl("img");
    img.src = this.src;

    let scale = 1, tx = 0, ty = 0, dragging = false, lx = 0, ly = 0;
    const apply = () => {
      img.setCssStyles({ transform: `translate(${tx}px, ${ty}px) scale(${scale})` });
    };
    wrap.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const d = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      scale = clamp(scale * d, 0.2, 12);
      apply();
    });
    wrap.addEventListener("pointerdown", (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", (e: PointerEvent) => {
      if (!dragging) return;
      tx += e.clientX - lx;
      ty += e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      apply();
    });
    wrap.addEventListener("pointerup", () => (dragging = false));
    wrap.addEventListener("dblclick", () => {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    });
    c.createEl("div", { cls: "ep-imgview-hint", text: this.i18n.t("imageViewer.hint") });
    apply();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
