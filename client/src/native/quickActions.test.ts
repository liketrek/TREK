import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Trip } from '../types';
import { hasNativeFeature } from './capabilities';
import { isNativeApp } from './platform';
import { openPushTarget } from './push';
import { publishQuickActions, quickActionsFor, startQuickActions } from './quickActions';
import { TrekShell } from './trekShell';

vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn() }));
vi.mock('./platform', () => ({ isNativeApp: vi.fn() }));
vi.mock('./push', () => ({ openPushTarget: vi.fn() }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: { setQuickActions: vi.fn(async () => {}), takeQuickAction: vi.fn(), addListener: vi.fn() },
}));

const t = ((key: string) =>
  ({ 'dashboard.newTrip': 'New Trip', 'dashboard.nextTrip': 'Next trip', 'native.widget.today': 'Today' })[key] ??
  key) as never;
const trip = (start: string, end: string) =>
  ({ id: 7, title: 'Lisbon', start_date: start, end_date: end }) as unknown as Trip;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isNativeApp).mockReturnValue(true);
  vi.mocked(hasNativeFeature).mockReturnValue(true);
});

describe('quickActionsFor', () => {
  it('offers "New trip" alone without a trip', () => {
    expect(quickActionsFor(null, '2026-11-09', t)).toEqual([
      { type: 'newTrip', title: 'New Trip', icon: 'add', path: '/dashboard?create=1' },
    ]);
  });

  it('adds the trip coming up by its name', () => {
    expect(quickActionsFor(trip('2026-12-01', '2026-12-05'), '2026-11-09', t)[1]).toEqual({
      type: 'trip',
      title: 'Lisbon',
      subtitle: 'Next trip',
      icon: 'trip',
      path: '/trips/7',
    });
  });

  it('calls a trip that runs today "Today"', () => {
    expect(quickActionsFor(trip('2026-11-08', '2026-11-10'), '2026-11-09', t)[1]?.subtitle).toBe('Today');
  });
});

describe('the binary', () => {
  it('gets the actions only where it has the feature', async () => {
    await publishQuickActions([]);
    expect(TrekShell.setQuickActions).toHaveBeenCalledWith({ items: [] });
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    await publishQuickActions([]);
    expect(TrekShell.setQuickActions).toHaveBeenCalledTimes(1);
  });

  it('opens the action the app was launched with, and listens for the next ones', async () => {
    vi.mocked(TrekShell.takeQuickAction).mockResolvedValue({ path: '/trips/7' });
    await startQuickActions();
    expect(openPushTarget).toHaveBeenCalledWith('/trips/7');
    expect(TrekShell.addListener).toHaveBeenCalledWith('quickAction', expect.any(Function));
  });
});
