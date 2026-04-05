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

    const backdrop = screen.getByText('Cambiar').closest('div')?.parentElement;
    expect(screen.getByText('Cambiar')).toBeTruthy();
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
