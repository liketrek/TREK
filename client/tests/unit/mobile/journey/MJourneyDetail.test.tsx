// FE-MOB-JDET-001 to FE-MOB-JDET-037
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '../../../helpers/render';
import MJourneyDetail from '../../../../src/mobile/screens/journey/MJourneyDetail';
import { addonsApi, journeyApi, memoriesApi } from '../../../../src/api/client';
import { useJourneyStore } from '../../../../src/store/journeyStore';
import { useAuthStore } from '../../../../src/store/authStore';
import type { GalleryPhoto, JourneyDetail, JourneyEntry } from '../../../../src/store/journeyStore';

const mocks = vi.hoisted(() => ({
  detail: {} as Record<string, unknown>,
  focusMarker: vi.fn(),
  highlightMarker: vi.fn(),
  captured: {} as Record<string, Record<string, unknown>>,
}));

vi.mock('../../../../src/pages/journeyDetail/useJourneyDetail', () => ({
  useJourneyDetail: () => mocks.detail,
}));


vi.mock('../../../../src/components/Journey/JourneyMapAuto', async () => {
  const React = await import('react');
  const Comp = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      focusMarker: mocks.focusMarker,
      highlightMarker: mocks.highlightMarker,
      invalidateSize: vi.fn(),
    }));
    const entries = props.entries as { id: string }[];
    const onMarkerClick = props.onMarkerClick as ((id: string) => void) | undefined;
    return (
      <div data-testid="journey-map" data-active={String(props.activeMarkerId ?? '')} data-dark={String(props.dark)}>
        {entries.map(e => (
          <button key={e.id} type="button" onClick={() => onMarkerClick?.(e.id)}>{`marker-${e.id}`}</button>
        ))}
      </div>
    );
  });
  Comp.displayName = 'MockJourneyMapAuto';
  return { __esModule: true, default: Comp };
});

vi.mock('../../../../src/components/Journey/PhotoLightbox', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.captured.lightbox = props;
    return <div data-testid="lightbox" />;
  },
}));

vi.mock('../../../../src/components/Journey/ContributorInviteDialog', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.captured.invite = props;
    return <div data-testid="invite-dialog" />;
  },
}));

vi.mock('../../../../src/components/Journey/JourneyDetailPageProviderPicker', () => ({
  ProviderPicker: (props: Record<string, unknown>) => {
    mocks.captured.picker = props;
    return <div data-testid="provider-picker" />;
  },
}));

vi.mock('../../../../src/mobile/screens/journey/MJourneyEntrySheet', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.captured.entrySheet = props;
    return <div data-testid="entry-sheet" data-quick={String(props.quickCapture)} data-readonly={String(props.readOnly)} />;
  },
}));

vi.mock('../../../../src/mobile/screens/journey/MJourneySettingsSheet', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.captured.settings = props;
    return <div data-testid="settings-sheet" />;
  },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

function buildEntry(over: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 1,
    journey_id: 12,
    author_id: 1,
    type: 'entry',
    title: 'Arrival',
    story: null,
    entry_date: '2026-05-01',
    entry_time: '10:00',
    location_name: 'Tokyo',
    location_lat: 35.6,
    location_lng: 139.7,
    mood: null,
    weather: null,
    tags: [],
    pros_cons: null,
    visibility: 'private',
    sort_order: 0,
    photos: [],
    created_at: 0,
    updated_at: 0,
    ...over,
  };
}

function buildGalleryPhoto(over: Partial<GalleryPhoto> = {}): GalleryPhoto {
  return {
    id: 501,
    journey_id: 12,
    photo_id: 900,
    caption: 'Shrine',
    shared: 1,
    sort_order: 0,
    created_at: 0,
    provider: 'local',
    asset_id: null,
    owner_id: 1,
    file_path: null,
    thumbnail_path: 'thumbs/900.jpg',
    media_type: 'image',
    ...over,
  };
}

