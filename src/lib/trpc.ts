import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from '../../server/trpc/router';

// Fully typed tRPC client — AppRouter type is stripped at build time, no server code ships to the browser
export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      // Send credentials (httpOnly cookie) with every request
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
    }),
  ],
});
