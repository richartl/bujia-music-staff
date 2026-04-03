import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  name?: string;
  email?: string;
  profileImageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
};

function getInitials(name?: string, email?: string) {
  const source = (name || email || '').trim();
  if (!source) return 'US';

  return source
    .replace('@', ' ')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function UserAvatar({ name, email, profileImageUrl, size = 'md', className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => getInitials(name, email), [email, name]);
  const showImage = !!profileImageUrl && !failed;

  if (showImage) {
    return (
      <img
        src={profileImageUrl || ''}
        alt={name || email || 'Usuario'}
        onError={() => setFailed(true)}
        className={cn('rounded-full object-cover ring-1 ring-slate-200', SIZE_CLASS[size], className)}
      />
    );
  }

  return (
    <span className={cn('inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700', SIZE_CLASS[size], className)}>
      {initials || 'US'}
    </span>
  );
}
