import api from '../axios';

export const settingsService = {
    // Firmeneinstellungen
    getCompany: async () => {
        const response = await api.get('/settings/company');
        return response.data;
    },
    updateCompany: async (data: any) => {
        const response = await api.put('/settings/company', data);
        return response.data;
    },
    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await api.post('/settings/company/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteLogo: async () => {
        const response = await api.delete('/settings/company/logo');
        return response.data;
    },
    testMailConnection: async (data: any) => {
        const response = await api.post('/settings/mail/test', data);
        return response.data;
    },

    // Stammdaten: Sprachen
    getLanguages: async () => {
        const response = await api.get('/settings/languages');
        return response.data;
    },
    createLanguage: async (data: any) => {
        const response = await api.post('/settings/languages', data);
        return response.data;
    },
    updateLanguage: async (id: number, data: any) => {
        const response = await api.put(`/settings/languages/${id}`, data);
        return response.data;
    },
    deleteLanguage: async (id: number) => {
        const response = await api.delete(`/settings/languages/${id}`);
        return response.data;
    },

    // Stammdaten: Dokumenttypen
    getDocTypes: async () => {
        const response = await api.get('/settings/document-types');
        return response.data;
    },
    createDocType: async (data: any) => {
        const response = await api.post('/settings/document-types', data);
        return response.data;
    },
    updateDocType: async (id: number, data: any) => {
        const response = await api.put(`/settings/document-types/${id}`, data);
        return response.data;
    },
    deleteDocType: async (id: number) => {
        const response = await api.delete(`/settings/document-types/${id}`);
        return response.data;
    },

    // Stammdaten: Leistungsarten
    getServices: async () => {
        const response = await api.get('/settings/services');
        return response.data;
    },
    createService: async (data: any) => {
        const response = await api.post('/settings/services', data);
        return response.data;
    },
    updateService: async (id: number, data: any) => {
        const response = await api.put(`/settings/services/${id}`, data);
        return response.data;
    },
    deleteService: async (id: number) => {
        const response = await api.delete(`/settings/services/${id}`);
        return response.data;
    },

    // Stammdaten: E-Mail-Vorlagen
    getEmailTemplates: async () => {
        const response = await api.get('/settings/email-templates');
        return response.data;
    },
    createEmailTemplate: async (data: any) => {
        const response = await api.post('/settings/email-templates', data);
        return response.data;
    },
    updateEmailTemplate: async (id: number, data: any) => {
        const response = await api.put(`/settings/email-templates/${id}`, data);
        return response.data;
    },
    deleteEmailTemplate: async (id: number) => {
        const response = await api.delete(`/settings/email-templates/${id}`);
        return response.data;
    },

    // Audit-Log
    getActivities: async () => {
        const response = await api.get('/settings/activities');
        return response.data;
    },
};
