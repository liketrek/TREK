/**
 * The host-side background-job scheduler (#plugins). Proves jobs are opt-in
 * (jobs:run), invalid crons never run, the run callback receives the job id, a
 * throwing job can't escape the tick, and stop() tears every task down.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ tasks: [] as Array<{ expr: string; fn: () => void; stopped: boolean; stop(): void }> }));
vi.mock('node-cron', () => ({
  default: {
    validate: (expr: string) => typeof expr === 'string' && expr.trim() !== '' && expr !== 'not-a-cron',
    schedule: (expr: string, fn: () => void) => {
      const t = { expr, fn, stopped: false, stop() { this.stopped = true; } };
      h.tasks.push(t);
      return t;
    },
  },
}));

import { scheduleJobs, stopJobs } from '../../../src/nest/plugins/host/plugin-jobs';

describe('plugin background jobs (scheduler)', () => {
  beforeEach(() => { h.tasks.length = 0; });
  const jobs = [{ id: 'nightly', schedule: '0 0 * * *' }, { id: 'broken', schedule: 'not-a-cron' }];

  it('schedules nothing without the jobs:run grant (opt-in)', () => {
    expect(scheduleJobs(new Set<string>(), jobs, () => {})).toEqual([]);
    expect(h.tasks).toHaveLength(0);
  });

  it('schedules only valid-cron jobs when jobs:run is granted', () => {
    const tasks = scheduleJobs(new Set(['jobs:run']), jobs, () => {});
    expect(tasks).toHaveLength(1);
    expect(h.tasks[0].expr).toBe('0 0 * * *'); // the invalid cron was skipped, never scheduled
  });

  it('fires the run callback with the job id and swallows a throwing job', () => {
    const runs: string[] = [];
    scheduleJobs(new Set(['jobs:run']), [{ id: 'a', schedule: '0 0 * * *' }], (id) => { runs.push(id); throw new Error('boom'); });
    expect(() => h.tasks[0].fn()).not.toThrow(); // the tick wrapper contains the throw
    expect(runs).toEqual(['a']);
  });

  it('stopJobs stops every task and is safe on undefined/empty', () => {
    const tasks = scheduleJobs(new Set(['jobs:run']), [{ id: 'a', schedule: '0 0 * * *' }], () => {});
    stopJobs(tasks);
    expect(h.tasks[0].stopped).toBe(true);
    expect(() => stopJobs(undefined)).not.toThrow();
  });
});
