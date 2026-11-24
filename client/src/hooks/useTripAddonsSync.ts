import { useEffect } from 'react';

import { useAuthStore } from '../store/authStore';
import { watchTripAddons } from '../store/tripAddonsStore';

/**
 * Keeps the trip addons of every trip the app looks at live while someone is
 * signed in: the trip owner switching an addon reaches every member at once.
 * Mounted once, by App.
 */
export function useTripAddonsSync(): void {
  const userId = useAuthStore((s) => s.user?.id);
  useEffect(() => (userId ? watchTripAddons() : undefined), [userId]);
}
