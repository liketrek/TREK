import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../helpers/msw/server';
import { instanceAddonOn, useAddonStore } from '../../../src/store/addonStore';
import { resetAllStores } from '../../helpers/store';

beforeEach(() => {
  resetAllStores();
});

describe('addonStore', () => {
  describe('FE-ADDON-001: loadAddons()', () => {
    it('fetches and stores enabled addons', async () => {
      await useAddonStore.getState().loadAddons();
      const state = useAddonStore.getState();

      expect(state.loaded).toBe(true);
      expect(state.addons.length).toBeGreaterThan(0);
      expect(state.addons[0]).toHaveProperty('id');
      expect(state.addons[0]).toHaveProperty('enabled', true);
      expect(state.bagTracking).toBe(false);
    });

    it('captures the global bagTracking flag from the response', async () => {
      server.use(
        http.get('/api/addons', () =>
          HttpResponse.json({ bagTracking: true, addons: [] })
        )
      );

      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().bagTracking).toBe(true);
    });

    it('captures whether wanderer may be used under Tours', async () => {
      server.use(
        http.get('/api/addons', () => HttpResponse.json({ toursWanderer: true, toursHikingMap: true, addons: [] }))
      );
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().toursWanderer).toBe(true);

      server.use(http.get('/api/addons', () => HttpResponse.json({ addons: [] })));
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().toursWanderer).toBe(false);
    });

    it('keeps the collab chat on unless the response turns it off', async () => {
      server.use(http.get('/api/addons', () => HttpResponse.json({ addons: [] })));
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().collabChat).toBe(true);

      server.use(http.get('/api/addons', () => HttpResponse.json({ addons: [], collabFeatures: { chat: true } })));
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().collabChat).toBe(true);

      server.use(http.get('/api/addons', () => HttpResponse.json({ addons: [], collabFeatures: { chat: false } })));
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().collabChat).toBe(false);
    });
  });

  describe('FE-ADDON-002: isEnabled returns true for known addon', () => {
    it('returns true when addon is in the list and enabled', async () => {
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().isEnabled('vacay')).toBe(true);
    });
  });

  describe('FE-ADDON-003: isEnabled returns false for unknown addon', () => {
    it('returns false when addon is not in the list', async () => {
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().isEnabled('nonexistent')).toBe(false);
    });
  });

  describe('FE-ADDON-004: API failure', () => {
    it('sets loaded: true and keeps addons empty on API error', async () => {
      server.use(
        http.get('/api/addons', () =>
          HttpResponse.json({ error: 'Server error' }, { status: 500 })
        )
      );

      await useAddonStore.getState().loadAddons();
      const state = useAddonStore.getState();

      expect(state.loaded).toBe(true);
      expect(state.addons).toEqual([]);
      expect(state.failed).toBe(true);
      // The empty list says nothing, so the caller's guess stands.
      expect(instanceAddonOn(state, 'packing', true)).toBe(true);
    });

    it('a failed refresh after a good read keeps that read as what the instance has', async () => {
      server.use(http.get('/api/addons', () => HttpResponse.json({ addons: [{ id: 'packing', enabled: true }] })));
      await useAddonStore.getState().loadAddons();
      server.use(http.get('/api/addons', () => HttpResponse.json({ error: 'down' }, { status: 500 })));
      await useAddonStore.getState().loadAddons();

      const state = useAddonStore.getState();
      expect(state.failed).toBe(false);
      expect(instanceAddonOn(state, 'packing', false)).toBe(true);
      expect(instanceAddonOn(state, 'budget', true)).toBe(false);
    });
  });

  describe('FE-ADDON-005: the Tours options and the collab features', () => {
    it('keeps the Tours options apart from the combined flags', async () => {
      server.use(
        http.get('/api/addons', () =>
          HttpResponse.json({
            toursWanderer: false,
            toursHikingMap: false,
            toursCycleMap: false,
            toursOptions: { wanderer: true, hikingMap: true, cycleMap: false },
            addons: [],
          })
        )
      );
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().toursOptions).toEqual({ wanderer: true, hikingMap: true, cycleMap: false });
      expect(useAddonStore.getState().toursWanderer).toBe(false);
    });

    it('reads the options from the combined flags of a server that does not list them apart', async () => {
      server.use(
        http.get('/api/addons', () => HttpResponse.json({ toursWanderer: true, toursCycleMap: true, addons: [] }))
      );
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().toursOptions).toEqual({ wanderer: true, hikingMap: false, cycleMap: true });
    });

    it('keeps every collab feature, on unless the response turns it off', async () => {
      server.use(
        http.get('/api/addons', () => HttpResponse.json({ addons: [], collabFeatures: { polls: false } }))
      );
      await useAddonStore.getState().loadAddons();
      expect(useAddonStore.getState().collabFeatures).toEqual({
        chat: true,
        notes: true,
        links: true,
        polls: false,
        whatsnext: true,
      });
    });
  });
});
