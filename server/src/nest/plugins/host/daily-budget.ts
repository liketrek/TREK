/**
 * Per-plugin daily budgets for the host-mediated brokers (#plugins, security).
 *
 * The RPC rate limit (rate-limit.ts) bounds how FAST a plugin calls the host; this
 * bounds how MUCH it spends per day on the two brokers that cost real money or
 * annoyance: the shared LLM provider (`ai.complete`/`ai.extract`) and user
 * notifications (`notify.send`). Without it, one plugin could burn the admin's LLM
 * quota or spam a user, entirely within its granted permissions.
 *
 * Zero-config: generous defaults apply automatically (env-overridable, never
 * required). Counts live in memory, seeded on first use from the local capability
 * audit (which already records every ai/notify call) — so a restart doesn't reset
 * the day, and nothing phones home. A UTC-midnight rollover resets the window.
 */

export interface DailyBudgetConfig {
  aiPerDay: number;
  notifyPerDay: number;
}

/** Read a non-negative integer env override, falling back to `def` only when the
 * value is absent or malformed. A literal 0 is honoured (disable the broker), which a
 * `Number(x) || def` would have silently turned back into the default. */
export function envCap(name: string, def: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return def;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

// Generous by design — these only bite an abusive/runaway plugin, never a normal
// one. Overridable via env for a self-hoster who wants tighter or looser caps
// (set to 0 to disable a broker entirely).
export const DEFAULT_DAILY_BUDGET: DailyBudgetConfig = {
  aiPerDay: envCap('TREK_PLUGIN_AI_PER_DAY', 200),
  notifyPerDay: envCap('TREK_PLUGIN_NOTIFY_PER_DAY', 100),
};

export type BudgetKind = 'ai' | 'notify';

/** The UTC calendar day of a timestamp, as a comparable 'YYYY-MM-DD' string. */
function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * A per-plugin daily counter for the two metered brokers. `take(kind)` returns
 * false once the day's budget for that kind is spent; the window rolls over at
 * UTC midnight. Seed with today's already-spent counts so a restart continues the
 * same day instead of handing the plugin a fresh budget.
 */
export class DailyBudget {
  private day: string;
  private ai = 0;
  private notify = 0;

  constructor(private readonly cfg: DailyBudgetConfig, now: number, seed?: { ai?: number; notify?: number }) {
    this.day = utcDay(now);
    this.ai = seed?.ai ?? 0;
    this.notify = seed?.notify ?? 0;
  }

  private rollover(now: number): void {
    const today = utcDay(now);
    if (today !== this.day) {
      this.day = today;
      this.ai = 0;
      this.notify = 0;
    }
  }

  /** Reserve one unit of `kind`'s daily budget. False = exhausted for today. */
  take(kind: BudgetKind, now: number): boolean {
    this.rollover(now);
    if (kind === 'ai') {
      if (this.ai >= this.cfg.aiPerDay) return false;
      this.ai += 1;
      return true;
    }
    if (this.notify >= this.cfg.notifyPerDay) return false;
    this.notify += 1;
    return true;
  }

  /** Current usage snapshot for the admin view (read-only). */
  used(now: number): { day: string; ai: number; aiMax: number; notify: number; notifyMax: number } {
    this.rollover(now);
    return { day: this.day, ai: this.ai, aiMax: this.cfg.aiPerDay, notify: this.notify, notifyMax: this.cfg.notifyPerDay };
  }
}
