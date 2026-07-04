// FE-COMP-COLFILTERBAR-001 to FE-COMP-COLFILTERBAR-008
import React from 'react';
import { render, screen, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTranslation } from '../../i18n/TranslationContext';
import type { CategoryOption } from '../../pages/collections/collectionsModel';
import type { StatusFilter } from '../../store/collectionStore';
import CollectionFilterBar from './CollectionFilterBar';

// The component takes `t` as a prop; pull the REAL translation fn from context so
// visible labels are actual English strings (All / Idea / Want to go / Visited / Select).
type HarnessProps = Omit<React.ComponentProps<typeof CollectionFilterBar>, 't'>;

function Harness(props: HarnessProps): React.ReactElement {
  const { t } = useTranslation();
  return <CollectionFilterBar {...props} t={t} />;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 1, name: 'Food', color: '#f00', icon: null, count: 2 },
];

function makeProps(overrides: Partial<HarnessProps> = {}): HarnessProps {
  return {
    statusFilter: 'all' as StatusFilter,
    counts: { all: 3, idea: 1, want: 1, visited: 1 },
    categoryFilter: 'all',
    categoryOptions: CATEGORY_OPTIONS,
    onStatusFilter: vi.fn(),
    onCategoryFilter: vi.fn(),
    showLabels: false,
    labelOptions: [],
    labelFilter: [],
    onLabelFilter: vi.fn(),
    canManageLabels: false,
    onManageLabels: vi.fn(),
    showSelect: true,
    selectMode: false,
    onToggleSelect: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  resetAllStores();
});

describe('CollectionFilterBar', () => {
  it('FE-COMP-COLFILTERBAR-001: renders the status dropdown showing the current "All" filter', () => {
    render(<Harness {...makeProps()} />);
    // Both dropdown triggers currently read "All" (status=all, category=all).
    // With a category present there are exactly two "All" triggers: status + category.
    expect(screen.getAllByRole('button', { name: 'All' })).toHaveLength(2);
  });

  it('FE-COMP-COLFILTERBAR-002: opening the status dropdown reveals the status options', async () => {
    const user = userEvent.setup();
    render(<Harness {...makeProps()} />);

    // First "All" trigger is the status dropdown (rendered before the category one).
    const statusTrigger = screen.getAllByRole('button', { name: 'All' })[0];
    expect(statusTrigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(statusTrigger);

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: /Idea/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /Want to go/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /Visited/i })).toBeInTheDocument();
  });

  it('FE-COMP-COLFILTERBAR-003: clicking a status option calls onStatusFilter with that status', async () => {
    const user = userEvent.setup();
    const onStatusFilter = vi.fn();
    render(<Harness {...makeProps({ onStatusFilter })} />);

    await user.click(screen.getAllByRole('button', { name: 'All' })[0]);
    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: /Want to go/i }));

    expect(onStatusFilter).toHaveBeenCalledTimes(1);
    expect(onStatusFilter).toHaveBeenCalledWith('want');
  });

  it('FE-COMP-COLFILTERBAR-004: the category dropdown is present when categoryOptions is non-empty', () => {
    render(<Harness {...makeProps()} />);
    // Two dropdown triggers = status + category.
    const triggers = screen.getAllByRole('button', { name: 'All' });
    expect(triggers).toHaveLength(2);
  });

  it('FE-COMP-COLFILTERBAR-005: the category dropdown is hidden when categoryOptions is empty', () => {
    render(<Harness {...makeProps({ categoryOptions: [] })} />);
    // Only the status dropdown remains.
    expect(screen.getAllByRole('button', { name: 'All' })).toHaveLength(1);
  });

  it('FE-COMP-COLFILTERBAR-006: clicking a category option calls onCategoryFilter with the category id', async () => {
    const user = userEvent.setup();
    const onCategoryFilter = vi.fn();
    render(<Harness {...makeProps({ onCategoryFilter })} />);

    // Second "All" trigger is the category dropdown.
    await user.click(screen.getAllByRole('button', { name: 'All' })[1]);
    const listbox = screen.getByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: /Food/i }));

    expect(onCategoryFilter).toHaveBeenCalledTimes(1);
    expect(onCategoryFilter).toHaveBeenCalledWith(1);
  });

  it('FE-COMP-COLFILTERBAR-007: clicking the Select button calls onToggleSelect', async () => {
    const user = userEvent.setup();
    const onToggleSelect = vi.fn();
    render(<Harness {...makeProps({ onToggleSelect })} />);

    const selectBtn = screen.getByRole('button', { name: 'Select' });
    expect(selectBtn).toHaveAttribute('aria-pressed', 'false');
    await user.click(selectBtn);

    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COLFILTERBAR-008: showSelect=false hides the Select button', () => {
    render(<Harness {...makeProps({ showSelect: false })} />);
    expect(screen.queryByRole('button', { name: 'Select' })).not.toBeInTheDocument();
  });
});
