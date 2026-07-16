import { useEffect } from 'react'
import { useAddonStore } from '../../../store/addonStore'
import PhotoProvidersSection from '../../../components/Settings/PhotoProvidersSection'
import AirTrailConnectionSection from '../../../components/Settings/AirTrailConnectionSection'
import LlmConnectionSection from '../../../components/Settings/LlmConnectionSection'
import MSettingsMcp from './MSettingsMcp'

/**
 * "Integrations" section. The photo-provider / AirTrail / LLM connection forms
 * are the existing (responsive) desktop sections rendered as-is — they carry
 * their own cards and addon gating — while the MCP configuration named in the
 * function audit is rebuilt natively in the mobile design language.
 */
export default function MSettingsIntegrations() {
  const { isEnabled: addonEnabled, loadAddons } = useAddonStore()
  const mcpEnabled = addonEnabled('mcp')
  const airtrailEnabled = addonEnabled('airtrail')
  const llmEnabled = addonEnabled('llm_parsing')

  useEffect(() => {
    loadAddons()
  }, [loadAddons])

  return (
    <>
      <PhotoProvidersSection />
      {airtrailEnabled && <AirTrailConnectionSection />}
      {llmEnabled && <LlmConnectionSection />}
      {mcpEnabled && <MSettingsMcp />}
    </>
  )
}
