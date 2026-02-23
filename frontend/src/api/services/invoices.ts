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
    download: async (id: number) => {
        const response = await api.get(`/invoices/${id}/download`, { responseType: 'blob' });
        return response;
    },
    downloadXml: async (id: number) => {
        const response = await api.get(`/invoices/${id}/download-xml`, { responseType: 'blob' });
        return response;
    },
    print: async (id: number) => {
        const response = await api.get(`/invoices/${id}/print`, { responseType: 'blob' });
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
};
