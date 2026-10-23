/**
 * The readers every card is built with: text masked when it comes from an
 * answer, cut to its bound, line breaks kept where a note needs them; ids,
 * clocks, moments, colours and stored file names read without trusting the
 * shape; people named from the trip card; reads named the same whatever the
 * key order of their arguments.
 */
import { buildTripCard } from '../../../../../src/nest/assistant/assistant-context';
import {
  argId,
  blockText,
  canonicalJson,
  clipped,
  clockOf,
  fileKeyOf,
  hexOrNull,
  idIn,
  instantOf,
  personOf,
  readKey,
} from '../../../../../src/nest/assistant/cards/card-values';

import { describe, expect, it } from 'vitest';

describe('card values', () => {
  it('ASTCVL-001: one line of text is masked, trimmed and cut', () => {
    expect(clipped('  Write to  anna@example.test\nsoon ', 80)).toBe('Write to [hidden] soon');
    expect(clipped('abcdef', 4)).toBe('abc…');
    expect(clipped('   ', 4)).toBeNull();
    expect(clipped(7, 4)).toBeNull();
  });

  it('ASTCVL-002: a longer text keeps its paragraphs, masked only when it comes from an answer', () => {
    const note = 'Bring  cash.\r\n\r\n\r\n\r\nAsk bob@example.test\t at the desk.  ';
    expect(blockText(note, 200, { mask: true })).toBe('Bring cash.\n\nAsk [hidden] at the desk.');
    expect(blockText(note, 200, { mask: false })).toBe('Bring cash.\n\nAsk bob@example.test at the desk.');
    expect(blockText('one\ntwo three', 8, { mask: false })).toBe('one\ntwo…');
    expect(blockText('\n \n', 8, { mask: false })).toBeNull();
    expect(blockText(null, 8, { mask: true })).toBeNull();
  });

  it('ASTCVL-003: ids are positive integers, read from an answer or the arguments', () => {
    expect(idIn({ place: { id: 4 } }, 'place')).toBe(4);
    expect(idIn({ place: { id: '4' } }, 'place')).toBeNull();
    expect(idIn(null, 'place')).toBeNull();
    expect(argId({ dayId: 3, noteId: 0, itemId: 1.5 }, 'dayId')).toBe(3);
    expect(argId({ noteId: 0 }, 'noteId')).toBeNull();
    expect(argId({ itemId: 1.5 }, 'itemId')).toBeNull();
  });

  it('ASTCVL-004: a clock is HH:MM, from a time or the time of a date and time as written', () => {
    expect(clockOf('9:30')).toBe('09:30');
    expect(clockOf('09:30:00')).toBe('09:30');
    expect(clockOf('2026-06-11T18:05:00+02:00')).toBe('18:05');
    expect(clockOf('2026-06-11 07:45')).toBe('07:45');
    expect(clockOf('24:00')).toBeNull();
    expect(clockOf('noon')).toBeNull();
  });

  it('ASTCVL-005: a moment needs its zone and is written in UTC to the second', () => {
    expect(instantOf('2026-06-11T18:05:30.250+02:00')).toBe('2026-06-11T16:05:30Z');
    expect(instantOf('2026-06-11T18:05Z')).toBe('2026-06-11T18:05:00Z');
    expect(instantOf('2026-06-11T18:05:00')).toBeNull();
    expect(instantOf('2026-06-11')).toBeNull();
    expect(instantOf(1_700_000_000)).toBeNull();
  });

  it('ASTCVL-006: a colour is #rrggbb, a stored file name comes only from one of TREK own upload paths', () => {
    expect(hexOrNull('#1a2B3c')).toBe('#1a2B3c');
    expect(hexOrNull('red')).toBeNull();
    expect(hexOrNull('#123')).toBeNull();
    expect(fileKeyOf('/uploads/avatars/a1b2-c3.png')).toBe('a1b2-c3.png');
    expect(fileKeyOf('/uploads/places/x.jpg?v=2')).toBeNull();
    expect(fileKeyOf('https://lh3.example.test/a.png')).toBeNull();
    expect(fileKeyOf('/uploads/avatars/../secret')).toBeNull();
    expect(fileKeyOf('/uploads/avatars/..hidden')).toBeNull();
    expect(fileKeyOf('a.png')).toBeNull();
  });

  it('ASTCVL-007: a person is a trip member by id, named as the trip names them', () => {
    const summary = {
      members: {
        owner: { id: 7, username: 'mia@example.test', avatar_url: '/uploads/avatars/mia.png' },
        collaborators: [{ id: 8, username: 'jon' }],
      },
    };
    const card = buildTripCard(1, 8, summary, null, null);
    expect(personOf(card, 7)).toEqual({ id: 7, name: '[hidden]', avatarKey: 'mia.png' });
    expect(personOf(card, 8)).toEqual({ id: 8, name: 'jon', avatarKey: null });
    expect(personOf(card, 9)).toBeNull();
  });

  it('ASTCVL-008: a read is named by its tool and its arguments, in any key order', () => {
    expect(canonicalJson({ b: [2, { d: 1, c: null }], a: 'x', skip: undefined })).toBe(
      '{"a":"x","b":[2,{"c":null,"d":1}]}',
    );
    expect(readKey('get_vacay_plan', { year: 2026, userId: 7 })).toBe(
      readKey('get_vacay_plan', { userId: 7, year: 2026 }),
    );
    expect(readKey('list_places')).toBe('list_places {}');
  });
});
