import { useNavigate } from 'react-router'
import { Bell, Link2, Lock, Send } from 'lucide-react'
import { WEB_PUSH_CHANNEL_ID } from '@trek/shared'
import { useTranslation } from '../../../i18n'
import { MSetCard, MSetEyebrow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MChip from '../../components/MChip'
import MWebPushCard from './MWebPushCard'
import { EVENT_LABEL_KEYS, channelLabel, isLockedCell } from '../../../components/Settings/notificationLabels'
import { MASKED, useNotificationSettings } from '../../../components/Settings/useNotificationSettings'

/**
 * "Notifications" section — NotificationsTab parity: webhook + ntfy channel
 * credentials, push on this device, plugin channels and the event/channel
 * preference matrix, rendered as chip rows instead of the desktop grid.
 */
export default function MSettingsNotifications() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    matrix, saving, visibleChannels, hasChannel, pluginChannels, toggle, testChannel, channelTesting,
    webhookUrl, setWebhookUrl, webhookIsSet, webhookSaving, webhookTesting, saveWebhookUrl, testWebhookUrl,
    ntfyTopic, setNtfyTopic, ntfyServer, setNtfyServer, ntfyToken, setNtfyToken, ntfyTokenIsSet,
    ntfySaving, ntfyTesting, saveNtfySettings, clearNtfyToken, testNtfySettings,
  } = useNotificationSettings({ skipMaskedToken: true })

  return (
    <MSetCard title={t('settings.notifications')} icon={Bell}>
      {!matrix && <p className="font-geist text-[0.6875rem] italic text-m-faint">{t('common.loading')}</p>}

      {matrix && visibleChannels.length === 0 && (
        <p className="font-geist text-[0.6875rem] italic text-m-faint">{t('settings.notificationPreferences.noChannels')}</p>
      )}

      {matrix && visibleChannels.length > 0 && (
        <>
          {hasChannel('webhook') && (
            <div className="mb-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
              <MSetEyebrow className="mb-1">{t('settings.webhookUrl.label')}</MSetEyebrow>
              <MSetHint className="mb-2 mt-0">{t('settings.webhookUrl.hint')}</MSetHint>
              <MSetInput
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder={webhookIsSet ? MASKED : t('settings.webhookUrl.placeholder')}
              />
              <div className="mt-2 flex gap-2">
                <MSetButton onClick={saveWebhookUrl} disabled={webhookSaving}>
                  {t('common.save')}
                </MSetButton>
                <MSetButton variant="ghost" onClick={testWebhookUrl} disabled={(!webhookUrl && !webhookIsSet) || webhookTesting}>
                  <Send size={13} />
                  {t('settings.webhookUrl.test')}
                </MSetButton>
              </div>
            </div>
          )}

          {hasChannel('ntfy') && (
            <div className="mb-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
              <MSetEyebrow className="mb-1">{t('settings.ntfyUrl.topicLabel')}</MSetEyebrow>
              <MSetHint className="mb-2 mt-0">{t('settings.ntfyUrl.hint')}</MSetHint>
              <MSetInput value={ntfyTopic} onChange={(e) => setNtfyTopic(e.target.value)} placeholder={t('settings.ntfyUrl.topicPlaceholder')} />
              <MSetEyebrow className="mb-1 mt-3">{t('settings.ntfyUrl.serverLabel')}</MSetEyebrow>
              <MSetInput
                value={ntfyServer}
                onChange={(e) => setNtfyServer(e.target.value)}
                placeholder={matrix.defaults?.ntfyServer || t('settings.ntfyUrl.serverPlaceholder')}
              />
              <MSetEyebrow className="mb-1 mt-3">{t('settings.ntfyUrl.tokenLabel')}</MSetEyebrow>
              <MSetHint className="mb-2 mt-0">{t('settings.ntfyUrl.tokenHint')}</MSetHint>
              <MSetInput
                type="password"
                value={ntfyToken}
                onChange={(e) => setNtfyToken(e.target.value)}
                placeholder={ntfyTokenIsSet ? MASKED : ''}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <MSetButton onClick={saveNtfySettings} disabled={ntfySaving}>
                  {t('common.save')}
                </MSetButton>
                <MSetButton variant="ghost" onClick={testNtfySettings} disabled={!ntfyTopic || ntfyTesting}>
                  <Send size={13} />
                  {t('settings.ntfyUrl.test')}
                </MSetButton>
                {ntfyTokenIsSet && (
                  <MSetButton variant="danger" onClick={clearNtfyToken}>
                    {t('common.clear')}
                  </MSetButton>
                )}
              </div>
            </div>
          )}

          {hasChannel(WEB_PUSH_CHANNEL_ID) && <MWebPushCard />}

          {pluginChannels.map((ch) => (
            <div key={ch.id} className="mb-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
              <MSetEyebrow className="mb-1">{channelLabel(ch, t)}</MSetEyebrow>
              <MSetHint className="mb-2 mt-0">
                {ch.configured
                  ? t('settings.notificationPreferences.pluginConfigured')
                  : t('settings.notificationPreferences.notConfigured')}
              </MSetHint>
              <div className="flex gap-2">
                {!ch.configured && ch.settingsPath && (
                  <MSetButton onClick={() => navigate(ch.settingsPath!)}>
                    <Link2 size={13} />
                    {t('settings.notificationPreferences.configure')}
                  </MSetButton>
                )}
                <MSetButton variant="ghost" onClick={() => testChannel(ch)} disabled={!ch.configured || channelTesting === ch.id}>
                  <Send size={13} />
                  {t('settings.notificationPreferences.sendTest')}
                </MSetButton>
              </div>
            </div>
          ))}

          {saving && <p className="mb-1 font-geist text-[0.625rem] text-m-faint">{t('common.saving')}</p>}

          {/* Event → channel matrix as chip rows: tap a channel chip to toggle it. */}
          {matrix.event_types.map((eventType, i) => {
            const implementedForEvent = matrix.implemented_combos[eventType] ?? []
            const relevantChannels = visibleChannels.filter((ch) => implementedForEvent.includes(ch.id))
            if (relevantChannels.length === 0) return null
            return (
              <div key={eventType} className={`py-[10px] ${i > 0 ? 'border-t border-[color:var(--m-rowbr)]' : ''}`}>
                <div className="mb-[7px] text-[0.78125rem] font-bold text-m-ink">
                  {t(EVENT_LABEL_KEYS[eventType]) || eventType}
                </div>
                <div className="flex flex-wrap gap-[6px]">
                  {relevantChannels.map((ch) => {
                    const isOn = matrix.preferences[eventType]?.[ch.id] ?? true
                    // Switched off for everyone by the admin (#1536): shown, but locked.
                    if (isLockedCell(matrix.locked, eventType, ch.id)) {
                      return (
                        <span key={ch.id} aria-disabled="true" data-locked
                          aria-label={`${channelLabel(ch, t)}: ${t('settings.notificationPreferences.lockedByAdmin')}`}
                          className="inline-flex flex-none items-center gap-[5px] rounded-full border border-dashed border-[color:var(--m-rowbr)] px-3 py-[7px] text-[0.75rem] font-semibold text-m-faint">
                          <Lock size={11} strokeWidth={2.4} aria-hidden="true" />
                          {channelLabel(ch, t)}
                        </span>
                      )
                    }
                    return (
                      <MChip key={ch.id} active={isOn} onClick={() => toggle(eventType, ch.id)}>
                        {channelLabel(ch, t)}
                      </MChip>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}
    </MSetCard>
  )
}
