import React from 'react'
import { Save, Plug, RefreshCw, Unplug } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useDawarichConnection } from '../../hooks/useDawarichConnection'
import DawarichIcon from '../shared/DawarichIcon'
import Section from './Section'
import ToggleSwitch from './ToggleSwitch'

/**
 * Settings → Integrations → Dawarich.
 *
 * All of the behaviour is in `useDawarichConnection`, shared with the phone
 * twin; this file is markup. The layout follows the AirTrail and LLM sections
 * so the three read as one shelf, but the classes are the semantic tokens
 * rather than the raw `slate-*` those two still carry — a new surface has to
 * follow the user's accent and colour scheme.
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
    <Section title={t('dawarich.title')} icon={DawarichIcon}>
      <div className="space-y-3">
        <p className="text-caption text-content-secondary">{t('dawarich.intro')}</p>

        <div>
          <label htmlFor="dawarich-url" className="block text-caption font-medium mb-1.5 text-content-secondary">
            {t('dawarich.url')}
          </label>
          <input
            id="dawarich-url"
            type="url"
            value={S.url}
            onChange={e => S.setUrl(e.target.value)}
            placeholder="https://dawarich.example.com"
            className="w-full px-3 py-2.5 border rounded-lg text-body focus:outline-none focus:ring-2 ring-accent border-edge bg-surface-input text-content"
          />
        </div>

        <div>
          <label htmlFor="dawarich-key" className="block text-caption font-medium mb-1.5 text-content-secondary">
            {t('dawarich.apiKey')}
          </label>
          <input
            id="dawarich-key"
            type="password"
            value={S.apiKey}
            onChange={e => S.setApiKey(e.target.value)}
            autoComplete="off"
            placeholder={S.connected && !S.apiKey ? '••••••••' : t('dawarich.apiKeyPlaceholder')}
            className="w-full px-3 py-2.5 border rounded-lg text-body focus:outline-none focus:ring-2 ring-accent border-edge bg-surface-input text-content"
          />
          <p className="mt-1 text-caption text-content-muted">{t('dawarich.apiKeyHint')}</p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <ToggleSwitch on={S.syncEnabled} onToggle={S.toggleSync} label={t('dawarich.syncEnabled')} />
            <span className="text-body font-medium text-content-secondary">{t('dawarich.syncEnabled')}</span>
          </div>
          <p className="mt-1 text-caption text-content-muted">{t('dawarich.syncEnabledHint')}</p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <ToggleSwitch on={S.allowInsecureTls} onToggle={S.toggleInsecureTls} label={t('dawarich.allowInsecureTls')} />
            <span className="text-body font-medium text-content-secondary">{t('dawarich.allowInsecureTls')}</span>
          </div>
          <p className="mt-1 text-caption text-content-muted">{t('dawarich.allowInsecureTlsHint')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={S.save}
            disabled={S.saving || S.loading || !S.canSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-body font-medium bg-accent text-accent-text hover:bg-accent-hover disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {t('common.save')}
          </button>

          <button
            type="button"
            onClick={S.test}
            disabled={S.testing || S.loading || !S.url.trim()}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-body border-edge text-content-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            {S.testing
              ? <span className="w-4 h-4 border-2 rounded-full animate-spin border-edge border-t-transparent" />
              : <Plug className="w-4 h-4" />}
            {t('dawarich.test.button')}
          </button>

          {S.connected && (
            <button
              type="button"
              onClick={S.syncNow}
              disabled={S.syncing}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-body border-edge text-content-secondary hover:bg-surface-hover disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${S.syncing ? 'animate-spin' : ''}`} />
              {t('dawarich.syncNow')}
            </button>
          )}

          <span className="basis-full sm:basis-auto text-caption font-medium flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${S.connected ? 'bg-success' : 'bg-surface-tertiary'}`} />
            <span className={S.connected ? 'text-success' : 'text-content-muted'}>
              {S.connected ? t('dawarich.connected') : t('dawarich.notConnected')}
            </span>
          </span>

          {S.connected && (
            <button
              type="button"
              onClick={S.disconnect}
              disabled={S.saving}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-caption text-danger hover:bg-danger-soft disabled:opacity-50"
            >
              <Unplug className="w-3.5 h-3.5" /> {t('dawarich.disconnect')}
            </button>
          )}
        </div>

        <DawarichConnectionStatus state={S} locale={locale} />
      </div>
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
    <div className="rounded-lg border p-3 space-y-1.5 border-edge bg-surface-secondary">
      {state.probeMessage && <p className="text-caption text-content">{state.probeMessage}</p>}

      {state.connected && (
        <p className="text-caption text-content-secondary">
          {state.lastSyncAt
            ? t('dawarich.lastSync', { when: new Date(state.lastSyncAt).toLocaleString(locale) })
            : t('dawarich.neverSynced')}
          {state.lastSyncState === 'partial' && ` · ${t('dawarich.syncPartial')}`}
        </p>
      )}

      {state.lastSyncError && (
        <p className="text-caption text-danger">{state.lastSyncError}</p>
      )}

      {state.capabilities?.serverVersion && (
        <p className="text-caption text-content-muted">
          {t('dawarich.serverVersion', { version: state.capabilities.serverVersion })}
        </p>
      )}

      {missing.length > 0 && (
        <p className="text-caption text-content-muted">
          {t('dawarich.capability.missing', { features: missing.join(', ') })}
        </p>
      )}
    </div>
  )
}
