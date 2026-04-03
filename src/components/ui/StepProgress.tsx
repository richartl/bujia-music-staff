import { cn } from '@/lib/utils';

type StepProgressProps<T extends string> = {
  steps: readonly T[];
  labels: Record<T, string>;
  activeStep: T;
  onStepClick: (step: T) => void;
};

export function StepProgress<T extends string>({ steps, labels, activeStep, onStepClick }: StepProgressProps<T>) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((step, index) => (
        <button
          key={step}
          type="button"
          onClick={() => onStepClick(step)}
          className={cn(
            'rounded-xl border px-2 py-2.5 text-[11px] font-semibold tracking-wide',
            activeStep === step
              ? 'border-amber-500 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-white text-slate-600 active:scale-[0.99]',
          )}
        >
          {index + 1}. {labels[step]}
        </button>
      ))}
    </div>
  );
}
