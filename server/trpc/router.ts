import { router } from './init.js';
import { authRouter } from '../routers/auth.js';
import { canvasRouter } from '../routers/canvas.js';
import { socialRouter } from '../routers/social.js';
import { userRouter } from '../routers/user.js';

export const appRouter = router({
  auth: authRouter,
  canvas: canvasRouter,
  social: socialRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
