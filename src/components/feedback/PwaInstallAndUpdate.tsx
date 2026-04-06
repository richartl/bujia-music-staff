import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { notifyInfo } from '@/lib/notify';
import { registerServiceWorker, type ServiceWorkerUpdateEvent } from '@/pwa/registerServiceWorker';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function PwaInstallAndUpdate() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [updateEvent, setUpdateEvent] = useState<ServiceWorkerUpdateEvent | null>(null);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());

    registerServiceWorker({
      onUpdate: (event) => {
        setUpdateEvent(event);
        notifyInfo('Hay una nueva versión disponible', 'Actualiza para usar la versión más reciente.');
      },
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      notifyInfo('App instalada', 'BujiOps ya puede abrirse como aplicación.');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onAppInstalled);

    if (!isStandaloneMode() && isIosDevice()) {
      const hidden = window.localStorage.getItem('pwa-ios-help-hidden') === '1';
      setShowIosHelp(!hidden);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismissIosHelp = () => {
    setShowIosHelp(false);
    window.localStorage.setItem('pwa-ios-help-hidden', '1');
  };

  const applyUpdate = () => {
    if (!updateEvent) return;

    updateEvent.waiting.postMessage({ type: 'SKIP_WAITING' });

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.location.reload();
      },
      { once: true },
    );
  };

  return (
    <>
      {!isStandalone && deferredPrompt ? (
        <button
          type="button"
          onClick={installApp}
          className="fixed left-1/2 z-[90] inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 shadow-lg shadow-slate-950/40 md:right-3 md:left-auto md:translate-x-0 md:text-xs"
          style={{ bottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
        >
          <Download className="h-4 w-4" />
          Instalar app
        </button>
      ) : null}

      {!isStandalone && !deferredPrompt && showIosHelp ? (
        <div className="fixed left-3 right-3 z-[90] rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-slate-100 shadow-lg md:hidden" style={{ bottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
          <p className="text-sm font-semibold">Agregar app</p>
          <p className="mt-1 text-xs text-slate-300">En Safari toca compartir y luego “Agregar a inicio”.</p>
          <button type="button" className="btn-secondary mt-2 h-8 px-3 text-xs" onClick={dismissIosHelp}>
            Entendido
          </button>
        </div>
      ) : null}

      {updateEvent ? (
        <div className="fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[90] max-w-xs rounded-xl border border-blue-300 bg-blue-50 p-3 text-slate-900 shadow-lg">
          <p className="text-sm font-semibold">Nueva versión disponible</p>
          <p className="mt-1 text-xs text-slate-700">Actualiza para recibir correcciones y mejoras.</p>
          <button
            type="button"
            onClick={applyUpdate}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recargar
          </button>
        </div>
      ) : null}
    </>
  );
}
