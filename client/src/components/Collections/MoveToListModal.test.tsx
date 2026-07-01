// FE-COMP-MOVETOLIST-001 to FE-COMP-MOVETOLIST-009
import { render, screen, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { Collection } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import MoveToListModal from './MoveToListModal';

// The modal receives `t` as a prop rather than reading context, so a tiny harness
// pulls the REAL English translator from the provider and forwards it. That keeps
// the assertions against real strings ("Move 2 to another list") instead of keys.
function Harness(props: Omit<React.ComponentProps<typeof MoveToListModal>, 't'>) {
  const { t } = useTranslation();
  return <MoveToListModal {...props} t={t} />;
}

const listA: Collection = { id: 11, owner_id: 1, name: 'Weekend in Rome', color: '#ef4444', place_count: 3 };
const listB: Collection = { id: 22, owner_id: 1, name: 'Tokyo Food Tour', color: '#22c55e', place_count: 7 };

function renderModal(overrides: Partial<React.ComponentProps<typeof MoveToListModal>> = {}) {
  const props = {
    mode: 'move' as const,
    lists: [listA, listB],
    count: 2,
    onPick: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

describe('MoveToListModal', () => {
  it('FE-COMP-MOVETOLIST-001: renders every candidate list name', () => {
    renderModal();
    expect(screen.getByText('Weekend in Rome')).toBeInTheDocument();
    expect(screen.getByText('Tokyo Food Tour')).toBeInTheDocument();
  });

  it('FE-COMP-MOVETOLIST-002: title reflects the count in move mode', () => {
    renderModal({ mode: 'move', count: 2 });
    // collections.moveToListTitle = 'Move {count} to another list'
    expect(screen.getByRole('heading', { name: 'Move 2 to another list' })).toBeInTheDocument();
  });

  it('FE-COMP-MOVETOLIST-003: title reflects the count in copy mode', () => {
    renderModal({ mode: 'copy', count: 5 });
    // collections.duplicateToListTitle = 'Duplicate {count} to another list'
    expect(screen.getByRole('heading', { name: 'Duplicate 5 to another list' })).toBeInTheDocument();
  });

  it('FE-COMP-MOVETOLIST-004: shows the place count subtitle per list', () => {
    renderModal();
    // collections.placeCount = '{count} places'
    expect(screen.getByText('3 places')).toBeInTheDocument();
    expect(screen.getByText('7 places')).toBeInTheDocument();
  });

  it('FE-COMP-MOVETOLIST-005: clicking a row calls onPick with that list id', async () => {
    const user = userEvent.setup();
    const { onPick } = renderModal();

    await user.click(screen.getByRole('button', { name: /Tokyo Food Tour/i }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(22);
  });

  it('FE-COMP-MOVETOLIST-006: empty lists shows the "no other lists" message and renders no rows', () => {
    renderModal({ lists: [] });
    // collections.noOtherLists = 'No other lists yet'
    expect(screen.getByText('No other lists yet')).toBeInTheDocument();
    // No selectable list rows exist (only the modal close button remains).
    expect(screen.queryByRole('button', { name: /Weekend in Rome|Tokyo Food Tour|places/i })).not.toBeInTheDocument();
  });

  it('FE-COMP-MOVETOLIST-007: move mode renders a trailing arrow icon on each row', () => {
    renderModal({ mode: 'move' });
    const row = screen.getByRole('button', { name: /Weekend in Rome/i });
    expect(row.querySelector('.lucide-arrow-right')).toBeTruthy();
    expect(row.querySelector('.lucide-copy')).toBeFalsy();
  });

  it('FE-COMP-MOVETOLIST-008: copy mode renders a trailing copy icon on each row', () => {
    renderModal({ mode: 'copy' });
    const row = screen.getByRole('button', { name: /Weekend in Rome/i });
    expect(row.querySelector('.lucide-copy')).toBeTruthy();
    expect(row.querySelector('.lucide-arrow-right')).toBeFalsy();
  });

  it('FE-COMP-MOVETOLIST-009: a second click while the first pick is pending is ignored', async () => {
    const user = userEvent.setup();
    // Never resolves, so the modal stays "busy" after the first click.
    const onPick = vi.fn().mockReturnValue(new Promise<void>(() => {}));
    renderModal({ onPick });

    const rome = screen.getByRole('button', { name: /Weekend in Rome/i });
    const tokyo = screen.getByRole('button', { name: /Tokyo Food Tour/i });
    await user.click(rome);
    // Rows disable while busy; a click on another row must not fire a second pick.
    await user.click(tokyo);

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(11);
    // Confirm the busy state actually disabled the rows.
    expect(within(tokyo).queryByText('Tokyo Food Tour')).toBeInTheDocument();
    expect(tokyo).toBeDisabled();
  });
});
