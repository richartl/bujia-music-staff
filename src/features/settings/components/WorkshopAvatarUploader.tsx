import { useEffect, useMemo, useRef, useState } from 'react';
import { WorkshopAvatar } from '@/components/avatars/WorkshopAvatar';
import { uploadProfileImageFile, getProfileImageErrorMessage } from '@/features/settings/api/profile-images';
import { useUpdateWorkshopProfileImage } from '@/features/settings/hooks/useProfileBranding';

type WorkshopAvatarUploaderProps = {
  workshopId?: string;
  name?: string;
  profileImageUrl?: string | null;
  logoUrl?: string | null;
  canEdit: boolean;
};

export function WorkshopAvatarUploader({ workshopId, name, profileImageUrl, logoUrl, canEdit }: WorkshopAvatarUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const updateMutation = useUpdateWorkshopProfileImage();

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
    if (!selectedFile || !workshopId) return;

    setUploading(true);
    setMessage(null);
    try {
      const mediaId = await uploadProfileImageFile(selectedFile, `workshop:${workshopId}/profile-image`);
      await updateMutation.mutateAsync({ workshopId, mediaId });
      setMessage('Imagen del taller actualizada correctamente.');
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setMessage(getProfileImageErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!workshopId) return;

    setUploading(true);
    setMessage(null);
    try {
      await updateMutation.mutateAsync({ workshopId, mediaId: null });
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage('Imagen del taller eliminada.');
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
        <WorkshopAvatar name={name} profileImageUrl={shownProfileImageUrl} logoUrl={logoUrl} size="lg" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Perfil del taller</p>
          <p className="text-xs text-slate-500">Branding que se muestra en tracking y operación diaria.</p>
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
      ) : (
        <p className="mt-3 text-xs text-slate-500">Solo ADMIN u OWNER pueden editar la imagen del taller.</p>
      )}
    </div>
  );
}
