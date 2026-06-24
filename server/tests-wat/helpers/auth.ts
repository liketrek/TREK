// Mints the trek_session JWT the JwtAuthGuard expects, signed with the test secret.
import jwt from 'jsonwebtoken';
import { CONFIG_MOCK } from './config-mock';

export function generateToken(userId: number, extraClaims: Record<string, unknown> = {}): string {
  return jwt.sign({ id: userId, ...extraClaims }, CONFIG_MOCK.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

// Cookie header for supertest: .set('Cookie', authCookie(user.id)).
export function authCookie(userId: number): string {
  return `trek_session=${generateToken(userId)}`;
}
