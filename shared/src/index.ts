/**
 * @trek/shared — single source of truth for TREK's API contracts.
 *
 * Zod schemas defined here are consumed by BOTH the server (validation +
 * inferred DTO types) and the client (typed requests/responses). A route is
 * only considered "migrated" once its contract lives in this package.
 *
 * Layout: one folder per domain (e.g. src/trip/trip.schema.ts), plus the
 * domain-agnostic primitives below. See the board card "Module blueprint".
 */
export * from './common/primitives.schema';
export * from './common/pagination.schema';

// Domain contracts
export * from './weather/weather.schema';

// i18n registry (language list + pure helpers — no locale data)
export * from './i18n/languages';
