// FE-PLANNER-REFRESHPILL-001 to FE-PLANNER-REFRESHPILL-003
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '../../../tests/helpers/render';
import { PlaceRefreshPill } from './PlaceRefreshPill';
import type { RefreshCandidate } from './placeRefresh';

const t = (key: string) => key;

const CANDIDATES: RefreshCandidate[] = [
  { field: 'phone', current: '', next: '+49 381 87398063', preselected: true },
  { field: 'website', current: 'https://old.example', next: 'https://www.thao-vinh.de/', preselected: false },
];

describe('PlaceRefreshPill', () => {
  it('FE-PLANNER-REFRESHPILL-001: nothing shows while the details match the place', () => {
    const { container } = render(<PlaceRefreshPill candidates={[]} origin="osm" onApply={vi.fn()} t={t} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-PLANNER-REFRESHPILL-002: the pill counts the differences; empty fields are ticked, filled ones say they replace', async () => {
    render(<PlaceRefreshPill candidates={CANDIDATES} origin="osm" onApply={vi.fn()} t={t} />);
    const pill = screen.getByRole('button', { name: /places\.refresh\.pill/ });
    expect(within(pill).getByText('2')).toBeInTheDocument();
    await userEvent.click(pill);
    expect(screen.getByRole('button', { name: 'places.formPhone' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'places.formWebsite' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('places.refresh.replaces')).toBeInTheDocument();
  });

  it('FE-PLANNER-REFRESHPILL-003: confirming takes over only the ticked fields, with the provider as origin', async () => {
    const onApply = vi.fn();
    render(<PlaceRefreshPill candidates={CANDIDATES} origin="osm" onApply={onApply} t={t} />);
    await userEvent.click(screen.getByRole('button', { name: /places\.refresh\.pill/ }));
    await userEvent.click(screen.getByRole('button', { name: 'places.refresh.apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith('phone', '+49 381 87398063', 'osm');
  });
});
