import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareFile, canShareText, shareFile, shareText } from './fileShare';

const gpx = () => new File(['<gpx/>'], 'Kramer.gpx', { type: 'application/gpx+xml' });

function stubShare(share: unknown, canShare: unknown) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'canShare', { value: canShare, configurable: true });
}

afterEach(() => stubShare(undefined, undefined));

describe('canShareFile (IO-01)', () => {
  it('asks the platform about this very kind of file', () => {
    const canShare = vi.fn((data: ShareData) => data.files?.[0]?.name.endsWith('.gpx') === true);
    stubShare(vi.fn(), canShare);
    expect(canShareFile('tour.gpx', 'application/gpx+xml')).toBe(true);
    expect(canShare.mock.calls[0][0].files?.[0]).toMatchObject({ name: 'tour.gpx', type: 'application/gpx+xml' });
    canShare.mockReturnValue(false);
    expect(canShareFile('tour.gpx', 'application/gpx+xml')).toBe(false);
  });

  it('is no without the share API, without canShare, or when the question itself throws', () => {
    stubShare(undefined, () => true);
    expect(canShareFile('tour.gpx', 'application/gpx+xml')).toBe(false);
    stubShare(vi.fn(), undefined);
    expect(canShareFile('tour.gpx', 'application/gpx+xml')).toBe(false);
    stubShare(vi.fn(), () => {
      throw new TypeError('files not supported');
    });
    expect(canShareFile('tour.gpx', 'application/gpx+xml')).toBe(false);
  });
});

describe('shareFile (IO-01)', () => {
  it('opens the sheet with the file and its title', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubShare(share, () => true);
    const file = gpx();
    await expect(shareFile(file, 'Kramer')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ files: [file], title: 'Kramer' });
  });

  it('tells a closed sheet, a refused tap, an open sheet and any other failure apart', async () => {
    const share = vi.fn();
    stubShare(share, () => true);
    share.mockRejectedValueOnce(new DOMException('closed', 'AbortError'));
    await expect(shareFile(gpx(), 'Kramer')).resolves.toBe('cancelled');
    share.mockRejectedValueOnce(new DOMException('no activation', 'NotAllowedError'));
    await expect(shareFile(gpx(), 'Kramer')).resolves.toBe('needs-gesture');
    share.mockRejectedValueOnce(new DOMException('earlier share still open', 'InvalidStateError'));
    await expect(shareFile(gpx(), 'Kramer')).resolves.toBe('busy');
    share.mockRejectedValueOnce(new DOMException('bad data', 'DataError'));
    await expect(shareFile(gpx(), 'Kramer')).resolves.toBe('failed');
    share.mockRejectedValueOnce(new Error('odd'));
    await expect(shareFile(gpx(), 'Kramer')).resolves.toBe('failed');
  });
});

describe('canShareText', () => {
  it('asks the platform about a text, and takes a share API without the question as a yes', () => {
    const canShare = vi.fn(() => true);
    stubShare(vi.fn(), canShare);
    expect(canShareText()).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ title: 'TREK', text: 'TREK' });
    canShare.mockReturnValue(false);
    expect(canShareText()).toBe(false);
    stubShare(vi.fn(), undefined);
    expect(canShareText()).toBe(true);
  });

  it('is no without the share API, or when the question itself throws', () => {
    stubShare(undefined, () => true);
    expect(canShareText()).toBe(false);
    stubShare(vi.fn(), () => {
      throw new TypeError('no');
    });
    expect(canShareText()).toBe(false);
  });
});

describe('shareText', () => {
  it('opens the sheet with the title and the text, and reads a refusal like a file share', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubShare(share, () => true);
    await expect(shareText('Kramer', 'Kramer\nHike')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'Kramer', text: 'Kramer\nHike' });
    share.mockRejectedValueOnce(new DOMException('closed', 'AbortError'));
    await expect(shareText('Kramer', 'x')).resolves.toBe('cancelled');
    share.mockRejectedValueOnce(new DOMException('earlier share still open', 'InvalidStateError'));
    await expect(shareText('Kramer', 'x')).resolves.toBe('busy');
    share.mockRejectedValueOnce(new Error('odd'));
    await expect(shareText('Kramer', 'x')).resolves.toBe('failed');
  });
});
