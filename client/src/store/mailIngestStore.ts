import type { MailIngestCandidate, MailIngestInboxEntry, MailIngestSettingsResponse } from '@trek/shared';
import { create } from 'zustand';
import type { MailIngestAction } from '../api/mailIngest';
import { addListener, removeListener } from '../api/websocket';
import { mailIngestRepo } from '../repo/mailIngestRepo';
import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * The booking mail import as the person sees it: their settings and address,
 * and the inbox of bookings that wait for them. Online only on purpose: every
 * action asks the server to decide (which trip, whether it is a duplicate), so
 * there is nothing an offline copy could do. The pending count drives the badge
 * on the menu entry, on the desktop and on the phone alike.
 */
interface MailIngestState {
  settings: MailIngestSettingsResponse | null;
  entries: MailIngestInboxEntry[];
  nextBefore: number | null;
  pending: number;
  loadingInbox: boolean;
  loadSettings: () => Promise<void>;
  setSettings: (settings: MailIngestSettingsResponse) => void;
  loadCount: () => Promise<void>;
  loadInbox: (more?: boolean) => Promise<void>;
  /** Runs an action on an entry; the entry leaves the open list once it is decided. */
  act: (candidateId: number, action: MailIngestAction, body?: Record<string, unknown>) => Promise<MailIngestCandidate>;
}

const OPEN = new Set(['pending']);

export const useMailIngestStore = create<MailIngestState>((set, get) => ({
  settings: null,
  entries: [],
  nextBefore: null,
  pending: 0,
  loadingInbox: false,

  loadSettings: async () => {
    if (isEffectivelyOffline()) return;
    try {
      const settings = await mailIngestRepo.settings();
      set({ settings, pending: settings.pending });
    } catch {
      // Without an answer the menus keep what they showed; the next sign-in or event reads it again.
    }
  },

  setSettings: (settings) => set({ settings, pending: settings.pending }),

  loadCount: async () => {
    if (isEffectivelyOffline()) return;
    try {
      set({ pending: await mailIngestRepo.inboxCount() });
    } catch {
      // The badge keeps its last count until the next event brings a new one.
    }
  },

  loadInbox: async (more = false) => {
    if (isEffectivelyOffline() || get().loadingInbox) return;
    set({ loadingInbox: true });
    try {
      const before = more ? (get().nextBefore ?? undefined) : undefined;
      const { entries, pending, next_before } = await mailIngestRepo.inbox(before);
      set((state) => ({ entries: more ? [...state.entries, ...entries] : entries, pending, nextBefore: next_before }));
    } catch {
      // The inbox stays as it was; the next open reads it again.
    } finally {
      set({ loadingInbox: false });
    }
  },

  act: async (candidateId, action, body = {}) => {
    const candidate = await mailIngestRepo.act(candidateId, action, body);
    set((state) => {
      const stillOpen = OPEN.has(candidate.resolution);
      const entries = state.entries.flatMap((entry) =>
        entry.id !== candidate.id ? [entry] : stillOpen ? [{ ...entry, ...candidate }] : []
      );
      const removed = state.entries.length - entries.length;
      return { entries, pending: Math.max(0, state.pending - removed) };
    });
    return candidate;
  },
}));

/**
 * Keeps the inbox current while the app is open: the server says when the
 * person's open count changed (a mail read, an entry decided on another
 * device) and when their import settings did. The count moves at once; a
 * list already read is read again, so an open inbox shows the new entry
 * without a reload. Mounted once per signed-in shell (Navbar, MMailInboxHost).
 */
export function watchMailInbox(): () => void {
  const onEvent = (event: Record<string, unknown>) => {
    const store = useMailIngestStore.getState();
    if (event?.type === 'mailInbox:changed' && typeof event.pending === 'number') {
      useMailIngestStore.setState({ pending: event.pending });
      if (store.entries.length > 0 || event.pending > 0) void store.loadInbox();
    } else if (event?.type === 'mailInbox:settings') {
      void store.loadSettings();
    }
  };
  addListener(onEvent);
  return () => removeListener(onEvent);
}
