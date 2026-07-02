/**
 * Resolve a user's raw `avatar` field to an <img src>.
 *
 * The value is either an uploaded file name (served from /uploads/avatars) or,
 * for SSO users who never uploaded one, an absolute https URL from their OIDC
 * `picture` claim (#1399), which is used as-is. Server responses usually expose a
 * pre-resolved `avatar_url`; use this only where components read the raw field.
 */
export function avatarSrc(avatar?: string | null): string | null {
  if (!avatar) return null
  return /^https:\/\//i.test(avatar) ? avatar : `/uploads/avatars/${avatar}`
}
