/** The message of an error, or the value itself as text when it is not an Error (a thrown string, say). */
export const describeError = (err: unknown): string => (err instanceof Error ? err.message : String(err));
