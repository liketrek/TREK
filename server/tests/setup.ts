// Global test setup — runs before every test file.
// Environment variables must be set before any module import so that
// config.ts, database.ts, etc. pick them up at import time. (Importing from
// 'vitest' itself is safe: it is externalized and pulls in no app modules.)
import { afterEach } from 'vitest';

// Fixed encryption key (64 hex chars = 32 bytes) for at-rest crypto in tests
process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2';
process.env.NODE_ENV = 'test';
process.env.COOKIE_SECURE = 'false';
process.env.LOG_LEVEL = 'error'; // suppress info/debug logs in test output

// Several services fire notification sends as unawaited dynamic-import chains
// (`import('…/notificationService').then(({ send }) => send(…).catch(…))`).
// Give those chains one macrotask turn to settle after every test, while the
// suite's DB and the worker environment are still alive — otherwise the last
// test in a file can leave the chain pending into worker teardown ("Cannot
// load ... after the environment was torn down"). Under the default "stack"
// hook order this afterEach runs after each test's own afterEach and before
// the suite's afterAll, i.e. before any afterAll closes its test DB.
// setImmediate is captured up front because some suites install fake timers.
const realSetImmediate = globalThis.setImmediate;
afterEach(async () => {
  await new Promise((resolve) => realSetImmediate(resolve));
});

// Nominatim's rate limit is a property of the real service, not of the code
// under test. Nineteen maps cases stub fetch and drive those paths back to back;
// under the real 1.1s interval they would spend nineteen seconds asleep. The
// cases that are actually about the throttle set it back for themselves.
//
// Imported dynamically, and down here rather than at the top: the client pulls
// in maps.helpers, whose UA constant calls getAppUrl() at module load. A static
// import is hoisted above the assignments above it, so the URL would be read
// from an environment this file has not finished setting up yet.
const { setGeoThrottleInterval } = await import('../src/nest/geo/nominatim.client');
setGeoThrottleInterval(0);
