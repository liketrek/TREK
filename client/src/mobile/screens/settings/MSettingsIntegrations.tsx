import MPhotoProvidersSection from './MPhotoProvidersSection'
import MAirTrailConnectionSection from './MAirTrailConnectionSection'
import MDawarichConnectionSection from './MDawarichConnectionSection'
import MLlmConnectionSection from './MLlmConnectionSection'
import MSettingsMcp from './MSettingsMcp'
import { useIntegrationGates } from '../../../components/Settings/useIntegrationGates'

/**
 * "Integrations" section. The photo-provider / AirTrail / LLM connection forms
 * are the existing (responsive) desktop sections rendered as-is — they carry
 * their own cards and addon gating — while the MCP configuration named in the
 * function audit is rebuilt natively in the mobile design language.
 */
export default function MSettingsIntegrations() {
  const { mcpEnabled, airtrailEnabled, llmEnabled, dawarichEnabled, managed } = useIntegrationGates({ reloadAddons: true })

  return (
    <>
      {/* Immich, Synology Photos, AirTrail and Dawarich all reach a server the reader
          runs themselves, which a managed install has no route to: the same gate the
          desktop shell puts on them. */}
      {!managed && <MPhotoProvidersSection />}
      {airtrailEnabled && !managed && <MAirTrailConnectionSection />}
      {dawarichEnabled && !managed && <MDawarichConnectionSection />}
      {/* Which model reads a booking, and what that costs, comes with the instance on
       a managed install. The per-user fallback exists for people who supply their
       own key, and there nobody does. */}
      {llmEnabled && !managed && <MLlmConnectionSection />}
      {mcpEnabled && <MSettingsMcp />}
    </>
  )
}
