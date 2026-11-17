import type { RoadtripPreferences } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _pinSizeClass, type SizeClass } from '../../../../src/hooks/sizeClass';
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell';
import MRtInfoSheet from '../../../../src/mobile/screens/trip/roadtrip/MRtInfoSheet';
import { useAuthStore } from '../../../../src/store/authStore';
import { useRoadtripPreferencesStore } from '../../../../src/store/roadtripPreferencesStore';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip';
import { fireEvent, render, screen } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';

// FE-MOB-RTEDIT-001 to FE-MOB-RTEDIT-012
//
// The driving figures as a form on an iPad or an unfolded Duo, inside the real
// MRtInfoSheet and TranslationProvider. The phone keeps the read-out
// (MRtInfoSheet.test.tsx); these pin the large screen's form.

const USER_ID = 7;
const TRIP_ID = 4;

const TYPED: RoadtripPreferences = {
  roadtrip_vehicle: 'combustion',
  roadtrip_range_km: 600,
  roadtrip_fill_percent: 80,
  roadtrip_leg_minutes: 240,
  roadtrip_day_minutes: 480,
  roadtrip_day_start: '08:00',
  roadtrip_day_end: '19:00',
  roadtrip_avoid: 'toll',
};

function renderSheet(
  preferences: RoadtripPreferences = TYPED,
  size: SizeClass = 'wide',
  plannerOverrides: Record<string, unknown> = {}
) {
  _pinSizeClass(size);
  useRoadtripPreferencesStore.setState({ byTrip: { [`${USER_ID}:${TRIP_ID}`]: preferences } });
  const saveRoadtripLimit = vi.fn(async () => {});
  const planner = buildPlanner({
    tripId: TRIP_ID,
    saveRoadtripLimit,
    ...plannerOverrides,
  } as unknown as Partial<TripPlanner>);
  const shell = buildShell({ sheet: { id: 'rtinfo' } } as unknown as Partial<MTripShellApi>);
  render(<MRtInfoSheet planner={planner} shell={shell} />);
  return { saveRoadtripLimit };
}

