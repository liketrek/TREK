# poi-demo

A minimal example of the `poiCategoryProvider` hook for TREK plugins.

## What it does

Registers a **"Cheese Shops"** POI category and returns a hardcoded list of
famous cheese shops around the world. Queries are matched against the shop name
or address with a case-insensitive substring filter. A bounding-box filter is
also supported.

Because the data is built-in there is no egress needed — no external API is
called and the plugin requires only the single `hook:poi-category-provider`
permission.

## Hook: `poiCategoryProvider`

Implement two methods in `hooks.poiCategoryProvider`:

| Method | Called when | Returns |
|---|---|---|
| `getCategories(ctx)` | Once after activation | `PoiCategory[]` — the category chips shown in the UI |
| `search(opts, ctx)` | Per user query | `{ results: PoiResult[], hasMore: boolean }` |

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
        return [{ id: 'cheese-shop', name: 'Cheese Shops', icon: 'ShoppingBag', color: '#f59e0b' }];
      },
      async search(opts, _ctx) {
        // opts: { query?, bounds?: { north, south, east, west }, limit? }
        return { results: [ /* PoiResult objects */ ], hasMore: false };
      },
    },
  },
};
```

## Extending to a real data source

1. Add `"http:outbound:your.api.host"` to `permissions` and `"your.api.host"` to `egress` in the manifest.
2. Replace the `SHOPS` array with a `fetch()` call inside `search`.
3. Map the API response to the `{ id, categoryId, name, lat, lng, ... }` shape.

## Running the example

```bash
cd plugin-sdk/examples/poi-demo
npx trek-plugin-sdk validate        # should report ok
npx trek-plugin-sdk dev             # start the dev server
```
