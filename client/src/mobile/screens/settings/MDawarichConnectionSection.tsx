import React from 'react'
import { Plug, Save, RefreshCw, Unplug } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useDawarichConnection } from '../../../hooks/useDawarichConnection'
import { MSetCard, MSetRow, MSetInput, MSetButton, MSetHint } from './MSettingsUi'
import MToggle from '../../components/MToggle'

/**
 * Phone twin of components/Settings/DawarichConnectionSection.
 *
 * Presentation only: every piece of behaviour lives in `useDawarichConnection`,
 * which both shells share. That is not tidiness — SonarCloud allows 3%
 * duplicated lines on a PR's new code, and a second copy of the connect / test /
 * sync logic would spend the whole budget on its own.
 */
export default function MDawarichConnectionSection(): React.ReactElement {
  const { t, locale } = useTranslation()
  const S = useDawarichConnection()

  return (
    <MSetCard title={t('dawarich.title')} icon={Plug} className="mt-3">
      <MSetHint className="mt-0">{t('dawarich.intro')}</MSetHint>

      <div className="mt-3 space-y-3">
        <div>
          <MSetInput
            type="url"
            inputMode="url"
            value={S.url}
            onChange={e => S.setUrl(e.target.value)}
            placeholder="https://dawarich.example.com"
            aria-label={t('dawarich.url')}
          />
        </div>

        <div>
          <MSetInput
            type="password"
            value={S.apiKey}
            onChange={e => S.setApiKey(e.target.value)}
            autoComplete="off"
            placeholder={S.connected && !S.apiKey ? '••••••••' : t('dawarich.apiKeyPlaceholder')}
            aria-label={t('dawarich.apiKey')}
          />
          <MSetHint>{t('dawarich.apiKeyHint')}</MSetHint>
        </div>
      </div>

      <div className="mt-1">
        <MSetRow
          first
          label={t('dawarich.syncEnabled')}
          sub={t('dawarich.syncEnabledHint')}
          trailing={
            <MToggle checked={S.syncEnabled} onChange={S.toggleSync} ariaLabel={t('dawarich.syncEnabled')} />
          }
        />
        <MSetRow
          label={t('dawarich.allowInsecureTls')}
          sub={t('dawarich.allowInsecureTlsHint')}
          trailing={
            <MToggle
              checked={S.allowInsecureTls}
              onChange={S.toggleInsecureTls}
              ariaLabel={t('dawarich.allowInsecureTls')}
            />
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MSetButton onClick={S.save} disabled={S.saving || S.loading || !S.canSave}>
          <Save size={14} /> {t('common.save')}
        </MSetButton>
        <MSetButton variant="ghost" onClick={S.test} disabled={S.testing || S.loading || !S.url.trim()}>
          <Plug size={14} /> {t('dawarich.test.button')}
        </MSetButton>
        {S.connected && (
          <MSetButton variant="ghost" onClick={S.syncNow} disabled={S.syncing}>
            <RefreshCw size={14} className={S.syncing ? 'animate-spin' : ''} /> {t('dawarich.syncNow')}
          </MSetButton>
        )}
      </div>

      <div className="mt-3 space-y-[4px]">
        <p className="font-geist text-[0.6875rem] font-semibold text-m-ink">
          {S.connected ? t('dawarich.connected') : t('dawarich.notConnected')}
        </p>
        {S.probeMessage && (
          <p className="font-geist text-[0.625rem] leading-relaxed text-m-muted">{S.probeMessage}</p>
        )}
        {S.connected && (
          <p className="font-geist text-[0.625rem] leading-relaxed text-m-muted">
            {S.lastSyncAt
              ? t('dawarich.lastSync', { when: new Date(S.lastSyncAt).toLocaleString(locale) })
              : t('dawarich.neverSynced')}
          </p>
        )}
        {S.lastSyncError && (
          <p className="font-geist text-[0.625rem] leading-relaxed text-[color:var(--m-st-danger)]">
            {S.lastSyncError}
          </p>
        )}
        {S.capabilities?.serverVersion && (
          <p className="font-geist text-[0.625rem] leading-relaxed text-m-faint">
            {t('dawarich.serverVersion', { version: S.capabilities.serverVersion })}
          </p>
        )}
      </div>

      {S.connected && (
        <div className="mt-3">
          <MSetButton variant="danger" onClick={S.disconnect} disabled={S.saving}>
            <Unplug size={14} /> {t('dawarich.disconnect')}
          </MSetButton>
        </div>
      )}
    </MSetCard>
  )
}
