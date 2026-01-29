import axios from 'axios';

const api = axios.create({
    // Use relative path for Vite proxy in development
    baseURL: '/api',
    withCredentials: true, // Critical for CSRF cookie support
});

// CSRF Token Management
let csrfToken: string | null = null;

const fetchCsrfToken = async (): Promise<string | null> => {
    try {
        const { data } = await api.get('/csrf-token');
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        return null;
    }
};

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add CSRF token to POST/PUT/DELETE/PATCH requests
api.interceptors.request.use(
    async (config) => {
        const method = config.method?.toLowerCase();
        if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
            if (!csrfToken) {
                await fetchCsrfToken();
            }
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle CSRF token errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If CSRF token is invalid, refresh it and retry
        if (error.response?.status === 403 && error.response?.data?.code === 'EBADCSRFTOKEN' && !originalRequest._retry) {
            originalRequest._retry = true;
            csrfToken = null; // Clear old token
            await fetchCsrfToken();
            if (csrfToken) {
                originalRequest.headers['X-CSRF-Token'] = csrfToken;
                return api(originalRequest);
            }
        }
        
        return Promise.reject(error);
    }
);

export { fetchCsrfToken };
export default api;
