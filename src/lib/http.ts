import axios from 'axios';
import { env } from '@/config/env';
import { authStore } from '@/stores/auth-store';

export const http = axios.create({
  baseURL: env.apiBaseUrl,
});

http.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
