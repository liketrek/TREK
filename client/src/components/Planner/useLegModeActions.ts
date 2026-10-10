import { type LucideIcon, RotateCcw, TramFront } from 'lucide-react';
import { useCallback } from 'react';

import { assignmentsApi } from '../../api/client';
import type { TripStoreState } from '../../store/tripStore';
import { type RouteModeOption, routeModeIcon, useRouteModeOptions } from './routeModes';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** One entry of the connector menu, in the shape the context menu draws. */
export interface LegModeMenuItem {
  label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  divider?: boolean;
}

/**
 * The menu a leg's connector opens (#1281): every route profile, public transit
 * for the leg when it can be searched (#2398), and the day default, which clears
 * the leg's own mode again.
 */
export function legModeMenuItems(
  options: RouteModeOption[],
  pick: (mode: string | null) => void,
  t: Translate,
  planTransit?: () => void
): LegModeMenuItem[] {
  return [
    ...options.map((o) => ({ label: o.label, icon: routeModeIcon(o.key), onClick: () => pick(o.key) })),
    ...(planTransit ? [{ label: t('transit.title'), icon: TramFront, onClick: planTransit }] : []),
    { divider: true },
    { label: t('dayplan.transportMode.useDefault'), icon: RotateCcw, onClick: () => pick(null) },
  ];
}

export interface LegModeDeps {
  tripId: number;
  toast: { error: (message: string) => void };
  t: Translate;
  tripActions: Pick<TripStoreState, 'refreshDays'>;
}

/**
 * The per-leg travel mode behind both the desktop day plan and the phone timeline.
 * Each side shows a new mode at once its own way; `persistLegMode` then saves it for
 * the leg leaving a stop, or with 'incoming' for the one entering it. A refused write
 * says why and reloads the days, so the shown mode goes back.
 */
export function useLegModeActions({ tripId, toast, t, tripActions }: LegModeDeps) {
  const routeModeOptions = useRouteModeOptions();

  const persistLegMode = useCallback(
    (assignmentId: number, mode: string | null, direction?: 'incoming') => {
      const write = direction
        ? assignmentsApi.updateTransport(tripId, assignmentId, mode, direction)
        : assignmentsApi.updateTransport(tripId, assignmentId, mode);
      write.catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : t('common.unknownError'));
        void tripActions.refreshDays(tripId);
      });
    },
    [tripId, toast, t, tripActions]
  );

  const legModeMenu = (pick: (mode: string | null) => void, planTransit?: () => void) =>
    legModeMenuItems(routeModeOptions, pick, t, planTransit);

  return { routeModeOptions, legModeMenu, persistLegMode };
}
