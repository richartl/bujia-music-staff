import { describe, expect, it, vi } from 'vitest';
import { scrollToIntakeTop } from '../src/features/intakes/utils/scrollToIntakeTop';

describe('scrollToIntakeTop', () => {
  it('usa window scroll cuando no hay contenedor', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    scrollToIntakeTop(null);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('hace scroll del window con offset cuando el contenedor está en layout normal', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 240 } as DOMRect);
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });

    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    scrollToIntakeTop(container, 80);

    expect(spy).toHaveBeenCalledWith({ top: 260, behavior: 'smooth' });
    spy.mockRestore();
  });

  it('respeta contenedor scrolleable interno', () => {
    const parent = document.createElement('div');
    Object.defineProperty(parent, 'scrollHeight', { value: 900, configurable: true });
    Object.defineProperty(parent, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(parent.style, 'overflowY', { value: 'auto', configurable: true });
    const child = document.createElement('div');
    parent.appendChild(child);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({ top: 40 } as DOMRect);
    vi.spyOn(child, 'getBoundingClientRect').mockReturnValue({ top: 200 } as DOMRect);
    Object.defineProperty(parent, 'scrollTop', { value: 100, configurable: true, writable: true });

    const parentScrollSpy = vi.spyOn(parent, 'scrollTo').mockImplementation(() => undefined);
    scrollToIntakeTop(child, 80);

    expect(parentScrollSpy).toHaveBeenCalled();
  });
});
