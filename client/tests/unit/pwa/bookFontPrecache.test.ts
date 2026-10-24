import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_FACES, bookFontFile, keepInPrecache, withoutRuntimeFonts } from '../../../bookFontPrecache.js';

/**
 * Which font files the service worker installs (FE-SW-FONTS): the app's own
 * faces as before, the latin woff2 of the seven book families that shipped
 * first, and nothing else of the book's catalogue, which waits in the
 * book-fonts runtime cache for a book that uses it.
 */

// Vitest runs with the client package as its root, so cwd is stable here.
const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');

const asset = (name: string) => `assets/${name}`;

describe('reading a font file name', () => {
  it('FE-SW-FONTS-001: reads package, subset, weight and style as the build names them, and nothing else as a book face', () => {
    expect(bookFontFile(asset('dm-serif-display-latin-ext-400-italic-Ab12_cD3.woff2'))).toEqual({
      pkg: 'dm-serif-display',
      subset: 'latin-ext',
      weight: 400,
      italic: true,
      ext: 'woff2',
    });
    expect(bookFontFile(asset('dm-mono-latin-500-normal-xyz.woff'))).toMatchObject({ pkg: 'dm-mono', subset: 'latin' });
    expect(bookFontFile(asset('geist-sans-latin-400-normal-abc.woff2'))).toBeNull();
    expect(bookFontFile(asset('index-abc.js'))).toBeNull();
    expect(bookFontFile(asset('lora.woff2'))).toBeNull();
  });
});

describe('the precache', () => {
  it('FE-SW-FONTS-002: keeps the faces the app draws, whatever their subset and format', () => {
    expect(keepInPrecache(asset('poppins-latin-500-normal-abc.woff'))).toBe(true);
    expect(keepInPrecache(asset('poppins-devanagari-700-normal-abc.woff2'))).toBe(true);
    expect(keepInPrecache(asset('museomoderno-latin-800-normal-abc.woff2'))).toBe(true);
    expect(keepInPrecache(asset('geist-sans-latin-600-normal-abc.woff2'))).toBe(true);
    expect(keepInPrecache(asset('index-abc.js'))).toBe(true);
  });

  it('FE-SW-FONTS-003: keeps only the latin woff2 of the seven book families that shipped first', () => {
    expect(keepInPrecache(asset('lora-latin-400-normal-abc.woff2'))).toBe(true);
    expect(keepInPrecache(asset('bebas-neue-latin-400-normal-abc.woff2'))).toBe(true);
    expect(keepInPrecache(asset('museomoderno-latin-500-normal-abc.woff2'))).toBe(true);
    expect(keepInPrecache(asset('lora-latin-400-normal-abc.woff'))).toBe(false);
    expect(keepInPrecache(asset('lora-cyrillic-400-normal-abc.woff2'))).toBe(false);
    expect(keepInPrecache(asset('lora-latin-400-italic-abc.woff2'))).toBe(false);
    expect(keepInPrecache(asset('eb-garamond-latin-800-normal-abc.woff2'))).toBe(false);
    expect(keepInPrecache(asset('poppins-latin-900-normal-abc.woff2'))).toBe(false);
  });

  it('FE-SW-FONTS-004: leaves every file of the new families to the runtime cache', () => {
    for (const name of [
      'anton-latin-400-normal-abc.woff2',
      'caveat-latin-700-normal-abc.woff2',
      'fraunces-latin-ext-900-italic-abc.woff',
    ]) {
      expect(keepInPrecache(asset(name)), name).toBe(false);
    }
    const manifest = [
      { url: asset('index-abc.js'), revision: null },
      { url: asset('anton-latin-400-normal-abc.woff2'), revision: null },
      { url: asset('inter-latin-400-normal-abc.woff2'), revision: null },
    ];
    expect(withoutRuntimeFonts(manifest)).toEqual({ manifest: [manifest[0], manifest[2]], warnings: [] });
  });

  it('FE-SW-FONTS-005: knows the app faces main.tsx imports, so the chrome never loses one offline', () => {
    const imported = [...read('src/main.tsx').matchAll(/@fontsource\/([a-z0-9-]+)\/(\d+)\.css/g)].map(
      (m) => `${m[1]}/${m[2]}`
    );
    const declared = Object.entries(APP_FACES).flatMap(([pkg, weights]) => weights.map((w) => `${pkg}/${w}`));
    expect(imported.filter((face) => !face.startsWith('geist-sans/')).sort()).toEqual(declared.sort());
  });

  it('FE-SW-FONTS-006: is wired into the worker, with the runtime rule the Studio fills', () => {
    const config = read('vite.config.js');
    expect(config).toContain('manifestTransforms: [withoutRuntimeFonts]');
    const rule =
      /urlPattern:\s*(\/[^\n]*woff2[^\n]*\/i),\s*\n\s*handler:\s*'CacheFirst',\s*\n\s*options:\s*\{\s*\n\s*cacheName:\s*'book-fonts'/.exec(
        config
      );
    expect(rule).not.toBeNull();
    const literal = rule?.[1] ?? '//';
    const pattern = new RegExp(literal.slice(1, literal.lastIndexOf('/')), 'i');
    expect(pattern.test('https://trek.example/assets/anton-latin-400-normal-abc.woff2')).toBe(true);
    expect(pattern.test('https://trek.example/assets/lora-latin-400-normal-abc.woff')).toBe(true);
    expect(pattern.test('https://trek.example/assets/index-abc.js')).toBe(false);
    expect(pattern.test('https://trek.example/api/photos/1/file.woff2')).toBe(false);
  });
});
