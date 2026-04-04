import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,   // 5 Minuten globaler Standard
            gcTime: 1000 * 60 * 10,      // 10 Minuten
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Statische Lookup-Daten — ändern sich kaum, 1 Stunde cachen
const STATIC_QUERY_KEYS: unknown[][] = [
    ['settings', 'languages'],
    ['settings', 'docTypes'],
    ['settings', 'services'],
    ['settings', 'specializations'],
    ['settings', 'units'],
    ['settings', 'currencies'],
    ['settings', 'projectStatuses'],
    ['emailTemplates'],
    ['mail', 'templates'],
    ['mail', 'signatures'],
];

STATIC_QUERY_KEYS.forEach(key => {
    queryClient.setQueryDefaults(key, { staleTime: 1000 * 60 * 60 }); // 1 Stunde
});

// Häufig verwendete Listen — 15 Minuten cachen
const LIST_QUERY_KEYS: unknown[][] = [
    ['customers'],
    ['partners'],
    ['companySettings'],
    ['mail', 'accounts'],
    ['team-users'],
];

LIST_QUERY_KEYS.forEach(key => {
    queryClient.setQueryDefaults(key, { staleTime: 1000 * 60 * 15 }); // 15 Minuten
});
