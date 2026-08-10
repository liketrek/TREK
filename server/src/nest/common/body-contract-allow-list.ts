/**
 * Legacy mutation handlers that still read @Body() without a createZodDto
 * class — grandfathered when the fail-closed boot gate landed
 * (validate-body-contracts.ts). Entries are `ControllerClass.methodName`.
 *
 * EMPTY, and it stays that way. Every mutation handler in the tree now types
 * its body with a createZodDto class, so the gate has nothing to forgive. It
 * still runs: a new handler that reads @Body() without a contract refuses the
 * boot rather than shipping unvalidated. Adding an entry here to get past that
 * is not the fix.
 *
 * The last seventeen came off in the migration remainder. Several of their
 * contracts describe rather than constrain, which is deliberate and documented
 * at each DTO: those handlers own rejections the pipe would otherwise pre-empt,
 * including two that answer 503 before ever looking at the body and one that
 * answers `{ route: null }` at 200 for anything it dislikes.
 */
export const BODY_CONTRACT_ALLOW_LIST: string[] = [];
