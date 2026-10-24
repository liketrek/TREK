import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../../../tests/helpers/render';
import { useTranslation } from '../../../i18n';
import MAdminResetMfaSheet from './MAdminResetMfaSheet';

const ALICE = { id: 2, username: 'alice' };

function Harness({ onClose, onReset }: { onClose: () => void; onReset: (user: { id: number }) => Promise<boolean> }) {
  const { t } = useTranslation();
  return <MAdminResetMfaSheet open onClose={onClose} user={ALICE} onReset={onReset} t={t} />;
}

const confirmButton = () => screen.getAllByRole('button', { name: 'Reset 2FA' }).slice(-1)[0];

describe('MAdminResetMfaSheet', () => {
  it('names the user and closes once the reset worked', async () => {
    const onClose = vi.fn();
    const onReset = vi.fn(async () => true);
    render(<Harness onClose={onClose} onReset={onReset} />);

    expect(screen.getByText('Turn off two-factor authentication for alice?')).toBeInTheDocument();
    await userEvent.setup().click(confirmButton());

    expect(onReset).toHaveBeenCalledWith(ALICE);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('stays open when the reset failed', async () => {
    const onClose = vi.fn();
    const onReset = vi.fn(async () => false);
    render(<Harness onClose={onClose} onReset={onReset} />);

    await userEvent.setup().click(confirmButton());

    await waitFor(() => expect(onReset).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on cancel without resetting', async () => {
    const onClose = vi.fn();
    const onReset = vi.fn(async () => true);
    render(<Harness onClose={onClose} onReset={onReset} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });
});
