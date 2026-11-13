import type { MailIngestInboxEntry } from '@trek/shared';
import { Copy, FilePlus2, FileText, Inbox, Loader2, Mail, PencilLine, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useId, type ReactElement } from 'react';
import { useTranslation } from '../../i18n';
import { copyText } from '../../utils/clipboard';
import { formatDate } from '../../utils/formatters';
import { RES_ICONS } from '../Planner/DayPlanSidebar.constants';
import {
  DialogButton,
  DialogHeader,
  DialogIconButton,
  DialogShell,
  DialogTile,
  NEUTRAL_TINT,
} from '../shared/DialogShell';
import { useToast } from '../shared/Toast';
import { entryDates, entryTitle, reasonText, type InboxAction } from './mailInboxModel';
import { useMailInbox, type InboxTrip } from './useMailInbox';

/** The icon and the label of each way out, so a row and the trip picker word them alike. */
function actionLook(action: InboxAction, t: (key: string) => string): { icon: ReactElement; label: string } {
  switch (action) {
    case 'add':
      return { icon: <Plus size={14} strokeWidth={2.2} />, label: t('mailInbox.action.add') };
    case 'choose':
      return { icon: <Plus size={14} strokeWidth={2.2} />, label: t('mailInbox.action.choose') };
    case 'file':
      return { icon: <FilePlus2 size={14} strokeWidth={2} />, label: t('mailInbox.action.file') };
    case 'manual':
      return { icon: <PencilLine size={14} strokeWidth={2} />, label: t('mailInbox.action.manual') };
    case 'readAi':
      return { icon: <Sparkles size={14} strokeWidth={2} />, label: t('mailInbox.action.readAi') };
    case 'discard':
      return { icon: <Trash2 size={14} strokeWidth={2} />, label: t('mailInbox.action.discard') };
  }
}

