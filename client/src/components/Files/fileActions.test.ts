// FE-FILES-ACTIONS-001 to FE-FILES-ACTIONS-020: the paste, link, field save and trash rules the
// desktop file manager and the phone's files tab and sheets share, with what each view keeps.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import { filesApi } from '../../api/client';
import {
  DESKTOP_FILE_TRASH_TOAST_RULES,
  PHONE_FILE_LINK_RULES,
  PHONE_FILE_UPDATE_RULES,
  filesFromClipboard,
  planFileLinkToggle,
  runFileLinkRecordStep,
  toggleFileLink,
  trashFileWithToast,
  updateFileFields,
} from './fileActions';

function clipboard(items: { kind: string; file: File | null }[]): DataTransfer {
  return { items: items.map((i) => ({ kind: i.kind, getAsFile: () => i.file })) } as unknown as DataTransfer;
}

describe('filesFromClipboard', () => {
  it('FE-FILES-ACTIONS-001: keeps the file items in order and skips text and empty ones', () => {
    const a = new File(['a'], 'a.png');
    const b = new File(['b'], 'b.pdf');
    const data = clipboard([
      { kind: 'file', file: a },
      { kind: 'string', file: null },
      { kind: 'file', file: null },
      { kind: 'file', file: b },
    ]);
    expect(filesFromClipboard(data)).toEqual([a, b]);
  });

  it('FE-FILES-ACTIONS-002: no clipboard data or no items means no files', () => {
    expect(filesFromClipboard(null)).toEqual([]);
    expect(filesFromClipboard(undefined)).toEqual([]);
    expect(filesFromClipboard({} as DataTransfer)).toEqual([]);
  });
});

describe('planFileLinkToggle', () => {
  it('FE-FILES-ACTIONS-003: the first link goes into the free column', () => {
    const file = buildTripFile({ place_id: null, reservation_id: null });
    expect(planFileLinkToggle(file, 'place_id', 5)).toEqual({ kind: 'update', data: { place_id: 5 } });
    expect(planFileLinkToggle(file, 'reservation_id', 7)).toEqual({ kind: 'update', data: { reservation_id: 7 } });
  });

  it('FE-FILES-ACTIONS-004: a further link becomes a link record', () => {
    const file = buildTripFile({ place_id: 1, reservation_id: 2 });
    expect(planFileLinkToggle(file, 'place_id', 5)).toEqual({ kind: 'addLink' });
    expect(planFileLinkToggle(file, 'reservation_id', 7)).toEqual({ kind: 'addLink' });
  });

  it('FE-FILES-ACTIONS-005: unlinking the column target clears the column', () => {
    const file = buildTripFile({ place_id: 5, reservation_id: 7 });
    expect(planFileLinkToggle(file, 'place_id', 5)).toEqual({ kind: 'update', data: { place_id: null } });
    expect(planFileLinkToggle(file, 'reservation_id', 7)).toEqual({ kind: 'update', data: { reservation_id: null } });
  });

  it('FE-FILES-ACTIONS-006: unlinking a target linked by record removes the record', () => {
    const file = buildTripFile({ place_id: 1, linked_place_ids: [5], reservation_id: 2, linked_reservation_ids: [7] });
    expect(planFileLinkToggle(file, 'place_id', 5)).toEqual({ kind: 'removeLink' });
    expect(planFileLinkToggle(file, 'reservation_id', 7)).toEqual({ kind: 'removeLink' });
  });

  it('FE-FILES-ACTIONS-011: a zero column is free on desktop and taken on the phone', () => {
    const file = buildTripFile({ place_id: 0 });
    expect(planFileLinkToggle(file, 'place_id', 5)).toEqual({ kind: 'update', data: { place_id: 5 } });
    expect(planFileLinkToggle(file, 'place_id', 5, PHONE_FILE_LINK_RULES)).toEqual({ kind: 'addLink' });
  });
});

