// Stub for src/config used by the Jest server tests.
// Replaces the real config (which reads env/secrets on load) with fixed values.
// JWT_SECRET matches the upstream auth cookie helper so signed test cookies verify.
export const CONFIG_MOCK = {
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER: '30d',
  SESSION_DURATION_REMEMBER_MS: 2592000000,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  DEFAULT_LANGUAGE: 'en',
};
