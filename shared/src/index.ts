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
export * from './common/compare';
export * from './common/strip-markdown';

// Domain contracts
export * from './weather/weather.schema';
export * from './weather/wind.schema';
export * from './paddle/paddle-obstacles.schema';
export * from './paddle/paddle-route-relation';
export * from './paddle/paddle-regions.schema';
export * from './paddle/paddle-route.schema';
export * from './public-api/public-api.schema';
export * from './airport/airport.schema';
export * from './config/config.schema';
export * from './system-notice/system-notice.schema';
export * from './maps/maps.schema';
export * from './maps/place-shadow.schema';
export * from './maps/route-usage.schema';
export * from './category/category.schema';
export * from './tag/tag.schema';
export * from './notification/notification.schema';
export * from './memories/memories.schema';
export * from './atlas/atlas.schema';
export * from './vacay/vacay.schema';
export * from './packing/packing.schema';
export * from './packing/packed-count';
export * from './packing/packing-placeholder';
export * from './todo/todo.schema';
export * from './budget/budget.schema';
export * from './budget/receipt-scan.schema';
export * from './reservation/reservation.schema';
export * from './reservation/reservation-types';
export * from './reservation/ki-reservation.schema';
export * from './reservation/reservation-read.schema';
export * from './datetime/datetime-normalize';
export * from './airtrail/airtrail.schema';
export * from './dawarich/dawarich.schema';
export * from './docsync/docsync.schema';
export * from './day/day.schema';
export * from './day/note-colors';
export * from './day/chrono-order';
export * from './day/stay-bookends';
export * from './assignment/assignment.schema';
export * from './place/place.schema';
export * from './place/place-match';
export * from './place/place-website';
export * from './roadtrip/roadtrip.schema';
export * from './place/track-colors';
export * from './tours/tours.schema';
export * from './tours/run-pace';
export * from './tours/tour-time-estimate';
export * from './tours/ski.schema';
export * from './ski/ski-route.schema';
export * from './ski/winter-index.schema';
export * from './tours/tour-stages';
export * from './tours/tour-provenance.schema';
export * from './tours/tour-activity.schema';
export * from './tours/tour-activity-stats.schema';
export * from './tours/tour-activity-stats';
export * from './tours/tour-library.schema';
export * from './tours/collection-tour.schema';
export * from './tours/tour-packing-link.schema';
export * from './tours/tour-packing-link';
export * from './tours/tour-draft.schema';
export * from './tours/tour-poi-search.schema';
export * from './tours/tour-trail-grade.schema';
export * from './tours/tour-walk.schema';
export * from './tours/tour-walk';
export * from './tours/tour-walk-briefing.schema';
export * from './tours/tour-change.schema';
export * from './tours/tour-edit.schema';
export * from './tours/walk-hours';
export * from './tours/walk-remaining';
export * from './tours/walk-ferry';
export * from './tours/tours.metrics';
export * from './tours/hiking-costing';
export * from './tours/tour-costing';
export * from './tours/tour-plan.schema';
export * from './tours/sport-tour-create.schema';
export * from './tours/hike-plan.schema';
export * from './tours/tour-hike.schema';
export * from './tours/round-hike-geometry';
export * from './tours/round-hike-search';
export * from './tours/hike-ways.schema';
export * from './geo/same-way';
export * from './tours/tour-display.schema';
export * from './tours/line-along';
export * from './tours/hike-schedule';
export * from './tours/tour-gpx-import.schema';
export * from './tours/paddle-plan.schema';
export * from './tours/paddle-plan';
export * from './tours/paddle-check.schema';
export * from './tours/paddle-check-basis';
export * from './tours/paddle-check';
export * from './tours/route-corridor';
export * from './tours/poi-insertion';
export * from './tours/tour-stop.schema';
export * from './tours/horse-route.schema';
export * from './wanderer/wanderer.schema';
export * from './wanderer/wanderer-watch.schema';
export * from './wanderer/wanderer-mcp.schema';
export * from './geo/haversine';
export * from './collection/collection.schema';
export * from './collection/collection-file.schema';
export * from './trip/trip.schema';
export * from './place/place-hours';
export * from './place/place-kind';
export * from './trip/day-grid';
export * from './trip-invite/trip-invite.schema';
export * from './collab/collab.schema';
export * from './file/file.schema';
export * from './journey/journey.schema';
export * from './journey/journey-recordings.schema';
export * from './journey/journey-day-import.schema';
export * from './journey/journey-recording-prep.schema';
export * from './journey/journey-map.schema';
export * from './journey/trip-journal-link.schema';
export * from './book/book.schema';
export * from './book/book-fonts';
export * from './book/book-shapes-more';
export * from './book/book-line.schema';
export * from './book/book-line';
export * from './book/book-line-ops.schema';
export { bookNewLine, bookLineStyled } from './book/book-ops-line';
export { bookElementStyled } from './book/book-ops-elements';
export { layoutAroundLocks } from './book/book-layout-locks';
export { bookSpreadPhotoIds } from './book/book-photo-refs';
export * from './book/book-normalize';
export * from './book/book-schema-rev';
export * from './book/journey-stats.schema';
export * from './book/book-store.schema';
export * from './book/book-ids';
export * from './book/book-layouts';
export * from './book/book-grids';
export * from './book/book-saved-layouts';
export * from './book/book-pages';
export * from './book/book-ops.schema';
export {
  BOOK_OP_ERROR_CODES,
  type BookEditResult,
  type BookJourneyWords,
  type BookOpError,
  type BookOpErrorCode,
  type BookOpsContext,
  type BookPhotoInfo,
} from './book/book-ops-core';
export * from './book/book-ops';
export * from './book/book-page-ops';
export * from './book/book-findings';
export * from './book/describe-spread';
export * from './book/photo-pick';
export * from './book/book-element-ops.schema';
export * from './book/book-doc-ops';
export * from './book/book-travel';
export * from './book/travel/book-travel-looks';
export * from './book/book-text';
export * from './book/book-path';
export * from './book/book-icons';
export * from './book/book-sticker';
export * from './book/book-assets';
export * from './book/book-findings-art';
export * from './book/book-shape-catalogue';
export * from './book/stickers/sticker-types';
export * from './book/book-map-sources';
export * from './book/book-colour';
export * from './book/book-paint.schema';
export * from './book/book-paint';
export * from './book/book-photo-look.schema';
export * from './book/book-photo-look';
export * from './book/book-findings-design';
export * from './book/book-groups';
export * from './book/book-arrange';
export * from './book/book-group-ops.schema';
export * from './book/book-style-copy';
export * from './book/book-text-effects.schema';
export * from './book/book-text-curve';
export * from './book/book-text-fit';
export * from './book/book-text-findings';
export * from './book/book-text-describe';
export * from './book/book-text-ops.schema';
export * from './book/book-lockups';
export * from './book/book-archetypes';
export * from './book/book-lockups.data';
export * from './book/auto/auto-types';
export * from './book/auto/auto-book';
export * from './book/auto/auto-designed';
export * from './book/auto/auto-templates.data';
export * from './book/auto/auto-template-apply';
export * from './book/design/design-brief.schema';
export * from './book/design/design-directives.schema';
export * from './book/design/design-book';
export * from './book/design/design-merge';
export { BOOK_DESIGN_BEATS, type BookDesignBeat } from './book/design/design-pacing';
export type { BookDesignLeftOut, BookDesignLeftOutReason } from './book/design/design-photos';
export type { BookDesignLook } from './book/design/design-style';
export * from './book/book-design-tools.schema';
export * from './book/theme/book-theme.schema';
export * from './book/theme/book-themes.data';
export * from './book/theme/book-theme';
export * from './book/theme/book-theme-apply';
export * from './book/theme/book-theme-links';
export * from './book/theme/book-theme-ops';
export * from './book/theme/book-theme-photos';
export { bookThemeCatalogue, bookThemeLine } from './book/theme/book-theme-describe';
export * from './book/templates/template-format';
export * from './book/templates/template-catalogue';
export * from './book/templates/template-match';
export * from './book/templates/template-apply';
export * from './book/templates/template-words';
export * from './book/templates/template-extract';
export * from './share/share.schema';
export * from './storage/storage.schema';
export * from './settings/settings.schema';
export * from './appearance/appearance.schema';
export * from './backup/backup.schema';
export * from './auth/auth.schema';
export * from './auth/password-policy';
export * from './sessions/sessions.schema';
export * from './oidc/oidc.schema';
export * from './native-auth/native-auth.schema';
export * from './oauth/oauth.schema';
export * from './admin/admin.schema';
export * from './ai/ai-connections.schema';
export * from './assistant/assistant.schema';
export * from './assistant/assistant-attachments.schema';
export * from './assistant/cards';
export * from './assistant/assistant-share.schema';
export * from './assistant/assistant-scope.schema';
export * from './assistant/assistant-vision.schema';

