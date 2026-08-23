// FE-JRN-DETWIRE-001 to FE-JRN-DETWIRE-028
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../tests/helpers/render';
import { journeyApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useJourneyStore } from '../store/journeyStore';
import type { JourneyDetail, JourneyEntry } from '../store/journeyStore';
import JourneyDetailPage from './JourneyDetailPage';

const mocks = vi.hoisted(() => ({
  detail: {} as Record<string, unknown>,
  captured: {} as Record<string, Record<string, unknown>>,
}));

vi.mock('./journeyDetail/useJourneyDetail', () => ({
  useJourneyDetail: () => mocks.detail,
}));

vi.mock('../components/Layout/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));

vi.mock('../mobile/screens/journey/MJourneyDetail', () => ({
  default: () => <div data-testid="mobile-detail" />,
}));


vi.mock('../components/Journey/JourneyMapAuto', async () => {
  const React = await import('react');
  const Comp = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({ highlightMarker: vi.fn(), focusMarker: vi.fn(), invalidateSize: vi.fn() }));
    mocks.captured.map = props;
    return <div data-testid="sidebar-map" data-active={String(props.activeMarkerId ?? '')} />;
  });
  Comp.displayName = 'MockJourneyMapAuto';
  return { __esModule: true, default: Comp };
});

function capture(name: string, testId: string) {
  return (props: Record<string, unknown>) => {
    mocks.captured[name] = props;
    return <div data-testid={testId} />;
  };
}

