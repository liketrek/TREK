import type { RefObject } from 'react';

import { useTranslation } from '../../i18n';
import type { TripFile } from '../../types';
import { EditorField, INPUT, LABEL, TEXTAREA } from '../shared/dialogParts';
import { BookingCostsSection } from './BookingCostsSection';
import { BookingLinkAndFiles } from './BookingLinkAndFiles';
import type { useBookingExpenseIntent } from './useBookingExpenseIntent';
import type { useBookingFileAttach } from './useBookingFileAttach';

/**
 * The lower part the booking and transport dialogs share: notes, the link and
 * files row, and the costs linked to this booking when the budget addon is on.
 */
export function BookingNotesFilesCosts({
  form,
  set,
  reservationId,
  tripFiles,
  pendingFiles,
  fileInputRef,
  attach,
  canAttach,
  saving,
  showCosts,
  pendingExpense,
  expense,
}: {
  form: { notes: string; url: string };
  set: (field: 'notes' | 'url', value: string) => void;
  /** The saved booking; unset while it is being created. */
  reservationId: number | undefined;
  tripFiles: TripFile[];
  pendingFiles: File[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  attach: ReturnType<typeof useBookingFileAttach>;
  canAttach: boolean;
  /** While the save runs the picked files are on their way, so no more can join them. */
  saving: boolean;
  showCosts: boolean;
  pendingExpense: { total_price: number; currency?: string | null; category: string } | null;
  expense: ReturnType<typeof useBookingExpenseIntent>;
}) {
  const { t } = useTranslation();
  return (
    <>
      <EditorField label={t('reservations.notes')}>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder={t('reservations.notesPlaceholder')}
          className={TEXTAREA}
        />
      </EditorField>

      <BookingLinkAndFiles
        url={form.url}
        onUrlChange={(url) => set('url', url)}
        labelClass={LABEL}
        inputClass={INPUT}
        reservationId={reservationId}
        tripFiles={tripFiles}
        attachedFiles={attach.attachedFiles}
        pendingFiles={pendingFiles}
        onRemovePending={attach.removePending}
        fileInputRef={fileInputRef}
        onFileChange={attach.handleFileChange}
        canAttach={canAttach}
        uploading={saving}
        onLinked={attach.linkFile}
        onDetached={attach.detachFile}
      />

      {/* Costs: create or view the expenses linked to this booking */}
      {showCosts && (
        <BookingCostsSection
          reservationId={reservationId ?? null}
          pendingExpense={pendingExpense}
          onCreate={expense.create}
          onEdit={expense.edit}
          onRemove={expense.remove}
          labelClassName={LABEL}
          customTooltips
        />
      )}
    </>
  );
}
