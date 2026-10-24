import { Check, Copy, ExternalLink, MessagesSquare } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import MPhotoProvidersSection from './MPhotoProvidersSection'
import MAirTrailConnectionSection from './MAirTrailConnectionSection'
import MDawarichConnectionSection from './MDawarichConnectionSection'
import MLlmConnectionSection from './MLlmConnectionSection'
import MAiConnectionSection from './MAiConnectionSection'
import MSettingsMcp from './MSettingsMcp'
import { MSetButton, MSetCard, MSetHint } from './MSettingsUi'
import { useIntegrationGates } from '../../../components/Settings/useIntegrationGates'
import { useClaudeConnector } from '../../../components/Settings/ai/useClaudeConnector'
import { CLAUDE_CONNECTOR_ANCHOR } from '../../../components/Settings/ai/aiConnectModel'

/**
 * "Integrations" section. The photo-provider / AirTrail / LLM connection forms
 * are the existing (responsive) desktop sections rendered as-is — they carry
 * their own cards and addon gating — while the MCP configuration named in the
 * function audit is rebuilt natively in the mobile design language.
 */
export default function MSettingsIntegrations() {
  const { mcpEnabled, airtrailEnabled, llmEnabled, aiAssistantEnabled, aiConnectionEnabled, ownParsing, dawarichEnabled, managed } = useIntegrationGates({ reloadAddons: true })

  return (
    <>
      {/* Immich, Synology Photos, AirTrail and Dawarich all reach a server the reader
          runs themselves, which a managed install has no route to: the same gate the
          desktop shell puts on them. */}
      {!managed && <MPhotoProvidersSection />}
      {airtrailEnabled && !managed && <MAirTrailConnectionSection />}
      {dawarichEnabled && !managed && <MDawarichConnectionSection />}
      {aiConnectionEnabled && !managed && <MAiConnectionSection assistant={aiAssistantEnabled} parsing={llmEnabled} />}
      {/* Which model reads a booking, and what that costs, comes with the instance on
       a managed install. The per-user fallback exists for people who supply their
       own key, and there nobody does. */}
      {llmEnabled && ownParsing && !managed && <MLlmConnectionSection />}
      {mcpEnabled && <MClaudeConnectorCard />}
      {mcpEnabled && <MSettingsMcp />}
    </>
  )
}

/**
 * "Connect with Claude" on the phone: the button and the address only. The QR
 * code is for reaching a phone from a desktop, and this is the phone.
 */
function MClaudeConnectorCard() {
  const { t } = useTranslation()
  const { connector, reachable, copied, copyUrl } = useClaudeConnector()
  return (
    <div id={CLAUDE_CONNECTOR_ANCHOR}>
      <MSetCard title={t('assistant.claude.title')} icon={MessagesSquare} className="mt-3">
        <MSetHint className="mb-3">{t('assistant.claude.description')}</MSetHint>
        {connector && !reachable && <MSetHint>{t('assistant.claude.notPublic')}</MSetHint>}
        {connector && reachable && (
          <div className="flex flex-wrap gap-2">
            <MSetButton onClick={() => window.open(connector.deepLink, '_blank', 'noopener,noreferrer')}>
              <ExternalLink size={14} /> {t('assistant.claude.open')}
            </MSetButton>
            <MSetButton variant="ghost" onClick={() => void copyUrl()}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t('common.copied') : t('assistant.claude.copyUrl')}
            </MSetButton>
          </div>
        )}
      </MSetCard>
    </div>
  )
}
