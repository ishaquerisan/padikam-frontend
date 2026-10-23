import axios, { AxiosError } from 'axios';

const apiBaseUrl =
  import.meta.env.BASE_API_URL ||
  import.meta.env.VITE_BASE_API_URL ||
  '/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token if stored in memory/storage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('padikam_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to unwrap data and handle 401s
apiClient.interceptors.response.use(
  (response) => {
    // If backend uses TransformInterceptor, response.data has { success: true, data: ... }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      localStorage.removeItem('padikam_token');
      localStorage.removeItem('padikam_user');
      // Dispatch custom event for auth provider
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);
