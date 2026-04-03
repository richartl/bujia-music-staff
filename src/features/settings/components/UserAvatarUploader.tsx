import { env } from '@/config/env';
import { UserAvatar } from '@/components/avatars/UserAvatar';

type UserAvatarUploaderProps = {
  name?: string;
  email?: string;
  profileImageUrl?: string | null;
  canEdit: boolean;
};

export function UserAvatarUploader({ name, email, profileImageUrl, canEdit }: UserAvatarUploaderProps) {
  const showActions = env.enableProfileImageEditing && canEdit;

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={name} email={email} profileImageUrl={profileImageUrl} size="lg" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Perfil de usuario</p>
          <p className="text-xs text-slate-500">Imagen visible en navegación y actividad interna.</p>
        </div>
      </div>
      {showActions ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary h-10 justify-center">Cambiar foto</button>
          <button type="button" className="btn-secondary h-10 justify-center">Quitar foto</button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Edición de foto disponible cuando se habilite backend de actualización.</p>
      )}
    </div>
  );
}
