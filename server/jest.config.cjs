// Jest config for the WAT tests (server). Separate runner from the upstream Vitest suite, scoped to tests-wat so the two never overlap.

const swcOptions = {
  jsc: {
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
    keepClassNames: true,
    target: 'es2022',
  },
  module: { type: 'commonjs' },
};

// MCP SDK ships an exports map Jest can't resolve, so point at the CJS dist files.
const mcp = (p) =>
  `<rootDir>/../node_modules/@modelcontextprotocol/sdk/dist/cjs/${p}`;

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  roots: ['<rootDir>/tests-wat'],
  testEnvironment: 'node',
  testMatch: ['**/tests-wat/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests-wat/jest.env.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: { '^.+\\.(t|j)s$': ['@swc/jest', swcOptions] },
  // Some deps ship ESM-only builds that break Jest's CJS loader. Allow @swc/jest to transpile them.
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid|nanoid|jose|openid-client|oauth4webapi|@panva)/)',
    '\\.pnp\\.[^\\/]+$',
  ],
  moduleNameMapper: {
    // Source uses .js import specifiers that resolve to .ts files.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // isomorphic-dompurify pulls in jsdom (ESM @exodus/bytes). The endpoints under test don't sanitize HTML, so stub it.
    '^isomorphic-dompurify$': '<rootDir>/tests-wat/helpers/dompurify-stub.cjs',
    '^@trek/shared$': '<rootDir>/../shared/dist/index.cjs',
    '^@modelcontextprotocol/sdk/server/mcp$': mcp('server/mcp.js'),
    '^@modelcontextprotocol/sdk/server/streamableHttp$': mcp('server/streamableHttp.js'),
    '^@modelcontextprotocol/sdk/server/auth/router$': mcp('server/auth/router.js'),
    '^@modelcontextprotocol/sdk/server/auth/handlers/authorize$': mcp('server/auth/handlers/authorize.js'),
    '^@modelcontextprotocol/sdk/server/auth/handlers/register$': mcp('server/auth/handlers/register.js'),
    '^@modelcontextprotocol/sdk/server/auth/provider$': mcp('server/auth/provider.js'),
    '^@modelcontextprotocol/sdk/server/auth/clients$': mcp('server/auth/clients.js'),
    '^@modelcontextprotocol/sdk/server/auth/errors$': mcp('server/auth/errors.js'),
    '^@modelcontextprotocol/sdk/server/auth/types$': mcp('server/auth/types.js'),
    '^@modelcontextprotocol/sdk/shared/auth$': mcp('shared/auth.js'),
  },
  coverageDirectory: '<rootDir>/coverage-wat',
  collectCoverageFrom: ['src/**/*.ts'],
  testTimeout: 20000,
};
