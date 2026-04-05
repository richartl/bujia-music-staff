import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type WorkshopAvatarProps = {
  name?: string;
  profileImageUrl?: string | null;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<WorkshopAvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-xl',
};

function getInitials(name?: string) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TL';
}

export function WorkshopAvatar({ name, profileImageUrl, logoUrl, size = 'md', className }: WorkshopAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);
  const preferred = profileImageUrl || logoUrl || '';

  if (preferred && !failed) {
    return (
      <img
        src={preferred}
        alt={name || 'Taller'}
        onError={() => setFailed(true)}
        className={cn(
          'rounded-full border border-white/30 bg-slate-100 object-cover ring-2 ring-amber-200/90 shadow-lg shadow-black/30',
          SIZE_CLASS[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-slate-200 to-slate-300 font-semibold text-slate-700 ring-2 ring-amber-200/90 shadow-lg shadow-black/20',
        SIZE_CLASS[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
