import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { networkActivityStore } from '@/stores/network-activity-store';

const SHOW_DELAY_MS = 150;
const MIN_VISIBLE_MS = 250;

export function GlobalNetworkActivityIndicator() {
  const activeRequestCount = networkActivityStore((state) => state.activeRequestCount);
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: number | null = null;

    if (activeRequestCount > 0) {
      if (!visible) {
        timer = window.setTimeout(() => {
          shownAtRef.current = Date.now();
          setVisible(true);
        }, SHOW_DELAY_MS);
      }
    } else if (visible) {
      const shownAt = shownAtRef.current;
      const elapsed = shownAt ? Date.now() - shownAt : MIN_VISIBLE_MS;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      timer = window.setTimeout(() => {
        shownAtRef.current = null;
        setVisible(false);
      }, remaining);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [activeRequestCount, visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[220]">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400/90 via-amber-500 to-orange-500 animate-pulse" />
      <div className="absolute right-3 top-2 rounded-full border border-amber-200/70 bg-slate-950/85 px-2.5 py-1 text-[11px] font-medium text-amber-100 shadow-lg backdrop-blur-sm sm:right-4">
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Sincronizando…
        </span>
      </div>
    </div>
  );
}