describe('running a link toggle', () => {
  beforeEach(() => {
    vi.spyOn(filesApi, 'update').mockResolvedValue({});
    vi.spyOn(filesApi, 'addLink').mockResolvedValue({});
    vi.spyOn(filesApi, 'removeLink').mockResolvedValue({});
    vi.spyOn(filesApi, 'getLinks').mockResolvedValue({
      links: [
        { id: 70, place_id: null, reservation_id: 7 },
        { id: 50, place_id: '5', reservation_id: null },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-FILES-ACTIONS-007: adding a record posts the target in its own field', async () => {
    await runFileLinkRecordStep(1, 9, 'place_id', 5, 'addLink');
    await runFileLinkRecordStep(1, 9, 'reservation_id', 7, 'addLink');
    expect(filesApi.addLink).toHaveBeenNthCalledWith(1, 1, 9, { place_id: 5 });
    expect(filesApi.addLink).toHaveBeenNthCalledWith(2, 1, 9, { reservation_id: 7 });
  });

  it('FE-FILES-ACTIONS-008: on the phone a record is looked up by the numeric target', async () => {
    await runFileLinkRecordStep(1, 9, 'place_id', 5, 'removeLink', PHONE_FILE_LINK_RULES);
    await runFileLinkRecordStep(1, 9, 'reservation_id', 7, 'removeLink', PHONE_FILE_LINK_RULES);
    expect(filesApi.getLinks).toHaveBeenCalledWith(1, 9);
    expect(filesApi.removeLink).toHaveBeenNthCalledWith(1, 1, 9, 50);
    expect(filesApi.removeLink).toHaveBeenNthCalledWith(2, 1, 9, 70);
  });

  it('FE-FILES-ACTIONS-009: no matching record or no links array removes nothing', async () => {
    await runFileLinkRecordStep(1, 9, 'place_id', 99, 'removeLink');
    vi.mocked(filesApi.getLinks).mockResolvedValue({});
    await runFileLinkRecordStep(1, 9, 'place_id', 5, 'removeLink');
    expect(filesApi.removeLink).not.toHaveBeenCalled();
  });

  it('FE-FILES-ACTIONS-012: on desktop a record is looked up by the target as it comes', async () => {
    await runFileLinkRecordStep(1, 9, 'place_id', 5, 'removeLink');
    await runFileLinkRecordStep(1, 9, 'reservation_id', 7, 'removeLink');
    expect(filesApi.removeLink).toHaveBeenCalledTimes(1);
    expect(filesApi.removeLink).toHaveBeenCalledWith(1, 9, 70);
  });

  it('FE-FILES-ACTIONS-010: toggleFileLink writes the column or the record, and rethrows', async () => {
    await toggleFileLink(1, buildTripFile({ id: 9, place_id: null }), 'place_id', 5, PHONE_FILE_LINK_RULES);
    expect(filesApi.update).toHaveBeenCalledWith(1, 9, { place_id: 5 });

    await toggleFileLink(1, buildTripFile({ id: 9, place_id: 1 }), 'place_id', 5, PHONE_FILE_LINK_RULES);
    expect(filesApi.addLink).toHaveBeenCalledWith(1, 9, { place_id: 5 });

    await toggleFileLink(1, buildTripFile({ id: 9, place_id: 1, linked_place_ids: [5] }), 'place_id', 5);
    expect(filesApi.removeLink).not.toHaveBeenCalled();
    await toggleFileLink(
      1,
      buildTripFile({ id: 9, place_id: 1, linked_place_ids: [5] }),
      'place_id',
      5,
      PHONE_FILE_LINK_RULES
    );
    expect(filesApi.removeLink).toHaveBeenCalledWith(1, 9, 50);

    vi.mocked(filesApi.update).mockRejectedValue(new Error('nope'));
    await expect(toggleFileLink(1, buildTripFile({ id: 9, reservation_id: 7 }), 'reservation_id', 7)).rejects.toThrow(
      'nope'
    );
  });
});

function feedback(t: (key: string) => string = (key) => key) {
  return { t, toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } };
}

describe('updateFileFields', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-FILES-ACTIONS-013: saves the fields and starts the reload without waiting on desktop', async () => {
    vi.spyOn(filesApi, 'update').mockResolvedValue({});
    const fb = feedback();
    let finishReload: () => void = () => {};
    const refresh = vi.fn(() => new Promise<void>((resolve) => (finishReload = resolve)));
    await updateFileFields(1, 7, { place_id: 3 }, { ...fb, refresh });
    expect(filesApi.update).toHaveBeenCalledWith(1, 7, { place_id: 3 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fb.toast.error).not.toHaveBeenCalled();
    finishReload();
  });

  it('FE-FILES-ACTIONS-014: desktop resolves before a slow reload is done', async () => {
    vi.spyOn(filesApi, 'update').mockResolvedValue({});
    const order: string[] = [];
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      order.push('reloaded');
    });
    const reload = updateFileFields(1, 7, { description: 'x' }, { ...feedback(), refresh }).then(() =>
      order.push('resolved')
    );
    await reload;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual(['resolved', 'reloaded']);
  });

  it('FE-FILES-ACTIONS-015: the phone waits for the reload before it resolves', async () => {
    vi.spyOn(filesApi, 'update').mockResolvedValue({});
    const fb = feedback();
    const order: string[] = [];
    const refresh = vi.fn(async () => {
      await Promise.resolve();
      order.push('reloaded');
    });
    await updateFileFields(1, 7, { description: 'seat 14A' }, { ...fb, refresh }, PHONE_FILE_UPDATE_RULES);
    order.push('resolved');
    expect(order).toEqual(['reloaded', 'resolved']);
    expect(filesApi.update).toHaveBeenCalledWith(1, 7, { description: 'seat 14A' });
  });

  it('FE-FILES-ACTIONS-016: on the phone a failed reload shows the assign error', async () => {
    vi.spyOn(filesApi, 'update').mockResolvedValue({});
    const fb = feedback();
    const refresh = vi.fn(() => Promise.reject(new Error('offline')));
    await updateFileFields(1, 7, { description: 'x' }, { ...fb, refresh }, PHONE_FILE_UPDATE_RULES);
    expect(fb.toast.error).toHaveBeenCalledWith('files.toast.assignError');
  });

  it('FE-FILES-ACTIONS-017: a failed save shows the assign error and skips the reload in both views', async () => {
    vi.spyOn(filesApi, 'update').mockRejectedValue(new Error('500'));
    for (const rules of [undefined, PHONE_FILE_UPDATE_RULES]) {
      const fb = feedback();
      const refresh = vi.fn();
      await updateFileFields(1, 7, { reservation_id: null }, { ...fb, refresh }, rules);
      expect(refresh).not.toHaveBeenCalled();
      expect(fb.toast.error).toHaveBeenCalledWith('files.toast.assignError');
    }
  });
});

