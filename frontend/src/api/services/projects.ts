import api from '../axios';

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
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress,
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
            responseType: 'blob',
        });
        return response;
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
    },
    downloadConfirmation: async (
        projectId: string,
        type: 'order_confirmation' | 'pickup_confirmation' | 'interpreter_confirmation',
    ) => {
        const response = await api.get(`/projects/${projectId}/confirmation/${type}`, {
            responseType: 'blob',
        });
        return response;
    },
};
