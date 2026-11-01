import React from 'react';
import type { ReclaimCount, ReclaimView } from '../../../components/Admin/storage/reclaimModel';
import { fs } from '../../../components/shared/DialogShell';
import { useTranslation } from '../../../i18n';
import { formatBytes } from '../../../utils/formatBytes';
import { relativeTime } from '../../../utils/relativeTime';
import MToggle from '../../components/MToggle';
import { MAdminButton, MAdminCard, MAdminCardHead, MAdminRow } from './MAdminUi';

interface Props {
  reclaim: ReclaimView;
  /** A check was asked for or is running. */
  checking: boolean;
  /** The switch is on its way to the server. */
  saving: boolean;
  onCheck: () => void;
  onDelete: (enabled: boolean) => void;
  onConfirm: (category: ReclaimView['lines'][number]['category']) => void;
}

/** Unreferenced files on the phone's storage panel, off the view model StorageReclaimSection shows on desktop. */
export default function MStorageReclaimCard({
  reclaim,
  checking,
  saving,
  onCheck,
  onDelete,
  onConfirm,
}: Props): React.ReactElement {
  const { t, locale } = useTranslation();
  const count = (c: ReclaimCount) => t('storage.usage.line', { count: c.objects, size: formatBytes(c.bytes) });
  const checked = reclaim.checkedAt !== null;

  return (
    <MAdminCard>
      <MAdminCardHead
        title={t('storage.reclaim.title')}
        hint={t('storage.reclaim.hint')}
        trailing={
          <MAdminButton variant="ghost" busy={checking} onClick={onCheck}>
            {checking ? t('storage.reclaim.running') : t('storage.reclaim.check')}
          </MAdminButton>
        }
      />
      <MAdminRow
        first
        title={t('storage.reclaim.delete')}
        hint={t('storage.reclaim.deleteHint')}
        trailing={
          <MToggle
            checked={reclaim.deleteEnabled}
            onChange={onDelete}
            disabled={saving}
            ariaLabel={t('storage.reclaim.delete')}
          />
        }
      />
      <div className="border-t border-[color:var(--m-rowbr)] pt-[11px]" data-testid="m-storage-reclaim-summary">
        <p className="font-geist text-m-muted" style={fs(10)}>
          {reclaim.checkedAt !== null
            ? t('storage.reclaim.checked', { age: relativeTime(reclaim.checkedAt, locale) })
            : t('storage.reclaim.never')}
        </p>
        {reclaim.stopped && (
          <p role="note" className="mt-1 font-geist text-m-muted" style={fs(10)}>
            {t(reclaim.stopped === 'failed' ? 'storage.reclaim.stoppedFailed' : 'storage.reclaim.stopped')}
          </p>
        )}
        {checked && (
          <div className="mt-2 space-y-1">
            <Figure label={t('storage.reclaim.freeable')} value={count(reclaim.freeable)} />
            <Figure label={t('storage.reclaim.waiting')} value={count(reclaim.waiting)} />
            <Figure label={t('storage.reclaim.deleted')} value={count(reclaim.freed)} />
          </div>
        )}
        {checked && !reclaim.stopped && reclaim.lines.length === 0 && (
          <p className="mt-2 font-geist text-m-muted" style={fs(10)}>
            {t('storage.reclaim.nothing')}
          </p>
        )}
        {reclaim.lines.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {reclaim.lines.map((line) => (
              <div key={line.category} data-testid={`m-storage-reclaim-${line.category}`}>
                <p className="font-bold text-m-ink" style={fs(12, 'body')}>
                  {t(`storage.category.${line.category}`)}
                </p>
                {line.skipped && (
                  <p className="font-geist text-m-muted" style={fs(10)}>
                    {t(`storage.reclaim.skip.${line.skipped}`)}
                  </p>
                )}
                {line.freeable.objects > 0 && (
                  <p className="font-geist text-m-muted" style={fs(10)}>
                    {t('storage.reclaim.freeable')}: {count(line.freeable)}
                  </p>
                )}
                {line.waiting.objects > 0 && (
                  <p className="font-geist text-m-muted" style={fs(10)}>
                    {t('storage.reclaim.waiting')}: {count(line.waiting)}
                  </p>
                )}
                {line.confirmationRequired && (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="min-w-0 flex-1 font-geist text-m-muted" style={fs(10)}>
                      {t('storage.reclaim.confirmNeeded')}
                    </p>
                    <MAdminButton variant="ghost" onClick={() => onConfirm(line.category)}>
                      {t('storage.reclaim.confirm')}
                    </MAdminButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MAdminCard>
  );
}

function Figure({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-geist text-m-muted" style={fs(11)}>
        {label}
      </span>
      <span className="font-geist font-bold tabular-nums text-m-ink" style={fs(11)}>
        {value}
      </span>
    </div>
  );
}
