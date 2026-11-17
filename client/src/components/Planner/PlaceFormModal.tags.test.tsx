// FE-PLANNER-PLACEFORM-TAGS-001 to FE-PLANNER-PLACEFORM-TAGS-004: the place's tags in the
// desktop dialog. The logic is usePlaceTags', tested on its own; this is the form around it.
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildPlace, buildTag } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { placeFormProps, seedPlaceFormStores } from '../../../tests/helpers/placeFormSetup';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import PlaceFormModal from './PlaceFormModal';

vi.mock('../shared/CustomTimePicker', async () => ({
  default: (await import('../../../tests/helpers/placeForm')).TimePickerStub,
}));

const monument = buildTag({ id: 7, trip_id: 1, name: 'Monument', color: '#6366f1' });
const zone = buildTag({ id: 8, trip_id: 1, name: 'Zone', color: '#10b981' });

const tagGroup = () => screen.getByRole('group', { name: 'Tags' });
const tagSwitch = (name: string) => within(tagGroup()).getByRole('button', { name });

beforeEach(() => {
  resetAllStores();
  seedPlaceFormStores();
  seedStore(useTripStore, { tripTags: [monument, zone] });
});

describe('PlaceFormModal, the tags', () => {
  it('FE-PLANNER-PLACEFORM-TAGS-001: a new place is saved with the tags ticked in the form', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PlaceFormModal {...placeFormProps} onSave={onSave} />);
    expect(tagSwitch('Monument')).toHaveAttribute('aria-pressed', 'false');

    await user.type(screen.getByPlaceholderText(/e\.g\. Eiffel Tower/i), 'Belem Tower');
    await user.click(tagSwitch('Monument'));
    expect(tagSwitch('Monument')).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Belem Tower', tags: [7] }));
  });

  it('FE-PLANNER-PLACEFORM-TAGS-002: an edit starts from the tags the place carries and saves the whole set', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const place = buildPlace({ name: 'Belem Tower', tags: [{ id: 8, name: 'Zone' }] });
    render(<PlaceFormModal {...placeFormProps} place={place} onSave={onSave} />);
    expect(tagSwitch('Zone')).toHaveAttribute('aria-pressed', 'true');

    await user.click(tagSwitch('Monument'));
    await user.click(tagSwitch('Zone'));
    await user.click(screen.getByRole('button', { name: /^Update$/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ tags: [7] }));
  });

  it('FE-PLANNER-PLACEFORM-TAGS-003: an edit that never touched the tags leaves them out of the save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const place = buildPlace({ name: 'Belem Tower', tags: [{ id: 8, name: 'Zone' }] });
    render(<PlaceFormModal {...placeFormProps} place={place} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /^Update$/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('tags');
  });

  it('FE-PLANNER-PLACEFORM-TAGS-004: a name typed into the tag field becomes a tag of the trip, ticked, without saving the place', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    let sent: unknown;
    server.use(
      http.post('/api/trips/1/tags', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ tag: buildTag({ id: 9, trip_id: 1, name: 'Viewpoint' }) }, { status: 201 });
      })
    );
    render(<PlaceFormModal {...placeFormProps} onSave={onSave} />);
    const field = screen.getByRole('textbox', { name: 'New tag' });
    expect(screen.getByRole('button', { name: 'Add tag' })).toBeDisabled();

    await user.type(field, 'Viewpoint{Enter}');

    // The tag reaches the trip first and is ticked a beat later, so wait for the tick itself.
    await waitFor(() => expect(tagSwitch('Viewpoint')).toHaveAttribute('aria-pressed', 'true'));
    expect(sent).toMatchObject({ name: 'Viewpoint' });
    expect(field).toHaveValue('');
    expect(useTripStore.getState().tripTags.map((tag) => tag.name)).toEqual(['Monument', 'Viewpoint', 'Zone']);
    expect(onSave).not.toHaveBeenCalled();
  });
});
