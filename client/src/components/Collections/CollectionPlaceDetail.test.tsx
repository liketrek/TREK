// FE-COMP-COLDETAIL-001 to FE-COMP-COLDETAIL-043
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser } from '../../../tests/helpers/factories';
import type { CollectionLabel, CollectionPlace } from '@trek/shared';
import type { Category } from '../../types';
import { useTranslation } from '../../i18n/TranslationContext';
import CollectionPlaceDetail from './CollectionPlaceDetail';

// The component takes `t` as a PROP (not from context), so wrap it in a tiny
// consumer that feeds it the real English `t` from the TranslationProvider the
// test render helper mounts. That way we can assert on visible English strings.
type DetailProps = React.ComponentProps<typeof CollectionPlaceDetail>;
function TranslatedDetail(props: Omit<DetailProps, 't'>): React.ReactElement {
  const { t } = useTranslation();
  return <CollectionPlaceDetail {...props} t={t} />;
}

// Place literal per spec: no image_url / lat / lng / provider id, so the cover
// stays a gradient and status is 'idea'.
const place: CollectionPlace = {
  id: 1,
  collection_id: 10,
  name: 'Test Cafe',
  status: 'idea',
  description: 'Nice spot',
  address: 'Somewhere',
  links: [{ url: 'https://x.com' }],
  category: { id: 1, name: 'Food', color: '#f00', icon: null },
};

const CATEGORIES: Category[] = [
  { id: 1, name: 'Food', color: '#f00', icon: 'utensils' },
  { id: 2, name: 'Museums', color: '#00f', icon: 'landmark' },
];

const LABELS: CollectionLabel[] = [
  { id: 1, collection_id: 10, name: 'Berlin', color: '#0ea5e9' },
  { id: 2, collection_id: 10, name: 'Nightlife', color: null },
];

let addToast: ReturnType<typeof vi.fn>;

function renderDetail(overrides: Partial<Omit<DetailProps, 't'>> = {}) {
  const props = {
    place,
    canEdit: true,
    canDelete: true,
    categories: [],
    labels: [],
    anchorRect: null,
    onClose: vi.fn(),
    onSetStatus: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onCopyToTrip: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  } as Omit<DetailProps, 't'>;
  render(<TranslatedDetail {...props} />);
  return props;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), placesPhotosEnabled: false });
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
  // The detail sheet asks the maps provider for a cover photo on mount when a
  // place carries no image of its own — stub it so nothing hits the network.
  server.use(
    http.get('/api/maps/place-photo/:id', () =>
      HttpResponse.json({ photoUrl: null, attribution: null }),
    ),
  );
});

afterEach(() => {
  delete window.__addToast;
});

