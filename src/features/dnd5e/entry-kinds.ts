/**
 * Removed in v2.2: the "computed" entry kind (proficiency, initiative) was
 * the last hard-coded rule widget. Both are now ordinary "derived" property
 * entries built on the core influence engine — see `sections.ts`
 * (`profBonusEntry`, `initiativeEntry`) and the migration in `index.ts`.
 *
 * This file is kept only so stale imports fail loudly instead of silently.
 */

export {};
