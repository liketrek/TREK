# Journey export persistence

This boundary will load and save designer settings or named export presets.
Its persisted format must be independent of the Journey store and consumed by
the `designer/` and `render/` layers through explicit contracts.

No preferences existed before this refactor, so no persistence behaviour is
introduced here.
