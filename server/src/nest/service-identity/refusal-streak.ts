/** Refusals in a row before a key counts as gone, so one broken deploy upstream drops nothing. */
const STREAK_LIMIT = 3;
/** One page fires several searches at once; refusals closer together than this are one moment. */
const SPACING_MS = 10 * 60_000;

/** Counts the refusals of a key at moments apart from each other, until an acceptance clears them. */
export class RefusalStreak {
  private hits = 0;
  private lastHitAt: number | null = null;

  /** True when this refusal completes the streak, which then starts over. */
  hit(now = Date.now()): boolean {
    if (this.lastHitAt !== null && now - this.lastHitAt < SPACING_MS) return false;
    this.lastHitAt = now;
    this.hits += 1;
    if (this.hits < STREAK_LIMIT) return false;
    this.clear();
    return true;
  }

  clear(): void {
    this.hits = 0;
    this.lastHitAt = null;
  }
}
