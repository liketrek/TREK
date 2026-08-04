// FE-MOB-SETSCP-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import { resetAllStores } from '../../../helpers/store';
import { ALL_SCOPES } from '../../../../src/api/oauthScopes';
import MScopeGroupPicker from '../../../../src/mobile/screens/settings/MScopeGroupPicker';

const TRIP_SCOPES = ['trips:read', 'trips:write', 'trips:delete', 'trips:share'];

describe('MScopeGroupPicker', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('FE-MOB-SETSCP-001: renders one collapsed card per scope group', () => {
    render(<MScopeGroupPicker selected={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /^Trips/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Journey/ })).toBeInTheDocument();
    // Collapsed: no individual scope rows yet.
    expect(screen.queryByText('View trips & itineraries')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETSCP-002: Select all emits every known scope', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MScopeGroupPicker selected={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual(ALL_SCOPES);
  });

  it('FE-MOB-SETSCP-003: with everything selected the button flips to Deselect all and emits []', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MScopeGroupPicker selected={ALL_SCOPES} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('FE-MOB-SETSCP-004: expanding a group reveals its scope labels and descriptions', async () => {
    const user = userEvent.setup();
    render(<MScopeGroupPicker selected={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^Trips/ }));

    expect(screen.getByText('View trips & itineraries')).toBeInTheDocument();
    expect(screen.getByText('Read trips, days, day notes, and members')).toBeInTheDocument();
  });

  it('FE-MOB-SETSCP-005: expanding twice collapses the group again', async () => {
    const user = userEvent.setup();
    render(<MScopeGroupPicker selected={[]} onChange={vi.fn()} />);

    const header = screen.getByRole('button', { name: /^Trips/ });
    await user.click(header);
    expect(screen.getByText('View trips & itineraries')).toBeInTheDocument();

    await user.click(header);
    expect(screen.queryByText('View trips & itineraries')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETSCP-006: the group selector adds every scope of that group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MScopeGroupPicker selected={['geo:read']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Select all Trips' }));
    expect(onChange).toHaveBeenCalledWith(['geo:read', ...TRIP_SCOPES]);
  });

  it('FE-MOB-SETSCP-007: a fully selected group offers deselect and keeps the other groups', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MScopeGroupPicker selected={[...TRIP_SCOPES, 'geo:read']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Deselect all Trips' }));
    expect(onChange).toHaveBeenCalledWith(['geo:read']);
  });

  it('FE-MOB-SETSCP-008: a partially selected group shows the n/total counter', () => {
    render(<MScopeGroupPicker selected={['trips:read', 'trips:write']} onChange={vi.fn()} />);

    expect(screen.getByText('(2/4)')).toBeInTheDocument();
  });

  it('FE-MOB-SETSCP-009: tapping an unselected scope row adds it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MScopeGroupPicker selected={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /^Trips/ }));
    await user.click(screen.getByText('View trips & itineraries').closest('button')!);
    expect(onChange).toHaveBeenCalledWith(['trips:read']);
  });

  it('FE-MOB-SETSCP-010: tapping a selected scope row removes it again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MScopeGroupPicker selected={['trips:read', 'trips:write']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /^Trips/ }));
    await user.click(screen.getByText('View trips & itineraries').closest('button')!);
    expect(onChange).toHaveBeenCalledWith(['trips:write']);
  });
});
