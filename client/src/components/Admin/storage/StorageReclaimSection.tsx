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
  /** A check was asked for or is running. */
  checking: boolean;
  /** The switch is on its way to the server. */
  saving: boolean;
  onCheck: () => void;
  onDelete: (enabled: boolean) => void;
  /** The category whose confirmation is on its way. */
  confirming: ReclaimView['lines'][number]['category'] | null;
  onConfirm: (request: { category: ReclaimView['lines'][number]['category']; unreferenced: number }) => void;
}

/**
 * Unreferenced files on the desktop storage panel: what the last check found,
 * the switch that lets the nightly run delete them, a check on demand and the
 * confirmation a category with an unusually large share of unused files waits
 * for. The phone shows the same through MStorageReclaimCard, off the same view model.
 */
export default function StorageReclaimSection({
  reclaim,
  checking,
  saving,
  onCheck,
  onDelete,
  confirming,
  onConfirm,
}: Props): React.ReactElement {
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
          onClick={onCheck}
          disabled={checking}
        >
          {checking ? (
            <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <ScanSearch size={14} strokeWidth={2.2} />
          )}
          {checking ? t('storage.reclaim.running') : t('storage.reclaim.check')}
        </button>
      }
    >
      <SettingRows>
        <SettingRow
          label={t('storage.reclaim.delete')}
          hint={t('storage.reclaim.deleteHint')}
          dimmed={saving}
          control={
            <ToggleSwitch
              on={reclaim.deleteEnabled}
              onToggle={() => onDelete(!reclaim.deleteEnabled)}
              label={t('storage.reclaim.delete')}
              disabled={saving}
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
              {t(reclaim.stopped === 'failed' ? 'storage.reclaim.stoppedFailed' : 'storage.reclaim.stopped')}
            </p>
          )}
          {checked && (
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Figure label={t('storage.reclaim.freeable')} value={count(reclaim.freeable)} />
              <Figure label={t('storage.reclaim.waiting')} value={count(reclaim.waiting)} />
              <Figure label={t('storage.reclaim.deleted')} value={count(reclaim.freed)} />
            </div>
          )}
          {checked && !reclaim.stopped && reclaim.lines.length === 0 && (
            <SettingsHint className="mt-2.5">{t('storage.reclaim.nothing')}</SettingsHint>
          )}
          {reclaim.lines.length > 0 && (
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {reclaim.lines.map((line) => (
                <li
                  key={line.category}
                  data-testid={`storage-reclaim-${line.category}`}
                  className="flex flex-col gap-1"
                >
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="font-medium text-content-secondary" style={fs(12.5, 'body')}>
                      {t(`storage.category.${line.category}`)}
                    </span>
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
                    {line.skipped && (
                      <StatusPill tone="warning">{t(`storage.reclaim.skip.${line.skipped}`)}</StatusPill>
                    )}
                  </div>
                  {line.confirmationRequired && (
                    <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] bg-warning-soft px-2.5 py-1.5">
                      <p className="m-0 min-w-0 flex-1 basis-56 leading-snug text-warning" style={fs(11.5)}>
                        {t('storage.reclaim.confirmNeeded')}
                      </p>
                      <button
                        type="button"
                        className={SETTINGS_BUTTON}
                        onClick={() => onConfirm({ category: line.category, unreferenced: line.unreferenced })}
                        disabled={confirming === line.category}
                      >
                        {confirming === line.category && (
                          <Loader2 size={13} strokeWidth={2.2} className="animate-spin" />
                        )}
                        {t('storage.reclaim.confirm')}
                      </button>
                    </div>
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
