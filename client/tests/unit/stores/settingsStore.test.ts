import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../helpers/msw/server';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { resetAllStores } from '../../helpers/store';
import { buildSettings } from '../../helpers/factories';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

beforeEach(() => {
  resetAllStores();
});

describe('settingsStore', () => {
  describe('FE-SETTINGS-001: loadSettings()', () => {
    it('fetches settings and updates store', async () => {
      const settings = buildSettings({ default_currency: 'EUR', language: 'de' });
      server.use(
        http.get('/api/settings', () => HttpResponse.json({ settings }))
      );

      await useSettingsStore.getState().loadSettings();
      const state = useSettingsStore.getState();

      expect(state.settings.default_currency).toBe('EUR');
      expect(state.settings.language).toBe('de');
      expect(state.isLoaded).toBe(true);
    });
  });

  describe('FE-SETTINGS-002: updateSetting() optimistic update', () => {
    it('immediately updates local state before API resolves', async () => {
      // The store's set() is called synchronously before the first await (settingsApi.set)
      // so state is visible without needing to await the full action.
      const promise = useSettingsStore.getState().updateSetting('default_currency', 'GBP');

      // Check optimistic state — no await needed here
      expect(useSettingsStore.getState().settings.default_currency).toBe('GBP');

      // Let the API call finish to avoid dangling promises
      await promise;
    });
  });

  describe('FE-SETTINGS-003: updateSetting() reverts on API failure', () => {
    it('throws when API fails', async () => {
      server.use(
        http.put('/api/settings', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      // The store optimistically sets, then throws — the revert is a throw
      await expect(
        useSettingsStore.getState().updateSetting('default_currency', 'GBP')
      ).rejects.toThrow();
    });
  });

  describe('FE-SETTINGS-004: Language change', () => {
    it('updates language field and localStorage', async () => {
      await useSettingsStore.getState().updateSetting('language', 'fr');

      const state = useSettingsStore.getState();
      expect(state.settings.language).toBe('fr');
      expect(localStorage.getItem('app_language')).toBe('fr');
    });
  });

  describe('FE-SETTINGS-005: loadSettings failure', () => {
    it('sets isLoaded: true even on API failure (graceful)', async () => {
      server.use(
        http.get('/api/settings', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      await useSettingsStore.getState().loadSettings();
      const state = useSettingsStore.getState();

      expect(state.isLoaded).toBe(true);
    });
  });

  describe('FE-STORE-SETTINGS-006: setLanguageLocal updates state and localStorage', () => {
    it('sets language in state and localStorage without an API call', () => {
      useSettingsStore.getState().setLanguageLocal('ja');

      const state = useSettingsStore.getState();
      expect(state.settings.language).toBe('ja');
      expect(localStorage.getItem('app_language')).toBe('ja');
    });
  });

  describe('FE-STORE-SETTINGS-007: setLanguageLocal without prior localStorage value', () => {
    it('writes to localStorage even when no prior value exists', () => {
      localStorage.clear();

      useSettingsStore.getState().setLanguageLocal('ko');

      const state = useSettingsStore.getState();
      expect(state.settings.language).toBe('ko');
      expect(localStorage.getItem('app_language')).toBe('ko');
    });
  });

  describe('FE-STORE-SETTINGS-008: updateSettings bulk update', () => {
    it('updates multiple settings keys and calls bulk API', async () => {
      await useSettingsStore.getState().updateSettings({ dark_mode: true, default_currency: 'JPY' });

      const state = useSettingsStore.getState();
      expect(state.settings.dark_mode).toBe(true);
      expect(state.settings.default_currency).toBe('JPY');
    });
  });

  describe('FE-STORE-SETTINGS-009: updateSettings optimistic update', () => {
    it('updates state synchronously before API resolves', async () => {
      const promise = useSettingsStore.getState().updateSettings({ dark_mode: true });

      expect(useSettingsStore.getState().settings.dark_mode).toBe(true);

      await promise;
    });
  });

  describe('FE-STORE-SETTINGS-010: updateSettings API failure throws', () => {
    it('throws when bulk API returns 500', async () => {
      server.use(
        http.post('/api/settings/bulk', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      await expect(
        useSettingsStore.getState().updateSettings({ dark_mode: true })
      ).rejects.toThrow();
    });
  });

  describe('FE-STORE-SETTINGS-011: updateSetting non-language key does not write to localStorage', () => {
    it('does not modify app_language in localStorage', async () => {
      const before = localStorage.getItem('app_language');

      await useSettingsStore.getState().updateSetting('dark_mode', true);

      expect(localStorage.getItem('app_language')).toBe(before);
    });
  });

  describe('FE-STORE-SETTINGS-012: loadSettings merges server values with defaults', () => {
    it('preserves default keys not returned by server', async () => {
      server.use(
        http.get('/api/settings', () =>
          HttpResponse.json({ settings: { dark_mode: true } })
        )
      );

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.settings.dark_mode).toBe(true);
      expect(state.settings.language).toBe('en');
      // No display currency of their own: Costs then follows each trip's own currency
      // rather than forcing every trip through one code.
      expect(state.settings.default_currency).toBe('');
    });
  });

  describe('FE-STORE-SETTINGS-013: updateSetting for time_format', () => {
    it('updates time_format in state', async () => {
      await useSettingsStore.getState().updateSetting('time_format', '24h');

      expect(useSettingsStore.getState().settings.time_format).toBe('24h');
    });
  });

  describe('FE-STORE-SETTINGS-015: setLanguageTransient updates state without touching localStorage', () => {
    it('sets language in state but does not write to localStorage', () => {
      localStorage.clear();

      useSettingsStore.getState().setLanguageTransient('fr');

      expect(useSettingsStore.getState().settings.language).toBe('fr');
      expect(localStorage.getItem('app_language')).toBeNull();
    });
  });

  describe('FE-STORE-SETTINGS-016: setLanguageTransient rejects unsupported language code', () => {
    it('leaves state unchanged for an unknown code', () => {
      const before = useSettingsStore.getState().settings.language;

      useSettingsStore.getState().setLanguageTransient('xx');

      expect(useSettingsStore.getState().settings.language).toBe(before);
    });
  });

  describe('FE-STORE-SETTINGS-017: setLanguageTransient does not overwrite an explicit localStorage choice', () => {
    it('localStorage remains unchanged after a transient set', () => {
      localStorage.setItem('app_language', 'de');

      useSettingsStore.getState().setLanguageTransient('es');

      expect(localStorage.getItem('app_language')).toBe('de');
    });
  });

  describe('FE-STORE-SETTINGS-014: updateSetting API failure restores durable state', () => {
    it('throws on API failure and rolls back the optimistic state', async () => {
      const previous = useSettingsStore.getState().settings.default_currency;
      server.use(
        http.put('/api/settings', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      await expect(
        useSettingsStore.getState().updateSetting('default_currency', 'EUR')
      ).rejects.toThrow();

      expect(useSettingsStore.getState().settings.default_currency).toBe(previous);
    });

    it('does not let an older failed request overwrite a newer successful value', async () => {
      const firstStarted = deferred<void>();
      const firstResponse = deferred<Response>();
      let requestCount = 0;
      server.use(
        http.put('/api/settings', () => {
          requestCount += 1;
          if (requestCount === 1) {
            firstStarted.resolve();
            return firstResponse.promise;
          }
          return HttpResponse.json({ success: true });
        }),
      );

      const staleRequest = useSettingsStore.getState().updateSetting('default_currency', 'EUR');
      const staleRejection = expect(staleRequest).rejects.toThrow('Server error');
      await firstStarted.promise;
      await useSettingsStore.getState().updateSetting('default_currency', 'JPY');
      firstResponse.resolve(HttpResponse.json({ error: 'Server error' }, { status: 500 }));

      await staleRejection;
      expect(useSettingsStore.getState().settings.default_currency).toBe('JPY');
    });

    it('restores the previous language in state and localStorage when saving fails', async () => {
      useSettingsStore.getState().setLanguageLocal('de');
      server.use(
        http.put('/api/settings', () => HttpResponse.json({ error: 'Server error' }, { status: 500 })),
      );

      await expect(useSettingsStore.getState().updateSetting('language', 'fr')).rejects.toThrow('Server error');

      expect(useSettingsStore.getState().settings.language).toBe('de');
      expect(localStorage.getItem('app_language')).toBe('de');
    });

    it('removes app_language after a failed save when no preference existed before', async () => {
      localStorage.removeItem('app_language');
      useSettingsStore.getState().setLanguageTransient('en');
      server.use(
        http.put('/api/settings', () => HttpResponse.json({ error: 'Server error' }, { status: 500 })),
      );

      await expect(useSettingsStore.getState().updateSetting('language', 'fr')).rejects.toThrow('Server error');

      expect(useSettingsStore.getState().settings.language).toBe('en');
      expect(localStorage.getItem('app_language')).toBeNull();
    });

    it('rejects an older failed language request without overwriting a newer preference', async () => {
      useSettingsStore.getState().setLanguageLocal('de');
      const firstStarted = deferred<void>();
      const firstResponse = deferred<Response>();
      let requestCount = 0;
      server.use(
        http.put('/api/settings', () => {
          requestCount += 1;
          if (requestCount === 1) {
            firstStarted.resolve();
            return firstResponse.promise;
          }
          return HttpResponse.json({ success: true });
        }),
      );

      const staleRequest = useSettingsStore.getState().updateSetting('language', 'fr');
      const staleRejection = expect(staleRequest).rejects.toThrow('Server error');
      await firstStarted.promise;
      await useSettingsStore.getState().updateSetting('language', 'ja');
      firstResponse.resolve(HttpResponse.json({ error: 'Server error' }, { status: 500 }));

      await staleRejection;
      expect(useSettingsStore.getState().settings.language).toBe('ja');
      expect(localStorage.getItem('app_language')).toBe('ja');
    });
  });

  it('resets common currencies to the inherited list returned by the server', async () => {
    server.use(
      http.delete('/api/settings/common_currencies', () =>
        HttpResponse.json({ success: true, key: 'common_currencies', value: ['EUR', 'JPY'] }),
      ),
    );

    await expect(useSettingsStore.getState().resetSetting('common_currencies')).resolves.toEqual(['EUR', 'JPY']);
    expect(useSettingsStore.getState().settings.common_currencies).toEqual(['EUR', 'JPY']);
  });

  it('does not let a stale reset success overwrite or return over a newer value', async () => {
    await useSettingsStore.getState().updateSetting('common_currencies', ['USD']);
    const resetStarted = deferred<void>();
    const resetResponse = deferred<Response>();
    server.use(
      http.delete('/api/settings/common_currencies', () => {
        resetStarted.resolve();
        return resetResponse.promise;
      }),
    );

    const staleReset = useSettingsStore.getState().resetSetting('common_currencies');
    await resetStarted.promise;
    await useSettingsStore.getState().updateSetting('common_currencies', ['JPY']);
    resetResponse.resolve(
      HttpResponse.json({ success: true, key: 'common_currencies', value: ['EUR'] }),
    );

    await expect(staleReset).resolves.toEqual(['JPY']);
    expect(useSettingsStore.getState().settings.common_currencies).toEqual(['JPY']);
  });

  it('does not modify a newer value when reset fails', async () => {
    await useSettingsStore.getState().updateSetting('common_currencies', ['USD']);
    const resetStarted = deferred<void>();
    const resetResponse = deferred<Response>();
    server.use(
      http.delete('/api/settings/common_currencies', () => {
        resetStarted.resolve();
        return resetResponse.promise;
      }),
    );

    const failedReset = useSettingsStore.getState().resetSetting('common_currencies');
    const resetRejection = expect(failedReset).rejects.toThrow('Server error');
    await resetStarted.promise;
    await useSettingsStore.getState().updateSetting('common_currencies', ['JPY']);
    resetResponse.resolve(HttpResponse.json({ error: 'Server error' }, { status: 500 }));

    await resetRejection;
    expect(useSettingsStore.getState().settings.common_currencies).toEqual(['JPY']);
  });
});
