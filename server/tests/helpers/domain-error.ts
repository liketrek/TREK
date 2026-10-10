import { DomainError } from '../../src/nest/common/domain-error';

/**
 * Awaits a service call and hands a `DomainError` refusal back as the
 * `{ error, status }` result the service used to return, so a test can assert a
 * refusal and a success through one shape. Any other rejection propagates.
 */
export async function asLegacyResult<T>(call: Promise<T> | T): Promise<T & { error?: string; status?: number }> {
  try {
    // A call that resolves to nothing (a void write) reads as the empty success it used to return.
    return ((await call) ?? {}) as T & { error?: string; status?: number };
  } catch (err) {
    if (err instanceof DomainError) {
      return { ...err.details, error: err.publicMessage, status: err.getStatus() } as T & {
        error?: string;
        status?: number;
      };
    }
    throw err;
  }
}
