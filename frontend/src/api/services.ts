import api from './axios';

export const dashboardService = {
    getStats: async (params?: any) => {
        const response = await api.get('/dashboard/stats', { params });
        return response.data;
    }
};
export const customerService = {
    getAll: async () => {
        const response = await api.get('/customers');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/customers', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    },
    bulkUpdate: async (ids: number[], data: any) => {
        const response = await api.post('/customers/bulk-update', { ids, data });
        return response.data;
    },
    bulkDelete: async (ids: number[]) => {
        const response = await api.post('/customers/bulk-delete', { ids });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/customers/stats');
        return response.data;
    }
};

export const projectService = {
    getAll: async (params?: any) => {
        const response = await api.get('/projects', { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/projects', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/projects/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },
    bulkUpdate: async (ids: string[], data: any) => {
        const response = await api.post('/projects/bulk-update', { ids, data });
        return response.data;
    },
    bulkDelete: async (ids: string[]) => {
        const response = await api.post('/projects/bulk-delete', { ids });
        return response.data;
    },
    uploadFile: async (id: string, formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
        const response = await api.post(`/projects/${id}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress
        });
        return response.data;
    },
    updateFile: async (projectId: string, fileId: string, data: any) => {
        const response = await api.put(`/projects/${projectId}/files/${fileId}`, data);
        return response.data;
    },
    deleteFile: async (projectId: string, fileId: string) => {
        const response = await api.delete(`/projects/${projectId}/files/${fileId}`);
        return response.data;
    },
    downloadFile: async (projectId: string, fileId: string) => {
        const response = await api.get(`/projects/${projectId}/files/${fileId}/download`, {
            responseType: 'blob'
        });
        return response; // Return the full response to access headers if needed, or just data
    },
    invite: async (projectId: string, data: any) => {
        const response = await api.post(`/projects/${projectId}/invite`, data);
        return response.data;
    },
    generateDocument: async (projectId: string, type: 'confirmation' | 'pickup' | 'reminder') => {
        const response = await api.post(`/projects/${projectId}/generate-document`, { type });
        return response.data;
    },
    getActivities: async (projectId: string) => {
        const response = await api.get(`/projects/${projectId}/activities`);
        return response.data;
    },
    generateToken: async (projectId: string) => {
        const response = await api.post(`/projects/${projectId}/generate-token`);
        return response.data;
    },
    postMessage: async (projectId: string, content: string) => {
        const response = await api.post(`/projects/${projectId}/message`, { content });
        return response.data;
    }
};

const mapPartnerToBackend = (data: any) => {
    if (!data || typeof data !== 'object') return data;
    const mapped: any = { ...data };

    if (data.firstName !== undefined) mapped.first_name = data.firstName;
    if (data.lastName !== undefined) mapped.last_name = data.lastName;
    if (data.street !== undefined) mapped.address_street = data.street;
    if (data.houseNo !== undefined) mapped.address_house_no = data.houseNo;
    if (data.zip !== undefined) mapped.address_zip = data.zip;
    if (data.city !== undefined) mapped.address_city = data.city;
    if (data.taxId !== undefined) mapped.tax_id = data.taxId;
    if (data.bankName !== undefined) mapped.bank_name = data.bankName;
    if (data.priceMode !== undefined) mapped.price_mode = data.priceMode;
    if (data.unitRates !== undefined) mapped.unit_rates = data.unitRates;
    if (data.flatRates !== undefined) mapped.flat_rates = data.flatRates;
    if (data.paymentTerms !== undefined) mapped.payment_terms = parseInt(data.paymentTerms);

    if (data.domains !== undefined) {
        if (typeof data.domains === 'string') {
            mapped.domains = data.domains.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else {
            mapped.domains = data.domains;
        }
    }

    if (Array.isArray(data.emails)) {
        mapped.email = data.emails[0];
        mapped.additional_emails = data.emails.slice(1).filter(Boolean);
    }
    if (Array.isArray(data.phones)) {
        mapped.phone = data.phones[0];
        mapped.additional_phones = data.phones.slice(1).filter(Boolean);
    }

    return mapped;
};

export const partnerService = {
    getAll: async () => {
        const response = await api.get('/partners');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/partners/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const mapped = mapPartnerToBackend(data);
        const response = await api.post('/partners', mapped);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const mapped = mapPartnerToBackend(data);
        const response = await api.put(`/partners/${id}`, mapped);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/partners/${id}`);
        return response.data;
    },
    bulkUpdate: async (ids: number[], data: any) => {
        const mappedData = mapPartnerToBackend(data);
        const response = await api.post('/partners/bulk-update', { ids, data: mappedData });
        return response.data;
    },
    bulkDelete: async (ids: number[]) => {
        const response = await api.post('/partners/bulk-delete', { ids });
        return response.data;
    },
    getStats: async () => {
        const response = await api.get('/partners/stats');
        return response.data;
    }
};

export const invoiceService = {
    getAll: async () => {
        const response = await api.get('/invoices');
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
    /** Transition draft → issued (locks the invoice, GoBD) */
    issue: async (id: number) => {
        const response = await api.post(`/invoices/${id}/issue`);
        return response.data;
    },
    /** Create Storno-Rechnung / Gutschrift (GoBD cancel workflow) */
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
        const response = await api.get(`/invoices/${id}/download`, {
            responseType: 'blob'
        });
        return response;
    },
    print: async (id: number) => {
        const response = await api.get(`/invoices/${id}/print`, {
            responseType: 'blob'
        });
        return response;
    },
    bulkUpdate: async (ids: number[], data: any) => {
        const response = await api.post('/invoices/bulk-update', { ids, data });
        return response.data;
    },
    datevExport: async (ids: number[]) => {
        const response = await api.post('/invoices/datev-export', { ids }, {
            responseType: 'blob'
        });
        return response;
    }
};

export const settingsService = {
    getCompany: async () => {
        const response = await api.get('/settings/company');
        return response.data;
    },
    updateCompany: async (data: any) => {
        const response = await api.put('/settings/company', data);
        return response.data;
    },
    testMailConnection: async (data: any) => {
        const response = await api.post('/settings/mail/test', data);
        return response.data;
    },
    getLanguages: async () => {
        const response = await api.get('/settings/languages');
        return response.data;
    },
    getDocTypes: async () => {
        const response = await api.get('/settings/document-types');
        return response.data;
    },
    getServices: async () => {
        const response = await api.get('/settings/services');
        return response.data;
    },
    getEmailTemplates: async () => {
        const response = await api.get('/settings/email-templates');
        return response.data;
    },
    getActivities: async () => {
        const response = await api.get('/settings/activities');
        return response.data;
    },
    // Languages
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
    // Document Types
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
    // Services
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
    // Email Templates
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
    }
};

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post('/login', credentials);
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },
    register: async (data: any) => {
        const response = await api.post('/register', data);
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
        }
        return response.data;
    },
    logout: async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
    },
    me: async () => {
        const response = await api.get('/user');
        return response.data;
    },
    onboarding: async (data: any) => {
        const response = await api.post('/onboarding', data);
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await api.put('/user/profile', data);
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await api.put('/user/password', data);
        return response.data;
    }
};

