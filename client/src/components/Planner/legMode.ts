export type LegPoint = {
  isPlace: boolean;
  leg_transport_mode?: string | null;
  incoming_leg_transport_mode?: string | null;
};

/**
 * Travel mode of the leg from `origin` to `dest`. The mode is owned by the leg's
 * place endpoint: the origin's outgoing override wins when the origin is a place;
 * otherwise the destination's incoming override applies (only meaningful when the
 * origin is not a place - a booking arrival or the morning hotel); otherwise the
 * day default. The incoming value is inert whenever the origin is a place.
 */
export function resolveLegMode(
  origin: LegPoint,
  dest: LegPoint | undefined,
  dayDefault: string,
): string {
  if (origin.isPlace) return origin.leg_transport_mode ?? dayDefault;
  if (dest?.isPlace) return dest.incoming_leg_transport_mode ?? dayDefault;
  return dayDefault;
}
