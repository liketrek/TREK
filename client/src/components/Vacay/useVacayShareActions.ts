import { useCallback } from 'react';

import { useTranslation } from '../../i18n';
import { useVacayStore } from '../../store/vacayStore';
import { getApiErrorMessage } from '../../types';
import { useToast } from '../shared/Toast';

/**
 * The read-only calendar share rows' actions. The optimistic hide and the removals
 * reject on server errors: surface them instead of leaving an unhandled rejection
 * behind a silently reverted toggle.
 */
export function useVacayShareActions() {
  const { t } = useTranslation();
  const toast = useToast();
  const setShareHidden = useVacayStore((s) => s.setShareHidden);
  const removeShare = useVacayStore((s) => s.removeShare);

  const toggleHidden = useCallback(
    (shareId: number, hidden: boolean) => {
      setShareHidden(shareId, hidden).catch((err: unknown) =>
        toast.error(getApiErrorMessage(err, t('vacay.shareFailed')))
      );
    },
    [setShareHidden, toast, t]
  );

  const remove = useCallback(
    (shareId: number) => {
      removeShare(shareId).catch((err: unknown) => toast.error(getApiErrorMessage(err, t('vacay.shareFailed'))));
    },
    [removeShare, toast, t]
  );

  return { toggleHidden, remove };
}
