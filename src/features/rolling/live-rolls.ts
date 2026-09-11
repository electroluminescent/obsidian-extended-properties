/**
 * The rolls currently on screen, as data rather than as cards.
 *
 * The roll layer draws them; the assign dialog deals them out. Those two need
 * to agree about what is in front of the reader - a card dismissed mid-deal is
 * a roll that can no longer be given to anything - and neither should have to
 * import the other to find out. So the layer publishes here and the dialog
 * subscribes, and the two only share this file.
 *
 * Ids are the handle, not totals: two cards can land on the same number and
 * still be different rolls, and "the 14 you are pointing at" has to survive
 * another 14 arriving.
 */

/** One settled card, as everything downstream of the animation sees it. */
export interface LiveRoll {
  /** Stable for the life of the card, unique across the session. */
  id: number;
  total: number;
  /** The card's headline - the roll's name, for saying where a number is from. */
  label: string;
  /**
   * The property this roll was made FOR, if it was made for one.
   *
   * A SET button stamps it, and a re-roll inherits it. It is what lets a deal
   * pair a sheet's worth of rolls up with no ticking, and what lets a re-rolled
   * card land back on the property its predecessor was going to.
   */
  forKey?: string;
}

let rolls: LiveRoll[] = [];
const watchers = new Set<() => void>();

/** Replace the published set and tell everyone watching. */
export function setLiveRolls(next: LiveRoll[]): void {
  rolls = next;
  for (const w of [...watchers]) w();
}

/** Every settled roll on screen, in the order the cards landed. */
export function liveRolls(): LiveRoll[] {
  return rolls;
}

/** Be told when a card lands or leaves. Returns the unsubscribe. */
export function watchLiveRolls(cb: () => void): () => void {
  watchers.add(cb);
  return () => {
    watchers.delete(cb);
  };
}
