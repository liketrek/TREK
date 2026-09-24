import { create } from 'zustand';
import axios, { parseInDev } from '../api/client';
import { systemNoticeDtoSchema, type SystemNoticeDto } from '@trek/shared';

// The notice contract lives in @trek/shared (single source of truth, shared
// with the server). Keep the historical name as an alias so the existing
// SystemNoticeBanner/Modal consumers don't need to change their imports.
export type SystemNoticeDTO = SystemNoticeDto;

// Baked in by `define` in vite.config.js; a build without it (a bare tsc run) sends
// nothing and therefore gets no release notice, which is the safe side.
const UI_VERSION: string = typeof __TREK_UI_VERSION__ === 'string' ? __TREK_UI_VERSION__ : '';

interface SystemNoticeState {
  notices: SystemNoticeDTO[];
  loaded: boolean;
  fetching: boolean;
  fetch: () => Promise<void>;
  dismiss: (id: string) => void;
  reset: () => void;
}

export const useSystemNoticeStore = create<SystemNoticeState>()((set, get) => ({
  notices: [],
  loaded: false,
  fetching: false,

  async fetch() {
    if (get().fetching || get().loaded) return;
    set({ fetching: true });
    try {
      // Names the layouts this bundle can draw and the version it was built as. The
      // server hands the release notice only to a bundle that can draw it AND was
      // built for the version the server runs: after an update the service worker
      // serves the previous bundle until the new one is installed, and that bundle
      // would draw the release notice as bare keys or with its own older texts, and
      // let the reader dismiss it for good. It gets the notice after the reload,
      // from this very line.
      const res = await axios.get('/system-notices/active', { params: { supports: 'release', ui: UI_VERSION } });
      const notices = parseInDev(systemNoticeDtoSchema.array(), res.data, 'systemNotices.fetch');
      set({ notices, loaded: true, fetching: false });
    } catch (err) {
      // Notices are non-critical. Fail silently; set loaded so UI doesn't hang.
      console.warn('[systemNotices] failed to fetch:', err);
      set({ loaded: true, fetching: false });
    }
  },

  reset() {
    set({ notices: [], loaded: false, fetching: false });
  },

  dismiss(id: string) {
    // Optimistic: remove immediately
    const prev = get().notices;
    set({ notices: prev.filter(n => n.id !== id) });

    // POST in background; retry once on error
    const post = () => axios.post(`/system-notices/${id}/dismiss`);
    post().catch(() => {
      setTimeout(() => {
        post().catch(e => console.warn('[systemNotices] dismiss failed:', e));
      }, 2000);
    });
  },
}));
