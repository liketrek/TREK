import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

// mapbox-gl and maplibre-gl ship in the same bundle, and both pass messages to
// their workers through a class registry that stamps `_classRegistryKey` on
// constructors. maplibre stamps the built-ins Set and Error globally. mapbox-gl
// 3.33 and later read that key before their own Set and Error handling, find no
// entry for "Set" in their registry and throw "Cannot read properties of
// undefined (reading 'omit')" for every vector tile, so the Mapbox basemap stays
// blank while raster layers still load. These read the shipped files because the
// clash only exists between the two real libraries.
const requireFromClient = createRequire(import.meta.url);

function distFile(pkg: string, file: string): string {
  const root = dirname(requireFromClient.resolve(`${pkg}/package.json`));
  return readFileSync(join(root, 'dist', file), 'utf8');
}

function functionBody(source: string, signature: string): string {
  const start = source.indexOf(signature);
  expect(start, `${signature} not found`).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf('\n}\n', start));
}

describe('GL worker class registry', () => {
  it('FE-COMP-GLWORKERREGISTRY-001: maplibre-gl stamps the global Set and Error', () => {
    const maplibre = distFile('maplibre-gl', 'maplibre-gl-dev.mjs');
    expect(maplibre).toMatch(/register\("Set", Set\)/);
    expect(maplibre).toMatch(/register\("Error", Error\)/);
  });

  it('FE-COMP-GLWORKERREGISTRY-002: mapbox-gl handles Set and Error before it reads the registry key', () => {
    const serialize = functionBody(
      distFile('mapbox-gl', 'mapbox-gl-dev.js'),
      'function serialize(input, transferables)'
    );
    const registryRead = serialize.indexOf('._classRegistryKey');
    expect(registryRead).toBeGreaterThan(-1);
    expect(serialize.indexOf('instanceof Set')).toBeGreaterThan(-1);
    expect(serialize.indexOf('instanceof Set')).toBeLessThan(registryRead);
    expect(serialize.indexOf('instanceof Error')).toBeLessThan(registryRead);
  });
});
