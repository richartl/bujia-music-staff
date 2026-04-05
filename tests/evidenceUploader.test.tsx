import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EvidenceUploader } from '../src/features/visits/components/EvidenceUploader';

describe('EvidenceUploader', () => {
  it('renderiza patrón base de evidencia con CTA y listado', () => {
    render(
      <EvidenceUploader
        items={[
          {
            id: 'f1',
            file: new File(['x'], 'foto.jpg', { type: 'image/jpeg' }),
            status: 'done',
          },
          {
            id: 'f2',
            file: new File(['x'], 'video.mp4', { type: 'video/mp4' }),
            status: 'error',
            errorMessage: 'falló',
          },
        ]}
        maxFiles={4}
        onAddFiles={vi.fn()}
        onRetry={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Evidencia (opcional)')).toBeTruthy();
    expect(screen.getByText('Adjuntar evidencia')).toBeTruthy();
    expect(screen.getByText('foto.jpg')).toBeTruthy();
    expect(screen.getByText('video.mp4')).toBeTruthy();
    expect(screen.getByText('Listo')).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
  });

  it('permite retry/remove de archivo', () => {
    const onRetry = vi.fn();
    const onRemove = vi.fn();

    render(
      <EvidenceUploader
        items={[
          {
            id: 'f2',
            file: new File(['x'], 'video.mp4', { type: 'video/mp4' }),
            status: 'error',
            errorMessage: 'falló',
          },
        ]}
        maxFiles={4}
        onAddFiles={vi.fn()}
        onRetry={onRetry}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByLabelText('Reintentar video.mp4'));
    fireEvent.click(screen.getByLabelText('Quitar video.mp4'));

    expect(onRetry).toHaveBeenCalledWith('f2');
    expect(onRemove).toHaveBeenCalledWith('f2');
  });
});
