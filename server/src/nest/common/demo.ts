// Central registry of demo-user email addresses.
//
// Historical: the demo account was seeded as "demo@trek.app" (see
// authService.demoLogin), but several guards — demoUploadBlock in
// middleware/auth.ts, the MFA/backup-code bypasses in authService —
// were still checking the pre-rename "demo@nomad.app" string, so they
// either never fired or silently diverged between call sites. Routing
// every check through this constant keeps them aligned.

export const DEMO_EMAIL_PRIMARY = 'demo@trek.app';

/**
 * All email addresses that should be treated as the demo account.
 * Includes the historical `demo@nomad.app` identifier so instances that
 * upgraded in place without resetting the DB still hit demo-mode guards.
 */
export const DEMO_EMAILS: ReadonlySet<string> = new Set([
  DEMO_EMAIL_PRIMARY,
  'demo@nomad.app',
]);

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && DEMO_EMAILS.has(email);
}
