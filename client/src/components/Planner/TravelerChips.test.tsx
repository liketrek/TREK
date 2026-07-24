// FE-COMP-TRAVELERS-001 to FE-COMP-TRAVELERS-006
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { ReservationTraveler } from '@trek/shared';
import type { TripMember } from '../Budget/BudgetPanelMemberChips';
import TravelerChips from './TravelerChips';

const tripMembers: TripMember[] = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];

const travelers: ReservationTraveler[] = [
  { user_id: 1, username: 'alice', avatar_url: '/uploads/avatars/alice.jpg' },
  { user_id: 2, username: 'bob', avatar_url: '/uploads/avatars/bob.jpg' },
];

describe('TravelerChips', () => {
  it('FE-COMP-TRAVELERS-001: renders an avatar chip per traveler', () => {
    render(<TravelerChips travelers={travelers} tripMembers={tripMembers} onSetTravelers={vi.fn()} />);
    // Each assigned traveler carries an avatar_url, so one <img> renders per chip.
    expect(document.querySelectorAll('img')).toHaveLength(2);
  });

  it('FE-COMP-TRAVELERS-002: picker button opens the dropdown listing trip members', async () => {
    const user = userEvent.setup();
    render(<TravelerChips travelers={[]} tripMembers={tripMembers} onSetTravelers={vi.fn()} />);
    // Dropdown starts closed — members are not in the DOM yet.
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
    // reservations.travelers.assign = "Assign travelers"
    await user.click(screen.getByRole('button', { name: 'Assign travelers' }));
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('FE-COMP-TRAVELERS-003: toggling a member on calls onSetTravelers with the added id', async () => {
    const user = userEvent.setup();
    const onSetTravelers = vi.fn();
    render(<TravelerChips travelers={[]} tripMembers={tripMembers} onSetTravelers={onSetTravelers} />);
    await user.click(screen.getByRole('button', { name: 'Assign travelers' }));
    await user.click(screen.getByText('alice'));
    expect(onSetTravelers).toHaveBeenCalledWith([1]);
  });

  it('FE-COMP-TRAVELERS-004: toggling an assigned member off calls onSetTravelers without their id', async () => {
    const user = userEvent.setup();
    const onSetTravelers = vi.fn();
    render(<TravelerChips travelers={[travelers[0]]} tripMembers={tripMembers} onSetTravelers={onSetTravelers} />);
    await user.click(screen.getByRole('button', { name: 'Assign travelers' }));
    await user.click(screen.getByText('alice'));
    expect(onSetTravelers).toHaveBeenCalledWith([]);
  });

  it('FE-COMP-TRAVELERS-005: read-only with no travelers renders nothing', () => {
    const { container } = render(
      <TravelerChips travelers={[]} tripMembers={tripMembers} onSetTravelers={vi.fn()} readOnly />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-TRAVELERS-006: read-only with travelers renders chips but hides the picker button', () => {
    render(<TravelerChips travelers={travelers} tripMembers={tripMembers} onSetTravelers={vi.fn()} readOnly />);
    expect(document.querySelectorAll('img')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Assign travelers' })).not.toBeInTheDocument();
  });
});
