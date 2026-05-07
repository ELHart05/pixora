import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import './lib/passport.js'; // register strategies
import { authRouter } from './routes/oauth.js';

const app = express();

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, '');
}

function isAllowedVercelOrigin(origin: string) {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
]
  .map((v) => (v ? normalizeOrigin(v) : ''))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173');
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header) and allowed browser origins.
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      if (isAllowedVercelOrigin(normalized)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// OAuth redirect routes (passport callbacks — not tRPC)
app.use('/api/auth', authRouter);

// tRPC API
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Pixora API ready at http://localhost:${PORT}`);
});
