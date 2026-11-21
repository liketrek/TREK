import { useState } from 'react';

import { useTranslation } from '../../i18n';
import { useTripStore } from '../../store/tripStore';
import type { Trip } from '../../types';
import { useToast } from '../shared/Toast';

/**
 * Whether a trip splits its costs between the travellers or keeps the totals
 * only (#1714), and the switch between the two, for the desktop Costs panel and
 * the phone tab alike. The mode is the trip's own (`trips.costs_mode`), so every
 * member sees the same Costs; it is saved through the trip, as `budget_edit`.
 *
 * The switch is offered to whoever may edit the costs, and only on a trip with
 * more than one member: a trip of one has nothing to split either way (#2689).
 */
export function useCostsMode(trip: Trip | null | undefined, memberCount: number, canEdit: boolean) {
  const { t } = useTranslation();
  const toast = useToast();
  const updateTrip = useTripStore((s) => s.updateTrip);
  const [saving, setSaving] = useState(false);

  const setSplitting = async (on: boolean) => {
    if (!trip) return;
    setSaving(true);
    try {
      await updateTrip(trip.id, { costs_mode: on ? 'split' : 'totals' });
    } catch {
      toast.error(t('common.unknownError'));
    } finally {
      setSaving(false);
    }
  };

  return { splitting: trip?.costs_mode !== 'totals', setSplitting, saving, offered: canEdit && memberCount > 1 };
}
