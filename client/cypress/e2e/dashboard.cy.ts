// A logged-in session reaches the dashboard.
describe('authenticated dashboard', () => {
  beforeEach(() => {
    cy.login();
  });

  it('reaches the dashboard and renders the app chrome', () => {
    // when
    cy.visit('/dashboard');

    // then -> the navbar renders the TREK brand (desktop variant is the visible one)
    cy.location('pathname').should('include', '/dashboard');
    cy.get('img[alt="TREK"]:visible').first().should('be.visible');
  });
});
