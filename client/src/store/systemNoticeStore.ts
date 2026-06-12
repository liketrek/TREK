import { create } from 'zustand';
import axios, { parseInDev } from '../api/client';
import { systemNoticeDtoSchema, type SystemNoticeDto } from '@trek/shared';

// The notice contract lives in @trek/shared (single source of truth, shared
// with the server). Keep the historical name as an alias so the existing
// SystemNoticeBanner/Modal consumers don't need to change their imports.
export type SystemNoticeDTO = SystemNoticeDto;

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
      const res = await axios.get('/system-notices/active');
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
