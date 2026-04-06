import { LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type VisitsViewSwitcherProps = {
  current: 'list' | 'board';
};

export function VisitsViewSwitcher({ current }: VisitsViewSwitcherProps) {
  return (
    <section className="card p-2">
      <div className="inline-flex w-full rounded-xl border border-slate-300 bg-slate-100 p-1">
        <ViewOption to="/app/visits" label="Lista" icon={List} active={current === 'list'} />
        <ViewOption to="/app/visits/board" label="Tablero" icon={LayoutGrid} active={current === 'board'} />
      </div>
    </section>
  );
}

type ViewOptionProps = {
  to: string;
  label: string;
  active: boolean;
  icon: typeof List;
};

function ViewOption({ to, label, active, icon: Icon }: ViewOptionProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition',
        active ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-white hover:text-slate-900',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
