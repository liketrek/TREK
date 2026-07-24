// FE-COMP-TRAVELERS-001 to FE-COMP-TRAVELERS-006
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { ReservationTraveler } from '@trek/shared';
import type { TripMember } from '../Budget/BudgetPanelMemberChips';
import { TravelerPicker, TravelerAvatarRow } from './TravelerPicker';

const tripMembers: TripMember[] = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];

const travelers: ReservationTraveler[] = [
  { user_id: 1, username: 'alice', avatar_url: '/uploads/avatars/alice.jpg' },
  { user_id: 2, username: 'bob', avatar_url: '/uploads/avatars/bob.jpg' },
];

describe('TravelerPicker', () => {
  it('FE-COMP-TRAVELERS-001: renders a toggle per trip member', () => {
    render(<TravelerPicker tripMembers={tripMembers} selectedIds={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('FE-COMP-TRAVELERS-002: clicking a member calls onToggle with their id', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TravelerPicker tripMembers={tripMembers} selectedIds={new Set()} onToggle={onToggle} />);
    await user.click(screen.getByText('alice'));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('FE-COMP-TRAVELERS-003: a selected member is pressed, an unselected one is not', () => {
    render(<TravelerPicker tripMembers={tripMembers} selectedIds={new Set([1])} onToggle={vi.fn()} />);
    expect(screen.getByText('alice').closest('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('bob').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-COMP-TRAVELERS-004: with no trip members it shows the empty hint, no toggles', () => {
    render(<TravelerPicker tripMembers={[]} selectedIds={new Set()} onToggle={vi.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });
});

describe('TravelerAvatarRow', () => {
  it('FE-COMP-TRAVELERS-005: renders nothing when nobody is assigned', () => {
    const { container } = render(<TravelerAvatarRow travelers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-TRAVELERS-006: renders an avatar pill with the name per assigned traveler', () => {
    render(<TravelerAvatarRow travelers={travelers} />);
    // Each assigned traveler carries an avatar_url, so one <img> renders per pill.
    expect(document.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });
});
