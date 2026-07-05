// FE-STORE-PLUGIN-001 to 004
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/helpers/msw/server';
import { usePluginStore } from './pluginStore';

const initial = usePluginStore.getState();

beforeEach(() => {
  usePluginStore.setState(initial, true);
});

describe('pluginStore', () => {
  it('FE-STORE-PLUGIN-001: loads active plugins and splits pages/widgets', async () => {
    server.use(
      http.get('/api/plugins', () =>
        HttpResponse.json({
          plugins: [
            { id: 'flights', name: 'Flights', type: 'widget', icon: 'Plane' },
            { id: 'report', name: 'Report', type: 'page', icon: 'FileText' },
            { id: 'diary', name: 'Diary', type: 'trip-page', icon: 'Book' },
          ],
        }),
      ),
    );

    await usePluginStore.getState().loadPlugins();

    const s = usePluginStore.getState();
    expect(s.loaded).toBe(true);
    expect(s.plugins).toHaveLength(3);
    expect(s.pages().map((p) => p.id)).toEqual(['report']);
    expect(s.widgets().map((p) => p.id)).toEqual(['flights']);
    expect(s.tripPages().map((p) => p.id)).toEqual(['diary']);
    expect(s.getById('flights')?.name).toBe('Flights');
    expect(s.getById('nope')).toBeUndefined();
  });

  it('FE-STORE-PLUGIN-002: a failed fetch still marks the store loaded (no crash)', async () => {
    server.use(http.get('/api/plugins', () => HttpResponse.error()));
    await usePluginStore.getState().loadPlugins();
    expect(usePluginStore.getState().loaded).toBe(true);
    expect(usePluginStore.getState().plugins).toEqual([]);
  });

  it('FE-STORE-PLUGIN-003: tolerates a missing plugins array', async () => {
    server.use(http.get('/api/plugins', () => HttpResponse.json({})));
    await usePluginStore.getState().loadPlugins();
    expect(usePluginStore.getState().plugins).toEqual([]);
  });
});
