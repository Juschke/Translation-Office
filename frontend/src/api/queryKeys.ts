/**
 * Zentrale Query-Key-Definitionen für TanStack React Query.
 *
 * Zweck:
 * - Verhindert typo-bedingte Cache-Fehlschläge (z.B. ['project'] vs ['projects'])
 * - Ermöglicht hierarchische Invalidierung (z.B. queryKeys.projects.all() invalidiert
 *   automatisch auch queryKeys.projects.detail() weil TanStack Query Präfixe matched)
 * - Single source of truth für alle Query-Keys in der Applikation
 */
export const queryKeys = {
  /** Dashboard-Statistiken (Kacheln + KPIs) */
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
  },

  /** Kunden-Queries */
  customers: {
    all: () => ['customers'] as const,
    detail: (id: number | string) => ['customers', id] as const,
    stats: () => ['customerStats'] as const,
    byProject: (customerId: number | string) =>
      ['projects', { customer_id: customerId }] as const,
  },

  /** Partner-Queries */
  partners: {
    all: () => ['partners'] as const,
    detail: (id: number | string) => ['partners', id] as const,
    stats: () => ['partnerStats'] as const,
  },

  /** Projekt-Queries */
  projects: {
    all: () => ['projects'] as const,
    active: () => ['projects', 'active'] as const,
    detail: (id: number | string) => ['projects', id] as const,
    activities: (id: number | string) => ['project-activities', id] as const,
    guest: (token: string) => ['guest_project', token] as const,
  },

  /** Rechnungs-Queries */
  invoices: {
    all: () => ['invoices'] as const,
  },

  /** Mail-Queries */
  mails: {
    inbox: () => ['mails', 'inbox'] as const,
    sent: () => ['mails', 'sent'] as const,
    accounts: () => ['mail', 'accounts'] as const,
    templates: () => ['mail', 'templates'] as const,
    all: () => ['mails'] as const,
  },

  /** Einstellungs-Queries */
  settings: {
    /** Firmeneinstellungen — früher teils ['companySettings'], teils ['settings','company'] */
    company: () => ['companySettings'] as const,
    languages: () => ['settings', 'languages'] as const,
    docTypes: () => ['settings', 'docTypes'] as const,
    services: () => ['settings', 'services'] as const,
    emailTemplates: () => ['emailTemplates'] as const,
  },

  /** Benachrichtigungen */
  notifications: {
    all: () => ['notifications'] as const,
  },

  /** Berichte */
  reports: {
    summary: (params: unknown) => ['reports', 'summary', params] as const,
    tax: (params: unknown) => ['reports', 'tax', params] as const,
    profitability: (params: unknown) => ['reports', 'profitability', params] as const,
  },

  /** Team-Verwaltung */
  team: {
    users: () => ['team-users'] as const,
  },

  /** Audit-Log / Aktivitäten */
  activities: {
    all: () => ['activities'] as const,
  },
} as const;
