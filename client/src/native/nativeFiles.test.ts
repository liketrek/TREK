import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import { cacheFileName, fileNameFromUrl, openNativeFile, shareFile } from './nativeFiles';
import { TrekShell } from './trekShell';

vi.mock('@capacitor/filesystem', () => ({ Directory: { Cache: 'CACHE' }, Filesystem: { writeFile: vi.fn() } }));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn() }));
vi.mock('./trekShell', () => ({ TrekShell: { previewFile: vi.fn() } }));

beforeEach(() => {
  vi.mocked(Filesystem.writeFile).mockReset().mockResolvedValue({ uri: 'file:///cache/trip.pdf' });
  vi.mocked(Share.share).mockReset().mockResolvedValue({});
});

describe('cacheFileName', () => {
  it('keeps a readable name but nothing that could leave the cache directory', () => {
    expect(cacheFileName('Lisbon 2026.pdf')).toBe('Lisbon 2026.pdf');
    expect(cacheFileName('../../etc/passwd')).toBe('_.._etc_passwd');
    expect(cacheFileName('a:b*c?"d"<e>|f\u0001.txt')).toBe('a_b_c__d__e__f_.txt');
    expect(cacheFileName('...hidden')).toBe('hidden');
    expect(cacheFileName('   ')).toBe('download');
  });
});

describe('fileNameFromUrl', () => {
  it('takes the decoded last path segment', () => {
    expect(fileNameFromUrl('/api/trips/1/files/42/Boarding%20pass.pdf?token=x')).toBe('Boarding pass.pdf');
    expect(fileNameFromUrl('/uploads/files/')).toBe('files');
    expect(fileNameFromUrl('/bad/%E0%A4%A')).toBe('%E0%A4%A');
  });
});

describe('shareFile', () => {
  it('writes the blob to the cache and hands it to the share sheet', async () => {
    await shareFile(new Blob(['hello'], { type: 'text/plain' }), 'note.txt');

    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: 'note.txt',
      data: btoa('hello'),
      directory: Directory.Cache,
    });
    expect(Share.share).toHaveBeenCalledWith({ files: ['file:///cache/trip.pdf'] });
  });

  it('treats a dismissed sheet as the user changing their mind', async () => {
    vi.mocked(Share.share).mockRejectedValue(new Error('Share canceled'));
    await expect(shareFile(new Blob(['x']), 'x.txt')).resolves.toBeUndefined();
  });

  it('passes a real failure on', async () => {
    vi.mocked(Share.share).mockRejectedValue(new Error('No activity found'));
    await expect(shareFile(new Blob(['x']), 'x.txt')).rejects.toThrow('No activity found');
  });
});

describe('openNativeFile', () => {
  const pdf = () => new Blob(['%PDF'], { type: 'application/pdf' });

  it('FE-NATIVE-FILES-OPEN-001: shows the file in the system viewer where the app has one, not in the share sheet', async () => {
    vi.mocked(hasNativeFeature).mockReturnValue(true);
    vi.mocked(TrekShell.previewFile).mockResolvedValue({ result: 'shown' });

    await openNativeFile(pdf(), 'trip.pdf');

    expect(TrekShell.previewFile).toHaveBeenCalledWith({
      path: 'file:///cache/trip.pdf',
      mimeType: 'application/pdf',
      title: 'trip.pdf',
    });
    expect(Share.share).not.toHaveBeenCalled();
  });

  it('FE-NATIVE-FILES-OPEN-002: falls back to the share sheet for an older app, a type nothing shows, or a viewer that fails', async () => {
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    await openNativeFile(pdf(), 'trip.pdf');
    expect(TrekShell.previewFile).not.toHaveBeenCalled();

    vi.mocked(hasNativeFeature).mockReturnValue(true);
    vi.mocked(TrekShell.previewFile).mockResolvedValueOnce({ result: 'unsupported' });
    await openNativeFile(pdf(), 'trip.pdf');
    vi.mocked(TrekShell.previewFile).mockRejectedValueOnce(new Error('no window'));
    await openNativeFile(pdf(), 'trip.pdf');

    expect(Share.share).toHaveBeenCalledTimes(3);
    expect(Share.share).toHaveBeenCalledWith({ files: ['file:///cache/trip.pdf'] });
  });
});