function buildDetail(over: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 12,
    user_id: 1,
    title: 'Japan 2026',
    subtitle: null,
    cover_gradient: null,
    cover_image: null,
    status: 'active',
    created_at: 0,
    updated_at: 0,
    entries: [buildEntry(), buildEntry({ id: 2, title: 'Kyoto', entry_date: '2026-05-02' })],
    gallery: [],
    trips: [],
    contributors: [{ journey_id: 12, user_id: 5, role: 'owner', added_at: 0, username: 'maurice', avatar: null }],
    stats: { entries: 2, photos: 0, places: 0 },
    ...over,
  };
}

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

function buildHook(over: Record<string, unknown> = {}): Record<string, unknown> {
  const current = (over.current as JourneyDetail | null | undefined) ?? buildDetail();
  return {
    id: '12',
    navigate: vi.fn(),
    toast,
    t: (key: string) => key,
    locale: 'en-US',
    current,
    loading: false,
    canEditEntries: true,
    canEditJourney: true,
    view: 'timeline',
    setView: vi.fn(),
    editingEntry: null,
    setEditingEntry: vi.fn(),
    lightbox: null,
    setLightbox: vi.fn(),
    deleteTarget: null,
    setDeleteTarget: vi.fn(),
    showInvite: false,
    setShowInvite: vi.fn(),
    showSettings: false,
    setShowSettings: vi.fn(),
    hideSkeletons: false,
    setHideSkeletons: vi.fn(),
    sidebarMapItems: (current?.entries ?? []).map(e => ({ id: String(e.id), lat: 1, lng: 2, title: e.title ?? '' })),
    loadJourney: vi.fn(),
    updateEntry: vi.fn(async () => {}),
    deleteEntry: vi.fn(async () => {}),
    uploadPhotos: vi.fn(async () => ({ succeeded: [], failed: [] })),
    ...over,
  };
}

function setup(over: Record<string, unknown> = {}) {
  mocks.detail = buildHook(over);
  const view = render(<MJourneyDetail />);
  return { ...view, hook: mocks.detail };
}

