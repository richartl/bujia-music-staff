import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { authStore } from '@/stores/auth-store';
import { networkActivityStore } from '@/stores/network-activity-store';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
});

let requestSequence = 0;

type RequestMeta = {
  requestId?: string;
};

type TrackedRequestConfig = InternalAxiosRequestConfig & {
  metadata?: RequestMeta;
};

function withTrackingMetadata(config: InternalAxiosRequestConfig): TrackedRequestConfig {
  const tracked = config as TrackedRequestConfig;
  if (!tracked.metadata) tracked.metadata = {};
  return tracked;
}

apiClient.interceptors.request.use((rawConfig) => {
  const config = withTrackingMetadata(rawConfig);
  const requestId = `${Date.now()}-${requestSequence++}`;
  config.metadata!.requestId = requestId;
  networkActivityStore.getState().startRequest(requestId);

  const token = authStore.getState().token;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as TrackedRequestConfig;
    networkActivityStore.getState().endRequest(config.metadata?.requestId);
    return response;
  },
  (error) => {
    const config = error?.config as TrackedRequestConfig | undefined;
    networkActivityStore.getState().endRequest(config?.metadata?.requestId);

    const status = error?.response?.status;
    if (status === 401) {
      authStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
