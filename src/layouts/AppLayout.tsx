import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authStore } from '@/stores/auth-store';
import { AppShellNav } from '@/components/AppShellNav';
import { WorkshopSwitcher } from '@/features/workshops/components/WorkshopSwitcher';
import { LogOut, Settings2, X } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    setMobilePanelOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleMobilePanel() {
    setMobilePanelOpen((current) => !current);
  }

  function closeMobilePanel() {
    setMobilePanelOpen(false);
  }
  const userInitials = (user?.email || 'US')
    .split('@')[0]
    .split('.')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
      <header className="border-b border-slate-200 bg-white md:sticky md:top-0 md:z-30 md:bg-white/95 md:backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-4">
          <div className="min-w-0">
            <div className="truncate text-base font-bold sm:text-lg">Staff Platform</div>
            <div className="truncate text-xs text-slate-500 sm:text-sm">
              Operación rápida de taller
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-3">
            <WorkshopSwitcher />
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.email} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                {userInitials || 'US'}
              </span>
            )}
            <button type="button" className="btn-secondary gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>

          <button
            type="button"
            className="btn-secondary gap-2 md:hidden"
            onClick={toggleMobilePanel}
            aria-expanded={mobilePanelOpen}
            aria-controls="mobile-options-panel"
          >
            {mobilePanelOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            {mobilePanelOpen ? 'Cerrar' : 'Opciones'}
          </button>
        </div>
      </header>

      {mobilePanelOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={closeMobilePanel}
        >
          <div
            id="mobile-options-panel"
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user.email} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    {userInitials || 'US'}
                  </span>
                )}
                <div className="min-w-0">
                <div className="truncate font-semibold">{user?.email}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {user?.role}
                </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary p-3"
                onClick={closeMobilePanel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Taller activo
                </div>
                <WorkshopSwitcher />
              </div>

              <button
                type="button"
                className="btn-secondary w-full justify-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-4 md:grid-cols-[260px_1fr] md:px-4">
        <aside className="hidden md:block md:sticky md:top-24 md:h-fit">
          <div className="card p-3">
            <div className="mb-4 flex items-center gap-2 px-2">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.email} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {userInitials || 'US'}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user?.email}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</div>
              </div>
            </div>
            <AppShellNav />
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto max-w-7xl">
          <AppShellNav />
        </div>
      </div>
    </div>
  );
}