describe('CollectionPlaceDetail', () => {
  it('FE-COMP-COLDETAIL-001: renders the place name, address and description', async () => {
    renderDetail();
    expect(await screen.findByRole('heading', { name: 'Test Cafe' })).toBeInTheDocument();
    expect(screen.getByText('Somewhere')).toBeInTheDocument();
    expect(screen.getByText('Nice spot')).toBeInTheDocument();
  });

  // ── Editor / admin (canEdit + canDelete) ────────────────────────────────────
  it('FE-COMP-COLDETAIL-002: shows Edit and Remove buttons when canEdit && canDelete', async () => {
    renderDetail({ canEdit: true, canDelete: true });
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove from list' })).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-003: clicking a status option calls onSetStatus when canEdit', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true, canDelete: true });
    const visited = await screen.findByRole('button', { name: 'Visited' });
    await user.click(visited);
    expect(props.onSetStatus).toHaveBeenCalledTimes(1);
    expect(props.onSetStatus).toHaveBeenCalledWith('visited');
  });

  it('FE-COMP-COLDETAIL-004: current status option is pressed, others are not', async () => {
    renderDetail({ canEdit: true, canDelete: true });
    expect(await screen.findByRole('button', { name: 'Idea' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Want to go' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-COMP-COLDETAIL-005: entering edit mode reveals name input + Save', async () => {
    const user = userEvent.setup();
    renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(screen.getByDisplayValue('Test Cafe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  // ── Viewer (no edit / no delete) ────────────────────────────────────────────
  it('FE-COMP-COLDETAIL-006: hides Edit and Remove buttons when canEdit=false && canDelete=false', async () => {
    renderDetail({ canEdit: false, canDelete: false });
    // Wait for the async photo effect to settle before asserting absence.
    expect(await screen.findByRole('button', { name: 'Copy to trip' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove from list' })).not.toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-007: clicking a status option does NOT call onSetStatus when canEdit=false', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: false, canDelete: false });
    const visited = await screen.findByRole('button', { name: 'Visited' });
    await user.click(visited);
    expect(props.onSetStatus).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLDETAIL-008: status segment still renders (read-only) for viewers', async () => {
    renderDetail({ canEdit: false, canDelete: false });
    expect(await screen.findByRole('button', { name: 'Idea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visited' })).toBeInTheDocument();
  });

  // ── Copy-to-trip is available in read mode regardless of permissions ─────────
  it('FE-COMP-COLDETAIL-009: Copy to trip button fires onCopyToTrip (editor)', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true, canDelete: true });
    await user.click(await screen.findByRole('button', { name: 'Copy to trip' }));
    expect(props.onCopyToTrip).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COLDETAIL-010: Copy to trip button fires onCopyToTrip (viewer)', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: false, canDelete: false });
    await user.click(await screen.findByRole('button', { name: 'Copy to trip' }));
    expect(props.onCopyToTrip).toHaveBeenCalledTimes(1);
  });

  // ── Custom cover image (#1136) ──────────────────────────────────────────────
  it('FE-COMP-COLDETAIL-011: shows the cover upload control when canEdit && onUploadImage', async () => {
    const user = userEvent.setup();
    renderDetail({ canEdit: true, onUploadImage: vi.fn() });
    const camera = await screen.findByRole('button', { name: 'Upload image' });
    expect(camera).toBeInTheDocument();

    // The camera button proxies the hidden file input.
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clicked = vi.fn();
    input.addEventListener('click', clicked);
    await user.click(camera);
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COLDETAIL-012: hides the cover upload control when onUploadImage is not provided', async () => {
    renderDetail({ canEdit: true });
    // Wait for the mount photo effect to settle before asserting absence.
    expect(await screen.findByRole('button', { name: 'Copy to trip' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change image' })).not.toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-013: removing a custom cover calls onSave with { image_url: null }', async () => {
    const user = userEvent.setup();
    const withImage: CollectionPlace = { ...place, image_url: '/uploads/places/mock.jpg' };
    const props = renderDetail({ canEdit: true, onUploadImage: vi.fn(), place: withImage });
    await user.click(await screen.findByRole('button', { name: 'Remove image' }));
    expect(props.onSave).toHaveBeenCalledWith({ image_url: null });
  });

  it('FE-COMP-COLDETAIL-014: a failing cover removal surfaces the upload error', async () => {
    const user = userEvent.setup();
    const withImage: CollectionPlace = { ...place, image_url: '/uploads/places/mock.jpg' };
    const onSave = vi.fn(() => Promise.reject({ response: { data: { error: 'Disk full' } } }));
    renderDetail({ canEdit: true, onUploadImage: vi.fn(), place: withImage, onSave });

    await user.click(await screen.findByRole('button', { name: 'Remove image' }));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Disk full', 'error', undefined));
  });

  it('FE-COMP-COLDETAIL-015: picking a cover file hands the normalized file to onUploadImage', async () => {
    const onUploadImage = vi.fn(async (_file: File) => {});
    renderDetail({ canEdit: true, onUploadImage });
    await screen.findByRole('button', { name: 'Upload image' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onUploadImage).toHaveBeenCalledTimes(1));
    expect(onUploadImage.mock.calls[0][0]).toBe(file);
    // The picker resets so re-selecting the same file fires again.
    expect(input.value).toBe('');
  });

  it('FE-COMP-COLDETAIL-016: a cancelled file picker uploads nothing', async () => {
    const onUploadImage = vi.fn(async () => {});
    renderDetail({ canEdit: true, onUploadImage });
    await screen.findByRole('button', { name: 'Upload image' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(onUploadImage).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLDETAIL-017: a failing upload surfaces the error and clears the busy state', async () => {
    const onUploadImage = vi.fn(() => Promise.reject(new Error('Upload rejected')));
    renderDetail({ canEdit: true, onUploadImage });
    await screen.findByRole('button', { name: 'Upload image' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'cover.png', { type: 'image/png' })] } });

    // A rejection without a server payload falls back to the localized message.
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Could not upload image', 'error', undefined));
    // The spinner is gone again, so the control accepts a retry.
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
  });

  it('FE-COMP-COLDETAIL-018: the cover renders the fetched provider photo when the place has none', async () => {
    server.use(
      http.get('/api/maps/place-photo/:id', () =>
        HttpResponse.json({ photoUrl: 'https://cdn.example/photo.jpg', attribution: null }),
      ),
    );
    renderDetail({ place: { ...place, google_place_id: 'gp-1' } });

    await waitFor(() =>
      expect(document.querySelector('.col-detail-cover img')).toHaveAttribute('src', 'https://cdn.example/photo.jpg'),
    );
  });

  it('FE-COMP-COLDETAIL-018b: a place with its own image never asks the provider for a photo', async () => {
    const photo = vi.fn();
    server.use(http.get('/api/maps/place-photo/:id', () => { photo(); return HttpResponse.json({ photoUrl: null }); }));
    renderDetail({ place: { ...place, image_url: '/uploads/places/mine.jpg', google_place_id: 'gp-1' } });

    await screen.findByRole('heading', { name: 'Test Cafe' });
    expect(document.querySelector('.col-detail-cover img')).toHaveAttribute('src', '/uploads/places/mine.jpg');
    expect(photo).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLDETAIL-019: the category chip and the assigned label chips render in read mode', async () => {
    renderDetail({ labels: LABELS, place: { ...place, label_ids: [1] } });
    expect(await screen.findByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    // Only the assigned label shows — the list's other labels stay hidden.
    expect(screen.queryByText('Nightlife')).not.toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-020: the description renders as markdown and links become chips', async () => {
    renderDetail({
      place: {
        ...place,
        description: '# Heading\n\nsome **bold** text',
        links: [{ url: 'https://www.example.com/menu', label: 'Menu' }, { url: 'https://tickets.example/x' }],
      },
    });
    expect(await screen.findByRole('heading', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: /Menu/ })).toHaveAttribute('href', 'https://www.example.com/menu');
    // Unlabelled link falls back to the bare hostname.
    expect(screen.getByRole('link', { name: /tickets\.example/ })).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-021: the rating control renders only when onRate is supplied', async () => {
    const onRate = vi.fn(async () => {});
    renderDetail({ onRate, place: { ...place, rating_avg: 4 } });
    const stars = await screen.findByRole('radiogroup');
    await userEvent.setup().click(within(stars).getByRole('radio', { name: '5' }));
    expect(onRate).toHaveBeenCalledWith(5);
  });

  it('FE-COMP-COLDETAIL-022: edit mode exposes the category picker and switching category sticks', async () => {
    const user = userEvent.setup();
    renderDetail({ canEdit: true, categories: CATEGORIES, place: { ...place, category_id: 1 } });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Food$/ })).toHaveClass('on');

    await user.click(screen.getByRole('button', { name: /^Museums$/ }));
    expect(screen.getByRole('button', { name: /^Museums$/ })).toHaveClass('on');

    await user.click(screen.getByRole('button', { name: 'No category' }));
    expect(screen.getByRole('button', { name: 'No category' })).toHaveClass('on');
  });

  it('FE-COMP-COLDETAIL-023: saving from edit mode sends the whole patch and leaves edit mode', async () => {
    const user = userEvent.setup();
    const props = renderDetail({
      canEdit: true,
      categories: CATEGORIES,
      labels: LABELS,
      place: { ...place, lat: 52.5, lng: 13.4, label_ids: [1] },
    });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const nameInput = screen.getByLabelText('List name');
    await user.clear(nameInput);
    await user.type(nameInput, '  Renamed Cafe  ');
    await user.click(screen.getByRole('button', { name: /^Museums$/ }));
    await user.click(screen.getByRole('button', { name: /Nightlife/ }));
    const desc = screen.getByPlaceholderText('Add a description…');
    await user.clear(desc);
    await user.type(desc, 'Great coffee');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave).toHaveBeenCalledWith({
      name: 'Renamed Cafe',
      description: 'Great coffee',
      links: [{ label: undefined, url: 'https://x.com' }],
      category_id: 2,
      label_ids: [1, 2],
      // Untouched in this case, but the address rides along on every save (#1870).
      address: 'Somewhere',
      lat: 52.5,
      lng: 13.4,
    });
    // Back in read mode.
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-024: an empty name and description fall back to the stored name and null', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true, place: { ...place, description: 'Nice spot', links: [] } });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    await user.clear(screen.getByLabelText('List name'));
    await user.clear(screen.getByPlaceholderText('Add a description…'));
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Cafe',
      description: null,
      lat: null,
      lng: null,
    }));
  });

  it('FE-COMP-COLDETAIL-025: a failed save toasts the server message and keeps the form open', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => Promise.reject({ response: { data: { error: 'Name taken' } } }));
    renderDetail({ canEdit: true, onSave });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Name taken', 'error', undefined));
    expect(screen.getByLabelText('List name')).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-026: Cancel discards the edits and returns to read mode', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    await user.type(screen.getByLabelText('List name'), ' Extra');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Test Cafe' })).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-027: links can be added, relabelled and removed in edit mode', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true, place: { ...place, links: [] } });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    await user.click(screen.getByRole('button', { name: /Add link/ }));
    await user.type(screen.getByPlaceholderText('Label'), 'Site');
    await user.type(screen.getByPlaceholderText('https://…'), 'example.com/menu');

    await user.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    // A bare host is normalized to an absolute https url before it is saved.
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
      links: [{ label: 'Site', url: 'https://example.com/menu' }],
    }));
  });

  it('FE-COMP-COLDETAIL-028: an emptied link row is dropped from the saved patch', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true, place: { ...place, links: [{ url: 'https://x.com' }] } });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    // Two rows: the existing link plus a blank one that never gets a url.
    await user.click(screen.getByRole('button', { name: /Add link/ }));
    expect(screen.getAllByPlaceholderText('https://…')).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ links: [] }));
  });

  it('FE-COMP-COLDETAIL-029: pasting a "lat, lng" pair into the latitude field fills both inputs', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const latInput = screen.getByPlaceholderText('Latitude (e.g. 48.8566)');
    fireEvent.paste(latInput, { clipboardData: { getData: () => ' 48.8566, 2.3522 ' } });

    expect(latInput).toHaveValue('48.8566');
    expect(screen.getByPlaceholderText('Longitude (e.g. 2.3522)')).toHaveValue('2.3522');

    await user.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ lat: 48.8566, lng: 2.3522 }));
  });

  it('FE-COMP-COLDETAIL-030: a paste that is not a coordinate pair is left to the input', async () => {
    const user = userEvent.setup();
    renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const latInput = screen.getByPlaceholderText('Latitude (e.g. 48.8566)');
    fireEvent.paste(latInput, { clipboardData: { getData: () => 'somewhere nice' } });

    expect(latInput).toHaveValue('');
    expect(screen.getByPlaceholderText('Longitude (e.g. 2.3522)')).toHaveValue('');
  });

  it('FE-COMP-COLDETAIL-031: opening a different place resets the form back to read mode', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('List name')).toBeInTheDocument();

    const other: CollectionPlace = { ...place, id: 2, name: 'Second Bar', description: null, links: [] };
    render(<TranslatedDetail {...{ ...props, place: other }} />);

    // The freshly mounted sheet shows the new place in read mode.
    expect(await screen.findByRole('heading', { name: 'Second Bar' })).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-032: the labels field is omitted when the list defines none', async () => {
    const user = userEvent.setup();
    renderDetail({ canEdit: true, labels: [] });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Coordinates')).toBeInTheDocument();
    expect(screen.queryByText('Labels')).not.toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-033: the anchor rect docks the sheet over the given column', async () => {
    renderDetail({ anchorRect: { left: 320, width: 420 } });
    await screen.findByRole('heading', { name: 'Test Cafe' });

    const sheet = document.querySelector('.col-detail') as HTMLElement;
    expect(sheet).toHaveClass('docked');
    expect(sheet.style.left).toBe('320px');
    expect(sheet.style.width).toBe('420px');
  });

  it('FE-COMP-COLDETAIL-034: the header close button hands back to the caller', async () => {
    const user = userEvent.setup();
    const props = renderDetail();
    await user.click(await screen.findByRole('button', { name: 'Close' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COLDETAIL-035: the remove action fires onRemove for an admin', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canDelete: true });
    await user.click(await screen.findByRole('button', { name: 'Remove from list' }));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });
});

// ── Directions (#1455) ───────────────────────────────────────────────────────

describe('CollectionPlaceDetail — open in maps', () => {
  const located: CollectionPlace = { ...place, lat: 48.8584, lng: 2.2945, name: 'Eiffel Tower' };

  it('FE-COMP-COLDETAIL-036: a located place offers every map app', async () => {
    const user = userEvent.setup();
    renderDetail({ place: located });

    await user.click(screen.getByRole('button', { name: 'Navigation' }));

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Google Maps' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Waze' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'OpenStreetMap' })).toBeInTheDocument();
  });

  it('FE-COMP-COLDETAIL-037: opening a target hands the coordinates and the name over', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderDetail({ place: located });

    await user.click(screen.getByRole('button', { name: 'Navigation' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Waze' }));

    // Both, so it lands on the place rather than on a bare pin.
    const url = String(open.mock.calls[0][0]);
    expect(url).toContain('48.8584,2.2945');
    expect(url).toContain(encodeURIComponent('Eiffel Tower'));
    open.mockRestore();
  });

  it('FE-COMP-COLDETAIL-038: a place with only a name and an address still opens a search', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    // No coordinates and no provider id — the state a place typed in by hand is
    // in. The apps that need a pin drop out; the two that can take a search
    // string are still offered.
    renderDetail();

    await user.click(screen.getByRole('button', { name: 'Navigation' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).queryByRole('menuitem', { name: 'Waze' })).toBeNull();

    await user.click(within(menu).getByRole('menuitem', { name: 'Google Maps' }));

    expect(String(open.mock.calls[0][0])).toContain(encodeURIComponent('Test Cafe, Somewhere'));
    open.mockRestore();
  });

  it('FE-COMP-COLDETAIL-039: a place with nothing to locate it offers no button at all', () => {
    renderDetail({ place: { ...place, name: '', address: null } });

    expect(screen.queryByRole('button', { name: /navigation|google maps/i })).toBeNull();
  });
});

// ── Editable address (#1870) ─────────────────────────────────────────────────

describe('CollectionPlaceDetail: editable address', () => {
  it('FE-COMP-COLDETAIL-040: edit mode offers an address field seeded from the place', async () => {
    const user = userEvent.setup();
    renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Street, City, Country')).toHaveValue('Somewhere');
  });

  it('FE-COMP-COLDETAIL-041: a corrected address is trimmed into the patch', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const addressInput = screen.getByPlaceholderText('Street, City, Country');
    await user.clear(addressInput);
    await user.type(addressInput, '  Via Nuova 1  ');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ address: 'Via Nuova 1' }));
  });

  it('FE-COMP-COLDETAIL-042: an emptied address is sent as null', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    await user.clear(screen.getByPlaceholderText('Street, City, Country'));
    await user.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(props.onSave).toHaveBeenCalled());
    expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ address: null }));
  });

  it('FE-COMP-COLDETAIL-043: Cancel restores the stored address', async () => {
    const user = userEvent.setup();
    const props = renderDetail({ canEdit: true });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    await user.type(screen.getByPlaceholderText('Street, City, Country'), ' 2');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Somewhere')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByPlaceholderText('Street, City, Country')).toHaveValue('Somewhere');
  });
});
