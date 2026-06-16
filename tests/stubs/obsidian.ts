/**
 * Minimal "obsidian" stub for the test runner. The pure modules under test only
 * import *types* from obsidian (erased at transform time), so nothing here is
 * exercised at runtime — these exist solely to satisfy resolution if a value
 * import is ever introduced.
 */
export class Menu {}
export class Setting {}
export class Modal {}
export class Notice {}
export class Component {}
export class TFile {}
export class TFolder {}
export class App {}
export function setIcon(): void {}
export const Platform = { isMobile: false, isDesktop: true };
