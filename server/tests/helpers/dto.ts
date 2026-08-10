/**
 * A request body the case under test does not read.
 *
 * Controller unit tests stub the service and assert on the mapping around it:
 * which status an error becomes, whether the cookie is set, which audit fires.
 * The body never reaches validation on that path, because the global
 * ZodValidationPipe is not in the unit harness, so filling in plausible fields
 * would be inventing data no assertion looks at.
 *
 * Written as a named helper rather than a bare `as` cast so the intent is
 * greppable: `anyBody()` means "irrelevant here", not "we gave up on the type".
 * Anything a case DOES read belongs in the argument.
 */
export function anyBody<T>(body: Partial<T> = {}): T {
  return body as T;
}
