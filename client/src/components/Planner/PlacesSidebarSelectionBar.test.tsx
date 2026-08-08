// FE-PLANNER-SELBAR-001 to FE-PLANNER-SELBAR-014
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import { buildPlace } from '../../../tests/helpers/factories';
import { useTranslation } from '../../i18n';
import type { Place } from '../../types';
import { PlacesSelectionBar } from './PlacesSidebarSelectionBar';
import type { SidebarState } from './usePlacesSidebar';

const PLACES = [buildPlace({ id: 1 }), buildPlace({ id: 2 }), buildPlace({ id: 3 })];

interface BarProps {
  selectedIds?: Set<number>;
  filtered?: Place[];
  isMobile?: boolean;
  collectionsEnabled?: boolean;
  setSelectedIds?: (ids: Set<number>) => void;
  setPendingDeleteIds?: (ids: number[] | null) => void;
  setCategoryPickerOpen?: (open: boolean) => void;
  setSaveToListOpen?: (open: boolean) => void;
  onBulkDeletePlaces?: (ids: number[]) => void;
}

// The bar reads a handful of fields off the sidebar state; the rest of the hook
// is irrelevant here, so only those are supplied.
function Bar(overrides: BarProps) {
  const { t } = useTranslation();
  const state = {
    t,
    selectedIds: new Set<number>(),
    filtered: PLACES,
    isMobile: false,
    collectionsEnabled: false,
    setSelectedIds: () => {},
    setPendingDeleteIds: () => {},
    setCategoryPickerOpen: () => {},
    setSaveToListOpen: () => {},
    onBulkDeletePlaces: undefined,
    ...overrides,
  };
  return <PlacesSelectionBar {...(state as unknown as SidebarState)} />;
}

describe('PlacesSelectionBar', () => {
  it('FE-PLANNER-SELBAR-001: reports how many places are selected', () => {
    render(<Bar selectedIds={new Set([1, 2])} />);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('FE-PLANNER-SELBAR-002: offers "Select all" while the selection is partial', () => {
    render(<Bar selectedIds={new Set([1])} />);
    expect(screen.getByRole('button', { name: 'Select all' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deselect all' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SELBAR-003: "Select all" selects every visible place', async () => {
    const user = userEvent.setup();
    const setSelectedIds = vi.fn((_ids: Set<number>) => {});
    render(<Bar selectedIds={new Set([1])} setSelectedIds={setSelectedIds} />);

    await user.click(screen.getByRole('button', { name: 'Select all' }));

    expect(setSelectedIds).toHaveBeenCalledWith(new Set([1, 2, 3]));
  });

  it('FE-PLANNER-SELBAR-004: a full selection flips the button to "Deselect all" and clears it', async () => {
    const user = userEvent.setup();
    const setSelectedIds = vi.fn((_ids: Set<number>) => {});
    render(<Bar selectedIds={new Set([1, 2, 3])} setSelectedIds={setSelectedIds} />);

    await user.click(screen.getByRole('button', { name: 'Deselect all' }));

    expect(setSelectedIds).toHaveBeenCalledWith(new Set());
  });

  it('FE-PLANNER-SELBAR-005: an empty list keeps the "Select all" wording', async () => {
    const user = userEvent.setup();
    const setSelectedIds = vi.fn((_ids: Set<number>) => {});
    render(<Bar filtered={[]} selectedIds={new Set()} setSelectedIds={setSelectedIds} />);

    // 0 === 0 would otherwise read as "everything is selected".
    const btn = screen.getByRole('button', { name: 'Select all' });
    await user.click(btn);

    expect(setSelectedIds).toHaveBeenCalledWith(new Set());
  });

  it('FE-PLANNER-SELBAR-006: the category button is disabled without a selection', () => {
    const setCategoryPickerOpen = vi.fn((_open: boolean) => {});
    render(<Bar selectedIds={new Set()} setCategoryPickerOpen={setCategoryPickerOpen} />);

    const btn = screen.getByRole('button', { name: 'Change category' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(setCategoryPickerOpen).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-SELBAR-007: the category button opens the bulk picker', async () => {
    const user = userEvent.setup();
    const setCategoryPickerOpen = vi.fn((_open: boolean) => {});
    render(<Bar selectedIds={new Set([1])} setCategoryPickerOpen={setCategoryPickerOpen} />);

    await user.click(screen.getByRole('button', { name: 'Change category' }));

    expect(setCategoryPickerOpen).toHaveBeenCalledWith(true);
  });

  it('FE-PLANNER-SELBAR-008: the collection button is hidden while the addon is off', () => {
    render(<Bar selectedIds={new Set([1])} collectionsEnabled={false} />);
    expect(screen.queryByRole('button', { name: 'Save to Collection' })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-SELBAR-009: the collection button opens the save sheet', async () => {
    const user = userEvent.setup();
    const setSaveToListOpen = vi.fn((_open: boolean) => {});
    render(<Bar selectedIds={new Set([1])} collectionsEnabled setSaveToListOpen={setSaveToListOpen} />);

    await user.click(screen.getByRole('button', { name: 'Save to Collection' }));

    expect(setSaveToListOpen).toHaveBeenCalledWith(true);
  });

  it('FE-PLANNER-SELBAR-010: the collection button is disabled without a selection', () => {
    const setSaveToListOpen = vi.fn((_open: boolean) => {});
    render(<Bar selectedIds={new Set()} collectionsEnabled setSaveToListOpen={setSaveToListOpen} />);

    const btn = screen.getByRole('button', { name: 'Save to Collection' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(setSaveToListOpen).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-SELBAR-011: on desktop delete goes straight to the bulk handler', async () => {
    const user = userEvent.setup();
    const onBulkDeletePlaces = vi.fn((_ids: number[]) => {});
    const setPendingDeleteIds = vi.fn((_ids: number[] | null) => {});
    render(
      <Bar
        selectedIds={new Set([2, 3])}
        onBulkDeletePlaces={onBulkDeletePlaces}
        setPendingDeleteIds={setPendingDeleteIds}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete selected' }));

    expect(onBulkDeletePlaces).toHaveBeenCalledWith([2, 3]);
    expect(setPendingDeleteIds).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-SELBAR-012: on mobile delete arms the confirm dialog instead', async () => {
    const user = userEvent.setup();
    const onBulkDeletePlaces = vi.fn((_ids: number[]) => {});
    const setPendingDeleteIds = vi.fn((_ids: number[] | null) => {});
    render(
      <Bar
        isMobile
        selectedIds={new Set([2, 3])}
        onBulkDeletePlaces={onBulkDeletePlaces}
        setPendingDeleteIds={setPendingDeleteIds}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete selected' }));

    expect(setPendingDeleteIds).toHaveBeenCalledWith([2, 3]);
    expect(onBulkDeletePlaces).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-SELBAR-013: hovering an enabled button highlights it and leaving resets it', () => {
    render(<Bar selectedIds={new Set([1])} collectionsEnabled />);

    for (const name of ['Select all', 'Change category', 'Save to Collection', 'Delete selected']) {
      const btn = screen.getByRole('button', { name });
      fireEvent.mouseEnter(btn);
      fireEvent.mouseLeave(btn);
      expect(btn.style.background).toBe('transparent');
    }
  });

  it('FE-PLANNER-SELBAR-014: hovering a disabled button leaves it unstyled', () => {
    render(<Bar selectedIds={new Set()} collectionsEnabled />);

    for (const name of ['Change category', 'Save to Collection', 'Delete selected']) {
      const btn = screen.getByRole('button', { name });
      fireEvent.mouseEnter(btn);
      expect(btn.style.background).toBe('');
    }
  });
});
