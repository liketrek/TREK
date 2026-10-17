/** Shared types and pure helpers for the admin page + its data hook. No React, no side effects. */

export interface AdminUser {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  created_at: string
  last_login?: string | null
  /** The later of the last sign-in and the last request the account made. */
  last_active?: string | null
  online?: boolean
  oidc_issuer?: string | null
  avatar_url?: string | null
}

/**
 * The row after an edit. The update answers with the account fields only, so
 * what the list derives (avatar, last activity, online) stays from the row; a
 * reply that replaced the whole row showed the user as never signed in.
 */
export function mergeSavedUser(row: AdminUser, saved: Pick<AdminUser, 'username' | 'email' | 'role'>): AdminUser {
  return { ...row, username: saved.username, email: saved.email, role: saved.role }
}

/** When a user was last active, with the year once it is not this one. */
export function formatLastActive(iso: string | null | undefined, locale: string, hour12: boolean, now = new Date()): string {
  if (!iso) return '—'
  const at = new Date(iso)
  const sameYear = at.getFullYear() === now.getFullYear()
  return at.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  })
}

export interface AdminStats {
  totalUsers: number
  totalTrips: number
  totalPlaces: number
  totalFiles: number
}

export interface OidcConfig {
  issuer: string
  client_id: string
  client_secret: string
  client_secret_set: boolean
  display_name: string
  discovery_url: string
}

export interface UpdateInfo {
  update_available: boolean
  latest: string
  current: string
  release_url?: string
  is_docker?: boolean
  is_prerelease?: boolean
}

export interface InviteStatus {
  isExpired: boolean
  isUsedUp: boolean
  isActive: boolean
  /** i18n key of the status pill: used up wins over expired. */
  labelKey: 'admin.invite.usedUp' | 'admin.invite.expired' | 'admin.invite.active'
}

/** Where an invite link stands: expired, used up (max_uses 0 is unlimited) or still active. */
export function inviteStatus(
  invite: { expires_at?: string | null; max_uses: number; used_count: number },
  now: Date = new Date(),
): InviteStatus {
  const isExpired = !!invite.expires_at && new Date(invite.expires_at) < now
  const isUsedUp = invite.max_uses > 0 && invite.used_count >= invite.max_uses
  const isActive = !isExpired && !isUsedUp
  const labelKey = isUsedUp ? 'admin.invite.usedUp' : isExpired ? 'admin.invite.expired' : 'admin.invite.active'
  return { isExpired, isUsedUp, isActive, labelKey }
}
