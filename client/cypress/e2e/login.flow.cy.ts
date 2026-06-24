// The login flow rejects bad credentials.
describe('login flow', () => {
  it('shows an error for invalid credentials and stays on /login', () => {
    // given
    cy.visit('/login');

    // when
    cy.get('input[type="email"]').type('nobody@example.com');
    cy.get('input[type="password"]').type('WrongPassword1!');
    cy.get('button[type="submit"]').click();

    // then
    cy.contains(/invalid email or password/i).should('be.visible');
    cy.location('pathname').should('include', '/login');
  });
});
