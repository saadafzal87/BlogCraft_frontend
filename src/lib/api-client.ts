import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (response.config.method !== 'get' && response.data?.message) {
      toast.success(response.data.message);
    } else if (response.config.method === 'post' && response.config.url?.includes('/auth/login')) {
      toast.success('Successfully signed in');
    } else if (response.config.method === 'post' && response.config.url?.includes('/auth/register')) {
      toast.success('Account created successfully');
    } else if (response.config.method === 'post' && response.config.url?.includes('/auth/logout')) {
      toast.success('Signed out');
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const is401 = error.response?.status === 401;
    const isTokenExpired = (error.response?.data as { code?: string })?.code === 'TOKEN_EXPIRED';
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh');

    if (!isRefreshEndpoint && !originalRequest?._retry) {
      if (error.response?.data) {
        const errData = error.response.data as { message?: string };
        toast.error(errData.message || 'An error occurred');
      } else {
        toast.error(error.message || 'Network Error');
      }
    }

    if (is401 && isRefreshEndpoint) {
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    if (is401 && isTokenExpired && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) throw new Error('No refresh token');

        const { data } = await api.post<{
          success: boolean;
          accessToken: string;
          refreshToken: string;
          accessTokenExpiresAt: string;
        }>("/auth/refresh", {
          refreshToken: storedRefreshToken,
        });

        const newToken = data.accessToken;
        setAccessToken(newToken);
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('accessTokenExpiresAt', data.accessTokenExpiresAt);

        window.dispatchEvent(new CustomEvent('auth:refresh', {
          detail: {
            accessToken: newToken,
            accessTokenExpiresAt: data.accessTokenExpiresAt
          }
        }));

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
