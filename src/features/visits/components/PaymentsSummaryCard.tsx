import { currency } from '@/lib/utils';

type PaymentsSummaryCardProps = {
  totalPaid: number;
  visitTotal: number;
  pendingAmount: number;
};

export function PaymentsSummaryCard({ totalPaid, visitTotal, pendingAmount }: PaymentsSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <SummaryTile label="Total abonado" value={currency(totalPaid)} tone="emerald" />
      <SummaryTile label="Total visita" value={currency(visitTotal)} tone="slate" />
      <SummaryTile label="Saldo pendiente" value={currency(pendingAmount)} tone={pendingAmount > 0 ? 'amber' : 'emerald'} />
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'amber' | 'slate' }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-800';

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}
