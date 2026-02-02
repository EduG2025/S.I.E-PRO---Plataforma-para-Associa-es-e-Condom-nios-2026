import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sie_auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sie_auth_token');
            window.dispatchEvent(new Event('sie_unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: (creds: { username: string; password: string }) => api.post('/auth/login', creds),
    me: () => api.get('/auth/me'),
};

export const planService = {
    getAll: () => api.get('/plans'),
    getOne: (id: any) => api.get(`/plans/${id}`),
    create: (data: any) => api.post('/plans', data),
    update: (id: any, data: any) => api.put(`/plans/${id}`, data),
    delete: (id: any) => api.delete(`/plans/${id}`),
    getSubscriptions: () => api.get('/plans/subscriptions/all'),
    getMySubscription: () => api.get('/plans/my-subscription'),
    getUserSubscription: (userId: any) => api.get(`/plans/user/${userId}`),
    subscribe: (data: { user_id: any, plan_id: any }) => api.post('/plans/subscribe', data),
};

export const systemService = {
    getInfo: () => api.get('/settings/system'),
    updateInfo: (info: any) => api.put('/settings/system', info),
    getRoles: () => api.get('/settings/roles'),
    saveRole: (data: any) => api.post('/settings/roles', data),
    updateRole: (id: any, data: any) => api.put(`/settings/roles/${id}`, data),
    deleteRole: (id: any) => api.delete(`/settings/roles/${id}`),
    getPermissions: () => api.get('/settings/permissions'),
    togglePermission: (data: any) => api.post('/settings/permissions/toggle', data),
    getSustainabilityStats: () => api.get('/sustainability/stats'),
    logTacticalExport: (details: any) => api.post('/audit/log-export', details),
};

export const studioService = {
    getTokens: () => api.get('/settings/studio-tokens'),
    saveTokens: (tokens: any) => api.post('/settings/studio-tokens', tokens),
};

export const aiKeyService = {
    getAll: () => api.get('/settings/ai-keys'),
    create: (data: any) => api.post('/settings/ai-keys', data),
    update: (id: any, data: any) => api.put(`/settings/ai-keys/${id}`, data),
    delete: (id: any) => api.delete(`/settings/ai-keys/${id}`),
};

export const userService = {
    getAll: (page = 1, limit = 50, search = '') => api.get('/users', { params: { page, limit, search } }),
    update: (id: any, data: any) => api.put(`/users/${id}`, data),
    updateAvatar: (id: any, avatar_url: string) => api.patch(`/users/${id}/avatar`, { avatar_url }),
    create: (data: any) => api.post('/users', data),
    activate: (id: any) => api.post(`/users/${id}/activate`),
    delete: (id: any) => api.delete(`/users/${id}`),
    getDependents: (id: any) => api.get(`/users/${id}/dependents`),
};

export const censusService = {
    createProfile: (registryId: any, data: any) => api.post(`/surveys/profile/${registryId}`, data),
};

export const financialService = {
    getAll: (params?: any) => api.get('/financials', { params }),
    getDashboardStats: () => api.get('/financials/stats'),
    create: (data: any) => api.post('/financials', data),
    update: (id: any, data: any) => api.put(`/financials/${id}`, data),
    delete: (id: any) => api.delete(`/financials/${id}`),
};

export const aiService = {
    chat: (prompt: string, grounding?: { search?: boolean, maps?: boolean, location?: { lat: number, lng: number } }) => 
        api.post('/ai/chat', { 
            contents: prompt, 
            useSearch: grounding?.search, 
            useMaps: grounding?.maps, 
            location: grounding?.location 
        }),
    generateUserDossier: (id: any) => api.post(`/ai/dossier/${id}`),
    generateDocument: (prompt: string, context?: string) => api.post('/ai/generate-document', { prompt, context }),
    listPrompts: () => api.get('/ai/prompts'),
    createPrompt: (data: any) => api.post('/ai/prompts', data),
    deletePrompt: (id: any) => api.delete(`/ai/prompts/${id}`),
};

export const visualTemplateService = {
    getAll: () => api.get('/governance/visual-templates'),
    create: (data: any) => api.post('/governance/visual-templates', data),
    update: (id: any, data: any) => api.put(`/governance/visual-templates/${id}`, data),
    delete: (id: any) => api.delete(`/governance/visual-templates/${id}`),
};

export const mapService = {
    getUnits: () => api.get('/users', { params: { limit: 5000 } }),
    searchAdvanced: (query: string) => api.post('/users/search-neural', { query }),
    getSurveyResponses: () => api.get('/surveys/responses/all'),
};

export const demographicsService = {
    getStats: () => api.get('/demographics/stats'),
};

export const surveyService = {
    getAll: () => api.get('/surveys'),
    getResponsesByCpf: (cpf: string) => api.get(`/surveys/responses/cpf/${cpf}`),
    suggestQuestions: (data: any) => api.post('/surveys/suggest', data),
    create: (data: any) => api.post('/surveys', data),
    update: (id: any, data: any) => api.put(`/surveys/${id}`, data),
    delete: (id: any) => api.delete(`/surveys/${id}`),
};

export const communicationService = {
    getNotices: () => api.get('/communication/notices'),
    sendNotice: (data: any) => api.post('/communication/notices', data),
    updateNotice: (id: any, data: any) => api.put(`/communication/notices/${id}`, data),
    deleteNotice: (id: any) => api.delete(`/communication/notices/${id}`),
    getTemplates: () => api.get('/communication/templates'),
    saveTemplate: (data: any) => api.post('/communication/templates', data),
    deleteTemplate: (id: any) => api.delete(`/communication/templates/${id}`),
    getSchedules: () => api.get('/communication/schedules'),
    createSchedule: (data: any) => api.post('/communication/schedules', data),
    deleteSchedule: (id: any) => api.delete(`/communication/schedules/${id}`),
};

export const operationsService = {
    getIncidents: () => api.get('/incidents'),
    getHeatmap: () => api.get('/incidents/heatmap'),
    createIncident: (data: any) => api.post('/incidents', data),
    updateIncident: (id: any, data: any) => api.put(`/incidents/${id}`, data),
};

export const agendaService = {
    getAll: () => api.get('/agenda'),
    create: (data: any) => api.post('/agenda', data),
    update: (id: any, data: any) => api.put(`/agenda/${id}`, data),
    delete: (id: any) => api.delete(`/agenda/${id}`),
};

export const projectService = {
    getAll: () => api.get('/projects'),
    create: (data: any) => api.post('/projects', data),
    update: (id: any, data: any) => api.put(`/projects/${id}`, data),
    delete: (id: any) => api.delete(`/projects/${id}`),
};

export const marketplaceService = {
    getAll: () => api.get('/community/marketplace'),
    create: (data: any) => api.post('/community/marketplace', data),
    update: (id: any, data: any) => api.put(`/community/marketplace/${id}`, data),
    delete: (id: any) => api.delete(`/community/marketplace/${id}`),
};

export const cameraService = {
    getAll: () => api.get('/cameras'),
    create: (data: any) => api.post('/cameras', data),
    delete: (id: any) => api.delete(`/cameras/${id}`),
};

export const assetService = {
    getAll: () => api.get('/assets'),
    create: (data: any) => api.post('/assets', data),
    update: (id: any, data: any) => api.put(`/assets/${id}`, data),
    delete: (id: any) => api.delete(`/assets/${id}`),
};

export const documentService = {
    getAll: () => api.get('/governance/documents'),
    create: (data: any) => api.post('/governance/documents', data),
    update: (id: any, data: any) => api.put(`/governance/documents/${id}`, data),
    delete: (id: any) => api.delete(`/governance/documents/${id}`),
    getHistory: (id: any) => api.get(`/governance/documents/${id}/history`),
};

export const assemblyService = {
    getAll: () => api.get('/governance/assemblies'),
    create: (data: any) => api.post('/governance/assemblies', data),
    update: (id: any, data: any) => api.put(`/governance/assemblies/${id}`, data),
    delete: (id: any) => api.delete(`/governance/assemblies/${id}`),
};

export const suggestionService = {
    getAll: () => api.get('/community/suggestions'),
    create: (data: any) => api.post('/community/suggestions', data),
    update: (id: any, data: any) => api.put(`/community/suggestions/${id}`, data),
    delete: (id: any) => api.delete(`/community/suggestions/${id}`),
};

export const reservationService = {
    getAll: () => api.get('/community/reservations'),
    create: (data: any) => api.post('/community/reservations', data),
    delete: (id: any) => api.delete(`/community/reservations/${id}`),
};

export const unitService = {
    getAll: () => api.get('/units'),
};

export const storageService = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/storage/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export { api };
export default api;