import type { MailIngestAddress } from '@trek/shared';
import { Copy, Mail, Plus } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from '../../i18n';
import { mailIngestRepo } from '../../repo/mailIngestRepo';
import { useMailIngestStore } from '../../store/mailIngestStore';
import { copyText } from '../../utils/clipboard';
import { useToast } from '../shared/Toast';

/**
 * The trip's own forwarding address, under the file drop of the import dialog
 * (desktop and phone share that dialog): a mail sent to it lands in this trip
 * without any guessing. Created on request, since most people forward to their
 * own address; it is the person's own, so a fellow traveller gets another.
 * Nothing where the import is off for the person.
 */
export default function TripMailForward({ tripId }: { tripId: number }): ReactElement | null {
  const { t } = useTranslation();
  const toast = useToast();
  const settings = useMailIngestStore((s) => s.settings);
  const loadSettings = useMailIngestStore((s) => s.loadSettings);
  const on = !!settings?.available && settings.prefs.enabled;
  const [address, setAddress] = useState<MailIngestAddress | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!settings) void loadSettings();
  }, [settings, loadSettings]);

  useEffect(() => {
    if (!on) return;
    let live = true;
    mailIngestRepo
      .tripAddress(tripId)
      .then((found) => {
        if (live) setAddress(found);
      })
      .catch(() => {
        // No address yet, or none readable: the card offers to create one instead.
        if (live) setAddress(null);
      });
    return () => {
      live = false;
    };
  }, [on, tripId]);

  if (!on) return null;

  const create = async () => {
    setCreating(true);
    try {
      setAddress(await mailIngestRepo.createTripAddress(tripId));
    } catch {
      toast.error(t('mailInbox.settings.saveError'));
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    if (address && (await copyText(address.address))) toast.success(t('common.copied'));
  };

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-xl bg-surface-tertiary px-3.5 py-3">
      <div className="flex items-center gap-2 text-body font-semibold text-content">
        <Mail size={15} strokeWidth={2} className="text-content-muted" />
        {t('mailInbox.trip.title')}
      </div>
      <div className="text-caption text-content-muted">{t('mailInbox.trip.hint')}</div>
      {address ? (
        <div className="flex min-w-0 items-center gap-2">
          <code
            dir="ltr"
            className="min-w-0 flex-1 truncate rounded-lg bg-surface-card px-2.5 py-1.5 font-geist text-caption text-content"
          >
            {address.address}
          </code>
          <button
            type="button"
            onClick={() => void copy()}
            aria-label={t('mailInbox.settings.copy')}
            className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-surface-card text-content-muted hover:text-content"
          >
            <Copy size={14} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void create()}
          disabled={creating}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-surface-card px-3 py-1.5 text-caption font-semibold text-content hover:bg-surface-hover disabled:opacity-50"
        >
          <Plus size={13} strokeWidth={2.2} />
          {t('mailInbox.trip.create')}
        </button>
      )}
    </div>
  );
}
