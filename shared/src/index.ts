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
export * from './airport/airport.schema';
export * from './config/config.schema';
export * from './system-notice/system-notice.schema';
export * from './maps/maps.schema';
export * from './category/category.schema';
export * from './tag/tag.schema';
export * from './notification/notification.schema';
export * from './atlas/atlas.schema';
export * from './vacay/vacay.schema';
export * from './packing/packing.schema';
export * from './todo/todo.schema';
export * from './budget/budget.schema';
export * from './reservation/reservation.schema';
export * from './reservation/ki-reservation.schema';
export * from './airtrail/airtrail.schema';
export * from './day/day.schema';
export * from './assignment/assignment.schema';
export * from './place/place.schema';
export * from './trip/trip.schema';
export * from './collab/collab.schema';
export * from './file/file.schema';
export * from './journey/journey.schema';
export * from './share/share.schema';
export * from './settings/settings.schema';
export * from './appearance/appearance.schema';
export * from './backup/backup.schema';
export * from './auth/auth.schema';
export * from './oidc/oidc.schema';
export * from './oauth/oauth.schema';
export * from './admin/admin.schema';

// Sanitisation helpers — used by the client today, scoped here so the server
// has them ready if rich-text input ever ships.
export * from './sanitize/sanitize';

// i18n registry (language list + pure helpers — no locale data)
export * from './i18n/languages';
