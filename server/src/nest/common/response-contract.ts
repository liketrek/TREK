import { readEnv } from '../../app-config';
import {
  applyDecorators,
  SetMetadata,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';

import { map, type Observable } from 'rxjs';
import type { ZodType } from 'zod';

/** The metadata key `@ResponseContract()` writes: the handler's response schema from @trek/shared. */
export const RESPONSE_CONTRACT_KEY = 'trekResponseContract';

/** How many Zod issues a violation names; the first few are enough to find the drift. */
const ISSUES_SHOWN = 5;

/**
 * A handler answered with a body its shared response schema does not describe. A plain
 * error on purpose: the exception filter answers it with the generic 500 and logs it
 * with its message (to the access log, or to the console in a hand-built test app), so
 * a failing test prints which handler drifted and where.
 */
export class ResponseContractViolation extends Error {
  override name = 'ResponseContractViolation';
}

/**
 * Throws a ResponseContractViolation when `body` does not parse under `schema`. The body
 * itself is never replaced by the parse result: the contract describes the wire, and a
 * parse that strips or coerces must not change what the client receives.
 */
export function assertResponseContract(schema: ZodType, body: unknown, where: string): void {
  const result = schema.safeParse(body);
  if (result.success) return;
  const issues = result.error.issues
    .slice(0, ISSUES_SHOWN)
    .map((issue) => `${issue.path.length ? issue.path.join('.') : '(root)'}: ${issue.message}`)
    .join('; ');
  throw new ResponseContractViolation(`${where} answered outside its response contract: ${issues}`);
}

/** Parses every response of one handler against its schema (see ResponseContract). */
export class ResponseContractInterceptor implements NestInterceptor {
  constructor(private readonly schema: ZodType) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const where = `${context.getClass().name}.${context.getHandler().name}`;
    return next.handle().pipe(
      map((body: unknown) => {
        assertResponseContract(this.schema, body, where);
        return body;
      }),
    );
  }
}

/**
 * Whether the response contracts are checked: under NODE_ENV=test only. Decided once,
 * when a controller class is defined, so a production build carries no interceptor at
 * all on these routes rather than one that asks the environment on every request. The
 * test setup sets NODE_ENV before any controller is imported.
 */
export function responseContractsEnforced(): boolean {
  return readEnv().app.isTest;
}

/**
 * Declares the shape a handler answers with: a response schema from @trek/shared, the
 * same one the client can type its call with.
 *
 * Under NODE_ENV=test every response of the handler is parsed against it, and a body
 * the schema does not describe fails the request with a 500, logged with the handler and
 * the first issues, so every e2e or integration test that reaches the route becomes a drift
 * check. In production it only records the schema (the metadata the ratchet and the
 * docs read) and adds nothing to the request path.
 *
 * Only for handlers whose return value is the JSON body. A handler that writes through
 * `@Res()` (a stream, a redirect, a file) returns nothing to check and stays without
 * one, marked `response-contract-exempt: <reason>` in a comment above it.
 *
 * When a check fails, the schema is what gets fixed, to describe the response the route
 * really sends: parity is law, the response does not change to suit the contract.
 */
export function ResponseContract(schema: ZodType): MethodDecorator {
  const decorators: MethodDecorator[] = [SetMetadata(RESPONSE_CONTRACT_KEY, schema)];
  if (responseContractsEnforced()) decorators.push(UseInterceptors(new ResponseContractInterceptor(schema)));
  return applyDecorators(...decorators);
}