export const mailService = {
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
    // Settings & Resources
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
    getTemplates: async () => {
        const response = await api.get('/mail/templates');
        return response.data;
    },
    createTemplate: async (data: any) => {
        const response = await api.post('/mail/templates', data);
        return response.data;
    },
    updateTemplate: async (id: number, data: any) => {
        const response = await api.put(`/mail/templates/${id}`, data);
        return response.data;
    },
    deleteTemplate: async (id: number) => {
        const response = await api.delete(`/mail/templates/${id}`);
        return response.data;
    },
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
    }
};

export const reportService = {
    getRevenue: async (params?: any) => {
        const response = await api.get('/reports/revenue', { params });
        return response.data;
    },
    getProfitMargin: async (params?: any) => {
        const response = await api.get('/reports/profit-margin', { params });
        return response.data;
    },
    getLanguageDistribution: async (params?: any) => {
        const response = await api.get('/reports/language-distribution', { params });
        return response.data;
    },
    getKPIs: async (params?: any) => {
        const response = await api.get('/reports/kpis', { params });
        return response.data;
    },
    getSummary: async (params?: any) => {
        const response = await api.get('/reports/summary', { params });
        return response.data;
    },
    getTopCustomers: async (params?: any) => {
        const response = await api.get('/reports/customers', { params });
        return response.data;
    },
    getProjectStatus: async (params?: any) => {
        const response = await api.get('/reports/project-status', { params });
        return response.data;
    }
};

export const subscriptionService = {
    updatePlan: async (plan: string) => {
        const response = await api.put('/subscription/plan', { plan });
        return response.data;
    },
    updatePaymentMethod: async (data: any) => {
        const response = await api.put('/subscription/payment-method', data);
        return response.data;
    },
    getInvoices: async () => {
        const response = await api.get('/subscription/invoices');
        return response.data;
    }
};

export const twoFactorService = {
    enable: async () => {
        const response = await api.post('/user/two-factor/enable');
        return response.data;
    },
    confirm: async (code: string) => {
        const response = await api.post('/user/two-factor/confirm', { code });
        return response.data;
    },
    disable: async (password: string) => {
        const response = await api.post('/user/two-factor/disable', { password });
        return response.data;
    },
    getRecoveryCodes: async () => {
        const response = await api.get('/user/two-factor/recovery-codes');
        return response.data;
    },
    regenerateRecoveryCodes: async () => {
        const response = await api.post('/user/two-factor/recovery-codes');
        return response.data;
    }
};

export const notificationService = {
    getAll: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    markAsRead: async (id: string) => {
        const response = await api.post(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.post('/notifications/read-all');
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    }
};

export const guestService = {
    getProject: async (token: string) => {
        const response = await api.get(`/guest/project/${token}`);
        return response.data;
    },
    postMessage: async (token: string, content: string, senderName?: string) => {
        const response = await api.post(`/guest/project/${token}/message`, { content, sender_name: senderName });
        return response.data;
    },
    uploadFile: async (token: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/guest/project/${token}/files`, formData);
        return response.data;
    },
    updateProject: async (token: string, data: any) => {
        const response = await api.put(`/guest/project/${token}`, data);
        return response.data;
    }
};
