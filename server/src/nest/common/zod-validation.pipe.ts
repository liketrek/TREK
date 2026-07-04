import { ArgumentMetadata, HttpException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validates an incoming @Body()/@Query() against a Zod schema (from @trek/shared)
 * and returns the parsed, typed value. On failure it throws TREK's error envelope
 * `{ error: string }` with status 400 — the same shape the legacy routes produce,
 * so the client's error handling is unaffected.
 *
 * Usage: `@Body(new ZodValidationPipe(someSchema)) dto: Dto`.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  // Public so the API-docs enricher can lift the schema into the OpenAPI
  // document (#1412) — the pipe stays the single source of truth.
  constructor(readonly schema: ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
        .join('; ');
      throw new HttpException({ error: message }, 400);
    }
    return result.data;
  }
}
