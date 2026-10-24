// FE-PLANNER-PLIMGPICK-001 to FE-PLANNER-PLIMGPICK-016: the editor's picture picker, the one
// place a place's picture is chosen: the upload tile, the current picture, the images
// attached to the place, the sources' photos, the credit line and "Remove image".
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PlacePhotoCandidate } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTripFile } from '../../../tests/helpers/factories';
import { placePictureRepo } from '../../repo/placePictureRepo';
import { normalizeImageFile } from '../../utils/convertHeic';
import PlaceImagePicker, { PhotoCredit, type PlaceImageOwn } from './PlaceImagePicker';
import type { ChosenImage } from './placeImageChoice';

vi.mock('../../repo/placePictureRepo', () => ({ placePictureRepo: { attachedImage: vi.fn() } }));
vi.mock('../../utils/convertHeic', () => ({
  normalizeImageFile: vi.fn(async (file: File) => new File([file], `normalized-${file.name}`, { type: 'image/jpeg' })),
}));

/** Echo the key back, which keeps the assertions readable. */
const t = ((key: string) => key) as never;

const CURRENT = '/uploads/places/current.jpg';

const COMMONS: PlacePhotoCandidate = {
  key: 'w~p0',
  url: '/api/maps/place-photo/w~p0/bytes',
  attribution: 'Alice',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg',
  source: 'wikimedia',
} as PlacePhotoCandidate;

const GOOGLE: PlacePhotoCandidate = {
  key: 'w~p1',
  url: '/api/maps/place-photo/w~p1/bytes',
  attribution: null,
  license: null,
  licenseUrl: null,
  sourceUrl: null,
  source: 'google',
} as PlacePhotoCandidate;

const ATTACHED = buildTripFile({ id: 41, original_name: 'facade.png', mime_type: 'image/png', url: '/api/files/41' });

function own(over: Partial<PlaceImageOwn> = {}): PlaceImageOwn {
  return {
    currentUrl: null,
    attached: [],
    pendingPreview: null,
    canUpload: true,
    onUpload: vi.fn(),
    onPickAttached: vi.fn(),
    onRemove: vi.fn(),
    ...over,
  };
}

function renderPicker(
  props: Partial<{
    photos: PlacePhotoCandidate[];
    chosen: ChosenImage;
    own: PlaceImageOwn;
    dialog: boolean;
  }> = {}
) {
  const onPickUrl = vi.fn();
  const utils = render(
    <PlaceImagePicker
      photos={props.photos ?? []}
      chosen={props.chosen ?? { kind: 'none' }}
      onPickUrl={onPickUrl}
      own={props.own}
      dialog={props.dialog}
      t={t}
    />
  );
  return { ...utils, onPickUrl };
}

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

beforeEach(() => {
  vi.mocked(placePictureRepo.attachedImage).mockReset();
  vi.mocked(placePictureRepo.attachedImage).mockResolvedValue('blob:attached');
  vi.mocked(normalizeImageFile).mockClear();
});

