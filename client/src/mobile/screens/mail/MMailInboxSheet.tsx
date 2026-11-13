import type { ReactElement } from 'react';
import { ChevronLeft, Copy, FilePlus2, FileText, Inbox, Mail, PencilLine, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { MailIngestInboxEntry } from '@trek/shared';
import { useTranslation } from '../../../i18n';
import { copyText } from '../../../utils/clipboard';
import { formatDate } from '../../../utils/formatters';
import { RES_ICONS } from '../../../components/Planner/DayPlanSidebar.constants';
import { useToast } from '../../../components/shared/Toast';
import { entryDates, entryTitle, reasonText, type InboxAction } from '../../../components/MailIngest/mailInboxModel';
import { useMailInbox } from '../../../components/MailIngest/useMailInbox';
import MSheet from '../../components/MSheet';
import { INNER_CLS, TileHeader } from '../trip/sheets/MTripSheetUi';

const ROUND = 'grid h-9 w-9 flex-none place-items-center rounded-full bg-[color:var(--m-ic)] text-m-ink disabled:opacity-50';

function icon(action: InboxAction): ReactElement {
  switch (action) {
    case 'add':
    case 'choose':
      return <Plus size={15} strokeWidth={2.2} />;
    case 'file':
      return <FilePlus2 size={15} strokeWidth={2} />;
    case 'manual':
      return <PencilLine size={15} strokeWidth={2} />;
    case 'readAi':
      return <Sparkles size={15} strokeWidth={2} />;
    case 'discard':
      return <Trash2 size={15} strokeWidth={2} />;
  }
}

function label(action: InboxAction, t: (key: string) => string): string {
  switch (action) {
    case 'add':
      return t('mailInbox.action.add');
    case 'choose':
      return t('mailInbox.action.choose');
    case 'file':
      return t('mailInbox.action.file');
    case 'manual':
      return t('mailInbox.action.manual');
    case 'readAi':
      return t('mailInbox.action.readAi');
    case 'discard':
      return t('mailInbox.action.discard');
  }
}

function Entry({ entry, inbox }: { entry: MailIngestInboxEntry; inbox: ReturnType<typeof useMailInbox> }) {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const dates = entryDates(entry);
  const reason = entry.reason ?? entry.message.reason;
  const Icon = entry.item ? RES_ICONS[entry.item.type as keyof typeof RES_ICONS] || Mail : Mail;
  const [primary, ...rest] = inbox.actionsOf(entry);
  const busy = inbox.busy === entry.id;
  const code = entry.message.forwarding_code;

  return (
    <li className={`rounded-[16px] px-3 py-[11px] ${INNER_CLS}`}>
      <div className="flex items-start gap-[10px]">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-[11px] bg-[color:var(--m-ic)] text-m-muted">
          <Icon size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div dir="auto" className="truncate text-body font-semibold text-m-ink">{entryTitle(entry) ?? t('mailInbox.untitled')}</div>
          {dates && (
            <div className="font-geist text-caption tabular-nums text-m-muted">
              {formatDate(dates.start, locale)}
              {dates.end ? ` → ${formatDate(dates.end, locale)}` : ''}
            </div>
          )}
          {reason && <div className="mt-[2px] text-caption" style={{ color: 'var(--m-st-pending)' }}>{reasonText(reason, t)}</div>}
          {entry.suggested_trip && (
            <span className="mt-[6px] inline-block max-w-full truncate rounded-full bg-[color:var(--m-ic)] px-[9px] py-[2px] text-caption font-medium text-m-muted">
              {entry.suggested_trip.title}
            </span>
          )}
        </div>
      </div>
      {code && (
        <div className="mt-[10px] flex items-center gap-2">
          <code dir="ltr" className="min-w-0 flex-1 rounded-[12px] bg-[color:var(--m-ic)] px-3 py-[8px] text-center font-geist text-subtitle font-bold tracking-[0.1em] text-m-ink">
            {code}
          </code>
          <button
            type="button"
            aria-label={t('mailInbox.settings.copy')}
            className={ROUND}
            onClick={async () => {
              if (await copyText(code)) toast.success(t('common.copied'));
            }}
          >
            <Copy size={15} strokeWidth={2} />
          </button>
        </div>
      )}
      <div className="mt-[10px] flex items-center gap-[7px]">
        <button type="button" aria-label={t('mailInbox.showMail')} className={ROUND} onClick={() => inbox.showMail(entry)}>
          <FileText size={15} strokeWidth={2} />
        </button>
        {rest.map((action) => (
          <button
            key={action}
            type="button"
            aria-label={label(action, t)}
            disabled={busy}
            onClick={() => inbox.perform(entry, action)}
            className={ROUND}
            style={action === 'discard' ? { color: 'var(--m-st-danger)' } : undefined}
          >
            {icon(action)}
          </button>
        ))}
        {primary && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inbox.perform(entry, primary)}
            aria-label={label(primary, t)}
            className={
              primary === 'discard'
                ? `${ROUND} ms-auto`
                : 'ms-auto inline-flex h-9 items-center gap-[6px] rounded-full bg-[color:var(--m-act)] px-[14px] text-caption font-bold text-[color:var(--m-actfg)] disabled:opacity-50'
            }
            style={primary === 'discard' ? { color: 'var(--m-st-danger)' } : undefined}
          >
            {icon(primary)}
            {primary !== 'discard' && label(primary, t)}
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * The phone's inbox of bookings from forwarded mails, as a sheet: the same
 * entries and ways out as the desktop dialog (useMailInbox), with icon actions
 * and one worded main action per row. Picking a trip and reading the mail open
 * as pages inside the sheet, with a back button in the head.
 */
export default function MMailInboxSheet(): ReactElement {
  const { t, locale } = useTranslation();
  const inbox = useMailInbox();
  const sub = inbox.pending > 0 ? t('mailInbox.pendingCount', { count: inbox.pending }) : t('mailInbox.empty');
  const page = inbox.picking ? 'pick' : inbox.preview ? 'mail' : 'list';
  const back = page === 'pick' ? inbox.cancelPick : page === 'mail' ? inbox.closePreview : null;

  return (
    <MSheet open={inbox.open} onClose={inbox.close} variant="card" material="glass" ariaLabel={t('mailInbox.title')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={
            back ? (
              <button type="button" onClick={back} aria-label={t('common.back')} className="grid h-full w-full place-items-center">
                <ChevronLeft size={19} strokeWidth={2} className="rtl:-scale-x-100" />
              </button>
            ) : (
              <Inbox size={19} strokeWidth={1.8} />
            )
          }
          title={page === 'pick' ? t('mailInbox.pickTrip') : page === 'mail' ? (inbox.preview?.subject ?? t('mailInbox.untitled')) : t('mailInbox.title')}
          sub={page === 'list' ? sub : undefined}
          onClose={inbox.close}
          closeLabel={t('common.close')}
        />
      </div>
      <div className="m-scroll-fade mt-2 min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[10px]">
        {page === 'pick' && (
          <ul className="flex flex-col gap-[7px]">
            {inbox.trips.map((trip) => (
              <li key={trip.id}>
                <button
                  type="button"
                  onClick={() => inbox.pick(trip.id)}
                  className={`flex w-full items-baseline justify-between gap-3 rounded-[14px] px-3 py-[11px] text-start ${INNER_CLS}`}
                >
                  <span dir="auto" className="min-w-0 truncate text-body font-semibold text-m-ink">{trip.title}</span>
                  {trip.start_date && <span className="flex-none font-geist text-caption text-m-muted">{formatDate(trip.start_date, locale)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {page === 'mail' && inbox.preview && (
          <pre className={`whitespace-pre-wrap rounded-[14px] p-3 font-geist text-caption text-m-muted ${INNER_CLS}`}>{inbox.preview.text}</pre>
        )}
        {page === 'list' && inbox.entries.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox size={28} strokeWidth={1.6} className="text-m-faint" />
            <div className="text-body font-semibold text-m-ink">{t('mailInbox.empty')}</div>
            <div className="max-w-[260px] text-caption text-m-muted">{t('mailInbox.emptyHint')}</div>
          </div>
        )}
        {page === 'list' && inbox.entries.length > 0 && (
          <ul className="flex flex-col gap-2">
            {inbox.entries.map((entry) => <Entry key={entry.id} entry={entry} inbox={inbox} />)}
            {inbox.hasMore && (
              <li className="flex justify-center pt-1">
                <button type="button" onClick={inbox.loadMore} disabled={inbox.loading} className="rounded-full bg-[color:var(--m-ic)] px-4 py-2 text-caption font-semibold text-m-ink">
                  {t('mailInbox.loadMore')}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </MSheet>
  );
}
