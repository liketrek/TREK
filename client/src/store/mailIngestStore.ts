import {
  mailIngestCandidateResponseSchema,
  mailIngestInboxCountResponseSchema,
  mailIngestInboxResponseSchema,
  mailIngestSettingsResponseSchema,
  type MailIngestCandidate,
  type MailIngestInboxEntry,
  type MailIngestSettingsResponse,
} from '@trek/shared';
import { create } from 'zustand';
import { mailIngestApi, type MailIngestAction } from '../api/mailIngest';
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
    const parsed = mailIngestSettingsResponseSchema.safeParse(await mailIngestApi.settings().catch(() => null));
    if (parsed.success) set({ settings: parsed.data, pending: parsed.data.pending });
  },

  setSettings: (settings) => set({ settings, pending: settings.pending }),

  loadCount: async () => {
    if (isEffectivelyOffline()) return;
    const parsed = mailIngestInboxCountResponseSchema.safeParse(await mailIngestApi.inboxCount().catch(() => null));
    if (parsed.success) set({ pending: parsed.data.pending });
  },

  loadInbox: async (more = false) => {
    if (isEffectivelyOffline() || get().loadingInbox) return;
    set({ loadingInbox: true });
    try {
      const before = more ? (get().nextBefore ?? undefined) : undefined;
      const parsed = mailIngestInboxResponseSchema.safeParse(await mailIngestApi.inbox({ status: 'open', before }));
      if (!parsed.success) return;
      const { entries, pending, next_before } = parsed.data;
      set((state) => ({ entries: more ? [...state.entries, ...entries] : entries, pending, nextBefore: next_before }));
    } catch {
      // The inbox stays as it was; the next open reads it again.
    } finally {
      set({ loadingInbox: false });
    }
  },

  act: async (candidateId, action, body = {}) => {
    const { candidate } = mailIngestCandidateResponseSchema.parse(await mailIngestApi.act(candidateId, action, body));
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
