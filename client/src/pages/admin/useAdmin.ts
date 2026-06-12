import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient, { adminApi, authApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useAddonStore } from '../../store/addonStore'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../types'
import { useToast } from '../../components/shared/Toast'
import type { AdminUser, AdminStats, OidcConfig, UpdateInfo } from './adminModel'

/**
 * Admin page logic — owns every admin data slice (users, stats, invites, auth
 * toggles, OIDC, feature flags, API keys, SMTP, version/update) plus the CRUD
 * and toggle handlers. AdminPage stays a wiring container that builds the
 * (t-dependent) tab list and renders the tab panels around this state.
 * Behaviour is identical to the previous in-component logic.
 */
export function useAdmin() {
  const { demoMode, serverTimezone } = useAuthStore()
  const { t } = useTranslation()
  const hour12 = useSettingsStore(s => s.settings.time_format) === '12h'
  const mcpEnabled = useAddonStore(s => s.isEnabled('mcp'))
  const devMode = useAuthStore(s => s.devMode)

  const [activeTab, setActiveTab] = useState<string>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<{ username: string; email: string; role: string; password: string }>({ username: '', email: '', role: 'user', password: '' })
  const [showCreateUser, setShowCreateUser] = useState<boolean>(false)
  const [createForm, setCreateForm] = useState<{ username: string; email: string; password: string; role: string }>({ username: '', email: '', password: '', role: 'user' })

  // Bag tracking
  const [bagTrackingEnabled, setBagTrackingEnabled] = useState<boolean>(false)
  useEffect(() => { adminApi.getBagTracking().then(d => setBagTrackingEnabled(d.enabled)).catch(() => {}) }, [])

  // Places photos
  const [placesPhotosEnabled, setPlacesPhotosEnabledState] = useState<boolean>(true)
  useEffect(() => { adminApi.getPlacesPhotos().then(d => setPlacesPhotosEnabledState(d.enabled)).catch(() => {}) }, [])

  // Places autocomplete
  const [placesAutocompleteEnabled, setPlacesAutocompleteEnabledState] = useState<boolean>(true)
  useEffect(() => { adminApi.getPlacesAutocomplete().then(d => setPlacesAutocompleteEnabledState(d.enabled)).catch(() => {}) }, [])

  // Places details
  const [placesDetailsEnabled, setPlacesDetailsEnabledState] = useState<boolean>(true)
  useEffect(() => { adminApi.getPlacesDetails().then(d => setPlacesDetailsEnabledState(d.enabled)).catch(() => {}) }, [])

  // Collab features
  const [collabFeatures, setCollabFeatures] = useState<{ chat: boolean; notes: boolean; polls: boolean; whatsnext: boolean }>({ chat: true, notes: true, polls: true, whatsnext: true })
  useEffect(() => { adminApi.getCollabFeatures().then(d => setCollabFeatures(d)).catch(() => {}) }, [])

  // OIDC config
  const [oidcConfig, setOidcConfig] = useState<OidcConfig>({ issuer: '', client_id: '', client_secret: '', client_secret_set: false, display_name: '', discovery_url: '' })
  const [savingOidc, setSavingOidc] = useState<boolean>(false)

  // Auth toggles
  const [passwordLogin, setPasswordLogin] = useState<boolean>(true)
  const [passwordRegistration, setPasswordRegistration] = useState<boolean>(true)
  const [oidcLogin, setOidcLogin] = useState<boolean>(true)
  const [oidcRegistration, setOidcRegistration] = useState<boolean>(true)
  const [envOverrideOidcOnly, setEnvOverrideOidcOnly] = useState<boolean>(false)
  const [oidcConfigured, setOidcConfigured] = useState<boolean>(false)
  const [requireMfa, setRequireMfa] = useState<boolean>(false)

  // Passkey (WebAuthn) login
  const [passkeyLogin, setPasskeyLogin] = useState<boolean>(false)
  const [passkeyConfigured, setPasskeyConfigured] = useState<boolean>(false)
  const [webauthnRpId, setWebauthnRpId] = useState<string>('')
  const [webauthnOrigins, setWebauthnOrigins] = useState<string>('')
  const [savingWebauthn, setSavingWebauthn] = useState<boolean>(false)

  // Invite links
  const [invites, setInvites] = useState<any[]>([])
  const [showCreateInvite, setShowCreateInvite] = useState<boolean>(false)
  const [inviteForm, setInviteForm] = useState<{ max_uses: number; expires_in_days: number | '' }>({ max_uses: 1, expires_in_days: 7 })

  // File types
  const [allowedFileTypes, setAllowedFileTypes] = useState<string>('jpg,jpeg,png,gif,webp,heic,pdf,doc,docx,xls,xlsx,txt,csv')
  const [savingFileTypes, setSavingFileTypes] = useState<boolean>(false)

  // SMTP settings
  const [smtpValues, setSmtpValues] = useState<Record<string, string>>({})
  const [smtpLoaded, setSmtpLoaded] = useState(false)
  useEffect(() => {
    apiClient.get('/auth/app-settings').then(r => {
      setSmtpValues(r.data || {})
      if (r.data?.webauthn_rp_id) setWebauthnRpId(r.data.webauthn_rp_id)
      if (r.data?.webauthn_origins) setWebauthnOrigins(r.data.webauthn_origins)
      setSmtpLoaded(true)
    }).catch(() => setSmtpLoaded(true))
  }, [])

  // API Keys
  const [mapsKey, setMapsKey] = useState<string>('')
  const [weatherKey, setWeatherKey] = useState<string>('')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [savingKeys, setSavingKeys] = useState<boolean>(false)
  const [validating, setValidating] = useState<Record<string, boolean>>({})
  const [validation, setValidation] = useState<Record<string, boolean | undefined>>({})

  // Version check & update
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)

  const { user: currentUser, updateApiKeys, setAppRequireMfa, setTripRemindersEnabled, setPlacesPhotosEnabled, setPlacesAutocompleteEnabled, setPlacesDetailsEnabled, logout } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()

  const [showRotateJwtModal, setShowRotateJwtModal] = useState<boolean>(false)
  const [rotatingJwt, setRotatingJwt] = useState<boolean>(false)

  useEffect(() => {
    loadData()
    loadAppConfig()
    loadApiKeys()
    adminApi.getOidc().then(setOidcConfig).catch(() => {})
    adminApi.checkVersion().then(data => {
      if (data.update_available) setUpdateInfo(data)
    }).catch(() => {})
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersData, statsData, invitesData] = await Promise.all([
        adminApi.users(),
        adminApi.stats(),
        adminApi.listInvites().catch(() => ({ invites: [] })),
      ])
      setUsers(usersData.users)
      setStats(statsData)
      setInvites(invitesData.invites || [])
    } catch (err: unknown) {
      toast.error(t('admin.toast.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const loadAppConfig = async () => {
    try {
      const config = await authApi.getAppConfig()
      setPasswordLogin(config.password_login ?? true)
      setPasswordRegistration(config.password_registration ?? config.allow_registration ?? true)
      setOidcLogin(config.oidc_login ?? true)
      setOidcRegistration(config.oidc_registration ?? config.allow_registration ?? true)
      setEnvOverrideOidcOnly(config.env_override_oidc_only ?? false)
      setOidcConfigured(config.oidc_configured ?? false)
      if (config.require_mfa !== undefined) setRequireMfa(!!config.require_mfa)
      setPasskeyLogin(!!config.passkey_login)
      setPasskeyConfigured(!!config.passkey_configured)
      if (config.allowed_file_types) setAllowedFileTypes(config.allowed_file_types)
    } catch (err: unknown) {
      // ignore
    }
  }

  const loadApiKeys = async () => {
    try {
      const data = await authApi.getSettings()
      setMapsKey(data.settings?.maps_api_key || '')
      setWeatherKey(data.settings?.openweather_api_key || '')
    } catch (err: unknown) {
      // ignore
    }
  }

  const handleToggleAuthSetting = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value)
    try {
      await authApi.updateAppSettings({ [key]: value })
    } catch (err: unknown) {
      setter(!value)
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }

  const handleToggleRequireMfa = async (value: boolean) => {
    setRequireMfa(value)
    try {
      await authApi.updateAppSettings({ require_mfa: value })
      setAppRequireMfa(value)
      toast.success(t('common.saved'))
    } catch (err: unknown) {
      setRequireMfa(!value)
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }

  const handleSaveWebauthn = async () => {
    setSavingWebauthn(true)
    try {
      await authApi.updateAppSettings({
        webauthn_rp_id: webauthnRpId.trim(),
        webauthn_origins: webauthnOrigins.trim(),
      })
      // Re-read app-config so passkey_configured reflects the new RP ID.
      await loadAppConfig()
      toast.success(t('common.saved'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSavingWebauthn(false)
    }
  }

  const toggleKey = (key) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveApiKeys = async () => {
    setSavingKeys(true)
    try {
      await updateApiKeys({
        maps_api_key: mapsKey,
        openweather_api_key: weatherKey,
      })
      toast.success(t('admin.keySaved'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSavingKeys(false)
    }
  }

  const handleValidateKeys = async () => {
    setValidating({ maps: true, weather: true })
    try {
      // Save first so validation uses the current values
      await updateApiKeys({ maps_api_key: mapsKey, openweather_api_key: weatherKey })
      const result = await authApi.validateKeys()
      setValidation(result)
    } catch (err: unknown) {
      toast.error(t('common.error'))
    } finally {
      setValidating({})
    }
  }

  const handleValidateKey = async (keyType) => {
    setValidating(prev => ({ ...prev, [keyType]: true }))
    try {
      // Save first so validation uses the current values
      await updateApiKeys({ maps_api_key: mapsKey, openweather_api_key: weatherKey })
      const result = await authApi.validateKeys()
      setValidation(prev => ({ ...prev, [keyType]: result[keyType] }))
    } catch (err: unknown) {
      toast.error(t('common.error'))
    } finally {
      setValidating(prev => ({ ...prev, [keyType]: false }))
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error(t('admin.toast.fieldsRequired'))
      return
    }
    if (createForm.password.trim().length < 8) {
      toast.error(t('settings.passwordTooShort'))
      return
    }
    try {
      const data = await adminApi.createUser(createForm)
      setUsers(prev => [data.user, ...prev])
      setShowCreateUser(false)
      setCreateForm({ username: '', email: '', password: '', role: 'user' })
      toast.success(t('admin.toast.userCreated'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('admin.toast.createError')))
    }
  }

  const handleCreateInvite = async () => {
    try {
      const data = await adminApi.createInvite({
        max_uses: inviteForm.max_uses,
        expires_in_days: inviteForm.expires_in_days || undefined,
      })
      setInvites(prev => [data.invite, ...prev])
      setShowCreateInvite(false)
      setInviteForm({ max_uses: 1, expires_in_days: 7 })
      // Copy link to clipboard
      const link = `${window.location.origin}/register?invite=${data.invite.token}`
      navigator.clipboard.writeText(link).then(() => toast.success(t('admin.invite.copied')))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('admin.invite.createError')))
    }
  }

  const handleDeleteInvite = async (id: number) => {
    try {
      await adminApi.deleteInvite(id)
      setInvites(prev => prev.filter(i => i.id !== id))
      toast.success(t('admin.invite.deleted'))
    } catch {
      toast.error(t('admin.invite.deleteError'))
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/register?invite=${token}`
    navigator.clipboard.writeText(link).then(() => toast.success(t('admin.invite.copied')))
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setEditForm({ username: user.username, email: user.email, role: user.role, password: '' })
  }

  const handleSaveUser = async () => {
    try {
      const payload: { username?: string; email?: string; role: string; password?: string } = {
        username: editForm.username.trim() || undefined,
        email: editForm.email.trim() || undefined,
        role: editForm.role,
      }
      if (editForm.password.trim()) {
        if (editForm.password.trim().length < 8) {
          toast.error(t('settings.passwordTooShort'))
          return
        }
        payload.password = editForm.password.trim()
      }
      const data = await adminApi.updateUser(editingUser.id, payload)
      setUsers(prev => prev.map(u => u.id === editingUser.id ? data.user : u))
      setEditingUser(null)
      toast.success(t('admin.toast.userUpdated'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('admin.toast.updateError')))
    }
  }

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error(t('admin.toast.cannotDeleteSelf'))
      return
    }
    if (!confirm(t('admin.deleteUser', { name: user.username }))) return
    try {
      await adminApi.deleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast.success(t('admin.toast.userDeleted'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('admin.toast.deleteError')))
    }
  }

  return {
    // store-derived
    demoMode, serverTimezone, hour12, mcpEnabled, devMode, currentUser,
    updateApiKeys, setAppRequireMfa, setTripRemindersEnabled,
    setPlacesPhotosEnabled, setPlacesAutocompleteEnabled, setPlacesDetailsEnabled, logout,
    navigate, toast,
    // state + setters
    activeTab, setActiveTab, users, setUsers, stats, isLoading,
    editingUser, setEditingUser, editForm, setEditForm,
    showCreateUser, setShowCreateUser, createForm, setCreateForm,
    bagTrackingEnabled, setBagTrackingEnabled,
    placesPhotosEnabled, setPlacesPhotosEnabledState,
    placesAutocompleteEnabled, setPlacesAutocompleteEnabledState,
    placesDetailsEnabled, setPlacesDetailsEnabledState,
    collabFeatures, setCollabFeatures,
    oidcConfig, setOidcConfig, savingOidc, setSavingOidc,
    passwordLogin, setPasswordLogin, passwordRegistration, setPasswordRegistration,
    oidcLogin, setOidcLogin, oidcRegistration, setOidcRegistration,
    envOverrideOidcOnly, setEnvOverrideOidcOnly, oidcConfigured, setOidcConfigured,
    requireMfa, setRequireMfa,
    passkeyLogin, setPasskeyLogin, passkeyConfigured,
    webauthnRpId, setWebauthnRpId, webauthnOrigins, setWebauthnOrigins, savingWebauthn, handleSaveWebauthn,
    invites, setInvites, showCreateInvite, setShowCreateInvite, inviteForm, setInviteForm,
    allowedFileTypes, setAllowedFileTypes, savingFileTypes, setSavingFileTypes,
    smtpValues, setSmtpValues, smtpLoaded,
    mapsKey, setMapsKey, weatherKey, setWeatherKey,
    showKeys, setShowKeys, savingKeys, validating, validation,
    updateInfo, setUpdateInfo, showUpdateModal, setShowUpdateModal,
    showRotateJwtModal, setShowRotateJwtModal, rotatingJwt, setRotatingJwt,
    // handlers
    loadData, loadAppConfig, loadApiKeys, handleToggleAuthSetting, handleToggleRequireMfa,
    toggleKey, handleSaveApiKeys, handleValidateKeys, handleValidateKey,
    handleCreateUser, handleCreateInvite, handleDeleteInvite, copyInviteLink,
    handleEditUser, handleSaveUser, handleDeleteUser,
  }
}
