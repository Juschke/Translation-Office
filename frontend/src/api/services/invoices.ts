import api from '../axios';

export const invoiceService = {
    getAll: async () => {
        const response = await api.get('/invoices');
        return response.data;
    },
    getNextNumber: async (year?: string) => {
        const response = await api.get('/invoices/next-number', { params: { year } });
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/invoices/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/invoices', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/invoices/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/invoices/${id}`);
        return response.data;
    },
    /** Übergang Entwurf → Ausgestellt (sperrt die Rechnung, GoBD-konform) */
    issue: async (id: number) => {
        const response = await api.post(`/invoices/${id}/issue`);
        return response.data;
    },
    /** Storno-Rechnung / Gutschrift erstellen (GoBD-Stornierungsworkflow) */
    cancel: async (id: number, reason?: string) => {
        const response = await api.post(`/invoices/${id}/cancel`, { reason });
        return response.data;
    },
    sendEmail: async (id: number) => {
        const response = await api.post(`/invoices/${id}/send`);
        return response.data;
    },
    generatePdf: async (id: number) => {
        const response = await api.post(`/invoices/${id}/generate-pdf`);
        return response.data;
    },
    download: async (id: number, rebuild?: boolean) => {
        const response = await api.get(`/invoices/${id}/download`, {
            params: { rebuild: rebuild ? 1 : undefined },
            responseType: 'blob'
        });
        return response;
    },
    downloadXml: async (id: number) => {
        const response = await api.get(`/invoices/${id}/download-xml`, { responseType: 'blob' });
        return response;
    },
    print: async (id: number, rebuild?: boolean) => {
        const response = await api.get(`/invoices/${id}/print`, {
            params: { rebuild: rebuild ? 1 : undefined },
            responseType: 'blob'
        });
        return response;
    },
    bulkUpdate: async (ids: number[], data: any) => {
        const response = await api.post('/invoices/bulk-update', { ids, data });
        return response.data;
    },
    datevExport: async (ids: number[]) => {
        const response = await api.post('/invoices/datev-export', { ids }, { responseType: 'blob' });
        return response;
    },
    getAuditLogs: async (id: number) => {
        const response = await api.get(`/invoices/${id}/audit-logs`);
        return response.data;
    },
    gobdExport: async (params: { date_from?: string; date_to?: string; ids?: number[] }) => {
        const response = await api.post('/invoices/gobd-export', params, { responseType: 'blob' });
        return response;
    },
};

export const dunningService = {
    getList: async (params?: { customer_id?: number; reminder_level?: number }) => {
        const response = await api.get('/dunning', { params });
        return response.data;
    },
    sendReminder: async (invoiceId: number, notes?: string) => {
        const response = await api.post(`/dunning/${invoiceId}/send`, { notes });
        return response.data;
    },
    downloadPdf: async (invoiceId: number, logId: number): Promise<Blob> => {
        const response = await api.get(`/dunning/${invoiceId}/logs/${logId}/pdf`, { responseType: 'blob' });
        return response.data;
    },
    getSettings: async () => {
        const response = await api.get('/dunning/settings');
        return response.data;
    },
    updateSettings: async (data: any) => {
        const response = await api.put('/dunning/settings', data);
        return response.data;
    },
};

export const recurringInvoiceService = {
    getAll: async () => {
        const response = await api.get('/recurring-invoices');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/recurring-invoices', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/recurring-invoices/${id}`, data);
        return response.data;
    },
    pause: async (id: number) => {
        const response = await api.post(`/recurring-invoices/${id}/pause`);
        return response.data;
    },
    activate: async (id: number) => {
        const response = await api.post(`/recurring-invoices/${id}/activate`);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/recurring-invoices/${id}`);
        return response.data;
    },
    executeNow: async (id: number) => {
        const response = await api.post(`/recurring-invoices/${id}/execute-now`);
        return response.data;
    },
};
