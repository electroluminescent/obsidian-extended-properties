/**
 * Random number sources for dice: pure random and "karmic" adaptive random.
 *
 * Pure random has no memory — every face is independent and long streaks
 * happen. Adaptive random remembers recent failures via a hidden,
 * session-scoped **luck debt**:
 *
 *  1. Luck debt starts at 0.
 *  2. Each die has a normal success probability `p` (rolling in the top
 *     half of its faces).
 *  3. Before resolving, the accumulated debt may trigger an intervention
 *     (the chance grows with the debt).
 *  4. No intervention → the face resolves with the standard uniform odds.
 *  5. Intervention → the result is replaced with a success (a uniformly
 *     chosen top-half face).
 *  6. A normal failure increases luck debt by `p`.
 *  7. A normal success leaves luck debt unchanged.
 *  8. A forced success spends {@link INTERVENTION_SPEND} of the debt.
 *  9. Luck debt is clamped at 0.
 * 10. Repeat for future rolls.
 *
 * Failure streaks therefore become increasingly unlikely while success
 * streaks stay untouched; with the debt back at 0 the system is exactly
 * pure random again. The debt is shared globally (all roll buttons and
 * pools feed the same pot) and resets with the session.
 */

/** How strongly accumulated debt raises the intervention chance. */
const INTERVENTION_RATE = 0.25;
/** Debt spent per forced success (the "configured amount"). */
const INTERVENTION_SPEND = 0.5;
/** Interventions never become a certainty. */
const INTERVENTION_CAP = 0.9;

let luckDebt = 0;

/** Current hidden debt (exposed for diagnostics/tests). */
export function luckDebtValue(): number {
  return luckDebt;
}

/** Roll one face of a `sides`-sided die with the chosen system. */
export function rollFace(sides: number, karmic: boolean): number {
  const s = Math.max(2, Math.floor(sides));
  const uniform = () => 1 + Math.floor(Math.random() * s);
  if (!karmic) return uniform();

  // Success = a top-half face; p is its normal probability.
  const successFrom = Math.floor(s / 2) + 1;
  const successCount = s - successFrom + 1;
  const p = successCount / s;

  if (Math.random() < Math.min(INTERVENTION_CAP, luckDebt * INTERVENTION_RATE)) {
    // Intervention: force a success and spend debt.
    luckDebt = Math.max(0, luckDebt - INTERVENTION_SPEND);
    return successFrom + Math.floor(Math.random() * successCount);
  }
  const face = uniform();
  if (face < successFrom) luckDebt += p;
  return face;
}
