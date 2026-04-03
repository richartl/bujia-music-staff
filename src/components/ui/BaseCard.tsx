import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type BaseCardProps = PropsWithChildren<{
  className?: string;
}>;

export function BaseCard({ children, className }: BaseCardProps) {
  return <article className={cn('card p-4', className)}>{children}</article>;
}
