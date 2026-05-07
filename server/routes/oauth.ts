import { Router, type Request, type Response } from 'express';
import passport from 'passport';
import type { User } from '@prisma/client';
import { signJWT, COOKIE_NAME, COOKIE_MAX_AGE } from '../lib/jwt.js';

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const isProd = process.env.NODE_ENV === 'production';

function normalizeUrl(value: string) {
  return value.replace(/\/$/, '');
}

function resolveFrontendUrl(req: Request) {
  const fromState = typeof req.query.state === 'string' ? req.query.state : '';
  const fromRedirect = typeof req.query.redirect === 'string' ? req.query.redirect : '';
  const candidate = fromState || fromRedirect || FRONTEND_URL;

  try {
    const url = new URL(candidate);
    return normalizeUrl(url.origin);
  } catch {
    return FRONTEND_URL;
  }
}

function setCookieAndRedirect(res: Response, user: User, frontendUrl: string) {
  const token = signJWT({ userId: user.id });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
  res.redirect(`${frontendUrl}?auth=success`);
}

export const authRouter = Router();

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
authRouter.get(
  '/github',
  (req: Request, res: Response, next) => {
    const frontendUrl = resolveFrontendUrl(req);
    passport.authenticate('github', {
      scope: ['user:email'],
      session: false,
      state: frontendUrl,
    })(req, res, next);
  }
);

authRouter.get('/github/callback', (req: Request, res: Response, next) => {
  const frontendUrl = resolveFrontendUrl(req);
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${frontendUrl}?auth=error`,
  })(req, res, (err: unknown) => {
    if (err) return next(err);
    setCookieAndRedirect(res, req.user as User, frontendUrl);
  });
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
authRouter.get(
  '/google',
  (req: Request, res: Response, next) => {
    const frontendUrl = resolveFrontendUrl(req);
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state: frontendUrl,
    })(req, res, next);
  }
);

authRouter.get('/google/callback', (req: Request, res: Response, next) => {
  const frontendUrl = resolveFrontendUrl(req);
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${frontendUrl}?auth=error`,
  })(req, res, (err: unknown) => {
    if (err) return next(err);
    setCookieAndRedirect(res, req.user as User, frontendUrl);
  });
});

// ── Logout (also handled via tRPC, but provide REST endpoint as fallback) ─────
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.json({ ok: true });
});
