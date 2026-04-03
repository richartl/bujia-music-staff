import { useEffect, useMemo, useRef, useState } from 'react';
import { UserAvatar } from '@/components/avatars/UserAvatar';
import { uploadProfileImageFile, getProfileImageErrorMessage } from '@/features/settings/api/profile-images';
import { useUpdateUserProfileImage } from '@/features/settings/hooks/useProfileBranding';

type UserAvatarUploaderProps = {
  userId?: string;
  name?: string;
  email?: string;
  profileImageUrl?: string | null;
  canEdit: boolean;
};

export function UserAvatarUploader({ userId, name, email, profileImageUrl, canEdit }: UserAvatarUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const updateMutation = useUpdateUserProfileImage();

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const shownProfileImageUrl = useMemo(() => previewUrl || profileImageUrl || null, [previewUrl, profileImageUrl]);

  async function handleSave() {
    if (!selectedFile || !userId) return;

    setUploading(true);
    setMessage(null);
    try {
      const mediaId = await uploadProfileImageFile(selectedFile, `user:${userId}/profile-image`);
      await updateMutation.mutateAsync({ userId, mediaId });
      setMessage('Imagen de perfil actualizada correctamente.');
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setMessage(getProfileImageErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!userId) return;
    setUploading(true);
    setMessage(null);

    try {
      await updateMutation.mutateAsync({ userId, mediaId: null });
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage('Imagen de perfil eliminada.');
    } catch (error) {
      setMessage(getProfileImageErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || updateMutation.isPending;

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={name} email={email} profileImageUrl={shownProfileImageUrl} size="lg" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Perfil de usuario</p>
          <p className="text-xs text-slate-500">Imagen visible en navegación y actividad interna.</p>
        </div>
      </div>

      {canEdit ? (
        <div className="mt-3 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setSelectedFile(file);
              setMessage(null);
            }}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" className="btn-secondary h-10 justify-center" onClick={() => inputRef.current?.click()} disabled={busy}>
              {profileImageUrl ? 'Reemplazar imagen' : 'Subir imagen'}
            </button>
            <button type="button" className="btn-secondary h-10 justify-center" onClick={handleSave} disabled={!selectedFile || busy}>
              {busy ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" className="btn-secondary h-10 justify-center" onClick={() => setSelectedFile(null)} disabled={!selectedFile || busy}>
              Cancelar cambio
            </button>
            <button type="button" className="btn-secondary h-10 justify-center" onClick={handleRemove} disabled={busy || (!profileImageUrl && !previewUrl)}>
              Quitar imagen
            </button>
          </div>
          {selectedFile ? <p className="text-xs text-slate-500">Vista previa: {selectedFile.name}</p> : null}
          {message ? <p className="text-xs text-slate-700">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
