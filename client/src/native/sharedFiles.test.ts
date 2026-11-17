import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import { linkOf, startSharedFiles, toFile, useSharedImportStore } from './sharedFiles';
import { TrekShell } from './trekShell';

vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn(), loadNativeCapabilities: vi.fn(async () => ({})) }));
vi.mock('./trekShell', () => ({
  TrekShell: { addListener: vi.fn(async () => ({ remove: async () => {} })), takeSharedFile: vi.fn() },
  isUnimplemented: () => false,
}));

const PDF = { name: 'booking.pdf', mimeType: 'application/pdf', data: btoa('%PDF-1.4 hello') };

beforeEach(() => {
  useSharedImportStore.setState({ file: null, tripId: null, link: null });
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

  it('takes the trip the share sheet already picked', async () => {
    vi.mocked(TrekShell.takeSharedFile).mockResolvedValue({ file: { ...PDF, tripId: 12 } });
    await startSharedFiles();
    expect(useSharedImportStore.getState()).toMatchObject({ tripId: 12 });
    expect(useSharedImportStore.getState().file?.name).toBe('booking.pdf');
  });

  it('keeps the address of a shared page, and holds the picked trip back until the link is decided on', async () => {
    const page = { name: 'hotel.html', mimeType: 'text/html', data: btoa('<html></html>') };
    vi.mocked(TrekShell.takeSharedFile).mockResolvedValue({
      file: { ...page, tripId: 12, url: 'https://hotel.example/stay', title: 'Hotel Kanra' },
    });
    await startSharedFiles();
    expect(useSharedImportStore.getState()).toMatchObject({
      tripId: null,
      link: { url: 'https://hotel.example/stay', title: 'Hotel Kanra', presetTripId: 12 },
    });
  });

  it('takes http(s) links only, titled by the host when the page has none', () => {
    const base = { name: 'link.url', mimeType: 'text/uri-list', data: '' };
    expect(linkOf({ ...base, url: 'https://maps.app.goo.gl/x' })).toEqual({
      url: 'https://maps.app.goo.gl/x',
      title: 'maps.app.goo.gl',
      presetTripId: null,
    });
    expect(linkOf({ ...base, url: 'javascript:alert(1)' })).toBeNull();
    expect(linkOf({ ...base, url: 'not a url' })).toBeNull();
    expect(linkOf(base)).toBeNull();
  });

  it('forgets the link along with the file', () => {
    useSharedImportStore.getState().setFile(toFile(PDF), { url: 'https://a.example/', title: 'A', presetTripId: null });
    useSharedImportStore.getState().setFile(null, { url: 'https://a.example/', title: 'A', presetTripId: null });
    expect(useSharedImportStore.getState().link).toBeNull();
  });

  it('does nothing in a binary without the feature', async () => {
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    vi.mocked(TrekShell.addListener).mockClear();
    await startSharedFiles();
    expect(TrekShell.addListener).not.toHaveBeenCalled();
    expect(TrekShell.takeSharedFile).not.toHaveBeenCalled();
  });
});
