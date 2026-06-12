/** Shared types for the admin page + its data hook. No React, no side effects. */

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
