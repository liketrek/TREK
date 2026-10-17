/**
 * What the gateway asks before it lets a socket into a journey's book room.
 *
 * A port rather than JourneyDomainService itself: realtime is imported by
 * nearly every domain for the broadcast facade, so depending on journey from
 * here put realtime, journey and everything between them on one import cycle.
 * The journey domain binds the token (JourneyAccessModule), and the answer is
 * still the one the REST routes get.
 */
export const JOURNEY_ACCESS = Symbol('JOURNEY_ACCESS');

export interface JourneyAccess {
  /** Truthy when the user may open the journey. */
  canAccessJourney(journeyId: number, userId: number): Promise<unknown>;
}
