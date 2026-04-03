import { cn } from '@/lib/utils';

type VisitStatusBadgeProps = {
  name?: string | null;
  color?: string | null;
  isActive?: boolean;
};

type StatusTone = {
  dot: string;
  badge: string;
  label: string;
};

function resolveTone(name?: string | null, isActive?: boolean): StatusTone {
  const normalized = (name || '').toLowerCase();

  if (normalized.includes('cancel')) {
    return {
      dot: 'bg-rose-500',
      badge: 'bg-rose-50 border-rose-200',
      label: 'text-rose-700',
    };
  }

  if (normalized.includes('entreg')) {
    return {
      dot: 'bg-slate-500',
      badge: 'bg-slate-100 border-slate-200',
      label: 'text-slate-700',
    };
  }

  if (normalized.includes('lista') || normalized.includes('ready')) {
    return {
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 border-emerald-200',
      label: 'text-emerald-700',
    };
  }

  if (normalized.includes('proceso') || normalized.includes('progress')) {
    return {
      dot: 'bg-sky-500',
      badge: 'bg-sky-50 border-sky-200',
      label: 'text-sky-700',
    };
  }

  if (normalized.includes('pend')) {
    return {
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 border-amber-200',
      label: 'text-amber-700',
    };
  }

  if (isActive) {
    return {
      dot: 'bg-violet-500',
      badge: 'bg-violet-50 border-violet-200',
      label: 'text-violet-700',
    };
  }

  return {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 border-slate-200',
    label: 'text-slate-700',
  };
}

export function VisitStatusBadge({ name, isActive }: VisitStatusBadgeProps) {
  const tone = resolveTone(name, isActive);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        tone.badge,
        tone.label,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} aria-hidden />
      {name || 'Sin estatus'}
    </span>
  );
}
