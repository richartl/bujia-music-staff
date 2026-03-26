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
    <nav className="grid grid-cols-5 gap-2 md:grid-cols-1">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/app'}
          className={({ isActive }) =>
            cn(
              'flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl px-2 py-3 text-[11px] md:text-sm font-medium transition',
              isActive ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100',
            )
          }
        >
          <Icon className="h-4 w-4" />
          <span className="leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
