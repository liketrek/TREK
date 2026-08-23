// FE-MOB-JSET-001 to FE-MOB-JSET-030
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../helpers/render';
import MJourneySettingsSheet from '../../../../src/mobile/screens/journey/MJourneySettingsSheet';
import { journeyApi } from '../../../../src/api/client';
import { useJourneyStore } from '../../../../src/store/journeyStore';
import type { JourneyDetail } from '../../../../src/store/journeyStore';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

type AddToast = NonNullable<typeof window.__addToast>;
let addToast: Mock<AddToast>;

const journeyStoreInitial = useJourneyStore.getState();

function buildJourney(over: Partial<JourneyDetail> = {}): JourneyDetail {
  return {
    id: 12,
    user_id: 1,
    title: 'Japan 2026',
    subtitle: 'Tokyo & Kyoto',
    cover_gradient: null,
    cover_image: null,
    status: 'active',
    created_at: 0,
    updated_at: 0,
    entries: [],
    gallery: [],
    trips: [
      { trip_id: 3, added_at: 0, title: 'Tokyo trip', start_date: '2026-05-01', end_date: '2026-05-09', cover_image: null, currency: 'EUR', place_count: 8 },
    ],
    contributors: [
      { journey_id: 12, user_id: 1, role: 'owner', added_at: 0, username: 'maurice', avatar: null },
      { journey_id: 12, user_id: 2, role: 'editor', added_at: 0, username: 'julien', avatar: null },
    ],
    stats: { entries: 2, photos: 5, places: 8 },
    ...over,
  };
}

function setup(over: Partial<JourneyDetail> = {}) {
  const props = {
    journey: buildJourney(over),
    onClose: vi.fn(),
    onSaved: vi.fn(),
    onOpenInvite: vi.fn(),
    onRefresh: vi.fn(),
  };
  const view = render(<MJourneySettingsSheet {...props} />);
  return { ...view, props };
}

let updateJourney: Mock<(id: number, data: Record<string, unknown>) => Promise<void>>;
let deleteJourney: Mock<(id: number) => Promise<void>>;

/** The sheet and the confirm dialog both portal into body — scope by dialog title. */
async function confirmButton(dialogTitle: string, label: string): Promise<HTMLElement> {
  const heading = await screen.findByRole('heading', { name: dialogTitle });
  const modal = heading.closest('.trek-modal-enter') as HTMLElement;
  return within(modal).getByRole('button', { name: label });
}

beforeEach(() => {
  vi.clearAllMocks();
  addToast = vi.fn<AddToast>(() => 0);
  window.__addToast = addToast;
  updateJourney = vi.fn(async () => {});
  deleteJourney = vi.fn(async () => {});
  useJourneyStore.setState({ ...journeyStoreInitial, updateJourney, deleteJourney }, true);
  vi.spyOn(journeyApi, 'getShareLink').mockResolvedValue({ link: null });
});

afterEach(() => {
  delete window.__addToast;
  vi.restoreAllMocks();
  useJourneyStore.setState(journeyStoreInitial, true);
});

