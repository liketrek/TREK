import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { usePluginStore } from '../../../store/pluginStore';
import { useReservationDetailPlugins } from './useReservationDetailPlugins';

type Plugins = ReturnType<typeof usePluginStore.getState>['plugins'];

function seedPlugins(plugins: Array<{ id: string; type: string; slot?: string }>) {
  usePluginStore.setState({ plugins: plugins as unknown as Plugins });
}

afterEach(() => {
  usePluginStore.setState({ plugins: [] });
});

describe('useReservationDetailPlugins', () => {
  it('keeps only the widgets that draw into a booking detail', () => {
    seedPlugins([
      { id: 'flights', type: 'widget', slot: 'reservation-detail' },
      { id: 'side', type: 'widget' },
      { id: 'place', type: 'widget', slot: 'place-detail' },
      { id: 'page', type: 'page', slot: 'reservation-detail' },
      { id: 'seats', type: 'widget', slot: 'reservation-detail' },
    ]);
    const { result } = renderHook(() => useReservationDetailPlugins());
    expect(result.current.map((p) => p.id)).toEqual(['flights', 'seats']);
  });

  it('is empty without any such plugin', () => {
    seedPlugins([{ id: 'side', type: 'widget' }]);
    const { result } = renderHook(() => useReservationDetailPlugins());
    expect(result.current).toEqual([]);
  });
});
