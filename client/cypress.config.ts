import { defineConfig } from 'cypress';

// Cypress E2E for the WAT tests.
// Drives the Vite dev server on :5173 (which proxies /api and /ws to the backend) against the isolated seeded backend on :3001 from e2e/server-launch.mjs.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: false,
    video: false,
    defaultCommandTimeout: 10000,
    setupNodeEvents() {},
  },
  // Seeded admin credentials (match e2e/server-launch.mjs).
  // Override with CYPRESS_seedEmail / CYPRESS_seedPassword env vars if needed.
  env: {
    seedEmail: 'e2e@trek.local',
    seedPassword: 'E2eTest12345!',
    newPassword: 'E2eChanged12345!',
  },
});
