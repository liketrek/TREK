/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

/** The version this bundle was built as (client/package.json), set by `define` in vite.config.js. */
declare const __TREK_UI_VERSION__: string;

/**
 * Big Shoulders Display's weights, imported for their stylesheets alone
 * (components/Studio/bookFontFaces.ts). Its package maps `./*` to `./*.css`
 * and has no `./*.css` entry, so the import names `100` rather than
 * `100.css`, and vite/client's `*.css` declaration does not cover a bare
 * name. Declared for this one package only, so a mistyped import of any
 * other module still fails the check.
 */
declare module '@fontsource/big-shoulders-display/*';
