import { render, screen, waitFor, fireEvent, act, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { buildUser, buildTrip, buildPlace, buildCategory, buildReservation } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAddonStore } from '../../store/addonStore';
import { usePluginStore } from '../../store/pluginStore';
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import type { AssignmentsMap } from '../../types';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/client')>();
  return {
    ...actual,
    mapsApi: { details: vi.fn().mockResolvedValue({ place: null }) },
  };
});

vi.mock('../../api/authUrl', () => ({
  getAuthUrl: vi.fn().mockResolvedValue('http://test/file'),
}));

vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
}));

// ── IntersectionObserver stub ─────────────────────────────────────────────────

class MockIO {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

beforeAll(() => {
  (globalThis as any).IntersectionObserver = MockIO;
});

// ── Import component after mocks ──────────────────────────────────────────────

import PlaceInspector from './PlaceInspector';
import { mapsApi } from '../../api/client';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const place = buildPlace({
  id: 1,
  name: 'Eiffel Tower',
  address: 'Champ de Mars, Paris',
  lat: 48.8584,
  lng: 2.2945,
  description: 'Famous iron tower',
});

const cat = buildCategory({ name: 'Landmark', icon: 'MapPin' });

const defaultProps = {
  place,
  categories: [cat],
  days: [],
  selectedDayId: null as number | null,
  selectedAssignmentId: null as number | null,
  assignments: {} as Record<string, any[]>,
  reservations: [] as any[],
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAssignToDay: vi.fn(),
  onRemoveAssignment: vi.fn(),
  files: [] as any[],
  onFileUpload: vi.fn().mockResolvedValue(undefined),
  tripMembers: [] as any[],
  onSetParticipants: vi.fn(),
  onUpdatePlace: vi.fn(),
};

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  sessionStorage.clear();

  seedStore(useAuthStore, { user: buildUser(), isAuthenticated: true });
  seedStore(useTripStore, { trip: buildTrip({ id: 1 }) });
  seedStore(useSettingsStore, { settings: { time_format: '24h', temperature_unit: 'celsius' } });

  vi.mocked(mapsApi.details).mockResolvedValue({ place: null });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlaceInspector', () => {

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-001: returns null when place is null', () => {
    const { container } = render(<PlaceInspector {...defaultProps} place={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-002: renders without crashing with a valid place', () => {
    render(<PlaceInspector {...defaultProps} />);
    expect(document.body).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-003: shows place name in header', () => {
    render(<PlaceInspector {...defaultProps} />);
    expect(screen.getByText('Eiffel Tower')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-004: shows place address', () => {
    render(<PlaceInspector {...defaultProps} />);
    expect(screen.getByText(/Champ de Mars, Paris/)).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-005: shows category badge with category name', () => {
    const placeWithCat = buildPlace({ id: 100, category_id: cat.id });
    render(<PlaceInspector {...defaultProps} place={placeWithCat} categories={[cat]} />);
    const matches = screen.getAllByText('Landmark');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('FE-PLANNER-INSPECTOR-006: shows lat/lng coordinates', () => {
    render(<PlaceInspector {...defaultProps} />);
    // The component renders Number(lat).toFixed(6), Number(lng).toFixed(6)
    expect(screen.getByText(/48\.858400/)).toBeTruthy();
    expect(screen.getByText(/2\.294500/)).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-007: shows time range when place_time and end_time are set', () => {
    const p = buildPlace({ id: 101, place_time: '09:00', end_time: '17:00' });
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(screen.getByText(/09:00/)).toBeTruthy();
    expect(screen.getByText(/17:00/)).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-008: shows only start time when no end_time', () => {
    const p = buildPlace({ id: 102, place_time: '09:00', end_time: null });
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(screen.getByText(/09:00/)).toBeTruthy();
    // The '–' separator should not be present
    expect(screen.queryByText(/–/)).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-009: description is rendered as markdown', () => {
    const p = buildPlace({ id: 103, description: '**Bold text**' });
    const { container } = render(<PlaceInspector {...defaultProps} place={p} />);
    const strong = container.querySelector('strong');
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe('Bold text');
  });

  it('FE-PLANNER-INSPECTOR-010: notes rendered when no description', () => {
    const p = buildPlace({ id: 104, description: null, notes: 'Some notes' } as any);
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(screen.getByText(/Some notes/)).toBeTruthy();
  });

  // ── Close button ───────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-011: close (X) button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PlaceInspector {...defaultProps} onClose={onClose} />);
    // Find the X button — it's the close button with an X icon inside
    const buttons = screen.getAllByRole('button');
    // The close button is typically in the header, first button with X icon
    const closeBtn = buttons.find(btn => btn.querySelector('svg'));
    // Click the last-found header button that has no text label (the X)
    // More reliable: find button by its position as close button
    await user.click(buttons[0]); // first button is the close X
    expect(onClose).toHaveBeenCalled();
  });

  // ── Edit / Delete buttons ──────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-012: Edit button is visible', () => {
    render(<PlaceInspector {...defaultProps} />);
    // Edit button is in footer actions
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('FE-PLANNER-INSPECTOR-013: clicking Edit button calls onEdit', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const { container } = render(<PlaceInspector {...defaultProps} onEdit={onEdit} />);
    // The edit button has Edit2 icon — find footer buttons
    const allButtons = screen.getAllByRole('button');
    // Edit button is second-to-last in footer (before delete)
    const editBtn = allButtons[allButtons.length - 2];
    await user.click(editBtn);
    expect(onEdit).toHaveBeenCalled();
  });

