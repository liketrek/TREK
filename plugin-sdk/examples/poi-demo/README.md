# poi-demo

A minimal example of the `poiCategoryProvider` hook for TREK plugins.

## What it does

Registers a **"Demo Points"** POI category and returns POI locations
**computed directly from the current map view bounds** — no hardcoded
coordinates, no external API, no egress.

For any bounding box the hook generates random points **inside the visible
area bounds**. Pan to Paris and you get random points over Paris. Zoom to
New York and you get random points over New York.

Without `bounds` a single fallback point at (0, 0) is returned.
An optional `query` string narrows results by generated id/name
(e.g. `?query=random-3`).

This pattern is the foundation of a real spatially-aware provider: swap the
geometry calculations for a database or API call that accepts the same `bounds`
parameter.

## Hook: `poiCategoryProvider`

Implement two methods in `hooks.poiCategoryProvider`:

| Method | Called when | Returns |
|---|---|---|
| `getCategories(ctx)` | Once after activation | `PoiCategory[]` — the category chips shown in the UI |
| `search(opts, ctx)` | Per user query | `{ results: PoiResult[], hasMore: boolean }` |

`opts` shape:

```ts
{
  query?: string;                                        // optional text filter
  bounds?: { north: number; south: number;               // current map view
             east:  number; west:  number };
  limit?: number;                                        // 1..100, default 20
}
```

```json
// trek-plugin.json excerpt
{
  "permissions": ["hook:poi-category-provider"]
}
```

```js
// server/index.js excerpt
module.exports = {
  hooks: {
    poiCategoryProvider: {
      getCategories(_ctx) {
        return [{ id: 'demo-point', name: 'Demo Points', icon: 'MapPin', color: '#6366f1' }];
      },
      async search(opts, _ctx) {
        if (!opts.bounds) return { results: [], hasMore: false };
        const { north, south, east, west } = opts.bounds;
        const lat = south + Math.random() * (north - south);
        const lng = west + Math.random() * (east - west);
        return {
          results: [
            { id: 'random-1', categoryId: 'demo-point', name: 'Random #1', lat, lng },
          ],
          hasMore: false,
        };
      },
    },
  },
};
```

## Extending to a real data source

1. Add `"http:outbound:your.api.host"` to `permissions` and `"your.api.host"` to `egress` in the manifest.
2. Replace the geometry with a `fetch()` call that passes `bounds` as query parameters.
3. Map the API response to the `{ id, categoryId, name, lat, lng, ... }` shape.

## Running the example

```bash
cd plugin-sdk/examples/poi-demo
npx trek-plugin-sdk validate        # should report ok
npx trek-plugin-sdk dev             # start the dev server
```
