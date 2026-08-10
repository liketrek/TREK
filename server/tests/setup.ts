// Global test setup — runs before every test file.
// Environment variables must be set before any module import so that
// config.ts, database.ts, etc. pick them up at import time. (Importing from
// 'vitest' itself is safe: it is externalized and pulls in no app modules.)
import { afterEach } from 'vitest';
// The one app module imported here, and it is deliberately a static import even
// though import declarations are hoisted above the process.env writes below.
// The chain is nominatim.client -> maps.helpers -> app-config, and its only
// load-time read of the environment is the UA constant's getAppUrl(), which
// looks at APP_URL, ALLOWED_ORIGINS and PORT. This file sets none of those, so
// nothing in the chain observes a variable before it is written; config.ts and
// database.ts are not on it.
//
// It also has to be static. A setup file is imported for its side effects, not
// awaited as a hook, so a deferred `import()` would still be resolving while the
// test file registers its own mocks: booking-import's kitinerary suite replaces
// app-config with a factory that has no getAppUrl, and the late import then
// resolves maps.helpers against that mock and throws.
import { setGeoThrottleInterval } from '../src/nest/geo/nominatim.client';

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
setGeoThrottleInterval(0);