/** Types a figure into a field and leaves it, which is when the form saves. */
function typeInto(testId: string, value: string): void {
  const field = screen.getByTestId(testId);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

describe('MRtLimitsEditor', () => {
  beforeEach(() => {
    resetAllStores();
    useRoadtripPreferencesStore.setState({ byTrip: {} });
    seedStore(useAuthStore, { user: { id: USER_ID } as never });
  });

  afterEach(() => {
    _pinSizeClass(null);
  });

  it('FE-MOB-RTEDIT-001: the phone keeps the read-out and its desktop footnote', () => {
    renderSheet(TYPED, 'compact');
    expect(screen.queryByTestId('rt-limits-editor')).not.toBeInTheDocument();
    expect(screen.getByText(/desktop/i)).toBeInTheDocument();
  });

  it('FE-MOB-RTEDIT-002: an iPad gets the form instead, without the footnote', () => {
    renderSheet();
    expect(screen.getByTestId('rt-limits-editor')).toBeInTheDocument();
    expect(screen.queryByText(/desktop/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('rt-edit-leg')).toHaveValue('240');
    expect(screen.getByTestId('rt-edit-day')).toHaveValue('480');
    expect(screen.getByTestId('rt-edit-range')).toHaveValue('600');
    expect(screen.getByTestId('rt-edit-fill')).toHaveValue('80');
  });

  it('FE-MOB-RTEDIT-003: a driving limit is saved when the field is left, not per keystroke', () => {
    const { saveRoadtripLimit } = renderSheet();
    const field = screen.getByTestId('rt-edit-leg');
    fireEvent.change(field, { target: { value: '3' } });
    fireEvent.change(field, { target: { value: '300' } });
    expect(saveRoadtripLimit).not.toHaveBeenCalled();
    fireEvent.blur(field);
    expect(saveRoadtripLimit).toHaveBeenCalledTimes(1);
    expect(saveRoadtripLimit).toHaveBeenCalledWith('roadtrip_leg_minutes', 300);
  });

  it('FE-MOB-RTEDIT-004: an emptied field switches the limit off, an unchanged one saves nothing', () => {
    const { saveRoadtripLimit } = renderSheet();
    typeInto('rt-edit-day', '480');
    expect(saveRoadtripLimit).not.toHaveBeenCalled();
    typeInto('rt-edit-day', '');
    expect(saveRoadtripLimit).toHaveBeenCalledWith('roadtrip_day_minutes', 0);
  });

  it('FE-MOB-RTEDIT-005: the fill is capped at a full tank', () => {
    const { saveRoadtripLimit } = renderSheet();
    typeInto('rt-edit-fill', '140');
    expect(saveRoadtripLimit).toHaveBeenCalledWith('roadtrip_fill_percent', 100);
  });

  it('FE-MOB-RTEDIT-006: an imperial traveller types miles and kilometres are stored', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, distance_unit: 'imperial' } });
    const { saveRoadtripLimit } = renderSheet();
    expect(screen.getByTestId('rt-edit-range')).toHaveValue('373');
    typeInto('rt-edit-range', '310');
    expect(saveRoadtripLimit).toHaveBeenCalledWith('roadtrip_range_km', 499);
  });

  it('FE-MOB-RTEDIT-007: a range worked out from the battery is read-only here', () => {
    renderSheet({
      roadtrip_vehicle: 'electric',
      roadtrip_battery_kwh: 77,
      roadtrip_kwh_per_100: 18,
      roadtrip_battery_degradation: 8,
    });
    expect(screen.getByTestId('rt-edit-range')).toBeDisabled();
    expect(screen.getByTestId('rt-edit-range')).toHaveValue('394');
  });

  it('FE-MOB-RTEDIT-008: the vehicle is chosen in the form, none stored as empty', () => {
    const { saveRoadtripLimit } = renderSheet();
    fireEvent.click(screen.getByRole('tab', { name: 'Electric' }));
    expect(saveRoadtripLimit).toHaveBeenCalledWith('roadtrip_vehicle', 'electric');
    fireEvent.click(screen.getByRole('tab', { name: 'Either' }));
    expect(saveRoadtripLimit).toHaveBeenCalledWith('roadtrip_vehicle', '');
  });

  it('FE-MOB-RTEDIT-009: the avoidance is one stored list that each switch adds to or takes from', () => {
    const { saveRoadtripLimit } = renderSheet();
    fireEvent.click(screen.getByRole('switch', { name: 'Ferries' }));
    expect(saveRoadtripLimit).toHaveBeenLastCalledWith('roadtrip_avoid', 'toll,ferry');
    fireEvent.click(screen.getByRole('switch', { name: 'Toll roads' }));
    expect(saveRoadtripLimit).toHaveBeenLastCalledWith('roadtrip_avoid', '');
  });

  it('FE-MOB-RTEDIT-010: where the day ends is a choice between the route and a stop', () => {
    const { saveRoadtripLimit } = renderSheet();
    fireEvent.click(screen.getByRole('tab', { name: 'At the last place' }));
    expect(saveRoadtripLimit).toHaveBeenCalledWith('roadtrip_day_end_mode', 'stop');
  });

  it('FE-MOB-RTEDIT-011: a reader without a save sees the figures, every field disabled', () => {
    renderSheet(TYPED, 'split', { saveRoadtripLimit: undefined });
    for (const id of ['rt-edit-leg', 'rt-edit-day', 'rt-edit-range', 'rt-edit-fill']) {
      expect(screen.getByTestId(id)).toBeDisabled();
    }
    expect(screen.getByRole('switch', { name: 'Toll roads' })).toBeDisabled();
  });

  it('FE-MOB-RTEDIT-012: a decimal comma is read and rounded, junk switches the limit off', () => {
    const { saveRoadtripLimit } = renderSheet();
    typeInto('rt-edit-leg', '245,6');
    expect(saveRoadtripLimit).toHaveBeenLastCalledWith('roadtrip_leg_minutes', 246);
    typeInto('rt-edit-day', '.');
    expect(saveRoadtripLimit).toHaveBeenLastCalledWith('roadtrip_day_minutes', 0);
  });
});
