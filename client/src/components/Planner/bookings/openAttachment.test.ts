// FE-PLANNER-OPENATTACH-001 to -003: opening a booking's attached file.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { openFile } from '../../../utils/fileDownload';
import { openAttachment } from './openAttachment';

vi.mock('../../../utils/fileDownload', () => ({ openFile: vi.fn(() => Promise.resolve()) }));

const file = { url: '/uploads/f/1', original_name: 'voucher.pdf' };

describe('openAttachment', () => {
  // A block body: a hook that returns the mock would have it run again as teardown.
  beforeEach(() => {
    vi.mocked(openFile).mockReset();
  });

  it('FE-PLANNER-OPENATTACH-001: opens the file by its url and name', async () => {
    vi.mocked(openFile).mockResolvedValue(undefined);
    const onError = vi.fn();
    openAttachment(file, onError);
    expect(openFile).toHaveBeenCalledWith('/uploads/f/1', 'voucher.pdf');
    await Promise.resolve();
    expect(onError).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-OPENATTACH-002: a failure reaches onError when one is given', async () => {
    vi.mocked(openFile).mockRejectedValue(new Error('offline'));
    const onError = vi.fn();
    openAttachment(file, onError);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
  });

  it('FE-PLANNER-OPENATTACH-003: without onError it only opens the file', () => {
    vi.mocked(openFile).mockResolvedValue(undefined);
    expect(openAttachment(file)).toBeUndefined();
    expect(openFile).toHaveBeenCalledTimes(1);
    expect(openFile).toHaveBeenCalledWith('/uploads/f/1', 'voucher.pdf');
  });
});
