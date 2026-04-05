import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OverlayPortal } from '../src/components/ui/OverlayPortal';

describe('OverlayPortal', () => {
  it('renderiza contenido en document.body', () => {
    render(
      <div>
        <span>Base</span>
        <OverlayPortal>
          <div>Modal encima</div>
        </OverlayPortal>
      </div>,
    );

    expect(screen.getByText('Modal encima')).toBeTruthy();
  });
});
