// FE-PLANNER-PLACEACT-001 to -015: the place writes behind both the desktop
// inspector and the phone place sheet.
import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAssignment, buildPlace } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { assignmentsApi } from '../../api/client';
import { useTripStore } from '../../store/tripStore';
import {
  participantsWith,
  participantsWithout,
  placeActions,
  splitParticipants,
  usePlaceFileUpload,
} from './usePlaceActions';

vi.mock('../../utils/convertHeic', () => ({
  normalizeImageFile: vi.fn(async (file: File) => new File([file], `normalized-${file.name}`)),
}));

const MEMBERS = [{ id: 1 }, { id: 2 }, { id: 3 }];
const t = (key: string) => `t:${key}`;

/** A change event over a file input, the shape both shells' handlers read. */
function pick(files: File[]) {
  const target = { files, value: 'C:\\fakepath\\picked' };
  return { event: { target } as unknown as ChangeEvent<HTMLInputElement>, target };
}

function deps() {
  return {
    tripId: 7,
    tripActions: { ratePlace: vi.fn(async () => buildPlace()), updatePlace: vi.fn(async () => buildPlace()) },
    toast: { error: vi.fn() },
    t,
  };
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
});
afterEach(() => vi.restoreAllMocks());

describe('participant lists', () => {
  it('FE-PLANNER-PLACEACT-001: nobody set means every member joins and nobody is left to add', () => {
    expect(splitParticipants(MEMBERS, [], true)).toEqual({ activeMembers: MEMBERS, availableMembers: [] });
    expect(splitParticipants(MEMBERS, [2], false)).toEqual({
      activeMembers: [{ id: 2 }],
      availableMembers: [{ id: 1 }, { id: 3 }],
    });
  });

  it('FE-PLANNER-PLACEACT-002: taking one off keeps the others, and the whole trip again is stored as nobody', () => {
    expect(participantsWithout(MEMBERS, [], true, 2)).toEqual([1, 3]);
    expect(participantsWithout(MEMBERS, [1, 2], false, 2)).toEqual([1]);
    // A stale id leaves exactly the trip's members behind, which is everyone again.
    expect(participantsWithout(MEMBERS, [1, 2, 3, 99], false, 99)).toEqual([]);
  });

  it('FE-PLANNER-PLACEACT-003: adding the last missing member stores nobody, any other add appends', () => {
    expect(participantsWith(MEMBERS, [1], 3)).toEqual([1, 3]);
    expect(participantsWith(MEMBERS, [1, 2], 3)).toEqual([]);
  });
});

describe('placeActions', () => {
  it('FE-PLANNER-PLACEACT-004: setParticipants writes the answer back into that day only', async () => {
    const spy = vi.spyOn(assignmentsApi, 'setParticipants').mockResolvedValue({ participants: [{ user_id: 2 }] });
    useTripStore.setState({
      assignments: {
        '4': [buildAssignment({ id: 10, day_id: 4 }), buildAssignment({ id: 11, day_id: 4 })],
        '5': [buildAssignment({ id: 12, day_id: 5 })],
      },
    } as never);
    const d = deps();

    await placeActions(d).setParticipants(10, 4, [2]);

    expect(spy).toHaveBeenCalledWith(7, 10, [2]);
    const { assignments } = useTripStore.getState();
    expect(assignments['4'][0].participants).toEqual([{ user_id: 2 }]);
    expect(assignments['4'][1].participants).not.toEqual([{ user_id: 2 }]);
    expect(assignments['5'][0].participants).not.toEqual([{ user_id: 2 }]);
    expect(d.toast.error).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLACEACT-005: a refused participant write says why, or the generic line', async () => {
    const spy = vi.spyOn(assignmentsApi, 'setParticipants').mockRejectedValueOnce(new Error('no rights'));
    const d = deps();
    await placeActions(d).setParticipants(10, 4, [2]);
    expect(d.toast.error).toHaveBeenLastCalledWith('no rights');

    spy.mockRejectedValueOnce('offline');
    await placeActions(d).setParticipants(10, 4, [2]);
    expect(d.toast.error).toHaveBeenLastCalledWith('t:common.unknownError');
  });

  it('FE-PLANNER-PLACEACT-006: ratePlace and updatePlace go through the trip actions with the trip id', async () => {
    const d = deps();
    const actions = placeActions(d);
    await actions.ratePlace(3, 4);
    await actions.updatePlace(3, { route_color: '#123456' });
    expect(d.tripActions.ratePlace).toHaveBeenCalledWith(7, 3, 4);
    expect(d.tripActions.updatePlace).toHaveBeenCalledWith(7, 3, { route_color: '#123456' });
    expect(d.toast.error).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLACEACT-007: a failed rating or update is reported with its own message', async () => {
    const d = deps();
    d.tripActions.ratePlace.mockRejectedValueOnce(new Error('rate limited'));
    d.tripActions.updatePlace.mockRejectedValueOnce('gone');
    const actions = placeActions(d);
    await actions.ratePlace(3, null);
    await actions.updatePlace(3, { name: 'X' });
    expect(d.toast.error.mock.calls.map((c) => c[0])).toEqual(['rate limited', 't:common.unknownError']);
  });
});

