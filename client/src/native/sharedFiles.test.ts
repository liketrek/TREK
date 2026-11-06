import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import { startSharedFiles, toFile, useSharedImportStore } from './sharedFiles';
import { TrekShell } from './trekShell';

vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn(), loadNativeCapabilities: vi.fn(async () => ({})) }));
vi.mock('./trekShell', () => ({
  TrekShell: { addListener: vi.fn(async () => ({ remove: async () => {} })), takeSharedFile: vi.fn() },
  isUnimplemented: () => false,
}));

const PDF = { name: 'booking.pdf', mimeType: 'application/pdf', data: btoa('%PDF-1.4 hello') };

beforeEach(() => {
  useSharedImportStore.setState({ file: null, tripId: null });
  vi.mocked(hasNativeFeature).mockReturnValue(true);
  vi.mocked(TrekShell.takeSharedFile).mockReset().mockResolvedValue({ file: null });
});

describe('shared booking documents', () => {
  it('turns the base64 the native side sends into a File', async () => {
    const file = toFile(PDF);
    expect(file.name).toBe('booking.pdf');
    expect(file.type).toBe('application/pdf');
    expect(await file.text()).toBe('%PDF-1.4 hello');
  });

  it('picks up a document shared before the UI ran, and the next ones as they come', async () => {
    vi.mocked(TrekShell.takeSharedFile).mockResolvedValue({ file: PDF });
    await startSharedFiles();
    expect(useSharedImportStore.getState().file?.name).toBe('booking.pdf');

    const listener = vi.mocked(TrekShell.addListener).mock.calls[0][1] as unknown as (p: typeof PDF) => void;
    listener({ ...PDF, name: 'train.ics', mimeType: 'text/calendar' });
    expect(useSharedImportStore.getState().file?.name).toBe('train.ics');
  });

  it('hands the file over once a trip is picked, and empties the queue', () => {
    useSharedImportStore.getState().setFile(toFile(PDF));
    useSharedImportStore.getState().chooseTrip(7);
    expect(useSharedImportStore.getState().tripId).toBe(7);
    expect(useSharedImportStore.getState().take()?.name).toBe('booking.pdf');
    expect(useSharedImportStore.getState()).toMatchObject({ file: null, tripId: null });
  });

  it('does nothing in a binary without the feature', async () => {
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    vi.mocked(TrekShell.addListener).mockClear();
    await startSharedFiles();
    expect(TrekShell.addListener).not.toHaveBeenCalled();
    expect(TrekShell.takeSharedFile).not.toHaveBeenCalled();
  });
});
