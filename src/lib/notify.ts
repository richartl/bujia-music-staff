export type AppToastType = 'success' | 'error' | 'info';

export type AppToastPayload = {
  type: AppToastType;
  title: string;
  description?: string;
};

export const APP_TOAST_EVENT = 'app-toast';

export function notify(payload: AppToastPayload) {
  window.dispatchEvent(new CustomEvent<AppToastPayload>(APP_TOAST_EVENT, { detail: payload }));
}

export function notifySuccess(title: string, description?: string) {
  notify({ type: 'success', title, description });
}

export function notifyError(title: string, description?: string) {
  notify({ type: 'error', title, description });
}

export function notifyInfo(title: string, description?: string) {
  notify({ type: 'info', title, description });
}
