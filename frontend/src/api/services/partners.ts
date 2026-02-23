import api from '../axios';

/** Mappt camelCase-Frontend-Felder auf snake_case-Backend-Felder. */
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
    },
    checkDuplicates: async (data: any) => {
        const mapped = mapPartnerToBackend(data);
        const response = await api.post('/partners/check-duplicates', mapped);
        return response.data;
    },
};
