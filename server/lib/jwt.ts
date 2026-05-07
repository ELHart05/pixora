import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change-in-production';
export const COOKIE_NAME = 'pixora_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export function signJWT(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJWT(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

export { COOKIE_MAX_AGE };