function Entry({ entry, inbox }: { entry: MailIngestInboxEntry; inbox: ReturnType<typeof useMailInbox> }) {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const title = entryTitle(entry) ?? t('mailInbox.untitled');
  const dates = entryDates(entry);
  const reason = entry.reason ?? entry.message.reason;
  const Icon = entry.item ? RES_ICONS[entry.item.type as keyof typeof RES_ICONS] || Mail : Mail;
  const [primary, ...rest] = inbox.actionsOf(entry);
  const busy = inbox.busy === entry.id;
  const code = entry.message.forwarding_code;

  return (
    <li className="flex gap-3 rounded-xl border border-edge-faint bg-surface-card p-3.5">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-surface-tertiary text-content-muted">
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <span dir="auto" className="min-w-0 truncate text-body font-semibold text-content">
            {title}
          </span>
          {dates && (
            <span className="flex-none text-caption tabular-nums text-content-muted">
              {formatDate(dates.start, locale)}
              {dates.end ? ` → ${formatDate(dates.end, locale)}` : ''}
            </span>
          )}
        </div>
        {reason && <div className="mt-0.5 text-caption text-warning">{reasonText(reason, t)}</div>}
        {code && (
          <div className="mt-2 flex items-center gap-2">
            <code
              dir="ltr"
              className="rounded-lg bg-surface-tertiary px-2.5 py-1 font-geist text-subtitle font-semibold tracking-[0.08em] text-content"
            >
              {code}
            </code>
            <DialogIconButton
              label={t('mailInbox.settings.copy')}
              icon={<Copy size={13} strokeWidth={2} />}
              onClick={async () => {
                if (await copyText(code)) toast.success(t('common.copied'));
              }}
            />
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-content-faint">
          {entry.suggested_trip && (
            <span className="rounded-full bg-surface-tertiary px-2 py-0.5 font-medium text-content-secondary">
              {entry.suggested_trip.title}
            </span>
          )}
          <button
            type="button"
            onClick={() => inbox.showMail(entry)}
            className="inline-flex items-center gap-1 hover:text-content"
          >
            <FileText size={12} strokeWidth={2} />
            {t('mailInbox.showMail')}
          </button>
        </div>
      </div>
      <div className="flex flex-none items-start gap-1.5">
        {busy && <Loader2 size={16} strokeWidth={2} className="mt-2 animate-spin text-content-faint" />}
        {rest.map((action) => {
          const look = actionLook(action, t);
          return (
            <DialogIconButton
              key={action}
              label={look.label}
              icon={look.icon}
              danger={action === 'discard'}
              disabled={busy}
              onClick={() => inbox.perform(entry, action)}
            />
          );
        })}
        {primary && primary !== 'discard' && (
          <DialogButton
            variant="primary"
            icon={actionLook(primary, t).icon}
            disabled={busy}
            onClick={() => inbox.perform(entry, primary)}
          >
            {actionLook(primary, t).label}
          </DialogButton>
        )}
        {primary === 'discard' && (
          <DialogIconButton
            label={actionLook('discard', t).label}
            icon={actionLook('discard', t).icon}
            danger
            disabled={busy}
            onClick={() => inbox.perform(entry, 'discard')}
          />
        )}
      </div>
    </li>
  );
}

function TripPicker({
  trips,
  onPick,
  onCancel,
}: {
  trips: InboxTrip[];
  onPick: (id: number) => void;
  onCancel: () => void;
}) {
  const { t, locale } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div className="text-body font-semibold text-content">{t('mailInbox.pickTrip')}</div>
      <ul className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
        {trips.map((trip) => (
          <li key={trip.id}>
            <button
              type="button"
              onClick={() => onPick(trip.id)}
              className="flex w-full items-baseline justify-between gap-3 rounded-lg bg-surface-tertiary px-3 py-2.5 text-start hover:bg-surface-hover"
            >
              <span dir="auto" className="min-w-0 truncate text-body font-medium text-content">
                {trip.title}
              </span>
              {trip.start_date && (
                <span className="flex-none text-caption tabular-nums text-content-muted">
                  {formatDate(trip.start_date, locale)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <DialogButton onClick={onCancel}>{t('common.cancel')}</DialogButton>
      </div>
    </div>
  );
}

/**
 * Bookings from forwarded mails that wait for the person: one row each with
 * what TREK read, why it waits, the trip it suggests, and the ways out (add,
 * choose a trip, keep the mail as a document, fill in the form, read again with
 * AI, discard). Mounted once by the layout; opened from the account menu, the
 * settings card or a notification.
 */
export default function MailInboxDialog(): ReactElement | null {
  const { t } = useTranslation();
  const inbox = useMailInbox();
  const titleId = useId();
  if (!inbox.open) return null;

  const header = (
    <DialogHeader
      tile={
        <DialogTile>
          <Inbox size={18} strokeWidth={2} />
        </DialogTile>
      }
      tint={NEUTRAL_TINT}
      labelId={titleId}
      onClose={inbox.close}
      title={t('mailInbox.title')}
      sub={inbox.pending > 0 ? t('mailInbox.pendingCount', { count: inbox.pending }) : t('mailInbox.empty')}
    />
  );

  return (
    <DialogShell
      onClose={inbox.close}
      labelledBy={titleId}
      width="editor"
      align="top"
      header={header}
      blocked={!!inbox.picking}
    >
      {inbox.picking ? (
        <TripPicker trips={inbox.trips} onPick={inbox.pick} onCancel={inbox.cancelPick} />
      ) : inbox.preview ? (
        <div className="flex flex-col gap-3">
          <div className="text-body font-semibold text-content">{inbox.preview.subject ?? t('mailInbox.untitled')}</div>
          <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-lg bg-surface-tertiary p-3 font-geist text-caption text-content-secondary">
            {inbox.preview.text}
          </pre>
          <div>
            <DialogButton onClick={inbox.closePreview}>{t('mailInbox.backToList')}</DialogButton>
          </div>
        </div>
      ) : inbox.entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Inbox size={28} strokeWidth={1.6} className="text-content-faint" />
          <div className="text-body font-medium text-content">{t('mailInbox.empty')}</div>
          <div className="max-w-sm text-caption text-content-muted">{t('mailInbox.emptyHint')}</div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {inbox.entries.map((entry) => (
            <Entry key={entry.id} entry={entry} inbox={inbox} />
          ))}
          {inbox.hasMore && (
            <li className="flex justify-center pt-1">
              <DialogButton onClick={inbox.loadMore} disabled={inbox.loading}>
                {t('mailInbox.loadMore')}
              </DialogButton>
            </li>
          )}
        </ul>
      )}
    </DialogShell>
  );
}
