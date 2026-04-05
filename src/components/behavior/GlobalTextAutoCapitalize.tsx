import { useEffect } from 'react';
import { capitalizeHumanText, shouldAutoCapitalizeTextInput } from '@/lib/textCasing';

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(element) as HTMLInputElement | HTMLTextAreaElement;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

  if (descriptor?.set) {
    descriptor.set.call(element, value);
    return;
  }

  element.value = value;
}

export function GlobalTextAutoCapitalize() {
  useEffect(() => {
    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      if (!shouldAutoCapitalizeTextInput(target)) return;

      const normalized = capitalizeHumanText(target.value);
      if (normalized === target.value) return;

      setNativeValue(target, normalized);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    };

    document.addEventListener('focusout', handleFocusOut, true);
    return () => document.removeEventListener('focusout', handleFocusOut, true);
  }, []);

  return null;
}
