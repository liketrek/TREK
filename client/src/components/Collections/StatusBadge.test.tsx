// FE-COMP-STATUSBADGE-001 to FE-COMP-STATUSBADGE-013
import { render, screen } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { CollectionStatus } from '@trek/shared';
import { resetAllStores } from '../../../tests/helpers/store';
import { useTranslation } from '../../i18n/TranslationContext';
import StatusBadge from './StatusBadge';

// StatusBadge takes a `t` prop (TranslationFn) rather than reading the context
// itself, so this harness pulls the real English `t` out of the provider that
// the render helper wraps around us and forwards it. That way assertions run
// against real translated strings, not i18n keys.
type BadgeProps = {
  status: CollectionStatus;
  onChange?: (next: CollectionStatus) => void;
  showLabel?: boolean;
  onCover?: boolean;
};

function Badge(props: BadgeProps) {
  const { t } = useTranslation();
  return <StatusBadge {...props} t={t} />;
}

beforeEach(() => {
  resetAllStores();
});

describe('StatusBadge', () => {
  // ── Current-status label ─────────────────────────────────────────────────────

  it('FE-COMP-STATUSBADGE-001: renders the "Idea" label for the idea status', () => {
    render(<Badge status="idea" />);
    expect(screen.getByText('Idea')).toBeInTheDocument();
  });

  it('FE-COMP-STATUSBADGE-002: renders the "Want to go" label for the want status', () => {
    render(<Badge status="want" />);
    expect(screen.getByText('Want to go')).toBeInTheDocument();
  });

  it('FE-COMP-STATUSBADGE-003: renders the "Visited" label for the visited status', () => {
    render(<Badge status="visited" />);
    expect(screen.getByText('Visited')).toBeInTheDocument();
  });

  it('FE-COMP-STATUSBADGE-004: hides the label when showLabel is false', () => {
    render(<Badge status="idea" showLabel={false} />);
    expect(screen.queryByText('Idea')).not.toBeInTheDocument();
  });

  // ── One-tap cycle: idea → want → visited → idea ──────────────────────────────

  it('FE-COMP-STATUSBADGE-005: exposes a button role when onChange is supplied', () => {
    render(<Badge status="idea" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Idea' })).toBeInTheDocument();
  });

  it('FE-COMP-STATUSBADGE-006: clicking an idea badge calls onChange with "want"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Badge status="idea" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Idea' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('want');
  });

  it('FE-COMP-STATUSBADGE-007: clicking a want badge calls onChange with "visited"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Badge status="want" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Want to go' }));
    expect(onChange).toHaveBeenCalledWith('visited');
  });

  it('FE-COMP-STATUSBADGE-008: clicking a visited badge wraps around to "idea"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Badge status="visited" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Visited' }));
    expect(onChange).toHaveBeenCalledWith('idea');
  });

  it('FE-COMP-STATUSBADGE-009: pressing Enter cycles the status', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Badge status="idea" onChange={onChange} />);
    const badge = screen.getByRole('button', { name: 'Idea' });
    badge.focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('want');
  });

  it('FE-COMP-STATUSBADGE-010: interactive badge advertises the cycle hint in its title', () => {
    render(<Badge status="idea" onChange={vi.fn()} />);
    // English: 'collections.status.cycleHint' = 'tap to change'
    expect(screen.getByRole('button', { name: 'Idea' })).toHaveAttribute(
      'title',
      'Idea — tap to change',
    );
  });

  // ── Read-only (onChange omitted) ─────────────────────────────────────────────

  it('FE-COMP-STATUSBADGE-011: renders as a static badge with no button role when onChange is omitted', () => {
    render(<Badge status="want" />);
    expect(screen.getByText('Want to go')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('FE-COMP-STATUSBADGE-012: read-only badge uses the plain label as its title (no cycle hint)', () => {
    render(<Badge status="visited" />);
    const label = screen.getByText('Visited');
    const pill = label.parentElement as HTMLElement;
    expect(pill).toHaveAttribute('title', 'Visited');
    expect(pill.getAttribute('title')).not.toMatch(/tap to change/i);
  });

  it('FE-COMP-STATUSBADGE-013: clicking a read-only badge does not throw', async () => {
    const user = userEvent.setup();
    render(<Badge status="idea" />);
    // No interactive handler wired up — the click must be a harmless no-op.
    await user.click(screen.getByText('Idea'));
    expect(screen.getByText('Idea')).toBeInTheDocument();
  });
});
