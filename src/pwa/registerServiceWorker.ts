export type ServiceWorkerUpdateEvent = {
  waiting: ServiceWorker;
  registration: ServiceWorkerRegistration;
};

type RegisterCallbacks = {
  onUpdate?: (event: ServiceWorkerUpdateEvent) => void;
  onInstalled?: () => void;
};

export function registerServiceWorker(callbacks: RegisterCallbacks = {}) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        callbacks.onInstalled?.();

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller && registration.waiting) {
              callbacks.onUpdate?.({ waiting: registration.waiting, registration });
            }
          });
        });

        if (registration.waiting) {
          callbacks.onUpdate?.({ waiting: registration.waiting, registration });
        }
      })
      .catch((error) => {
        console.error('SW registration failed', error);
      });
  });
}
