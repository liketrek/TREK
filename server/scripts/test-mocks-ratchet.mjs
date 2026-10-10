#!/usr/bin/env node
/*
 * lint:test-mocks: module mocks of the config, the realtime transport and the
 * database modules in tests/ may only shrink.
 *
 * A `vi.mock` of one of those paths replaces a module every domain imports,
 * so a suite stays green for reasons its cases do not show (a factory that
 * happens to export the names the import order reaches first) and every
 * constructor or import change ripples through hundreds of factories. The
 * test infrastructure covers each of them instead:
 *
 *   src/config            the setup file fixes its values once
 *                         (tests/helpers/test-config.ts, overrideTestConfig)
 *   src/nest/realtime/**  a FakeRealtimeService through DI, or spyOnRealtime(app)
 *   src/db/**             a snapshot test db (tests/helpers/db-mock.ts) handed
 *                         to the code under test; the remaining `src/db/database`
 *                         mocks are the legacy this counts down
 *
 * Every `vi.mock(` / `vi.doMock(` outside a comment whose path (a string, or
 * `import('...')`) ends in one of those modules counts, per file, against scripts/test-mocks-baseline.json; a file without
 * an entry may hold none (scripts/lib/count-ratchet.mjs has the rules).
 *
 *   npm run lint:test-mocks              check against the baseline (CI)
 *   npm run lint:test-mocks -- --update  lower the counts; never raises or adds an entry
 */
import { cliMain, stripComments } from './lib/count-ratchet.mjs';

// The path as a string, or wrapped in import(), the typed form vi.mock also takes.
const MOCK_CALL = /\bvi\.(?:mock|doMock)\(\s*(?:import\(\s*)?(['"`])([^'"`]+)\1/g;

/** A mocked path that names one of the held modules, with or without an extension. */
const HELD_TARGET = /(?:^|\/)src\/(?:config|websocket|db(?:\/[^'"`]*)?|nest\/realtime(?:\/[^'"`]*)?)$/;

/** The module mocks of held targets in one file's text; a mock quoted in a comment does not count. */
export function countHeldMocks(text) {
  let n = 0;
  for (const match of stripComments(text).matchAll(MOCK_CALL)) {
    const target = match[2].replace(/\.(?:[cm]?[jt]s)$/, '');
    if (HELD_TARGET.test(target)) n++;
  }
  return n;
}

export const check = {
  name: 'test-mocks',
  script: 'lint:test-mocks',
  root: 'tests',
  baseline: 'scripts/test-mocks-baseline.json',
  unit: 'module mock(s) of config, realtime or db',
  advice:
    'Use the test config (overrideTestConfig), a FakeRealtimeService or spyOnRealtime(app), ' +
    'and a snapshot test db handed to the code under test instead of mocking the module.',
  include: (file) => /\.[cm]?[jt]s$/.test(file),
  count: (text) => countHeldMocks(text),
};

cliMain(check, import.meta.url);
