import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type WorkshopAvatarProps = {
  name?: string;
  profileImageUrl?: string | null;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<WorkshopAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
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
        className={cn('rounded-full object-cover ring-1 ring-slate-200', SIZE_CLASS[size], className)}
      />
    );
  }

  return (
    <span className={cn('inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700', SIZE_CLASS[size], className)}>
      {initials}
    </span>
  );
}
