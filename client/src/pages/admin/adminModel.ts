/** Shared types and pure helpers for the admin page + its data hook. No React, no side effects. */

export interface AdminUser {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  created_at: string
  last_login?: string | null
  online?: boolean
  oidc_issuer?: string | null
  avatar_url?: string | null
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
