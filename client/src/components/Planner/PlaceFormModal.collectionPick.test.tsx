// FE-PLANNER-PLACEFORM-125: a place picked from a collection inside a trip (#3074).
import { placeFormProps, seedPlaceFormStores } from '../../../tests/helpers/placeFormSetup';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { collectionsApi } from '../../api/collections';
import { useAddonStore } from '../../store/addonStore';
import PlaceFormModal from './PlaceFormModal';

vi.mock('../shared/CustomTimePicker', async () => ({
  default: (await import('../../../tests/helpers/placeForm')).TimePickerStub,
}));

beforeEach(() => {
  resetAllStores();
  seedPlaceFormStores();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PlaceFormModal with a place from a collection', () => {
  it('FE-PLANNER-PLACEFORM-125: a place picked from a collection keeps the category it was saved under (#3074)', async () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'collections', name: 'Collections', type: 'collections', icon: '', enabled: true }],
      loaded: true,
    });
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({
      collections: [{ id: 1, owner_id: 1, name: 'Tokyo 2026', color: '#ec4899' }],
      incomingInvites: [],
    });
    vi.spyOn(collectionsApi, 'get').mockResolvedValue({
      collection: { id: 1, owner_id: 1, name: 'Tokyo 2026', color: '#ec4899' },
      places: [
        {
          id: 10,
          collection_id: 1,
          name: 'Zebra Cafe',
          status: 'idea',
          lat: 35.66,
          lng: 139.7,
          category_id: 7,
          category: { id: 7, name: 'Must see', color: '#f59e0b', icon: 'Star' },
        },
      ],
    });
    const onSave = vi.fn().mockResolvedValue(undefined);
    // A cafe saved as "Must see": the guess from its kind would be the cafe category.
    const categories = [
      { id: 3, name: 'Cafe', color: '#7c3aed', icon: 'Coffee' },
      { id: 7, name: 'Must see', color: '#f59e0b', icon: 'Star' },
    ];
    render(<PlaceFormModal {...placeFormProps} categories={categories} onSave={onSave} />);
    fireEvent.click(await screen.findByText('Zebra Cafe'));
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Zebra Cafe', category_id: '7' }));
  });
});
