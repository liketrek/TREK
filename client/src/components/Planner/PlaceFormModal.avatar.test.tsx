// The avatar's tie to the details pane's picker and to upload/remove. Lives in its
// own file because it needs the detail column mocked, and the main PlaceFormModal
// suite has cases that must exercise the real one.
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser, buildTrip, buildPlace } from '../../../tests/helpers/factories';
import PlaceFormModal from './PlaceFormModal';

// The enrichment fetch and the tiles are PlaceDetailsColumn's own concern; here
// only its onPickImage callback matters.
vi.mock('./PlaceDetailsColumn', () => ({
  default: ({ header, onPickImage }: { header?: unknown; onPickImage: (url: string | null) => void }) => (
    <div>
      {header as never}
      <button type="button" onClick={() => onPickImage('/uploads/picked.jpg')}>pick tile</button>
    </div>
  ),
}));

vi.mock('../shared/CustomTimePicker', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="time-picker" type="text" value={value} onChange={e => onChange(e.target.value)} />
  ),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  place: null,
  prefillCoords: null,
  tripId: 1,
  categories: [],
  onCategoryCreated: vi.fn(),
  assignmentId: null,
  dayAssignments: [],
};

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true, hasMapsKey: false });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
});

describe('PlaceFormModal — thumbnail wiring', () => {
  it('FE-PLANNER-PLACEFORM-AVATAR-001: a picture picked in the details pane drives the avatar', async () => {
    const place = buildPlace({ id: 58, name: 'Pictured' });
    render(<PlaceFormModal {...defaultProps} place={place} onUploadImage={vi.fn(async () => null)} />);
    fireEvent.click(screen.getByRole('button', { name: 'pick tile' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change image' })).toBeInTheDocument());
  });

  it('FE-PLANNER-PLACEFORM-AVATAR-002: picking still works after a remove', async () => {
    const place = buildPlace({ id: 59, name: 'Pictured', image_url: '/uploads/places/x.jpg' });
    render(<PlaceFormModal {...defaultProps} place={place} onUploadImage={vi.fn(async () => null)} onRemoveImage={vi.fn()} />);
    // Remove first: the cleared state must not latch the avatar shut.
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove image' })).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'pick tile' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change image' })).toBeInTheDocument());
  });
});
