/// <reference types="cypress" />

// Logs in the seeded admin (incl. the forced first-login password change) and caches the session.
Cypress.Commands.add('login', () => {
  const email = Cypress.env('seedEmail');
  const seedPassword = Cypress.env('seedPassword');
  const newPassword = Cypress.env('newPassword');

  cy.session(
    'seeded-admin',
    () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(seedPassword);
      cy.get('button[type="submit"]').click();

      // Forced change-password screen (new + confirm). Wait for it to render, then submit.
      cy.get('input[type="password"]', { timeout: 15000 }).should('have.length', 2);
      cy.get('input[type="password"]').eq(0).type(newPassword);
      cy.get('input[type="password"]').eq(1).type(newPassword);
      cy.get('button[type="submit"]').click();

      cy.location('pathname', { timeout: 30000 }).should('include', '/dashboard');
    },
    // Cache across specs so the one-time password change runs once per run.
    { cacheAcrossSpecs: true },
  );
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}

export {};
