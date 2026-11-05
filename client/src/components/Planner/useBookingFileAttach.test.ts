// FE-PLANNER-BOOKINGFILES-001 to -005: the Files row of the desktop booking and
// transport dialogs.
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import type { TripFile } from '../../types';
import { type BookingFileAttachOptions, useBookingFileAttach } from './useBookingFileAttach';

type FileEvent = React.ChangeEvent<HTMLInputElement> & { target: { value: string } };

function changeEvent(file?: File): FileEvent {
  const target = { files: file ? [file] : [], value: 'picked.pdf' };
  return { target } as unknown as FileEvent;
}

function setup(overrides: Partial<BookingFileAttachOptions> = {}, files: TripFile[] = []) {
  return renderHook(() => {
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const attach = useBookingFileAttach({ reservation: { id: 5 }, files, setPendingFiles, ...overrides });
    return { attach, pendingFiles };
  });
}

describe('useBookingFileAttach', () => {
  it('FE-PLANNER-BOOKINGFILES-001: a file picked on a saved booking waits for the save like on a new one (#2883)', () => {
    const { result } = setup();
    const a = new File(['a'], 'a.pdf');
    const e = changeEvent(a);
    act(() => result.current.attach.handleFileChange(e));
    expect(result.current.pendingFiles).toEqual([a]);
    expect(e.target.value).toBe('');
  });

  it('FE-PLANNER-BOOKINGFILES-002: on a new booking the files gather and can be taken back', () => {
    const { result } = setup({ reservation: null });
    const a = new File(['a'], 'a.pdf');
    const b = new File(['b'], 'b.pdf');
    act(() => result.current.attach.handleFileChange(changeEvent(a)));
    act(() => result.current.attach.handleFileChange(changeEvent(b)));
    act(() => result.current.attach.handleFileChange(changeEvent()));
    expect(result.current.pendingFiles).toEqual([a, b]);
    act(() => result.current.attach.removePending(0));
    expect(result.current.pendingFiles).toEqual([b]);
  });

  it('FE-PLANNER-BOOKINGFILES-003: files linked and detached in the dialog show on the booking', () => {
    const files = [buildTripFile({ id: 1, reservation_id: 5 }), buildTripFile({ id: 2, reservation_id: null })];
    const { result } = setup({}, files);
    expect(result.current.attach.attachedFiles.map((f) => f.id)).toEqual([1]);
    act(() => result.current.attach.linkFile(2));
    expect(result.current.attach.attachedFiles.map((f) => f.id)).toEqual([1, 2]);
    act(() => result.current.attach.detachFile(2));
    expect(result.current.attach.attachedFiles.map((f) => f.id)).toEqual([1]);
  });

  it('FE-PLANNER-BOOKINGFILES-004: a new booking lists no attached files', () => {
    const { result } = setup({ reservation: null }, [buildTripFile({ id: 1, reservation_id: 5 })]);
    expect(result.current.attach.attachedFiles).toEqual([]);
  });
});
