import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import GuestIdentityTransferModal from './GuestIdentityTransferModal';

const available = {
  guest_user_id: 7,
  name: 'Anna',
  impact: { expenses: 2, payments: 1, itinerary: 3, todos: 4, packing: 5 },
  conflicts: [],
};

const blocked = {
  guest_user_id: 8,
  name: 'Bob',
  impact: { expenses: 1, payments: 0, itinerary: 0, todos: 0, packing: 0 },
  conflicts: [{ type: 'expense_share_overlap' as const, record_id: 99 }],
};

describe('GuestIdentityTransferModal', () => {
  it('does not preselect a guest and disables candidates with financial conflicts', () => {
    render(<GuestIdentityTransferModal isOpen tripId={1} candidates={[available, blocked]} onDismiss={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeDisabled();
    expect(screen.getByText(/Both identities share expense #99/)).toBeInTheDocument();
  });

  it('shows all five impact counts and requires irreversible confirmation', async () => {
    const user = userEvent.setup();
    render(<GuestIdentityTransferModal isOpen tripId={1} candidates={[available]} onDismiss={vi.fn()} />);
    await user.click(screen.getByRole('radio'));
    expect(screen.getByText('2 expenses')).toBeInTheDocument();
    expect(screen.getByText('1 settlement payments')).toBeInTheDocument();
    expect(screen.getByText('3 itinerary activities')).toBeInTheDocument();
    expect(screen.getByText('4 tasks or category assignments')).toBeInTheDocument();
    expect(screen.getByText('5 packing items, categories or bags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transfer identity' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Transfer identity' })).toBeEnabled();
  });

  it('keeps the modal open and refreshes candidates after a 409 conflict', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/trips/1/guests/7/identity-transfer', () =>
        HttpResponse.json({ code: 'GUEST_IDENTITY_TRANSFER_CONFLICT', conflicts: [] }, { status: 409 })
      ),
      http.get('/api/trips/1/guest-identity-transfers/candidates', () => HttpResponse.json({ candidates: [blocked] }))
    );
    const changed = vi.fn();
    render(
      <GuestIdentityTransferModal
        isOpen
        tripId={1}
        candidates={[available]}
        onDismiss={vi.fn()}
        onCandidatesChanged={changed}
      />
    );
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Transfer identity' }));
    await waitFor(() => expect(changed).toHaveBeenCalledWith([blocked]));
    expect(screen.getByText(/records changed or now conflict/i)).toBeInTheDocument();
  });

  it('completes the check only when None of these are me is selected', async () => {
    const user = userEvent.setup();
    let declineCalls = 0;
    server.use(
      http.post('/api/trips/1/new-member-identity-check/decline', () => {
        declineCalls += 1;
        return HttpResponse.json({ success: true });
      })
    );
    const onDismiss = vi.fn();
    render(<GuestIdentityTransferModal isOpen tripId={1} candidates={[available]} onDismiss={onDismiss} />);

    await user.keyboard('{Escape}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(declineCalls).toBe(0);

    await user.click(screen.getByRole('button', { name: 'None of these are me' }));
    await waitFor(() => expect(declineCalls).toBe(1));
  });
});
