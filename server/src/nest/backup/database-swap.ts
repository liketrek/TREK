import { logInfo, logWarn } from '../audit/audit-log.logger';
import { describeError } from '../common/describe-error';
import { DatabaseConnectionLostError } from '../database/database-backup.interface';

/** Whether a step ran to the end, and what it threw when it did not. */
interface Outcome {
  failed: boolean;
  error: unknown;
}

/** Runs `step` and records that it threw even when what it threw is undefined. */
async function settle(step: () => void | Promise<void>): Promise<Outcome> {
  try {
    await step();
    return { failed: false, error: null };
  } catch (error) {
    return { failed: true, error };
  }
}

/**
 * The restore step both backup ports share. `swap` puts the new database in
 * place; `reopen` always runs after it, so the process is never left without a
 * connection. A failed swap rethrows its error, or a DatabaseConnectionLostError
 * carrying both when the reopen failed too. A swap that landed resolves with the
 * reopen's error, which the caller reports as "restart required".
 */
export async function replaceThenReopen(
  swap: () => void | Promise<void>,
  reopen: () => Promise<void>,
): Promise<{ reopenError: unknown }> {
  const swapped = await settle(swap);
  const reopened = await settle(reopen);
  if (swapped.failed) {
    if (reopened.failed) throw new DatabaseConnectionLostError(swapped.error, reopened.error);
    throw swapped.error;
  }
  return { reopenError: reopened.failed ? reopened.error : null };
}

/**
 * Keeps a copy of the database a restore is about to replace, at `target`. Best
 * effort: a database broken enough to need the restore may not copy, and that
 * must not block the recovery. Resolves with where the copy went, or null.
 */
export async function keepRestoreCopy(
  target: string,
  snapshot: (target: string) => Promise<void>,
): Promise<string | null> {
  try {
    await snapshot(target);
    logInfo(`Restore: the replaced database was kept as ${target}`);
    return target;
  } catch (err) {
    logWarn(`Restore: could not keep a copy of the current database (${describeError(err)})`);
    return null;
  }
}