const journeyStoreInitial = useJourneyStore.getState();
let uploadGalleryPhotos: ReturnType<typeof vi.fn>;
let createEntry: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.captured = {};
  uploadGalleryPhotos = vi.fn(async () => ({ succeeded: [], failed: [] }));
  createEntry = vi.fn(async () => buildEntry({ id: 77 }));
  useJourneyStore.setState({ ...journeyStoreInitial, uploadGalleryPhotos, createEntry } as never, true);
  useAuthStore.setState({ user: { id: 5, username: 'maurice' } } as never);
  vi.spyOn(addonsApi, 'enabled').mockResolvedValue({ addons: [] });
  vi.spyOn(memoriesApi, 'status').mockResolvedValue({ connected: false });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useJourneyStore.setState(journeyStoreInitial, true);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MJourneyDetail', () => {
  it('FE-MOB-JDET-001: shows a spinner while the journey is loading', () => {
    setup({ loading: true, current: null });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('journey-map')).not.toBeInTheDocument();
  });

  it('FE-MOB-JDET-002: renders one timeline card per entry with the map behind it', () => {
    setup();
    expect(screen.getByTestId('journey-map')).toBeInTheDocument();
    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByTestId('journey-map')).toHaveAttribute('data-active', '1');
  });

  it('FE-MOB-JDET-003: hideSkeletons drops the trip-derived skeleton entries', () => {
    const current = buildDetail({ entries: [buildEntry(), buildEntry({ id: 3, type: 'skeleton', title: 'Suggested' })] });
    setup({ current, hideSkeletons: true });
    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.queryByText('Suggested')).not.toBeInTheDocument();
  });

  it('FE-MOB-JDET-004: tapping the centred card opens the entry sheet', () => {
    const { hook } = setup();
    fireEvent.click(screen.getByText('Arrival'));
    expect(hook.setEditingEntry).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('FE-MOB-JDET-005: tapping an off-centre card focuses it on the map instead of opening it', () => {
    const { hook } = setup();
    fireEvent.click(screen.getByText('Kyoto'));
    expect(hook.setEditingEntry).not.toHaveBeenCalled();
    expect(mocks.focusMarker).toHaveBeenCalledWith('2');
    expect(screen.getByTestId('journey-map')).toHaveAttribute('data-active', '2');
  });

  it('FE-MOB-JDET-006: clicking a map marker centres the matching card', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'marker-2' }));
    expect(screen.getByTestId('journey-map')).toHaveAttribute('data-active', '2');
  });

  it('FE-MOB-JDET-007: a marker without a matching entry leaves the selection alone', () => {
    const current = buildDetail();
    setup({
      current,
      sidebarMapItems: [{ id: '99', lat: 1, lng: 2, title: 'orphan' }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'marker-99' }));
    expect(screen.getByTestId('journey-map')).toHaveAttribute('data-active', '1');
  });

  it('FE-MOB-JDET-008: an entry with no marker clears the highlight when it is centred', () => {
    const current = buildDetail();
    setup({ current, sidebarMapItems: [{ id: '1', lat: 1, lng: 2, title: 'Arrival' }] });
    fireEvent.click(screen.getByText('Kyoto'));
    expect(mocks.highlightMarker).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-JDET-009: the segment control switches between the journey and gallery tabs', () => {
    const { hook } = setup();
    fireEvent.click(screen.getByRole('button', { name: /journey.share.gallery/ }));
    expect(hook.setView).toHaveBeenCalledWith('gallery');
    fireEvent.click(screen.getByRole('button', { name: /journey.detail.journeyTab/ }));
    expect(hook.setView).toHaveBeenCalledWith('timeline');
  });

  it('FE-MOB-JDET-010: back navigates to the journey list', () => {
    const { hook } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'journey.detail.backToJourney' }));
    expect(hook.navigate).toHaveBeenCalledWith('/journey');
  });

  it('FE-MOB-JDET-011: the gallery tab shows the empty state when there are no photos', () => {
    setup({ view: 'gallery' });
    expect(screen.getByText('journey.detail.noPhotos')).toBeInTheDocument();
  });

  it('FE-MOB-JDET-012: gallery photos open the lightbox at the tapped index', () => {
    const gallery = [buildGalleryPhoto(), buildGalleryPhoto({ id: 502, photo_id: 901, caption: null })];
    const { hook } = setup({ view: 'gallery', current: buildDetail({ gallery }) });

    const tiles = screen.getAllByRole('button').filter(b => b.querySelector('img'));
    fireEvent.click(tiles[1]);
    expect(hook.setLightbox).toHaveBeenCalledWith({
      index: 1,
      photos: [
        expect.objectContaining({ id: 501, src: '/api/photos/900/original', caption: 'Shrine' }),
        expect.objectContaining({ id: 502, src: '/api/photos/901/original', caption: null }),
      ],
    });
  });

  it('FE-MOB-JDET-013: a video without a poster renders a placeholder tile plus the play badge', () => {
    const gallery = [buildGalleryPhoto({ media_type: 'video', thumbnail_path: null })];
    setup({ view: 'gallery', current: buildDetail({ gallery }) });
    expect(document.querySelector('img')).not.toBeInTheDocument();
    expect(document.querySelector('.absolute.inset-0.flex.items-center')).toBeInTheDocument();
  });

  it('FE-MOB-JDET-014: uploading from the device sends the picked files and reloads', async () => {
    const { hook, container } = setup({ view: 'gallery' });
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(uploadGalleryPhotos).toHaveBeenCalledWith(12, [file]));
    expect(toast.success).toHaveBeenCalledWith('journey.photosUploaded');
    expect(hook.loadJourney).toHaveBeenCalledWith(12);
  });

  it('FE-MOB-JDET-015: a partially failed upload reports the failure count', async () => {
    const failed = new File(['x'], 'bad.jpg', { type: 'image/jpeg' });
    uploadGalleryPhotos.mockResolvedValueOnce({ succeeded: [], failed: [failed] });
    const { container } = setup({ view: 'gallery' });
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [failed] } });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('journey.editor.uploadPartialFailed'));
  });

  it('FE-MOB-JDET-016: a rejected upload surfaces the API error', async () => {
    uploadGalleryPhotos.mockRejectedValueOnce(new Error('disk full'));
    const { container } = setup({ view: 'gallery' });
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'p.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('disk full'));
  });

  it('FE-MOB-JDET-017: an empty file selection does not upload', () => {
    const { container } = setup({ view: 'gallery' });
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(uploadGalleryPhotos).not.toHaveBeenCalled();
  });

  it('FE-MOB-JDET-018: a connected photo provider turns the upload button into a source chooser', async () => {
    vi.mocked(addonsApi.enabled).mockResolvedValue({
      addons: [
        { id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true },
        { id: 'legacy', name: 'Legacy', type: 'other', enabled: true },
      ],
    });
    vi.mocked(memoriesApi.status).mockResolvedValue({ connected: true });
    setup({ view: 'gallery' });

    fireEvent.click(await screen.findByRole('button', { name: 'common.upload' }));
    expect(await screen.findByText('mobileJourney.uploadFromDevice')).toBeInTheDocument();
    fireEvent.click(screen.getByText('mobileJourney.browseProvider'));
    expect(await screen.findByTestId('provider-picker')).toBeInTheDocument();
  });

  it('FE-MOB-JDET-019: adding provider photos reports the count and reloads', async () => {
    vi.mocked(addonsApi.enabled).mockResolvedValue({
      addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true }],
    });
    vi.mocked(memoriesApi.status).mockResolvedValue({ connected: true });
    const toGallery = vi.spyOn(journeyApi, 'addProviderPhotosToGallery').mockResolvedValue({ added: 3 });
    const toEntry = vi.spyOn(journeyApi, 'addProviderPhotos').mockResolvedValue({ added: 1 });
    const { hook } = setup({ view: 'gallery' });

    fireEvent.click(await screen.findByRole('button', { name: 'common.upload' }));
    fireEvent.click(screen.getByText('mobileJourney.browseProvider'));
    await screen.findByTestId('provider-picker');

    const onAdd = mocks.captured.picker.onAdd as (g: { assetIds: string[] }[], entryId?: number) => Promise<void>;
    await onAdd([{ assetIds: ['a1'] }], undefined);
    expect(toGallery).toHaveBeenCalledWith(12, 'immich', ['a1'], undefined, undefined);
    expect(toast.success).toHaveBeenCalledWith('journey.photosAdded');
    expect(hook.loadJourney).toHaveBeenCalledWith(12);

    await onAdd([{ assetIds: ['a2'] }], 1);
    expect(toEntry).toHaveBeenCalledWith(1, 'immich', ['a2'], undefined, undefined, undefined);
  });

  it('FE-MOB-JDET-020: a failed provider add reports the error instead of a success', async () => {
    vi.mocked(addonsApi.enabled).mockResolvedValue({
      addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true }],
    });
    vi.mocked(memoriesApi.status).mockResolvedValue({ connected: true });
    vi.spyOn(journeyApi, 'addProviderPhotosToGallery').mockRejectedValue(new Error('boom'));
    setup({ view: 'gallery' });

    fireEvent.click(await screen.findByRole('button', { name: 'common.upload' }));
    fireEvent.click(screen.getByText('mobileJourney.browseProvider'));
    await screen.findByTestId('provider-picker');

    const onAdd = mocks.captured.picker.onAdd as (g: { assetIds: string[] }[], entryId?: number) => Promise<void>;
    await onAdd([{ assetIds: ['a1'] }], undefined);
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('FE-MOB-JDET-021: the entry sheet creates a new entry in quick-capture mode', async () => {
    const { hook } = setup({ editingEntry: buildEntry({ id: 0, title: null }) });
    const sheet = mocks.captured.entrySheet;
    expect(screen.getByTestId('entry-sheet')).toHaveAttribute('data-quick', 'true');
    expect(sheet.onDelete).toBeUndefined();

    const onSave = sheet.onSave as (d: Record<string, unknown>) => Promise<number>;
    await expect(onSave({ title: 'Fresh' })).resolves.toBe(77);
    expect(createEntry).toHaveBeenCalledWith(12, { title: 'Fresh' });

    (sheet.onDone as () => void)();
    expect(hook.setEditingEntry).toHaveBeenCalledWith(null);
    expect(hook.loadJourney).toHaveBeenCalledWith(12);
  });

  it('FE-MOB-JDET-022: editing an existing entry updates it and can hand off to the delete confirm', async () => {
    const entry = buildEntry({ id: 4, title: 'Old' });
    const { hook } = setup({ editingEntry: entry });
    const sheet = mocks.captured.entrySheet;

    const onSave = sheet.onSave as (d: Record<string, unknown>) => Promise<number>;
    await expect(onSave({ title: 'New' })).resolves.toBe(4);
    expect(hook.updateEntry).toHaveBeenCalledWith(4, { title: 'New' });

    (sheet.onDelete as () => void)();
    expect(hook.setEditingEntry).toHaveBeenCalledWith(null);
    expect(hook.setDeleteTarget).toHaveBeenCalledWith(entry);
  });

  it('FE-MOB-JDET-023: a read-only viewer gets the sheet without a delete action', () => {
    setup({ canEditEntries: false, editingEntry: buildEntry({ id: 4 }) });
    expect(screen.getByTestId('entry-sheet')).toHaveAttribute('data-readonly', 'true');
    expect(mocks.captured.entrySheet.onDelete).toBeUndefined();
  });

  it('FE-MOB-JDET-024: confirming the delete removes the entry and reloads', async () => {
    const target = buildEntry({ id: 4, title: 'Old' });
    const { hook } = setup({ deleteTarget: target });
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));

    await waitFor(() => expect(hook.deleteEntry).toHaveBeenCalledWith(4));
    expect(hook.setDeleteTarget).toHaveBeenCalledWith(null);
    expect(hook.loadJourney).toHaveBeenCalledWith(12);
  });

  it('FE-MOB-JDET-025: settings and invite dialogs wire their callbacks back into the hook', () => {
    const { hook } = setup({ showSettings: true, showInvite: true });

    expect(screen.getByTestId('settings-sheet')).toBeInTheDocument();
    (mocks.captured.settings.onSaved as () => void)();
    expect(hook.setShowSettings).toHaveBeenCalledWith(false);
    (mocks.captured.settings.onOpenInvite as () => void)();
    expect(hook.setShowInvite).toHaveBeenCalledWith(true);
    (mocks.captured.settings.onRefresh as () => void)();

    expect(screen.getByTestId('invite-dialog')).toBeInTheDocument();
    expect(mocks.captured.invite.existingUserIds).toEqual([5]);
    (mocks.captured.invite.onInvited as () => void)();
    expect(hook.setShowInvite).toHaveBeenCalledWith(false);
    expect(hook.loadJourney).toHaveBeenCalledWith(12);
  });

  it('FE-MOB-JDET-026: the overflow sheet opens the settings for an owner only', () => {
    const { hook, unmount } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'files.menu' }));
    fireEvent.click(screen.getByText('journey.settings.title'));
    expect(hook.setShowSettings).toHaveBeenCalledWith(true);
    unmount();

    setup({ canEditJourney: false });
    fireEvent.click(screen.getByRole('button', { name: 'files.menu' }));
    expect(screen.queryByText('journey.settings.title')).not.toBeInTheDocument();
  });

  it('FE-MOB-JDET-027: the lightbox renders the mapped photos and closes back into the hook', () => {
    const { hook } = setup({
      lightbox: { photos: [{ id: 501, src: '/api/photos/900/original', caption: 'Shrine', mediaType: 'image' }], index: 0 },
    });
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    expect(mocks.captured.lightbox.photos).toEqual([
      expect.objectContaining({ id: '501', src: '/api/photos/900/original', caption: 'Shrine' }),
    ]);
    (mocks.captured.lightbox.onClose as () => void)();
    expect(hook.setLightbox).toHaveBeenCalledWith(null);
  });

  it('FE-MOB-JDET-028: a settled carousel scroll re-centres the map on the nearest card', async () => {
    setup();
    // An unrelated render (here the photo-provider probe resolving) must not
    // tear the scroll listener down and drop the pending settle timer.
    fireEvent.click(screen.getByText('Kyoto'));
    expect(screen.getByTestId('journey-map')).toHaveAttribute('data-active', '2');

    const carousel = document.querySelector('.overflow-x-auto') as HTMLElement;
    // two bursts in a row: only the last one may settle
    fireEvent.scroll(carousel);
    fireEvent.scroll(carousel);
    await waitFor(() => expect(screen.getByTestId('journey-map')).toHaveAttribute('data-active', '1'));
  });

  it('FE-MOB-JDET-029: the device row of the upload chooser opens the file picker', async () => {
    vi.mocked(addonsApi.enabled).mockResolvedValue({
      addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true }],
    });
    vi.mocked(memoriesApi.status).mockResolvedValue({ connected: true });
    const { container } = setup({ view: 'gallery' });
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.click(await screen.findByRole('button', { name: 'common.upload' }));
    fireEvent.click(await screen.findByText('mobileJourney.uploadFromDevice'));
    expect(click).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('mobileJourney.uploadFromDevice')).not.toBeInTheDocument());
  });

  it('FE-MOB-JDET-030: a provider that reports itself as disconnected stays hidden', async () => {
    vi.mocked(addonsApi.enabled).mockResolvedValue({
      addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true }],
    });
    vi.mocked(memoriesApi.status).mockResolvedValue({ connected: false });
    const { container } = setup({ view: 'gallery' });
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.click(await screen.findByRole('button', { name: 'common.upload' }));
    expect(click).toHaveBeenCalled();
    expect(screen.queryByText('mobileJourney.uploadFromDevice')).not.toBeInTheDocument();
  });

  it('FE-MOB-JDET-031: closing the entry sheet, settings, invite and picker resets the hook state', async () => {
    vi.mocked(addonsApi.enabled).mockResolvedValue({
      addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true }],
    });
    vi.mocked(memoriesApi.status).mockResolvedValue({ connected: true });
    const gallery = [buildGalleryPhoto({ id: 601, asset_id: 'asset-1' }), buildGalleryPhoto({ id: 602, asset_id: null })];
    const { hook } = setup({
      view: 'gallery',
      current: buildDetail({ gallery }),
      editingEntry: buildEntry({ id: 4 }),
      showSettings: true,
      showInvite: true,
    });

    (mocks.captured.entrySheet.onClose as () => void)();
    expect(hook.setEditingEntry).toHaveBeenCalledWith(null);
    (mocks.captured.settings.onClose as () => void)();
    expect(hook.setShowSettings).toHaveBeenCalledWith(false);
    (mocks.captured.invite.onClose as () => void)();
    expect(hook.setShowInvite).toHaveBeenCalledWith(false);

    fireEvent.click(await screen.findByRole('button', { name: 'common.upload' }));
    fireEvent.click(screen.getByText('mobileJourney.browseProvider'));
    await screen.findByTestId('provider-picker');
    expect([...(mocks.captured.picker.existingAssetIds as Set<string>)]).toEqual(['asset-1']);

    (mocks.captured.picker.onClose as () => void)();
    await waitFor(() => expect(screen.queryByTestId('provider-picker')).not.toBeInTheDocument());
  });

  // ── Suggestions on the phone (#1848) ──────────────────────────────────────

  /*
   * No book export on a phone at all. The book is a Studio document now and
   * Studio is a desktop editor — a phone-sized PDF of something laid out for
   * print was the old export's answer to a question nobody was asking.
   */
  it('FE-MOB-JDET-032: the overflow sheet offers no book export', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'files.menu' }));
    expect(screen.queryByText('journey.pdf.saveAsPdf')).not.toBeInTheDocument();
  });

  it('FE-MOB-JDET-033: the suggestions switch flips hide_skeletons and persists it', async () => {
    const update = vi.spyOn(journeyApi, 'updatePreferences').mockResolvedValue({});
    const { hook } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'files.menu' }));

    const toggle = screen.getByRole('switch', { name: 'journey.skeletons.hide' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);

    expect(hook.setHideSkeletons).toHaveBeenCalledWith(true);
    await waitFor(() => expect(update).toHaveBeenCalledWith(12, { hide_skeletons: true }));
  });

  it('FE-MOB-JDET-034: a failing preference write leaves the local flip standing', async () => {
    vi.spyOn(journeyApi, 'updatePreferences').mockRejectedValue(new Error('offline'));
    const { hook } = setup({ hideSkeletons: true });
    fireEvent.click(screen.getByRole('button', { name: 'files.menu' }));

    const toggle = screen.getByRole('switch', { name: 'journey.skeletons.hide' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);

    await waitFor(() => expect(hook.setHideSkeletons).toHaveBeenCalledWith(false));
    expect(toast.error).not.toHaveBeenCalled();
  });

  // ── External photos in the phone entry editor (#1808) ─────────────────────

  it('FE-MOB-JDET-035: the entry sheet gets the provider context and writes the picked photos', async () => {
    const trips = [{ trip_id: 3, added_at: 0, title: 'Tokyo', start_date: '2026-05-01', end_date: '2026-05-04', cover_image: null, currency: 'EUR', place_count: 2 }];
    const addProvider = vi.spyOn(journeyApi, 'addProviderPhotos').mockResolvedValue({ added: 1 });
    setup({ current: buildDetail({ trips }), editingEntry: buildEntry({ id: 4 }) });

    expect(mocks.captured.entrySheet.userId).toBe(5);
    expect(mocks.captured.entrySheet.trips).toEqual(trips);

    const onAdd = mocks.captured.entrySheet.onAddProviderPhotos as (id: number, g: Record<string, unknown>) => Promise<void>;
    await onAdd(4, { provider: 'immich', assetIds: ['a1'], passphrase: 'pw', mediaTypes: ['image'] });
    expect(addProvider).toHaveBeenCalledWith(4, 'immich', ['a1'], undefined, 'pw', ['image']);
  });

  it('FE-MOB-JDET-036: a retried save updates the entry that was already created', async () => {
    const { hook } = setup({ editingEntry: buildEntry({ id: 0, title: null }) });
    const onSave = mocks.captured.entrySheet.onSave as (d: Record<string, unknown>, id?: number) => Promise<number>;

    await expect(onSave({ title: 'Fresh' })).resolves.toBe(77);
    expect(createEntry).toHaveBeenCalledTimes(1);

    // Second attempt hands back the id from the first one — no second create.
    await expect(onSave({ title: 'Fresh' }, 77)).resolves.toBe(77);
    expect(createEntry).toHaveBeenCalledTimes(1);
    expect(hook.updateEntry).toHaveBeenCalledWith(77, { title: 'Fresh' });
  });

  // Leaving the screen mid-probe used to leave the requests running and land a
  // setState on a gone component. The probes are sequential, so the queue has to
  // stop as well instead of walking the rest of the providers.
  it('FE-MOB-JDET-038: leaving the screen stops the provider probes', async () => {
    vi.mocked(addonsApi.enabled).mockResolvedValue({
      addons: [
        { id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true },
        { id: 'synology', name: 'Synology', type: 'photo_provider', enabled: true },
      ],
    });
    let release: (value: { connected: boolean }) => void = () => {};
    vi.mocked(memoriesApi.status).mockReturnValue(new Promise(resolve => { release = resolve; }));
    const { unmount } = setup({ view: 'gallery' });

    await waitFor(() => expect(memoriesApi.status).toHaveBeenCalledTimes(1));

    unmount();
    await act(async () => { release({ connected: true }); });
    expect(memoriesApi.status).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-JDET-037: the screen measures itself, not the shell', () => {
    // #1809: the shell scrolls with the document now and hands down no definite
    // height. A map on a percentage of an auto-height parent collapses to zero.
    const { container } = setup();
    expect(container.firstElementChild).toHaveClass('h-dvh');
  });
});
