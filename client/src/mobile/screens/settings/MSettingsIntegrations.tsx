import { useEffect } from 'react'
import { useAddonStore } from '../../../store/addonStore'
import MPhotoProvidersSection from './MPhotoProvidersSection'
import MAirTrailConnectionSection from './MAirTrailConnectionSection'
import MLlmConnectionSection from './MLlmConnectionSection'
import MSettingsMcp from './MSettingsMcp'
import { useAuthStore } from '../../../store/authStore'

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
  const managed = useAuthStore((s) => s.managed)

  useEffect(() => {
    loadAddons()
  }, [loadAddons])

  return (
    <>
      <MPhotoProvidersSection />
      {airtrailEnabled && <MAirTrailConnectionSection />}
      {/* Which model reads a booking, and what that costs, comes with the instance on
       a managed install. The per-user fallback exists for people who supply their
       own key, and there nobody does. */}
      {llmEnabled && !managed && <MLlmConnectionSection />}
      {mcpEnabled && <MSettingsMcp />}
    </>
  )
}
