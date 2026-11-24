/**
 * A request body each registered route's Zod DTO accepts, for suites that walk
 * every route (route-row-ids.e2e.test.ts): a body the Zod pipe refuses answers
 * 400 before the handler runs, and would hide what the handler does with the
 * path. Built from the DTO's JSON schema with the smallest values that pass;
 * a schema the sample does not satisfy (a refinement, a pattern) gets no body.
 * The same walk lists every route's body and query DTO (`routeRequestDtos`).
 */
import { RequestMethod } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { ModulesContainer } from '@nestjs/core';

import { z } from 'zod';

type JsonSchema = Record<string, unknown>;

interface ZodDtoClass {
  schema?: z.ZodType;
}

const MAX_DEPTH = 8;

function firstType(schema: JsonSchema): string | undefined {
  const type = schema.type;
  if (Array.isArray(type)) return (type as string[]).find((t) => t !== 'null') ?? 'null';
  return typeof type === 'string' ? type : undefined;
}

function sampleString(schema: JsonSchema): string {
  switch (schema.format) {
    case 'date':
      return '2026-03-01';
    case 'date-time':
      return '2026-03-01T10:00:00Z';
    case 'time':
      return '10:00:00';
    case 'email':
      return 'walker@example.test';
    case 'uri':
    case 'url':
      return 'https://example.test/';
    case 'uuid':
      return '00000000-0000-4000-8000-000000000000';
    default: {
      const min = typeof schema.minLength === 'number' ? schema.minLength : 1;
      return 'x'.repeat(Math.max(1, min));
    }
  }
}

function sampleNumber(schema: JsonSchema): number {
  const min = typeof schema.minimum === 'number' ? schema.minimum : undefined;
  const exclusive = typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum : undefined;
  const floor = min ?? (exclusive !== undefined ? exclusive + 1 : 1);
  return Math.max(1, floor);
}

/** The smallest value `schema` (a JSON schema from z.toJSONSchema) describes, as far as a walk can tell. */
function sampleJsonSchema(schema: JsonSchema | boolean, root: JsonSchema | boolean = schema, depth = 0): unknown {
  // A boolean schema (`items: false`) allows anything or nothing; neither needs a value.
  if (typeof schema !== 'object' || typeof root !== 'object' || depth > MAX_DEPTH) return null;
  const ref = schema.$ref;
  if (typeof ref === 'string' && ref.startsWith('#/$defs/')) {
    const defs = (root.$defs ?? {}) as Record<string, JsonSchema>;
    return sampleJsonSchema(defs[ref.slice('#/$defs/'.length)] ?? {}, root, depth + 1);
  }
  if ('const' in schema) return schema.const;
  if (Array.isArray(schema.enum)) return (schema.enum as unknown[])[0];
  const alternatives = (schema.anyOf ?? schema.oneOf) as JsonSchema[] | undefined;
  if (Array.isArray(alternatives) && alternatives.length > 0) {
    const chosen = alternatives.find((alt) => alt.type !== 'null') ?? alternatives[0];
    return sampleJsonSchema(chosen, root, depth + 1);
  }
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return sampleJsonSchema(schema.allOf[0] as JsonSchema, root, depth + 1);
  }
  switch (firstType(schema)) {
    case 'object': {
      const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
      const required = (schema.required ?? []) as string[];
      return Object.fromEntries(required.map((key) => [key, sampleJsonSchema(properties[key] ?? {}, root, depth + 1)]));
    }
    case 'array': {
      const count = typeof schema.minItems === 'number' ? schema.minItems : 0;
      const items = (schema.items ?? {}) as JsonSchema;
      return Array.from({ length: count }, () => sampleJsonSchema(items, root, depth + 1));
    }
    case 'string':
      return sampleString(schema);
    case 'integer':
    case 'number':
      return sampleNumber(schema);
    case 'boolean':
      return false;
    case 'null':
      return null;
    default:
      return 'x';
  }
}

/** A body `schema` accepts, or undefined when the sample does not pass it. */
export function sampleBody(schema: z.ZodType): unknown {
  let json: JsonSchema;
  try {
    json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as JsonSchema;
  } catch {
    return undefined;
  }
  const sample = sampleJsonSchema(json);
  return schema.safeParse(sample).success ? sample : undefined;
}

function joinPath(...parts: string[]): string {
  return (
    '/' +
    parts
      .map((p) => p.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/')
  );
}

/** One Zod DTO a route handler declares, for its body or its query. */
interface RouteDto {
  /** `method /path`, Express's spelling of the route. */
  route: string;
  /** The DTO class's name. */
  name: string;
  schema: z.ZodType;
}

/** Every handler argument of type `paramtype` (whole body or whole query) that is a Zod DTO, per route. */
function routeDtos(app: INestApplication, paramtype: RouteParamtypes): RouteDto[] {
  const container = app.get(ModulesContainer, { strict: false });
  const dtos: RouteDto[] = [];
  for (const module of container.values()) {
    for (const wrapper of module.controllers.values()) {
      const ctor = wrapper.metatype as (new (...args: never[]) => object) | undefined;
      if (!ctor?.prototype) continue;
      const controllerPaths = [Reflect.getMetadata(PATH_METADATA, ctor) as string | string[] | undefined].flat();
      for (const name of Object.getOwnPropertyNames(ctor.prototype)) {
        const handler = (ctor.prototype as Record<string, unknown>)[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
        if (method === undefined) continue;
        const args = (Reflect.getMetadata(ROUTE_ARGS_METADATA, ctor, name) ?? {}) as Record<
          string,
          { index: number; data?: unknown }
        >;
        const arg = Object.entries(args).find(
          ([key, a]) => key.split(':')[0] === String(paramtype) && a.data === undefined,
        )?.[1];
        if (!arg) continue;
        const types = (Reflect.getMetadata('design:paramtypes', ctor.prototype, name) ?? []) as unknown[];
        const dto = types[arg.index] as (ZodDtoClass & { name?: string }) | undefined;
        if (!dto?.schema) continue;
        const handlerPaths = [Reflect.getMetadata(PATH_METADATA, handler) as string | string[] | undefined].flat();
        for (const controllerPath of controllerPaths) {
          for (const handlerPath of handlerPaths) {
            dtos.push({
              route: `${RequestMethod[method].toLowerCase()} ${joinPath(controllerPath ?? '', handlerPath ?? '')}`,
              name: dto.name ?? 'anonymous DTO',
              schema: dto.schema,
            });
          }
        }
      }
    }
  }
  return dtos;
}

/**
 * `METHOD /path` (Express's spelling of the route) to the Zod schema of the
 * handler's `@Body()` DTO, for every handler that declares one.
 */
export function routeBodySchemas(app: INestApplication): Map<string, z.ZodType> {
  return new Map(routeDtos(app, RouteParamtypes.BODY).map((dto) => [dto.route, dto.schema]));
}

/** The `@Body()` and `@Query()` DTOs of every route, for suites that check what the Zod pipe lets through. */
export function routeRequestDtos(app: INestApplication): RouteDto[] {
  return [...routeDtos(app, RouteParamtypes.BODY), ...routeDtos(app, RouteParamtypes.QUERY)];
}
