// E2E: create a trip from the dashboard, persist across reload.
describe('Dashboard → create trip → planner', () => {
  beforeEach(() => {
    cy.login();
    cy.intercept('GET', '**/system-notices/active', { body: [] }); // suppress the welcome modal
    cy.visit('/dashboard');
  });

  it('creates a trip from the dashboard and it survives a reload', () => {
    const title = `WAT Trip ${Date.now()}`;

    cy.get('.add-trip-card').click();
    cy.get('.trek-modal-backdrop')
      .should('be.visible')
      .within(() => {
        cy.get('input[type="text"]').first().type(title);
        cy.contains('button', 'Create New Trip').click();
      });

    // exist, not visible — the dashboard hero title trips Cypress's visibility check.
    cy.contains(title, { timeout: 15000 }).should('exist');
    cy.reload();
    cy.contains(title, { timeout: 15000 }).should('exist');
  });

  it('opens the created trip and the planner map mounts', () => {
    const title = `WAT Planner ${Date.now()}`;

    cy.get('.add-trip-card').click();
    cy.get('.trek-modal-backdrop').within(() => {
      cy.get('input[type="text"]').first().type(title);
      cy.contains('button', 'Create New Trip').click();
    });

    cy.contains(title, { timeout: 15000 }).first().click();

    cy.location('pathname', { timeout: 20000 }).should('match', /\/trips\/\d+/);
    cy.get('.leaflet-container', { timeout: 20000 }).should('be.visible');
  });
});
