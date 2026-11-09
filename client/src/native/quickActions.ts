import type { TranslationFn, Trip } from '../types';
import { hasNativeFeature } from './capabilities';
import { isNativeApp } from './platform';
import { openPushTarget } from './push';
import { reportNativeFailure } from './reportFailure';
import { type NativeQuickAction, TrekShell } from './trekShell';

/**
 * The quick actions a long press on the app icon shows, as in every iOS app:
 * "New trip", and the trip coming up (or running today) by its name. Set by
 * the UI, so they speak the app's language and follow the trips, and a tap
 * opens the path each carries, the way a tap on a notification does. Only
 * where the binary reports the feature `quickActions`.
 */

export function quickActionsActive(): boolean {
  return isNativeApp() && hasNativeFeature('quickActions');
}

/** The actions for the trip the dashboard leads with (`hero`), or "New trip" alone without one. */
export function quickActionsFor(hero: Trip | null, today: string, t: TranslationFn): NativeQuickAction[] {
  const items: NativeQuickAction[] = [
    { type: 'newTrip', title: t('dashboard.newTrip'), icon: 'add', path: '/dashboard?create=1' },
  ];
  if (hero) {
    const running = !!hero.start_date && hero.start_date <= today && (hero.end_date ?? hero.start_date) >= today;
    items.push({
      type: 'trip',
      title: hero.title,
      subtitle: running ? t('native.widget.today') : t('dashboard.nextTrip'),
      icon: 'trip',
      path: `/trips/${hero.id}`,
    });
  }
  return items;
}

export async function publishQuickActions(items: NativeQuickAction[]): Promise<void> {
  if (!quickActionsActive()) return;
  await TrekShell.setQuickActions({ items }).catch(reportNativeFailure);
}

/** Opens the action the app was launched with, and every one chosen while it runs. */
export async function startQuickActions(): Promise<void> {
  if (!quickActionsActive()) return;
  void TrekShell.addListener('quickAction', ({ path }) => openPushTarget(path));
  try {
    const { path } = await TrekShell.takeQuickAction();
    if (path) openPushTarget(path);
  } catch (err) {
    reportNativeFailure(err);
  }
}
