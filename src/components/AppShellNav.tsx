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

export function AppShellNav() {
  return (
    <nav className="grid grid-cols-5 gap-1 md:grid-cols-1 md:gap-2">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app'}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition md:flex-row md:justify-start md:gap-2 md:px-3 md:py-3 md:text-sm',
              isActive
                ? 'bg-amber-500 text-white'
                : 'text-slate-600 hover:bg-slate-100',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
