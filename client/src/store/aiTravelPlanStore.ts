import type {
  TravelPlan,
  TravelPlanApplyRequest,
  TravelPlanApplyResponse,
  TravelPlanCreateRequest,
  TravelPlanDiscardRequest,
  TravelPlanRevisionRequest,
  TravelPlanUndoRequest,
  TravelPlanUndoResponse,
} from '@trek/shared';
import { create } from 'zustand';
import { aiTravelPlanApi } from '../api/aiTravelPlan';

/** Which request the page is waiting on; the page disables every control while one runs. */
export type AiTravelPlanPending =
  'loading' | 'creating' | 'revising' | 'recalculating' | 'applying' | 'undoing' | 'discarding' | null;

/**
 * The AI travel plan the page is working on.
 *
 * Deliberately in memory and not persisted: a draft is a proposal the server
 * owns, and it must never enter the offline mutation queue. Every call here is
 * a direct request whose failure is shown and retried by the traveller, never
 * a queued write that could be replayed later against a revision they have not
 * seen. A page reload restores the plan through `?plan=<id>` (see
 * `useAiTravelPlan`), which is also the only id the client keeps.
 */
interface AiTravelPlanState {
  plan: TravelPlan | null;
  pending: AiTravelPlanPending;
  setPlan: (plan: TravelPlan | null) => void;
  create: (request: TravelPlanCreateRequest) => Promise<TravelPlan>;
  load: (id: number) => Promise<TravelPlan>;
  revise: (id: number, request: TravelPlanRevisionRequest) => Promise<TravelPlan>;
  recalculate: (id: number) => Promise<TravelPlan>;
  apply: (id: number, request: TravelPlanApplyRequest, idempotencyKey: string) => Promise<TravelPlanApplyResponse>;
  undo: (id: number, request?: TravelPlanUndoRequest) => Promise<TravelPlanUndoResponse>;
  discard: (id: number, request?: TravelPlanDiscardRequest) => Promise<TravelPlan>;
  reset: () => void;
}

export const useAiTravelPlanStore = create<AiTravelPlanState>((set) => ({
  plan: null,
  pending: null,

  setPlan: (plan) => set({ plan }),

  create: async (request) => {
    set({ pending: 'creating' });
    try {
      const { plan } = await aiTravelPlanApi.create(request);
      set({ plan });
      return plan;
    } finally {
      set({ pending: null });
    }
  },

  load: async (id) => {
    set({ pending: 'loading' });
    try {
      const { plan } = await aiTravelPlanApi.get(id);
      set({ plan });
      return plan;
    } finally {
      set({ pending: null });
    }
  },

  revise: async (id, request) => {
    set({ pending: 'revising' });
    try {
      const { plan } = await aiTravelPlanApi.revise(id, request);
      set({ plan });
      return plan;
    } finally {
      set({ pending: null });
    }
  },

  recalculate: async (id) => {
    set({ pending: 'recalculating' });
    try {
      const { plan } = await aiTravelPlanApi.recalculate(id);
      set({ plan });
      return plan;
    } finally {
      set({ pending: null });
    }
  },

  apply: async (id, request, idempotencyKey) => {
    set({ pending: 'applying' });
    try {
      const response = await aiTravelPlanApi.apply(id, request, idempotencyKey);
      set({ plan: response.plan });
      return response;
    } finally {
      set({ pending: null });
    }
  },

  undo: async (id, request = {}) => {
    set({ pending: 'undoing' });
    try {
      const response = await aiTravelPlanApi.undo(id, request);
      set({ plan: response.plan });
      return response;
    } finally {
      set({ pending: null });
    }
  },

  discard: async (id, request = {}) => {
    set({ pending: 'discarding' });
    try {
      const { plan } = await aiTravelPlanApi.discard(id, request);
      set({ plan });
      return plan;
    } finally {
      set({ pending: null });
    }
  },

  reset: () => set({ plan: null, pending: null }),
}));
