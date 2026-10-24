// The policy lives in @trek/shared so the forms can check a password the same way
// while it is typed (#1200); the server keeps enforcing it from here.
export { validatePassword } from '@trek/shared';
