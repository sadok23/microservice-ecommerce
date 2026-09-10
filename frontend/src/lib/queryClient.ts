import { QueryClient } from '@tanstack/react-query';

/**
 * Module-level singleton so React 19 StrictMode double-mounts share one client.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});