import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { authApi } from '../../api/client'
import { useIntegrationGates } from '../../components/Settings/useIntegrationGates'
import { usePluginStore } from '../../store/pluginStore'

/**
 * Settings page logic — loads addons + the app version, tracks the active tab
 * and the integrations-enabled gate, and auto-switches to the account tab when
 * the URL signals MFA is required. SettingsPage stays a wiring container that
 * builds the (t-dependent) tab list and renders the tab bodies.
 * Behaviour is identical to the previous in-component logic.
 */
export function useSettings() {
  const [searchParams] = useSearchParams()
  const { hasIntegrations, managed, loadAddons } = useIntegrationGates({ reloadAddons: false })
  const hasPlugins = usePluginStore(s => s.plugins.length > 0)

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

  // Deep link into a tab: /settings?tab=plugins. Lets one tab point at another —
  // e.g. an unconfigured plugin notification channel sends you to where its
  // credentials actually live, instead of just naming the place.
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  return { hasIntegrations, hasPlugins, appVersion, activeTab, setActiveTab, managed }
}
