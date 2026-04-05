import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { authStore } from '@/stores/auth-store';
import { AppShellNav } from '@/components/AppShellNav';
import { WorkshopSwitcher } from '@/features/workshops/components/WorkshopSwitcher';
import { BottomNav } from '@/components/navigation/BottomNav';
import { UserAvatar } from '@/components/avatars/UserAvatar';
import { WorkshopAvatar } from '@/components/avatars/WorkshopAvatar';
import { LogOut, X } from 'lucide-react';
import { useWorkshopBranding } from '@/features/settings/hooks/useProfileBranding';
import { AppHeader } from '@/components/layout/AppHeader';

const ROUTE_COPY: Record<string, { title: string; subtitle: string }> = {
  '/app/intakes': { title: 'Recepción', subtitle: 'Registro y control de entrada' },
  '/app/visits': { title: 'Órdenes', subtitle: 'Seguimiento de instrumentos en taller' },
  '/app/catalogs': { title: 'Catálogos', subtitle: 'Servicios, marcas y configuraciones' },
  '/app/settings': { title: 'Ajustes', subtitle: 'Usuarios, sesión y preferencias' },
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const { activeWorkshop, isLoading: isWorkshopLoading, isError: isWorkshopError } = useWorkshopBranding();

  useEffect(() => {
    setMobilePanelOpen(false);
  }, [location.pathname]);

  const routeMeta = useMemo(() => {
    const matched = Object.entries(ROUTE_COPY).find(([path]) => location.pathname.startsWith(path));
    return matched?.[1] ?? { title: 'Bujía Staff', subtitle: 'Operación del taller' };
  }, [location.pathname]);
  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200 pb-24 pt-16 md:pb-0 md:pt-20">
      <AppHeader
        title={routeMeta.title}
        subtitle={routeMeta.subtitle}
        workshopName={activeWorkshop?.name}
        workshopImageUrl={activeWorkshop?.profileImageUrl}
        workshopLogoUrl={activeWorkshop?.logoUrl}
        isWorkshopLoading={isWorkshopLoading}
        isWorkshopError={isWorkshopError}
        userEmail={user?.email}
        userProfileImageUrl={user?.profileImageUrl}
        mobilePanelOpen={mobilePanelOpen}
        onToggleMobilePanel={() => setMobilePanelOpen((current) => !current)}
        onLogout={handleLogout}
      />

      {mobilePanelOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setMobilePanelOpen(false)}>
          <div
            id="mobile-options-panel"
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <UserAvatar email={user?.email} profileImageUrl={user?.profileImageUrl} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{user?.email}</div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</div>
                </div>
              </div>

              <button type="button" className="btn-secondary p-3" onClick={() => setMobilePanelOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeWorkshop ? (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 p-2">
                <WorkshopAvatar
                  name={activeWorkshop.name}
                  profileImageUrl={activeWorkshop.profileImageUrl}
                  logoUrl={activeWorkshop.logoUrl}
                  size={activeWorkshop.profileImageUrl || activeWorkshop.logoUrl ? 'lg' : 'md'}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-amber-900">{activeWorkshop.name}</p>
                  <p className="text-[11px] uppercase tracking-wide text-amber-700">Taller activo</p>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Taller activo</div>
                <WorkshopSwitcher />
              </div>

              <button type="button" className="btn-secondary w-full justify-center gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-4 md:grid-cols-[260px_1fr] md:px-4">
        <aside className="hidden md:block md:sticky md:top-24 md:h-fit">
          <div className="card p-3 shadow-sm">
            <div className="mb-4 flex items-center gap-2 px-2">
              <UserAvatar email={user?.email} profileImageUrl={user?.profileImageUrl} size="md" />
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

      <BottomNav />
    </div>
  );
}
