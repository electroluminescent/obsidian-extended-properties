/**
 * The inline feature module: rolls and properties rendered in note bodies.
 *
 * The module itself only registers its locale strings (so it appears in the
 * settings feature list). The reading-mode markdown processors are registered
 * by `main.ts` via {@link registerInline} because they need the plugin and the
 * plugin-level services; they no-op when the feature is toggled off.
 */

import type { Plugin } from "obsidian";
import type { FeatureContext, FeatureModule } from "../../core/registry";
import { InlineCtx, processInline, renderChart, renderSheet } from "./inline-render";
import { inlineLivePreview } from "./live-preview";
import { inlineEn } from "./strings";

export const inlineModule: FeatureModule = {
  id: "inline",
  name: (i18n) => i18n.t("inline.featureName"),
  description: (i18n) => i18n.t("inline.featureDesc"),

  register(ctx: FeatureContext): void {
    ctx.i18n.register("en", inlineEn);
  },
};

/** Register the reading-mode markdown processors (runtime-gated by the flag). */
export function registerInline(plugin: Plugin, ctx: InlineCtx): void {
  plugin.registerMarkdownPostProcessor((el, mdctx) => processInline(el, mdctx, ctx));
  plugin.registerMarkdownCodeBlockProcessor("ep-sheet", (src, el, mdctx) => renderSheet(src, el, mdctx, ctx));
  plugin.registerMarkdownCodeBlockProcessor("ep-chart", (src, el, mdctx) => renderChart(src, el, mdctx, ctx));
  plugin.registerEditorExtension(inlineLivePreview(ctx));
}
