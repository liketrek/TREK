import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { authApi, healthApi } from '../../api/client'
import { useAddonStore } from '../../store/addonStore'

/**
 * Settings page logic — loads addons + the app version, tracks the active tab
 * and the integrations-enabled gate, and auto-switches to the account tab when
 * the URL signals MFA is required. SettingsPage stays a wiring container that
 * builds the (t-dependent) tab list and renders the tab bodies.
 * Behaviour is identical to the previous in-component logic.
 */
export function useSettings() {
  const [searchParams] = useSearchParams()
  const { isEnabled: addonEnabled, loadAddons } = useAddonStore()

  const memoriesEnabled = addonEnabled('memories')
  const mcpEnabled = addonEnabled('mcp')
  const airtrailEnabled = addonEnabled('airtrail')
  const hasIntegrations = memoriesEnabled || mcpEnabled || airtrailEnabled

  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('display')
  // AI parsing: the tab shows when the addon is enabled (master switch); when the
  // admin has defined an instance config (`managed`) the tab renders a note instead
  // of the per-user key form.
  const [aiSettingsAvailable, setAiSettingsAvailable] = useState(false)
  const [aiManaged, setAiManaged] = useState(false)

  useEffect(() => {
    loadAddons()
    authApi.getAppConfig?.().then(c => setAppVersion(c?.version)).catch(() => {})
    healthApi.features()
      .then(f => { setAiSettingsAvailable(!!f.aiParsing); setAiManaged(!!f.aiParsingManaged) })
      .catch(() => {})
  }, [])

  // Auto-switch to account tab when MFA is required
  useEffect(() => {
    if (searchParams.get('mfa') === 'required') {
      setActiveTab('account')
    }
  }, [searchParams])

  return { hasIntegrations, appVersion, activeTab, setActiveTab, aiSettingsAvailable, aiManaged }
}
