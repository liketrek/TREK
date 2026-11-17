/**
 * How often this instance may ask the open ADS-B feeds: at most one request a
 * second and 200 an hour across every flight, whichever trip asked. The feeds
 * are run by volunteers on donated capacity; a planner instance has no reason
 * to come near what they allow. A 429 or a run of failures pauses a source for
 * a quarter of an hour.
 *
 * Process state on purpose: TREK runs as one process, and the job that spends
 * the budget holds a scheduler lease, so a second process does not tick at the
 * same time.
 */
export const BUDGET_PER_HOUR = 200;
const MIN_SPACING_MS = 1000;
const BACKOFF_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export class FeedBudget {
  private readonly sent: number[] = [];
  private readonly pausedUntil = new Map<string, number>();

  /** Takes one request from the budget when there is one left now. */
  tryTake(now: number): boolean {
    while (this.sent.length > 0 && now - this.sent[0] >= HOUR_MS) this.sent.shift();
    const last = this.sent[this.sent.length - 1];
    if (last !== undefined && now - last < MIN_SPACING_MS) return false;
    if (this.sent.length >= BUDGET_PER_HOUR) return false;
    this.sent.push(now);
    return true;
  }

  /** How long until the spacing lets the next request go, in ms; 0 when it may go now. */
  waitMs(now: number): number {
    const last = this.sent[this.sent.length - 1];
    return last === undefined ? 0 : Math.max(0, MIN_SPACING_MS - (now - last));
  }

  /** Whether the hourly budget is used up. */
  exhausted(now: number): boolean {
    return this.sent.filter((at) => now - at < HOUR_MS).length >= BUDGET_PER_HOUR;
  }

  pause(source: string, now: number): void {
    this.pausedUntil.set(source, now + BACKOFF_MS);
  }

  isPaused(source: string, now: number): boolean {
    const until = this.pausedUntil.get(source);
    return until !== undefined && now < until;
  }
}
