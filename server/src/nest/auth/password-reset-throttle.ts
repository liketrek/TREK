// Per-email throttle (defence-in-depth on top of the per-IP limiter).
// Module-scoped + import-time interval on purpose (legacy parity, shared
// between bridge and container instances — atlas-geo interval precedent).
const perEmailResetAttempts = new Map<string, { count: number; first: number }>();
const PASSWORD_RESET_PER_EMAIL_WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_RESET_PER_EMAIL_MAX = 3;
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of perEmailResetAttempts) {
      if (now - record.first >= PASSWORD_RESET_PER_EMAIL_WINDOW_MS) perEmailResetAttempts.delete(key);
    }
  },
  5 * 60 * 1000,
).unref?.();

/** Count one reset request for `key`; true when the address already asked too often in this window. */
export function resetThrottledPerEmail(key: string, now: number): boolean {
  const record = perEmailResetAttempts.get(key);
  if (
    record &&
    record.count >= PASSWORD_RESET_PER_EMAIL_MAX &&
    now - record.first < PASSWORD_RESET_PER_EMAIL_WINDOW_MS
  ) {
    return true;
  }
  if (!record || now - record.first >= PASSWORD_RESET_PER_EMAIL_WINDOW_MS) {
    perEmailResetAttempts.set(key, { count: 1, first: now });
  } else {
    record.count++;
  }
  return false;
}
