import { router, publicProcedure } from '../trpc/init.js';
import { COOKIE_NAME } from '../lib/jwt.js';

const isProd = process.env.NODE_ENV === 'production';

export const authRouter = router({
  /** Returns the currently authenticated user, or null */
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    const { githubId: _g, googleId: _go, ...safe } = ctx.user;
    return safe;
  }),

  /** Clears the auth cookie (sign out) */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    return { ok: true };
  }),
});
