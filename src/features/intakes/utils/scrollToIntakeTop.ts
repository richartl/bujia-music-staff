function getScrollableParent(element: HTMLElement | null): HTMLElement | Window {
  if (!element) return window;
  let current = element.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
    if (canScroll) return current;
    current = current.parentElement;
  }
  return window;
}

export function scrollToIntakeTop(container: HTMLElement | null, offset = 78) {
  if (!container) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const scrollParent = getScrollableParent(container);
  const rect = container.getBoundingClientRect();

  if (scrollParent === window) {
    const top = window.scrollY + rect.top - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    return;
  }

  const parent = scrollParent as HTMLElement;
  const parentRect = parent.getBoundingClientRect();
  const top = parent.scrollTop + (rect.top - parentRect.top) - 12;
  parent.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
