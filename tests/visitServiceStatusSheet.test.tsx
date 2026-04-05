import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisitServiceStatusSheet } from '../src/features/visits/components/VisitServiceStatusSheet';

describe('VisitServiceStatusSheet', () => {
  it('abre al frente y cierra por backdrop', () => {
    const onClose = vi.fn();
    render(
      <VisitServiceStatusSheet
        open
        title="Cambiar"
        statuses={[{ id: 's1', workshopId: 'w1', code: 'A', name: 'En proceso' }]}
        onClose={onClose}
        onSelect={vi.fn()}
      />,
    );

    const sheet = screen.getByText('Cambiar');
    const overlay = sheet.closest('div')?.parentElement;
    expect(sheet).toBeTruthy();
    expect(overlay?.className).toContain('z-[140]');
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});
