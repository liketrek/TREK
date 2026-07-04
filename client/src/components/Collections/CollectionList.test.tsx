// FE-COMP-COLLIST-001 to FE-COMP-COLLIST-010
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { CollectionPlace } from '@trek/shared';
import { useAuthStore } from '../../store/authStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildUser } from '../../../tests/helpers/factories';
import { useTranslation } from '../../i18n/TranslationContext';
import CollectionList from './CollectionList';

// A saved-place row calls PlaceAvatar, which reads placesPhotosEnabled from the
// auth store. Seeding it false (and leaving image_url unset) keeps the avatar a
// plain category icon — no photoService fetch, no network in the test.

// Two inline CollectionPlace literals: one categorised (idea), one bare (want).
const cafe = {
  id: 101,
  collection_id: 1,
  name: 'Blue Bottle Coffee',
  address: '123 Market St, San Francisco',
  status: 'idea',
  category: { id: 5, name: 'Cafe', color: '#f59e0b', icon: 'Coffee' },
  image_url: null,
} as unknown as CollectionPlace;

const bridge = {
  id: 202,
  collection_id: 1,
  name: 'Golden Gate Bridge',
  address: 'Golden Gate, San Francisco',
  status: 'want',
  image_url: null,
} as unknown as CollectionPlace;

const places = [cafe, bridge];

// Grab the real English translation fn so status labels match visible strings.
function TFnProbe({ onReady }: { onReady: (t: ReturnType<typeof useTranslation>['t']) => void }) {
  const { t } = useTranslation();
  onReady(t);
  return null;
}

let t: ReturnType<typeof useTranslation>['t'];
render(<TFnProbe onReady={fn => { t = fn; }} />);

interface Handlers {
  onOpenPlace: ReturnType<typeof vi.fn>;
  onStatusChange: ReturnType<typeof vi.fn>;
  onToggleSelect: ReturnType<typeof vi.fn>;
}

function renderList(over: Partial<{
  selectMode: boolean;
  selectedIds: number[];
  selectedPlaceId: number | null;
  onStatusChange: ((placeId: number, status: string) => void) | undefined;
}> = {}, handlers?: Handlers) {
  const h = handlers ?? {
    onOpenPlace: vi.fn(),
    onStatusChange: vi.fn(),
    onToggleSelect: vi.fn(),
  };
  const onStatusChange = 'onStatusChange' in over ? over.onStatusChange : h.onStatusChange;
  render(
    <CollectionList
      places={places}
      labels={[]}
      selectedPlaceId={over.selectedPlaceId ?? null}
      selectMode={over.selectMode ?? false}
      selectedIds={over.selectedIds ?? []}
      onOpenPlace={h.onOpenPlace as (id: number) => void}
      onStatusChange={onStatusChange as never}
      onToggleSelect={h.onToggleSelect as (id: number) => void}
      t={t}
    />,
  );
  return h;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), placesPhotosEnabled: false });
});

describe('CollectionList', () => {
  it('FE-COMP-COLLIST-001: renders both place names', () => {
    renderList();
    expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
    expect(screen.getByText('Golden Gate Bridge')).toBeInTheDocument();
  });

  it('FE-COMP-COLLIST-002: renders both place addresses', () => {
    renderList();
    expect(screen.getByText('123 Market St, San Francisco')).toBeInTheDocument();
    expect(screen.getByText('Golden Gate, San Francisco')).toBeInTheDocument();
  });

  it('FE-COMP-COLLIST-003: renders the category name for the categorised place', () => {
    renderList();
    expect(screen.getByText('Cafe')).toBeInTheDocument();
  });

  it('FE-COMP-COLLIST-004: clicking a row calls onOpenPlace with the place id', async () => {
    const user = userEvent.setup();
    const h = renderList();
    const row = screen.getByText('Blue Bottle Coffee').closest('.col-lrow') as HTMLElement;
    await user.click(row);
    expect(h.onOpenPlace).toHaveBeenCalledWith(101);
    expect(h.onToggleSelect).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLLIST-005: in select mode a row click calls onToggleSelect instead of onOpenPlace', async () => {
    const user = userEvent.setup();
    const h = renderList({ selectMode: true });
    const row = screen.getByText('Golden Gate Bridge').closest('.col-lrow') as HTMLElement;
    await user.click(row);
    expect(h.onToggleSelect).toHaveBeenCalledWith(202);
    expect(h.onOpenPlace).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLLIST-006: the status badge is an interactive button when onStatusChange is provided', () => {
    renderList();
    // idea → label "Idea"; the badge is a role=button span with aria-label = label.
    expect(screen.getByRole('button', { name: 'Idea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Want to go' })).toBeInTheDocument();
  });

  it('FE-COMP-COLLIST-007: clicking the interactive badge cycles the status without opening the place', async () => {
    const user = userEvent.setup();
    const h = renderList();
    await user.click(screen.getByRole('button', { name: 'Idea' }));
    // idea → want, and the badge stops propagation so the row does not open.
    expect(h.onStatusChange).toHaveBeenCalledWith(101, 'want');
    expect(h.onOpenPlace).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLLIST-008: the status badge is read-only (not a button) when onStatusChange is undefined', () => {
    renderList({ onStatusChange: undefined });
    // Label text still renders...
    expect(screen.getByText('Idea')).toBeInTheDocument();
    // ...but there is no interactive status button for it.
    expect(screen.queryByRole('button', { name: 'Idea' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Want to go' })).not.toBeInTheDocument();
  });

  it('FE-COMP-COLLIST-009: in select mode the status badge is read-only even with onStatusChange provided', () => {
    renderList({ selectMode: true });
    expect(screen.getByText('Idea')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Idea' })).not.toBeInTheDocument();
  });

  it('FE-COMP-COLLIST-010: renders one clickable row per place', () => {
    renderList();
    // Each place contributes a role=button row; badges add their own buttons too,
    // but every place name must sit inside a .col-lrow row element.
    expect(screen.getByText('Blue Bottle Coffee').closest('.col-lrow')).toBeInTheDocument();
    expect(screen.getByText('Golden Gate Bridge').closest('.col-lrow')).toBeInTheDocument();
  });
});
