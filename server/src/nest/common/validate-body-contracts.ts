import type { INestApplication } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { ModulesContainer } from '@nestjs/core';
import { isZodDto } from 'nestjs-zod/dto';
import { BODY_CONTRACT_ALLOW_LIST } from './body-contract-allow-list';
import { byCodeUnit } from './compare';

const MUTATION_METHODS = new Set<RequestMethod>([
  RequestMethod.POST,
  RequestMethod.PUT,
  RequestMethod.PATCH,
  // DELETE belongs here too. It is rare for one to read a body, but the two that
  // do are writes like any other, and leaving the method out meant their bodies
  // reached the handler with nothing having looked at them.
  RequestMethod.DELETE,
]);

/**
 * Boot-time fail-closed gate: every POST/PUT/PATCH handler that reads the
 * request body (@Body() / @Body('field')) must type it with a
 * `createZodDto(...)` class so the global ZodValidationPipe actually validates
 * it — or be explicitly listed in body-contract-allow-list.ts (legacy routes
 * whose domains have not migrated yet; the list only ratchets down).
 *
 * Called from buildApp() right after app.init() (same seam as the MCP registry
 * handoff), so a maintainer who adds an unvalidated mutation route gets a
 * refused boot in dev and CI instead of silently shipping an unvalidated
 * endpoint. Same philosophy as McpRegistryService.validate(): misconfiguration
 * breaks app boot, not runtime requests.
 *
 * A stale allow-list entry (route removed or migrated) also throws, so the
 * list cannot quietly over-allow.
 */
export function validateBodyContracts(
  app: INestApplication,
  allowList: readonly string[] = BODY_CONTRACT_ALLOW_LIST,
): void {
  const modules = app.get(ModulesContainer, { strict: false });
  const offenders: string[] = [];
  const seen = new Set<string>();

  for (const module of modules.values()) {
    for (const wrapper of module.controllers.values()) {
      const ctor = wrapper.metatype as (abstract new (...args: never[]) => unknown) | undefined;
      if (!ctor || typeof ctor !== 'function') continue;

      for (const name of Object.getOwnPropertyNames(ctor.prototype)) {
        if (name === 'constructor') continue;
        const handler = (ctor.prototype as Record<string, unknown>)[name];
        if (typeof handler !== 'function') continue;
        const methodEnum = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
        if (methodEnum === undefined || !MUTATION_METHODS.has(methodEnum)) continue;

        const args = (Reflect.getMetadata(ROUTE_ARGS_METADATA, ctor, name) ?? {}) as Record<
          string,
          { index: number }
        >;
        const paramtypes = (Reflect.getMetadata('design:paramtypes', ctor.prototype, name) ?? []) as unknown[];

        for (const key of Object.keys(args)) {
          // ROUTE_ARGS_METADATA keys are `${paramtype}:${index}` for built-in
          // decorators; custom decorators (@CurrentUser) use a different shape
          // and never parse to the BODY paramtype.
          const paramtype = Number(key.split(':')[0]);
          if (paramtype !== (RouteParamtypes.BODY as number)) continue;

          const route = `${ctor.name}.${name}`;
          if (seen.has(route)) continue;
          seen.add(route);

          const metatype = paramtypes[args[key].index];
          if (typeof metatype === 'function' && isZodDto(metatype)) continue;
          offenders.push(route);
        }
      }
    }
  }

  const allowed = new Set(allowList);
  const violations = offenders.filter((route) => !allowed.has(route));
  const stale = allowList.filter((route) => !offenders.includes(route));

  const problems: string[] = [];
  if (violations.length) {
    problems.push(
      `${violations.length} mutation handler(s) read @Body() without a createZodDto class ` +
        `(add a <domain>.dto.ts wrapper over the @trek/shared schema — do NOT extend the allow-list): ` +
        violations.sort(byCodeUnit).join(', '),
    );
  }
  if (stale.length) {
    problems.push(
      `stale body-contract allow-list entr${stale.length === 1 ? 'y' : 'ies'} ` +
        `(route removed or now validated — delete from body-contract-allow-list.ts): ` +
        stale.sort(byCodeUnit).join(', '),
    );
  }
  if (problems.length) {
    throw new Error(`Unvalidated body contracts: ${problems.join('; ')}`);
  }
}
