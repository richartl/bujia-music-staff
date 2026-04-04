import { cn } from '@/lib/utils';

type VisitStatusBadgeProps = {
  name?: string | null;
  color?: string | null;
  isActive?: boolean;
};

export type StatusTone = {
  dot: string;
  badge: string;
  label: string;
  accent: string;
};

function hexToRgba(color: string, alpha: number) {
  const clean = color.replace('#', '').trim();
  if (![3, 6].includes(clean.length)) return null;
  const full = clean.length === 3 ? clean.split('').map((char) => `${char}${char}`).join('') : clean;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return null;

  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function resolveStatusTone(name?: string | null, isActive?: boolean): StatusTone {
  const normalized = (name || '').toLowerCase();

  if (normalized.includes('cancel')) {
    return { dot: 'bg-rose-500', badge: 'bg-rose-50 border-rose-200', label: 'text-rose-700', accent: '#e11d48' };
  }
  if (normalized.includes('entreg')) {
    return { dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200', label: 'text-emerald-700', accent: '#10b981' };
  }
  if (normalized.includes('lista') || normalized.includes('ready')) {
    return { dot: 'bg-violet-500', badge: 'bg-violet-50 border-violet-200', label: 'text-violet-700', accent: '#8b5cf6' };
  }
  if (normalized.includes('proceso') || normalized.includes('progress')) {
    return { dot: 'bg-sky-500', badge: 'bg-sky-50 border-sky-200', label: 'text-sky-700', accent: '#0ea5e9' };
  }
  if (normalized.includes('pend')) {
    return { dot: 'bg-amber-500', badge: 'bg-amber-50 border-amber-200', label: 'text-amber-700', accent: '#f59e0b' };
  }
  if (isActive) {
    return { dot: 'bg-indigo-500', badge: 'bg-indigo-50 border-indigo-200', label: 'text-indigo-700', accent: '#6366f1' };
  }

  return { dot: 'bg-slate-400', badge: 'bg-slate-100 border-slate-200', label: 'text-slate-700', accent: '#64748b' };
}

export function VisitStatusBadge({ name, color, isActive }: VisitStatusBadgeProps) {
  const tone = resolveStatusTone(name, isActive);
  const customBg = color ? hexToRgba(color, 0.12) : null;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', tone.badge, tone.label)}
      style={color ? { borderColor: color, color, backgroundColor: customBg || undefined } : undefined}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} style={color ? { backgroundColor: color } : undefined} aria-hidden />
      {name || 'Sin estatus'}
    </span>
  );
}
