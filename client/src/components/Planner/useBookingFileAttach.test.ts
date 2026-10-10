// FE-PLANNER-BOOKINGFILES-001 to -005: the Files row of the desktop booking and
// transport dialogs.
import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import type { TripFile } from '../../types';
import { type BookingFileAttachOptions, useBookingFileAttach } from './useBookingFileAttach';

type FileEvent = React.ChangeEvent<HTMLInputElement> & { target: { value: string } };

function changeEvent(file?: File): FileEvent {
  const target = { files: file ? [file] : [], value: 'picked.pdf' };
  return { target } as unknown as FileEvent;
}

function setup(overrides: Partial<BookingFileAttachOptions> = {}, files: TripFile[] = []) {
  const toast = { success: vi.fn(), error: vi.fn() };
  const t = (key: string) => key;
  const view = renderHook(() => {
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const attach = useBookingFileAttach({
      reservation: { id: 5, title: 'Hotel' },
      files,
      setPendingFiles,
      toast,
      t,
      ...overrides,
    });
    return { attach, pendingFiles };
  });
  return { ...view, toast };
}

describe('useBookingFileAttach', () => {
  it('FE-PLANNER-BOOKINGFILES-001: a file on a saved booking goes up at once and the input clears', async () => {
    const onFileUpload = vi.fn(async (_fd: FormData) => undefined);
    const { result, toast } = setup({ onFileUpload });
    const e = changeEvent(new File(['a'], 'a.pdf'));
    await act(() => result.current.attach.handleFileChange(e));
    const fd = onFileUpload.mock.calls[0][0];
    expect(fd.get('reservation_id')).toBe('5');
    expect(fd.get('description')).toBe('Hotel');
    expect(toast.success).toHaveBeenCalledWith('reservations.toast.fileUploaded');
    expect(e.target.value).toBe('');
    expect(result.current.attach.uploadingFile).toBe(false);
    expect(result.current.pendingFiles).toEqual([]);
  });

  it('FE-PLANNER-BOOKINGFILES-002: a failed upload, or a dialog without one, says so', async () => {
    const onFileUpload = vi.fn(async () => {
      throw new Error('boom');
    });
    const failing = setup({ onFileUpload });
    await act(() => failing.result.current.attach.handleFileChange(changeEvent(new File(['a'], 'a.pdf'))));
    expect(failing.toast.error).toHaveBeenCalledWith('reservations.toast.uploadError');

    const without = setup({ onFileUpload: undefined });
    await act(() => without.result.current.attach.handleFileChange(changeEvent(new File(['a'], 'a.pdf'))));
    expect(without.toast.error).toHaveBeenCalledWith('reservations.toast.uploadError');
    expect(without.toast.success).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKINGFILES-003: on a new booking the file waits for the save and can be taken back', async () => {
    const onFileUpload = vi.fn(async () => undefined);
    const { result } = setup({ reservation: null, onFileUpload });
    const a = new File(['a'], 'a.pdf');
    const b = new File(['b'], 'b.pdf');
    const e = changeEvent(a);
    await act(() => result.current.attach.handleFileChange(e));
    await act(() => result.current.attach.handleFileChange(changeEvent(b)));
    await act(() => result.current.attach.handleFileChange(changeEvent()));
    expect(onFileUpload).not.toHaveBeenCalled();
    expect(e.target.value).toBe('');
    expect(result.current.pendingFiles).toEqual([a, b]);
    act(() => result.current.attach.removePending(0));
    expect(result.current.pendingFiles).toEqual([b]);
  });

  it('FE-PLANNER-BOOKINGFILES-004: files linked and detached in the dialog show on the booking', () => {
    const files = [buildTripFile({ id: 1, reservation_id: 5 }), buildTripFile({ id: 2, reservation_id: null })];
    const { result } = setup({}, files);
    expect(result.current.attach.attachedFiles.map((f) => f.id)).toEqual([1]);
    act(() => result.current.attach.linkFile(2));
    expect(result.current.attach.attachedFiles.map((f) => f.id)).toEqual([1, 2]);
    act(() => result.current.attach.detachFile(2));
    expect(result.current.attach.attachedFiles.map((f) => f.id)).toEqual([1]);
  });

  it('FE-PLANNER-BOOKINGFILES-005: a new booking lists no attached files', () => {
    const { result } = setup({ reservation: null }, [buildTripFile({ id: 1, reservation_id: 5 })]);
    expect(result.current.attach.attachedFiles).toEqual([]);
  });
});
