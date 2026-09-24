import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../helpers/msw/server';
import { useSystemNoticeStore } from '../../../src/store/systemNoticeStore';

const initial = useSystemNoticeStore.getState();

beforeEach(() => {
  useSystemNoticeStore.setState(initial, true);
});

describe('systemNoticeStore', () => {
  // After an update the service worker serves the previous bundle until the new one is
  // installed. The server only hands the release notice to a bundle that announces it
  // can draw the release layout, so an older bundle never shows it as bare keys and
  // never dismisses it for good. This bundle has to announce it on every fetch.
  describe('FE-SYSNOTICE-001: fetch() announces the layouts this bundle can draw', () => {
    it('sends supports=release and the version this bundle was built as', async () => {
      const urls: URL[] = [];
      server.use(
        http.get('/api/system-notices/active', ({ request }) => {
          urls.push(new URL(request.url));
          return HttpResponse.json([]);
        }),
      );

      await useSystemNoticeStore.getState().fetch();

      expect(urls).toHaveLength(1);
      expect(urls[0].searchParams.get('supports')).toBe('release');
      // The value `define` bakes in from client/package.json: the server compares it
      // with its own version before it hands the release notice over.
      expect(urls[0].searchParams.get('ui')).toBe(__TREK_UI_VERSION__);
      expect(urls[0].searchParams.get('ui')).toMatch(/^\d+\.\d+\.\d+/);
      expect(useSystemNoticeStore.getState().loaded).toBe(true);
    });

    it('keeps the notices the server returns, release layout included', async () => {
      const release = {
        id: 'release-notes', display: 'modal', severity: 'info', dismissible: true,
        titleKey: 'system_notice.release_notes.headline', bodyKey: 'system_notice.release_notes.intro',
        release: {
          version: '4.3.0',
          eyebrowKey: 'system_notice.release_notes.eyebrow',
          headlineKey: 'system_notice.release_notes.headline',
          introKey: 'system_notice.release_notes.intro',
          featuresLabelKey: 'system_notice.release_notes.features_label',
          features: [],
          note: {
            eyebrowKey: 'system_notice.release_notes.note_eyebrow',
            titleKey: 'system_notice.release_notes.note_title',
            bodyKey: 'system_notice.release_notes.note_body',
            promiseLabelKey: 'system_notice.release_notes.promise_label',
            promiseLeadKey: 'system_notice.release_notes.promise_lead',
            promiseTextKey: 'system_notice.release_notes.promise_text',
            bodyAfterKey: 'system_notice.release_notes.note_body_after',
            closingKey: 'system_notice.release_notes.note_closing',
          },
          supportLeadKey: 'system_notice.release_notes.support_lead',
          supportTextKey: 'system_notice.release_notes.support_text',
        },
      };
      server.use(
        http.get('/api/system-notices/active', () => HttpResponse.json([release])),
      );

      await useSystemNoticeStore.getState().fetch();

      const state = useSystemNoticeStore.getState();
      expect(state.loaded).toBe(true);
      expect(state.notices.map(n => n.id)).toEqual(['release-notes']);
      expect(state.notices[0].release?.version).toBe('4.3.0');
    });
  });
});
