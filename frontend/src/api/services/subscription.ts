import api from '../axios';

// ────────────────────────────────────────────────────────────────────────────
// Tenant-facing Subscription API (Read-Only)
// ────────────────────────────────────────────────────────────────────────────

export const subscriptionService = {
    /**
     * Aktuelle Subscription des Tenants abrufen.
     */
    getCurrent: async () => {
        const response = await api.get('/subscription');
        return response.data;
    },

    /**
     * Subscription-Historie des Tenants.
     */
    getHistory: async () => {
        const response = await api.get('/subscription/history');
        return response.data;
    },

    /**
     * Upgrade-Anfrage stellen.
     */
    requestUpgrade: async (data: {
        plan: string;
        billing_cycle: string;
        message?: string;
    }) => {
        const response = await api.post('/subscription/request-upgrade', data);
        return response.data;
    },

    /**
     * Zahlungsmethode anzeigen.
     */
    getPaymentMethod: async () => {
        const response = await api.get('/subscription/payment-method');
        return response.data;
    },

    /**
     * Rechnungen abrufen (Legacy).
     */
    getInvoices: async () => {
        const response = await api.get('/subscription/invoices');
        return response.data;
    },
};

// ────────────────────────────────────────────────────────────────────────────
// Admin Subscription API (Software Owner Only)
// ────────────────────────────────────────────────────────────────────────────

export const adminSubscriptionService = {
    /**
     * Alle Subscriptions auflisten (mit Filterung).
     */
    getAll: async (params?: {
        status?: string;
        plan?: string;
        expiring_soon?: boolean;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
        per_page?: number;
        page?: number;
    }) => {
        const response = await api.get('/admin/subscriptions', { params });
        return response.data;
    },

    /**
     * Subscription-Details abrufen.
     */
    getById: async (id: number) => {
        const response = await api.get(`/admin/subscriptions/${id}`);
        return response.data;
    },

    /**
     * Neue Subscription erstellen.
     */
    create: async (data: any) => {
        const response = await api.post('/admin/subscriptions', data);
        return response.data;
    },

    /**
     * Subscription aktualisieren.
     */
    update: async (id: number, data: any) => {
        const response = await api.put(`/admin/subscriptions/${id}`, data);
        return response.data;
    },

    /**
     * Subscription löschen.
     */
    delete: async (id: number) => {
        const response = await api.delete(`/admin/subscriptions/${id}`);
        return response.data;
    },

    /**
     * Subscription stornieren.
     */
    cancel: async (id: number) => {
        const response = await api.post(`/admin/subscriptions/${id}/cancel`);
        return response.data;
    },

    /**
     * Subscription reaktivieren.
     */
    resume: async (id: number) => {
        const response = await api.post(`/admin/subscriptions/${id}/resume`);
        return response.data;
    },

    /**
     * Statistiken abrufen.
     */
    getStats: async () => {
        const response = await api.get('/admin/subscriptions/stats');
        return response.data;
    },
};