describe('PlaceImagePicker', () => {
  it('FE-PLANNER-PLIMGPICK-001: renders nothing while there is no picture to offer and no upload', () => {
    const bare = renderPicker();
    expect(bare.container).toBeEmptyDOMElement();
    bare.unmount();

    const readOnly = renderPicker({ own: own({ canUpload: false }) });
    expect(readOnly.container).toBeEmptyDOMElement();
  });

  it('FE-PLANNER-PLIMGPICK-002: the upload tile opens the file picker and hands the converted file over', async () => {
    const mine = own();
    renderPicker({ own: mine });
    const tile = screen.getByRole('button', { name: 'places.uploadImage' });
    expect(tile).toHaveAttribute('aria-pressed', 'false');
    const input = fileInput();
    expect(input).toHaveAttribute('accept', 'image/*,.heic,.heif');
    const openPicker = vi.spyOn(input, 'click');
    fireEvent.click(tile);
    expect(openPicker).toHaveBeenCalledTimes(1);

    const picture = new File(['x'], 'photo.heic', { type: 'image/heic' });
    fireEvent.change(input, { target: { files: [picture] } });
    await waitFor(() => expect(mine.onUpload).toHaveBeenCalledTimes(1));
    expect(normalizeImageFile).toHaveBeenCalledWith(picture);
    expect(vi.mocked(mine.onUpload).mock.calls[0][0].name).toBe('normalized-photo.heic');
    await waitFor(() => expect(tile).not.toBeDisabled());
  });

  it('FE-PLANNER-PLIMGPICK-003: an emptied file choice hands nothing over', () => {
    const mine = own();
    renderPicker({ own: mine });
    fireEvent.change(fileInput(), { target: { files: [] } });
    expect(normalizeImageFile).not.toHaveBeenCalled();
    expect(mine.onUpload).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-PLIMGPICK-004: a picture waiting for the save shows as its preview, chosen and credited as yours', () => {
    renderPicker({ own: own({ pendingPreview: 'blob:preview' }), chosen: { kind: 'upload' } });
    const tile = screen.getByRole('button', { name: 'places.uploadImage' });
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(tile.querySelector('img')).toHaveAttribute('src', 'blob:preview');
    expect(screen.getByText('places.image.own')).toBeInTheDocument();
    // A waiting upload can be dropped again.
    expect(screen.getByRole('button', { name: 'places.removeImage' })).toBeInTheDocument();
  });

  it('FE-PLANNER-PLIMGPICK-005: the current picture is chosen by default, and a second tap removes it', () => {
    const mine = own({ currentUrl: CURRENT });
    renderPicker({ own: mine, chosen: { kind: 'current' } });
    const tile = screen.getByRole('button', { name: 'places.image.current' });
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(tile.querySelector('img')).toHaveAttribute('src', CURRENT);
    expect(screen.getByText('places.image.current')).toBeInTheDocument();

    fireEvent.click(tile);
    expect(mine.onRemove).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLIMGPICK-006: once dropped, the current picture is taken back with a tap', () => {
    const mine = own({ currentUrl: CURRENT });
    const { onPickUrl } = renderPicker({ own: mine, chosen: { kind: 'none' } });
    // The line under the grid says what the save will do.
    expect(screen.getByText('places.image.none')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'places.removeImage' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'places.image.current' }));
    expect(onPickUrl).toHaveBeenCalledWith(CURRENT);
    expect(mine.onRemove).not.toHaveBeenCalled();
  });

  it("FE-PLANNER-PLIMGPICK-007: a current picture that is one of the sources' photos is not shown twice", () => {
    renderPicker({ photos: [COMMONS], own: own({ currentUrl: COMMONS.url }), chosen: { kind: 'current' } });
    expect(screen.queryByRole('button', { name: 'places.image.current' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /places.details.pickImage/ })).toHaveLength(1);
  });

  it('FE-PLANNER-PLIMGPICK-008: an attached image loads through the file route and is picked with a tap', async () => {
    const mine = own({ attached: [ATTACHED] });
    renderPicker({ own: mine });
    const tile = screen.getByRole('button', { name: 'facade.png' });
    await waitFor(() => expect(tile.querySelector('img')).toHaveAttribute('src', 'blob:attached'));
    expect(placePictureRepo.attachedImage).toHaveBeenCalledWith('/api/files/41');

    fireEvent.click(tile);
    expect(mine.onPickAttached).toHaveBeenCalledWith(ATTACHED);
  });

  it('FE-PLANNER-PLIMGPICK-009: a chosen attached image is ticked and named under the grid; one that fails to load stays blank', async () => {
    vi.mocked(placePictureRepo.attachedImage).mockRejectedValue(new Error('gone'));
    renderPicker({ own: own({ attached: [ATTACHED] }), chosen: { kind: 'attached', fileId: 41 } });
    const tile = screen.getByRole('button', { name: 'facade.png' });
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('facade.png')).toBeInTheDocument();
    await waitFor(() => expect(placePictureRepo.attachedImage).toHaveBeenCalled());
    expect(tile.querySelector('img')).toBeNull();

    // Focusing it names it as well, and the name stays once it is left.
    fireEvent.focus(tile);
    expect(screen.getByText('facade.png')).toBeInTheDocument();
    fireEvent.blur(tile);
    expect(screen.getByText('facade.png')).toBeInTheDocument();
  });

  it("FE-PLANNER-PLIMGPICK-010: a source's photo is picked with a tap and let go with a second", () => {
    const first = renderPicker({ photos: [COMMONS, GOOGLE] });
    fireEvent.click(screen.getByRole('button', { name: 'places.details.pickImage: Alice' }));
    expect(first.onPickUrl).toHaveBeenCalledWith(COMMONS.url);
    first.unmount();

    const chosen = renderPicker({ photos: [COMMONS, GOOGLE], chosen: { kind: 'url', url: GOOGLE.url } });
    const tile = screen.getByRole('button', { name: 'places.details.pickImage: Google' });
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(tile);
    expect(chosen.onPickUrl).toHaveBeenCalledWith(null);
  });

  it('FE-PLANNER-PLIMGPICK-011: the chosen photo is credited with its author and licence, each linked', () => {
    renderPicker({ photos: [COMMONS, GOOGLE], chosen: { kind: 'url', url: COMMONS.url } });
    expect(screen.getByText('Alice').closest('a')).toHaveAttribute('href', COMMONS.sourceUrl);
    expect(screen.getByText('CC BY-SA 4.0').closest('a')).toHaveAttribute('href', COMMONS.licenseUrl);

    // Hovering another tile moves the credit line to it, leaving moves it back.
    const google = screen.getByRole('button', { name: 'places.details.pickImage: Google' });
    fireEvent.mouseEnter(google);
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    fireEvent.mouseLeave(google);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('FE-PLANNER-PLIMGPICK-012: without the own pictures the first photo is credited and nothing can be removed', () => {
    renderPicker({ photos: [COMMONS], chosen: { kind: 'url', url: '/not/among/them.jpg' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'places.removeImage' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-PLIMGPICK-013: "Remove image" leaves the place without a picture', () => {
    const mine = own({ currentUrl: CURRENT });
    renderPicker({ own: mine, photos: [COMMONS], chosen: { kind: 'url', url: COMMONS.url } });
    fireEvent.click(screen.getByRole('button', { name: 'places.removeImage' }));
    expect(mine.onRemove).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLIMGPICK-014: the sheet gives each photo a native tooltip, the dialog does not', () => {
    const sheet = renderPicker({ photos: [COMMONS, GOOGLE] });
    expect(screen.getByRole('button', { name: 'places.details.pickImage: Alice' })).toHaveAttribute(
      'title',
      'Alice, CC BY-SA 4.0'
    );
    expect(screen.getByRole('button', { name: 'places.details.pickImage: Google' })).toHaveAttribute('title', 'Google');
    sheet.unmount();

    renderPicker({ photos: [COMMONS], dialog: true });
    expect(screen.getByRole('button', { name: 'places.details.pickImage: Alice' })).not.toHaveAttribute('title');
  });
});

describe('PhotoCredit', () => {
  it('FE-PLANNER-PLIMGPICK-015: a photo without links is still credited in plain text', () => {
    render(<PhotoCredit photo={{ ...COMMONS, sourceUrl: null, licenseUrl: null }} />);
    expect(screen.getByText('Alice').closest('a')).toBeNull();
    expect(screen.getByText('CC BY-SA 4.0').closest('a')).toBeNull();
  });

  it('FE-PLANNER-PLIMGPICK-016: a photo without a licence shows only its credit', () => {
    const { container } = render(<PhotoCredit photo={GOOGLE} />);
    expect(container).toHaveTextContent(/^Google$/);
  });
});
