import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { VisitClientPhoneCopy } from '../src/features/visits/components/VisitClientPhoneCopy';
import { copyTextToClipboard } from '../src/lib/clipboard';
import { notifyError, notifySuccess } from '../src/lib/notify';

vi.mock('../src/lib/clipboard', () => ({
  copyTextToClipboard: vi.fn(),
}));

vi.mock('../src/lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

describe('VisitClientPhoneCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('al hacer click en el teléfono dispara el copiado', async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(undefined);

    render(<VisitClientPhoneCopy clientName="Juan Pérez" phone="5551234567" />);

    fireEvent.click(screen.getByRole('button', { name: /copiar teléfono 5551234567/i }));

    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith('5551234567');
    });
  });

  it('muestra toast de éxito cuando copia correctamente', async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(undefined);

    render(<VisitClientPhoneCopy clientName="Ana" phone="5557654321" />);

    fireEvent.click(screen.getByRole('button', { name: /copiar teléfono 5557654321/i }));

    await waitFor(() => {
      expect(notifySuccess).toHaveBeenCalledWith('Teléfono copiado al portapapeles');
    });
  });

  it('muestra toast de error si falla la copia', async () => {
    vi.mocked(copyTextToClipboard).mockRejectedValue(new Error('clipboard error'));

    render(<VisitClientPhoneCopy clientName="Luis" phone="5550000000" />);

    fireEvent.click(screen.getByRole('button', { name: /copiar teléfono 5550000000/i }));

    await waitFor(() => {
      expect(notifyError).toHaveBeenCalledWith('No se pudo copiar el teléfono');
    });
  });

  it('si no hay número, no rompe la UI y muestra texto fallback', () => {
    render(<VisitClientPhoneCopy clientName="Carla" phone={null} />);

    expect(screen.getByText('Carla ·')).toBeTruthy();
    expect(screen.getByText('Sin teléfono')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /copiar teléfono/i })).toBeNull();
  });
});
