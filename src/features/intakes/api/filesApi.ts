import axios from 'axios';
import { http } from '@/lib/http';

export type InitUploadResponse = {
  mediaId: string;
  uploadUrl: string;
  expiresAt: string;
  method: 'PUT';
  requiredHeaders?: Record<string, string>;
};

export type CompleteUploadPayload = {
  checksum?: string;
  sizeBytes?: number;
  metadata?: Record<string, unknown>;
};

export type UploadProgressCallback = (progress: number) => void;

export const filesApi = {
  async initUpload(file: File, scope: string) {
    const { data } = await http.post<InitUploadResponse>('/v1/files/init-upload', {
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      scope,
    });

    return data;
  },

  async putBinaryToSignedUrl(
    uploadUrl: string,
    file: File,
    requiredHeaders: Record<string, string> = {},
    onProgress?: UploadProgressCallback,
    signal?: AbortSignal,
  ) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('PUT', uploadUrl, true);
      Object.entries(requiredHeaders).forEach(([header, value]) => {
        xhr.setRequestHeader(header, value);
      });

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
          return;
        }

        reject(new Error(`UPLOAD_HTTP_${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error('MEDIA_PROVIDER_ERROR'));
      xhr.onabort = () => reject(new Error('UPLOAD_ABORTED'));

      if (signal) {
        signal.addEventListener('abort', () => xhr.abort(), { once: true });
      }

      xhr.send(file);
    });
  },

  async completeUpload(mediaId: string, payload: CompleteUploadPayload) {
    const { data } = await http.post<{ mediaId: string; status: string }>(
      `/v1/files/${mediaId}/complete`,
      payload,
    );

    return data;
  },

  async getDownloadUrl(mediaId: string) {
    const { data } = await http.post<{ url: string; expiresInSeconds: number }>(
      `/v1/files/${mediaId}/download-url`,
    );

    return data;
  },
};

export function getUploadErrorCode(error: unknown) {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    if (typeof code === 'string') return code;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'UNKNOWN_ERROR';
}
