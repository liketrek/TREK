import type { PaddleRegionLoadState } from '@trek/shared';
import type { useTranslation } from '../../../i18n';

type Translate = ReturnType<typeof useTranslation>['t'];

/** The states in which the data is on its way: the leg waits rather than fails. */
export function isRegionLoadPending(
  state: PaddleRegionLoadState | undefined
): state is Extract<PaddleRegionLoadState, { state: 'loading' | 'ready' | 'requested' }> {
  return state?.state === 'loading' || state?.state === 'ready' || state?.state === 'requested';
}

/**
 * Why a leg stays unplanned once the data cannot come: declined, failed, no
 * water near the place, nothing to load. Null where the leg's own reason says
 * it best (loading is off, or nothing was asked yet).
 */
export function regionLoadFailure(state: PaddleRegionLoadState | undefined, t: Translate): string | null {
  if (!state) return null;
  const region = state.region?.name ?? '';
  switch (state.state) {
    case 'declined':
      return t('tours.paddle.load.declined', { region });
    case 'failed':
      return t('tours.paddle.load.failed', { region });
    case 'no_water':
      return t('tours.paddle.load.noWater', { region });
    case 'unavailable':
      if (state.reason === 'no_extract') return t('tours.paddle.load.noExtract');
      if (state.reason === 'catalog_unavailable') return t('tours.paddle.load.catalogUnavailable');
      return null;
    default:
      return null;
  }
}
