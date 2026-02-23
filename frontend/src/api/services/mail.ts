import api from '../axios';

export const mailService = {
    // Nachrichten
    getAll: async (folder: string = 'inbox') => {
        const response = await api.get('/mails', { params: { folder } });
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/mails/${id}`);
        return response.data;
    },
    send: async (data: any) => {
        const response = await api.post('/mails/send', data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/mails/${id}`);
        return response.data;
    },
    markAsRead: async (id: number) => {
        const response = await api.post(`/mails/${id}/read`);
        return response.data;
    },
    sync: async () => {
        const response = await api.post('/mails/sync');
        return response.data;
    },

    // E-Mail-Konten
    getAccounts: async () => {
        const response = await api.get('/mail/accounts');
        return response.data;
    },
    createAccount: async (data: any) => {
        const response = await api.post('/mail/accounts', data);
        return response.data;
    },
    updateAccount: async (id: number, data: any) => {
        const response = await api.put(`/mail/accounts/${id}`, data);
        return response.data;
    },
    deleteAccount: async (id: number) => {
        const response = await api.delete(`/mail/accounts/${id}`);
        return response.data;
    },

    // E-Mail-Vorlagen (alias auf settingsService.getEmailTemplates)
    getTemplates: async () => {
        const response = await api.get('/settings/email-templates');
        return response.data;
    },
    createTemplate: async (data: any) => {
        const response = await api.post('/settings/email-templates', data);
        return response.data;
    },
    updateTemplate: async (id: number, data: any) => {
        const response = await api.put(`/settings/email-templates/${id}`, data);
        return response.data;
    },
    deleteTemplate: async (id: number) => {
        const response = await api.delete(`/settings/email-templates/${id}`);
        return response.data;
    },

    // Signaturen
    getSignatures: async () => {
        const response = await api.get('/mail/signatures');
        return response.data;
    },
    createSignature: async (data: any) => {
        const response = await api.post('/mail/signatures', data);
        return response.data;
    },
    updateSignature: async (id: number, data: any) => {
        const response = await api.put(`/mail/signatures/${id}`, data);
        return response.data;
    },
    deleteSignature: async (id: number) => {
        const response = await api.delete(`/mail/signatures/${id}`);
        return response.data;
    },
};
