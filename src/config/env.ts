type RuntimeConfig = {
  VITE_API_BASE_URL?: string;
  VITE_APP_NAME?: string;
  VITE_ENABLE_PROFILE_IMAGE_EDITING?: string;
};

const runtimeConfig: RuntimeConfig | undefined =
  typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined;

const getEnv = (key: keyof RuntimeConfig, fallback: string): string => {
  const runtimeValue = runtimeConfig?.[key];
  if (runtimeValue && runtimeValue.trim().length > 0) {
    return runtimeValue;
  }

  const buildTimeValue = import.meta.env[key];
  if (typeof buildTimeValue === 'string' && buildTimeValue.trim().length > 0) {
    return buildTimeValue;
  }

  return fallback;
};

const getBooleanEnv = (key: keyof RuntimeConfig, fallback = false) => {
  const value = getEnv(key, fallback ? 'true' : 'false').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
};

export const env = {
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:3000'),
  appName: getEnv('VITE_APP_NAME', 'Staff Platform'),
  enableProfileImageEditing: getBooleanEnv('VITE_ENABLE_PROFILE_IMAGE_EDITING', false),
};
