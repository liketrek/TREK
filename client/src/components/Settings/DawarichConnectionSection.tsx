import React from 'react'
import { Loader2, Save, Plug, RefreshCw, Unplug } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useDawarichConnection } from '../../hooks/useDawarichConnection'
import DawarichIcon from '../shared/DawarichIcon'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsHint, StatusPill } from './settingsKit'
import { EditorField, GRID_2, INPUT } from '../shared/dialogParts'
import { fs } from '../shared/DialogShell'

/**
 * Settings → Integrations → Dawarich.
 *
 * All of the behaviour is in `useDawarichConnection`, shared with the phone
 * twin; this file is markup. The layout follows the AirTrail and LLM sections
 * so the three read as one shelf: fields side by side, the switches as rows,
 * the actions under them and the connection state as a pill in the band.
 *
 * The status block below the fields is the part that earns its space: a
 * connection to somebody else's server fails in ways they can act on — a wrong
 * key, a certificate, an instance that is simply off — and "not connected" with
 * no reason is the version of this card that generates support questions.
 */
export default function DawarichConnectionSection(): React.ReactElement {
  const { t, locale } = useTranslation()
  const S = useDawarichConnection()

  return (
    <Section
      title={t('dawarich.title')}
      icon={DawarichIcon}
      badge={
        <StatusPill tone={S.connected ? 'success' : 'neutral'} icon={<span className="h-1.5 w-1.5 rounded-full bg-current" />}>
          {S.connected ? t('dawarich.connected') : t('dawarich.notConnected')}
        </StatusPill>
      }
    >
      <SettingsHint>{t('dawarich.intro')}</SettingsHint>

      <div className={GRID_2}>
        <EditorField label={t('dawarich.url')} htmlFor="dawarich-url">
          <input
            id="dawarich-url"
            type="url"
            value={S.url}
            onChange={e => S.setUrl(e.target.value)}
            placeholder="https://dawarich.example.com"
            className={INPUT}
          />
        </EditorField>

        <EditorField label={t('dawarich.apiKey')} htmlFor="dawarich-key" hint={t('dawarich.apiKeyHint')}>
          <input
            id="dawarich-key"
            type="password"
            value={S.apiKey}
            onChange={e => S.setApiKey(e.target.value)}
            autoComplete="off"
            placeholder={S.connected && !S.apiKey ? '••••••••' : t('dawarich.apiKeyPlaceholder')}
            className={INPUT}
          />
        </EditorField>
      </div>

      <SettingRows>
        <SettingRow
          label={t('dawarich.syncEnabled')}
          hint={t('dawarich.syncEnabledHint')}
          control={<ToggleSwitch on={S.syncEnabled} onToggle={S.toggleSync} label={t('dawarich.syncEnabled')} />}
        />
        <SettingRow
          label={t('dawarich.allowInsecureTls')}
          hint={t('dawarich.allowInsecureTlsHint')}
          control={<ToggleSwitch on={S.allowInsecureTls} onToggle={S.toggleInsecureTls} label={t('dawarich.allowInsecureTls')} />}
        />
      </SettingRows>

      <div className="flex flex-wrap items-center gap-2" style={fs(13, 'body')}>
        <button
          type="button"
          onClick={S.save}
          disabled={S.saving || S.loading || !S.canSave}
          className={SETTINGS_BUTTON_PRIMARY}
        >
          <Save size={14} strokeWidth={2.2} /> {t('common.save')}
        </button>

        <button
          type="button"
          onClick={S.test}
          disabled={S.testing || S.loading || !S.url.trim()}
          className={SETTINGS_BUTTON}
        >
          {S.testing
            ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
            : <Plug size={14} strokeWidth={2.2} />}
          {t('dawarich.test.button')}
        </button>

        {S.connected && (
          <button
            type="button"
            onClick={S.syncNow}
            disabled={S.syncing}
            className={SETTINGS_BUTTON}
          >
            <RefreshCw size={14} strokeWidth={2.2} className={S.syncing ? 'animate-spin' : ''} />
            {t('dawarich.syncNow')}
          </button>
        )}

        {/* The way out sits apart from the everyday actions, on the far right. */}
        {S.connected && (
          <button
            type="button"
            onClick={S.disconnect}
            disabled={S.saving}
            className={`${SETTINGS_BUTTON_DANGER} ml-auto`}
          >
            <Unplug size={14} strokeWidth={2.2} /> {t('dawarich.disconnect')}
          </button>
        )}
      </div>

      <DawarichConnectionStatus state={S} locale={locale} />
    </Section>
  )
}

/**
 * Where the connection stands, in the place where it helps someone decide what
 * to do next: what the last sync did, and which parts of their instance TREK
 * could actually reach.
 *
 * Its own component because the phone twin renders the same three facts in a
 * different frame, and because it is the bit that keeps growing.
 */
function DawarichConnectionStatus({
  state,
  locale,
}: {
  state: ReturnType<typeof useDawarichConnection>
  locale: string
}): React.ReactElement | null {
  const { t } = useTranslation()
  if (!state.connected && !state.probeMessage) return null

  const missing: string[] = []
  if (state.capabilities) {
    if (!state.capabilities.visits) missing.push(t('dawarich.capability.visits'))
    if (!state.capabilities.tracks && !state.capabilities.points) missing.push(t('dawarich.capability.track'))
    if (!state.capabilities.locations) missing.push(t('dawarich.capability.locations'))
    if (!state.capabilities.visitedCities) missing.push(t('dawarich.capability.visitedCities'))
  }

  return (
    <div className="flex flex-col gap-1 rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3" style={fs(12, 'body')}>
      {state.probeMessage && <p className="m-0 font-medium text-content">{state.probeMessage}</p>}

      {state.connected && (
        <p className="m-0 text-content-secondary">
          {state.lastSyncAt
            ? t('dawarich.lastSync', { when: new Date(state.lastSyncAt).toLocaleString(locale) })
            : t('dawarich.neverSynced')}
          {state.lastSyncState === 'partial' && ` · ${t('dawarich.syncPartial')}`}
        </p>
      )}

      {state.lastSyncError && (
        <p className="m-0 text-danger">{state.lastSyncError}</p>
      )}

      {state.capabilities?.serverVersion && (
        <p className="m-0 font-geist tabular-nums text-content-muted">
          {t('dawarich.serverVersion', { version: state.capabilities.serverVersion })}
        </p>
      )}

      {missing.length > 0 && (
        <p className="m-0 text-content-muted">
          {t('dawarich.capability.missing', { features: missing.join(', ') })}
        </p>
      )}
    </div>
  )
}
