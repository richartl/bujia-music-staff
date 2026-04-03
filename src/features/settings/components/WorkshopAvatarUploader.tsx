import { env } from '@/config/env';
import { WorkshopAvatar } from '@/components/avatars/WorkshopAvatar';

type WorkshopAvatarUploaderProps = {
  name?: string;
  profileImageUrl?: string | null;
  logoUrl?: string | null;
  canEdit: boolean;
};

export function WorkshopAvatarUploader({ name, profileImageUrl, logoUrl, canEdit }: WorkshopAvatarUploaderProps) {
  const showActions = env.enableProfileImageEditing && canEdit;

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        <WorkshopAvatar name={name} profileImageUrl={profileImageUrl} logoUrl={logoUrl} size="lg" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Perfil del taller</p>
          <p className="text-xs text-slate-500">Branding que se muestra en tracking y operación diaria.</p>
        </div>
      </div>
      {showActions ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary h-10 justify-center">Modificar imagen</button>
          <button type="button" className="btn-secondary h-10 justify-center">Quitar imagen</button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Acciones disponibles para ADMIN/OWNER cuando el feature flag esté activo.</p>
      )}
    </div>
  );
}
