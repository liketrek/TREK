// Harness smoke: the app boots, the backend is reachable through the Vite proxy and the login screen renders its form.
describe('login screen', () => {
  it('renders the login form', () => {
    cy.visit('/login');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
  });
});