describe('trashFileWithToast', () => {
  it('FE-FILES-ACTIONS-018: a trashed file says so and then calls onTrashed', async () => {
    const fb = feedback();
    const remove = vi.fn().mockResolvedValue(undefined);
    const onTrashed = vi.fn();
    await trashFileWithToast(remove, { ...fb, onTrashed });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(fb.toast.success).toHaveBeenCalledWith('files.toast.trashed');
    expect(onTrashed).toHaveBeenCalledTimes(1);
    expect(fb.toast.error).not.toHaveBeenCalled();
  });

  it('FE-FILES-ACTIONS-019: an empty translation falls back to English on desktop only', async () => {
    const desktop = feedback(() => '');
    await trashFileWithToast(vi.fn().mockResolvedValue(undefined), desktop, DESKTOP_FILE_TRASH_TOAST_RULES);
    expect(desktop.toast.success).toHaveBeenCalledWith('Moved to trash');

    const phone = feedback(() => '');
    await trashFileWithToast(vi.fn().mockResolvedValue(undefined), phone);
    expect(phone.toast.success).toHaveBeenCalledWith('');
  });

  it('FE-FILES-ACTIONS-020: a failed delete shows the delete error and skips onTrashed', async () => {
    const fb = feedback();
    const onTrashed = vi.fn();
    await trashFileWithToast(vi.fn().mockRejectedValue(new Error('403')), { ...fb, onTrashed });
    expect(fb.toast.success).not.toHaveBeenCalled();
    expect(onTrashed).not.toHaveBeenCalled();
    expect(fb.toast.error).toHaveBeenCalledWith('files.toast.deleteError');
  });
});
