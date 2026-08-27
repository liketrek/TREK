import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { localIsoDate } from '../../../../src/utils/localDate';
import userEvent from '@testing-library/user-event';
import { mapsApi, weatherApi } from '../../../../src/api/client';
import { useAddonStore } from '../../../../src/store/addonStore';
import MJourneyEntrySheet from '../../../../src/mobile/screens/journey/MJourneyEntrySheet';
import type { GalleryPhoto, JourneyEntry, JourneyPhoto } from '../../../../src/store/journeyStore';
import type { ResilientResult, UploadProgress } from '../../../../src/utils/uploadQueue';
import { server } from '../../../helpers/msw/server';
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render';

const entry: JourneyEntry = {
  id: 0,
  journey_id: 7,
  author_id: 0,
  type: 'entry',
  entry_date: '2026-07-22',
  entry_time: '09:07',
  visibility: 'private',
  sort_order: 0,
  photos: [],
  created_at: 0,
  updated_at: 0,
};

function setup() {
  const props = {
    entry,
    galleryPhotos: [],
    quickCapture: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(42),
    onUploadPhotos: vi.fn().mockResolvedValue({ succeeded: [], failed: [] }),
    onDone: vi.fn(),
  };
  const view = render(<MJourneyEntrySheet {...props} />);
  return { ...view, props };
}

describe('MJourneyEntrySheet quick capture', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 1.3521, longitude: 103.8198 } })),
      },
    });
  });

  // #1614 — the ask was "photos *or* quick notes" while travelling, and a moment
  // without a picture is still worth catching.
  it('takes a note in capture mode and saves it', async () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: 'Singapore', address: 'Singapore' });
    const { props } = setup();

    const note = await screen.findByPlaceholderText('Write your story...');
    fireEvent.change(note, { target: { value: 'Ferry was late, worth it' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({ story: 'Ferry was late, worth it' }),
        undefined,
      ),
    );
  });

  it('captures GPS, reverse-geocodes it, detects an editable weather category, and saves', async () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: 'Singapore', address: 'Singapore' });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 30,
      main: 'Rain',
      description: 'Rain',
      type: 'current',
    });
    const { props } = setup();

    await waitFor(() => expect(mapsApi.reverse).toHaveBeenCalledWith(1.3521, 103.8198, 'en'));
    expect(weatherApi.getCurrent).toHaveBeenCalledWith(1.3521, 103.8198, 'en');
    await waitFor(() => expect(screen.getByDisplayValue('Singapore')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          entry_date: '2026-07-22',
          entry_time: '09:07',
          location_name: 'Singapore',
          location_lat: 1.3521,
          location_lng: 103.8198,
          weather: 'rainy',
        }),
        // A new entry has nothing persisted yet, so no id to retry against (#1808).
        undefined,
      )
    );
    expect(props.onDone).toHaveBeenCalled();
  });

  it('offers native camera and gallery inputs', () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: null, address: null });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 0,
      main: '',
      description: '',
      type: '',
      error: 'unavailable',
    });
    setup();

    expect(document.querySelector('input[type="file"][capture="environment"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="file"][multiple]')).toBeInTheDocument();
    return waitFor(() => expect(mapsApi.reverse).toHaveBeenCalled());
  });

  it('can expand into the full editor before saving', async () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: null, address: null });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 0,
      main: '',
      description: '',
      type: '',
      error: 'unavailable',
    });
    setup();

    expect(screen.queryByPlaceholderText('Give this moment a name...')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add details' }));
    expect(screen.getByPlaceholderText('Give this moment a name...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your story...')).toBeInTheDocument();
    await waitFor(() => expect(mapsApi.reverse).toHaveBeenCalled());
  });

  it('still saves when location permission is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_success, failure) => failure({
          code: 1, message: 'Permission denied',
          PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3,
        })),
      },
    });
    const { props } = setup();

    expect(await screen.findByText('Location access was denied. Allow it in your browser settings and try again.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          entry_date: '2026-07-22',
          entry_time: '09:07',
          location_lat: null,
          location_lng: null,
        }),
        undefined,
      )
    );
    expect(props.onDone).toHaveBeenCalled();
  });

  it('FE-MOB-JENTRY-001: opens the camera and the gallery picker from the capture buttons', async () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: null, address: null });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 0, main: '', description: '', type: '', error: 'unavailable',
    });
    const user = userEvent.setup();
    setup();

    const camera = document.querySelector('input[type="file"][capture="environment"]') as HTMLInputElement;
    const gallery = document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    const cameraClick = vi.spyOn(camera, 'click');
    const galleryClick = vi.spyOn(gallery, 'click');

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    await user.click(screen.getByRole('button', { name: 'Gallery' }));

    expect(cameraClick).toHaveBeenCalledTimes(1);
    expect(galleryClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mapsApi.reverse).toHaveBeenCalled());
  });

  it('FE-MOB-JENTRY-002: closes a quick capture without a discard prompt', async () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: 'Singapore', address: 'Singapore' });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 0, main: '', description: '', type: '', error: 'unavailable',
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    const { props } = setup();

    await waitFor(() => expect(screen.getByDisplayValue('Singapore')).toBeInTheDocument());
    // Header X and footer button share the "Cancel" label; the footer one is second.
    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[1]);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

