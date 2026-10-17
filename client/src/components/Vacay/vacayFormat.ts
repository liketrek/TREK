// Used/remaining can be fractional once half days (#552) are in play; entry
// fractions are exact multiples of 0.5, so one decimal is enough and never drifts.
export const fmtDays = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
