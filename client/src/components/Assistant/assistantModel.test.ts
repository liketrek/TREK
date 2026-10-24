/**
 * FE-AI-MODEL-001 to FE-AI-MODEL-012
 *
 * The pure half of the assistant's views: how a stored message reaches
 * @assistant-ui, what each error offers, how a reading tool is named while it
 * runs and once it says where it looks, and which questions the empty chat
 * suggests.
 */
import { ASSISTANT_ERROR_CODES, type AssistantMessage } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { errorView, liveStepText, suggestionsFor, toolStepKey, toThreadMessage, tripPhase } from './assistantModel';

const AT = '2026-10-21T08:00:00.000Z';

describe('toThreadMessage', () => {
  it('FE-AI-MODEL-001: passes text, tool calls with their approval and TREK data parts through, and drops empty text', () => {
    const message: AssistantMessage = {
      id: 'm1',
      role: 'assistant',
      status: 'awaiting_approval',
      createdAt: AT,
      parts: [
        { type: 'text', text: '' },
        { type: 'text', text: 'Adding it.' },
        {
          type: 'tool-call',
          toolCallId: 'c1',
          toolName: 'create_todo',
          args: { name: 'Tickets' },
          approval: { id: 'c1' },
        },
        { type: 'tool-call', toolCallId: 'r1', toolName: 'list_todos', args: {}, result: [], isError: false },
        {
          type: 'data-trek-applied',
          data: { toolCallId: 'c0', entity: 'todo', ids: [1], dayId: null, undoUntil: null },
        },
      ],
    };
    const like = toThreadMessage(message);
    expect(like).toEqual({
      id: 'm1',
      role: 'assistant',
      createdAt: new Date(AT),
      content: [
        { type: 'text', text: 'Adding it.' },
        {
          type: 'tool-call',
          toolCallId: 'c1',
          toolName: 'create_todo',
          args: { name: 'Tickets' },
          approval: { id: 'c1' },
        },
        { type: 'tool-call', toolCallId: 'r1', toolName: 'list_todos', args: {}, result: [], isError: false },
        {
          type: 'data-trek-applied',
          data: { toolCallId: 'c0', entity: 'todo', ids: [1], dayId: null, undoUntil: null },
        },
      ],
    });
    // Complete and waiting messages leave the status to the runtime.
    expect(like).not.toHaveProperty('status');
  });

  it('FE-AI-MODEL-002: a stopped or failed message says so', () => {
    const base: AssistantMessage = { id: 'm', role: 'assistant', parts: [], status: 'aborted', createdAt: AT };
    expect(toThreadMessage(base).status).toEqual({ type: 'incomplete', reason: 'cancelled' });
    expect(toThreadMessage({ ...base, status: 'error' }).status).toEqual({ type: 'incomplete', reason: 'error' });
  });
});

describe('errorView', () => {
  it('FE-AI-MODEL-003: every error code has a line, and at most one action', () => {
    for (const code of ASSISTANT_ERROR_CODES) {
      const view = errorView(code, { canConnectOwn: true });
      expect(view.messageKey).toMatch(/^assistant\.error\./);
      if (view.action) expect(view.action.labelKey).toMatch(/^assistant\.errorAction\./);
    }
    expect(errorView('busy', { canConnectOwn: true }).action?.kind).toBe('continueHere');
    expect(errorView('provider_unavailable', { canConnectOwn: true })).toMatchObject({
      messageKey: 'assistant.error.providerDown',
      action: { kind: 'retry' },
    });
    expect(errorView('usage_limit', { canConnectOwn: true }).action?.kind).toBe('openUsage');
    expect(errorView('offline', { canConnectOwn: true }).action).toBeNull();
  });

  it('FE-AI-MODEL-004: the daily limit offers an own provider only where the policy allows one', () => {
    expect(errorView('daily_limit', { canConnectOwn: true }).action).toEqual({
      kind: 'openSettings',
      labelKey: 'assistant.errorAction.connectOwn',
    });
    expect(errorView('daily_limit', { canConnectOwn: false }).action).toBeNull();
  });

  it('FE-AI-MODEL-008: a provider limit names the provider when known, else keeps the general line', () => {
    expect(errorView('rate_limited', { canConnectOwn: true, provider: 'Mistral' }).messageKey).toBe(
      'assistant.error.providerLimit'
    );
    expect(errorView('usage_limit', { canConnectOwn: true, provider: 'ChatGPT' })).toMatchObject({
      messageKey: 'assistant.error.providerLimit',
      action: { kind: 'openUsage' },
    });
    expect(errorView('rate_limited', { canConnectOwn: true, provider: '' }).messageKey).toBe(
      'assistant.error.rateLimited'
    );
    expect(errorView('usage_limit', { canConnectOwn: true }).messageKey).toBe('assistant.error.usageLimit');
    expect(errorView('generic', { canConnectOwn: true, provider: 'Mistral' }).messageKey).toBe(
      'assistant.error.generic'
    );
    // TREK's own limit never blames the provider.
    expect(errorView('too_many_requests', { canConnectOwn: true, provider: 'OpenRouter' }).messageKey).toBe(
      'assistant.error.rateLimited'
    );
  });

  it('FE-AI-MODEL-009: waiting changes ask for a decision first, with nothing to press', () => {
    expect(errorView('decide_first', { canConnectOwn: true })).toEqual({
      messageKey: 'assistant.error.decideFirst',
      action: null,
    });
  });
});

