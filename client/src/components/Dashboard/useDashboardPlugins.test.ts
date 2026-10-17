// FE-COMP-DASHPLUGINS-001 to -003: what plugins add to both dashboards.
import { renderHook } from '@testing-library/react';

import { usePluginStore } from '../../store/pluginStore';
import { useDashboardPlugins } from './useDashboardPlugins';

const badges = vi.fn<(ids: number[], enabled: boolean) => (id: number) => unknown[]>(() => () => []);
vi.mock('../Plugins/TripCardBadges', () => ({
  useTripCardBadges: (ids: number[], enabled: boolean) => badges(ids, enabled),
}));

type Plugins = ReturnType<typeof usePluginStore.getState>['plugins'];

function seedPlugins(plugins: Array<{ id: string; type: string; slot?: string }>) {
  usePluginStore.setState({ plugins: plugins as unknown as Plugins });
}

beforeEach(() => badges.mockClear());

describe('useDashboardPlugins', () => {
  it('FE-COMP-DASHPLUGINS-001: keeps only the widgets meant for the dashboard column', () => {
    seedPlugins([
      { id: 'side', type: 'widget' },
      { id: 'slotted', type: 'widget', slot: 'dashboard' },
      { id: 'hero', type: 'widget', slot: 'hero' },
      { id: 'place', type: 'widget', slot: 'place-detail' },
      { id: 'day', type: 'widget', slot: 'day-detail' },
      { id: 'res', type: 'widget', slot: 'reservation-detail' },
      { id: 'page', type: 'page' },
    ]);
    const { result } = renderHook(() => useDashboardPlugins([1]));
    expect(result.current.widgetPlugins.map((p) => p.id)).toEqual(['side', 'slotted']);
  });

  it('FE-COMP-DASHPLUGINS-002: asks for card badges only while a plugin is active', () => {
    seedPlugins([]);
    renderHook(() => useDashboardPlugins([1, 2]));
    expect(badges).toHaveBeenLastCalledWith([1, 2], false);

    seedPlugins([{ id: 'page', type: 'page' }]);
    renderHook(() => useDashboardPlugins([3]));
    expect(badges).toHaveBeenLastCalledWith([3], true);
  });

  it('FE-COMP-DASHPLUGINS-003: hands back the badge lookup', () => {
    const lookup = () => [];
    badges.mockReturnValueOnce(lookup);
    seedPlugins([]);
    const { result } = renderHook(() => useDashboardPlugins([]));
    expect(result.current.badgesFor).toBe(lookup);
  });
});
