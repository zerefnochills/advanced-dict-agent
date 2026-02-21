import axios from 'axios';

// In production, use the full backend URL. In dev, use '/api' (Vite proxy handles it).
const API_BASE = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 by redirecting to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Only redirect if not already on login/signup/home
            const path = window.location.pathname;
            if (!['/login', '/signup', '/'].includes(path)) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Auth ──────────────────────────────────────────────

export interface SignupData {
    email: string;
    full_name: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface UserResponse {
    id: number;
    email: string;
    full_name: string;
    created_at: string;
    has_api_key: boolean;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: UserResponse;
}

export const authAPI = {
    signup: (data: SignupData) =>
        api.post<TokenResponse>('/auth/signup', data),

    login: (data: LoginData) =>
        api.post<TokenResponse>('/auth/login', data),

    me: () =>
        api.get<UserResponse>('/auth/me'),

    logout: () =>
        api.post('/auth/logout'),

    updateApiKey: (apiKey: string) =>
        api.put('/auth/api-key', { api_key: apiKey }),
};

// ─── Connections ───────────────────────────────────────

export interface ConnectionCreate {
    name: string;
    db_type: 'postgresql' | 'mysql' | 'sqlserver' | 'snowflake';
    host?: string;
    port?: number;
    database_name: string;
    username: string;
    password: string;
    config?: Record<string, unknown>;
}

export interface ConnectionResponse {
    id: string;
    name: string;
    db_type: string;
    host?: string;
    port?: number;
    database_name: string;
    username: string;
    is_active: boolean;
    last_tested?: string;
    created_at: string;
}

export interface TestConnectionResponse {
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
}

export const connectionsAPI = {
    test: (data: ConnectionCreate) =>
        api.post<TestConnectionResponse>('/connections/test', data),

    create: (data: ConnectionCreate) =>
        api.post<ConnectionResponse>('/connections', data),

    list: () =>
        api.get<ConnectionResponse[]>('/connections'),

    get: (id: string) =>
        api.get<ConnectionResponse>(`/connections/${id}`),

    delete: (id: string) =>
        api.delete(`/connections/${id}`),

    getTables: (id: string) =>
        api.get<{ tables: string[] }>(`/connections/${id}/tables`),
};

// ─── Dictionaries ──────────────────────────────────────

export interface DictionaryGenerate {
    connection_id: string;
    include_ai_descriptions?: boolean;
    include_quality_analysis?: boolean;
    include_sample_data?: boolean;
}

export interface DictionaryListItem {
    id: string;
    connection_id: string;
    database_name: string;
    total_tables: number;
    total_columns: number;
    generated_at: string;
}

export interface DictionaryResponse extends DictionaryListItem {
    metadata?: Record<string, unknown>;
    ai_descriptions?: Record<string, unknown>;
    quality_metrics?: Record<string, unknown>;
}

export const dictionariesAPI = {
    generate: (data: DictionaryGenerate) =>
        api.post('/dictionaries/generate', data),

    list: () =>
        api.get<DictionaryListItem[]>('/dictionaries'),

    get: (id: string) =>
        api.get<DictionaryResponse>(`/dictionaries/${id}`),

    delete: (id: string) =>
        api.delete(`/dictionaries/${id}`),

    exportJson: (id: string) =>
        api.get(`/dictionaries/${id}/export/json`, { responseType: 'blob' }),

    exportMarkdown: (id: string) =>
        api.get(`/dictionaries/${id}/export/markdown`, { responseType: 'blob' }),
};

// ─── Chat ──────────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface ChatQuery {
    dictionary_id: string;
    question: string;
    conversation_history?: ChatMessage[];
}

export interface SuggestedQuestion {
    question: string;
    category: string;
}

export interface ChatResponse {
    answer: string;
    suggested_questions: SuggestedQuestion[];
    context_used: boolean;
}

export const chatAPI = {
    query: (data: ChatQuery) =>
        api.post<ChatResponse>('/chat/query', data),

    getSuggestions: (dictionaryId: string) =>
        api.get<SuggestedQuestion[]>(`/chat/suggestions/${dictionaryId}`),
};

export default api;
