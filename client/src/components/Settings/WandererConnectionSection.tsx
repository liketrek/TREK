import { Loader2, Plug, Save, Unplug } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';
import { EditorField, GRID_2, INPUT } from '../shared/dialogParts';
import { fs } from '../shared/DialogShell';
import WandererMark from '../Tours/wanderer/WandererMark';
import Section from './Section';
import {
  SETTINGS_BUTTON,
  SETTINGS_BUTTON_DANGER,
  SETTINGS_BUTTON_PRIMARY,
  SettingRow,
  SettingRows,
  SettingsHint,
  StatusPill,
} from './settingsKit';
import ToggleSwitch from './ToggleSwitch';
import { useWandererConnection } from './useWandererConnection';

/**
 * Settings → Integrations → wanderer: the reader's own trail database, from
 * which the Tours workspace imports trails. Laid out like the Dawarich and
 * AirTrail cards beside it; the behaviour is in `useWandererConnection`.
 */
export default function WandererConnectionSection(): React.ReactElement {
  const { t } = useTranslation();
  const S = useWandererConnection();

  return (
    <Section
      title={t('wanderer.title')}
      icon={WandererMark}
      badge={
        <StatusPill
          tone={S.connected ? 'success' : 'neutral'}
          icon={<span className="h-1.5 w-1.5 rounded-full bg-current" />}
        >
          {S.connected ? t('wanderer.connected') : t('wanderer.notConnected')}
        </StatusPill>
      }
    >
      <SettingsHint>{t('wanderer.intro')}</SettingsHint>

      <div className={GRID_2}>
        <EditorField label={t('wanderer.url')} htmlFor="wanderer-url">
          <input
            id="wanderer-url"
            type="url"
            value={S.url}
            onChange={(event) => S.setUrl(event.target.value)}
            placeholder="https://wanderer.example.com"
            className={INPUT}
          />
        </EditorField>
        <EditorField
          label={t('wanderer.token')}
          htmlFor="wanderer-token"
          hint={S.tokenInvalid ? undefined : t('wanderer.tokenHint')}
        >
          <input
            id="wanderer-token"
            type="password"
            value={S.token}
            onChange={(event) => S.setToken(event.target.value)}
            autoComplete="off"
            aria-invalid={S.tokenInvalid || undefined}
            placeholder={S.connected && !S.token ? '••••••••' : 'wanderer_key_…'}
            className={INPUT}
          />
          {S.tokenInvalid && (
            <p className="m-0 mt-1 text-danger" style={fs(11.5, 'body')}>
              {t('wanderer.tokenInvalid')}
            </p>
          )}
        </EditorField>
      </div>

      <SettingRows>
        <SettingRow
          label={t('wanderer.allowInsecureTls')}
          hint={t('wanderer.allowInsecureTlsHint')}
          control={
            <ToggleSwitch
              on={S.allowInsecureTls}
              onToggle={S.toggleInsecureTls}
              label={t('wanderer.allowInsecureTls')}
            />
          }
        />
      </SettingRows>

      <div className="flex flex-wrap items-center gap-2" style={fs(13, 'body')}>
        <button
          type="button"
          onClick={() => void S.save()}
          disabled={S.saving || S.loading || !S.canSave}
          className={SETTINGS_BUTTON_PRIMARY}
        >
          <Save size={14} strokeWidth={2.2} /> {t('common.save')}
        </button>
        <button
          type="button"
          onClick={() => void S.test()}
          disabled={S.testing || S.loading || !S.url.trim() || S.tokenInvalid}
          className={SETTINGS_BUTTON}
        >
          {S.testing ? (
            <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Plug size={14} strokeWidth={2.2} />
          )}
          {t('wanderer.test.button')}
        </button>
        {S.connected && (
          <button
            type="button"
            onClick={() => void S.disconnect()}
            disabled={S.saving}
            className={`${SETTINGS_BUTTON_DANGER} ms-auto`}
          >
            <Unplug size={14} strokeWidth={2.2} /> {t('wanderer.disconnect')}
          </button>
        )}
      </div>

      {(S.probe || S.lastCheck) && (
        <div
          role="status"
          className="flex flex-col gap-1 rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3"
          style={fs(12, 'body')}
        >
          {S.probe ? (
            <p className={`m-0 font-medium ${S.probe.ok ? 'text-success' : 'text-danger'}`}>{S.probe.message}</p>
          ) : (
            <p className="m-0 text-danger">{S.lastCheck}</p>
          )}
        </div>
      )}
    </Section>
  );
}
