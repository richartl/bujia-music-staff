type RuntimeEnv = {
  VITE_API_BASE_URL?: string;
  VITE_APP_NAME?: string;
};

const runtimeEnv: RuntimeEnv =
  typeof window !== 'undefined' && window.__APP_CONFIG__
    ? window.__APP_CONFIG__
    : {};

export const env = {
  apiBaseUrl:
    runtimeEnv.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  appName: runtimeEnv.VITE_APP_NAME || import.meta.env.VITE_APP_NAME || 'Staff Platform',
};
