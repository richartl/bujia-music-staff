import { filesApi } from '@/features/intakes/api/filesApi';
import { http } from '@/lib/http';
import type { InitAttachmentUploadV2Response, NoteAttachment, PrepareUploadResponse } from './types';

type MediaKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';

function resolveMediaKind(mimeType: string): MediaKind {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  return 'FILE';
}

async function uploadBinary(uploadUrl: string, file: File, headers?: Record<string, string>) {
  await filesApi.putBinaryToSignedUrl(uploadUrl, file, headers || {});
}

export async function uploadVisitNoteAttachment(noteId: string, file: File) {
  const payload = {
    mediaKind: resolveMediaKind(file.type),
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    fileName: file.name,
  };

  try {
    const { data: init } = await http.post<InitAttachmentUploadV2Response>(
      `/visit-notes/${noteId}/attachments/init-upload-v2`,
      payload,
    );

    await uploadBinary(init.uploadUrl, file, init.requiredHeaders);

    const { data: attached } = await http.post<NoteAttachment>(
      `/visit-notes/${noteId}/attachments/attach-media-v2`,
      {
        mediaId: init.mediaId,
      },
    );

    const attachmentId = attached.id || init.attachmentId;
    await http.post(`/visit-notes/${noteId}/attachments/${attachmentId}/complete`, {
      sizeBytes: file.size,
    });
  } catch {
    const { data: fallback } = await http.post<PrepareUploadResponse>(
      `/visit-notes/${noteId}/attachments/prepare-upload`,
      payload,
    );
    await uploadBinary(fallback.uploadUrl, file, fallback.requiredHeaders);
  }
}

export async function getVisitNoteAttachments(noteId: string) {
  const { data } = await http.get<NoteAttachment[]>(`/visit-notes/${noteId}/attachments`);
  return data;
}

export async function getVisitNoteAttachment(noteId: string, attachmentId: string) {
  const { data } = await http.get<NoteAttachment>(`/visit-notes/${noteId}/attachments/${attachmentId}`);
  return data;
}

export async function deleteVisitNoteAttachment(noteId: string, attachmentId: string) {
  await http.delete(`/visit-notes/${noteId}/attachments/${attachmentId}`);
}

export async function uploadVisitServiceNoteAttachment(noteId: string, file: File) {
  const payload = {
    mediaKind: resolveMediaKind(file.type),
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    fileName: file.name,
  };

  try {
    const { data: init } = await http.post<InitAttachmentUploadV2Response>(
      `/visit-service-notes/${noteId}/attachments/init-upload-v2`,
      payload,
    );

    await uploadBinary(init.uploadUrl, file, init.requiredHeaders);

    const { data: attached } = await http.post<NoteAttachment>(
      `/visit-service-notes/${noteId}/attachments/attach-media-v2`,
      {
        mediaId: init.mediaId,
      },
    );

    const attachmentId = attached.id || init.attachmentId;
    await http.post(`/visit-service-notes/${noteId}/attachments/${attachmentId}/complete`, {
      sizeBytes: file.size,
    });
  } catch {
    const { data: fallback } = await http.post<PrepareUploadResponse>(
      `/visit-service-notes/${noteId}/attachments/prepare-upload`,
      payload,
    );
    await uploadBinary(fallback.uploadUrl, file, fallback.requiredHeaders);
  }
}

export async function getVisitServiceNoteAttachments(noteId: string) {
  const { data } = await http.get<NoteAttachment[]>(`/visit-service-notes/${noteId}/attachments`);
  return data;
}

export async function getVisitServiceNoteAttachment(noteId: string, attachmentId: string) {
  const { data } = await http.get<NoteAttachment>(`/visit-service-notes/${noteId}/attachments/${attachmentId}`);
  return data;
}

export async function deleteVisitServiceNoteAttachment(noteId: string, attachmentId: string) {
  await http.delete(`/visit-service-notes/${noteId}/attachments/${attachmentId}`);
}
