import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlobalNetworkActivityIndicator } from '../src/components/feedback/GlobalNetworkActivityIndicator';
import { networkActivityStore } from '../src/stores/network-activity-store';

describe('GlobalNetworkActivityIndicator', () => {
  it('se muestra y oculta basado en requests activas', () => {
    vi.useFakeTimers();
    networkActivityStore.getState().reset();
    render(<GlobalNetworkActivityIndicator />);

    expect(screen.queryByText('Sincronizando…')).toBeNull();

    act(() => {
      networkActivityStore.getState().startRequest('req-1');
      vi.advanceTimersByTime(170);
    });

    expect(screen.getByText('Sincronizando…')).toBeTruthy();

    act(() => {
      networkActivityStore.getState().endRequest('req-1');
      vi.advanceTimersByTime(260);
    });

    expect(screen.queryByText('Sincronizando…')).toBeNull();
    vi.useRealTimers();
  });
});