describe('usePlaceFileUpload', () => {
  it('FE-PLANNER-PLACEACT-008: uploads every picked file against the place, then opens the list', async () => {
    const upload = vi.fn(async (_fd: FormData) => undefined);
    const toast = { error: vi.fn() };
    const { result } = renderHook(() => usePlaceFileUpload(5, upload, toast));
    const input = { value: 'picked' } as HTMLInputElement;
    result.current.fileInputRef.current = input;

    await act(async () => {
      await result.current.handleUpload(pick([new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]).event);
    });

    expect(upload).toHaveBeenCalledTimes(2);
    const fd = upload.mock.calls[1][0];
    expect((fd.get('file') as File).name).toBe('b.pdf');
    expect(fd.get('place_id')).toBe('5');
    expect(result.current.filesExpanded).toBe(true);
    expect(result.current.uploading).toBe(false);
    expect(input.value).toBe('');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLACEACT-009: holds the uploading flag while a file is on its way', async () => {
    let finish: () => void = () => undefined;
    const upload = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => usePlaceFileUpload(5, upload, { error: vi.fn() }));

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = result.current.handleUpload(pick([new File(['a'], 'a.pdf')]).event);
    });
    expect(result.current.uploading).toBe(true);

    await act(async () => {
      finish();
      await running;
    });
    expect(result.current.uploading).toBe(false);
  });

  it('FE-PLANNER-PLACEACT-010: a failed upload keeps the list as it was and says so; only the desktop logs it', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const upload = vi.fn(async () => {
      throw new Error('too large');
    });
    const toast = { error: vi.fn() };

    const phone = renderHook(() => usePlaceFileUpload(5, upload, toast));
    await act(async () => {
      await phone.result.current.handleUpload(pick([new File(['a'], 'a.pdf')]).event);
    });
    // The default translation echoes the key, so the server's text is no key and the fallback is used.
    expect(toast.error).toHaveBeenCalledWith('files.uploadError');
    expect(phone.result.current.filesExpanded).toBe(false);
    expect(phone.result.current.uploading).toBe(false);
    expect(consoleError).not.toHaveBeenCalled();

    const desktop = renderHook(() => usePlaceFileUpload(5, upload, toast, true));
    await act(async () => {
      await desktop.result.current.handleUpload(pick([new File(['a'], 'a.pdf')]).event);
    });
    expect(consoleError).toHaveBeenCalledWith('Upload failed', expect.any(Error));
  });

  it('FE-PLANNER-PLACEACT-011: without a place, an upload or a file the pick does nothing', async () => {
    const upload = vi.fn(async () => undefined);
    const noPlace = renderHook(() => usePlaceFileUpload(null, upload, { error: vi.fn() }));
    const noUpload = renderHook(() => usePlaceFileUpload(5, undefined, { error: vi.fn() }));
    const nothingPicked = renderHook(() => usePlaceFileUpload(5, upload, { error: vi.fn() }));
    await act(async () => {
      await noPlace.result.current.handleUpload(pick([new File(['a'], 'a.pdf')]).event);
      await noUpload.result.current.handleUpload(pick([new File(['a'], 'a.pdf')]).event);
      await nothingPicked.result.current.handleUpload(pick([]).event);
    });
    expect(upload).not.toHaveBeenCalled();
    expect(noUpload.result.current.uploading).toBe(false);
    expect(nothingPicked.result.current.filesExpanded).toBe(false);
  });

  it('FE-PLANNER-PLACEACT-012: the list can be opened and closed by hand', () => {
    const { result } = renderHook(() => usePlaceFileUpload(5, vi.fn(), { error: vi.fn() }));
    act(() => result.current.setFilesExpanded(true));
    expect(result.current.filesExpanded).toBe(true);
    act(() => result.current.setFilesExpanded((v) => !v));
    expect(result.current.filesExpanded).toBe(false);
  });
});
