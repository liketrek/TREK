// POI Demo — demonstrates the `poiCategoryProvider` hook.
//
// Registers one POI category ("Cheese Shops") and returns a fixed set of
// results that can be filtered by a case-insensitive name substring. No
// external API or egress is required — this is a self-contained example.
//
// GET /api/plugin-poi-categories?query=cheddar  → returns matching shops
// GET /api/plugin-poi-categories                → returns all shops
//
// To extend this to a real data source:
//   1. Add 'http:outbound:your.api.host' to permissions + egress in the manifest.
//   2. Replace the SHOPS array with a fetch() call inside `search`.
//   3. Map the API response to the { id, categoryId, name, lat, lng, ... } shape.

const SHOPS = [
  { id: 'shop-1', name: 'The Cheddar Cave',        lat: 51.2818, lng: -2.7752, address: 'The Gorge, Cheddar BS27 3QF' },
  { id: 'shop-2', name: 'Neal\'s Yard Dairy',       lat: 51.5133, lng: -0.1227, address: 'Borough Market, London SE1 1TL' },
  { id: 'shop-3', name: 'La Fromagerie',             lat: 51.5204, lng: -0.1478, address: '2-6 Moxon St, London W1U 4EW' },
  { id: 'shop-4', name: 'Beillevaire Châtelet',      lat: 48.8603, lng:  2.3467, address: '2 Rue de la Ferronnerie, Paris' },
  { id: 'shop-5', name: 'Eataly NYC Fromagerie',     lat: 40.7425, lng: -73.9892, address: '200 5th Ave, New York, NY 10010' },
];

const CATEGORY_ID = 'cheese-shop';

/** @type {import('trek-plugin-sdk').PluginDefinition} */
module.exports = {
  hooks: {
    poiCategoryProvider: {
      /** Declare the categories this plugin contributes. */
      getCategories(_ctx) {
        return [
          {
            id: CATEGORY_ID,
            name: 'Cheese Shops',
            icon: 'ShoppingBag',
            color: '#f59e0b',
          },
        ];
      },

      /** Return shops that match the optional query string. */
      async search(opts, _ctx) {
        const q = opts.query ? opts.query.toLowerCase() : '';
        const limit = opts.limit ?? 20;

        let filtered = q
          ? SHOPS.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
          : SHOPS;

        // Honour a bounding-box filter when provided.
        if (opts.bounds) {
          const { north, south, east, west } = opts.bounds;
          filtered = filtered.filter(
            (s) => s.lat >= south && s.lat <= north && s.lng >= west && s.lng <= east,
          );
        }

        const page = filtered.slice(0, limit);
        return {
          results: page.map((s) => ({
            id: s.id,
            categoryId: CATEGORY_ID,
            name: s.name,
            lat: s.lat,
            lng: s.lng,
            address: s.address,
          })),
          hasMore: filtered.length > limit,
        };
      },
    },
  },
};
