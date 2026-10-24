// FE-HOOK-DAYNOTEWRITE-001 to -005: the note draft and the note write the desktop
// note dialog and the phone note sheet share.
import { describe, expect, it, vi } from 'vitest';

import { buildDayNote } from '../../tests/helpers/factories';
import { dayNoteDraft, writeDayNote } from './useDayNotes';

function actions() {
  return {
    addDayNote: vi.fn(async () => buildDayNote()),
    updateDayNote: vi.fn(async () => buildDayNote()),
  };
}

describe('dayNoteDraft', () => {
  it('FE-HOOK-DAYNOTEWRITE-001: a new note starts blank with the default icon and no colour', () => {
    expect(dayNoteDraft()).toEqual({ text: '', time: '', icon: 'FileText', color: null });
    expect(dayNoteDraft(null)).toEqual({ text: '', time: '', icon: 'FileText', color: null });
  });

  it('FE-HOOK-DAYNOTEWRITE-002: an existing note fills the editor, missing parts as their defaults', () => {
    const note = buildDayNote({ text: 'Tickets', time: '09:30 kiosk', icon: 'Ticket', color: '#e11d48' });
    expect(dayNoteDraft(note)).toEqual({ text: 'Tickets', time: '09:30 kiosk', icon: 'Ticket', color: '#e11d48' });
    expect(dayNoteDraft(buildDayNote({ text: 'Plain', time: null, icon: null }))).toEqual({
      text: 'Plain',
      time: '',
      icon: 'FileText',
      color: null,
    });
  });
});

describe('writeDayNote', () => {
  it('FE-HOOK-DAYNOTEWRITE-003: a new note is added trimmed, at its place in the day, without a colour as null', async () => {
    const a = actions();
    await writeDayNote(
      a,
      4,
      9,
      { add: true, sortOrder: 3 },
      { text: '  Lunch  ', time: '', icon: '', color: undefined }
    );
    expect(a.addDayNote).toHaveBeenCalledWith(4, 9, {
      text: 'Lunch',
      time: null,
      icon: 'FileText',
      color: null,
      sort_order: 3,
    });
    expect(a.updateDayNote).not.toHaveBeenCalled();
  });

  it('FE-HOOK-DAYNOTEWRITE-004: an existing note is updated, and an undefined colour leaves it alone', async () => {
    const a = actions();
    await writeDayNote(a, 4, 9, { add: false, noteId: 12 }, { text: 'Museum', time: '10:00', icon: 'Landmark' });
    expect(a.updateDayNote).toHaveBeenCalledWith(4, 9, 12, {
      text: 'Museum',
      time: '10:00',
      icon: 'Landmark',
      color: undefined,
    });
    await writeDayNote(
      a,
      4,
      9,
      { add: false, noteId: 12 },
      { text: 'Museum', time: '', icon: 'Landmark', color: null }
    );
    expect(a.updateDayNote).toHaveBeenLastCalledWith(4, 9, 12, {
      text: 'Museum',
      time: null,
      icon: 'Landmark',
      color: null,
    });
    expect(a.addDayNote).not.toHaveBeenCalled();
  });

  it('FE-HOOK-DAYNOTEWRITE-005: a refused write throws for the editor to report', async () => {
    const a = actions();
    a.addDayNote.mockRejectedValueOnce(new Error('too long'));
    await expect(
      writeDayNote(a, 4, 9, { add: true }, { text: 'x', time: '', icon: 'FileText', color: null })
    ).rejects.toThrow('too long');
  });
});