// FE-MOB-JENTRY-003 to FE-MOB-JENTRY-033 — the full editor, read-only mode and the
// quick-capture races the tests above don't reach.

type ToastKind = 'success' | 'error' | 'warning' | 'info';

const toastSpy = vi.fn((_message: string, _type?: ToastKind, _duration?: number) => 0);

function buildEntry(overrides: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 0,
    journey_id: 7,
    author_id: 3,
    type: 'entry',
    entry_date: '2026-03-15',
    visibility: 'private',
    sort_order: 0,
    photos: [],
    created_at: 0,
    updated_at: 0,
    ...overrides,
  };
}

function buildPhoto(id: number): JourneyPhoto {
  return { id, entry_id: 5, photo_id: id, caption: null, sort_order: 0, shared: 1, created_at: 0 };
}

function buildGalleryPhoto(id: number): GalleryPhoto {
  return { id, journey_id: 7, photo_id: id, caption: null, shared: 1, sort_order: 0, created_at: 0 };
}

type UploadFn = (
  entryId: number,
  files: File[],
  cbs?: { onProgress?: (p: UploadProgress) => void },
) => Promise<ResilientResult<JourneyPhoto>>;

interface MountOptions {
  galleryPhotos?: GalleryPhoto[];
  quickCapture?: boolean;
  readOnly?: boolean;
  withDelete?: boolean;
  withProviderHook?: boolean;
  upload?: UploadFn;
  strict?: boolean;
}

const defaultUpload: UploadFn = async (_entryId, files, cbs) => {
  cbs?.onProgress?.({ done: files.length, total: files.length, failed: 0, percent: 100 });
  return { succeeded: [], failed: [] };
};

function mountSheet(sheetEntry: JourneyEntry, opts: MountOptions = {}) {
  const onClose = vi.fn();
  const onDone = vi.fn();
  const onDelete = vi.fn();
  const onSave = vi.fn(async (_data: Record<string, unknown>, _existingEntryId?: number) => 42);
  const onUploadPhotos = vi.fn(opts.upload ?? defaultUpload);
  const onAddProviderPhotos = vi.fn(async (_entryId: number, _group: Record<string, unknown>) => {});
  const sheet = (
    <MJourneyEntrySheet
      entry={sheetEntry}
      galleryPhotos={opts.galleryPhotos ?? []}
      quickCapture={opts.quickCapture ?? false}
      readOnly={opts.readOnly ?? false}
      userId={42}
      trips={[]}
      onClose={onClose}
      onSave={onSave}
      onUploadPhotos={onUploadPhotos}
      onAddProviderPhotos={opts.withProviderHook === false ? undefined : onAddProviderPhotos}
      onDelete={opts.withDelete ? onDelete : undefined}
      onDone={onDone}
    />
  );
  // main.tsx runs the app inside StrictMode, so a handler that is not pure shows
  // its double-invoke here and nowhere else.
  const view = render(opts.strict ? <StrictMode>{sheet}</StrictMode> : sheet);
  return { ...view, onClose, onDone, onDelete, onSave, onUploadPhotos, onAddProviderPhotos };
}

const multiFileInput = () => document.querySelector('input[type="file"][multiple]') as HTMLInputElement;
const dateField = () => document.querySelector('input[type="date"]') as HTMLInputElement;
// The time field is CustomTimePicker's text input, not a native time input — a
// native one paints 12h/24h from the browser locale and ignored the setting (#2067).
const timeField = () => document.querySelector('input[placeholder="00:00"], input[placeholder="2:30 PM"]') as HTMLInputElement;
const jpeg = (name = 'a.jpg') => new File(['x'], name, { type: 'image/jpeg' });

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const revokeSpy = vi.fn();

