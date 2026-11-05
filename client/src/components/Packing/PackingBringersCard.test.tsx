// FE-PACK-BRINGERCARD-001 to FE-PACK-BRINGERCARD-004
import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import { BringersCard, MoreBringers } from './PackingBringersCard';
import { bringersOf } from './packingBringers';

const members = [
  { id: 1, username: 'anna', avatar_url: '/uploads/avatars/anna.jpg' },
  { id: 2, username: 'ben', avatar: '/uploads/avatars/ben.jpg' },
  { id: 3, username: 'carla' },
];

describe('bringersOf', () => {
  it('FE-PACK-BRINGERCARD-001: lists the bringer first, then the others, each with the picture the trip knows', () => {
    const item = {
      owner_id: 1,
      owner_username: 'anna',
      contributors: [
        { user_id: 2, username: 'ben' },
        { user_id: 3, username: 'carla' },
      ],
    };
    expect(bringersOf(item, members)).toEqual([
      { name: 'anna', avatar: '/uploads/avatars/anna.jpg' },
      { name: 'ben', avatar: '/uploads/avatars/ben.jpg' },
      { name: 'carla', avatar: null },
    ]);
  });

  it('FE-PACK-BRINGERCARD-002: lists a person once and copes with a bringer the trip no longer has', () => {
    const item = { owner_id: 9, owner_username: 'dora', contributors: [{ user_id: 9, username: 'dora' }] };
    expect(bringersOf(item, members)).toEqual([{ name: 'dora', avatar: null }]);
    expect(bringersOf({}, members)).toEqual([]);
  });
});

describe('BringersCard', () => {
  it('FE-PACK-BRINGERCARD-003: names everyone on a line of their own under the heading', () => {
    render(
      <BringersCard
        bringers={bringersOf(
          { owner_id: 1, owner_username: 'anna', contributors: [{ user_id: 3, username: 'carla' }] },
          members
        )}
      />
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('anna');
    expect(rows[1]).toHaveTextContent('carla');
    expect(screen.getByText('Brought by')).toBeInTheDocument();
  });

  it('FE-PACK-BRINGERCARD-004: the "+N" circle counts the others', () => {
    const { container } = render(<MoreBringers count={3} />);
    expect(container).toHaveTextContent('+3');
  });
});
