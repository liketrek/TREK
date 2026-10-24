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
  notes,
  onNotesChange,
  url,
  onUrlChange,
  reservationId,
  tripFiles,
  pendingFiles,
  fileInputRef,
  attach,
  canAttach,
  showCosts,
  pendingExpense,
  expense,
}: {
  notes: string;
  onNotesChange: (notes: string) => void;
  url: string;
  onUrlChange: (url: string) => void;
  /** The saved booking; unset while it is being created. */
  reservationId: number | undefined;
  tripFiles: TripFile[];
  pendingFiles: File[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  attach: ReturnType<typeof useBookingFileAttach>;
  canAttach: boolean;
  showCosts: boolean;
  pendingExpense: { total_price: number; currency?: string | null; category: string } | null;
  expense: ReturnType<typeof useBookingExpenseIntent>;
}) {
  const { t } = useTranslation();
  return (
    <>
      <EditorField label={t('reservations.notes')}>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          placeholder={t('reservations.notesPlaceholder')}
          className={TEXTAREA}
        />
      </EditorField>

      <BookingLinkAndFiles
        url={url}
        onUrlChange={onUrlChange}
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
        uploading={attach.uploadingFile}
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