describe('MJourneySettingsSheet', () => {
  it('FE-MOB-JSET-001: renders the journey name, subtitle and synced trips', async () => {
    setup();
    expect(await screen.findByDisplayValue('Japan 2026')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tokyo & Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Tokyo trip')).toBeInTheDocument();
    expect(screen.getByText('8 places')).toBeInTheDocument();
  });

  it('FE-MOB-JSET-002: shows the empty hint when no trip is linked', async () => {
    setup({ trips: [] });
    expect(await screen.findByText('No trips linked')).toBeInTheDocument();
  });

  it('FE-MOB-JSET-003: saving posts the edited title and subtitle and reports back', async () => {
    const { props } = setup();
    fireEvent.change(await screen.findByDisplayValue('Japan 2026'), { target: { value: 'Japan 2027' } });
    fireEvent.change(screen.getByDisplayValue('Tokyo & Kyoto'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateJourney).toHaveBeenCalledWith(12, { title: 'Japan 2027', subtitle: null }));
    expect(props.onSaved).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-JSET-004: a failing save shows an error toast and keeps the sheet open', async () => {
    updateJourney.mockRejectedValueOnce(new Error('nope'));
    const { props } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to save', 'error', undefined));
    expect(props.onSaved).not.toHaveBeenCalled();
  });

  it('FE-MOB-JSET-005: the save button is disabled while the title is empty', async () => {
    setup();
    fireEvent.change(await screen.findByDisplayValue('Japan 2026'), { target: { value: '  ' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('FE-MOB-JSET-006: uploading a cover sends the file and refreshes', async () => {
    const upload = vi.spyOn(journeyApi, 'uploadCover').mockResolvedValue({});
    const { props, container } = setup();
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    expect(upload.mock.calls[0][0]).toBe(12);
    expect((upload.mock.calls[0][1] as FormData).get('cover')).toBe(file);
    await waitFor(() => expect(props.onRefresh).toHaveBeenCalled());
    expect(addToast).toHaveBeenCalledWith('Cover updated', 'success', undefined);
  });

  it('FE-MOB-JSET-007: a failing cover upload shows an error toast', async () => {
    vi.spyOn(journeyApi, 'uploadCover').mockRejectedValue(new Error('too big'));
    const { props, container } = setup();
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'cover.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Upload failed', 'error', undefined));
    expect(props.onRefresh).not.toHaveBeenCalled();
  });

  it('FE-MOB-JSET-008: choosing no file leaves the upload untouched', async () => {
    const upload = vi.spyOn(journeyApi, 'uploadCover').mockResolvedValue({});
    const { container } = setup();
    const input = container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(upload).not.toHaveBeenCalled();
  });

  it('FE-MOB-JSET-009: Add trip loads the available trips and hides already linked ones', async () => {
    vi.spyOn(journeyApi, 'availableTrips').mockResolvedValue({
      trips: [{ id: 3, title: 'Tokyo trip' }, { id: 4, title: 'Oslo trip' }],
    });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Trip' }));

    expect(await screen.findByText('Oslo trip')).toBeInTheDocument();
    // trip 3 is already linked, so it only appears once — in the synced list
    expect(screen.getAllByText('Tokyo trip')).toHaveLength(1);
  });

  it('FE-MOB-JSET-010: linking a trip calls the API and refreshes', async () => {
    vi.spyOn(journeyApi, 'availableTrips').mockResolvedValue({ trips: [{ id: 4, title: 'Oslo trip' }] });
    const addTrip = vi.spyOn(journeyApi, 'addTrip').mockResolvedValue({});
    const { props } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Trip' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Link' }));

    await waitFor(() => expect(addTrip).toHaveBeenCalledWith(12, 4));
    expect(addToast).toHaveBeenCalledWith('Trip linked', 'success', undefined);
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it('FE-MOB-JSET-011: a failing link shows an error toast', async () => {
    vi.spyOn(journeyApi, 'availableTrips').mockResolvedValue({ trips: [{ id: 4, title: 'Oslo trip' }] });
    vi.spyOn(journeyApi, 'addTrip').mockRejectedValue(new Error('boom'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Trip' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Link' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to link trip', 'error', undefined));
  });

  it('FE-MOB-JSET-012: an empty available-trips response shows the placeholder', async () => {
    vi.spyOn(journeyApi, 'availableTrips').mockRejectedValue(new Error('offline'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Trip' }));
    expect(await screen.findByText('No trips available')).toBeInTheDocument();
  });

  it('FE-MOB-JSET-013: unlinking a trip asks for confirmation and then removes it', async () => {
    const removeTrip = vi.spyOn(journeyApi, 'removeTrip').mockResolvedValue({});
    const { props } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Unlink Trip' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Unlink' }));

    await waitFor(() => expect(removeTrip).toHaveBeenCalledWith(12, 3));
    expect(addToast).toHaveBeenCalledWith('Trip unlinked', 'success', undefined);
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it('FE-MOB-JSET-014: a failing unlink shows an error toast', async () => {
    vi.spyOn(journeyApi, 'removeTrip').mockRejectedValue(new Error('boom'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Unlink Trip' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Unlink' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to unlink trip', 'error', undefined));
  });

  it('FE-MOB-JSET-015: contributors are listed and only non-owners can be removed', async () => {
    const remove = vi.spyOn(journeyApi, 'removeContributor').mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { props } = setup();

    expect(await screen.findByText('maurice')).toBeInTheDocument();
    expect(screen.getByText('julien')).toBeInTheDocument();
    const removeButtons = screen.getAllByRole('button', { name: 'Remove contributor' });
    expect(removeButtons).toHaveLength(1);

    fireEvent.click(removeButtons[0]);
    await waitFor(() => expect(remove).toHaveBeenCalledWith(12, 2));
    expect(addToast).toHaveBeenCalledWith('Contributor removed', 'success', undefined);
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it('FE-MOB-JSET-016: declining the confirm keeps the contributor', async () => {
    const remove = vi.spyOn(journeyApi, 'removeContributor').mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Remove contributor' }));
    expect(remove).not.toHaveBeenCalled();
  });

  it('FE-MOB-JSET-017: a failing contributor removal shows an error toast', async () => {
    vi.spyOn(journeyApi, 'removeContributor').mockRejectedValue(new Error('nope'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Remove contributor' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to remove contributor', 'error', undefined));
  });

  it('FE-MOB-JSET-018: creating a share link reveals the public URL and its toggles', async () => {
    vi.spyOn(journeyApi, 'createShareLink').mockResolvedValue({ token: 'tok-1' });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Create share link' }));

    expect(await screen.findByText(`${window.location.origin}/public/journey/tok-1`)).toBeInTheDocument();
    expect(addToast).toHaveBeenCalledWith('Share link created', 'success', undefined);
    expect(screen.getAllByRole('switch')).toHaveLength(3);
  });

  it('FE-MOB-JSET-019: a failing share-link creation shows an error toast', async () => {
    vi.spyOn(journeyApi, 'createShareLink').mockRejectedValue(new Error('boom'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Create share link' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to create link', 'error', undefined));
  });

  it('FE-MOB-JSET-020: an existing link is loaded, copied and its permissions toggled', async () => {
    vi.mocked(journeyApi.getShareLink).mockResolvedValue({
      link: { token: 'tok-9', share_timeline: true, share_gallery: true, share_map: false },
    });
    const create = vi.spyOn(journeyApi, 'createShareLink').mockResolvedValue({ token: 'tok-9' });
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: { writeText } });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, writable: true, value: true });
    setup();

    expect(await screen.findByText(`${window.location.origin}/public/journey/tok-9`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/public/journey/tok-9`);
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: 'Map' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(12, { share_timeline: true, share_gallery: true, share_map: true }),
    );
    expect(screen.getByRole('switch', { name: 'Map' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-JSET-021: a failing permission toggle rolls the switch back', async () => {
    vi.mocked(journeyApi.getShareLink).mockResolvedValue({
      link: { token: 'tok-9', share_timeline: true, share_gallery: true, share_map: true },
    });
    vi.spyOn(journeyApi, 'createShareLink').mockRejectedValue(new Error('boom'));
    setup();

    fireEvent.click(await screen.findByRole('switch', { name: 'Gallery' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to update', 'error', undefined));
    expect(screen.getByRole('switch', { name: 'Gallery' })).toHaveAttribute('aria-checked', 'true');
  });

  it('FE-MOB-JSET-022: removing the share link hides the URL again', async () => {
    vi.mocked(journeyApi.getShareLink).mockResolvedValue({
      link: { token: 'tok-9', share_timeline: true, share_gallery: true, share_map: true },
    });
    const del = vi.spyOn(journeyApi, 'deleteShareLink').mockResolvedValue({});
    setup();

    fireEvent.click(await screen.findByRole('button', { name: 'Remove share link' }));
    await waitFor(() => expect(del).toHaveBeenCalledWith(12));
    expect(await screen.findByRole('button', { name: 'Create share link' })).toBeInTheDocument();
    expect(addToast).toHaveBeenCalledWith('Share link deleted', 'success', undefined);
  });

  it('FE-MOB-JSET-023: a failing share-link removal shows an error toast', async () => {
    vi.mocked(journeyApi.getShareLink).mockResolvedValue({
      link: { token: 'tok-9', share_timeline: true, share_gallery: true, share_map: true },
    });
    vi.spyOn(journeyApi, 'deleteShareLink').mockRejectedValue(new Error('boom'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Remove share link' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to delete', 'error', undefined));
  });

  it('FE-MOB-JSET-024: archiving an active journey flips its status', async () => {
    const { props } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Archive Journey' }));

    await waitFor(() => expect(updateJourney).toHaveBeenCalledWith(12, { status: 'archived' }));
    expect(addToast).toHaveBeenCalledWith('Journey archived', 'success', undefined);
    expect(props.onSaved).toHaveBeenCalled();
  });

  it('FE-MOB-JSET-025: an archived journey offers to restore it', async () => {
    setup({ status: 'archived' });
    fireEvent.click(await screen.findByRole('button', { name: 'Restore Journey' }));

    await waitFor(() => expect(updateJourney).toHaveBeenCalledWith(12, { status: 'active' }));
    expect(addToast).toHaveBeenCalledWith('Journey reopened', 'success', undefined);
  });

  it('FE-MOB-JSET-026: a failing archive shows an error toast', async () => {
    updateJourney.mockRejectedValueOnce(new Error('nope'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Archive Journey' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to save', 'error', undefined));
  });

  it('FE-MOB-JSET-027: deleting the journey confirms and returns to the list', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    fireEvent.click(await confirmButton('Delete Journey', 'Delete'));

    await waitFor(() => expect(deleteJourney).toHaveBeenCalledWith(12));
    expect(mockNavigate).toHaveBeenCalledWith('/journey');
  });

  it('FE-MOB-JSET-028: a failing delete keeps the user on the sheet', async () => {
    deleteJourney.mockRejectedValueOnce(new Error('nope'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    fireEvent.click(await confirmButton('Delete Journey', 'Delete'));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to delete', 'error', undefined));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('FE-MOB-JSET-029: the cancel and invite buttons call back out', async () => {
    const { props } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Invite Contributor' }));
    expect(props.onOpenInvite).toHaveBeenCalledTimes(1);

    const cancels = screen.getAllByRole('button', { name: 'Cancel' });
    fireEvent.click(cancels[cancels.length - 1]);
    expect(props.onClose).toHaveBeenCalled();
  });

  // A self-hosted install served over plain HTTP has no navigator.clipboard, and the
  // unguarded call used to throw before the button ever showed feedback.
  it('FE-MOB-JSET-031: copies through execCommand when the clipboard API is unavailable', async () => {
    vi.mocked(journeyApi.getShareLink).mockResolvedValue({
      link: { token: 'tok-9', share_timeline: true, share_gallery: true, share_map: false },
    });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: undefined });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, writable: true, value: false });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: execCommand });
    setup();

    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    // The temporary textarea is removed again.
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('FE-MOB-JSET-030: an existing cover is shown instead of the gradient', async () => {
    setup({ cover_image: 'covers/j.jpg' });
    await waitFor(() =>
      expect(document.querySelector('img[src="/uploads/covers/j.jpg"]')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Change cover' })).toBeInTheDocument();
  });
});