describe('MJourneyEntrySheet full editor', () => {
  beforeEach(() => {
    toastSpy.mockClear();
    revokeSpy.mockClear();
    window.__addToast = toastSpy;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true, writable: true, value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true, writable: true, value: revokeSpy,
    });
  });

  afterEach(() => {
    delete window.__addToast;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true, writable: true, value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true, writable: true, value: originalRevokeObjectURL,
    });
  });

  it('FE-MOB-JENTRY-003: shows every editor section for a brand new entry', () => {
    mountSheet(buildEntry({ entry_date: '' }));

    expect(screen.getByRole('dialog', { name: 'New Entry' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Give this moment a name...')).toHaveValue('');
    expect(screen.getByPlaceholderText('Write your story...')).toHaveValue('');
    expect(screen.getByText('Pros & Cons')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Mood')).toBeInTheDocument();
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    // An empty entry_date falls back to today (the LOCAL date), an empty gallery locks the picker.
    expect(dateField().value).toBe(localIsoDate());
    expect(timeField()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'From Gallery' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Upload photos' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-004: seeds all fields from an existing entry', () => {
    mountSheet(buildEntry({
      id: 5,
      title: 'Roman holiday',
      story: 'Gelato everywhere',
      entry_time: '14:30:00',
      location_name: 'Rome',
      location_lat: 41.9,
      location_lng: 12.5,
      mood: 'good',
      weather: 'sunny',
      tags: ['food', 'city'],
      pros_cons: { pros: ['Gelato'], cons: ['Queues'] },
    }));

    expect(screen.getByRole('dialog', { name: 'Edit Entry' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Roman holiday')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gelato everywhere')).toBeInTheDocument();
    expect(timeField()).toHaveValue('14:30');
    expect(screen.getByDisplayValue('Rome')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gelato')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Queues')).toBeInTheDocument();
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('city')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' }).className).not.toContain('text-m-muted');
    expect(screen.getByRole('button', { name: 'Sunny' }).className).toContain('bg-m-act');
    expect(screen.getByRole('button', { name: 'Rainy' }).className).toContain('text-m-muted');
  });

  it('FE-MOB-JENTRY-005: saves title, story, date, time, pros, cons, tags, mood and weather', async () => {
    const user = userEvent.setup();
    const { onSave, onDone } = mountSheet(buildEntry());

    await user.type(screen.getByPlaceholderText('Give this moment a name...'), 'Rome');
    await user.type(screen.getByPlaceholderText('Write your story...'), 'Great day');
    fireEvent.change(dateField(), { target: { value: '2026-03-18' } });
    fireEvent.change(timeField(), { target: { value: '18:45' } });

    const [addPro, addCon] = screen.getAllByRole('button', { name: /Add another/ });
    await user.click(addPro);
    await user.click(addPro);
    await user.click(addCon);
    await user.type(screen.getAllByPlaceholderText('Something great...')[0], 'Gelato');
    await user.type(screen.getByPlaceholderText('Not so great...'), 'Crowds');

    const tagInput = screen.getByPlaceholderText('Add tag');
    await user.type(tagInput, 'food{Enter}');
    await user.type(tagInput, 'city,');
    await user.type(tagInput, 'food{Enter}');

    await user.click(screen.getByRole('button', { name: 'Amazing' }));
    await user.click(screen.getByRole('button', { name: 'Rainy' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    // The second (still empty) pro row is dropped and the duplicate tag never lands.
    expect(onSave).toHaveBeenCalledWith({
      title: 'Rome',
      story: 'Great day',
      entry_date: '2026-03-18',
      entry_time: '18:45',
      location_name: null,
      location_lat: null,
      location_lng: null,
      mood: 'amazing',
      weather: 'rainy',
      tags: ['food', 'city'],
      pros_cons: { pros: ['Gelato'], cons: ['Crowds'] },
      type: undefined,
    }, undefined);
  });

  it('FE-MOB-JENTRY-006: removes a pro and a con row again', async () => {
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({
      id: 5,
      pros_cons: { pros: ['Gelato', 'Sun'], cons: ['Queues', 'Heat'] },
    }));

    const pro = screen.getByDisplayValue('Sun').parentElement as HTMLElement;
    await user.click(pro.querySelector('button') as HTMLElement);
    const con = screen.getByDisplayValue('Heat').parentElement as HTMLElement;
    await user.click(con.querySelector('button') as HTMLElement);

    expect(screen.queryByDisplayValue('Sun')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Heat')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ pros_cons: { pros: ['Gelato'], cons: ['Queues'] } });
  });

  it('FE-MOB-JENTRY-007: edits an existing pro and con inline', async () => {
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({
      id: 5,
      pros_cons: { pros: ['Gelato'], cons: ['Queues'] },
    }));

    await user.type(screen.getByDisplayValue('Gelato'), ' bars');
    await user.type(screen.getByDisplayValue('Queues'), ' everywhere');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      pros_cons: { pros: ['Gelato bars'], cons: ['Queues everywhere'] },
    });
  });

  it('FE-MOB-JENTRY-008: removes a tag chip', async () => {
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({ id: 5, tags: ['food', 'city'] }));

    const chip = screen.getByText('city');
    await user.click(chip.querySelector('button') as HTMLElement);
    expect(screen.queryByText('city')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ tags: ['food'] });
  });

  it('FE-MOB-JENTRY-009: promotes a skeleton to a real entry once it has a story', async () => {
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({ id: 9, type: 'skeleton' }));

    await user.type(screen.getByPlaceholderText('Write your story...'), 'Gondolas');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: 'entry' });
  });

  it('FE-MOB-JENTRY-010: promotes a skeleton the user saved without editing (#2008)', async () => {
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({ id: 9, type: 'skeleton', title: 'Venice' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: 'entry' });
  });

  it('FE-MOB-JENTRY-011: queues picked files, reports progress and uploads them on save', async () => {
    const user = userEvent.setup();
    let release: (r: ResilientResult<JourneyPhoto>) => void = () => {};
    const upload: UploadFn = (_entryId, files, cbs) =>
      new Promise<ResilientResult<JourneyPhoto>>(resolve => {
        cbs?.onProgress?.({ done: 1, total: files.length, failed: 0, percent: 50 });
        release = resolve;
      });
    const { onUploadPhotos, onDone } = mountSheet(buildEntry(), { upload });

    const file = jpeg();
    await user.click(screen.getByRole('button', { name: 'Upload photos' }));
    fireEvent.change(multiFileInput(), { target: { files: [file] } });
    await waitFor(() => expect(document.querySelector('img[src="blob:preview"]')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Uploading 1/1…')).toBeInTheDocument();

    release({ succeeded: [], failed: [] });
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onUploadPhotos).toHaveBeenCalledWith(42, [file], expect.anything());
  });

  it('FE-MOB-JENTRY-012: keeps files that failed to upload and warns about them', async () => {
    const user = userEvent.setup();
    const file = jpeg();
    const { onUploadPhotos } = mountSheet(buildEntry());
    onUploadPhotos.mockResolvedValueOnce({ succeeded: [], failed: [file] });

    fireEvent.change(multiFileInput(), { target: { files: [file] } });
    await waitFor(() => expect(document.querySelector('img[src="blob:preview"]')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith('1 of 1 photos failed — save again to retry', 'error', undefined)
    );
    expect(document.querySelector('img[src="blob:preview"]')).toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-013: reports a rejected upload but still finishes the save', async () => {
    const user = userEvent.setup();
    const { onUploadPhotos, onDone } = mountSheet(buildEntry());
    onUploadPhotos.mockRejectedValueOnce(new Error('disk full'));

    fireEvent.change(multiFileInput(), { target: { files: [jpeg()] } });
    await waitFor(() => expect(document.querySelector('img[src="blob:preview"]')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('disk full', 'error', undefined));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-JENTRY-014: ignores an empty file selection and drops a queued file again', async () => {
    const user = userEvent.setup();
    mountSheet(buildEntry());

    fireEvent.change(multiFileInput(), { target: { files: [] } });
    expect(document.querySelector('img[src="blob:preview"]')).not.toBeInTheDocument();

    fireEvent.change(multiFileInput(), { target: { files: [jpeg()] } });
    await waitFor(() => expect(document.querySelector('img[src="blob:preview"]')).toBeInTheDocument());

    const preview = document.querySelector('img[src="blob:preview"]') as HTMLElement;
    await user.click(preview.parentElement!.querySelector('button') as HTMLElement);
    expect(document.querySelector('img[src="blob:preview"]')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-048: mints one preview url per queued file and releases it on unmount', async () => {
    const { unmount } = mountSheet(buildEntry());

    fireEvent.change(multiFileInput(), { target: { files: [jpeg()] } });
    await waitFor(() => expect(document.querySelector('img[src="blob:preview"]')).toBeInTheDocument());
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    // Typing re-renders the tile; the url must not be minted again.
    fireEvent.change(screen.getByPlaceholderText('Give this moment a name...'), { target: { value: 'Ferry' } });
    fireEvent.change(screen.getByPlaceholderText('Give this moment a name...'), { target: { value: 'Ferry day' } });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

    unmount();
    expect(revokeSpy).toHaveBeenCalledWith('blob:preview');
  });

  it('FE-MOB-JENTRY-015: queues gallery photos on a new entry and links them after the save', async () => {
    const linked: unknown[] = [];
    server.use(http.post('/api/journeys/entries/42/link-photo', async ({ request }) => {
      linked.push(await request.json());
      return HttpResponse.json({ id: 200 });
    }));
    const user = userEvent.setup();
    const { onDone } = mountSheet(buildEntry(), { galleryPhotos: [buildGalleryPhoto(200)] });

    await user.click(screen.getByRole('button', { name: 'From Gallery' }));
    await user.click(screen.getAllByAltText('')[0]);

    expect(await screen.findByText('All photos already added')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(linked).toEqual([{ journey_photo_id: 200 }]);
  });

  it('FE-MOB-JENTRY-016: drops a queued gallery photo again so nothing gets linked', async () => {
    let calls = 0;
    server.use(http.post('/api/journeys/entries/42/link-photo', () => {
      calls += 1;
      return HttpResponse.json({ id: 200 });
    }));
    const user = userEvent.setup();
    const { onDone } = mountSheet(buildEntry(), { galleryPhotos: [buildGalleryPhoto(200)] });

    await user.click(screen.getByRole('button', { name: 'From Gallery' }));
    await user.click(screen.getAllByAltText('')[0]);
    await screen.findByText('All photos already added');

    const tile = document.querySelector('.h-16 img')!.parentElement as HTMLElement;
    await user.click(tile.querySelector('button[aria-label="Delete"]') as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(calls).toBe(0);
  });

  it('FE-MOB-JENTRY-017: links a gallery photo straight away on a saved entry', async () => {
    let linked = false;
    server.use(http.post('/api/journeys/entries/5/link-photo', () => {
      linked = true;
      return HttpResponse.json(buildPhoto(200));
    }));
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5 }), { galleryPhotos: [buildGalleryPhoto(200)] });

    await user.click(screen.getByRole('button', { name: 'From Gallery' }));
    await user.click(screen.getAllByAltText('')[0]);

    await waitFor(() => expect(linked).toBe(true));
    expect(await screen.findByText('All photos already added')).toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-018: keeps the picker open when linking a gallery photo fails', async () => {
    let attempts = 0;
    server.use(http.post('/api/journeys/entries/5/link-photo', () => {
      attempts += 1;
      return new HttpResponse(null, { status: 500 });
    }));
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5 }), { galleryPhotos: [buildGalleryPhoto(200)] });

    await user.click(screen.getByRole('button', { name: 'From Gallery' }));
    await user.click(screen.getAllByAltText('')[0]);

    await waitFor(() => expect(attempts).toBe(1));
    expect(screen.queryByText('All photos already added')).not.toBeInTheDocument();
    expect(screen.getAllByAltText('')).toHaveLength(1);
  });

  it('FE-MOB-JENTRY-019: unlinks a photo removed from a saved entry', async () => {
    let unlinked = false;
    server.use(http.delete('/api/journeys/entries/5/photos/100', () => {
      unlinked = true;
      return HttpResponse.json({ ok: true });
    }));
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5, photos: [buildPhoto(100)] }));

    const tile = document.querySelector('img[src="/api/photos/100/thumbnail"]')!.parentElement as HTMLElement;
    await user.click(tile.querySelector('button[aria-label="Delete"]') as HTMLElement);

    await waitFor(() => expect(unlinked).toBe(true));
    expect(document.querySelector('img[src="/api/photos/100/thumbnail"]')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-020: promoting a photo to first persists the new sort order', async () => {
    const patched: Array<{ id: string; body: unknown }> = [];
    server.use(http.patch('/api/journeys/photos/:id', async ({ params, request }) => {
      patched.push({ id: String(params.id), body: await request.json() });
      return HttpResponse.json({ ok: true });
    }));
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5, photos: [buildPhoto(100), buildPhoto(101)] }));

    await user.click(screen.getByRole('button', { name: '1st' }));

    await waitFor(() => expect(patched).toHaveLength(2));
    expect(patched).toEqual([
      { id: '101', body: { sort_order: 0 } },
      { id: '100', body: { sort_order: 1 } },
    ]);
    const order = Array.from(document.querySelectorAll('.h-16 img')).map(i => i.getAttribute('src'));
    expect(order[0]).toBe('/api/photos/101/thumbnail');
  });

  it('FE-MOB-JENTRY-049: promoting a photo under StrictMode still patches each photo once', async () => {
    const patched: Array<{ id: string; body: unknown }> = [];
    server.use(http.patch('/api/journeys/photos/:id', async ({ params, request }) => {
      patched.push({ id: String(params.id), body: await request.json() });
      return HttpResponse.json({ ok: true });
    }));
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5, photos: [buildPhoto(100), buildPhoto(101)] }), { strict: true });

    await user.click(screen.getByRole('button', { name: '1st' }));

    await waitFor(() => expect(patched.length).toBeGreaterThanOrEqual(2));
    // Let a doubled batch land before counting, otherwise the extra PATCHes slip in
    // after the assertion.
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(patched.map(p => p.id)).toEqual(['101', '100']);
  });

  it('FE-MOB-JENTRY-050: a refused reorder snaps the strip back and says so', async () => {
    let attempts = 0;
    server.use(http.patch('/api/journeys/photos/:id', () => {
      attempts += 1;
      return HttpResponse.json({ error: 'sort rejected' }, { status: 500 });
    }));
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5, photos: [buildPhoto(100), buildPhoto(101)] }));

    await user.click(screen.getByRole('button', { name: '1st' }));

    await waitFor(() => expect(attempts).toBe(2));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith('sort rejected', 'error', undefined));
    const order = Array.from(document.querySelectorAll('.h-16 img')).map(i => i.getAttribute('src'));
    expect(order).toEqual(['/api/photos/100/thumbnail', '/api/photos/101/thumbnail']);
  });

  it('FE-MOB-JENTRY-021: toggles mood and weather chips back off', async () => {
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({ id: 5, mood: 'rough', weather: 'cold' }));

    await user.click(screen.getByRole('button', { name: 'Rough' }));
    await user.click(screen.getByRole('button', { name: 'Snowy' }));
    expect(screen.getByRole('button', { name: 'Rough' }).className).toContain('text-m-muted');
    expect(screen.getByRole('button', { name: 'Snowy' }).className).not.toContain('bg-m-act');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ mood: null, weather: null });
  });

  it('FE-MOB-JENTRY-022: picks a searched location and stores its coordinates', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({
      places: [
        { name: 'Roma Termini', address: 'Piazza dei Cinquecento', lat: '41.9', lng: '12.5' },
        { name: 'Roma Ostiense', lat: 41.86, lng: 12.48 },
      ],
    })));
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({ id: 5 }));
    const input = screen.getByPlaceholderText('Search location...');

    // The second keystroke has to clear the timer the first one armed.
    fireEvent.change(input, { target: { value: 'Ro' } });
    fireEvent.change(input, { target: { value: 'Rom' } });

    const hit = await screen.findByText('Roma Termini', {}, { timeout: 3000 });
    expect(screen.getByText('Piazza dei Cinquecento')).toBeInTheDocument();
    expect(screen.getByText('Roma Ostiense')).toBeInTheDocument();
    await user.click(hit);

    expect(screen.getByDisplayValue('Roma Termini')).toBeInTheDocument();
    expect(screen.queryByText('Piazza dei Cinquecento')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      location_name: 'Roma Termini', location_lat: 41.9, location_lng: 12.5,
    });
  });

  it('FE-MOB-JENTRY-023: clears the suggestions for a query shorter than two characters', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({
      places: [{ name: 'Roma Termini', address: 'Piazza dei Cinquecento', lat: 41.9, lng: 12.5 }],
    })));
    mountSheet(buildEntry({ id: 5 }));
    const input = screen.getByPlaceholderText('Search location...');

    // Focus without results must not open the dropdown.
    fireEvent.focus(input);
    expect(screen.queryByText('Roma Termini')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Roma' } });
    await screen.findByText('Roma Termini', {}, { timeout: 3000 });

    // Re-focusing with results in hand keeps the dropdown open.
    fireEvent.focus(input);
    expect(screen.getByText('Roma Termini')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'R' } });
    expect(screen.queryByText('Roma Termini')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-035: shows no suggestions when the search payload carries no places', async () => {
    let calls = 0;
    server.use(http.post('/api/maps/search', () => {
      calls += 1;
      return HttpResponse.json({});
    }));
    mountSheet(buildEntry({ id: 5 }));

    fireEvent.change(screen.getByPlaceholderText('Search location...'), { target: { value: 'Roma' } });

    await waitFor(() => expect(calls).toBe(1), { timeout: 3000 });
    expect(document.querySelector('.absolute.left-0.right-0.top-full')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-036: leaves the strip untouched when the link call returns nothing', async () => {
    server.use(http.post('/api/journeys/entries/5/link-photo', () => HttpResponse.json(null)));
    const user = userEvent.setup();
    mountSheet(
      buildEntry({ id: 5, photos: undefined as unknown as JourneyPhoto[] }),
      { galleryPhotos: [buildGalleryPhoto(200)] },
    );

    await user.click(screen.getByRole('button', { name: 'From Gallery' }));
    await user.click(screen.getAllByAltText('')[0]);

    await waitFor(() => expect(screen.getAllByAltText('')).toHaveLength(1));
    expect(document.querySelector('.h-16 img')).not.toBeInTheDocument();
    expect(screen.queryByText('All photos already added')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-037: a partly accepted order keeps what the server took', async () => {
    const patched: number[] = [];
    server.use(http.patch('/api/journeys/photos/:id', ({ params }) => {
      const id = Number(params.id);
      patched.push(id);
      if (id === 100) return new HttpResponse(null, { status: 500 });
      return HttpResponse.json({ ok: true });
    }));
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5, photos: [buildPhoto(100), buildPhoto(101)] }));

    await user.click(screen.getByRole('button', { name: '1st' }));

    await waitFor(() => expect(patched).toEqual([101, 100]));
    // 101 is first on the server now; snapping the strip back would hide that.
    const order = Array.from(document.querySelectorAll('.h-16 img')).map(i => i.getAttribute('src'));
    expect(order).toEqual(['/api/photos/101/thumbnail', '/api/photos/100/thumbnail']);
  });

  it('FE-MOB-JENTRY-024: shows no suggestions when the location search fails', async () => {
    let calls = 0;
    server.use(http.post('/api/maps/search', () => {
      calls += 1;
      return new HttpResponse(null, { status: 500 });
    }));
    mountSheet(buildEntry({ id: 5 }));

    fireEvent.change(screen.getByPlaceholderText('Search location...'), { target: { value: 'Roma' } });

    await waitFor(() => expect(calls).toBe(1), { timeout: 3000 });
    expect(screen.getByDisplayValue('Roma')).toBeInTheDocument();
    expect(document.querySelector('.absolute.left-0.right-0.top-full')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-025: asks before discarding a dirty editor', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    const { onClose } = mountSheet(buildEntry({ id: 5, title: 'Rome' }));

    await user.type(screen.getByDisplayValue('Rome'), '!');
    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[1]);

    expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Discard them?');
    expect(onClose).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('FE-MOB-JENTRY-026: closes an untouched editor from the header without asking', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    const { onClose } = mountSheet(buildEntry({ id: 5, title: 'Rome' }));

    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('FE-MOB-JENTRY-027: offers deleting the entry', async () => {
    const user = userEvent.setup();
    const { onDelete } = mountSheet(buildEntry({ id: 5 }), { withDelete: true });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('MJourneyEntrySheet read-only', () => {
  it('FE-MOB-JENTRY-028: renders a contributor entry without any editing affordance', () => {
    mountSheet(buildEntry({
      id: 5,
      title: 'Roman holiday',
      story: 'Gelato everywhere',
      location_name: 'Rome',
      location_lat: 41.9,
      location_lng: 12.5,
      mood: 'good',
      weather: 'sunny',
      tags: ['food'],
      pros_cons: { pros: ['Gelato'], cons: ['Queues'] },
      photos: [buildPhoto(100), buildPhoto(101)],
    }), { readOnly: true, withDelete: true, galleryPhotos: [buildGalleryPhoto(200)] });

    expect(screen.getByText('Roman holiday')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Give this moment a name...')).not.toBeInTheDocument();
    expect(screen.getByText('Gelato everywhere')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Write your story...')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload photos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'From Gallery' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1st' })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /Add another/ })).toHaveLength(0);
    expect(screen.getByDisplayValue('Gelato')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('Queues')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('Rome')).toHaveAttribute('readonly');
    expect(dateField()).toBeDisabled();
    expect(timeField()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Good' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sunny' })).toBeDisabled();
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add tag')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-029: hides story, pros/cons and tags when a read-only entry has none', () => {
    mountSheet(buildEntry({ id: 5 }), { readOnly: true });

    expect(screen.getByText('Give this moment a name...')).toBeInTheDocument();
    expect(screen.queryByText('Pros & Cons')).not.toBeInTheDocument();
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    expect(screen.getByText('Mood')).toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-030: closes a read-only sheet without a discard prompt', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    const { onClose } = mountSheet(buildEntry({ id: 5, title: 'Rome' }), { readOnly: true });

    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[1]);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });
});

