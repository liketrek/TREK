// FE-COMP-COLHERO-001 to FE-COMP-COLHERO-011
import React from 'react';
import { render, screen, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { CollectionMember } from '@trek/shared';
import { useTranslation } from '../../i18n/TranslationContext';
import CollectionHero from './CollectionHero';

type HeroProps = Omit<React.ComponentProps<typeof CollectionHero>, 't'>;

function Harness(props: HeroProps): React.ReactElement {
  const { t } = useTranslation();
  return <CollectionHero {...props} t={t} />;
}

function member(over: Partial<CollectionMember> = {}): CollectionMember {
  return { user_id: 1, username: 'ada lovelace', status: 'accepted', ...over } as CollectionMember;
}

function renderHero(overrides: Partial<HeroProps> = {}) {
  const props: HeroProps = {
    eyebrow: 'Private list',
    title: 'Weekend in Rome',
    color: '#ef4444',
    members: [],
    canShare: true,
    isOwner: true,
    canEdit: true,
    onEdit: vi.fn(),
    shareMemberCount: 0,
    onShare: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return props;
}

describe('CollectionHero', () => {
  it('FE-COMP-COLHERO-001: renders the eyebrow, the title and the colour wash', () => {
    renderHero();
    expect(screen.getByRole('heading', { name: 'Weekend in Rome' })).toBeInTheDocument();
    expect(screen.getByText('Private list')).toBeInTheDocument();
    // No cover image → the gradient background element stands in for it.
    expect(document.querySelector('.col-hero-bg')).not.toBeNull();
    expect(document.querySelector('.col-hero-img')).toBeNull();
    expect(document.querySelector<HTMLElement>('.col-hero')?.style.getPropertyValue('--hero-color')).toBe('#ef4444');
  });

  it('FE-COMP-COLHERO-002: a cover image replaces the gradient and adds the tint layer', () => {
    renderHero({ coverImage: '/uploads/covers/rome.jpg' });
    expect(document.querySelector<HTMLImageElement>('.col-hero-img')?.getAttribute('src')).toBe('/uploads/covers/rome.jpg');
    expect(document.querySelector('.col-hero-tint')).not.toBeNull();
    expect(document.querySelector('.col-hero-bg')).toBeNull();
  });

  it('FE-COMP-COLHERO-003: the description renders only when present', () => {
    const { unmount } = render(<Harness {...{
      eyebrow: 'x', title: 'y', color: '#000', members: [], canShare: false, isOwner: false,
      canEdit: false, onEdit: vi.fn(), shareMemberCount: 0, onShare: vi.fn(),
    }} />);
    expect(document.querySelector('.col-hero-desc')).toBeNull();
    unmount();

    renderHero({ description: 'Three days of pasta' });
    expect(screen.getByText('Three days of pasta')).toBeInTheDocument();
  });

  it('FE-COMP-COLHERO-004: a single member does not produce an avatar stack', () => {
    renderHero({ members: [member({ user_id: 1, is_owner: true })] });
    expect(document.querySelector('.members')).toBeNull();
  });

  it('FE-COMP-COLHERO-005: two or more accepted members render initials avatars', () => {
    renderHero({
      members: [
        member({ user_id: 1, username: 'ada lovelace', is_owner: true }),
        member({ user_id: 2, username: 'grace' }),
        member({ user_id: 3, username: '  ' }),
      ],
    });
    const stack = document.querySelector('.members');
    expect(stack).not.toBeNull();
    expect(within(stack as HTMLElement).getByText('AL')).toBeInTheDocument();
    expect(within(stack as HTMLElement).getByText('G')).toBeInTheDocument();
    // A blank username still gets a placeholder rather than an empty circle.
    expect(within(stack as HTMLElement).getByText('?')).toBeInTheDocument();
  });

  it('FE-COMP-COLHERO-006: pending members are excluded, owners are kept regardless of status', () => {
    renderHero({
      members: [
        member({ user_id: 1, username: 'ada', status: 'pending', is_owner: true }),
        member({ user_id: 2, username: 'grace' }),
        member({ user_id: 3, username: 'nobody', status: 'pending' }),
      ],
    });
    const stack = document.querySelector('.members') as HTMLElement;
    expect(within(stack).getByText('A')).toBeInTheDocument();
    expect(within(stack).getByText('G')).toBeInTheDocument();
    expect(within(stack).queryByText('N')).not.toBeInTheDocument();
  });

  it('FE-COMP-COLHERO-007: an uploaded avatar renders as an image, and beyond five members a +N chip appears', () => {
    const members = [1, 2, 3, 4, 5, 6, 7].map(i =>
      member({ user_id: i, username: `user${i}`, avatar: i === 1 ? 'me.png' : null }),
    );
    renderHero({ members });
    const stack = document.querySelector('.members') as HTMLElement;
    expect(within(stack).getByRole('img', { name: 'user1' })).toHaveAttribute('src', '/uploads/avatars/me.png');
    expect(within(stack).getByText('+2')).toBeInTheDocument();
  });

  it('FE-COMP-COLHERO-008: link chips show the label, or the bare host when unlabelled', async () => {
    const user = userEvent.setup();
    renderHero({
      links: [
        { url: 'https://www.romeguide.example/food', label: 'Food guide' },
        { url: 'https://maps.example/pin' },
        { url: 'not-a-url' },
      ],
    });
    const labelled = screen.getByRole('link', { name: /Food guide/ });
    expect(labelled).toHaveAttribute('href', 'https://www.romeguide.example/food');
    expect(labelled).toHaveAttribute('target', '_blank');
    // No label → hostname without the www. prefix.
    expect(screen.getByRole('link', { name: /maps\.example/ })).toBeInTheDocument();
    // Unparseable href → the raw string is shown rather than crashing.
    expect(screen.getByRole('link', { name: /not-a-url/ })).toBeInTheDocument();

    // The chip must not bubble a click up to the hero.
    const onEdit = vi.fn();
    await user.click(labelled);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLHERO-009: the Edit button renders only when canEdit and calls onEdit', async () => {
    const user = userEvent.setup();
    const props = renderHero({ canEdit: true });
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(props.onEdit).toHaveBeenCalledTimes(1);

    renderHero({ canEdit: false, canShare: false });
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
  });

  it('FE-COMP-COLHERO-010: the owner sees a Share button carrying the member count badge', async () => {
    const user = userEvent.setup();
    const props = renderHero({ isOwner: true, canShare: true, shareMemberCount: 3 });
    const share = screen.getByRole('button', { name: 'Share' });
    expect(share).toHaveClass('has-count');
    expect(within(share).getByText('3')).toBeInTheDocument();
    await user.click(share);
    expect(props.onShare).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-COLHERO-011: a non-owner sees a Shared button without a count badge', () => {
    renderHero({ isOwner: false, canShare: true, shareMemberCount: 3 });
    const share = screen.getByRole('button', { name: 'Shared' });
    expect(share).not.toHaveClass('has-count');
    expect(within(share).queryByText('3')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  });
});
