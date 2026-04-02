import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useIntakeMediaUpload } from '../src/features/intakes/hooks/useIntakeMediaUpload';
import { filesApi } from '../src/features/intakes/api/filesApi';

vi.mock('../src/features/intakes/api/filesApi', () => ({
  filesApi: {
    initUpload: vi.fn(),
    putBinaryToSignedUrl: vi.fn(),
    completeUpload: vi.fn(),
  },
  getUploadErrorCode: (error: unknown) => (error instanceof Error ? error.message : 'UNKNOWN_ERROR'),
}));

function createFile(name: string, type = 'image/jpeg') {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('useIntakeMediaUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('happy path 1 archivo', async () => {
    vi.mocked(filesApi.initUpload).mockResolvedValue({
      mediaId: 'media-1',
      uploadUrl: 'https://signed-url.example/1',
      expiresAt: new Date().toISOString(),
      method: 'PUT',
      requiredHeaders: {},
    });
    vi.mocked(filesApi.putBinaryToSignedUrl).mockResolvedValue();
    vi.mocked(filesApi.completeUpload).mockResolvedValue({ mediaId: 'media-1', status: 'DONE' });

    const { result } = renderHook(() => useIntakeMediaUpload({ scope: 'workshop:w1/intake:new' }));

    act(() => {
      result.current.addFiles([createFile('foto-1.jpg')]);
    });

    await waitFor(() => {
      expect(result.current.uploadedMediaIds).toEqual(['media-1']);
    });
  });

  it('múltiples archivos', async () => {
    vi.mocked(filesApi.initUpload)
      .mockResolvedValueOnce({
        mediaId: 'media-a',
        uploadUrl: 'https://signed-url.example/a',
        expiresAt: new Date().toISOString(),
        method: 'PUT',
        requiredHeaders: {},
      })
      .mockResolvedValueOnce({
        mediaId: 'media-b',
        uploadUrl: 'https://signed-url.example/b',
        expiresAt: new Date().toISOString(),
        method: 'PUT',
        requiredHeaders: {},
      });
    vi.mocked(filesApi.putBinaryToSignedUrl).mockResolvedValue();
    vi.mocked(filesApi.completeUpload)
      .mockResolvedValueOnce({ mediaId: 'media-a', status: 'DONE' })
      .mockResolvedValueOnce({ mediaId: 'media-b', status: 'DONE' });

    const { result } = renderHook(() => useIntakeMediaUpload({ scope: 'workshop:w1/intake:new' }));

    act(() => {
      result.current.addFiles([createFile('foto.jpg'), createFile('audio.mp3', 'audio/mpeg')]);
    });

    await waitFor(() => {
      expect(result.current.uploadedMediaIds).toHaveLength(2);
    });
  });

  it('falla en PUT y retry', async () => {
    vi.mocked(filesApi.initUpload).mockResolvedValue({
      mediaId: 'media-err',
      uploadUrl: 'https://signed-url.example/err',
      expiresAt: new Date().toISOString(),
      method: 'PUT',
      requiredHeaders: {},
    });
    vi.mocked(filesApi.putBinaryToSignedUrl)
      .mockRejectedValueOnce(new Error('MEDIA_PROVIDER_ERROR'))
      .mockResolvedValueOnce();
    vi.mocked(filesApi.completeUpload).mockResolvedValue({ mediaId: 'media-err', status: 'DONE' });

    const { result } = renderHook(() => useIntakeMediaUpload({ scope: 'workshop:w1/intake:new' }));

    act(() => {
      result.current.addFiles([createFile('video.mp4', 'video/mp4')]);
    });

    await waitFor(() => {
      expect(result.current.items[0]?.status).toBe('error');
    });

    act(() => {
      result.current.retryFile(result.current.items[0].localId);
    });

    await waitFor(() => {
      expect(result.current.items[0]?.status).toBe('done');
    });
  });

  it('falla en complete', async () => {
    vi.mocked(filesApi.initUpload).mockResolvedValue({
      mediaId: 'media-c',
      uploadUrl: 'https://signed-url.example/c',
      expiresAt: new Date().toISOString(),
      method: 'PUT',
      requiredHeaders: {},
    });
    vi.mocked(filesApi.putBinaryToSignedUrl).mockResolvedValue();
    vi.mocked(filesApi.completeUpload).mockRejectedValue(new Error('MEDIA_STATE_CONFLICT'));

    const { result } = renderHook(() => useIntakeMediaUpload({ scope: 'workshop:w1/intake:new' }));

    act(() => {
      result.current.addFiles([createFile('audio.wav', 'audio/wav')]);
    });

    await waitFor(() => {
      expect(result.current.items[0]?.status).toBe('error');
      expect(result.current.items[0]?.errorCode).toBe('MEDIA_STATE_CONFLICT');
    });
  });
});
