import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { User } from '@prisma/client';
import { verifyJWT, COOKIE_NAME } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user: User | null = null;

  const token: string | undefined = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyJWT(token);
      user = await prisma.user.findUnique({ where: { id: payload.userId } });
    } catch {
      // Invalid or expired token — treat as unauthenticated
    }
  }

  return { user, req, res, prisma };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
