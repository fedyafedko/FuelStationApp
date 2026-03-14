import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { authApi } from './auth.api';
import { useAuthStore } from '../store/authStore';
import type { AuthSuccessDTO } from '../types/api.types';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: Error | null,
  newTokens: AuthSuccessDTO | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(newTokens);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosInstance(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { accessToken, refreshToken } = useAuthStore.getState();

    if (!refreshToken) {
      await useAuthStore.getState().logout();
      processQueue(new Error('No refresh token'), null);
      isRefreshing = false;

      // 🔥 редірект у вебі
      window.location.href = '/sign-in';

      return Promise.reject(error);
    }

    try {
      const { data } = await authApi.refreshToken({
        accessToken: accessToken!,
        refreshToken,
      });

      await useAuthStore
        .getState()
        .setTokens(data.accessToken, data.refreshToken);

      processQueue(null, data);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);

      await useAuthStore.getState().logout();

      window.location.href = '/sign-in';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;