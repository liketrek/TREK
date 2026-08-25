// FE-PLANNER-TRANSMODAL-001 to FE-PLANNER-TRANSMODAL-061
import { render, screen, waitFor, fireEvent, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { useAddonStore } from '../../store/addonStore';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import {
  buildUser,
  buildTrip,
  buildDay,
  buildPlace,
  buildAssignment,
  buildReservation,
  buildTripFile,
} from '../../../tests/helpers/factories';
import { TransportModal } from './TransportModal';
import type { Day, Reservation } from '../../types';
import type { BookingReviewDraft } from './parsedItemToDraft';
import type { TripMember } from '../Budget/BudgetPanelMemberChips';

vi.mock('react-router', async (importActual) => {
  const actual = await importActual<typeof import('react-router')>();
  return { ...actual, useParams: () => ({ id: '1' }) };
});

vi.mock('../shared/CustomTimePicker', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="time-picker" type="text" value={value} onChange={e => onChange(e.target.value)} />
  ),
}));

vi.mock('./AirportSelect', () => ({
  default: ({ onChange }: { onChange: (a: any) => void }) => (
    <input data-testid="airport-select" type="text" onChange={e => onChange({ iata: e.target.value, name: e.target.value, city: '', country: '', lat: 0, lng: 0, tz: 'UTC', icao: null })} />
  ),
}));

vi.mock('./LocationSelect', () => ({
  default: ({ onChange }: { onChange: (l: any) => void }) => (
    <input data-testid="location-select" type="text" onChange={e => onChange({ name: e.target.value, lat: 0, lng: 0, address: null })} />
  ),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
  reservation: null,
  days: [],
  selectedDayId: null,
  files: [],
  onFileUpload: vi.fn().mockResolvedValue(undefined),
  onFileDelete: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }), budgetItems: [] });
  vi.clearAllMocks();
});

