/// <reference types="vite/client" />

interface Window {
  __APP_CONFIG__?: {
    VITE_API_BASE_URL?: string;
    VITE_APP_NAME?: string;
  };
}
