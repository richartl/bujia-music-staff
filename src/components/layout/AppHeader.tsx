import { memo } from 'react';
import { Settings2, X } from 'lucide-react';
import { WorkshopAvatar } from '@/components/avatars/WorkshopAvatar';
import { WorkshopSwitcher } from '@/features/workshops/components/WorkshopSwitcher';
import { UserAvatar } from '@/components/avatars/UserAvatar';
import { LogOut } from 'lucide-react';

type AppHeaderProps = {
  title: string;
  subtitle: string;
  workshopName?: string;
  workshopImageUrl?: string | null;
  workshopLogoUrl?: string | null;
  isWorkshopLoading?: boolean;
  isWorkshopError?: boolean;
  userEmail?: string;
  userProfileImageUrl?: string | null;
  mobilePanelOpen: boolean;
  onToggleMobilePanel: () => void;
  onLogout: () => void;
};

export const AppHeader = memo(function AppHeader({
  title,
  subtitle,
  workshopName,
  workshopImageUrl,
  workshopLogoUrl,
  isWorkshopLoading = false,
  isWorkshopError = false,
  userEmail,
  userProfileImageUrl,
  mobilePanelOpen,
  onToggleMobilePanel,
  onLogout,
}: AppHeaderProps) {
  const hasWorkshop = Boolean(workshopName);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur">
      <div className="mx-auto max-w-7xl md:hidden">
        <div className="relative h-14 px-3">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {isWorkshopLoading ? (
              <span className="block h-8 w-8 animate-pulse rounded-full bg-slate-700" aria-label="Cargando taller" />
            ) : (
              <WorkshopAvatar
                name={isWorkshopError ? 'Taller' : workshopName}
                profileImageUrl={isWorkshopError ? null : workshopImageUrl}
                logoUrl={isWorkshopError ? null : workshopLogoUrl}
                size="sm"
              />
            )}
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              className="btn-secondary h-9 min-w-9 border-slate-700 bg-slate-900 px-2 text-slate-100 hover:bg-slate-800"
              onClick={onToggleMobilePanel}
              aria-expanded={mobilePanelOpen}
              aria-controls="mobile-options-panel"
              aria-label={mobilePanelOpen ? 'Cerrar opciones' : 'Abrir opciones'}
            >
              {mobilePanelOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between gap-4 px-4 md:flex">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-white">{title}</div>
          <div className="truncate text-xs text-slate-300">{subtitle}</div>
        </div>

        <div className="flex items-center gap-3">
          {hasWorkshop ? (
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-2.5 py-1.5 lg:flex">
              <WorkshopAvatar
                name={isWorkshopError ? 'Taller' : workshopName}
                profileImageUrl={isWorkshopError ? null : workshopImageUrl}
                logoUrl={isWorkshopError ? null : workshopLogoUrl}
                size="sm"
              />
              <span className="max-w-[150px] truncate text-xs text-slate-200">{workshopName}</span>
            </div>
          ) : null}
          <WorkshopSwitcher />
          <UserAvatar email={userEmail} profileImageUrl={userProfileImageUrl} size="sm" />
          <button type="button" className="btn-secondary gap-2" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
});
