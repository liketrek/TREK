import { FileText, Link2, Paperclip, Plus, Receipt, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '../../i18n';
import type { BudgetItemReceipt, TripFile } from '../../types';
import { DialogSection, fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';

const ROW =
  'flex items-center justify-between gap-2 rounded-[10px] border border-edge-faint bg-surface-secondary px-3 py-2';
const PILL =
  'inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-semibold text-content-muted hover:text-content';

/**
 * The Receipts & Invoices block of the desktop expense dialog: the receipts on
 * the expense, the files picked to upload with the save, a picker for new ones
 * and, while the trip has files the expense does not carry, a list to link one
 * of those instead (#2839), so a booking's confirmation is not uploaded twice.
 */
export function ExpenseReceiptsSection({
  className,
  receipts,
  pendingFiles,
  uploading,
  linkable,
  onPick,
  onLink,
  onPreview,
  onRemove,
  onRemovePending,
}: {
  className: string;
  receipts: BudgetItemReceipt[];
  pendingFiles: File[];
  uploading: boolean;
  linkable: TripFile[];
  onPick: (files: FileList | null) => void;
  onLink: (file: TripFile) => void;
  onPreview: (index: number) => void;
  onRemove: (receiptId: number) => void;
  onRemovePending: (index: number) => void;
}) {
  const { t } = useTranslation();
  const [linking, setLinking] = useState(false);
  const canLink = linkable.length > 0;

  return (
    <DialogSection
      label={t('costs.receiptsTitle')}
      className={className}
      action={
        <span className="flex items-center gap-1.5">
          {canLink && (
            <button
              type="button"
              aria-expanded={linking}
              onClick={() => setLinking((v) => !v)}
              className={`${PILL} ${linking ? 'bg-surface-card shadow-sm' : 'bg-surface-tertiary'}`}
              style={fs(11.5)}
            >
              <Link2 size={12} /> {t('files.link')}
            </button>
          )}
          <label className={`${PILL} bg-surface-tertiary`} style={fs(11.5)}>
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                onPick(e.target.files);
                e.target.value = '';
              }}
            />
            <Plus size={12} /> {t('costs.attach')}
          </label>
        </span>
      }
    >
      {linking && canLink && (
        <div className="mb-2 flex max-h-[180px] flex-col gap-1 overflow-y-auto rounded-[10px] border border-edge-faint bg-surface-card p-1.5">
          {linkable.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => {
                onLink(file);
                setLinking(false);
              }}
              className="flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-start text-content hover:bg-surface-tertiary"
              style={fs(12.5, 'body')}
            >
              <FileText size={13} className="flex-shrink-0 text-content-faint" />
              <span className="truncate">{file.original_name}</span>
            </button>
          ))}
        </div>
      )}
      {uploading && (
        <div className="mb-2 text-content-faint" style={fs(12)}>
          {t('common.saving')}...
        </div>
      )}
      {receipts.length === 0 && pendingFiles.length === 0 ? (
        <div className="py-1 text-content-faint" style={fs(12.5, 'body')}>
          {t('costs.noReceipts')}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {receipts.map((r, index) => (
            <div key={r.id} className={ROW}>
              <button
                type="button"
                onClick={() => onPreview(index)}
                className="inline-flex min-w-0 items-center gap-2 text-start text-content hover:underline"
                style={fs(13, 'body')}
              >
                <Receipt size={14} className="flex-shrink-0 text-content-faint" />
                <span className="truncate">{r.original_name}</span>
              </button>
              <Tooltip label={t('costs.deleteReceipt')}>
                <button
                  type="button"
                  onClick={() => onRemove(r.id)}
                  aria-label={t('costs.deleteReceipt')}
                  className="flex p-1 text-content-muted hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            </div>
          ))}
          {pendingFiles.map((file, index) => (
            <div key={index} className={ROW}>
              <div className="inline-flex min-w-0 items-center gap-2" style={fs(13, 'body')}>
                <Paperclip size={14} className="flex-shrink-0 text-content-faint" />
                <span className="truncate text-content">{file.name}</span>
              </div>
              <Tooltip label={t('costs.deleteReceipt')}>
                <button
                  type="button"
                  onClick={() => onRemovePending(index)}
                  aria-label={t('costs.deleteReceipt')}
                  className="flex p-1 text-content-muted hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </DialogSection>
  );
}
