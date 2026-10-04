import { vi } from 'vitest'
import type { LegAlternatives } from '../../src/components/Roadtrip/useRouteAlternatives'

/**
 * A picker open on one leg, answered, idle and priced by OSRM unless `over` says otherwise.
 *
 * The anchor follows the leg it is given, the way a card whose stops are stored on its own
 * day files them. A case about a leg stored elsewhere says so itself.
 */
export function openLeg(over: Partial<LegAlternatives> = {}): LegAlternatives {
  return {
    dayId: 2,
    drive: { kind: 'leg', index: 0 },
    routes: [],
    loading: false,
    error: false,
    proving: null,
    anchor: { dayId: over.dayId ?? 2, afterIndex: over.drive?.kind === 'leg' ? over.drive.index : 0 },
    ends: { from: 1, to: 2 },
    engine: 'osrm',
    standIn: false,
    route: vi.fn(),
    notice: null,
    ...over,
  }
}