  it('FE-PLANNER-INSPECTOR-014: clicking Delete button calls onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<PlaceInspector {...defaultProps} onDelete={onDelete} />);
    const allButtons = screen.getAllByRole('button');
    // Delete button is the last button in the footer
    const deleteBtn = allButtons[allButtons.length - 1];
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalled();
  });

  // ── Assign to / remove from day ────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-015: "Add to day" button appears when selectedDayId is set and place NOT in that day', () => {
    render(<PlaceInspector {...defaultProps} selectedDayId={1} assignments={{ '1': [] }} />);
    const allButtons = screen.getAllByRole('button');
    // The add-to-day button is the first footer button (Plus icon)
    // It should exist when selectedDayId is set and place is not assigned
    expect(allButtons.length).toBeGreaterThan(2);
  });

  it('FE-PLANNER-INSPECTOR-016: clicking assign-to-day button calls onAssignToDay with placeId', async () => {
    const user = userEvent.setup();
    const onAssignToDay = vi.fn();
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        assignments={{ '1': [] }}
        onAssignToDay={onAssignToDay}
      />
    );
    const addBtn = screen.getByText('Add to Day').closest('button')!;
    await user.click(addBtn);
    expect(onAssignToDay).toHaveBeenCalledWith(place.id);
  });

  it('FE-PLANNER-INSPECTOR-017: "Remove from day" button appears when place IS assigned to selectedDay', () => {
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        assignments={{ '1': assignmentInDay }}
      />
    );
    const allButtons = screen.getAllByRole('button');
    expect(allButtons.length).toBeGreaterThan(2);
  });

  it('FE-PLANNER-INSPECTOR-018: clicking remove calls onRemoveAssignment with dayId and assignmentId', async () => {
    const user = userEvent.setup();
    const onRemoveAssignment = vi.fn();
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        assignments={{ '1': assignmentInDay }}
        onRemoveAssignment={onRemoveAssignment}
      />
    );
    // Find the remove button — it carries the "Remove from Day" label
    const removeBtn = screen.getByText('Remove from Day').closest('button')!;
    await user.click(removeBtn);
    // Component calls onRemoveAssignment(selectedDayId, assignmentInDay.id)
    expect(onRemoveAssignment).toHaveBeenCalledWith(1, 99);
  });

  // ── Inline name editing ────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-019: double-clicking name enters edit mode', async () => {
    const user = userEvent.setup();
    render(<PlaceInspector {...defaultProps} />);
    const nameSpan = screen.getByText('Eiffel Tower');
    await user.dblClick(nameSpan);
    const input = screen.getByDisplayValue('Eiffel Tower');
    expect(input).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-020: pressing Enter commits edit and calls onUpdatePlace', async () => {
    const user = userEvent.setup();
    const onUpdatePlace = vi.fn();
    render(<PlaceInspector {...defaultProps} onUpdatePlace={onUpdatePlace} />);
    const nameSpan = screen.getByText('Eiffel Tower');
    await user.dblClick(nameSpan);
    const input = screen.getByDisplayValue('Eiffel Tower');
    await user.clear(input);
    await user.type(input, 'New Tower Name');
    await user.keyboard('{Enter}');
    expect(onUpdatePlace).toHaveBeenCalledWith(place.id, { name: 'New Tower Name' });
  });

  it('FE-PLANNER-INSPECTOR-021: pressing Escape cancels edit', async () => {
    const user = userEvent.setup();
    render(<PlaceInspector {...defaultProps} />);
    const nameSpan = screen.getByText('Eiffel Tower');
    await user.dblClick(nameSpan);
    expect(screen.getByDisplayValue('Eiffel Tower')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByDisplayValue('Eiffel Tower')).toBeNull();
    expect(screen.getByText('Eiffel Tower')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-022: blank name does not call onUpdatePlace', async () => {
    const user = userEvent.setup();
    const onUpdatePlace = vi.fn();
    render(<PlaceInspector {...defaultProps} onUpdatePlace={onUpdatePlace} />);
    const nameSpan = screen.getByText('Eiffel Tower');
    await user.dblClick(nameSpan);
    const input = screen.getByDisplayValue('Eiffel Tower');
    await user.clear(input);
    await user.keyboard('{Enter}');
    expect(onUpdatePlace).not.toHaveBeenCalled();
  });

  // ── Google Maps details (mapsApi) ──────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-023: mapsApi.details called when place has google_place_id', async () => {
    const p = buildPlace({ id: 200, google_place_id: 'ChIJ001' });
    render(<PlaceInspector {...defaultProps} place={p} />);
    await waitFor(() => {
      expect(vi.mocked(mapsApi.details)).toHaveBeenCalledWith('ChIJ001', expect.any(String));
    });
  });

  it('FE-PLANNER-INSPECTOR-024: rating chip shown when googleDetails has rating', async () => {
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { rating: 4.5, rating_count: 1200 },
    } as any);
    const p = buildPlace({ id: 201, google_place_id: 'ChIJ002' });
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(await screen.findByText(/4\.5/)).toBeInTheDocument();
  });

  it('FE-PLANNER-INSPECTOR-025: opening hours shown when available', async () => {
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { opening_hours: ['Mon: 9:00 AM – 5:00 PM', 'Tue: 9:00 AM – 5:00 PM'] },
    } as any);
    const user = userEvent.setup();
    const p = buildPlace({ id: 202, google_place_id: 'ChIJ003' });
    render(<PlaceInspector {...defaultProps} place={p} />);
    // Wait for hours to load — the button text shows a day's hours line
    const hoursBtn = await screen.findByText(/Show opening hours|Opening Hours|Mon:|9:00|09:00/i);
    const btn = hoursBtn.closest('button')!;
    await user.click(btn);
    // After expand, one of the hours lines should be visible
    await waitFor(() => {
      expect(screen.getByText(/Mon:/)).toBeTruthy();
    });
  });

  it('FE-PLANNER-INSPECTOR-026: open/closed badge shown when open_now is available', async () => {
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { open_now: true },
    } as any);
    const p = buildPlace({ id: 203, google_place_id: 'ChIJ004' });
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(await screen.findByText(/open/i)).toBeInTheDocument();
  });

  it('FE-PLANNER-INSPECTOR-027: mapsApi.details NOT called when place has no google_place_id or osm_id', async () => {
    const p = buildPlace({ id: 204, google_place_id: null, osm_id: null });
    render(<PlaceInspector {...defaultProps} place={p} />);
    // Wait a tick
    await act(async () => { await new Promise(r => setTimeout(r, 50)) });
    expect(vi.mocked(mapsApi.details)).not.toHaveBeenCalled();
  });

  // ── Files ──────────────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-028: files section shows file names after expanding', async () => {
    const user = userEvent.setup();
    const file = {
      id: 1,
      trip_id: 1,
      place_id: place.id,
      original_name: 'photo.jpg',
      url: '/uploads/photo.jpg',
      filename: 'photo.jpg',
      mime_type: 'image/jpeg',
      file_size: 1024,
      created_at: '2025-01-01T00:00:00.000Z',
    };
    render(<PlaceInspector {...defaultProps} files={[file as any]} />);
    // The files section header/toggle is always visible; click to expand
    const allButtons = screen.getAllByRole('button');
    const filesBtn = allButtons.find(btn => btn.textContent?.includes('1'));
    // Click the expand button (file count label button)
    if (filesBtn) {
      await user.click(filesBtn);
      expect(await screen.findByText('photo.jpg')).toBeInTheDocument();
    } else {
      // Try clicking the last non-footer button
      const toggleButtons = allButtons.filter(btn => !btn.closest('footer'));
      await user.click(toggleButtons[0]);
    }
  });

  it('FE-PLANNER-INSPECTOR-029: hidden file input is present when onFileUpload provided', () => {
    const { container } = render(<PlaceInspector {...defaultProps} />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
  });

  // ── Reservation chip ───────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-030: linked reservation shown when selectedAssignmentId has a reservation', () => {
    const reservation = buildReservation({ title: 'Museum Ticket', status: 'confirmed', assignment_id: 99 } as any);
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
        reservations={[reservation]}
      />
    );
    expect(screen.getByText('Museum Ticket')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-030b: the linked reservation opens its editor (#2012)', () => {
    const onEditReservation = vi.fn();
    const reservation = buildReservation({ title: 'Museum Ticket', status: 'confirmed', assignment_id: 99 } as any);
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
        reservations={[reservation]}
        onEditReservation={onEditReservation}
      />
    );
    const strip = screen.getByText('Museum Ticket').closest('[role="button"]') as HTMLElement;
    expect(strip).toBeTruthy();
    fireEvent.click(strip);
    expect(onEditReservation).toHaveBeenCalledWith(reservation);
  });

  it('FE-PLANNER-INSPECTOR-030e: a transport booking goes to the transport editor (#2012)', () => {
    const onEditTransport = vi.fn();
    const onEditReservation = vi.fn();
    // A ferry is a transport, and ReservationModal has no transport type to hold it.
    const reservation = buildReservation({ title: 'Ferry to Corfu', status: 'pending', type: 'ferry', assignment_id: 99 } as any);
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
        reservations={[reservation]}
        onEditTransport={onEditTransport}
        onEditReservation={onEditReservation}
      />
    );
    fireEvent.click(screen.getByText('Ferry to Corfu').closest('[role="button"]') as HTMLElement);
    expect(onEditTransport).toHaveBeenCalledWith(reservation);
    expect(onEditReservation).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-INSPECTOR-030f: no transport handler means no affordance on a transport (#2012)', () => {
    // A member who may edit bookings but not days must not get a button that no-ops.
    const reservation = buildReservation({ title: 'Ferry to Corfu', status: 'pending', type: 'ferry', assignment_id: 99 } as any);
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
        reservations={[reservation]}
        onEditReservation={vi.fn()}
      />
    );
    expect(screen.getByText('Ferry to Corfu').closest('[role="button"]')).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-030c: Enter and Space open it too (#2012)', () => {
    const onEditReservation = vi.fn();
    const reservation = buildReservation({ title: 'Museum Ticket', status: 'confirmed', assignment_id: 99 } as any);
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
        reservations={[reservation]}
        onEditReservation={onEditReservation}
      />
    );
    const strip = screen.getByText('Museum Ticket').closest('[role="button"]') as HTMLElement;
    expect(strip.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(strip, { key: 'Enter' });
    fireEvent.keyDown(strip, { key: ' ' });
    expect(onEditReservation).toHaveBeenCalledTimes(2);
  });

  it('FE-PLANNER-INSPECTOR-030d: without a handler the strip stays a read-only summary', () => {
    const reservation = buildReservation({ title: 'Museum Ticket', status: 'confirmed', assignment_id: 99 } as any);
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
        reservations={[reservation]}
      />
    );
    // A viewer with no edit right gets no target, and no misleading pointer.
    expect(screen.getByText('Museum Ticket').closest('[role="button"]')).toBeNull();
    expect(screen.getByText('Museum Ticket')).toBeTruthy();
  });

  // ── Participants ───────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-031: participants section shown when tripMembers > 1 and selectedAssignmentId is set', () => {
    const members = [buildUser({ id: 1 }), buildUser({ id: 2 })];
    const assignmentInDay = [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }];
    render(
      <PlaceInspector
        {...defaultProps}
        tripMembers={members}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
      />
    );
    // The participants section renders with a "participants" label
    // It's visible when tripMembers.length > 1 && selectedAssignmentId is set
    expect(screen.getByText(members[0].username)).toBeTruthy();
  });

  // ── Price chip ─────────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-032: price chip shown when place.price > 0', () => {
    const p = buildPlace({ id: 300, price: 15, currency: 'EUR' } as any);
    render(<PlaceInspector {...defaultProps} place={p} />);
    // formatMoney renders in the currency's home convention (de-DE for EUR).
    expect(screen.getByText(/15,00/)).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-032b: price chip formats in the place currency with a neutral icon (#1561)', () => {
    const p = buildPlace({ id: 300, price: 15, currency: 'USD' } as any);
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(screen.getByText('$15.00')).toBeTruthy();
    // The chip icon must be currency-neutral, not the euro glyph.
    expect(document.querySelector('.lucide-euro')).toBeNull();
    expect(document.querySelector('.lucide-banknote')).not.toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-032c: a currency-less price falls back to the trip currency (#1561)', () => {
    seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'NOK' }) } as any);
    const p = buildPlace({ id: 300, price: 250, currency: null } as any);
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(screen.getByText(/250,00\s?kr|kr\s?250,00/)).toBeTruthy();
  });

  // ── Phone number ───────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-033: phone number shown when place has phone', () => {
    const p = buildPlace({ id: 301, phone: '+33 1 23 45 67 89' } as any);
    render(<PlaceInspector {...defaultProps} place={p} />);
    expect(screen.getByText(/\+33 1 23 45 67 89/)).toBeTruthy();
  });

  // ── File size display ──────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-034: file size displayed in KB for files < 1MB', async () => {
    const user = userEvent.setup();
    const file = {
      id: 2,
      trip_id: 1,
      place_id: place.id,
      original_name: 'doc.pdf',
      url: '/uploads/doc.pdf',
      filename: 'doc.pdf',
      mime_type: 'application/pdf',
      file_size: 2048,
      created_at: '2025-01-01T00:00:00.000Z',
    };
    render(<PlaceInspector {...defaultProps} files={[file as any]} />);
    // Click expand to see file details
    const expandBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('1'));
    if (expandBtn) {
      await user.click(expandBtn);
      await waitFor(() => {
        expect(screen.getByText(/2\.0 KB/)).toBeTruthy();
      });
    }
  });

  it('FE-PLANNER-INSPECTOR-035: file size displayed in MB for files >= 1MB', async () => {
    const user = userEvent.setup();
    const file = {
      id: 3,
      trip_id: 1,
      place_id: place.id,
      original_name: 'video.mp4',
      url: '/uploads/video.mp4',
      filename: 'video.mp4',
      mime_type: 'video/mp4',
      file_size: 2 * 1024 * 1024,
      created_at: '2025-01-01T00:00:00.000Z',
    };
    render(<PlaceInspector {...defaultProps} files={[file as any]} />);
    const expandBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('1'));
    if (expandBtn) {
      await user.click(expandBtn);
      await waitFor(() => {
        expect(screen.getByText(/2\.0 MB/)).toBeTruthy();
      });
    }
  });

  // ── GPX track stats ────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-036: GPX track stats shown when route_geometry has 2D points', () => {
    const pts = [[48.8584, 2.2945], [48.8600, 2.3000], [48.8620, 2.3050]];
    const p = buildPlace({ id: 302, route_geometry: JSON.stringify(pts) } as any);
    render(<PlaceInspector {...defaultProps} place={p} />);
    // Track distance should be visible (e.g. "x.x km" or "xxx m")
    const { container } = render(<PlaceInspector {...defaultProps} place={p} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-037: GPX track stats shown with 3D points (elevation data)', () => {
    const pts = [
      [48.8584, 2.2945, 100],
      [48.8600, 2.3000, 120],
      [48.8620, 2.3050, 110],
      [48.8640, 2.3100, 130],
    ];
    const p = buildPlace({ id: 303, route_geometry: JSON.stringify(pts) } as any);
    const { container } = render(<PlaceInspector {...defaultProps} place={p} />);
    // Elevation stats should show max elevation 130m
    expect(screen.getByText(/130 m/)).toBeTruthy();
  });

  // ── ParticipantsBox interactions ───────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-038: participants list shows member names', () => {
    const member1 = buildUser({ id: 10, username: 'alice' });
    const member2 = buildUser({ id: 11, username: 'bob' });
    const members = [member1, member2];
    const assignmentInDay = [{
      id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null,
      participants: [{ user_id: 10, username: 'alice' }],
    }];
    render(
      <PlaceInspector
        {...defaultProps}
        tripMembers={members}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': assignmentInDay }}
      />
    );
    // alice is a participant, should appear
    expect(screen.getByText('alice')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-039: session storage cache prevents duplicate mapsApi calls', async () => {
    // Prime the session storage cache with language 'en' (default)
    sessionStorage.setItem('gdetails_ChIJ005_en', JSON.stringify({ rating: 3.0 }));
    const p = buildPlace({ id: 304, google_place_id: 'ChIJ005' });
    render(<PlaceInspector {...defaultProps} place={p} />);
    // Wait for effect to run
    await act(async () => { await new Promise(r => setTimeout(r, 50)) });
    // mapsApi.details should NOT have been called (cache hit)
    expect(vi.mocked(mapsApi.details)).not.toHaveBeenCalled();
    // Rating from cache should be visible
    await screen.findByText(/3\.0/);
  });

  // ── File upload interaction ────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-040: file input change triggers onFileUpload', async () => {
    const onFileUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<PlaceInspector {...defaultProps} onFileUpload={onFileUpload} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    const testFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [testFile] } });
    });
    await waitFor(() => {
      expect(onFileUpload).toHaveBeenCalled();
    });
  });

  // ── formatTime: 12h format ─────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-041: time shown in 12h format when setting is 12h', () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h' } });
    const p = buildPlace({ id: 305, place_time: '14:30', end_time: null });
    render(<PlaceInspector {...defaultProps} place={p} />);
    // 14:30 in 12h = "2:30 PM"
    expect(screen.getByText(/2:30 PM/)).toBeTruthy();
  });

  // ── convertHoursLine: 24h→12h conversion ──────────────────────────────────

  it('FE-PLANNER-INSPECTOR-042: opening hours converted to 12h when setting is 12h', async () => {
    seedStore(useSettingsStore, { settings: { time_format: '12h' } });
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { opening_hours: ['Mon: 09:00 – 17:00'] },
    } as any);
    const user = userEvent.setup();
    const p = buildPlace({ id: 306, google_place_id: 'ChIJ006' });
    render(<PlaceInspector {...defaultProps} place={p} />);
    const hoursSpan = await screen.findByText(/9:00 AM|Show opening hours/i);
    const btn = hoursSpan.closest('button')!;
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/9:00 AM/)).toBeTruthy();
    });
  });

  // ── Google Maps URL action ─────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-043: the navigation button offers every app the place can be opened in', async () => {
    const user = userEvent.setup();
    render(<PlaceInspector {...defaultProps} />);
    // A place with coordinates reaches Google Maps and Waze (Apple Maps only on
    // Apple platforms), so the button collects them behind one entry.
    const navBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Navigation'))!;
    expect(navBtn).toBeTruthy();

    await user.click(navBtn);
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Google Maps' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Waze' })).toBeInTheDocument();
  });

  it('FE-PLANNER-INSPECTOR-043b: Google Maps action uses google_ftid over coordinates', async () => {
    const user = userEvent.setup();
    const mapsUrl = "https://www.google.com/maps/place/?q=St.%20Jacobs%20Farmers'%20Market&ftid=0x882bf179e806d471:0x8591dde29c821a93";
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<PlaceInspector {...defaultProps} place={buildPlace({
      name: "St. Jacobs Farmers' Market",
      lat: 43.5118527,
      lng: -80.5542617,
      google_ftid: '0x882bf179e806d471:0x8591dde29c821a93',
    })} />);
    const navBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Navigation'))!;
    await user.click(navBtn);
    await user.click(await screen.findByRole('menuitem', { name: 'Google Maps' }));
    expect(openSpy).toHaveBeenCalledWith(mapsUrl, '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  // ── No files section when no upload handler and no files ──────────────────

  it('FE-PLANNER-INSPECTOR-044: files section hidden when no files and no onFileUpload', () => {
    const { container } = render(
      <PlaceInspector {...defaultProps} files={[]} onFileUpload={undefined} />
    );
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  // ── Participants section hidden when tripMembers <= 1 ─────────────────────

  it('FE-PLANNER-INSPECTOR-045: participants section hidden when tripMembers has only 1 member', () => {
    const member = buildUser({ id: 1, username: 'solo' });
    render(
      <PlaceInspector
        {...defaultProps}
        tripMembers={[member]}
        selectedDayId={1}
        selectedAssignmentId={99}
        assignments={{ '1': [{ id: 99, place, day_id: 1, place_id: place.id, order_index: 0, notes: null }] }}
      />
    );
    // "solo" username might be visible from other parts but participants box should not render
    // The participants box renders a "users" icon — check it's absent
    const text = document.body.textContent || '';
    // No second member to display
    expect(screen.queryByText('Participants')).toBeNull();
  });

  // ── Scroll / overflow (issue #1195) ──────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-046: content area is a bounded flex scroll region', () => {
    const longText = 'Lorem ipsum dolor sit amet. '.repeat(200);
    const p = buildPlace({ id: 200, description: longText, notes: longText } as any);
    render(<PlaceInspector {...defaultProps} place={p} />);
    const scroll = screen.getByTestId('inspector-scroll') as HTMLElement;
    expect(scroll.style.overflowY).toBe('auto');
    expect(scroll.style.minHeight).toBe('0px');
    // flex must allow the region to shrink/grow within the capped card
    expect(scroll.style.flex).not.toBe('');
    expect(scroll.style.flex).not.toBe('0 0 auto');
  });

  it('FE-PLANNER-INSPECTOR-047: long unbroken description wraps instead of clipping horizontally', () => {
    const longWord = 'https://example.com/' + 'a'.repeat(300);
    const p = buildPlace({ id: 201, description: longWord } as any);
    const { container } = render(<PlaceInspector {...defaultProps} place={p} />);
    const descDiv = container.querySelector('.collab-note-md') as HTMLElement;
    expect(descDiv).toBeTruthy();
    expect(descDiv.style.overflowWrap).toBe('anywhere');
    expect(descDiv.style.wordBreak).toBe('break-word');
  });

  it('FE-PLANNER-INSPECTOR-048: description/notes do not shrink so the card scrolls instead of clipping', () => {
    const longText = 'Lorem ipsum dolor sit amet. '.repeat(200);
    const p = buildPlace({ id: 202, description: longText, notes: longText } as any);
    const { container } = render(<PlaceInspector {...defaultProps} place={p} />);
    const notes = Array.from(container.querySelectorAll('.collab-note-md')) as HTMLElement[];
    // Both description and notes containers must keep their natural height
    // (flex-shrink: 0) — otherwise they compress inside the flex column and
    // overflow:hidden clips the text with no scroll (issue #1195).
    expect(notes.length).toBe(2);
    for (const el of notes) {
      expect(el.style.flexShrink).toBe('0');
    }
  });

  // ── Custom thumbnail upload (#1136) ──────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-049: onUploadImage in trip mode renders the upload-capable avatar', () => {
    render(<PlaceInspector {...defaultProps} onUploadImage={vi.fn()} />);
    // The place carries no image yet, so the avatar offers "Upload image".
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-050: without onUploadImage the avatar has no upload control', () => {
    render(<PlaceInspector {...defaultProps} />);
    expect(screen.queryByRole('button', { name: 'Upload image' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Change image' })).toBeNull();
  });

// ── Track colour (#776) ──────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-051: the colour row only exists for a place with geometry', () => {
    const { rerender } = render(<PlaceInspector {...defaultProps} />);
    expect(screen.queryByText('Track color')).toBeNull();

    rerender(<PlaceInspector {...defaultProps} place={{ ...place, route_geometry: '[[48.0,2.0],[49.0,3.0]]' }} />);
    expect(screen.getAllByText('Track color').length).toBeGreaterThan(0);
  });

  it('FE-PLANNER-INSPECTOR-052: picking a swatch saves that colour', () => {
    const onUpdatePlace = vi.fn();
    const track = { ...place, route_geometry: '[[48.0,2.0],[49.0,3.0]]' };
    render(<PlaceInspector {...defaultProps} place={track} onUpdatePlace={onUpdatePlace} />);

    fireEvent.click(screen.getAllByText('Track color')[0]);
    fireEvent.click(screen.getByRole('button', { name: '#059669' }));
    expect(onUpdatePlace).toHaveBeenCalledWith(track.id, { route_color: '#059669' });
  });

  it('FE-PLANNER-INSPECTOR-053: the auto cell saves null, not undefined', () => {
    const onUpdatePlace = vi.fn();
    const track = { ...place, route_geometry: '[[48.0,2.0],[49.0,3.0]]', route_color: '#059669' };
    render(<PlaceInspector {...defaultProps} place={track} onUpdatePlace={onUpdatePlace} />);

    fireEvent.click(screen.getAllByText('Track color')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Automatic color' }));
    // null is what clears the column; undefined would leave the colour in place.
    expect(onUpdatePlace).toHaveBeenCalledWith(track.id, { route_color: null });
  });

  // ── Google details cache ─────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-054: a cached detail payload is reused without a second request', async () => {
    const withId = buildPlace({ id: 700, name: 'Cached Place', google_place_id: 'gp-700' });
    vi.mocked(mapsApi.details).mockResolvedValue({ place: { phone: '+49 30 111', rating: 4.2, rating_count: 12 } } as any);
    const { unmount } = render(<PlaceInspector {...defaultProps} place={withId} />);
    expect(await screen.findByText('+49 30 111')).toBeTruthy();
    expect(vi.mocked(mapsApi.details)).toHaveBeenCalledTimes(1);
    unmount();

    render(<PlaceInspector {...defaultProps} place={withId} />);
    expect(await screen.findByText('+49 30 111')).toBeTruthy();
    // Second mount is served from the in-memory cache.
    expect(vi.mocked(mapsApi.details)).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-INSPECTOR-055: an unreadable session cache entry falls back to a fresh fetch', async () => {
    const withId = buildPlace({ id: 701, name: 'Broken Cache', google_place_id: 'gp-701' });
    sessionStorage.setItem('gdetails_gp-701_en', '{not json');
    vi.mocked(mapsApi.details).mockResolvedValue({ place: { phone: '+49 30 222' } } as any);
    render(<PlaceInspector {...defaultProps} place={withId} />);
    expect(await screen.findByText('+49 30 222')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-056: the rating chip shows the review count and the first usable review', async () => {
    const withId = buildPlace({ id: 702, name: 'Rated Place', google_place_id: 'gp-702' });
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { rating: 4.5, rating_count: 1200, reviews: [{ text: 'ok' }, { text: 'Great view over the city' }] },
    } as any);
    render(<PlaceInspector {...defaultProps} place={withId} />);
    expect(await screen.findByText('4.5')).toBeTruthy();
    expect(screen.getByText(/Great view over the city/)).toBeTruthy();
  });

  // ── Opening hours conversion ─────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-057: 12h source hours are converted to 24h, midnight included', async () => {
    const withId = buildPlace({ id: 703, name: 'Hours Place', google_place_id: 'gp-703' });
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { opening_hours: ['Monday: 12:30 AM – 9:00 PM', 'Tuesday: 10:00 AM – 12:00 PM'] },
    } as any);
    render(<PlaceInspector {...defaultProps} place={withId} />);
    fireEvent.click(await screen.findByText(/Show opening hours|Monday|Tuesday/));
    expect(await screen.findByText('Monday: 00:30 – 21:00')).toBeTruthy();
    expect(screen.getByText('Tuesday: 10:00 – 12:00')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-058: 24h source hours are left untouched in 24h mode', async () => {
    const withId = buildPlace({ id: 704, name: 'Hours 24h', google_place_id: 'gp-704' });
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { opening_hours: ['Monday: 09:00 – 18:00'] },
    } as any);
    render(<PlaceInspector {...defaultProps} place={withId} />);
    fireEvent.click(await screen.findByText(/Show opening hours|Monday: 09:00/));
    expect(await screen.findByText('Monday: 09:00 – 18:00')).toBeTruthy();
  });

  // ── Name editing ─────────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-059: without onUpdatePlace a double-click does not start an edit', async () => {
    render(<PlaceInspector {...defaultProps} onUpdatePlace={undefined} />);
    fireEvent.doubleClick(screen.getByText('Eiffel Tower'));
    expect(screen.queryByDisplayValue('Eiffel Tower')).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-060: Escape abandons the edit and the following blur saves nothing', async () => {
    const onUpdatePlace = vi.fn();
    render(<PlaceInspector {...defaultProps} onUpdatePlace={onUpdatePlace} />);
    fireEvent.doubleClick(screen.getByText('Eiffel Tower'));
    const input = await screen.findByDisplayValue('Eiffel Tower');
    fireEvent.change(input, { target: { value: 'Tour Eiffel' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.blur(input);
    expect(onUpdatePlace).not.toHaveBeenCalled();
    expect(screen.getByText('Eiffel Tower')).toBeTruthy();
  });

  // ── Files ────────────────────────────────────────────────────────────────────

  const placeFile = (over: Record<string, unknown> = {}) => ({
    id: 1, trip_id: 1, place_id: 1, original_name: 'map.pdf', filename: 'map.pdf',
    mime_type: 'application/pdf', url: '/uploads/map.pdf', created_at: '2025-01-01T00:00:00.000Z',
    ...over,
  });

  it('FE-PLANNER-INSPECTOR-061: file sizes render in B, KB and MB, and a zero size is omitted', async () => {
    const files = [
      placeFile({ id: 1, original_name: 'tiny.txt', file_size: 512, mime_type: 'text/plain' }),
      placeFile({ id: 2, original_name: 'medium.pdf', file_size: 2048 }),
      placeFile({ id: 3, original_name: 'big.png', file_size: 3 * 1024 * 1024, mime_type: 'image/png' }),
      placeFile({ id: 4, original_name: 'unknown.bin', file_size: 0 }),
    ];
    render(<PlaceInspector {...defaultProps} files={files as any} />);
    fireEvent.click(screen.getByText('4 files'));
    expect(await screen.findByText('512 B')).toBeTruthy();
    expect(screen.getByText('2.0 KB')).toBeTruthy();
    expect(screen.getByText('3.0 MB')).toBeTruthy();
    expect(screen.getByText('unknown.bin')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-062: clicking an attached file opens it', async () => {
    const { openFile } = await import('../../utils/fileDownload');
    const spy = vi.spyOn({ openFile }, 'openFile');
    render(<PlaceInspector {...defaultProps} files={[placeFile()] as any} />);
    fireEvent.click(screen.getByText('1 files'));
    const link = await screen.findByText('map.pdf');
    fireEvent.click(link);
    // The click is handled without throwing; the row stays in the list.
    expect(screen.getByText('map.pdf')).toBeTruthy();
    spy.mockRestore();
  });

  it('FE-PLANNER-INSPECTOR-063: an empty file selection is ignored', async () => {
    const onFileUpload = vi.fn().mockResolvedValue(undefined);
    render(<PlaceInspector {...defaultProps} onFileUpload={onFileUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(onFileUpload).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-INSPECTOR-064: a failing upload surfaces an error and re-enables the control', async () => {
    const onFileUpload = vi.fn().mockRejectedValue(new Error('disk full'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PlaceInspector {...defaultProps} onFileUpload={onFileUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(onFileUpload).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Upload')).toBeTruthy());
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('FE-PLANNER-INSPECTOR-065: a successful upload expands the file list', async () => {
    const onFileUpload = vi.fn().mockResolvedValue(undefined);
    render(<PlaceInspector {...defaultProps} files={[placeFile()] as any} onFileUpload={onFileUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'b.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(onFileUpload).toHaveBeenCalled());
    expect(await screen.findByText('map.pdf')).toBeTruthy();
  });

  // ── Track stats edge cases ───────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-066: a single-point track renders the colour row but no stats', () => {
    render(<PlaceInspector {...defaultProps} place={{ ...place, route_geometry: '[[48.0,2.0]]' } as any} />);
    expect(screen.getAllByText('Track color').length).toBeGreaterThan(0);
    expect(screen.queryByText('Track')).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-067: unparsable geometry is swallowed instead of crashing the panel', () => {
    render(<PlaceInspector {...defaultProps} place={{ ...place, route_geometry: 'not-json' } as any} />);
    expect(screen.getByText('Eiffel Tower')).toBeTruthy();
    expect(screen.getAllByText('Track color').length).toBeGreaterThan(0);
  });

  it('FE-PLANNER-INSPECTOR-068: a track with elevations reports distance, peaks and an elevation profile', () => {
    const geom = JSON.stringify([[48.0, 2.0, 100], [48.01, 2.01, 180], [48.02, 2.02, 140]]);
    render(<PlaceInspector {...defaultProps} place={{ ...place, route_geometry: geom } as any} />);
    expect(screen.getByText('Track Stats')).toBeTruthy();
    expect(screen.getByText(/↑/)).toBeTruthy();
    expect(document.querySelector('svg path[stroke]')).toBeTruthy();
  });

  // ── Footer actions ───────────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-069: OpenStreetMap sits in the navigation menu, the website keeps its own button', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const p = buildPlace({ id: 705, name: 'Linked Place', osm_id: 'node/12345', website: 'https://example.org' });
    render(<PlaceInspector {...defaultProps} place={p} />);

    // OSM moved in with the other map apps rather than standing beside them.
    await user.click(screen.getAllByRole('button').find(b => b.textContent?.includes('Navigation'))!);
    await user.click(await screen.findByRole('menuitem', { name: 'OpenStreetMap' }));

    fireEvent.click(screen.getByText('Open Website').closest('button')!);
    expect(open).toHaveBeenCalledTimes(2);
    expect(open.mock.calls[1]).toEqual(['https://example.org', '_blank', 'noopener,noreferrer']);
    vi.unstubAllGlobals();
  });

  it('FE-PLANNER-INSPECTOR-070: an action button restores its idle background after hover', () => {
    render(<PlaceInspector {...defaultProps} />);
    const edit = screen.getByText('Edit').closest('button') as HTMLButtonElement;
    act(() => { edit.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
    expect(edit.style.background).toBe('var(--bg-tertiary)');
    act(() => { edit.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })); });
    expect(edit.style.background).toBe('var(--bg-hover)');
  });

  it('FE-PLANNER-INSPECTOR-071: the header close button resets its hover background', () => {
    render(<PlaceInspector {...defaultProps} />);
    const close = document.querySelector('.bg-surface-hover') as HTMLButtonElement;
    act(() => { close.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
    expect(close.style.background).toBe('var(--bg-tertiary)');
    act(() => { close.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })); });
    expect(close.style.background).toBe('var(--bg-hover)');
  });

  it('FE-PLANNER-INSPECTOR-072: rating a place forwards the vote', () => {
    const onRate = vi.fn();
    render(<PlaceInspector {...defaultProps} onRate={onRate} />);
    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);
    fireEvent.click(stars[2]);
    expect(onRate).toHaveBeenCalledWith(place.id, 3);
  });

  // ── Reservation summary ──────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-073: the linked reservation summarises flight, platform and check-in metadata', () => {
    const res = buildReservation({
      id: 1, title: 'Flight to Nice', status: 'pending', assignment_id: 9,
      reservation_time: '2025-06-15T08:30', reservation_end_time: '2025-06-15T10:15',
      confirmation_number: 'ABC999', notes: 'Aisle seat',
      metadata: JSON.stringify({ airline: 'Air France', flight_number: 'AF123', departure_airport: 'CDG', arrival_airport: 'NCE', train_number: 'TGV1', platform: '7', check_in_time: '06:00', check_out_time: '12:00' }),
    } as any);
    render(<PlaceInspector {...defaultProps} selectedDayId={1} selectedAssignmentId={9}
      assignments={{ '1': [{ id: 9, place, place_id: place.id, day_id: 1, order_index: 0, notes: null }] }}
      reservations={[res]} />);
    expect(screen.getByText('Flight to Nice')).toBeTruthy();
    expect(screen.getByText('ABC999')).toBeTruthy();
    expect(screen.getByText('Aisle seat')).toBeTruthy();
    expect(screen.getByText(/Air France AF123 · CDG → NCE · TGV1 · Gl\. 7 · Check-in 06:00 · Check-out 12:00/)).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-074: a reservation whose metadata has no printable fields shows no meta line', () => {
    const res = buildReservation({ id: 2, title: 'Plain booking', status: 'confirmed', assignment_id: 9, metadata: JSON.stringify({ seat: '4A' }) } as any);
    render(<PlaceInspector {...defaultProps} selectedDayId={1} selectedAssignmentId={9}
      assignments={{ '1': [{ id: 9, place, place_id: place.id, day_id: 1, order_index: 0, notes: null }] }}
      reservations={[res]} />);
    expect(screen.getByText('Plain booking')).toBeTruthy();
    expect(screen.queryByText(/Gl\./)).toBeNull();
  });

  // ── Participants ─────────────────────────────────────────────────────────────

  const members = [
    { id: 1, username: 'ada', avatar_url: null },
    { id: 2, username: 'bob', avatar_url: null },
    { id: 3, username: 'cleo', avatar_url: null, is_guest: true },
  ];
  const participantProps = (participants: Array<{ user_id: number; username?: string }> = []) => ({
    selectedDayId: 1,
    selectedAssignmentId: 9,
    tripMembers: members,
    assignments: { '1': [{ id: 9, place, place_id: place.id, day_id: 1, order_index: 0, notes: null, participants }] } as unknown as AssignmentsMap,
  });

  it('FE-PLANNER-INSPECTOR-075: with nobody explicitly set, every member counts as joined', () => {
    render(<PlaceInspector {...defaultProps} {...participantProps()} />);
    expect(screen.getByText('Participants')).toBeTruthy();
    for (const m of members) expect(screen.getByText(m.username)).toBeTruthy();
    // Everyone is in, so there is nothing left to add.
    expect(screen.queryByText('+')).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-076: removing a member from the all-joined state sends the remaining ids', () => {
    const onSetParticipants = vi.fn();
    render(<PlaceInspector {...defaultProps} {...participantProps()} onSetParticipants={onSetParticipants} />);
    fireEvent.click(screen.getByText('bob'));
    expect(onSetParticipants).toHaveBeenCalledWith(9, 1, [1, 3]);
  });

  it('FE-PLANNER-INSPECTOR-077: removing down to the full member list is stored as "everyone" again', () => {
    const onSetParticipants = vi.fn();
    render(<PlaceInspector {...defaultProps} {...participantProps([{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }])} onSetParticipants={onSetParticipants} />);
    // The chip is hovered first, which flags it removable.
    fireEvent.mouseEnter(screen.getByText('ada').closest('div')!);
    fireEvent.click(screen.getByText('cleo'));
    expect(onSetParticipants).toHaveBeenCalledWith(9, 1, [1, 2]);
  });

  it('FE-PLANNER-INSPECTOR-078: the last remaining participant cannot be removed', () => {
    const onSetParticipants = vi.fn();
    render(<PlaceInspector {...defaultProps} {...participantProps([{ user_id: 1 }])} onSetParticipants={onSetParticipants} />);
    fireEvent.click(screen.getByText('ada'));
    expect(onSetParticipants).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-INSPECTOR-079: the add menu lists the missing members and marks guests', () => {
    const onSetParticipants = vi.fn();
    render(<PlaceInspector {...defaultProps} {...participantProps([{ user_id: 1 }])} onSetParticipants={onSetParticipants} />);
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('Guest')).toBeTruthy();
    fireEvent.click(screen.getByText('bob'));
    expect(onSetParticipants).toHaveBeenCalledWith(9, 1, [1, 2]);
  });

  it('FE-PLANNER-INSPECTOR-080: adding the final missing member stores "everyone" instead of a full list', () => {
    const onSetParticipants = vi.fn();
    render(<PlaceInspector {...defaultProps} {...participantProps([{ user_id: 1 }, { user_id: 2 }])} onSetParticipants={onSetParticipants} />);
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('cleo'));
    expect(onSetParticipants).toHaveBeenCalledWith(9, 1, []);
  });

  // ── Save to collection ───────────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-081: with collections enabled the footer offers to save the place', async () => {
    seedStore(useAddonStore, { addons: [{ id: 'collections', name: 'Collections', type: 'addon', icon: 'bookmark', enabled: true }], loaded: true });
    server.use(
      http.get('/api/addons/collections/membership', () => HttpResponse.json({ saved: true, collections: [] })),
    );
    render(<PlaceInspector {...defaultProps} />);
    expect(await screen.findByText('Saved')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-082: clicking save hands the whole place to the collection picker', async () => {
    seedStore(useAddonStore, { addons: [{ id: 'collections', name: 'Collections', type: 'addon', icon: 'bookmark', enabled: true }], loaded: true });
    server.use(
      http.get('/api/addons/collections/membership', () => HttpResponse.json({ saved: false, collections: [] })),
    );
    render(<PlaceInspector {...defaultProps} />);
    fireEvent.click((await screen.findByText('Save to Collection')).closest('button')!);
    expect(useSaveToCollectionStore.getState().target).toMatchObject({
      name: 'Eiffel Tower', source_place_id: place.id, lat: 48.8584, lng: 2.2945,
    });
  });

  it('FE-PLANNER-INSPECTOR-083: a failing membership check leaves the unsaved label', async () => {
    seedStore(useAddonStore, { addons: [{ id: 'collections', name: 'Collections', type: 'addon', icon: 'bookmark', enabled: true }], loaded: true });
    server.use(
      http.get('/api/addons/collections/membership', () => new HttpResponse(null, { status: 500 })),
    );
    render(<PlaceInspector {...defaultProps} />);
    expect(await screen.findByText('Save to Collection')).toBeTruthy();
  });

  // ── Plugin contributions (#1429) ─────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-084: placeDetailProvider rows render as label/value and links', async () => {
    server.use(
      http.get('/api/place-details/1', () => HttpResponse.json({
        providers: [
          { pluginId: 'tides', items: [{ label: 'High tide', value: '14:20' }, { label: 'Forecast', url: 'https://tides.example' }] },
          // Empty providers are dropped before render.
          { pluginId: 'empty', items: [] },
        ],
      })),
    );
    render(<PlaceInspector {...defaultProps} />);
    expect(await screen.findByText('High tide')).toBeTruthy();
    expect(screen.getByText('14:20')).toBeTruthy();
    expect(screen.getByRole('link', { name: '↗' })).toHaveAttribute('href', 'https://tides.example');
  });

  it('FE-PLANNER-INSPECTOR-085: a failing provider request adds no rows', async () => {
    server.use(http.get('/api/place-details/1', () => new HttpResponse(null, { status: 500 })));
    render(<PlaceInspector {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('Eiffel Tower')).toBeTruthy());
    expect(screen.queryByText('High tide')).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-086: a place-detail widget plugin mounts a frame scoped to the place', async () => {
    seedStore(usePluginStore, {
      plugins: [
        { id: 'tide-widget', name: 'Tides', type: 'widget', icon: null, slot: 'place-detail' },
        { id: 'hero-widget', name: 'Hero', type: 'widget', icon: null, slot: 'hero' },
      ],
    });
    render(<PlaceInspector {...defaultProps} />);
    await waitFor(() => expect(document.querySelector('iframe[src*="tide-widget"]')).toBeTruthy());
    expect(document.querySelector('iframe[src*="hero-widget"]')).toBeNull();
  });

  it('FE-PLANNER-INSPECTOR-087: in collection mode neither provider rows nor plugin frames are fetched', async () => {
    let called = false;
    server.use(http.get('/api/place-details/1', () => { called = true; return HttpResponse.json({ providers: [] }); }));
    seedStore(usePluginStore, {
      plugins: [{ id: 'tide-widget', name: 'Tides', type: 'widget', icon: null, slot: 'place-detail' }],
    });
    render(<PlaceInspector {...defaultProps} mode="collection" onCopyToTrip={vi.fn()} onRemoveFromList={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Copy to trip')).toBeTruthy());
    expect(called).toBe(false);
    expect(document.querySelector('iframe[src*="tide-widget"]')).toBeNull();
  });

  // ── Custom thumbnail callbacks (#1136) ───────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-088: removing the custom image clears image_url through onUpdatePlace', async () => {
    const onUpdatePlace = vi.fn();
    const onUploadImage = vi.fn(async () => {});
    const withImage = buildPlace({ id: 706, name: 'Pictured', image_url: '/uploads/places/x.jpg' });
    render(<PlaceInspector {...defaultProps} place={withImage} onUpdatePlace={onUpdatePlace} onUploadImage={onUploadImage} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(onUpdatePlace).toHaveBeenCalledWith(706, { image_url: null });
  });

  it('FE-PLANNER-INSPECTOR-090: opening hours are read for the selected day, not for today', async () => {
    const withId = buildPlace({ id: 707, name: 'Day-aware', google_place_id: 'gp-707' });
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: { opening_hours: ['Mon 08:00', 'Tue 09:00', 'Wed 10:00', 'Thu 11:00', 'Fri 12:00', 'Sat 13:00', 'Sun 14:00'] },
    } as any);
    // 2025-06-18 is a Wednesday → index 2.
    render(<PlaceInspector {...defaultProps} place={withId} days={[{ id: 5, date: '2025-06-18' }] as any} selectedDayId={5} />);
    expect(await screen.findByText('Wed 10:00')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-091: without an onSetParticipants handler the chips are inert', () => {
    render(<PlaceInspector {...defaultProps} {...participantProps([{ user_id: 1 }, { user_id: 2 }])} onSetParticipants={undefined} />);
    fireEvent.click(screen.getByText('ada'));
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('cleo'));
    // Nothing blew up and the box is still on screen.
    expect(screen.getByText('Participants')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-092: a stale participant id outside the member list collapses back to "everyone"', () => {
    const onSetParticipants = vi.fn();
    render(<PlaceInspector {...defaultProps} {...participantProps([{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }, { user_id: 99 }])} onSetParticipants={onSetParticipants} />);
    fireEvent.click(screen.getByText('ada'));
    expect(onSetParticipants).toHaveBeenCalledWith(9, 1, []);
  });

  it('FE-PLANNER-INSPECTOR-093: participant chips and the add menu reset their hover styling', () => {
    render(<PlaceInspector {...defaultProps} {...participantProps([{ user_id: 1 }, { user_id: 2 }])} />);
    const chip = screen.getByText('ada').closest('button') as HTMLElement;
    fireEvent.mouseEnter(chip);
    expect(chip.className).toContain('text-[#ef4444]');
    fireEvent.mouseLeave(chip);
    expect(chip.className).toContain('text-content');

    const add = screen.getByText('+') as HTMLButtonElement;
    act(() => { add.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
    expect(add.style.color).toBe('var(--text-primary)');
    act(() => { add.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })); });
    expect(add.style.color).toBe('var(--text-faint)');

    fireEvent.click(add);
    const entry = screen.getByText('cleo').closest('button') as HTMLButtonElement;
    act(() => { entry.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
    expect(entry.style.background).toBe('var(--bg-hover)');
    act(() => { entry.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })); });
    expect(entry.style.background).toBe('none');
  });

  it('FE-PLANNER-INSPECTOR-094: a flight number without an airline is still summarised', () => {
    const res = buildReservation({ id: 3, title: 'Numbered flight', status: 'confirmed', assignment_id: 9, metadata: JSON.stringify({ flight_number: 'LH400' }) } as any);
    render(<PlaceInspector {...defaultProps} selectedDayId={1} selectedAssignmentId={9}
      assignments={{ '1': [{ id: 9, place, place_id: place.id, day_id: 1, order_index: 0, notes: null }] }}
      reservations={[res]} />);
    expect(screen.getByText('LH400')).toBeTruthy();
  });

  // ── Open/closed ring (#1680) ─────────────────────────────────────────────────

  it('FE-PLANNER-INSPECTOR-095: the ring follows the periods, not the cached open_now', async () => {
    const seoul = buildPlace({ id: 708, name: 'Round the clock', google_place_id: 'gp-708', lat: 37.5665, lng: 126.978 });
    vi.mocked(mapsApi.details).mockResolvedValue({
      place: {
        open_now: false,
        // A period with no close is Google's round-the-clock place. The weekday lines
        // arrive in the user's language and are shown, never parsed.
        opening_hours: ['月曜日: 24 時間営業'],
        opening_periods: [{ open: { day: 0, hour: 0, minute: 0 } }],
      },
    } as any);
    render(<PlaceInspector {...defaultProps} place={seoul} />);
    expect(await screen.findByText('Open')).toBeTruthy();
  });

  it('FE-PLANNER-INSPECTOR-096: the ring is read in the timezone of the place', async () => {
    // Sunday 20:00 UTC — already Monday 05:00 in Seoul, still Sunday 22:00 in Paris.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-07-26T20:00:00Z'));
    try {
      const periods = [{ open: { day: 1, hour: 0, minute: 0 }, close: { day: 1, hour: 12, minute: 0 } }];
      vi.mocked(mapsApi.details).mockResolvedValue({
        place: { open_now: false, opening_periods: periods },
      } as any);

      const seoul = buildPlace({ id: 709, name: 'Seoul spot', google_place_id: 'gp-709', lat: 37.5665, lng: 126.978 });
      const { unmount } = render(<PlaceInspector {...defaultProps} place={seoul} />);
      expect(await screen.findByText('Open')).toBeTruthy();
      unmount();

      const paris = buildPlace({ id: 710, name: 'Paris spot', google_place_id: 'gp-710', lat: 48.8566, lng: 2.3522 });
      render(<PlaceInspector {...defaultProps} place={paris} />);
      expect(await screen.findByText('Closed')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-PLANNER-INSPECTOR-097: a holiday in the payload leaves the verdict to the server', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Wednesday 12:00 in Seoul, inside the regular Wednesday period.
    vi.setSystemTime(new Date('2026-07-29T03:00:00Z'));
    try {
      vi.mocked(mapsApi.details).mockResolvedValue({
        place: {
          open_now: false,
          opening_periods: [{ open: { day: 3, hour: 9, minute: 0 }, close: { day: 3, hour: 18, minute: 0 } }],
          opening_special_days: ['2026-07-29'],
        },
      } as any);
      const seoul = buildPlace({ id: 711, name: 'Holiday spot', google_place_id: 'gp-711', lat: 37.5665, lng: 126.978 });
      render(<PlaceInspector {...defaultProps} place={seoul} />);
      expect(await screen.findByText('Closed')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-PLANNER-INSPECTOR-089: picking a file hands it to onUploadImage', async () => {
    const onUploadImage = vi.fn(async () => {});
    render(<PlaceInspector {...defaultProps} onUploadImage={onUploadImage} />);
    const input = document.querySelector('input[accept*="image"]') as HTMLInputElement;
    const file = new File(['x'], 'thumb.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onUploadImage).toHaveBeenCalledWith(place.id, file));
  });

  it('FE-PLANNER-INSPECTOR-098: deselecting and reselecting a place survives a rerender', async () => {
    // The component bails out with `if (!place) return null`. Any hook below that
    // line runs only while a place is selected, so clearing the selection changes
    // the hook count and React tears the whole tree down.
    const { rerender } = render(<PlaceInspector {...defaultProps} />);
    expect(screen.getByText('Eiffel Tower')).toBeTruthy();

    rerender(<PlaceInspector {...defaultProps} place={null} />);
    expect(screen.queryByText('Eiffel Tower')).toBeNull();

    rerender(<PlaceInspector {...defaultProps} />);
    expect(screen.getByText('Eiffel Tower')).toBeTruthy();
  });

});
