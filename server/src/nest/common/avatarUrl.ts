/**
 * Resolve a user's stored avatar reference to a renderable URL.
 *
 * The value is either an uploaded file name (served from /uploads/avatars) or,
 * for SSO users who never uploaded one, an absolute https URL taken from their
 * OIDC `picture` claim (#1399) — that one is passed through untouched.
 */
export function avatarUrl(user: { avatar?: string | null }): string | null {
  if (!user.avatar) return null;
  if (/^https:\/\//i.test(user.avatar)) return user.avatar;
  return `/uploads/avatars/${user.avatar}`;
}
