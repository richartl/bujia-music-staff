type VisitServiceStatusChipProps = {
  label: string;
  color?: string | null;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function VisitServiceStatusChip({ label, color, disabled, loading, onClick }: VisitServiceStatusChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: color || '#64748B' }}
    >
      <span className="truncate">{label}</span>
      <span className={`inline-block h-2 w-2 rounded-full bg-white/90 ${loading ? 'animate-pulse' : ''}`} />
    </button>
  );
}
