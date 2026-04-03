import type { HTMLAttributes } from 'react';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchInputProps = {
  value: string;
  placeholder?: string;
  loading?: boolean;
  onChange: (value: string) => void;
  className?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoFocus?: boolean;
};

export function SearchInput({
  value,
  placeholder = 'Buscar...',
  loading,
  onChange,
  className,
  inputMode,
  autoFocus,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <input
        className="input h-12 w-full pr-10 text-base"
        placeholder={placeholder}
        value={value}
        inputMode={inputMode}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <Search className="h-4 w-4 text-slate-400" />
        )}
      </div>
    </div>
  );
}
