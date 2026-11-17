import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useAuthStore } from '../../../store/authStore';
import MDemoWelcome from './MDemoWelcome';

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { serverTimezone: 'UTC' });
});

describe('MDemoWelcome', () => {
  it('FE-COMP-DEMOWELCOME-030: on a phone it is a sheet with the same content and a full-width start', async () => {
    render(<MDemoWelcome />);
    const sheet = screen.getByRole('dialog', { name: 'Live demo' });
    expect(sheet).toHaveTextContent('Welcome to TREK');
    expect(within(sheet).getByTestId('demo-countdown')).toBeInTheDocument();
    expect(within(sheet).getByText('Everything resets every hour')).toBeInTheDocument();
    expect(within(sheet).getByText('Trip planner')).toBeInTheDocument();
    expect(within(sheet).getByText('Automatic backups')).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: /source code/i })).toHaveAttribute('target', '_blank');
    await userEvent.click(within(sheet).getByRole('button', { name: /start exploring/i }));
    await waitFor(() => expect(screen.queryByText('Trip planner')).not.toBeInTheDocument());
  });

  it('FE-COMP-DEMOWELCOME-031: the photo credits open in its place and lead back', async () => {
    render(<MDemoWelcome />);
    const sheet = screen.getByRole('dialog', { name: 'Live demo' });
    await userEvent.click(within(sheet).getByRole('button', { name: /photo credits/i }));
    const back = await within(sheet).findByRole('button', { name: /back/i });
    expect(within(sheet).queryByText('Trip planner')).not.toBeInTheDocument();
    await userEvent.click(back);
    expect(within(sheet).getByText('Trip planner')).toBeInTheDocument();
  });
});
