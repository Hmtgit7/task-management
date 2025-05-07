'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { useState } from 'react';

// Create a client
const QueryProvider = ({ children }: { children: React.ReactNode }) => {
    // Create a client per request in SSR to avoid shared state issues
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,
                staleTime: 5 * 60 * 1000, // 5 minutes
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default QueryProvider;