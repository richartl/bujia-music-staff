import { AppShellNav } from '@/components/AppShellNav';

export function BottomNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto max-w-7xl">
        <AppShellNav mobile />
      </div>
    </div>
  );
}