describe('MJourneyEntrySheet quick capture edge cases', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-MOB-JENTRY-031: shows a translated error when the device has no geolocation', async () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    mountSheet(buildEntry({ entry_time: '09:07' }), { quickCapture: true });

    expect(await screen.findByText('Could not determine your location.')).toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-032: skips the location lookup when the entry already has coordinates', () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } });
    mountSheet(
      buildEntry({ location_lat: 41.9, location_lng: 12.5, location_name: 'Rome' }),
      { quickCapture: true },
    );

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Rome')).toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-038: still applies the weather when reverse geocoding fails', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((s: PositionCallback) =>
          s({ coords: { latitude: 1.35, longitude: 103.8 } } as GeolocationPosition)),
      },
    });
    vi.spyOn(mapsApi, 'reverse').mockRejectedValue(new Error('nominatim down'));
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 31, main: 'Clear', description: 'clear sky', type: 'current',
    });
    mountSheet(buildEntry(), { quickCapture: true });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sunny' }).className).toContain('bg-m-act'));
    expect(screen.getByPlaceholderText('Search location...')).toHaveValue('');
  });

  it('FE-MOB-JENTRY-033: ignores a position that only arrives after the sheet is gone', async () => {
    let success: PositionCallback | undefined;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: vi.fn((s: PositionCallback) => { success = s }) },
    });
    const reverse = vi.spyOn(mapsApi, 'reverse');
    const { unmount } = mountSheet(buildEntry(), { quickCapture: true });

    unmount();
    await act(async () => {
      success?.({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition);
    });

    expect(reverse).not.toHaveBeenCalled();
  });

  it('FE-MOB-JENTRY-034: keeps only the newest lookup when the effect restarts mid-flight', async () => {
    const resolvers: Array<(v: { name: string; address: string }) => void> = [];
    const failures: PositionErrorCallback[] = [];
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((s: PositionCallback, e: PositionErrorCallback) => {
          failures.push(e);
          s({ coords: { latitude: 1.35, longitude: 103.8 } } as GeolocationPosition);
        }),
      },
    });
    vi.spyOn(mapsApi, 'reverse').mockImplementation(
      () => new Promise(resolve => {
        resolvers.push(resolve as (v: { name: string; address: string }) => void);
      })
    );
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 0, main: '', description: '', type: 'current', error: 'unavailable',
    });

    const base = buildEntry();
    const props = {
      galleryPhotos: [],
      quickCapture: true,
      onClose: vi.fn(),
      onSave: vi.fn(async () => 42),
      onUploadPhotos: vi.fn(defaultUpload),
      onDone: vi.fn(),
    };
    const { rerender } = render(<MJourneyEntrySheet entry={base} {...props} />);
    await waitFor(() => expect(resolvers).toHaveLength(1));

    rerender(<MJourneyEntrySheet entry={{ ...base, entry_date: '2026-03-16' }} {...props} />);
    await waitFor(() => expect(resolvers).toHaveLength(2));

    await act(async () => {
      resolvers[0]({ name: 'Stale', address: 'Stale' });
      resolvers[1]({ name: 'Fresh', address: 'Fresh' });
    });

    expect(await screen.findByDisplayValue('Fresh')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Stale')).not.toBeInTheDocument();

    // Late failures must not paint anything: the stale lookup was abandoned
    // by the effect restart, and the fresh lookup's one-shot promise already
    // resolved with a position, so a trailing error callback is a no-op.
    await act(async () => {
      failures[0]({ message: 'stale failure' } as GeolocationPositionError);
      failures[1]({ message: '' } as GeolocationPositionError);
    });
    expect(screen.queryByText('stale failure')).not.toBeInTheDocument();
    expect(screen.queryByText('Could not determine your location.')).not.toBeInTheDocument();
    expect(screen.queryByText(/Location access was denied/)).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-039: the location field button fills the device position and reverse geocodes it', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((s: PositionCallback) =>
          s({ coords: { latitude: 41.9, longitude: 12.5 } } as GeolocationPosition)),
      },
    });
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: 'Colosseum', address: 'Rome, Italy' });
    mountSheet(buildEntry());

    fireEvent.click(screen.getByRole('button', { name: 'Use my current location' }));

    expect(await screen.findByDisplayValue('Colosseum')).toBeInTheDocument();
    expect(mapsApi.reverse).toHaveBeenCalledWith(41.9, 12.5, 'en');
  });

  it('FE-MOB-JENTRY-040: the location field button surfaces a translated denial inline', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_s: PositionCallback, e: PositionErrorCallback) =>
          e({
            code: 1, message: 'denied',
            PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3,
          } as GeolocationPositionError)),
      },
    });
    mountSheet(buildEntry());

    fireEvent.click(screen.getByRole('button', { name: 'Use my current location' }));

    expect(await screen.findByText('Location access was denied. Allow it in your browser settings and try again.')).toBeInTheDocument();
  });
});

