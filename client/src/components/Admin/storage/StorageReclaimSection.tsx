import { Eraser, Loader2, ScanSearch } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../../i18n';
import { formatBytes } from '../../../utils/formatBytes';
import { relativeTime } from '../../../utils/relativeTime';
import Section from '../../Settings/Section';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import { SETTINGS_BUTTON, SettingRow, SettingRows, SettingsHint, StatusPill } from '../../Settings/settingsKit';
import { fs } from '../../shared/DialogShell';
import type { ReclaimCount, ReclaimView } from './reclaimModel';

interface Props {
  reclaim: ReclaimView;
  checking: boolean;
  onCheck: () => void;
  onDelete: (enabled: boolean) => void;
}

/**
 * Unreferenced files on the desktop storage panel: what the last check found,
 * the switch that lets the nightly run delete them, and a check on demand. The
 * phone shows the same through MStorageReclaimCard, off the same view model.
 */
export default function StorageReclaimSection({ reclaim, checking, onCheck, onDelete }: Props): React.ReactElement {
  const { t, locale } = useTranslation();
  const count = (c: ReclaimCount) => t('storage.usage.line', { count: c.objects, size: formatBytes(c.bytes) });
  const checked = reclaim.checkedAt !== null;

  return (
    <Section
      title={t('storage.reclaim.title')}
      icon={Eraser}
      hint={t('storage.reclaim.hint')}
      action={
        <button
          type="button"
          className={SETTINGS_BUTTON}
          style={fs(12.5, 'body')}
          onClick={onCheck}
          disabled={checking}
        >
          {checking ? (
            <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <ScanSearch size={14} strokeWidth={2.2} />
          )}
          {t('storage.reclaim.check')}
        </button>
      }
    >
      <SettingRows>
        <SettingRow
          label={t('storage.reclaim.delete')}
          hint={t('storage.reclaim.deleteHint')}
          control={
            <ToggleSwitch
              on={reclaim.deleteEnabled}
              onToggle={() => onDelete(!reclaim.deleteEnabled)}
              label={t('storage.reclaim.delete')}
            />
          }
        />
        <div className="px-3.5 py-3" data-testid="storage-reclaim-summary">
          <p className="m-0 text-content-faint" style={fs(11.5)}>
            {reclaim.checkedAt !== null
              ? t('storage.reclaim.checked', { age: relativeTime(reclaim.checkedAt, locale) })
              : t('storage.reclaim.never')}
          </p>
          {reclaim.stopped && (
            <p role="note" className="m-0 mt-1.5 leading-snug text-warning" style={fs(11.5)}>
              {t('storage.reclaim.stopped')}
            </p>
          )}
          {checked && (
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Figure label={t('storage.reclaim.freeable')} value={count(reclaim.freeable)} />
              <Figure label={t('storage.reclaim.waiting')} value={count(reclaim.waiting)} />
              <Figure label={t('storage.reclaim.deleted')} value={count(reclaim.deleted)} />
            </div>
          )}
          {checked && reclaim.lines.length === 0 && (
            <SettingsHint className="mt-2.5">{t('storage.reclaim.nothing')}</SettingsHint>
          )}
          {reclaim.lines.length > 0 && (
            <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
              {reclaim.lines.map((line) => (
                <li
                  key={line.category}
                  data-testid={`storage-reclaim-${line.category}`}
                  className="flex flex-wrap items-center gap-x-2.5 gap-y-1"
                >
                  <span className="font-medium text-content-secondary" style={fs(12.5, 'body')}>
                    {t(`storage.category.${line.category}`)}
                  </span>
                  {line.skipped ? (
                    <StatusPill tone="warning">{t(`storage.reclaim.skip.${line.skipped}`)}</StatusPill>
                  ) : (
                    <>
                      {line.freeable.objects > 0 && (
                        <span className="font-geist tabular-nums text-content-faint" style={fs(11.5)}>
                          {t('storage.reclaim.freeable')}: {count(line.freeable)}
                        </span>
                      )}
                      {line.waiting.objects > 0 && (
                        <span className="font-geist tabular-nums text-content-faint" style={fs(11.5)}>
                          {t('storage.reclaim.waiting')}: {count(line.waiting)}
                        </span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SettingRows>
    </Section>
  );
}

function Figure({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="min-w-0 rounded-[12px] bg-surface-secondary px-3 py-2">
      <p className="m-0 text-content-faint" style={fs(11)}>
        {label}
      </p>
      <p className="m-0 mt-0.5 font-geist font-semibold tabular-nums text-content" style={fs(12.5, 'body')}>
        {value}
      </p>
    </div>
  );
}
