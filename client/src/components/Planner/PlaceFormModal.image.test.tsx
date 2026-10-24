// FE-PLANNER-PLACEFORM-125 to FE-PLANNER-PLACEFORM-127: the place's picture in the desktop
// dialog. Nothing is sent before the save; the waiting picture travels with it.
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPlace, buildTripFile } from '../../../tests/helpers/factories';
import { placeFormProps, seedPlaceFormStores } from '../../../tests/helpers/placeFormSetup';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import PlaceFormModal from './PlaceFormModal';

vi.mock('../shared/CustomTimePicker', async () => ({
  default: (await import('../../../tests/helpers/placeForm')).TimePickerStub,
}));
vi.mock('../../api/authUrl', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/authUrl')>()),
  fetchImageAsBlob: vi.fn(async () => 'blob:attached'),
}));

const imageInput = () => document.querySelector('input[type="file"][accept^="image"]') as HTMLInputElement;

beforeEach(() => {
  resetAllStores();
  seedPlaceFormStores();
  // Without the details column the picker sits in the form itself.
  seedStore(useAuthStore, { placesEnrichEnabled: false });
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:form-preview');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PlaceFormModal, the picture', () => {
  it('FE-PLANNER-PLACEFORM-125: a new place gets a picture from the device, uploaded once the save made it', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PlaceFormModal {...placeFormProps} onSave={onSave} />);
    expect(screen.getByText('Pick a picture')).toBeInTheDocument();

    const picture = new File(['x'], 'front.png', { type: 'image/png' });
    fireEvent.change(imageInput(), { target: { files: [picture] } });
    const tile = await screen.findByRole('button', { name: 'Upload image', pressed: true });
    expect(tile.querySelector('img')).toHaveAttribute('src', 'blob:form-preview');

    await user.type(screen.getByPlaceholderText(/e\.g\. Eiffel Tower/i), 'Louvre');
    await user.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Louvre', _pendingImage: picture }));
  });

  it('FE-PLANNER-PLACEFORM-126: an edited place keeps its picture as chosen, or takes an attached image by its id', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const place = buildPlace({ id: 61, name: 'Gallery', image_url: '/uploads/places/61.jpg' });
    useTripStore.setState({
      files: [buildTripFile({ id: 88, place_id: 61, mime_type: 'image/jpeg', original_name: 'hall.jpg' })],
    } as never);
    render(<PlaceFormModal {...placeFormProps} place={place} onSave={onSave} />);

    expect(screen.getByRole('button', { name: 'Current picture' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'hall.jpg' }));
    expect(screen.getByRole('button', { name: 'hall.jpg' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Current picture' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ _pendingImage: { fileId: 88 } }));
  });

  it('FE-PLANNER-PLACEFORM-127: removing the picture saves the place without one, and nothing waits', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const place = buildPlace({ id: 62, name: 'Bridge', image_url: '/uploads/places/62.jpg' });
    render(<PlaceFormModal {...placeFormProps} place={place} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(screen.getByRole('button', { name: 'Current picture' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('No picture')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];
    expect(payload.image_url).toBeNull();
    expect(payload._pendingImage).toBeUndefined();
  });
});
