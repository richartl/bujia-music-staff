import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authStore } from '@/stores/auth-store';
import { AppShellNav } from '@/components/AppShellNav';
import { WorkshopSwitcher } from '@/features/workshops/components/WorkshopSwitcher';
import { LogOut, Settings2, X } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <div className="text-lg font-bold">Staff Platform</div>
            <div className="text-sm text-slate-500">Operación rápida de taller</div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-3">
            <WorkshopSwitcher />
            <button
              className="btn-secondary gap-2"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>

          <button
            type="button"
            className="btn-secondary gap-2 md:hidden"
            onClick={() => setMobilePanelOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
            Opciones
          </button>
        </div>
      </header>

      {mobilePanelOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setMobilePanelOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{user?.email}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</div>
              </div>

              <button
                type="button"
                className="btn-secondary p-3"
                onClick={() => setMobilePanelOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <WorkshopSwitcher />

              <button
                className="btn-secondary w-full gap-2"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 md:grid-cols-[260px_1fr]">
        <aside className="hidden md:block md:sticky md:top-24 md:h-fit">
          <div className="card p-3">
            <div className="mb-4 px-2">
              <div className="text-sm font-semibold">{user?.email}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</div>
            </div>
            <AppShellNav />
          </div>
        </aside>

        <main className="space-y-4">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
        <AppShellNav />
      </div>
    </div>
  );
}
