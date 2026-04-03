import { authStore } from '@/stores/auth-store';
import { useCurrentUserProfileImage, useWorkshopBranding } from '@/features/settings/hooks/useProfileBranding';
import { UserAvatarUploader } from '@/features/settings/components/UserAvatarUploader';
import { WorkshopAvatarUploader } from '@/features/settings/components/WorkshopAvatarUploader';

export function SettingsPage() {
  const user = authStore((state) => state.user);
  const { profileImageUrl } = useCurrentUserProfileImage();
  const { activeWorkshop, isLoading } = useWorkshopBranding();
  const canEditWorkshop = ['ADMIN', 'OWNER'].includes((activeWorkshop?.role || '').toUpperCase());

  return (
    <div className="space-y-3">
      <div className="card p-5">
        <h1 className="section-title">Ajustes del staff platform</h1>
        <p className="mt-2 text-sm text-slate-500">
          Perfil visual de usuario y taller para mantener una identidad clara en operación y tracking.
        </p>
      </div>

      <UserAvatarUploader
        name={user?.email}
        email={user?.email}
        profileImageUrl={profileImageUrl}
        canEdit={!!user?.id}
      />

      <WorkshopAvatarUploader
        name={activeWorkshop?.name}
        profileImageUrl={activeWorkshop?.profileImageUrl}
        logoUrl={activeWorkshop?.logoUrl}
        canEdit={canEditWorkshop}
      />

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
          Cargando branding del taller...
        </div>
      ) : null}
    </div>
  );
}
