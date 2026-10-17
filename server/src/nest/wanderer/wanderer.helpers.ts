/** Two instance addresses point at the same server when they share protocol, host and port. */
export function sameHost(a: string | null, b: string): boolean {
  if (!a) return false;
  try {
    const left = new URL(a);
    const right = new URL(b);
    return left.protocol === right.protocol && left.host === right.host;
  } catch {
    return false;
  }
}
