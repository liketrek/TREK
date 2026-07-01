/**
 * Vibrant two-stop cover gradients — the fallback backdrop for any entity that
 * has no photo yet (a trip, a saved place). Picked by a stable numeric id so a
 * given entity always keeps the same colour. Mirrors the dashboard trip-card
 * palette so collection cards feel of a piece with the dashboard.
 */
export const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
] as const

/** Deterministic gradient for a numeric id (handles negatives defensively). */
export function entityGradient(id: number): string {
  const i = ((id % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length
  return GRADIENTS[i]
}
