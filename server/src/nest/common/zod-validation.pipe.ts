import { HttpException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';

/**
 * TREK's Zod validation pipe, built on nestjs-zod so it works in BOTH modes:
 *
 *  - **Global** (`APP_PIPE` in AppModule): validates every parameter whose
 *    metatype is a `createZodDto(...)` class (the `<domain>.dto.ts` wrappers
 *    over the @trek/shared schemas) and passes everything else through
 *    untouched — legacy untyped bodies keep their exact behavior until their
 *    domain migrates. The boot gate in `validate-body-contracts.ts` is what
 *    makes forgetting a DTO fail closed.
 *  - **Per-parameter** (`@Body(new ZodValidationPipe(schema))`): still accepts
 *    an explicit schema/DTO for one-off cases.
 *
 * On failure it throws TREK's error envelope `{ error: string }` with status
 * 400 — the same shape the legacy routes produce (`field: message; ...`,
 * root-level issues labeled `body`), so the client's error handling and the
 * pinned test assertions are unaffected by the nestjs-zod migration.
 */
interface ZodIssueLike {
  path: (string | number | symbol)[];
  message: string;
}

function isZodErrorLike(error: unknown): error is { issues: ZodIssueLike[] } {
  return (
    typeof error === 'object' && error !== null &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: unknown): Error => {
    if (isZodErrorLike(error)) {
      const message = error.issues
        .map((i) => `${i.path.map(String).join('.') || 'body'}: ${i.message}`)
        .join('; ');
      return new HttpException({ error: message }, 400);
    }
    return new HttpException({ error: 'Validation failed' }, 400);
  },
});
