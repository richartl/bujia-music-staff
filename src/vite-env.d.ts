/// <reference types="vite/client" />

type RuntimeConfig = {
  VITE_API_BASE_URL?: string;
  VITE_APP_NAME?: string;
};

interface Window {
  __APP_CONFIG__?: RuntimeConfig;
}
