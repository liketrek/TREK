import cron, { type ScheduledTask } from 'node-cron';

/**
 * Host-side scheduler for a plugin's declared background jobs (#plugins).
 *
 * A plugin declares `jobs` (id + cron `schedule`) in its code; the child reports
 * them at load. This wires each to node-cron in the HOST and fires
 * `invoke(id, 'invoke.job', { jobId })` on the tick. Kept deliberately small and
 * pure so it is unit-testable in isolation of the supervisor.
 *
 * Safety: (1) OPT-IN — a job is scheduled only if the admin granted `jobs:run`,
 * because scheduled work runs with NO acting user and is a distinct risk class
 * from a user-triggered route. (2) A job carries no user, so every trip read it
 * attempts is refused by the RPC host — a job can only touch its own db / declared
 * egress. (3) An invalid cron is skipped (never runs). (4) The tick callback and
 * `stop()` are wrapped so a throwing job or a stray task can never break the host
 * or leak across a deactivation.
 */

export interface ScheduledJob {
  id: string;
  schedule: string;
}

/** Grant that must be present for a plugin's jobs to be scheduled at all. */
export const JOBS_RUN_PERMISSION = 'jobs:run';

/**
 * Schedule every valid-cron job (returns the node-cron tasks to keep for teardown).
 * Empty when the plugin lacks `jobs:run`, so a plugin without the grant runs nothing.
 */
export function scheduleJobs(
  granted: ReadonlySet<string>,
  jobs: readonly ScheduledJob[],
  run: (jobId: string) => void,
): ScheduledTask[] {
  if (!granted.has(JOBS_RUN_PERMISSION)) return [];
  const tasks: ScheduledTask[] = [];
  for (const job of jobs) {
    if (!job.schedule || !cron.validate(job.schedule)) continue; // invalid cron -> never runs
    tasks.push(
      cron.schedule(job.schedule, () => {
        try {
          run(job.id);
        } catch {
          /* a job must never break the host loop */
        }
      }),
    );
  }
  return tasks;
}

/** Stop + drop the given tasks (called on deactivation/kill so nothing leaks). */
export function stopJobs(tasks: ScheduledTask[] | undefined): void {
  for (const t of tasks ?? []) {
    try {
      t.stop();
    } catch {
      /* ignore — teardown must never throw */
    }
  }
}
