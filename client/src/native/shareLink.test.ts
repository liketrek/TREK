import { Share } from '@capacitor/share';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';
import { canShareLink, shareLink } from './shareLink';

vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));
vi.mock('./platform', () => ({ isNativeApp: vi.fn() }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: vi.fn() }));
vi.mock('../utils/fileShare', () => ({ canShareText: vi.fn(() => false) }));

beforeEach(() => {
  vi.mocked(Share.share).mockReset().mockResolvedValue({ activityType: undefined });
  vi.mocked(reportNativeFailure).mockClear();
  vi.mocked(isNativeApp).mockReturnValue(true);
});

describe('shareLink', () => {
  it('uses the native sheet inside the app', async () => {
    expect(canShareLink()).toBe(true);
    expect(await shareLink('https://trek.example/s/abc', 'Trip')).toBe(true);
    expect(Share.share).toHaveBeenCalledWith({ url: 'https://trek.example/s/abc', title: 'Trip', dialogTitle: 'Trip' });
  });

  it('treats a closed sheet as no share, without a failure report', async () => {
    vi.mocked(Share.share).mockRejectedValue(new Error('Share canceled'));
    expect(await shareLink('https://trek.example/s/abc')).toBe(false);
    expect(reportNativeFailure).not.toHaveBeenCalled();
  });

  it('falls back to the Web Share API in a browser, and offers nothing without one', async () => {
    vi.mocked(isNativeApp).mockReturnValue(false);
    expect(canShareLink()).toBe(false);
    const share = vi.fn(async () => {});
    vi.stubGlobal('navigator', { share });
    expect(await shareLink('https://trek.example/s/abc')).toBe(true);
    expect(share).toHaveBeenCalledWith({ url: 'https://trek.example/s/abc', title: undefined });
    vi.unstubAllGlobals();
  });
});
