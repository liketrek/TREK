import type { INestApplication } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { z, type ZodType } from 'zod';
import type { OpenAPIObject } from '@nestjs/swagger';
import { ZodValidationPipe } from './zod-validation.pipe';

/**
 * Phase 2 of #1412: real request-body schemas without annotating anything
 * twice. The API validates with Zod via `@Body(new ZodValidationPipe(schema))`
 * — that pipe IS the schema source of truth, so this enricher walks every
 * controller route, finds full-body Zod pipes, and writes the converted
 * JSON schema into the generated OpenAPI document. Any route that gains a
 * ZodValidationPipe is documented automatically from then on.
 */

/** Zod → OpenAPI 3.0 schema; degrades to a bare object for unrepresentable schemas. */
export function zodToOpenApi(schema: ZodType): Record<string, unknown> {
  try {
    return z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
  } catch {
    return { type: 'object' };
  }
}

const HTTP_METHOD: Partial<Record<RequestMethod, string>> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.DELETE]: 'delete',
};

// RouteParamtypes.BODY — the numeric key prefix @Body() writes into
// ROUTE_ARGS_METADATA ("<paramtype>:<index>"). The enum lives in a private
// @nestjs/common path, so the value is pinned here with a boot-time test.
const BODY_PARAMTYPE = '3';

function joinPath(base: string | undefined, sub: string | undefined): string {
  const parts = `${base ?? ''}/${sub ?? ''}`.split('/').filter(Boolean);
  // Express ":param" → OpenAPI "{param}"
  return '/' + parts.map((p) => (p.startsWith(':') ? `{${p.slice(1)}}` : p)).join('/');
}

/** Find full-body Zod schemas per route and merge them into the document. */
export function attachZodBodySchemas(app: INestApplication, document: OpenAPIObject): void {
  const modules = app.get(ModulesContainer, { strict: false });
  for (const module of modules.values()) {
    for (const wrapper of module.controllers.values()) {
      const ctor = wrapper.metatype as (abstract new (...args: never[]) => unknown) | undefined;
      if (!ctor || typeof ctor !== 'function') continue;
      const basePath = Reflect.getMetadata(PATH_METADATA, ctor) as string | undefined;
      if (basePath === undefined) continue;

      for (const name of Object.getOwnPropertyNames(ctor.prototype)) {
        if (name === 'constructor') continue;
        const handler = (ctor.prototype as Record<string, unknown>)[name];
        if (typeof handler !== 'function') continue;
        const methodEnum = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
        const verb = methodEnum !== undefined ? HTTP_METHOD[methodEnum] : undefined;
        if (!verb) continue;

        const args = (Reflect.getMetadata(ROUTE_ARGS_METADATA, ctor, name) ?? {}) as Record<
          string,
          { index: number; data?: unknown; pipes?: unknown[] }
        >;
        const bodyArg = Object.entries(args).find(([key, meta]) =>
          key.startsWith(`${BODY_PARAMTYPE}:`)
          // @Body('field') picks a sub-field — only whole-body pipes describe the request body
          && meta.data === undefined
          && (meta.pipes ?? []).some((p) => p instanceof ZodValidationPipe),
        );
        if (!bodyArg) continue;
        const zodPipe = (bodyArg[1].pipes ?? []).find((p): p is ZodValidationPipe => p instanceof ZodValidationPipe)!;

        const route = document.paths[joinPath(basePath, Reflect.getMetadata(PATH_METADATA, handler) as string | undefined)];
        const operation = route?.[verb as 'get' | 'post' | 'put' | 'patch' | 'delete'];
        if (!operation) continue;
        operation.requestBody = {
          required: true,
          content: { 'application/json': { schema: zodToOpenApi(zodPipe.schema) } },
        };
      }
    }
  }
}
