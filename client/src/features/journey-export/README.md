# Journey export

The export feature is intentionally separated into five layers:

- `model/` turns Journey store data into the stable export contract.
- `render/` turns that contract into a printable document.
- `preview/` displays the prepared document and handles printing.
- `designer/` is reserved for a future layout/template editor.
- `persistence/` is reserved for future designer settings and presets.

The Journey Book renderer remains a single fixed-layout renderer for now. The
model boundary makes adding designer and persistence behaviour a focused
follow-up instead of another store-to-DOM change.