describe('toolStepKey', () => {
  it('FE-AI-MODEL-005: names reading tools by what they do, and anything else as working', () => {
    expect(toolStepKey('get_trip_summary')).toBe('assistant.step.reading');
    expect(toolStepKey('search_nearby_places')).toBe('assistant.step.nearby');
    expect(toolStepKey('get_settlement_summary')).toBe('assistant.step.costs');
    expect(toolStepKey('create_place')).toBe('assistant.step.working');
    expect(toolStepKey('constructor')).toBe('assistant.step.working');
  });

  it('FE-AI-MODEL-011: names the expense, share, wind, track and Dawarich reads by what they look at', () => {
    expect(
      [
        'list_budget_items',
        'get_budget_per_person',
        'get_wind_forecast',
        'get_journey_tracks',
        'scan_bucket_list_visits',
        'suggest_atlas_countries',
      ].map(toolStepKey)
    ).toEqual([
      'assistant.step.expenses',
      'assistant.step.shares',
      'assistant.step.wind',
      'assistant.step.tracks',
      'assistant.step.bucketScan',
      'assistant.step.atlasCountries',
    ]);
  });

  it('FE-AI-MODEL-010: a running step that names a place or a query says it, and falls back to its name', () => {
    expect(liveStepText('search_nearby_places', 'Trastevere')).toEqual({
      key: 'assistant.step.nearbyAt',
      params: { place: 'Trastevere' },
    });
    expect(liveStepText('search_pois', 'Shibuya')).toEqual({
      key: 'assistant.step.nearbyAt',
      params: { place: 'Shibuya' },
    });
    expect(liveStepText('search_place', 'gelato')).toEqual({
      key: 'assistant.step.searchingFor',
      params: { query: 'gelato' },
    });
    expect(liveStepText('get_weather', 'Kyoto')).toEqual({
      key: 'assistant.step.weatherAt',
      params: { place: 'Kyoto' },
    });
    expect(liveStepText('search_nearby_places', null)).toEqual({ key: 'assistant.step.nearby' });
    expect(liveStepText('list_places', 'Kyoto')).toEqual({ key: 'assistant.step.reading' });
  });

  it('FE-AI-MODEL-012: a hike being planned says so, and names its goal once the step names one', () => {
    expect(toolStepKey('propose_hike')).toBe('assistant.step.planningHike');
    expect(liveStepText('propose_hike', 'Herzogstand')).toEqual({
      key: 'assistant.step.planningHikeTo',
      params: { place: 'Herzogstand' },
    });
    expect(liveStepText('propose_hike', null)).toEqual({ key: 'assistant.step.planningHike' });
  });
});

describe('suggestions', () => {
  it('FE-AI-MODEL-006: the phase follows the dates and whether anything is planned', () => {
    const today = '2026-06-12';
    expect(tripPhase({ startDate: null, endDate: null, hasPlaces: false, today })).toBe('empty');
    expect(tripPhase({ startDate: '2026-07-01', endDate: '2026-07-05', hasPlaces: true, today })).toBe('upcoming');
    expect(tripPhase({ startDate: '2026-06-10', endDate: '2026-06-14', hasPlaces: false, today })).toBe('running');
    expect(tripPhase({ startDate: '2026-06-12', endDate: null, hasPlaces: true, today })).toBe('running');
    expect(tripPhase({ startDate: '2026-06-01', endDate: '2026-06-11', hasPlaces: true, today })).toBe('past');
  });

  it('FE-AI-MODEL-007: focus comes first, at most four, and nothing that writes for someone who may only read', () => {
    const focused = suggestionsFor({ phase: 'upcoming', canEdit: true, place: 'Kinkaku-ji', day: 'Fri 12 Jun' });
    expect(focused.map((s) => s.id)).toEqual(['nearPlace', 'placeTips', 'planDay', 'dayTooFull']);
    expect(focused[0]?.params).toEqual({ place: 'Kinkaku-ji' });

    const readOnly = suggestionsFor({ phase: 'empty', canEdit: false, day: 'Fri 12 Jun' });
    expect(readOnly.map((s) => s.id)).toEqual(['dayTooFull', 'mustSee', 'weather']);
    expect(readOnly.every((s) => !s.writes)).toBe(true);

    expect(suggestionsFor({ phase: 'past', canEdit: true }).map((s) => s.labelKey)).toEqual([
      'assistant.suggest.settleUp',
      'assistant.suggest.recap',
    ]);
  });
});
