import { cn } from '@/lib/utils';

type QuickFilter = {
  label: string;
  value: string;
};

type QuickFilterChipsProps = {
  items: QuickFilter[];
  selected: string;
  onChange: (value: string) => void;
};

export function QuickFilterChips({ items, selected, onChange }: QuickFilterChipsProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-0.5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            selected === item.value
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
