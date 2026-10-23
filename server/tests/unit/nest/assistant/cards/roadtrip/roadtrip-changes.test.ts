/**
 * The road trip's change cards: every via change drawn on its day (a via
 * added after its stop, a chain with the vias it clears, a move from where it
 * stands, a removal, vias pinned again), a Google Maps route's stops
 * appended, the driving settings from what is saved to what the call sets,
 * where a day ends, the way back from an added via, and the tool groups the
 * road trip loads with.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { ASSISTANT_TOOL_GROUPS } from '../../../../../../src/nest/assistant/assistant-tool-offer';
import type { PreviewContext, UndoSnapshot } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import {
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  TOOL_CARDS,
  undoReadsOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import { routeText } from '../../../../../../src/nest/assistant/cards/roadtrip/roadtrip-describe';
import { loadDayVias, type DayVias } from '../../../../../../src/nest/assistant/cards/roadtrip/roadtrip-route';
import { loadSavedSettings } from '../../../../../../src/nest/assistant/cards/roadtrip/roadtrip-rules';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import type { DayRouteCard, RoadtripRulesCard } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

const place = (id: number, name: string, lat: number, lng: number) => ({ id, name, lat, lng });
const card = buildTripCard(
  1,
  7,
  {
    trip: { title: 'Alps' },
    days: [
      {
        id: 31,
        day_number: 2,
        date: '2026-10-02',
        assignments: [
          { id: 301, place: place(1, 'Munich', 48.137, 11.575) },
          { id: 302, place: place(2, 'Garmisch', 47.49, 11.09) },
          { id: 303, place: place(3, 'Innsbruck', 47.26, 11.39) },
        ],
      },
    ],
  },
  { places: [place(9, 'Romantic Road track', 48.5, 10.5)] },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en', today: '2026-10-01', airport: () => null };
const vias: DayVias = {
  vias: [
    { id: 71, lat: 47.8, lng: 11.3, after: 0 },
    { id: 72, lat: 47.4, lng: 11.2, after: 1 },
  ],
};

const ROADTRIP_WRITES = [
  'add_route_via',
  'add_route_vias',
  'update_route_via',
  'remove_route_via',
  'reanchor_route_vias',
  'update_roadtrip_settings',
  'set_day_boundary',
  'import_google_maps_route',
  'create_transit_journey',
];

const preview = (tool: string, args: Record<string, unknown>, loaded: unknown = null) =>
  describeToolCall(tool, 'call_9', args, ctx, loaded);
const routeOf = (tool: string, args: Record<string, unknown>, loaded: unknown = null) =>
  preview(tool, args, loaded).card as DayRouteCard;

describe('via change cards', () => {
  it('ASTRT-020: a via added after its stop, on the day with its stops in order', () => {
    const shown = preview('add_route_via', { dayId: 31, after_order_index: 1, lat: 47.35, lng: 11.2 });
    expect(shown).toMatchObject({ verbKey: 'addRouteVia', subject: 'Garmisch', dayId: 31, undoable: true });
    expect(shown.rows.find((row) => row.labelKey === 'day')?.after).toContain('Oct');
    const route = shown.card as DayRouteCard;
    expect(route).toMatchObject({ kind: 'dayRoute', dayId: 31, dayNumber: 2, afterName: 'Garmisch', track: null });
    expect(route.stops.map((stop) => stop.name)).toEqual(['Munich', 'Garmisch', 'Innsbruck']);
    expect(route.vias).toEqual([{ lat: 47.35, lng: 11.2, after: 1, state: 'added', from: null }]);
  });

  it('ASTRT-021: a chain names its track and the vias of the legs it clears first', () => {
    const args = {
      dayId: 31,
      vias: [
        { after_order_index: 0, lat: 47.9, lng: 11.4 },
        { after_order_index: 0, lat: 47.7, lng: 11.2 },
      ],
      replace_legs: [0],
      track: { place_id: 9 },
    };
    const shown = preview('add_route_vias', args, vias);
    expect(shown.verbKey).toBe('shapeRoute');
    expect(shown.rows.find((row) => row.labelKey === 'quantity')?.after).toBe('2');
    const route = shown.card as DayRouteCard;
    expect(route).toMatchObject({ afterName: 'Munich', track: 'Romantic Road track' });
    expect(route.vias.map((via) => via.state)).toEqual(['added', 'added', 'removed']);
  });

  it('ASTRT-022: a move from where the via stands, a removal of a via the day has, vias pinned again', () => {
    const move = { dayId: 31, viaId: 72, lat: 47.3, lng: 11.25, after_order_index: 0 };
    const moved = routeOf('update_route_via', move, vias);
    expect(moved.vias).toEqual([{ lat: 47.3, lng: 11.25, after: 0, state: 'moved', from: [47.4, 11.2] }]);
    expect(moved.afterName).toBe('Munich');
    const shownMove = preview('update_route_via', { dayId: 31, viaId: 72, lat: 47.3, lng: 11.25 }, vias);
    expect(shownMove.rows.find((row) => row.labelKey === 'coordinates')).toMatchObject({
      before: '47.40000, 11.20000',
      after: '47.30000, 11.25000',
    });
    const gone = preview('remove_route_via', { dayId: 31, viaId: 71 }, vias);
    expect(gone.verbKey).toBe('removeRouteVia');
    expect((gone.card as DayRouteCard).vias).toEqual([
      { lat: 47.8, lng: 11.3, after: 0, state: 'removed', from: null },
    ]);
    expect(preview('remove_route_via', { dayId: 31, viaId: 99 }, vias).card).toBeUndefined();
    const repin = { dayId: 31, vias: [{ id: 71, after_order_index: 1 }], remove: [72] };
    const repinned = routeOf('reanchor_route_vias', repin, vias);
    expect(repinned.vias.map((via) => [via.state, via.after])).toEqual([
      ['repinned', 1],
      ['removed', 1],
    ]);
  });

  it('ASTRT-023: a move without the day read still shows where the via goes', () => {
    const moved = routeOf('update_route_via', { dayId: 31, viaId: 72, lat: 47.3, lng: 11.25 });
    expect(moved.vias).toEqual([{ lat: 47.3, lng: 11.25, after: 0, state: 'moved', from: null }]);
  });

  it('ASTRT-024: a Google Maps route appends its stops to the day', () => {
    const args = {
      dayId: 31,
      stops: [
        { name: 'Seefeld', lat: 47.33, lng: 11.19 },
        { name: 'Bolzano', lat: 46.5, lng: 11.35 },
      ],
    };
    const shown = preview('import_google_maps_route', args);
    expect(shown).toMatchObject({ verbKey: 'importRoute', subject: 'Seefeld → Bolzano', dayId: 31 });
    expect((shown.card as DayRouteCard).stops.map((stop) => [stop.name, stop.added])).toEqual([
      ['Munich', false],
      ['Garmisch', false],
      ['Innsbruck', false],
      ['Seefeld', true],
      ['Bolzano', true],
    ]);
    // The way back takes the visits it added, not the places.
    const result = { place_ids: [51, 52], assignment_ids: [41, 42] };
    const applied = appliedChange('import_google_maps_route', 'call_9', args, result, 31, null);
    expect(applied).toMatchObject({ entity: 'assignment', ids: [41, 42], dayId: 31 });
  });

  it('ASTRT-025: reads the day vias once, through the reader the turn hands in', async () => {
    const stored = { id: 71, day_id: 31, after_order_index: 0, sequence: 0, lat: 47.8, lng: 11.3 };
    const read = vi.fn(async () => ({ vias: [stored] }));
    expect(await loadDayVias({ dayId: 31 }, read)).toEqual({ vias: [{ id: 71, lat: 47.8, lng: 11.3, after: 0 }] });
    expect(read).toHaveBeenCalledWith('list_route_vias', { dayId: 31 });
    expect(await loadDayVias({}, read)).toBeNull();
    expect(await loadDayVias({ dayId: 31 }, async () => null)).toBeNull();
  });
});

describe('settings and day end cards', () => {
  it('ASTRT-026: the settings a call changes, each against what is saved', async () => {
    const saved = await loadSavedSettings({}, async () => ({
      tripId: 1,
      settings: { roadtrip_day_start: '08:00', roadtrip_hotel_bookends: false },
    }));
    const args = { settings: { roadtrip_day_start: '09:30', roadtrip_hotel_bookends: true, roadtrip_leg_minutes: 0 } };
    const shown = preview('update_roadtrip_settings', args, saved);
    expect(shown).toMatchObject({ verbKey: 'updateDriveSettings', subject: 'Alps' });
    expect((shown.card as RoadtripRulesCard).settings).toEqual([
      { key: 'roadtrip_day_start', before: '08:00', after: '09:30' },
      { key: 'roadtrip_hotel_bookends', before: false, after: true },
      { key: 'roadtrip_leg_minutes', before: null, after: 0 },
    ]);
    expect(shown.rows[0]).toMatchObject({ labelKey: 'field', field: 'roadtrip_day_start', before: '08:00' });
    const unread = preview('update_roadtrip_settings', args).card as RoadtripRulesCard;
    expect(unread.settings[0]).toEqual({ key: 'roadtrip_day_start', before: null, after: '09:30' });
  });

  it('ASTRT-027: a day that ends at a stop, part way along a drive, or automatically again', () => {
    const atStop = preview('set_day_boundary', {
      dayNumber: 2,
      boundary: { from_assignment_id: 302, to_assignment_id: null, fraction: 0 },
    });
    expect(atStop).toMatchObject({ verbKey: 'setDayBoundary', subject: 'Garmisch', dayId: 31 });
    expect(atStop.rows.map((row) => row.labelKey)).toEqual(['day']);
    expect((atStop.card as RoadtripRulesCard).dayEnd).toEqual({
      dayId: 31,
      dayNumber: 2,
      mode: 'stop',
      from: 'Garmisch',
      to: null,
      percent: null,
    });
    const along = preview('set_day_boundary', {
      dayNumber: 2,
      boundary: { from_assignment_id: 302, to_assignment_id: 303, fraction: 0.4 },
    }).card as RoadtripRulesCard;
    expect(along.dayEnd).toMatchObject({ mode: 'along', from: 'Garmisch', to: 'Innsbruck', percent: 40 });
    const auto = preview('set_day_boundary', { dayNumber: 2, boundary: null }).card as RoadtripRulesCard;
    expect(auto.dayEnd).toMatchObject({ mode: 'auto', from: null });
  });

  it('ASTRT-032: a route reads from its first name to its last, the arrow pointing the way they are written', () => {
    expect(routeText(['Seefeld', 'Innsbruck', 'Bolzano'])).toBe('Seefeld → Innsbruck → Bolzano');
    expect(routeText(['الرياض', 'جدة'])).toBe('الرياض ← جدة');
    expect(routeText(['(שדה תעופה) תל אביב', 'Haifa'])).toBe('(שדה תעופה) תל אביב ← Haifa');
    expect(routeText([])).toBe('');
  });

  it('ASTRT-028: every road trip change card is valid for a call without arguments', () => {
    logMock.logWarn.mockClear();
    for (const tool of ROADTRIP_WRITES) {
      expect(ASSISTANT_WRITE_TOOLS[tool], tool).toBeDefined();
      expect(() => describeToolCall(tool, 'call_0', {}, ctx, null), tool).not.toThrow();
    }
    expect(logMock.logWarn).not.toHaveBeenCalled();
  });
});

describe('undo and tool groups', () => {
  const made = { via: { id: 71, day_id: 31, after_order_index: 0, sequence: 0, lat: 47.8, lng: 11.3 } };
  const snapshot = (list: unknown): UndoSnapshot => ({
    summary: null,
    places: null,
    reads: new Map([[readKey('list_route_vias', { dayId: 31 }), list]]),
  });

  it('ASTRT-029: an added via goes back while it stands where it was put, and stays once moved', () => {
    const undo = ASSISTANT_UNDO_MAP.add_route_via;
    expect(undo.tool).toBe('remove_route_via');
    expect(undo.args({ dayId: 31 }, made, null)).toEqual({ dayId: 31, viaId: 71 });
    expect(undo.args({ dayId: 31 }, { via: {} }, null)).toBeNull();
    const reads = undoReadsOf('add_route_via', { dayId: 31 }, made);
    expect(reads).toEqual([{ tool: 'list_route_vias', args: { dayId: 31 } }]);
    const check = TOOL_CARDS.add_route_via?.undo;
    expect(check?.unchanged(made, snapshot({ vias: [made.via] }))).toBe(true);
    expect(check?.unchanged(made, snapshot({ vias: [{ ...made.via, lat: 47.9 }] }))).toBe(false);
    expect(check?.unchanged(made, snapshot({ vias: [] }))).toBe(false);
    expect(appliedChange('add_route_via', 'call_9', { dayId: 31 }, made, 31, null)).toMatchObject({
      entity: 'roadtrip',
      ids: [71],
      dayId: 31,
    });
  });

  it('ASTRT-030: the day endings and the Google Maps route load with the road trip, which tells the model about its cards', () => {
    expect(ASSISTANT_TOOL_GROUPS.roadtrip?.controllers).toEqual(
      expect.arrayContaining(['RoadtripPlanningMcp', 'DayBoundariesMcp', 'GoogleRouteMcp']),
    );
    expect(ASSISTANT_TOOL_GROUPS.tours?.controllers).not.toContain('GoogleRouteMcp');
    expect(CARD_PROMPT_LINES.some((line) => line.includes('calculate_roadtrip'))).toBe(true);
  });

  it('ASTRT-031: an imported Google Maps route names the day stops it created, as its receipt entity says', () => {
    const imported = { place_ids: [5, 6], assignment_ids: [301, 302], skipped: [] };
    expect(appliedChange('import_google_maps_route', 'call_9', { dayId: 31 }, imported, 31, null)).toMatchObject({
      entity: 'assignment',
      ids: [301, 302],
    });
    const broken = { place_ids: [5], assignment_ids: ['x', 0] };
    expect(appliedChange('import_google_maps_route', 'call_9', { dayId: 31 }, broken, 31, null)).toMatchObject({
      ids: [],
    });
  });
});
