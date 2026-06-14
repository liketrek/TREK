/**
 * Auth gate — a single boolean the sync layer checks before touching the
 * offline DB. It lets logout disable all background sync (flush / syncAll /
 * periodic triggers) *before* awaiting the DB swap, so an in-flight loop can't
 * re-seed the database after the user has logged out.
 *
 * Kept separate from authStore to avoid an import cycle
 * (authStore → tripSyncManager → authStore).
 */
let _authed = false

export function setAuthed(value: boolean): void {
  _authed = value
}

export function isAuthed(): boolean {
  return _authed
}
