import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '../../../tests/helpers/msw/server';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import GuestClaimModal from './GuestClaimModal';

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

describe('GuestClaimModal', () => {
  it('does not preselect a guest and disables candidates with financial conflicts', () => {
    render(<GuestClaimModal isOpen tripId={1} candidates={[available, blocked]} onClose={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeDisabled();
    expect(screen.getByText(/Both identities share expense #99/)).toBeInTheDocument();
  });

  it('shows all five impact counts and requires irreversible confirmation', async () => {
    const user = userEvent.setup();
    render(<GuestClaimModal isOpen tripId={1} candidates={[available]} onClose={vi.fn()} />);
    await user.click(screen.getByRole('radio'));
    expect(screen.getByText('2 expenses')).toBeInTheDocument();
    expect(screen.getByText('1 settlement payments')).toBeInTheDocument();
    expect(screen.getByText('3 itinerary activities')).toBeInTheDocument();
    expect(screen.getByText('4 tasks or category assignments')).toBeInTheDocument();
    expect(screen.getByText('5 packing items, categories or bags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim guest' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Claim guest' })).toBeEnabled();
  });

  it('keeps the modal open and refreshes candidates after a 409 conflict', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/trips/1/guests/7/claim', () =>
        HttpResponse.json({ code: 'GUEST_CLAIM_CONFLICT', conflicts: [] }, { status: 409 })
      ),
      http.get('/api/trips/1/guest-claims/candidates', () => HttpResponse.json({ candidates: [blocked] }))
    );
    const changed = vi.fn();
    render(
      <GuestClaimModal isOpen tripId={1} candidates={[available]} onClose={vi.fn()} onCandidatesChanged={changed} />
    );
    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Claim guest' }));
    await waitFor(() => expect(changed).toHaveBeenCalledWith([blocked]));
    expect(screen.getByText(/records changed or now conflict/i)).toBeInTheDocument();
  });
});
