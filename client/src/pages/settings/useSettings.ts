import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/client'
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
  const llmEnabled = addonEnabled('llm_parsing')
  const hasIntegrations = memoriesEnabled || mcpEnabled || airtrailEnabled || llmEnabled

  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('display')

  useEffect(() => {
    loadAddons()
    authApi.getAppConfig?.().then(c => setAppVersion(c?.version)).catch(() => {})
  }, [])

  // Auto-switch to account tab when MFA is required
  useEffect(() => {
    if (searchParams.get('mfa') === 'required') {
      setActiveTab('account')
    }
  }, [searchParams])

  return { hasIntegrations, appVersion, activeTab, setActiveTab }
}
