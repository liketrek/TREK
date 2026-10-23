import { bookings } from './bookings.cases';
import { collabTrip } from './collab-trip.cases';
import { money } from './money.cases';
import { plan } from './plan.cases';
import { toursRoadtrip } from './tours-roadtrip.cases';
import type { CaseGroup } from './types';
import { user } from './user.cases';

/** Every group, imported statically, so the registry test sees each row without running a case. */
export const ALL_GROUPS: readonly CaseGroup[] = [plan, bookings, toursRoadtrip, money, collabTrip, user];
