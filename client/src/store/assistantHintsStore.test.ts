/**
 * FE-AI-HINTSTORE-001 to FE-AI-HINTSTORE-004
 *
 * What one person did with the plan hints of a trip: dismissed and seen ids,
 * kept in the browser's storage per trip, and still working without it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAssistantHintsStore } from './assistantHintsStore';

const INITIAL = useAssistantHintsStore.getState();
const KEY = 'trek:assistant-hints:7';

beforeEach(() => {
  window.localStorage.clear();
  useAssistantHintsStore.setState(INITIAL, true);
});

afterEach(() => vi.restoreAllMocks());

describe('assistantHintsStore', () => {
  it('FE-AI-HINTSTORE-001: keeps dismissed and seen ids per trip, each once, and writes them to storage', () => {
    const { dismiss, markSeen } = useAssistantHintsStore.getState();
    dismiss(7, 'gap:1:600-780');
    dismiss(7, 'gap:1:600-780');
    markSeen(7, ['overlap:1:a', 'overlap:1:a', 'closed:2:p3']);
    expect(useAssistantHintsStore.getState().byTrip[7]).toEqual({
      dismissed: ['gap:1:600-780'],
      seen: ['overlap:1:a', 'closed:2:p3'],
    });
    expect(useAssistantHintsStore.getState().byTrip[8]).toBeUndefined();
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? 'null')).toEqual({
      dismissed: ['gap:1:600-780'],
      seen: ['overlap:1:a', 'closed:2:p3'],
    });
  });

  it('FE-AI-HINTSTORE-002: reads a trip back from storage on load, and drops what is not an id', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ dismissed: ['a', 3, null], seen: 'nope' }));
    useAssistantHintsStore.getState().load(7);
    expect(useAssistantHintsStore.getState().byTrip[7]).toEqual({ dismissed: ['a'], seen: [] });

    window.localStorage.setItem('trek:assistant-hints:9', '{not json');
    useAssistantHintsStore.getState().load(9);
    expect(useAssistantHintsStore.getState().byTrip[9]).toEqual({ dismissed: [], seen: [] });
  });

  it('FE-AI-HINTSTORE-003: keeps only the most recent hundred ids of a list', () => {
    const ids = Array.from({ length: 105 }, (_, i) => `gap:1:${i}`);
    useAssistantHintsStore.getState().markSeen(7, ids);
    const { seen } = useAssistantHintsStore.getState().byTrip[7];
    expect(seen).toHaveLength(100);
    expect(seen[0]).toBe('gap:1:5');
  });

  it('FE-AI-HINTSTORE-004: works on without storage, for as long as the page is up', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    useAssistantHintsStore.getState().dismiss(7, 'noStay:2:1');
    expect(useAssistantHintsStore.getState().byTrip[7]).toEqual({ dismissed: ['noStay:2:1'], seen: [] });
  });
});
