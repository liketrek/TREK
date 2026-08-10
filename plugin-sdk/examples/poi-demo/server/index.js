// POI Demo — demonstrates the `poiCategoryProvider` hook.
//
// This example generates POI results MATHEMATICALLY from the search bounds,
// so the returned points are always visible in the current map view regardless
// of where in the world you are looking. No hardcoded coordinates, no egress.
//
// Given the bounding box the hook returns random POIs inside the view.
//
// Without bounds a single POI at (0, 0) is returned as a fallback.
// An optional `query` string narrows results by role name.
//
// This is the simplest possible demo of a spatially-aware provider: a real
// plugin would replace the geometry below with a database or API query that
// accepts the same `bounds` parameter.

const CATEGORY_ID = 'demo-point';

/** Build a descriptive label for a generated point. */
function label(lat, lng, index) {
  const latStr = lat.toFixed(4) + (lat >= 0 ? 'N' : 'S');
  const lngStr = Math.abs(lng).toFixed(4) + (lng >= 0 ? 'E' : 'W');
  return 'Random #' + index + ' (' + latStr + ', ' + lngStr + ')';
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/** @type {import('trek-plugin-sdk').PluginDefinition} */
module.exports = {
  hooks: {
    poiCategoryProvider: {
      getCategories(_ctx) {
        return [
          {
            id: CATEGORY_ID,
            name: 'Demo Points',
            icon: 'MapPin',
            color: '#6366f1',
          },
        ];
      },

      async search(opts, _ctx) {
        // No bounds -> single fallback point so the hook always returns something.
        if (!opts.bounds) {
          return {
            results: [
              {
                id: 'fallback',
                categoryId: CATEGORY_ID,
                name: 'World centre (no bounds supplied)',
                lat: 0,
                lng: 0,
              },
            ],
            hasMore: false,
          };
        }

        const { north, south, east, west } = opts.bounds;

        // Optional text filter — matches against the role name or full label.
        const q = opts.query ? opts.query.toLowerCase() : '';

        const maxResults = Math.min(100, Math.max(1, opts.limit || 20));
        const generatedCount = Math.max(5, maxResults); // keep at least five demo points
        const candidates = Array.from({ length: generatedCount }, (_, i) => {
          const lat = randomBetween(south, north);
          const lng = randomBetween(west, east);
          return {
            id: 'random-' + (i + 1),
            lat,
            lng,
            name: label(lat, lng, i + 1),
          };
        });

        const filtered = candidates.filter(
          (p) =>
            !q ||
            p.id.includes(q) ||
            p.name.toLowerCase().includes(q),
        );

        const limit = maxResults;
        return {
          results: filtered.slice(0, limit).map((p) => ({
            id: p.id,
            categoryId: CATEGORY_ID,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            description: 'Generated from the current map view bounds.',
          })),
          hasMore: filtered.length > limit,
        };
      },
    },
  },
};
