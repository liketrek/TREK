// FE-COMP-LISTSRAIL-001 to FE-COMP-LISTSRAIL-010
import React from 'react';
import { render, screen, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { Collection } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import { ALL_SAVED } from '../../store/collectionStore';
import type { IncomingCollectionInvite } from '../../store/collectionStore';
import ListsRail from './ListsRail';

// The rail takes `t` as a prop, so a harness forwards the real English translator
// from the provider the render helper mounts.
type RailProps = Omit<React.ComponentProps<typeof ListsRail>, 't'>;

function Harness(props: RailProps): React.ReactElement {
  const { t } = useTranslation();
  return <ListsRail {...props} t={t} />;
}

const rome: Collection = { id: 11, owner_id: 1, name: 'Weekend in Rome', color: '#ef4444', place_count: 3 };
const tokyo: Collection = { id: 22, owner_id: 1, name: 'Tokyo Food Tour', color: null };
const shared: Collection = { id: 33, owner_id: 9, name: 'Family trip', color: '#22c55e', place_count: 7, is_owner: false };

const invite: IncomingCollectionInvite = {
  collection_id: 44,
  name: 'Iceland ideas',
  from: { id: 5, username: 'kim' },
};

function renderRail(overrides: Partial<RailProps> = {}) {
  const props: RailProps = {
    ownedLists: [rome, tokyo],
    sharedLists: [],
    activeId: rome.id,
    incomingInvites: [],
    onSelect: vi.fn(),
    onNewList: vi.fn(),
    onAcceptInvite: vi.fn(),
    onDeclineInvite: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

describe('ListsRail', () => {
  it('FE-COMP-LISTSRAIL-001: renders the new-list action, the All saved row and every owned list', () => {
    renderRail();
    expect(screen.getByRole('button', { name: 'New list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All saved' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Weekend in Rome/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tokyo Food Tour/ })).toBeInTheDocument();
  });

  it('FE-COMP-LISTSRAIL-002: shows the place count per list and falls back to 0 when absent', () => {
    renderRail();
    expect(within(screen.getByRole('button', { name: /Weekend in Rome/ })).getByText('3')).toBeInTheDocument();
    // tokyo carries no place_count — the rail renders 0 rather than an empty slot.
    expect(within(screen.getByRole('button', { name: /Tokyo Food Tour/ })).getByText('0')).toBeInTheDocument();
  });

  it('FE-COMP-LISTSRAIL-003: marks only the active list row with the "on" class', () => {
    renderRail({ activeId: tokyo.id });
    expect(screen.getByRole('button', { name: /Tokyo Food Tour/ })).toHaveClass('on');
    expect(screen.getByRole('button', { name: /Weekend in Rome/ })).not.toHaveClass('on');
    expect(screen.getByRole('button', { name: 'All saved' })).not.toHaveClass('on');
  });

  it('FE-COMP-LISTSRAIL-004: marks the All saved row active when activeId is the sentinel', () => {
    renderRail({ activeId: ALL_SAVED });
    expect(screen.getByRole('button', { name: 'All saved' })).toHaveClass('on');
    expect(screen.getByRole('button', { name: /Weekend in Rome/ })).not.toHaveClass('on');
  });

  it('FE-COMP-LISTSRAIL-005: clicking a list row selects it by id, All saved selects the sentinel', async () => {
    const user = userEvent.setup();
    const props = renderRail();

    await user.click(screen.getByRole('button', { name: /Tokyo Food Tour/ }));
    expect(props.onSelect).toHaveBeenCalledWith(22);

    await user.click(screen.getByRole('button', { name: 'All saved' }));
    expect(props.onSelect).toHaveBeenCalledWith(ALL_SAVED);
  });

  it('FE-COMP-LISTSRAIL-006: the new-list button calls onNewList', async () => {
    const user = userEvent.setup();
    const props = renderRail();
    await user.click(screen.getByRole('button', { name: 'New list' }));
    expect(props.onNewList).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-LISTSRAIL-007: renders a Shared section with its lists only when there are shared lists', () => {
    const { unmount } = render(<Harness {...{
      ownedLists: [rome], sharedLists: [], activeId: null, incomingInvites: [],
      onSelect: vi.fn(), onNewList: vi.fn(), onAcceptInvite: vi.fn(), onDeclineInvite: vi.fn(),
    }} />);
    expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    unmount();

    renderRail({ sharedLists: [shared] });
    expect(screen.getByText('Shared')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Family trip/ })).toBeInTheDocument();
  });

  it('FE-COMP-LISTSRAIL-008: renders the invites block with the sender name and a count badge', () => {
    renderRail({ incomingInvites: [invite] });
    expect(screen.getByText('Iceland ideas')).toBeInTheDocument();
    expect(screen.getByText('from kim')).toBeInTheDocument();
    expect(screen.getByText('Invites').querySelector('.badge')?.textContent).toBe('1');
  });

  it('FE-COMP-LISTSRAIL-009: accepting and declining an invite pass the collection id', async () => {
    const user = userEvent.setup();
    const props = renderRail({ incomingInvites: [invite] });

    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(props.onAcceptInvite).toHaveBeenCalledWith(44);

    await user.click(screen.getByRole('button', { name: 'Decline' }));
    expect(props.onDeclineInvite).toHaveBeenCalledWith(44);
  });

  it('FE-COMP-LISTSRAIL-010: with no owned lists, no separator and no invite block render', () => {
    renderRail({ ownedLists: [], activeId: ALL_SAVED });
    expect(document.querySelector('.col-rail-sep')).toBeNull();
    expect(screen.queryByText('Invites')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All saved' })).toBeInTheDocument();
  });
});
