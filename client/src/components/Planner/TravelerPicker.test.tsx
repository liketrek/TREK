// FE-COMP-TRAVELERS-001 to FE-COMP-TRAVELERS-017
import { render, screen, fireEvent } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { ReservationTraveler } from '@trek/shared';
import type { TripMember } from '../Budget/BudgetPanelMemberChips';
import { TravelerPicker, TravelerAvatarRow, TravelerFilterAvatars } from './TravelerPicker';

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

  it('FE-COMP-TRAVELERS-007: a guest member carries the guest badge, a normal member does not', () => {
    const withGuest: TripMember[] = [
      { id: 1, username: 'alice', avatar_url: null },
      { id: 3, username: 'carol', avatar_url: null, is_guest: true },
    ];
    render(<TravelerPicker tripMembers={withGuest} selectedIds={new Set()} onToggle={vi.fn()} />);
    expect(screen.getAllByText('Guest')).toHaveLength(1);
    expect(screen.getByText('carol').closest('button')).toHaveTextContent('Guest');
    expect(screen.getByText('alice').closest('button')).not.toHaveTextContent('Guest');
  });

  it('FE-COMP-TRAVELERS-008: an avatar_url renders an image instead of the gradient initial', () => {
    const withAvatar: TripMember[] = [{ id: 1, username: 'alice', avatar_url: '/uploads/avatars/a.jpg' }];
    render(<TravelerPicker tripMembers={withAvatar} selectedIds={new Set()} onToggle={vi.fn()} />);
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/uploads/avatars/a.jpg');
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('FE-COMP-TRAVELERS-009: a member without a username falls back to "?" in the avatar', () => {
    const nameless = [{ id: 4, avatar_url: null }] as unknown as TripMember[];
    render(<TravelerPicker tripMembers={nameless} selectedIds={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('FE-COMP-TRAVELERS-010: hovering an unselected chip lifts its opacity and leaving restores it', () => {
    render(<TravelerPicker tripMembers={tripMembers} selectedIds={new Set([1])} onToggle={vi.fn()} />);
    const bob = screen.getByText('bob').closest('button') as HTMLButtonElement;
    fireEvent.mouseEnter(bob);
    expect(bob.style.opacity).toBe('0.85');
    fireEvent.mouseLeave(bob);
    expect(bob.style.opacity).toBe('0.6');
  });

  it('FE-COMP-TRAVELERS-011: hovering a selected chip leaves its opacity untouched', () => {
    render(<TravelerPicker tripMembers={tripMembers} selectedIds={new Set([1])} onToggle={vi.fn()} />);
    const alice = screen.getByText('alice').closest('button') as HTMLButtonElement;
    fireEvent.mouseEnter(alice);
    expect(alice.style.opacity).toBe('1');
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

  it('FE-COMP-TRAVELERS-012: renders nothing when travelers is undefined', () => {
    const { container } = render(<TravelerAvatarRow />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-TRAVELERS-013: a guest traveler gets the guest badge, an avatar-less one its initial', () => {
    const mixed: ReservationTraveler[] = [
      { user_id: 1, username: 'alice', avatar_url: null },
      { user_id: 3, username: 'carol', avatar_url: null, is_guest: 1 },
    ];
    render(<TravelerAvatarRow travelers={mixed} />);
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getAllByText('Guest')).toHaveLength(1);
  });
});

describe('TravelerFilterAvatars', () => {
  // The avatars carry no visible label, so they are addressed by their title attribute.
  const avatarFor = (username: string) =>
    document.querySelector(`button[title="${username}"]`) as HTMLButtonElement;

  it('FE-COMP-TRAVELERS-014: one avatar button per member, titled with the username', () => {
    render(<TravelerFilterAvatars members={tripMembers} active={new Set()} onToggle={vi.fn()} label="Travelers" />);
    expect(screen.getByLabelText('Travelers')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(avatarFor('alice')).toHaveAttribute('aria-pressed', 'false');
    // Nothing is filtered, so no avatar is dimmed.
    expect(avatarFor('alice').style.opacity).toBe('1');
    expect(avatarFor('bob').style.opacity).toBe('1');
    // Without an avatar_url the initial stands in.
    expect(avatarFor('alice')).toHaveTextContent('A');
  });

  it('FE-COMP-TRAVELERS-015: clicking an avatar calls onToggle with its id', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TravelerFilterAvatars members={tripMembers} active={new Set()} onToggle={onToggle} />);
    await user.click(avatarFor('bob'));
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('FE-COMP-TRAVELERS-016: with a filter on, the active avatar is pressed and the rest dim', () => {
    render(<TravelerFilterAvatars members={tripMembers} active={new Set([1])} onToggle={vi.fn()} />);
    expect(avatarFor('alice')).toHaveAttribute('aria-pressed', 'true');
    expect(avatarFor('alice').style.opacity).toBe('1');
    expect(avatarFor('bob')).toHaveAttribute('aria-pressed', 'false');
    expect(avatarFor('bob').style.opacity).toBe('0.4');
  });

  it('FE-COMP-TRAVELERS-017: hovering dims/restores only the inactive avatars', () => {
    const withAvatar: TripMember[] = [
      { id: 1, username: 'alice', avatar_url: null },
      { id: 2, username: 'bob', avatar_url: '/uploads/avatars/bob.jpg' },
    ];
    render(<TravelerFilterAvatars members={withAvatar} active={new Set([1])} onToggle={vi.fn()} />);
    // The member with an avatar_url renders an <img> rather than an initial.
    expect(document.querySelectorAll('img')).toHaveLength(1);

    const bob = avatarFor('bob');
    fireEvent.mouseEnter(bob);
    expect(bob.style.opacity).toBe('0.7');
    fireEvent.mouseLeave(bob);
    expect(bob.style.opacity).toBe('0.4');

    const alice = avatarFor('alice');
    fireEvent.mouseEnter(alice);
    expect(alice.style.opacity).toBe('1');
    fireEvent.mouseLeave(alice);
    expect(alice.style.opacity).toBe('1');
  });
});
