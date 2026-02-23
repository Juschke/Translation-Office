import api from '../axios';

export const guestService = {
    getProject: async (token: string) => {
        const response = await api.get(`/guest/project/${token}`);
        return response.data;
    },
    postMessage: async (token: string, content: string, senderName?: string) => {
        const response = await api.post(`/guest/project/${token}/message`, {
            content,
            sender_name: senderName,
        });
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
    },
};
