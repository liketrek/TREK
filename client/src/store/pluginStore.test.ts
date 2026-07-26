// FE-STORE-PLUGIN-001 to 006
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/helpers/msw/server';
import { usePluginStore, clearAllPluginSessions } from './pluginStore';

const initial = usePluginStore.getState();

beforeEach(() => {
  usePluginStore.setState(initial, true);
  sessionStorage.clear();
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
    sessionStorage.setItem('trek:plugin-session:7:active:plugin:filters', '["flight"]');
    server.use(http.get('/api/plugins', () => HttpResponse.error()));
    await usePluginStore.getState().loadPlugins();
    expect(usePluginStore.getState().loaded).toBe(true);
    expect(usePluginStore.getState().plugins).toEqual([]);
    expect(sessionStorage.getItem('trek:plugin-session:7:active:plugin:filters')).toBe('["flight"]');
  });

  it('FE-STORE-PLUGIN-003: tolerates a missing plugins array', async () => {
    server.use(http.get('/api/plugins', () => HttpResponse.json({})));
    await usePluginStore.getState().loadPlugins();
    expect(usePluginStore.getState().plugins).toEqual([]);
  });

  it('FE-STORE-PLUGIN-004: clears session state for disabled plugins after a successful refresh', async () => {
    sessionStorage.setItem('trek:plugin-session:7:active:plugin:filters', '["flight"]');
    sessionStorage.setItem('trek:plugin-session:7:disabled:plugin:filters', '["hotel"]');
    sessionStorage.setItem('trek:plugin-session:7:disabled:trip:42:view', '"table"');
    sessionStorage.setItem('trek_session', 'app-session');

    server.use(
      http.get('/api/plugins', () =>
        HttpResponse.json({
          plugins: [{ id: 'active', name: 'Active', type: 'widget', icon: null }],
        }),
      ),
    );

    await usePluginStore.getState().loadPlugins();

    expect(sessionStorage.getItem('trek:plugin-session:7:active:plugin:filters')).toBe('["flight"]');
    expect(sessionStorage.getItem('trek:plugin-session:7:disabled:plugin:filters')).toBeNull();
    expect(sessionStorage.getItem('trek:plugin-session:7:disabled:trip:42:view')).toBeNull();
    expect(sessionStorage.getItem('trek_session')).toBe('app-session');
  });

  it('FE-STORE-PLUGIN-005: clearAllPluginSessions drops every user and scope, but nothing else', () => {
    sessionStorage.setItem('trek:plugin-session:7:active:plugin:filters', '["flight"]');
    sessionStorage.setItem('trek:plugin-session:9:active:trip:42:view', '"table"');
    sessionStorage.setItem('trek_session', 'app-session');

    clearAllPluginSessions();

    expect(sessionStorage.getItem('trek:plugin-session:7:active:plugin:filters')).toBeNull();
    expect(sessionStorage.getItem('trek:plugin-session:9:active:trip:42:view')).toBeNull();
    expect(sessionStorage.getItem('trek_session')).toBe('app-session');
  });

  it('FE-STORE-PLUGIN-006: a sessionStorage failure during the purge still keeps the loaded plugins', async () => {
    const key = vi.spyOn(Storage.prototype, 'key').mockImplementation(() => { throw new Error('storage disabled'); });
    server.use(
      http.get('/api/plugins', () =>
        HttpResponse.json({ plugins: [{ id: 'active', name: 'Active', type: 'widget', icon: null }] }),
      ),
    );

    await usePluginStore.getState().loadPlugins();

    expect(usePluginStore.getState().plugins.map((p) => p.id)).toEqual(['active']);
    expect(usePluginStore.getState().loaded).toBe(true);
    key.mockRestore();
  });
});