// Realtime WS event contract registry (event names + payload schemas)
export * from './realtime/events.schema';
export * from './roadtrip/day-boundary.schema';

// HTML escaping. The DOMPurify sanitisers live behind `@trek/shared/sanitize`
// instead (see sanitize/sanitize.ts): on Node they build a jsdom window when
// they load, and this barrel is what the server imports.
export * from './sanitize/escape';

// WGS-84 ⇄ GCJ-02. Shared because the two boundaries that need it sit on
// opposite sides: the Amap provider on the server, the Leaflet CRS on the client.
export * from './geo/gcj02';

// i18n registry (language list + pure helpers — no locale data)
export * from './i18n/languages';
export * from './i18n/plural';

// Plugin permission list, generated from the host's protocol/envelope.ts
// (server/scripts/gen-plugin-facts.ts). The admin consent screens render from it.
export * from './plugin-permissions';
// Plugin settings contracts: the settings-field descriptor + admin instance-config wire shapes.
export * from './plugins/plugins.schema';
// Plugin POI categories (#1781): the declared category, the icon allow-list and GET /api/plugin-pois.
export * from './plugins/plugin-poi-facts';
export * from './plugins/plugin-poi.schema';
// Plugin search providers (#2221): the row GET /api/plugin-search and its typed-ahead twin answer with.
export * from './plugins/plugin-search.schema';
export * from './roadtrip/preferences.schema';
export * from './roadtrip/hazards.schema';
export * from './roadtrip/planning.schema';
export * from './roadtrip/search.schema';
export * from './roadtrip/google-import.schema';
export * from './roadtrip/charging.schema';

export * from './vacay/school-holiday-catalog.schema';

// Money arithmetic in whole hundredths (sums, equal splits, currency precision).
export * from './money/money';

// Trip permission catalog (keys, levels, defaults) and the rule that decides a check.
export * from './permissions/permissions';

// The shared account visitors of a demo instance sign in as.
export * from './demo/demo-account';

// Via ferratas around a trip, from OpenStreetMap through Overpass (GET /api/trips/:tripId/ferratas).
export * from './ferratas/ferratas.schema';
// The 0.05 degree tile grid both ends load, cache and persist the layer on.
export * from './ferratas/ferrataGrid';
