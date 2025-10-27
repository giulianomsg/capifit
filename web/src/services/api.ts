import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { authStore } from '../store/auth';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

type AxiosRequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

const createRefreshPromise = () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken } = authStore.getState();

      if (!refreshToken) {
        return null;
      }

      try {
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const payload = response.data?.data ?? response.data;
        const nextAccessToken: string | null = payload?.accessToken ?? null;
        const nextRefreshToken: string | null = payload?.refreshToken ?? refreshToken;
        const user = payload?.user ?? authStore.getState().user ?? null;

        if (!nextAccessToken) {
          throw new Error('Refresh response missing access token');
        }

        authStore.setSession({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          user,
        });

        return nextAccessToken;
      } catch (error) {
        authStore.logout();
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = authStore.getState();

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;
    const originalRequest = config as AxiosRequestConfigWithRetry | undefined;

    if (!response || !originalRequest) {
      return Promise.reject(error);
    }

    if (response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await createRefreshPromise();

        if (newAccessToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest as AxiosRequestConfig);
        }

        authStore.logout();
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
