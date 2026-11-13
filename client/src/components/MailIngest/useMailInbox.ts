import {
  mailIngestMessagePreviewResponseSchema,
  type MailIngestInboxEntry,
  type MailIngestMessagePreviewResponse,
} from '@trek/shared';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { tripsApi } from '../../api/client';
import { mailIngestApi, type MailIngestAction } from '../../api/mailIngest';
import { useTranslation } from '../../i18n';
import { useMailIngestStore } from '../../store/mailIngestStore';
import { useToast } from '../shared/Toast';
import { actionsOf, type InboxAction } from './mailInboxModel';
import { closeMailInbox, useMailInboxOpen } from './mailInboxOpener';

export interface InboxTrip {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
}

/**
 * The inbox of bookings from forwarded mails behind the desktop dialog and the
 * phone sheet: the open entries, the trips to choose from, and every way out of
 * an entry. An action that needs a trip and has none suggested asks for one
 * first (`picking`); "Fill in yourself" opens the booking form in the trip with
 * the mail's values, through the planner (?mailPrefill=).
 */
export function useMailInbox() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const open = useMailInboxOpen((s) => s.open);
  const { entries, pending, nextBefore, loadingInbox, settings, loadInbox, loadSettings, act } = useMailIngestStore();
  const [trips, setTrips] = useState<InboxTrip[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  /** The entry and the action waiting for a trip to be picked. */
  const [picking, setPicking] = useState<{ entry: MailIngestInboxEntry; action: 'apply' | 'file' | 'manual' } | null>(
    null
  );
  const [preview, setPreview] = useState<MailIngestMessagePreviewResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadInbox();
    if (!settings) void loadSettings();
    tripsApi
      .list()
      .then((d: { trips?: InboxTrip[] }) =>
        setTrips((d.trips ?? []).map(({ id, title, start_date, end_date }) => ({ id, title, start_date, end_date })))
      )
      .catch(() => setTrips([]));
  }, [open, loadInbox, loadSettings, settings]);

  const run = async (
    entry: MailIngestInboxEntry,
    action: MailIngestAction,
    body: Record<string, unknown>,
    done: string
  ) => {
    setBusy(entry.id);
    try {
      await act(entry.id, action, body);
      toast.success(done);
    } catch {
      toast.error(t('mailInbox.actionError'));
    } finally {
      setBusy(null);
    }
  };

  const perform = (entry: MailIngestInboxEntry, action: InboxAction) => {
    const tripId = entry.suggested_trip?.id;
    switch (action) {
      case 'add':
        return run(entry, 'apply', {}, t('mailInbox.added'));
      case 'choose':
        return setPicking({ entry, action: 'apply' });
      case 'file':
        return tripId
          ? run(entry, 'file', { trip_id: tripId }, t('mailInbox.filed'))
          : setPicking({ entry, action: 'file' });
      case 'readAi':
        return run(entry, 'read-ai', {}, t('mailInbox.readAgain'));
      case 'discard':
        return run(entry, 'discard', {}, t('mailInbox.discarded'));
      case 'manual':
        return fillIn(entry);
    }
  };

  const pick = (tripId: number) => {
    if (!picking) return;
    const { entry, action } = picking;
    setPicking(null);
    if (action === 'manual') return openForm(entry, tripId);
    void run(entry, action, { trip_id: tripId }, action === 'apply' ? t('mailInbox.added') : t('mailInbox.filed'));
  };

  const openForm = (entry: MailIngestInboxEntry, tripId: number) => {
    closeMailInbox();
    navigate(`/trips/${tripId}?mailPrefill=${entry.id}`);
  };

  const fillIn = (entry: MailIngestInboxEntry) => {
    const tripId = entry.suggested_trip?.id;
    if (tripId) openForm(entry, tripId);
    else setPicking({ entry, action: 'manual' });
  };

  const showMail = async (entry: MailIngestInboxEntry) => {
    try {
      setPreview(mailIngestMessagePreviewResponseSchema.parse(await mailIngestApi.preview(entry.message_id)));
    } catch {
      toast.error(t('mailInbox.previewError'));
    }
  };

  const aiAvailable = !!settings?.ai_available && !!settings.prefs.ai_enabled;
  return {
    open,
    close: closeMailInbox,
    entries,
    pending,
    hasMore: nextBefore !== null,
    loadMore: () => void loadInbox(true),
    loading: loadingInbox,
    trips,
    busy,
    actionsOf: (entry: MailIngestInboxEntry) => actionsOf(entry, aiAvailable),
    perform: (entry: MailIngestInboxEntry, action: InboxAction) => void perform(entry, action),
    picking,
    pick,
    cancelPick: () => setPicking(null),
    preview,
    showMail: (entry: MailIngestInboxEntry) => void showMail(entry),
    closePreview: () => setPreview(null),
  };
}