vi.mock('../components/Journey/MobileMapTimeline', () => ({ default: capture('mobileTimeline', 'mobile-timeline') }));
vi.mock('../components/Journey/MobileEntryView', () => ({ default: capture('mobileEntry', 'mobile-entry') }));
vi.mock('../components/Journey/PhotoLightbox', () => ({ default: capture('lightbox', 'lightbox') }));
vi.mock('../components/Journey/ContributorInviteDialog', () => ({ default: capture('invite', 'invite-dialog') }));
vi.mock('../components/Journey/JourneyDetailPageGalleryView', () => ({ GalleryView: capture('gallery', 'gallery-view') }));
vi.mock('../components/Journey/JourneyDetailPageEntryEditor', () => ({ EntryEditor: capture('editor', 'entry-editor') }));
vi.mock('../components/Journey/JourneyDetailPageAddTripDialog', () => ({ AddTripDialog: capture('addTrip', 'add-trip-dialog') }));
vi.mock('../components/Journey/JourneyDetailPageSettingsDialog', () => ({ JourneySettingsDialog: capture('settings', 'settings-dialog') }));
vi.mock('../components/Journey/JourneyDetailPageEntryCard', () => ({
  EntryCard: capture('entryCard', 'entry-card'),
  SkeletonCard: capture('skeletonCard', 'skeleton-card'),
  CheckinCard: capture('checkinCard', 'checkin-card'),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

function buildEntry(over: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 1, journey_id: 7, author_id: 1, type: 'entry', title: 'Arrival', story: null,
    entry_date: '2026-05-01', entry_time: null, location_name: 'Tokyo',
    location_lat: 35.6, location_lng: 139.7, mood: null, weather: null,
    tags: [], pros_cons: null, visibility: 'private', sort_order: 0, photos: [],
    created_at: 0, updated_at: 0,
    ...over,
  };
}

function buildDetail(over: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 7, user_id: 1, title: 'Japan 2026', subtitle: 'Tokyo & Kyoto',
    cover_gradient: null, cover_image: null, status: 'active', created_at: 0, updated_at: 0,
    entries: [buildEntry(), buildEntry({ id: 2, title: 'Second stop' })],
    gallery: [], trips: [], contributors: [{ journey_id: 7, user_id: 5, role: 'owner', added_at: 0, username: 'maurice', avatar: null }],
    stats: { entries: 2, photos: 3, places: 4 },
    ...over,
  };
}

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

function buildHook(over: Record<string, unknown> = {}): Record<string, unknown> {
  const current = 'current' in over ? (over.current as JourneyDetail | null) : buildDetail();
  return {
    id: '7', navigate: vi.fn(), toast, t: (key: string) => key, locale: 'en',
    current, loading: false,
    canEditEntries: true, canEditJourney: true, myRole: 'owner',
    view: 'timeline', setView: vi.fn(), activeEntryId: null, setActiveEntryId: vi.fn(),
    feedRef: { current: null },
    viewingEntry: null, setViewingEntry: vi.fn(),
    editingEntry: null, setEditingEntry: vi.fn(),
    lightbox: null, setLightbox: vi.fn(),
    deleteTarget: null, setDeleteTarget: vi.fn(),
    showInvite: false, setShowInvite: vi.fn(),
    showAddTrip: false, setShowAddTrip: vi.fn(),
    unlinkTrip: null, setUnlinkTrip: vi.fn(),
    showSettings: false, setShowSettings: vi.fn(),
    hideSkeletons: false, setHideSkeletons: vi.fn(),
    mapRef: { current: null }, fullMapRef: { current: null }, galleryUploadRef: { current: null },
    activeLocationId: null, handleMarkerClick: vi.fn(), handleLocationClick: vi.fn(),
    mapEntries: [], sidebarMapItems: [], tripDates: new Set<string>(), isMobile: false,
    feedEdge: { atTop: true, atBottom: true }, scrollFeedTo: vi.fn(),
    loadJourney: vi.fn(), updateEntry: vi.fn(async () => {}), deleteEntry: vi.fn(async () => {}),
    reorderEntries: vi.fn(async () => {}), uploadPhotos: vi.fn(async () => ({ succeeded: [], failed: [] })),
    deletePhoto: vi.fn(async () => {}),
    ...over,
  };
}

function setup(over: Record<string, unknown> = {}) {
  mocks.detail = buildHook(over);
  const view = render(<JourneyDetailPage />);
  return { ...view, hook: mocks.detail };
}

const journeyStoreInitial = useJourneyStore.getState();
let createEntry: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.captured = {};
  createEntry = vi.fn(async () => buildEntry({ id: 88 }));
  useJourneyStore.setState({ ...journeyStoreInitial, createEntry } as never, true);
  useAuthStore.setState({ user: { id: 5, username: 'maurice' } } as never);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('JourneyDetailPage wiring', () => {
  it('FE-JRN-DETWIRE-001: shows the spinner while the journey loads', () => {
    setup({ loading: true, current: null });
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-002: renders the hero with the journey stats and the sidebar map', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Japan 2026' })).toBeInTheDocument();
    expect(screen.getByText('Tokyo & Kyoto')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-map')).toBeInTheDocument();
    // days / places / entries / photos
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-003: the hero back button returns to the journey list', () => {
    const { hook } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'journey.detail.backToJourney' }));
    expect(hook.navigate).toHaveBeenCalledWith('/journey');
  });

  /*
   * The old book export is gone: Studio is the book now, and two exports of the
   * same thing that disagree about what it looks like is worse than one.
   */
  it('FE-JRN-DETWIRE-004: offers Studio where the PDF export used to be', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'journey.pdf.saveAsPdf' })).not.toBeInTheDocument();
    expect(screen.getByText('journey.studio.open')).toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-005: the eye toggle flips hide_skeletons and persists the preference', async () => {
    const update = vi.spyOn(journeyApi, 'updatePreferences').mockResolvedValue({});
    const { hook } = setup();
    fireEvent.click(screen.getByText('journey.skeletons.hide').closest('div')!.querySelector('button')!);

    expect(hook.setHideSkeletons).toHaveBeenCalledWith(true);
    await waitFor(() => expect(update).toHaveBeenCalledWith(7, { hide_skeletons: true }));
  });

  it('FE-JRN-DETWIRE-006: with skeletons hidden the toggle offers to show them again', () => {
    setup({ hideSkeletons: true });
    expect(screen.getByText('journey.skeletons.show')).toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-007: the timeline groups entries per day and renders one card each', () => {
    setup({
      current: buildDetail({
        entries: [
          buildEntry({ id: 1 }),
          buildEntry({ id: 2, title: 'Second stop' }),
          buildEntry({ id: 3, title: 'Day two', entry_date: '2026-05-02' }),
        ],
      }),
    });
    expect(screen.getAllByTestId('entry-card')).toHaveLength(3);
    // one day header per distinct entry_date
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('FE-JRN-DETWIRE-008: an empty timeline shows the mascot empty state', () => {
    setup({ current: buildDetail({ entries: [] }) });
    expect(screen.getByText('journey.detail.noEntries')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-card')).not.toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-009: skeleton and check-in entries get their own cards', () => {
    setup({
      current: buildDetail({
        entries: [
          buildEntry({ id: 1, type: 'skeleton', title: 'Suggested' }),
          buildEntry({ id: 2, type: 'checkin', title: 'Checked in' }),
        ],
      }),
    });
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
    expect(screen.getByTestId('checkin-card')).toBeInTheDocument();

    (mocks.captured.skeletonCard.onClick as () => void)();
    (mocks.captured.checkinCard.onClick as () => void)();
    expect(mocks.detail.setEditingEntry).toHaveBeenCalledTimes(2);
  });

  it('FE-JRN-DETWIRE-010: a read-only viewer cannot open the skeleton or check-in cards', () => {
    setup({
      canEditEntries: false,
      current: buildDetail({
        entries: [
          buildEntry({ id: 1, type: 'skeleton', title: 'Suggested' }),
          buildEntry({ id: 2, type: 'checkin', title: 'Checked in' }),
        ],
      }),
    });
    expect(mocks.captured.skeletonCard.onClick).toBeUndefined();
    expect(mocks.captured.checkinCard.onClick).toBeUndefined();
    expect(screen.queryByText('journey.detail.addEntry')).not.toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-011: the reorder arrows move an entry within its day', async () => {
    const { hook } = setup();
    const down = screen.getAllByRole('button', { name: 'Move down' })[0];
    const upFirst = screen.getAllByRole('button', { name: 'Move up' })[0];
    expect(upFirst).toBeDisabled();

    fireEvent.click(down);
    await waitFor(() => expect(hook.reorderEntries).toHaveBeenCalledWith(7, [2, 1]));

    fireEvent.click(screen.getAllByRole('button', { name: 'Move up' })[1]);
    expect(hook.reorderEntries).toHaveBeenLastCalledWith(7, [2, 1]);
  });

  it('FE-JRN-DETWIRE-012: a failing reorder is reported to the user', async () => {
    const reorderEntries = vi.fn(async () => { throw new Error('conflict'); });
    setup({ reorderEntries });
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('common.errorOccurred'));
  });

  it('FE-JRN-DETWIRE-013: entry-card actions open the editor, the delete confirm and the lightbox', () => {
    const { hook } = setup();
    const card = mocks.captured.entryCard;
    (card.onEdit as () => void)();
    expect(hook.setEditingEntry).toHaveBeenCalled();
    (card.onDelete as () => void)();
    expect(hook.setDeleteTarget).toHaveBeenCalled();

    const onPhotoClick = card.onPhotoClick as (p: Record<string, unknown>[], i: number) => void;
    onPhotoClick([{ id: 3, photo_id: 30, caption: 'x', media_type: 'image' }], 0);
    expect(hook.setLightbox).toHaveBeenCalledWith({
      index: 0,
      photos: [expect.objectContaining({ id: 3, src: '/api/photos/30/original', caption: 'x' })],
    });
  });

  it('FE-JRN-DETWIRE-014: the add-entry button opens a draft, the gallery tab an upload', () => {
    const { hook, unmount } = setup();
    fireEvent.click(screen.getByText('journey.detail.addEntry'));
    expect(hook.setEditingEntry).toHaveBeenCalledWith(expect.objectContaining({ id: 0, journey_id: 7 }));

    const upload = vi.fn();
    (mocks.captured.gallery.onRegisterUpload as (fn: () => void) => void)(upload);
    unmount();

    setup({ view: 'gallery' });
    (mocks.captured.gallery.onRegisterUpload as (fn: () => void) => void)(upload);
    fireEvent.click(screen.getByText('common.upload'));
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-DETWIRE-015: the view switcher and gallery photo clicks feed back into the hook', () => {
    const { hook } = setup();
    fireEvent.click(screen.getByRole('button', { name: /journey.share.gallery/ }));
    expect(hook.setView).toHaveBeenCalledWith('gallery');

    const onPhotoClick = mocks.captured.gallery.onPhotoClick as (p: Record<string, unknown>[], i: number) => void;
    onPhotoClick([{ id: 9, photo_id: 90, media_type: 'video' }], 0);
    expect(hook.setLightbox).toHaveBeenCalledWith({
      index: 0,
      photos: [expect.objectContaining({ id: 9, src: '/api/photos/90/original', caption: null, mediaType: 'video' })],
    });

    (mocks.captured.gallery.onRefresh as () => void)();
    expect(hook.loadJourney).toHaveBeenCalledWith(7);
  });

  it('FE-JRN-DETWIRE-016: the entry editor creates a new entry and updates an existing one', async () => {
    const { hook, unmount } = setup({ editingEntry: buildEntry({ id: 0 }) });
    const save = mocks.captured.editor.onSave as (d: Record<string, unknown>, id?: number) => Promise<number>;
    await expect(save({ title: 'Fresh' })).resolves.toBe(88);
    expect(createEntry).toHaveBeenCalledWith(7, { title: 'Fresh' });

    await (mocks.captured.editor.onUploadPhotos as (id: number, f: File[]) => Promise<unknown>)(88, []);
    expect(hook.uploadPhotos).toHaveBeenCalledWith(88, [], undefined);

    const addProvider = vi.spyOn(journeyApi, 'addProviderPhotos').mockResolvedValue({ added: 1 });
    await (mocks.captured.editor.onAddProviderPhotos as (id: number, g: Record<string, unknown>) => Promise<void>)(
      88, { provider: 'immich', assetIds: ['a1'], passphrase: 'pw', mediaTypes: ['image'] },
    );
    expect(addProvider).toHaveBeenCalledWith(88, 'immich', ['a1'], undefined, 'pw', ['image']);

    (mocks.captured.editor.onDone as () => void)();
    expect(hook.setEditingEntry).toHaveBeenCalledWith(null);
    expect(hook.loadJourney).toHaveBeenCalledWith(7);
    unmount();

    const second = setup({ editingEntry: buildEntry({ id: 4 }) });
    const save2 = mocks.captured.editor.onSave as (d: Record<string, unknown>, id?: number) => Promise<number>;
    await expect(save2({ title: 'Edited' }, 4)).resolves.toBe(4);
    expect(second.hook.updateEntry).toHaveBeenCalledWith(4, { title: 'Edited' });
  });

  it('FE-JRN-DETWIRE-017: settings, add-trip and invite dialogs report back into the hook', () => {
    const trips = [
      { trip_id: 3, added_at: 0, title: 'Tokyo', start_date: '2026-05-01', end_date: '2026-05-04', cover_image: null, currency: 'EUR', place_count: 2 },
    ];
    const { hook } = setup({
      current: buildDetail({ trips }),
      showSettings: true, showAddTrip: true, showInvite: true,
    });

    (mocks.captured.settings.onSaved as () => void)();
    expect(hook.setShowSettings).toHaveBeenCalledWith(false);
    (mocks.captured.settings.onOpenInvite as () => void)();
    expect(hook.setShowInvite).toHaveBeenCalledWith(true);
    (mocks.captured.settings.onRefresh as () => void)();
    (mocks.captured.settings.onClose as () => void)();

    expect(mocks.captured.addTrip.existingTripIds).toEqual([3]);
    (mocks.captured.addTrip.onAdded as () => void)();
    expect(hook.setShowAddTrip).toHaveBeenCalledWith(false);
    (mocks.captured.addTrip.onClose as () => void)();

    expect(mocks.captured.invite.existingUserIds).toEqual([5]);
    (mocks.captured.invite.onInvited as () => void)();
    expect(hook.setShowInvite).toHaveBeenCalledWith(false);
    (mocks.captured.invite.onClose as () => void)();
    expect(hook.loadJourney).toHaveBeenCalledWith(7);
  });

  it('FE-JRN-DETWIRE-018: confirming the entry delete removes it and reloads', async () => {
    const target = buildEntry({ id: 4, title: 'Old' });
    const { hook } = setup({ deleteTarget: target });
    const heading = screen.getByRole('heading', { name: 'journey.entries.deleteTitle' });
    const dialog = heading.closest('.trek-modal-enter') as HTMLElement;
    fireEvent.click(within(dialog).getByRole('button', { name: 'common.delete' }));

    await waitFor(() => expect(hook.deleteEntry).toHaveBeenCalledWith(4));
    expect(hook.setDeleteTarget).toHaveBeenCalledWith(null);
    expect(hook.loadJourney).toHaveBeenCalledWith(7);
  });

  it('FE-JRN-DETWIRE-019: confirming the trip unlink calls the API and refreshes', async () => {
    const removeTrip = vi.spyOn(journeyApi, 'removeTrip').mockResolvedValue({});
    const { hook } = setup({ unlinkTrip: { trip_id: 3, title: 'Tokyo trip' } });
    fireEvent.click(screen.getByRole('button', { name: 'journey.trips.unlink' }));

    await waitFor(() => expect(removeTrip).toHaveBeenCalledWith(7, 3));
    expect(toast.success).toHaveBeenCalledWith('journey.trips.tripUnlinked');
    expect(hook.setUnlinkTrip).toHaveBeenCalledWith(null);
  });

  it('FE-JRN-DETWIRE-020: a failing unlink shows an error instead', async () => {
    vi.spyOn(journeyApi, 'removeTrip').mockRejectedValue(new Error('boom'));
    setup({ unlinkTrip: { trip_id: 3, title: 'Tokyo trip' } });
    fireEvent.click(screen.getByRole('button', { name: 'journey.trips.unlink' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('journey.trips.unlinkFailed'));
  });

  it('FE-JRN-DETWIRE-021: the lightbox is rendered from the hook state and closes back into it', () => {
    const { hook } = setup({
      lightbox: { photos: [{ id: 3, src: '/api/photos/30/original', caption: null }], index: 0 },
    });
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    expect(mocks.captured.lightbox.photos).toEqual([expect.objectContaining({ id: '3' })]);
    (mocks.captured.lightbox.onClose as () => void)();
    expect(hook.setLightbox).toHaveBeenCalledWith(null);
  });

  it('FE-JRN-DETWIRE-022: on mobile the combined map timeline replaces the desktop panes', () => {
    const { hook } = setup({ isMobile: true });
    expect(screen.getByTestId('mobile-timeline')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-map')).not.toBeInTheDocument();

    (mocks.captured.mobileTimeline.onEntryClick as (e: JourneyEntry) => void)(buildEntry({ id: 2 }));
    expect(hook.setViewingEntry).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    (mocks.captured.mobileTimeline.onAddEntry as () => void)();
    expect(hook.setEditingEntry).toHaveBeenCalledWith(expect.objectContaining({ id: 0 }));
  });

  it('FE-JRN-DETWIRE-023: a read-only mobile viewer gets no add-entry affordance', () => {
    setup({ isMobile: true, canEditEntries: false });
    expect(mocks.captured.mobileTimeline.onAddEntry).toBeUndefined();
    expect(mocks.captured.mobileTimeline.readOnly).toBe(true);
  });

  it('FE-JRN-DETWIRE-024: the floating mobile bar switches views, goes back and opens settings', () => {
    const { hook } = setup({ isMobile: true });
    // The hero is unmounted below 1024px, so the bar owns these labels alone.
    expect(screen.queryByRole('heading', { name: 'Japan 2026' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'journey.detail.backToJourney' }));
    expect(hook.navigate).toHaveBeenCalledWith('/journey');

    fireEvent.click(screen.getAllByRole('button', { name: /journey.share.gallery/ })[0]);
    expect(hook.setView).toHaveBeenCalledWith('gallery');
    fireEvent.click(screen.getAllByRole('button', { name: /journey.detail.journeyTab/ })[0]);
    expect(hook.setView).toHaveBeenCalledWith('timeline');

    fireEvent.click(screen.getByRole('button', { name: 'journey.settings.title' }));
    expect(hook.setShowSettings).toHaveBeenCalledWith(true);
  });

  it('FE-JRN-DETWIRE-025: a non-owner gets the mobile bar without the settings button', () => {
    setup({ isMobile: true, canEditJourney: false });
    expect(screen.queryByRole('button', { name: 'journey.settings.title' })).not.toBeInTheDocument();
    // The suggestions switch is not owner-only.
    expect(screen.getByRole('button', { name: 'journey.skeletons.hide' })).toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-026: the fullscreen mobile entry view wires edit, delete and photos', () => {
    const viewingEntry = buildEntry({ id: 6, title: 'Viewed' });
    const { hook } = setup({ isMobile: true, viewingEntry });
    expect(screen.getByTestId('mobile-entry')).toBeInTheDocument();

    (mocks.captured.mobileEntry.onEdit as () => void)();
    expect(hook.setViewingEntry).toHaveBeenCalledWith(null);
    expect(hook.setEditingEntry).toHaveBeenCalledWith(viewingEntry);

    (mocks.captured.mobileEntry.onDelete as () => void)();
    expect(hook.setDeleteTarget).toHaveBeenCalledWith(viewingEntry);

    (mocks.captured.mobileEntry.onClose as () => void)();
    expect(hook.setViewingEntry).toHaveBeenCalledWith(null);

    const onPhotoClick = mocks.captured.mobileEntry.onPhotoClick as (p: Record<string, unknown>[], i: number) => void;
    onPhotoClick([{ id: 7, photo_id: 70, caption: 'c', media_type: 'image' }], 0);
    expect(hook.setLightbox).toHaveBeenCalledWith({
      index: 0,
      photos: [expect.objectContaining({ id: 7, src: '/api/photos/70/original' })],
    });
  });

  it('FE-JRN-DETWIRE-027: an archived journey shows its status badge', () => {
    setup({ current: buildDetail({ status: 'archived' }) });
    expect(screen.getByText('journey.status.archived')).toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-028: a cover image is layered behind the hero gradient', () => {
    setup({ current: buildDetail({ cover_image: 'covers/j.jpg' }) });
    expect(document.querySelector('img[src="/uploads/covers/j.jpg"]')).toBeInTheDocument();
  });

  // ── Jump buttons (#1088) ──────────────────────────────────────────────────

  it('FE-JRN-DETWIRE-029: a feed with nowhere to jump shows no buttons', () => {
    setup({ feedEdge: { atTop: true, atBottom: true } });
    expect(screen.queryByLabelText('journey.detail.jumpToTop')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('journey.detail.jumpToLast')).not.toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-030: each button appears only when that direction is available', () => {
    const { unmount } = setup({ feedEdge: { atTop: false, atBottom: true } });
    expect(screen.getByLabelText('journey.detail.jumpToTop')).toBeInTheDocument();
    expect(screen.queryByLabelText('journey.detail.jumpToLast')).not.toBeInTheDocument();
    unmount();

    setup({ feedEdge: { atTop: true, atBottom: false } });
    expect(screen.queryByLabelText('journey.detail.jumpToTop')).not.toBeInTheDocument();
    expect(screen.getByLabelText('journey.detail.jumpToLast')).toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-031: the buttons scroll the feed to the matching end', () => {
    const { hook } = setup({ feedEdge: { atTop: false, atBottom: false } });

    fireEvent.click(screen.getByLabelText('journey.detail.jumpToTop'));
    expect(hook.scrollFeedTo).toHaveBeenCalledWith('top');

    fireEvent.click(screen.getByLabelText('journey.detail.jumpToLast'));
    expect(hook.scrollFeedTo).toHaveBeenLastCalledWith('bottom');
  });

  it('FE-JRN-DETWIRE-032: the phone layout has its own chrome and gets no jump buttons', () => {
    setup({ isMobile: true, feedEdge: { atTop: false, atBottom: false } });
    expect(screen.queryByLabelText('journey.detail.jumpToTop')).not.toBeInTheDocument();
  });

  // ── Suggestions below 1024px (#1848) ──────────────────────────────────────

  it('FE-JRN-DETWIRE-033: the narrow bar has no book export either', () => {
    setup({ isMobile: true });
    expect(screen.queryByRole('button', { name: 'journey.pdf.saveAsPdf' })).not.toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-034: the mobile bar toggle flips hide_skeletons and persists it', async () => {
    const update = vi.spyOn(journeyApi, 'updatePreferences').mockResolvedValue({});
    const { hook } = setup({ isMobile: true });

    fireEvent.click(screen.getByRole('button', { name: 'journey.skeletons.hide' }));

    expect(hook.setHideSkeletons).toHaveBeenCalledWith(true);
    await waitFor(() => expect(update).toHaveBeenCalledWith(7, { hide_skeletons: true }));
  });

  it('FE-JRN-DETWIRE-035: with suggestions hidden the mobile toggle offers to show them again', () => {
    setup({ isMobile: true, hideSkeletons: true });
    expect(screen.getByRole('button', { name: 'journey.skeletons.show' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'journey.skeletons.hide' })).not.toBeInTheDocument();
  });

  it('FE-JRN-DETWIRE-036: the remaining actions stay reachable on the mobile gallery tab', () => {
    setup({ isMobile: true, view: 'gallery' });
    expect(screen.getByRole('button', { name: 'journey.studio.openAria' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'journey.skeletons.hide' })).toBeInTheDocument();
  });
});
