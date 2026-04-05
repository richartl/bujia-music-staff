import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IntakeMediaUploader } from '../src/features/intakes/components/IntakeMediaUploader';

const addFiles = vi.fn();
const removeFile = vi.fn();
const retryFile = vi.fn();

vi.mock('../src/features/intakes/hooks/useIntakeMediaUpload', () => ({
  useIntakeMediaUpload: () => ({
    items: [
      {
        localId: 'ok-1',
        file: new File(['a'], 'foto.jpg', { type: 'image/jpeg' }),
        status: 'done',
        progress: 100,
        errorMessage: null,
      },
      {
        localId: 'error-1',
        file: new File(['b'], 'audio.mp3', { type: 'audio/mpeg' }),
        status: 'error',
        progress: 0,
        errorMessage: 'falló',
      },
    ],
    addFiles,
    removeFile,
    retryFile,
    uploadedMediaIds: ['m1'],
    hasBlockingUploads: false,
  }),
}));

describe('IntakeMediaUploader', () => {
  it('usa patrón visual homologado de evidencia y lista archivos', () => {
    render(
      <IntakeMediaUploader
        workshopId="w1"
        onUploadedMediaIdsChange={vi.fn()}
        onBlockingUploadsChange={vi.fn()}
        onFileErrorToast={vi.fn()}
      />,
    );

    expect(screen.getByText('Evidencia de visita (opcional)')).toBeTruthy();
    expect(screen.getByText('Adjuntar evidencia')).toBeTruthy();
    expect(screen.getByText('foto.jpg')).toBeTruthy();
    expect(screen.getByText('audio.mp3')).toBeTruthy();
    expect(screen.getByText('Listo')).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
  });

  it('permite reintentar y eliminar archivos desde la lista', () => {
    render(
      <IntakeMediaUploader
        workshopId="w1"
        onUploadedMediaIdsChange={vi.fn()}
        onBlockingUploadsChange={vi.fn()}
        onFileErrorToast={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText('Reintentar audio.mp3'));
    fireEvent.click(screen.getByLabelText('Quitar audio.mp3'));

    expect(retryFile).toHaveBeenCalled();
    expect(removeFile).toHaveBeenCalled();
  });
});
