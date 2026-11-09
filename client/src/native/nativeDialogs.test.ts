import { ActionSheet } from '@capacitor/action-sheet';
import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { askNatively, canAskNatively } from './nativeDialogs';
import { isNativeApp } from './platform';

vi.mock('@capacitor/action-sheet', () => ({
  ActionSheet: { showActions: vi.fn() },
  ActionSheetButtonStyle: { Default: 'DEFAULT', Destructive: 'DESTRUCTIVE', Cancel: 'CANCEL' },
}));
vi.mock('@capacitor/dialog', () => ({ Dialog: { confirm: vi.fn() } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isPluginAvailable: vi.fn() } }));
vi.mock('./platform', () => ({ isNativeApp: vi.fn() }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: vi.fn() }));

const question = { title: 'Delete place?', message: 'Gone for good.', confirmLabel: 'Delete', cancelLabel: 'Cancel' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isNativeApp).mockReturnValue(true);
  vi.mocked(Capacitor.isPluginAvailable).mockReturnValue(true);
});

describe('canAskNatively', () => {
  it('needs the app and both plugins in its binary', () => {
    expect(canAskNatively()).toBe(true);
    vi.mocked(Capacitor.isPluginAvailable).mockImplementation((name) => name !== 'Dialog');
    expect(canAskNatively()).toBe(false);
    vi.mocked(isNativeApp).mockReturnValue(false);
    expect(canAskNatively()).toBe(false);
  });
});

describe('askNatively', () => {
  it('asks a destroying question on a sheet with the action in red, yes only for that action', async () => {
    vi.mocked(ActionSheet.showActions).mockResolvedValue({ index: 0 });
    expect(await askNatively({ ...question, danger: true })).toBe(true);
    expect(ActionSheet.showActions).toHaveBeenCalledWith({
      title: 'Delete place?',
      message: 'Gone for good.',
      options: [
        { title: 'Delete', style: 'DESTRUCTIVE' },
        { title: 'Cancel', style: 'CANCEL' },
      ],
    });
    vi.mocked(ActionSheet.showActions).mockResolvedValue({ index: 1 });
    expect(await askNatively({ ...question, danger: true })).toBe(false);
    vi.mocked(ActionSheet.showActions).mockResolvedValue({ index: -1 });
    expect(await askNatively({ ...question, danger: true })).toBe(false);
  });

  it('asks any other question in an alert', async () => {
    vi.mocked(Dialog.confirm).mockResolvedValue({ value: true });
    expect(await askNatively({ ...question, danger: false })).toBe(true);
    expect(Dialog.confirm).toHaveBeenCalledWith({
      title: 'Delete place?',
      message: 'Gone for good.',
      okButtonTitle: 'Delete',
      cancelButtonTitle: 'Cancel',
    });
  });

  it('answers null when the system cannot ask, so the HTML dialog takes over', async () => {
    vi.mocked(ActionSheet.showActions).mockRejectedValue(new Error('not implemented'));
    expect(await askNatively({ ...question, danger: true })).toBeNull();
  });
});
