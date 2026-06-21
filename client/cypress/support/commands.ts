/// <reference types="cypress" />

// Logs in the seeded admin and caches the session with cy.session.
// The seeded admin starts with must_change_password=1, so the first login is followed by a forced password change.
// Credentials come from cypress.config env.
// Public flows (login/register pages) skip this.
Cypress.Commands.add('login', () => {
  const email = Cypress.env('seedEmail');
  const seedPassword = Cypress.env('seedPassword');
  const newPassword = Cypress.env('newPassword');

  cy.session('seeded-admin', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(seedPassword);
    cy.get('button[type="submit"]').click();

    // Forced password change renders two password fields (new + confirm).
    cy.get('body').then(($body) => {
      if ($body.find('input[type="password"]').length === 2) {
        cy.get('input[type="password"]').eq(0).type(newPassword);
        cy.get('input[type="password"]').eq(1).type(newPassword);
        cy.get('button[type="submit"]').click();
      }
    });

    cy.location('pathname', { timeout: 30000 }).should('include', '/dashboard');
  });
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