describe('TransportModal', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-001: renders without crashing', () => {
    render(<TransportModal {...defaultProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-002: shows "Add transport" title for new transport', () => {
    render(<TransportModal {...defaultProps} reservation={null} />);
    expect(screen.getByText(/Add transport/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-002b: file input accepts pkpass (#1448)', () => {
    render(<TransportModal {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.accept).toContain('.pkpass');
  });

  it('FE-PLANNER-TRANSMODAL-003: shows "Edit transport" title when editing', () => {
    const res = buildReservation({ title: 'Paris Flight', type: 'flight' });
    render(<TransportModal {...defaultProps} reservation={res} />);
    expect(screen.getByText(/Edit transport/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-004: title input is required — onSave not called with empty title', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-TRANSMODAL-005: all 4 transport type buttons are visible', () => {
    render(<TransportModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^Flight$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Train$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Car$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Cruise$/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-006: editing pre-fills title', () => {
    const res = buildReservation({ title: 'LH123 Frankfurt', type: 'flight' });
    render(<TransportModal {...defaultProps} reservation={res} />);
    expect(screen.getByDisplayValue('LH123 Frankfurt')).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-007: edit mode save button shows "Update"', () => {
    const res = buildReservation({ title: 'My Train', type: 'train' });
    render(<TransportModal {...defaultProps} reservation={res} />);
    expect(screen.getByRole('button', { name: /^Update$/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-008: Cancel button calls onClose', async () => {
    const onClose = vi.fn();
    render(<TransportModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-PLANNER-TRANSMODAL-009: submitting valid flight calls onSave with correct type', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} onSave={onSave} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH456');
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'LH456', type: 'flight' }));
  });

  it('FE-PLANNER-TRANSMODAL-010: switching to train type calls onSave with train type', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Train$/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'Eurostar');
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ type: 'train' }));
  });

  // ── Budget addon ─────────────────────────────────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-011: costs section (create expense) visible when budget addon is enabled', () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'budget', name: 'Budget', type: 'budget', icon: '', enabled: true }],
      loaded: true,
    });
    render(<TransportModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Create expense/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-012: costs section not shown when budget addon is disabled', () => {
    render(<TransportModal {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /Create expense/i })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-013: create-expense saves the booking (no create_budget_entry) then opens the Costs editor', async () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'budget', name: 'Budget', type: 'budget', icon: '', enabled: true }],
      loaded: true,
    });
    const onSave = vi.fn().mockResolvedValue({ id: 42 });
    const onOpenExpense = vi.fn();
    render(<TransportModal {...defaultProps} onSave={onSave} onOpenExpense={onOpenExpense} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'ICE Train');
    await userEvent.click(screen.getByRole('button', { name: /Create expense/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    // The legacy auto-budget mechanism is gone; the expense is created via the editor instead.
    expect(onSave).not.toHaveBeenCalledWith(expect.objectContaining({ create_budget_entry: expect.anything() }));
    await waitFor(() =>
      expect(onOpenExpense).toHaveBeenCalledWith(
        expect.objectContaining({ prefill: expect.objectContaining({ reservationId: 42 }) })
      )
    );
  });

  // ── File attachment ───────────────────────────────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-014: attach file button rendered when onFileUpload provided', () => {
    render(<TransportModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Attach file/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-015: attach file button absent when onFileUpload is undefined', () => {
    render(<TransportModal {...defaultProps} onFileUpload={undefined} />);
    expect(screen.queryByRole('button', { name: /Attach file/i })).not.toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-016: attached files shown for existing transport', () => {
    const res = buildReservation({ id: 5, type: 'flight' });
    const file = buildTripFile({ id: 1, trip_id: 1, original_name: 'boarding-pass.pdf' });
    (file as any).reservation_id = 5;

    render(<TransportModal {...defaultProps} reservation={res} files={[file]} />);
    expect(screen.getByText('boarding-pass.pdf')).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-017: pending file added for new transport on file input change', async () => {
    render(<TransportModal {...defaultProps} reservation={null} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['content'], 'itinerary.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => expect(screen.getByText('itinerary.pdf')).toBeInTheDocument());
  });

  it('FE-PLANNER-TRANSMODAL-018: file upload to existing transport calls onFileUpload with correct FormData', async () => {
    const onFileUpload = vi.fn().mockResolvedValue(undefined);
    const res = buildReservation({ id: 10, type: 'train', title: 'Eurostar' });

    render(<TransportModal {...defaultProps} reservation={res} onFileUpload={onFileUpload} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['content'], 'ticket.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => expect(onFileUpload).toHaveBeenCalled());
    const [fd] = onFileUpload.mock.calls[0] as [FormData];
    expect(fd.get('file')).toBeTruthy();
    expect(fd.get('reservation_id')).toBe('10');
  });

  it('FE-PLANNER-TRANSMODAL-019: link existing file button appears when unattached files exist', () => {
    const res = buildReservation({ id: 5, type: 'flight' });
    const unattachedFile = buildTripFile({ id: 99, original_name: 'invoice.pdf' });

    render(<TransportModal {...defaultProps} reservation={res} files={[unattachedFile]} />);
    expect(screen.getByRole('button', { name: /Link existing file/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-020: clicking "link existing file" shows file picker dropdown', async () => {
    const res = buildReservation({ id: 5, type: 'flight' });
    const unattachedFile = buildTripFile({ id: 99, original_name: 'invoice.pdf' });

    render(<TransportModal {...defaultProps} reservation={res} files={[unattachedFile]} />);
    await userEvent.click(screen.getByRole('button', { name: /Link existing file/i }));
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-021: clicking file in picker links it and closes picker', async () => {
    server.use(
      http.post('/api/trips/1/files/99/link', () => HttpResponse.json({ success: true })),
      http.get('/api/trips/1/files', () => HttpResponse.json({ files: [] })),
    );

    const res = buildReservation({ id: 5, type: 'flight' });
    const unattachedFile = buildTripFile({ id: 99, original_name: 'invoice.pdf' });

    render(<TransportModal {...defaultProps} reservation={res} files={[unattachedFile]} />);
    await userEvent.click(screen.getByRole('button', { name: /Link existing file/i }));
    await userEvent.click(screen.getByText('invoice.pdf'));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Link existing file/i })).not.toBeInTheDocument();
    });
  });

  it('FE-PLANNER-TRANSMODAL-022: removing pending file removes it from list', async () => {
    render(<TransportModal {...defaultProps} reservation={null} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['content'], 'draft.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => expect(screen.getByText('draft.pdf')).toBeInTheDocument());

    const pendingFileRow = screen.getByText('draft.pdf').closest('div')!;
    const removeBtn = pendingFileRow.querySelector('button')!;
    await userEvent.click(removeBtn);

    await waitFor(() => expect(screen.queryByText('draft.pdf')).not.toBeInTheDocument());
  });

  it('FE-PLANNER-TRANSMODAL-023: clicking attach file button triggers file input click', async () => {
    render(<TransportModal {...defaultProps} />);
    const attachBtn = screen.getByRole('button', { name: /Attach file/i });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
    await userEvent.click(attachBtn);
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('FE-PLANNER-TRANSMODAL-024: unlinking a linked file removes it from attached list', async () => {
    server.use(
      http.post('/api/trips/1/files/42/link', () => HttpResponse.json({ success: true })),
      http.get('/api/trips/1/files/42/links', () => HttpResponse.json({ links: [{ id: 1, reservation_id: 7 }] })),
      http.delete('/api/trips/1/files/42/link/1', () => HttpResponse.json({ success: true })),
      http.get('/api/trips/1/files', () => HttpResponse.json({ files: [] })),
    );

    const res = buildReservation({ id: 7, type: 'car' });
    const looseFile = buildTripFile({ id: 42, original_name: 'rental-agreement.pdf' });

    render(<TransportModal {...defaultProps} reservation={res} files={[looseFile]} />);

    await userEvent.click(screen.getByRole('button', { name: /Link existing file/i }));
    await waitFor(() => expect(screen.getByText('rental-agreement.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByText('rental-agreement.pdf'));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Link existing file/i })).not.toBeInTheDocument()
    );

    const fileRow = screen.getByText('rental-agreement.pdf').closest('div')!;
    // The row carries two buttons: [0] opens the file, [1] unlinks it.
    const unlinkBtn = fileRow.querySelectorAll('button[type="button"]')[1];
    await userEvent.click(unlinkBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Link existing file/i })).toBeInTheDocument();
    });
  });

  it('FE-PLANNER-TRANSMODAL-025: pending files flushed after saving new transport', async () => {
    const savedReservation = buildReservation({ id: 99, type: 'flight' });
    const onSave = vi.fn().mockResolvedValue(savedReservation);
    const onFileUpload = vi.fn().mockResolvedValue(undefined);

    render(<TransportModal {...defaultProps} onSave={onSave} onFileUpload={onFileUpload} reservation={null} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['content'], 'boarding.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    await waitFor(() => expect(screen.getByText('boarding.pdf')).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH001');
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => expect(onFileUpload).toHaveBeenCalled());
    const [fd] = onFileUpload.mock.calls[0] as [FormData];
    expect(fd.get('reservation_id')).toBe('99');
    expect(fd.get('file')).toBeTruthy();
  });

  // ── Transit itinerary preservation (#1065) ─────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-020: re-saving a transit reservation keeps metadata.transit + stop endpoints', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const res = buildReservation({ title: 'Fernsehturm → Zoo', type: 'bus' }) as any;
    res.metadata = { transit: { provider: 'transitous', transfers: 1, legs: [{ mode: 'BUS', line: '100' }] } };
    res.endpoints = [
      { role: 'from', sequence: 0, name: 'Fernsehturm', code: null, lat: 52.5208, lng: 13.4094, timezone: 'Europe/Berlin', local_date: '2025-06-01', local_time: '08:30' },
      { role: 'stop', sequence: 1, name: 'Alexanderplatz', code: null, lat: 52.521, lng: 13.41, timezone: 'Europe/Berlin', local_date: '2025-06-01', local_time: '08:40' },
      { role: 'to', sequence: 2, name: 'Zoologischer Garten', code: null, lat: 52.507, lng: 13.332, timezone: 'Europe/Berlin', local_date: '2025-06-01', local_time: '09:00' },
    ];
    render(<TransportModal {...defaultProps} reservation={res} onSave={onSave} />);
    // Save without touching the route — the itinerary must survive.
    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.metadata?.transit?.provider).toBe('transitous');
    expect(payload.metadata?.transit?.legs).toHaveLength(1);
    expect(payload.endpoints.map((e: { role: string }) => e.role)).toEqual(['from', 'stop', 'to']);
    expect(payload.endpoints[1]).toMatchObject({ name: 'Alexanderplatz', lat: 52.521 });
  });

  it('FE-PLANNER-TRANSMODAL-021: changing the destination drops the stale transit itinerary', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const res = buildReservation({ title: 'Fernsehturm → Zoo', type: 'bus' }) as any;
    res.metadata = { transit: { provider: 'transitous', legs: [{ mode: 'BUS' }] } };
    res.endpoints = [
      { role: 'from', sequence: 0, name: 'Fernsehturm', code: null, lat: 52.5208, lng: 13.4094, timezone: 'Europe/Berlin', local_date: null, local_time: null },
      { role: 'stop', sequence: 1, name: 'Alexanderplatz', code: null, lat: 52.521, lng: 13.41, timezone: 'Europe/Berlin', local_date: null, local_time: null },
      { role: 'to', sequence: 2, name: 'Zoologischer Garten', code: null, lat: 52.507, lng: 13.332, timezone: 'Europe/Berlin', local_date: null, local_time: null },
    ];
    render(<TransportModal {...defaultProps} reservation={res} onSave={onSave} />);
    // Pick a different destination (mocked LocationSelect emits lat/lng 0,0).
    const locationInputs = screen.getAllByTestId('location-select');
    fireEvent.change(locationInputs[1], { target: { value: 'Somewhere Else' } });
    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.metadata?.transit).toBeUndefined();
    expect(payload.endpoints.map((e: { role: string }) => e.role)).toEqual(['from', 'to']);
  });

  it('FE-PLANNER-TRANSMODAL-029: re-saving a joined AirTrail flight keeps metadata.airtrail_ids (#1535)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const res = buildReservation({ title: 'BRU → HEL → JFK', type: 'flight' }) as any;
    res.metadata = {
      airline: 'Finnair',
      flight_number: 'AY1502',
      airtrail_ids: ['101', '102'],
      legs: [
        { from: 'BRU', to: 'HEL', flight_number: 'AY1502', dep_time: '08:00', arr_time: '12:30' },
        { from: 'HEL', to: 'JFK', flight_number: 'AY15', dep_time: '14:00', arr_time: '15:00' },
      ],
    };
    res.endpoints = [
      { role: 'from', sequence: 0, name: 'Brussels', code: 'BRU', lat: 50.9, lng: 4.48, timezone: 'Europe/Brussels', local_date: '2025-06-01', local_time: '08:00' },
      { role: 'stop', sequence: 1, name: 'Helsinki-Vantaa', code: 'HEL', lat: 60.32, lng: 24.96, timezone: 'Europe/Helsinki', local_date: '2025-06-01', local_time: '14:00' },
      { role: 'to', sequence: 2, name: 'JFK', code: 'JFK', lat: 40.64, lng: -73.78, timezone: 'America/New_York', local_date: '2025-06-01', local_time: '15:00' },
    ];
    render(<TransportModal {...defaultProps} reservation={res} onSave={onSave} />);
    // A routine edit (retitle + save) must not cost the booking its AirTrail
    // linkage — the import picker relies on it to not re-offer the legs.
    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].metadata?.airtrail_ids).toEqual(['101', '102']);
  });

  // ── Manual / Automated creation switch (#1065) ─────────────────────────────

  it('FE-PLANNER-TRANSMODAL-022: creating shows the Manual/Automated switch; Automated opens the transit search', async () => {
    render(<TransportModal {...defaultProps} places={[]} accommodations={[]} />);
    expect(screen.getByRole('button', { name: 'Manual' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Automated' }));
    // No day selected in defaultProps (days: []) — the pick-day hint shows.
    expect(screen.getByText(/Pick a day/)).toBeInTheDocument();
    // The manual form is gone in automated mode.
    expect(screen.queryByPlaceholderText(/e\.g\. Lufthansa/i)).not.toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-022b: a trip without start/end dates only offers the manual form', () => {
    render(<TransportModal {...defaultProps} tripHasDates={false} places={[]} accommodations={[]} />);
    expect(screen.queryByRole('button', { name: 'Automated' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manual' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Lufthansa/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-023: initialAutomated opens straight in the transit search with the day preset', () => {
    const days = [{ id: 10, trip_id: 1, day_number: 1, date: '2025-06-01', title: 'Day 1' }] as any;
    render(<TransportModal {...defaultProps} days={days} selectedDayId={10} initialAutomated places={[]} accommodations={[]} />);
    expect(screen.getAllByPlaceholderText('Search stop or station…')).toHaveLength(2);
  });

  it('FE-PLANNER-TRANSMODAL-028: automated quick picks only offer the chosen day\'s places (#1460)', async () => {
    const days = [
      buildDay({ id: 10, date: '2025-06-01' }),
      buildDay({ id: 11, date: '2025-06-02' }),
    ];
    const louvre = buildPlace({ id: 1, name: 'Louvre' });
    const eiffel = buildPlace({ id: 2, name: 'Eiffel Tower' });
    const assignments = {
      '10': [buildAssignment({ day_id: 10, place_id: louvre.id, place: louvre })],
      '11': [buildAssignment({ day_id: 11, place_id: eiffel.id, place: eiffel })],
    };
    render(<TransportModal {...defaultProps} days={days} selectedDayId={10} initialAutomated places={[louvre, eiffel]} assignments={assignments} accommodations={[]} />);
    // Focusing the "from" field opens the quick picks — day 1's place only.
    const [fromInput] = screen.getAllByPlaceholderText('Search stop or station…');
    await userEvent.click(fromInput);
    expect(screen.getByText('Louvre')).toBeInTheDocument();
    expect(screen.queryByText('Eiffel Tower')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-024: editing shows no Manual/Automated switch', () => {
    const res = buildReservation({ title: 'My Train', type: 'train' });
    render(<TransportModal {...defaultProps} reservation={res} />);
    expect(screen.queryByRole('button', { name: 'Automated' })).not.toBeInTheDocument();
  });

  // ── Multi-leg trains (#1150) ───────────────────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-025: a train with an added stop saves from/stop/to endpoints + metadata.legs', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Train$/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'Berlin → München');
    // Insert an intermediate station (2 → 3 stations = 2 legs).
    await userEvent.click(screen.getByRole('button', { name: /Add stop/i }));
    const stations = screen.getAllByTestId('location-select');
    expect(stations).toHaveLength(3);
    fireEvent.change(stations[0], { target: { value: 'Berlin Hbf' } });
    fireEvent.change(stations[1], { target: { value: 'Frankfurt Hbf' } });
    fireEvent.change(stations[2], { target: { value: 'München Hbf' } });
    // Per-leg train number on the first station (placeholder ICE 123).
    const trainNumbers = screen.getAllByPlaceholderText('ICE 123');
    fireEvent.change(trainNumbers[0], { target: { value: 'ICE 100' } });
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.type).toBe('train');
    expect(payload.endpoints.map((e: { role: string }) => e.role)).toEqual(['from', 'stop', 'to']);
    expect(payload.endpoints.map((e: { name: string }) => e.name)).toEqual(['Berlin Hbf', 'Frankfurt Hbf', 'München Hbf']);
    expect(payload.metadata.legs).toHaveLength(2);
    expect(payload.metadata.legs[0]).toMatchObject({ from: 'Berlin Hbf', to: 'Frankfurt Hbf', train_number: 'ICE 100' });
    expect(payload.metadata.train_number).toBe('ICE 100'); // flat mirror of leg 0
  });

  it('FE-PLANNER-TRANSMODAL-027: a train with a day + train number but no geocoded station still saves them (#1150 regression)', async () => {
    const days = [{ id: 10, trip_id: 1, day_number: 1, date: '2026-08-01', title: 'Day 1' }] as any;
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={days} selectedDayId={10} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Train$/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'ICE 599');
    // Fill the train number + a departure time, but never pick a geocoded station.
    fireEvent.change(screen.getAllByPlaceholderText('ICE 123')[0], { target: { value: 'ICE 599' } });
    fireEvent.change(screen.getAllByTestId('time-picker')[0], { target: { value: '08:00' } });
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    // The day, time and train number survive even without any map-picked station.
    expect(payload.day_id).toBe(10);
    expect(payload.reservation_time).toBe('2026-08-01T08:00');
    expect(payload.metadata.train_number).toBe('ICE 599');
    expect(payload.endpoints).toEqual([]); // no geocoded station → no map endpoints, like before
  });

  it('FE-PLANNER-TRANSMODAL-026: a two-station train saves flat (no metadata.legs)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Train$/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'Köln → Aachen');
    const stations = screen.getAllByTestId('location-select');
    fireEvent.change(stations[0], { target: { value: 'Köln Hbf' } });
    fireEvent.change(stations[1], { target: { value: 'Aachen Hbf' } });
    fireEvent.change(screen.getAllByPlaceholderText('ICE 123')[0], { target: { value: 'RE 9' } });
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.endpoints.map((e: { role: string }) => e.role)).toEqual(['from', 'to']);
    expect(payload.metadata.legs).toBeUndefined();
    expect(payload.metadata.train_number).toBe('RE 9');
  });

  // ── Per-endpoint day resolution (#1684) ────────────────────────────────────

  const spanDays = [
    { id: 10, trip_id: 1, day_number: 1, date: '2026-08-01', title: 'Day 1' },
    { id: 11, trip_id: 1, day_number: 2, date: '2026-08-02', title: 'Day 2' },
    { id: 12, trip_id: 1, day_number: 3, date: '2026-08-03', title: 'Day 3' },
  ] as any;

  const flightEndpoints = (fromDate: string, toDate: string) => ([
    { id: 1, reservation_id: 1, role: 'from', sequence: 0, name: 'Frankfurt (FRA)', code: 'FRA', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin', local_date: fromDate, local_time: '10:00' },
    { id: 2, reservation_id: 1, role: 'to', sequence: 1, name: 'New York (JFK)', code: 'JFK', lat: 40.64, lng: -73.78, timezone: 'America/New_York', local_date: toDate, local_time: '13:00' },
  ]);

  it('FE-PLANNER-TRANSMODAL-030: an import prefill resolves each waypoint day from its endpoint local_date (#1684)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    // A parsed import carries local_date per endpoint but no day_id at all.
    const prefill = { title: 'LH 400', type: 'flight', status: 'pending', endpoints: flightEndpoints('2026-08-02', '2026-08-03') } as any;
    render(<TransportModal {...defaultProps} days={spanDays} prefill={prefill} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.day_id).toBe(11);
    expect(payload.end_day_id).toBe(12);
  });

  it('FE-PLANNER-TRANSMODAL-031: editing keeps the saved days when the endpoint local_date is stale', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    // Dragging a booking to another day rewrites day_id/end_day_id but leaves the
    // endpoints untouched, so local_date lags behind. Re-saving must not move the
    // booking back to the day that stale date points at.
    const reservation = buildReservation({
      id: 1, title: 'LH 400', type: 'flight', day_id: 10, end_day_id: 11,
      reservation_time: '2026-08-01T10:00', reservation_end_time: '2026-08-02T13:00',
      endpoints: flightEndpoints('2026-08-03', '2026-08-03'),
    } as any) as any;
    render(<TransportModal {...defaultProps} days={spanDays} reservation={reservation} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.day_id).toBe(10);
    expect(payload.end_day_id).toBe(11);
  });

  // ── Multi-leg flights (#872) ───────────────────────────────────────────────

  const routeDays = [
    { id: 10, trip_id: 1, day_number: 1, date: '2026-08-01', title: 'Depart Day' },
    { id: 11, trip_id: 1, day_number: 2, date: '2026-08-02', title: 'Stop Day' },
    { id: 12, trip_id: 1, day_number: 3, date: '2026-08-03', title: 'Arrive Day' },
  ] as unknown as Day[];

  /** The route cards have no test ids — each day picker is found via its own label. */
  async function pickDay(labelText: string, index: number, dayTitle: string) {
    const label = screen.getAllByText(labelText)[index];
    const trigger = (label.parentElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${dayTitle}`) }));
  }

  it('FE-PLANNER-TRANSMODAL-032: a flight with an added stop saves per-leg metadata and from/stop/to endpoints', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'BRU → HEL → JFK');
    await userEvent.click(screen.getByRole('button', { name: /Add stop/i }));

    const airports = screen.getAllByTestId('airport-select');
    expect(airports).toHaveLength(3);
    fireEvent.change(airports[0], { target: { value: 'BRU' } });
    fireEvent.change(airports[1], { target: { value: 'HEL' } });
    fireEvent.change(airports[2], { target: { value: 'JFK' } });

    // Times run: wp0 departure, wp1 arrival, wp1 departure, wp2 arrival.
    const times = screen.getAllByTestId('time-picker');
    fireEvent.change(times[0], { target: { value: '08:00' } });
    fireEvent.change(times[1], { target: { value: '12:30' } });
    fireEvent.change(times[2], { target: { value: '14:00' } });
    fireEvent.change(times[3], { target: { value: '15:00' } });

    const airlines = screen.getAllByPlaceholderText('Lufthansa');
    fireEvent.change(airlines[0], { target: { value: 'Brussels Airlines' } });
    fireEvent.change(airlines[1], { target: { value: 'Finnair' } });
    const numbers = screen.getAllByPlaceholderText('LH 123');
    fireEvent.change(numbers[0], { target: { value: 'SN 1234' } });
    fireEvent.change(numbers[1], { target: { value: 'AY 15' } });
    const seats = screen.getAllByPlaceholderText('12A');
    fireEvent.change(seats[0], { target: { value: '4F' } });

    // The last leg lands a day later than it departs.
    await pickDay('Arrival', 1, 'Arrive Day');

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];

    expect(payload.endpoints.map((e: { role: string; code: string }) => `${e.role}:${e.code}`)).toEqual(['from:BRU', 'stop:HEL', 'to:JFK']);
    expect(payload.metadata.legs).toHaveLength(2);
    expect(payload.metadata.legs[0]).toMatchObject({
      from: 'BRU', to: 'HEL', airline: 'Brussels Airlines', flight_number: 'SN 1234', seat: '4F',
      dep_day_id: 10, dep_time: '08:00', arr_day_id: 10, arr_time: '12:30',
    });
    expect(payload.metadata.legs[1]).toMatchObject({ from: 'HEL', to: 'JFK', airline: 'Finnair', flight_number: 'AY 15', arr_day_id: 12, arr_time: '15:00' });
    // Flat mirrors of the first leg for legacy readers.
    expect(payload.metadata).toMatchObject({ airline: 'Brussels Airlines', flight_number: 'SN 1234', seat: '4F', departure_airport: 'BRU', arrival_airport: 'JFK' });
    expect(payload.day_id).toBe(10);
    expect(payload.end_day_id).toBe(12);
    expect(payload.reservation_time).toBe('2026-08-01T08:00');
    expect(payload.reservation_end_time).toBe('2026-08-03T15:00');
  });

  it('FE-PLANNER-TRANSMODAL-033: removing a flight stop collapses the route back to two waypoints', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'BRU → JFK');
    await userEvent.click(screen.getByRole('button', { name: /Add stop/i }));
    expect(screen.getAllByTestId('airport-select')).toHaveLength(3);

    // Only the intermediate stop carries a delete button.
    await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    expect(screen.getAllByTestId('airport-select')).toHaveLength(2);

    const airports = screen.getAllByTestId('airport-select');
    fireEvent.change(airports[0], { target: { value: 'BRU' } });
    fireEvent.change(airports[1], { target: { value: 'JFK' } });
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.endpoints.map((e: { role: string }) => e.role)).toEqual(['from', 'to']);
    expect(payload.metadata.legs).toBeUndefined();
  });

  // ── Per-segment booking references (#1943) ─────────────────────────────────

  function multiLegFlight(): Reservation {
    const res = buildReservation({ id: 31, title: 'BRU → HEL → JFK', type: 'flight' });
    return Object.assign(res, {
      day_id: 10,
      end_day_id: 12,
      reservation_time: '2026-08-01T08:00',
      reservation_end_time: '2026-08-03T15:00',
      confirmation_number: 'BOOK1',
      metadata: {
        airline: 'Brussels Airlines', flight_number: 'SN 1234', departure_airport: 'BRU', arrival_airport: 'JFK',
        legs: [
          { from: 'BRU', to: 'HEL', airline: 'Brussels Airlines', flight_number: 'SN 1234', confirmation_number: 'ABC123', dep_day_id: 10, dep_time: '08:00', arr_day_id: 10, arr_time: '12:30' },
          { from: 'HEL', to: 'JFK', airline: 'Finnair', flight_number: 'AY 15', confirmation_number: 'XYZ789', dep_day_id: 11, dep_time: '14:00', arr_day_id: 12, arr_time: '15:00' },
        ],
      },
      endpoints: [
        { id: 1, reservation_id: 31, role: 'from', sequence: 0, name: 'Brussels (BRU)', code: 'BRU', lat: 50.9, lng: 4.48, timezone: 'Europe/Brussels', local_date: '2026-08-01', local_time: '08:00' },
        { id: 2, reservation_id: 31, role: 'stop', sequence: 1, name: 'Helsinki (HEL)', code: 'HEL', lat: 60.31, lng: 24.96, timezone: 'Europe/Helsinki', local_date: '2026-08-02', local_time: '14:00' },
        { id: 3, reservation_id: 31, role: 'to', sequence: 2, name: 'New York (JFK)', code: 'JFK', lat: 40.64, lng: -73.78, timezone: 'America/New_York', local_date: '2026-08-03', local_time: '15:00' },
      ],
    }) as unknown as Reservation;
  }

  it('FE-PLANNER-TRANSMODAL-058: each segment of a stopover flight saves its own booking code', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'BRU → HEL → JFK');
    await userEvent.click(screen.getByRole('button', { name: /Add stop/i }));
    const airports = screen.getAllByTestId('airport-select');
    fireEvent.change(airports[0], { target: { value: 'BRU' } });
    fireEvent.change(airports[1], { target: { value: 'HEL' } });
    fireEvent.change(airports[2], { target: { value: 'JFK' } });

    // Two departing waypoints get a code field, the booking's own field stays last.
    const codes = screen.getAllByPlaceholderText('e.g. ABC12345');
    expect(codes).toHaveLength(3);
    fireEvent.change(codes[0], { target: { value: 'ABC123' } });
    fireEvent.change(codes[1], { target: { value: 'XYZ789' } });
    fireEvent.change(codes[2], { target: { value: 'BOOK1' } });

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.metadata.legs.map((l: { confirmation_number?: string }) => l.confirmation_number)).toEqual(['ABC123', 'XYZ789']);
    // The booking's own reference stays where it was and is never mirrored.
    expect(payload.confirmation_number).toBe('BOOK1');
    expect(payload.metadata.confirmation_number).toBeUndefined();
  });

  it('FE-PLANNER-TRANSMODAL-059: no per-segment field while the route writes no legs', async () => {
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} />);

    fireEvent.change(screen.getAllByTestId('airport-select')[0], { target: { value: 'BRU' } });
    fireEvent.change(screen.getAllByTestId('airport-select')[1], { target: { value: 'JFK' } });
    // Only the booking's own field: a direct flight stores no legs.
    expect(screen.getAllByPlaceholderText('e.g. ABC12345')).toHaveLength(1);

    // A third waypoint whose airport is never picked drops out of the route, so
    // the legs are still not written and the field must stay away. Otherwise the
    // typed code would vanish on save.
    await userEvent.click(screen.getByRole('button', { name: /Add stop/i }));
    expect(screen.getAllByTestId('airport-select')).toHaveLength(3);
    expect(screen.getAllByPlaceholderText('e.g. ABC12345')).toHaveLength(1);
  });

  it('FE-PLANNER-TRANSMODAL-060: editing a stopover flight pre-fills every segment code and a re-save keeps them', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} reservation={multiLegFlight()} onSave={onSave} />);

    const codes = screen.getAllByPlaceholderText('e.g. ABC12345') as HTMLInputElement[];
    expect(codes.map(i => i.value)).toEqual(['ABC123', 'XYZ789', 'BOOK1']);

    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.metadata.legs.map((l: { confirmation_number?: string }) => l.confirmation_number)).toEqual(['ABC123', 'XYZ789']);
    expect(payload.confirmation_number).toBe('BOOK1');
  });

  it('FE-PLANNER-TRANSMODAL-061: dropping the stop drops the segment codes with the legs, never the booking code', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} reservation={multiLegFlight()} onSave={onSave} />);

    // Removing the only stop collapses the route to a direct flight, so there are
    // no legs left to hold a per-segment code. Documented behaviour, not a bug:
    // the field disappears with them and the booking keeps its own reference.
    await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    expect(screen.getAllByPlaceholderText('e.g. ABC12345')).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.metadata.legs).toBeUndefined();
    expect(payload.confirmation_number).toBe('BOOK1');
  });

  it('FE-PLANNER-TRANSMODAL-034: the departure-date picker moves the whole flight to another day', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH 400');
    fireEvent.change(screen.getAllByTestId('airport-select')[0], { target: { value: 'FRA' } });
    fireEvent.change(screen.getAllByTestId('airport-select')[1], { target: { value: 'JFK' } });
    await pickDay('Departure', 0, 'Stop Day');

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].day_id).toBe(11);
  });

  // ── Multi-leg trains (#1150) — edit round-trip ─────────────────────────────

  function multiLegTrain(): Reservation {
    const res = buildReservation({ id: 30, title: 'Berlin → München', type: 'train' });
    return Object.assign(res, {
      day_id: 10,
      end_day_id: 12,
      reservation_time: '2026-08-01T08:00',
      reservation_end_time: '2026-08-03T18:00',
      metadata: {
        train_number: 'ICE 100', platform: '5', seat: '11A',
        legs: [
          { from: 'Berlin Hbf', to: 'Frankfurt Hbf', train_number: 'ICE 100', platform: '5', seat: '11A', dep_day_id: 10, dep_time: '08:00', arr_day_id: 11, arr_time: '12:00', day_positions: { '10': 2 } },
          { from: 'Frankfurt Hbf', to: 'München Hbf', train_number: 'ICE 200', platform: '7', seat: '12B', dep_day_id: 11, dep_time: '13:00', arr_day_id: 12, arr_time: '18:00' },
        ],
      },
      endpoints: [
        { id: 1, reservation_id: 30, role: 'from', sequence: 0, name: 'Berlin Hbf', code: null, lat: 52.52, lng: 13.37, timezone: null, local_date: '2026-08-01', local_time: '08:00' },
        { id: 2, reservation_id: 30, role: 'stop', sequence: 1, name: 'Frankfurt Hbf', code: null, lat: 50.107, lng: 8.663, timezone: null, local_date: '2026-08-02', local_time: '13:00' },
        { id: 3, reservation_id: 30, role: 'to', sequence: 2, name: 'München Hbf', code: null, lat: 48.14, lng: 11.558, timezone: null, local_date: '2026-08-03', local_time: '18:00' },
      ],
    }) as unknown as Reservation;
  }

  it('FE-PLANNER-TRANSMODAL-035: editing a multi-leg train seeds every station from metadata.legs', () => {
    render(<TransportModal {...defaultProps} days={routeDays} reservation={multiLegTrain()} />);

    expect(screen.getAllByTestId('location-select')).toHaveLength(3);
    const numbers = screen.getAllByPlaceholderText('ICE 123') as HTMLInputElement[];
    expect(numbers.map(i => i.value)).toEqual(['ICE 100', 'ICE 200']);
    const platforms = screen.getAllByPlaceholderText('12') as HTMLInputElement[];
    expect(platforms.map(i => i.value)).toEqual(['5', '7']);
    const times = screen.getAllByTestId('time-picker') as HTMLInputElement[];
    // wp0 dep, wp1 arr, wp1 dep, wp2 arr
    expect(times.map(i => i.value)).toEqual(['08:00', '12:00', '13:00', '18:00']);
  });

  it('FE-PLANNER-TRANSMODAL-036: re-saving a multi-leg train keeps its legs and day-plan positions', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} reservation={multiLegTrain()} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.endpoints.map((e: { role: string; name: string }) => `${e.role}:${e.name}`)).toEqual([
      'from:Berlin Hbf', 'stop:Frankfurt Hbf', 'to:München Hbf',
    ]);
    expect(payload.metadata.legs).toHaveLength(2);
    // The planner owns the per-leg positions — an edit must not drop them.
    expect(payload.metadata.legs[0].day_positions).toEqual({ '10': 2 });
    expect(payload.metadata).toMatchObject({ train_number: 'ICE 100', platform: '5', seat: '11A' });
    expect(payload.day_id).toBe(10);
    expect(payload.end_day_id).toBe(12);
  });

  it('FE-PLANNER-TRANSMODAL-037: a train with no arrival day dates its arrival from the departure day', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /^Train$/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'RE 9');
    const stations = screen.getAllByTestId('location-select');
    fireEvent.change(stations[0], { target: { value: 'Köln Hbf' } });
    fireEvent.change(stations[1], { target: { value: 'Aachen Hbf' } });
    fireEvent.change(screen.getAllByTestId('time-picker')[0], { target: { value: '09:00' } });
    fireEvent.change(screen.getAllByTestId('time-picker')[1], { target: { value: '10:05' } });
    fireEvent.change(screen.getAllByPlaceholderText('12')[0], { target: { value: '3' } });
    fireEvent.change(screen.getAllByPlaceholderText('42A')[0], { target: { value: '21C' } });
    // Blank out the arrival day so only the departure day is known.
    await pickDay('Arrival', 0, '—');

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.reservation_end_time).toBe('2026-08-01T10:05');
    expect(payload.endpoints[1].local_date).toBe('2026-08-01');
    expect(payload.metadata).toMatchObject({ platform: '3', seat: '21C' });
  });

  it('FE-PLANNER-TRANSMODAL-038: a single-leg flight mirrors the seat into the flat metadata', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH 400');
    fireEvent.change(screen.getAllByTestId('airport-select')[0], { target: { value: 'FRA' } });
    fireEvent.change(screen.getAllByTestId('airport-select')[1], { target: { value: 'JFK' } });
    fireEvent.change(screen.getAllByPlaceholderText('12A')[0], { target: { value: '7A' } });

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.metadata.seat).toBe('7A');
    expect(payload.metadata.legs).toBeUndefined();
  });

  // ── Non-flight form fields ─────────────────────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-039: a car rental keeps its pick-up/return days, times and booking code', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /^Car$/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'Sixt compact');
    // The labels switch to rental wording for cars.
    expect(screen.getByText('Pickup')).toBeInTheDocument();
    expect(screen.getByText('Return time')).toBeInTheDocument();

    const locations = screen.getAllByTestId('location-select');
    fireEvent.change(locations[0], { target: { value: 'Berlin Airport' } });
    fireEvent.change(locations[1], { target: { value: 'Munich Airport' } });
    await pickDay('Pickup', 0, 'Depart Day');
    await pickDay('Return', 0, 'Arrive Day');
    fireEvent.change(screen.getAllByTestId('time-picker')[0], { target: { value: '09:30' } });
    fireEvent.change(screen.getAllByTestId('time-picker')[1], { target: { value: '17:45' } });
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. ABC12345/i), 'SIXT-42');
    await userEvent.type(screen.getByPlaceholderText(/Additional notes/i), 'Full-to-full tank');

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload).toMatchObject({
      type: 'car', day_id: 10, end_day_id: 12,
      reservation_time: '2026-08-01T09:30', reservation_end_time: '2026-08-03T17:45',
      confirmation_number: 'SIXT-42', notes: 'Full-to-full tank',
    });
    expect(payload.endpoints.map((e: { name: string }) => e.name)).toEqual(['Berlin Airport', 'Munich Airport']);
  });

  it('FE-PLANNER-TRANSMODAL-040: the status picker switches the booking to confirmed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH 400');
    await userEvent.click(screen.getByText('Pending'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmed' }));
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].status).toBe('confirmed');
  });

  // ── Submit guards + failures ───────────────────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-041: submitting the form with an empty title is a no-op', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} onSave={onSave} />);
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });

  it('FE-PLANNER-TRANSMODAL-042: a rejected save surfaces the error message and re-enables the button', async () => {
    const addToast = vi.fn();
    window.__addToast = addToast;
    const onSave = vi.fn().mockRejectedValue(new Error('Server exploded'));
    render(<TransportModal {...defaultProps} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH 400');
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Server exploded', 'error', undefined));
    await waitFor(() => expect(screen.getByRole('button', { name: /^Add$/i })).toBeEnabled());
    delete window.__addToast;
  });

  it('FE-PLANNER-TRANSMODAL-043: a closed modal does not seed the form from the reservation', () => {
    const res = buildReservation({ title: 'Hidden Flight', type: 'flight' });
    render(<TransportModal {...defaultProps} isOpen={false} reservation={res} />);
    expect(screen.queryByDisplayValue('Hidden Flight')).not.toBeInTheDocument();
  });

  // ── Travelers (#1517) ──────────────────────────────────────────────────────

  const tripMembers: TripMember[] = [
    { id: 1, username: 'alice', avatar_url: null },
    { id: 2, username: 'bob', avatar_url: null },
  ];

  it('FE-PLANNER-TRANSMODAL-044: assigned travelers are written back after the save resolves', async () => {
    const onSave = vi.fn().mockResolvedValue({ id: 60 });
    let body: { user_ids: number[] } | null = null;
    server.use(
      http.put('/api/trips/1/reservations/60/travelers', async ({ request }) => {
        body = (await request.json()) as { user_ids: number[] };
        return HttpResponse.json({ travelers: [] });
      }),
    );

    render(<TransportModal {...defaultProps} onSave={onSave} tripMembers={tripMembers} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH 400');
    await userEvent.click(screen.getByText('bob'));
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body!.user_ids).toEqual([2]);
  });

  it('FE-PLANNER-TRANSMODAL-045: a failing traveler write surfaces an error toast', async () => {
    const addToast = vi.fn();
    window.__addToast = addToast;
    const onSave = vi.fn().mockResolvedValue({ id: 61 });
    server.use(
      http.put('/api/trips/1/reservations/61/travelers', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );

    render(<TransportModal {...defaultProps} onSave={onSave} tripMembers={tripMembers} />);
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'LH 400');
    await userEvent.click(screen.getByText('alice'));
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined));
    delete window.__addToast;
  });

  // ── Linked cost actions ─────────────────────────────────────────────────────

  function seedLinkedCost() {
    seedStore(useAddonStore, {
      addons: [{ id: 'budget', name: 'Budget', type: 'budget', icon: '', enabled: true }],
      loaded: true,
    });
    seedStore(useTripStore, {
      trip: buildTrip({ id: 1 }),
      budgetItems: [
        { id: 3, trip_id: 1, name: 'Flight ticket', total_price: 320, currency: 'EUR', category: 'transport', reservation_id: 50, members: [], payers: [], persons: 1, expense_date: null, paid_by_user_id: null },
      ],
    });
  }

  it('FE-PLANNER-TRANSMODAL-046: editing the linked cost saves the booking, then opens that item', async () => {
    seedLinkedCost();
    const onSave = vi.fn().mockResolvedValue({ id: 50 });
    const onOpenExpense = vi.fn();
    render(
      <TransportModal
        {...defaultProps}
        onSave={onSave}
        onOpenExpense={onOpenExpense}
        reservation={buildReservation({ id: 50, type: 'flight', title: 'LH 400' })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^Edit$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onOpenExpense).toHaveBeenCalledWith({ editItem: expect.objectContaining({ id: 3 }) });
  });

  it('FE-PLANNER-TRANSMODAL-047: a failing cost removal reports the error', async () => {
    const addToast = vi.fn();
    window.__addToast = addToast;
    seedLinkedCost();
    server.use(http.delete('/api/trips/1/budget/3', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));

    render(<TransportModal {...defaultProps} reservation={buildReservation({ id: 50, type: 'flight', title: 'LH 400' })} />);
    await userEvent.click(screen.getByRole('button', { name: /Remove expense/i }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined));
    delete window.__addToast;
  });

  it('FE-PLANNER-TRANSMODAL-048: an imported transport with a price creates the linked cost on save', async () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'budget', name: 'Budget', type: 'budget', icon: '', enabled: true }],
      loaded: true,
    });
    const onSave = vi.fn().mockResolvedValue({ id: 62 });
    const prefill = {
      title: 'LH 400', type: 'flight', status: 'pending',
      reservation_time: '2026-08-01T08:00', reservation_end_time: '2026-08-01T11:00',
      metadata: { airline: 'Lufthansa', flight_number: 'LH 400', price: 189.5, priceCurrency: 'EUR' },
      endpoints: [],
    } as unknown as BookingReviewDraft;

    render(<TransportModal {...defaultProps} days={routeDays} prefill={prefill} onSave={onSave} />);
    // The parsed price is previewed before the booking exists.
    expect(screen.getByText('Linked expense')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].create_budget_entry).toEqual({ total_price: 189.5, category: 'flights' });
  });

  // ── File edge cases ─────────────────────────────────────────────────────────

  it('FE-PLANNER-TRANSMODAL-049: a cancelled file dialog changes nothing', () => {
    render(<TransportModal {...defaultProps} reservation={null} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(screen.getByRole('button', { name: /Attach file/i })).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-050: a failing upload to an existing booking shows the upload error', async () => {
    const addToast = vi.fn();
    window.__addToast = addToast;
    const onFileUpload = vi.fn().mockRejectedValue(new Error('disk full'));
    const res = buildReservation({ id: 20, type: 'train', title: 'Eurostar' });

    render(<TransportModal {...defaultProps} reservation={res} onFileUpload={onFileUpload} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'fail.pdf', { type: 'application/pdf' })] } });

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to upload', 'error', undefined));
    delete window.__addToast;
  });

  it('FE-PLANNER-TRANSMODAL-051: a failing unlink reports the update error', async () => {
    const addToast = vi.fn();
    window.__addToast = addToast;
    server.use(
      http.put('/api/trips/1/files/70', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
      http.get('/api/trips/1/files/70/links', () => HttpResponse.json({ error: 'nope' }, { status: 500 })),
    );
    const res = buildReservation({ id: 21, type: 'flight', title: 'LH 400' });
    const attached = buildTripFile({ id: 70, original_name: 'boarding.pdf' });
    (attached as unknown as { reservation_id: number }).reservation_id = 21;

    render(<TransportModal {...defaultProps} reservation={res} files={[attached]} />);
    const row = screen.getByText('boarding.pdf').closest('div') as HTMLElement;
    await userEvent.click(within(row).getAllByRole('button')[1]);

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to update', 'error', undefined));
    delete window.__addToast;
  });

  it('FE-PLANNER-TRANSMODAL-052: a failing link keeps the picker open and reports the error', async () => {
    const addToast = vi.fn();
    window.__addToast = addToast;
    server.use(http.post('/api/trips/1/files/71/link', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));

    const res = buildReservation({ id: 22, type: 'flight', title: 'LH 400' });
    const loose = buildTripFile({ id: 71, original_name: 'invoice.pdf' });

    render(<TransportModal {...defaultProps} reservation={res} files={[loose]} />);
    await userEvent.click(screen.getByRole('button', { name: /Link existing file/i }));
    const pickerItem = screen.getByText('invoice.pdf').closest('button') as HTMLButtonElement;
    fireEvent.mouseEnter(pickerItem);
    fireEvent.mouseLeave(pickerItem);
    await userEvent.click(pickerItem);

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Failed to update', 'error', undefined));
    expect(screen.getByRole('button', { name: /Link existing file/i })).toBeInTheDocument();
    delete window.__addToast;
  });

  // ── Transit itinerary preservation, continued ──────────────────────────────

  it('FE-PLANNER-TRANSMODAL-053: kept transfer stops are re-sequenced in order', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const res = buildReservation({ title: 'A → C', type: 'bus' });
    Object.assign(res, {
      metadata: { transit: { provider: 'transitous', legs: [{ mode: 'BUS' }] } },
      // Stops arrive out of order — the form must restore their sequence.
      endpoints: [
        { role: 'from', sequence: 0, name: 'A', code: null, lat: 0, lng: 0, timezone: null, local_date: null, local_time: null },
        { role: 'stop', sequence: 2, name: 'Second stop', code: null, lat: 1, lng: 1, timezone: null, local_date: null, local_time: null },
        { role: 'stop', sequence: 1, name: 'First stop', code: null, lat: 2, lng: 2, timezone: null, local_date: null, local_time: null },
        { role: 'to', sequence: 3, name: 'C', code: null, lat: 3, lng: 3, timezone: null, local_date: null, local_time: null },
      ],
    });

    render(<TransportModal {...defaultProps} reservation={res as unknown as Reservation} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.endpoints.map((e: { name: string }) => e.name)).toEqual(['A', 'First stop', 'Second stop', 'C']);
    expect(payload.endpoints.map((e: { sequence: number }) => e.sequence)).toEqual([0, 1, 2, 3]);
  });

  it('FE-PLANNER-TRANSMODAL-055: an existing traveler list is toggled off and written back empty', async () => {
    const onSave = vi.fn().mockResolvedValue({ id: 63 });
    let body: { user_ids: number[] } | null = null;
    server.use(
      http.put('/api/trips/1/reservations/63/travelers', async ({ request }) => {
        body = (await request.json()) as { user_ids: number[] };
        return HttpResponse.json({ travelers: [] });
      }),
    );
    const res = buildReservation({ id: 63, type: 'flight', title: 'LH 400' });
    (res as unknown as { travelers: { user_id: number; username: string }[] }).travelers = [
      { user_id: 1, username: 'alice' },
    ];

    render(<TransportModal {...defaultProps} reservation={res} onSave={onSave} tripMembers={tripMembers} />);
    // Seeded from the reservation, so alice starts selected.
    expect(screen.getByText('alice').closest('button')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByText('alice'));
    await userEvent.click(screen.getByRole('button', { name: /^Update$/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body!.user_ids).toEqual([]);
  });

  it('FE-PLANNER-TRANSMODAL-056: a train stop can be added and removed again', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TransportModal {...defaultProps} days={routeDays} selectedDayId={10} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /^Train$/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. Lufthansa/i), 'Köln → Aachen');
    await userEvent.click(screen.getByRole('button', { name: /Add stop/i }));
    expect(screen.getAllByTestId('location-select')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    expect(screen.getAllByTestId('location-select')).toHaveLength(2);

    // Move the departure to another day through its own picker.
    await pickDay('Departure', 0, 'Stop Day');
    const stations = screen.getAllByTestId('location-select');
    fireEvent.change(stations[0], { target: { value: 'Köln Hbf' } });
    fireEvent.change(stations[1], { target: { value: 'Aachen Hbf' } });

    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.day_id).toBe(11);
    expect(payload.endpoints.map((e: { role: string }) => e.role)).toEqual(['from', 'to']);
  });

  it('FE-PLANNER-TRANSMODAL-057: the open-file link on an attached document does not throw', async () => {
    const res = buildReservation({ id: 23, type: 'flight', title: 'LH 400' });
    const attached = buildTripFile({ id: 72, original_name: 'boarding.pdf' });
    (attached as unknown as { reservation_id: number }).reservation_id = 23;

    render(<TransportModal {...defaultProps} reservation={res} files={[attached]} />);
    const row = screen.getByText('boarding.pdf').closest('div') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /open/i }));
    expect(screen.getByText('boarding.pdf')).toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-054: switching the transit day rescopes the quick picks', async () => {
    const days = [
      buildDay({ id: 10, date: '2025-06-01', title: 'Day one' }),
      buildDay({ id: 11, date: '2025-06-02', title: 'Day two' }),
    ];
    const louvre = buildPlace({ id: 1, name: 'Louvre' });
    const eiffel = buildPlace({ id: 2, name: 'Eiffel Tower' });
    const orsay = buildPlace({ id: 3, name: 'Musée d\'Orsay' });
    const assignments = {
      '10': [buildAssignment({ day_id: 10, place_id: louvre.id, place: louvre })],
      // Two entries so the quick picks follow the day's own order.
      '11': [
        buildAssignment({ day_id: 11, order_index: 1, place_id: orsay.id, place: orsay }),
        buildAssignment({ day_id: 11, order_index: 0, place_id: eiffel.id, place: eiffel }),
      ],
    };

    render(
      <TransportModal
        {...defaultProps}
        days={days}
        selectedDayId={10}
        initialAutomated
        places={[louvre, eiffel, orsay]}
        assignments={assignments}
        accommodations={[]}
      />,
    );

    await userEvent.click(screen.getByText('Day one'));
    await userEvent.click(screen.getByRole('button', { name: /^Day two/ }));

    const [fromInput] = screen.getAllByPlaceholderText('Search stop or station…');
    await userEvent.click(fromInput);
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText(/Orsay/)).toBeInTheDocument();
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument();
  });
});
