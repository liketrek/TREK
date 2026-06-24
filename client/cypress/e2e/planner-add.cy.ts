// E2E: add a place in the planner, persist across reload.
function createTripAndOpenPlanner(title: string): void {
  cy.visit('/dashboard');
  cy.get('.add-trip-card').click();
  cy.get('.trek-modal-backdrop').within(() => {
    cy.get('input[type="text"]').first().type(title);
    cy.contains('button', 'Create New Trip').click();
  });
  cy.contains(title, { timeout: 15000 }).first().click();
  cy.location('pathname', { timeout: 20000 }).should('match', /\/trips\/\d+/);
  cy.get('.leaflet-container', { timeout: 20000 }).should('be.visible');
}

describe('Planner → add place → persists after reload', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('GET', '**/system-notices/active', { body: [] }); // suppress the welcome modal
  });

  it('adds a place in the planner that is still listed after a reload', () => {
    createTripAndOpenPlanner(`WAT AddPlace ${Date.now()}`);
    const placeName = `Colosseum ${Date.now()}`;

    // Pick the visible desktop "Add Place" button (a hidden mobile one comes first in the DOM).
    cy.get('button').filter(':visible').contains(/add place/i).click();
    cy.get('.trek-modal-backdrop')
      .should('be.visible')
      .within(() => {
        cy.get('input[required]').first().type(placeName);
        cy.contains('button', /^add$/i).click();
      });

    cy.contains(placeName, { timeout: 15000 }).should('exist');
    cy.reload();
    cy.contains(placeName, { timeout: 15000 }).should('exist');
  });
});
