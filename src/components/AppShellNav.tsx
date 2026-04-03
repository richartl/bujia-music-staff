import { LayoutDashboard, ClipboardPlus, Wrench, Library, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items = [
  { to: '/app/intakes', label: 'Recepción', icon: ClipboardPlus },
  { to: '/app/visits', label: 'Órdenes', icon: Wrench },
  { to: '/app/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { to: '/app/catalogs', label: 'Catálogos', icon: Library },
  { to: '/app/settings', label: 'Ajustes', icon: Settings },
];

type AppShellNavProps = {
  mobile?: boolean;
};

export function AppShellNav({ mobile = false }: AppShellNavProps) {
  return (
    <nav className={cn('grid', mobile ? 'grid-cols-5 gap-1' : 'grid-cols-5 gap-1 md:grid-cols-1 md:gap-2')}>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app'}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 items-center justify-center rounded-2xl font-medium transition active:scale-[0.99]',
              mobile
                ? 'flex-col gap-1 px-1 py-2 text-[10px]'
                : 'flex-col gap-1 px-2 py-2 text-[10px] md:flex-row md:justify-start md:gap-2 md:px-3 md:py-3 md:text-sm',
              isActive
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100',
            )
          }
        >
          <Icon className={cn('shrink-0', mobile ? 'h-4 w-4' : 'h-4 w-4')} />
          <span className="truncate leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
