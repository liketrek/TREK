// FE-PLANNER-DAYDETAIL-DF-001 to FE-PLANNER-DAYDETAIL-DF-002
// The day panel's heading with "date first in day headings" on (#2921).
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { buildAdmin, buildDay, buildTrip } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import DayDetailPanel from './DayDetailPanel';

const day = buildDay({ id: 1, trip_id: 1, date: '2025-06-15', title: 'Day in Paris' });

const props = {
  day,
  days: [day],
  places: [],
  categories: [],
  tripId: 1,
  assignments: {},
  reservations: [],
  lat: null,
  lng: null,
  onClose: vi.fn(),
  onAccommodationChange: vi.fn(),
};

function settings(dayDateFirst: boolean) {
  seedStore(useSettingsStore, {
    settings: { time_format: '24h', temperature_unit: 'celsius', day_date_first: dayDateFirst },
  });
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  server.use(
    http.get('/api/weather/detailed', () => HttpResponse.json({ error: true })),
    http.get('/api/trips/1/accommodations', () => HttpResponse.json({ accommodations: [] }))
  );
  seedStore(useAuthStore, { user: buildAdmin(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
});

describe('DayDetailPanel with the date first', () => {
  it('FE-PLANNER-DAYDETAIL-DF-001: the pencil sits with the name, and renaming keeps the date in view', async () => {
    settings(true);
    const user = userEvent.setup();
    const onUpdateDayTitle = vi.fn();
    render(<DayDetailPanel {...props} onUpdateDayTitle={onUpdateDayTitle} />);
    const pencil = screen.getByLabelText('Edit');
    expect(screen.getByText('Day in Paris').parentElement).toContainElement(pencil);
    expect(screen.getByText(/June 15/).parentElement).not.toContainElement(pencil);
    await user.click(pencil);
    const input = await screen.findByDisplayValue('Day in Paris');
    expect(screen.getByText(/June 15/)).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, 'Vegueta');
    await user.keyboard('{Enter}');
    expect(onUpdateDayTitle).toHaveBeenCalledWith(1, 'Vegueta');
  });

  it('FE-PLANNER-DAYDETAIL-DF-002: with the name first the pencil stays on the heading, as before', async () => {
    settings(false);
    const user = userEvent.setup();
    render(<DayDetailPanel {...props} onUpdateDayTitle={vi.fn()} />);
    const pencil = screen.getByLabelText('Edit');
    expect(screen.getByText('Day in Paris').parentElement).toContainElement(pencil);
    await user.click(pencil);
    expect(await screen.findByDisplayValue('Day in Paris')).toBeInTheDocument();
    expect(screen.getByText(/June 15/)).toBeInTheDocument();
  });
});
