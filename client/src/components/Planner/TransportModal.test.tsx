// FE-PLANNER-TRANSMODAL-001 to FE-PLANNER-TRANSMODAL-021
import { render, screen, waitFor, fireEvent } from '../../../tests/helpers/render';
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

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
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
    const unlinkBtn = fileRow.querySelector('button[type="button"]')!;
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

  // ── Manual / Automated creation switch (#1065) ─────────────────────────────

  it('FE-PLANNER-TRANSMODAL-022: creating shows the Manual/Automated switch; Automated opens the transit search', async () => {
    render(<TransportModal {...defaultProps} places={[]} accommodations={[]} />);
    expect(screen.getByRole('button', { name: 'Manual transport' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Automated transport' }));
    // No day selected in defaultProps (days: []) — the pick-day hint shows.
    expect(screen.getByText(/Pick a day/)).toBeInTheDocument();
    // The manual form is gone in automated mode.
    expect(screen.queryByPlaceholderText(/e\.g\. Lufthansa/i)).not.toBeInTheDocument();
  });

  it('FE-PLANNER-TRANSMODAL-022b: a trip without start/end dates only offers the manual form', () => {
    render(<TransportModal {...defaultProps} tripHasDates={false} places={[]} accommodations={[]} />);
    expect(screen.queryByRole('button', { name: 'Automated transport' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manual transport' })).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: 'Automated transport' })).not.toBeInTheDocument();
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
});
