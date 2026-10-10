import { FileText, type LucideIcon, Pencil, Trash2 } from 'lucide-react';

import type { useReservationCard } from '../../../../components/Planner/bookings/useReservationCard';
import type { useTranslation } from '../../../../i18n';
import type { Reservation } from '../../../../types';
import type { filesFor } from '../../../../utils/reservationFiles';
import MConfirmSheet from '../../settings/MConfirmSheet';
import { ConfirmationCode, Field } from './tabChrome';

/**
 * Pieces of the phone reservation card that the transports and bookings tabs
 * draw the same way. Each tab keeps its own card and decides what a tap does
 * (the transports tab opens the detail sheet, the bookings tab the edit modal);
 * these only paint the shared markup.
 */

type T = ReturnType<typeof useTranslation>['t'];
type CardState = ReturnType<typeof useReservationCard>;

/** Header button: type pill, title and the needs-review badge. */
export function CardTitleButton({
  res,
  TypeIcon,
  typeColor,
  onOpen,
  t,
}: {
  res: Reservation;
  TypeIcon: LucideIcon;
  typeColor: string;
  onOpen: () => void;
  t: T;
}) {
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-[7px] text-start">
      <span className="inline-flex flex-none items-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-m-card px-2 py-[2px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.06em] text-m-muted">
        <TypeIcon size={10} strokeWidth={2.2} style={{ color: typeColor }} />
        {t(`reservations.type.${res.type}`)}
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-bold text-m-ink">{res.title}</span>
      {!!res.needs_review && (
        <span className="flex-none rounded-full bg-[rgba(232,161,58,.16)] px-2 py-[2px] font-geist text-[0.5rem] font-bold uppercase tracking-[.03em] text-[color:var(--m-st-pending)]">
          {t('reservations.needsReview')}
        </span>
      )}
    </button>
  );
}

/** Round edit and delete buttons at the end of the header. */
export function CardActions({ onEdit, onDelete, t }: { onEdit: () => void; onDelete: () => void; t: T }) {
  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        aria-label={t('common.edit')}
        className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
      >
        <Pencil size={12} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t('common.delete')}
        className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
      >
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </>
  );
}

/**
 * Date and time row, followed by the booking code. The code sits outside the
 * row button so its reveal can be its own control.
 */
export function CardWhenAndCode({
  dayValue,
  timeValue,
  code,
  card,
  onOpen,
  t,
}: {
  dayValue: string;
  timeValue: string;
  code: string | null | undefined;
  card: CardState;
  onOpen: () => void;
  t: T;
}) {
  return (
    <>
      <button type="button" onClick={onOpen} className="block w-full text-start">
        <div className="flex gap-2">
          <Field label={t('reservations.date')} className="flex-[1.4]">
            {dayValue}
          </Field>
          <Field label={t('reservations.time')} className="flex-1" tabular>
            {timeValue}
          </Field>
        </div>
      </button>

      {code && (
        <ConfirmationCode
          code={code}
          label={t('reservations.confirmationCode')}
          blurred={card.codeBlurred}
          onToggle={card.toggleCode}
        />
      )}
    </>
  );
}

/** Attached files, listed inside the card body button. */
export function CardFiles({ files, card, t }: { files: ReturnType<typeof filesFor>; card: CardState; t: T }) {
  if (files.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="mb-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-faint">
        {t('files.title')}
      </div>
      <div className="flex flex-col gap-1">
        {/* A span with a button role, not a <button>: the whole card body
            is already one, and buttons cannot nest. */}
        {files.map((f) => (
          <span
            key={f.id}
            role="button"
            tabIndex={0}
            {...card.fileChip(f)}
            className="flex items-center gap-[6px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-[7px]"
          >
            <FileText size={12} strokeWidth={2} className="flex-none text-m-muted" />
            <span className="truncate font-geist text-[0.65625rem] font-semibold text-m-muted">{f.original_name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Confirmation sheet behind the delete button. */
export function CardDeleteSheet({ title, card, t }: { title: string; card: CardState; t: T }) {
  return (
    <MConfirmSheet
      open={card.confirmingDelete}
      onClose={card.cancelDelete}
      title={t('reservations.confirm.deleteTitle')}
      message={t('reservations.confirm.deleteBody', { name: title })}
      confirmLabel={t('common.delete')}
      cancelLabel={t('common.cancel')}
      danger
      onConfirm={card.confirmDelete}
    />
  );
}
