/**
 * P6, P7: the server's own tour steps as the model is told of them, a found
 * place taken into a tour, a route file read and a track of it taken in,
 * through the note the history replays in place of a call.
 */
import { serverStepsNote } from '../../../../src/nest/assistant/assistant-history';
import {
  ADD_FOUND_PLACE_TOOL,
  ASSISTANT_SERVER_TOOLS,
  IMPORT_TOUR_FILE_TOOL,
  READ_TOUR_FILE_TOOL,
} from '../../../../src/nest/assistant/assistant-tools.constants';
import type { AssistantMessagePart } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// AST-HISTORY-TOURS-001 to AST-HISTORY-TOURS-004

type Call = Extract<AssistantMessagePart, { type: 'tool-call' }>;

const call = (toolName: string, args: Record<string, unknown>, over: Partial<Call> = {}): Call => ({
  type: 'tool-call',
  toolCallId: 'c1',
  toolName,
  args,
  ...over,
});

describe('the tour steps the model is told of', () => {
  it('AST-HISTORY-TOURS-001: the route file steps are the server own, never replayed as calls', () => {
    expect(ASSISTANT_SERVER_TOOLS.has(READ_TOUR_FILE_TOOL)).toBe(true);
    expect(ASSISTANT_SERVER_TOOLS.has(IMPORT_TOUR_FILE_TOOL)).toBe(true);
  });

  it('AST-HISTORY-TOURS-002: a found place taken into a tour, as it waits and once decided', () => {
    const args = { via: 'insert_tour_stop', placeId: 64, stop: { name: 'Spring' }, tourName: 'Herzogstand' };
    expect(serverStepsNote([call(ADD_FOUND_PLACE_TOOL, args, { approval: { id: 'c1' } })])).toBe(
      'The user picked "Spring" as a stop of the tour "Herzogstand" from the search results; it waits for them to add or discard it.',
    );
    expect(serverStepsNote([call(ADD_FOUND_PLACE_TOOL, args, { approval: { id: 'c1', approved: true } })])).toBe(
      '"Spring" as a stop of the tour "Herzogstand" was added.',
    );
    expect(serverStepsNote([call(ADD_FOUND_PLACE_TOOL, args, { approval: { id: 'c1', approved: false } })])).toBe(
      'The user discarded "Spring" as a stop of the tour "Herzogstand".',
    );
  });

  it('AST-HISTORY-TOURS-003: a route file read, with its tracks, without any, or not at all', () => {
    const tracks = [{ name: 'Saturday', distance_km: 8.2, points: 120, has_heights: true }];
    expect(serverStepsNote([call(READ_TOUR_FILE_TOOL, { name: 'weekend.gpx' }, { result: { tracks } })])).toBe(
      `TREK read the attached route file "weekend.gpx" and found 1 track(s): ${JSON.stringify(tracks)}.`,
    );
    expect(serverStepsNote([call(READ_TOUR_FILE_TOOL, { name: 'pins.kml' }, { result: { tracks: [] } })])).toBe(
      'TREK read the attached route file "pins.kml" and found no track or route in it.',
    );
    expect(serverStepsNote([call(READ_TOUR_FILE_TOOL, { name: 'x.kmz' }, { isError: true })])).toBe(
      'TREK could not read the attached route file "x.kmz".',
    );
  });

  it('AST-HISTORY-TOURS-004: a track taken in as a hike, or not', () => {
    const args = { via: 'import_tour_gpx', file_name: 'weekend.gpx', track_name: 'Saturday', tour_type: 'hike' };
    expect(serverStepsNote([call(IMPORT_TOUR_FILE_TOOL, args, { approval: { id: 'c1', approved: true } })])).toBe(
      'The track "Saturday" of "weekend.gpx" was taken in as a hike.',
    );
    expect(
      serverStepsNote([call(IMPORT_TOUR_FILE_TOOL, args, { approval: { id: 'c1', approved: true }, isError: true })]),
    ).toBe('The track "Saturday" of "weekend.gpx" could not be taken in as a hike.');
    expect(
      serverStepsNote([call(IMPORT_TOUR_FILE_TOOL, args, { approval: { id: 'c1', resolution: 'cancelled' } })]),
    ).toBe('The track "Saturday" of "weekend.gpx" was not taken in as a hike; the user moved on without deciding.');
    expect(serverStepsNote([call(IMPORT_TOUR_FILE_TOOL, args, { approval: { id: 'c1' } })])).toBe(
      'The track "Saturday" of "weekend.gpx" waits for the user to take it in as a hike or discard it.',
    );
  });
});
