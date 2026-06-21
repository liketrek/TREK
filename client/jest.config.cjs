// Jest config for the WAT tests (client). Separate runner from the upstream Vitest/Playwright suite, scoped to tests-wat. jsdom environment.

const swcOptions = {
  jsc: {
    parser: { syntax: 'typescript', tsx: true },
    transform: { react: { runtime: 'automatic' } },
    target: 'es2022',
  },
  module: { type: 'commonjs' },
};

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  roots: ['<rootDir>/tests-wat'],
  testEnvironment: 'jsdom',
  testMatch: ['**/tests-wat/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/tests-wat/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: { '^.+\\.(t|j)sx?$': ['@swc/jest', swcOptions] },
  transformIgnorePatterns: ['/node_modules/(?!(uuid|nanoid)/)', '\\.pnp\\.[^\\/]+$'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@trek/shared$': '<rootDir>/../shared/dist/index.cjs',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg|webp|avif)$': '<rootDir>/tests-wat/__mocks__/fileMock.cjs',
  },
  coverageDirectory: '<rootDir>/coverage-wat',
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  testTimeout: 15000,
};