// FE-MOB-JENTRY-041 to FE-MOB-JENTRY-047 — external photo providers in the phone
// editor (#1808), mirroring the desktop EntryEditor mechanics.

const immichAddon = { id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true };

function seedAddons(addons: Array<Record<string, unknown>>) {
  useAddonStore.setState({ addons: addons as never, loaded: true });
}

function useConnectedImmich() {
  server.use(
    http.get('/api/integrations/memories/immich/status', () => HttpResponse.json({ connected: true })),
    http.post('/api/integrations/memories/immich/search', () => HttpResponse.json({
      assets: [{ id: 'asset-1', takenAt: '2026-03-15T09:00:00.000Z', mediaType: 'image' }],
      hasMore: false,
    })),
  );
}

describe('MJourneyEntrySheet external photos', () => {
  beforeEach(() => {
    toastSpy.mockClear();
    window.__addToast = toastSpy;
  });

  afterEach(() => {
    delete window.__addToast;
    useAddonStore.setState({ addons: [], loaded: false });
  });

  it('FE-MOB-JENTRY-041: hides the button while no provider is connected', async () => {
    let probes = 0;
    seedAddons([immichAddon]);
    server.use(http.get('/api/integrations/memories/immich/status', () => {
      probes += 1;
      return HttpResponse.json({ connected: false });
    }));
    mountSheet(buildEntry({ id: 5 }));

    await waitFor(() => expect(probes).toBe(1));
    expect(screen.queryByRole('button', { name: 'External photos' })).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-042: opens the embedded picker for a connected provider', async () => {
    seedAddons([immichAddon, { id: 'budget', name: 'Budget', type: 'feature', icon: 'wallet', enabled: true }]);
    useConnectedImmich();
    const user = userEvent.setup();
    mountSheet(buildEntry({ id: 5, location_lat: 41.9, location_lng: 12.5, location_name: 'Rome' }));

    await user.click(await screen.findByRole('button', { name: 'External photos' }));

    expect(await screen.findByTestId('journey-provider-picker-embedded')).toBeInTheDocument();
    expect(screen.getByText('Nearby photos first · Rome')).toBeInTheDocument();
    // A single provider needs no chip row.
    expect(screen.queryByTestId('journey-external-provider-immich')).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-043: stays out of the quick capture sheet', async () => {
    seedAddons([immichAddon]);
    useConnectedImmich();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    mountSheet(buildEntry(), { quickCapture: true });

    expect(await screen.findByRole('button', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'External photos' })).not.toBeInTheDocument();
  });

  it('FE-MOB-JENTRY-044: queues a picked photo and sends it after the save', async () => {
    seedAddons([immichAddon]);
    useConnectedImmich();
    const user = userEvent.setup();
    const { onSave, onAddProviderPhotos, onDone } = mountSheet(buildEntry({ id: 5 }));

    await user.click(await screen.findByRole('button', { name: 'External photos' }));
    await user.click(await screen.findByAltText(''));
    await user.click(screen.getByRole('button', { name: 'Add (1)' }));

    const queued = await screen.findByRole('button', { name: /1 queued · Clear/ });
    expect(queued).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onAddProviderPhotos).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ provider: 'immich', assetIds: ['asset-1'] }),
    ));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-JENTRY-045: drops the queue again from the panel header', async () => {
    seedAddons([immichAddon]);
    useConnectedImmich();
    const user = userEvent.setup();
    const { onAddProviderPhotos } = mountSheet(buildEntry({ id: 5 }));

    await user.click(await screen.findByRole('button', { name: 'External photos' }));
    await user.click(await screen.findByAltText(''));
    await user.click(screen.getByRole('button', { name: 'Add (1)' }));
    await user.click(await screen.findByRole('button', { name: /1 queued · Clear/ }));

    expect(screen.queryByRole('button', { name: /queued/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onAddProviderPhotos).not.toHaveBeenCalled());
  });

  it('FE-MOB-JENTRY-046: a failed provider add keeps the queue and does not create a second entry', async () => {
    seedAddons([immichAddon]);
    useConnectedImmich();
    const user = userEvent.setup();
    // A brand new entry: the first save creates it, the provider write then fails.
    const { onSave, onAddProviderPhotos, onDone } = mountSheet(buildEntry());
    onAddProviderPhotos.mockRejectedValueOnce(new Error('immich down'));

    await user.click(await screen.findByRole('button', { name: 'External photos' }));
    await user.click(await screen.findByAltText(''));
    await user.click(screen.getByRole('button', { name: 'Add (1)' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith('1 photo groups failed — save again to retry', 'error', undefined)
    );
    expect(onDone).not.toHaveBeenCalled();
    expect(onSave.mock.calls[0][1]).toBeUndefined();

    // Retry: the sheet hands back the id it already persisted, so the caller
    // updates that entry instead of creating a second one.
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave.mock.calls[1][1]).toBe(42);
    expect(onAddProviderPhotos).toHaveBeenCalledTimes(2);
  });

  it('FE-MOB-JENTRY-047: a skeleton with only provider photos is promoted to an entry', async () => {
    seedAddons([immichAddon]);
    useConnectedImmich();
    const user = userEvent.setup();
    const { onSave } = mountSheet(buildEntry({ id: 9, type: 'skeleton', title: 'Venice' }));

    await user.click(await screen.findByRole('button', { name: 'External photos' }));
    await user.click(await screen.findByAltText(''));
    await user.click(screen.getByRole('button', { name: 'Add (1)' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: 'entry' });
  });
});
