import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type OverlayPortalProps = {
  children: ReactNode;
};

export function OverlayPortal({ children }: OverlayPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
