import axios from 'axios';
import { http } from '@/lib/http';
import { filesApi } from '@/features/intakes/api/filesApi';

export type ProfileImageUpdateResponse = {
  id: string;
  profileImageUrl: string | null;
};

export async function uploadProfileImageFile(file: File, scope: string) {
  const init = await filesApi.initUpload(file, scope);
  await filesApi.putBinaryToSignedUrl(init.uploadUrl, file, init.requiredHeaders);
  await filesApi.completeUpload(init.mediaId, {
    sizeBytes: file.size,
    metadata: {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
    },
  });
  return init.mediaId;
}

export async function updateUserProfileImage(userId: string, mediaId: string | null) {
  try {
    const { data } = await http.patch<ProfileImageUpdateResponse>(`/users/${userId}/profile-image`, { mediaId });
    return data;
  } catch (error) {
    if (mediaId === null && axios.isAxiosError(error) && [400, 422].includes(error.response?.status || 0)) {
      const { data } = await http.patch<ProfileImageUpdateResponse>(`/users/${userId}/profile-image`, {});
      return data;
    }
    throw error;
  }
}

export async function updateWorkshopProfileImage(workshopId: string, mediaId: string | null) {
  try {
    const { data } = await http.patch<ProfileImageUpdateResponse>(`/workshops/${workshopId}/profile-image`, { mediaId });
    return data;
  } catch (error) {
    if (mediaId === null && axios.isAxiosError(error) && [400, 422].includes(error.response?.status || 0)) {
      const { data } = await http.patch<ProfileImageUpdateResponse>(`/workshops/${workshopId}/profile-image`, {});
      return data;
    }
    throw error;
  }
}

export function getProfileImageErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) return 'No tienes permisos para actualizar esta imagen.';
    if (status === 404) return 'No se encontró el recurso que intentas actualizar.';
    if (status === 409 || status === 422) return 'La imagen seleccionada no es válida o aún no está lista para asociarse.';
    if (status === 408) return 'La solicitud tardó demasiado. Intenta nuevamente.';
    if ((status || 0) >= 500) return 'El servidor no pudo procesar la imagen. Intenta en unos minutos.';
  }

  if (error instanceof Error) {
    if (error.message.startsWith('UPLOAD_HTTP_')) return 'Falló la subida binaria al proveedor de archivos.';
    if (error.message === 'MEDIA_PROVIDER_ERROR') return 'Falló la subida del archivo al proveedor de medios.';
    if (error.message === 'UPLOAD_ABORTED') return 'La subida fue cancelada.';
    if (error.message.includes('Network')) return 'No se pudo conectar con el servidor. Revisa tu internet y reintenta.';
  }

  return 'No fue posible actualizar la imagen en este momento.';
}
