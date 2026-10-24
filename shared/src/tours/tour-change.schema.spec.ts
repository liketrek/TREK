import {
  TOUR_CHANGE_MAX,
  TOUR_CHANGE_OPS,
  tourChangeRequestSchema,
  tourChangeSaveRequestSchema,
  tourChangeSchema,
  tourChangeUndoRequestSchema,
} from './tour-change.schema';

import { describe, expect, it } from 'vitest';

const cafe = { lat: 48.1, lng: 11.5, name: 'Cafe', stay_minutes: 20 };

describe('a change to a saved tour prepared for review (MCP-T02)', () => {
  it('takes an add, a remove, a replace and a move, each naming its stations by key', () => {
    expect(tourChangeSchema.options.map((option) => option.shape.op.value)).toEqual([...TOUR_CHANGE_OPS]);
    const changes = [
      { op: 'add', station: cafe, after_key: 'stop-gate' },
      { op: 'remove', key: 'stop-park' },
      { op: 'replace', key: 'stop-museum', station: { ...cafe, opening_hours: 'Mo-Su 08:00-18:00' } },
      { op: 'move', key: 'stop-market', after_key: 'stop-gate' },
    ];
    expect(tourChangeRequestSchema.parse({ changes })).toEqual({ changes });
  });

  it('refuses a change it does not know, a key that is no key, a field a change does not carry and too many changes', () => {
    const refused = [
      { changes: [] },
      { changes: [{ op: 'rename', key: 'stop-gate' }] },
      { changes: [{ op: 'remove', key: 'x' }] },
      { changes: [{ op: 'remove', key: 'stop-gate', after_key: 'stop-park' }] },
      { changes: [{ op: 'add', station: cafe }] },
      { changes: [{ op: 'add', station: { ...cafe, key: 'stop-new1' }, after_key: 'stop-gate' }] },
      { changes: [{ op: 'add', station: { ...cafe, lat: 91 }, after_key: 'stop-gate' }] },
      { changes: [{ op: 'move', key: 'stop-gate' }] },
      { changes: [{ op: 'remove', key: 'stop-gate' }], save: true },
      { changes: Array.from({ length: TOUR_CHANGE_MAX + 1 }, () => ({ op: 'remove', key: 'stop-gate' })) },
    ];
    for (const body of refused) {
      expect(tourChangeRequestSchema.safeParse(body).success, JSON.stringify(body)).toBe(false);
    }
  });
});

describe('a prepared change the traveller confirmed, sent to be saved (MCP-T03)', () => {
  const save = {
    changes: [{ op: 'remove', key: 'stop-park' }],
    expected_revision: 3,
    proposal_id: '0123456789abcdef0123456789abcdef',
    confirmed: true,
  };

  it('takes the changes with the revision and the proposal they were prepared as, and the yes', () => {
    expect(tourChangeSaveRequestSchema.parse(save)).toEqual(save);
  });

  it('refuses a save without the yes, without the revision, of no proposal, or with anything more', () => {
    const refused = [
      { ...save, confirmed: false },
      { ...save, confirmed: undefined },
      { ...save, expected_revision: undefined },
      { ...save, expected_revision: 0 },
      { ...save, proposal_id: 'not-a-proposal' },
      { ...save, proposal_id: '0123456789ABCDEF0123456789ABCDEF' },
      { ...save, note: 'the traveller said so in the chat' },
      { ...save, changes: [] },
    ];
    for (const body of refused) {
      expect(tourChangeSaveRequestSchema.safeParse(body).success, JSON.stringify(body)).toBe(false);
    }
  });
});

describe('a saved step the traveller confirmed to take back (MCP-T04)', () => {
  const undo = { step_id: 7, expected_revision: 4, confirmed: true };

  it('points the revision at the field prepare_tour_undo really returns', () => {
    const field = tourChangeUndoRequestSchema.shape.expected_revision;
    expect(field.description).toContain('undo.expected_revision of prepare_tour_undo');
  });

  it('takes the step, the revision it was shown at and the yes', () => {
    expect(tourChangeUndoRequestSchema.parse(undo)).toEqual(undo);
  });

  it('refuses an undo without the yes, without the revision, of no step, or with anything more', () => {
    const refused = [
      { ...undo, confirmed: false },
      { ...undo, confirmed: undefined },
      { ...undo, expected_revision: undefined },
      { ...undo, expected_revision: 0 },
      { ...undo, step_id: 0 },
      { ...undo, step_id: 1.5 },
      { ...undo, before_state: { waypoints: [] } },
    ];
    for (const body of refused) {
      expect(tourChangeUndoRequestSchema.safeParse(body).success, JSON.stringify(body)).toBe(false);
    }
  });
});
