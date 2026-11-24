import { Loader2, Plug, Save, Unplug } from 'lucide-react';
import { useWandererConnection } from '../../../components/Settings/useWandererConnection';
import WandererWatchRow from '../../../components/Settings/WandererWatchRow';
import WandererMark from '../../../components/Tours/wanderer/WandererMark';
import { useTranslation } from '../../../i18n';
import MToggle from '../../components/MToggle';
import { MSetButton, MSetCard, MSetHint, MSetInput, MSetRow } from './MSettingsUi';

/**
 * Phone twin of components/Settings/WandererConnectionSection: the reader's own
 * wanderer trail database, from which Tours imports trails. Presentation only;
 * saving, testing and disconnecting live in `useWandererConnection`, and the
 * background check of the imported trails is the shared WandererWatchRow.
 */
export default function MWandererConnectionSection() {
  const { t } = useTranslation();
  const S = useWandererConnection();
  const probe = S.probe ?? (S.lastCheck ? { ok: false, message: S.lastCheck } : null);

  return (
    <MSetCard
      title={t('wanderer.title')}
      icon={WandererMark}
      className="mt-3"
      badge={
        <span
          className={`flex-none font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold ${
            S.connected ? 'text-[color:var(--m-st-confirmed)]' : 'text-m-muted'
          }`}
        >
          {S.connected ? t('wanderer.connected') : t('wanderer.notConnected')}
        </span>
      }
    >
      <MSetHint className="mt-0">{t('wanderer.intro')}</MSetHint>

      <div className="mt-3 space-y-3">
        <MSetInput
          type="url"
          inputMode="url"
          aria-label={t('wanderer.url')}
          placeholder="https://wanderer.example.com"
          value={S.url}
          onChange={(event) => S.setUrl(event.target.value)}
        />
        <div>
          <MSetInput
            type="password"
            autoComplete="off"
            aria-label={t('wanderer.token')}
            aria-invalid={S.tokenInvalid || undefined}
            placeholder={S.connected && !S.token ? '••••••••' : 'wanderer_key_…'}
            value={S.token}
            onChange={(event) => S.setToken(event.target.value)}
          />
          {S.tokenInvalid ? (
            <MSetHint className="font-bold text-[color:var(--m-st-danger)]">{t('wanderer.tokenInvalid')}</MSetHint>
          ) : (
            <MSetHint>{t('wanderer.tokenHint')}</MSetHint>
          )}
        </div>
      </div>

      <MSetRow
        first
        label={t('wanderer.allowInsecureTls')}
        hint={t('wanderer.allowInsecureTlsHint')}
        trailing={
          <MToggle
            checked={S.allowInsecureTls}
            ariaLabel={t('wanderer.allowInsecureTls')}
            onChange={S.toggleInsecureTls}
          />
        }
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MSetButton disabled={S.saving || S.loading || !S.canSave} onClick={() => void S.save()}>
          <Save size={14} /> {t('common.save')}
        </MSetButton>
        <MSetButton
          variant="ghost"
          disabled={S.testing || S.loading || !S.url.trim() || S.tokenInvalid}
          onClick={() => void S.test()}
        >
          {S.testing ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
          {t('wanderer.test.button')}
        </MSetButton>
        {S.connected && (
          <MSetButton variant="danger" disabled={S.saving} onClick={() => void S.disconnect()}>
            <Unplug size={14} /> {t('wanderer.disconnect')}
          </MSetButton>
        )}
      </div>

      {probe && (
        <p
          role="status"
          className={`mt-3 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] font-bold ${
            probe.ok ? 'text-[color:var(--m-st-confirmed)]' : 'text-[color:var(--m-st-danger)]'
          }`}
        >
          {probe.message}
        </p>
      )}

      <div className="mt-2">
        <WandererWatchRow refreshKey={S.checkKey} />
      </div>
    </MSetCard>
  );
}
