'use client';

import { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { LazyReactQueryDevtools } from '@/components/lazy-components';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const enableDevtools = process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevelopment && enableDevtools && (
        <Suspense fallback={null}>
          <LazyReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
