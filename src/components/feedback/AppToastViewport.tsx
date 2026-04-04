import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { APP_TOAST_EVENT, type AppToastPayload } from '@/lib/notify';
import { cn } from '@/lib/utils';

type ToastItem = AppToastPayload & { id: string };

const TONE = {
  success: {
    icon: CheckCircle2,
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  error: {
    icon: XCircle,
    classes: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  info: {
    icon: Info,
    classes: 'border-slate-300 bg-white text-slate-900',
  },
} as const;

export function AppToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const payload = (event as CustomEvent<AppToastPayload>).detail;
      const toast: ToastItem = { ...payload, id: crypto.randomUUID() };
      setToasts((current) => [toast, ...current].slice(0, 4));
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 3500);
    };

    window.addEventListener(APP_TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast as EventListener);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[100] mx-auto flex max-w-xl flex-col gap-2 px-3 sm:right-3 sm:left-auto sm:w-[420px] sm:px-0">
      {toasts.map((toast) => {
        const tone = TONE[toast.type];
        const Icon = tone.icon;

        return (
          <article key={toast.id} className={cn('pointer-events-auto rounded-xl border p-3 shadow-lg', tone.classes)}>
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-xs opacity-90">{toast.description}</p> : null}
              </div>
              <button type="button" className="rounded p-1 opacity-70 hover:opacity-100" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
