import { useState } from 'react';
import { useTranslation } from '../../i18n';
import type { BudgetItem } from '../../types';
import ConfirmDialog from '../shared/ConfirmDialog';

/**
 * The bin on an expense asks before anything is sent. An expense is deleted
 * with its splits and receipt links, so a stray click would cost more than the
 * row. The hook holds the expense being asked about and renders the dialog for
 * it; the delete itself stays with the caller.
 */
export function useExpenseDeleteConfirm(items: BudgetItem[], onDelete: (id: number) => Promise<unknown>) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<BudgetItem | null>(null);

  // The table reports a row by its id, so the expense is looked up for its name and receipts.
  const askById = (id: number) => setTarget(items.find((b) => b.id === id) ?? null);

  const hasReceipts = (target?.receipts || []).length > 0;
  const dialog = (
    <ConfirmDialog
      isOpen={target !== null}
      onClose={() => setTarget(null)}
      title={t('costs.confirm.deleteTitle')}
      message={t(hasReceipts ? 'costs.confirm.deleteBodyReceipts' : 'costs.confirm.deleteBody', {
        name: target?.name ?? '',
      })}
      confirmLabel={t('common.delete')}
      cancelLabel={t('common.cancel')}
      onConfirm={() => {
        const id = target?.id;
        setTarget(null);
        if (id !== undefined) void onDelete(id);
      }}
    />
  );

  return { ask: setTarget, askById, dialog };
}
