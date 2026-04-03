import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BaseProps = {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

type InputFieldProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input';
  };

type TextareaFieldProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
  };

export function InputField(props: InputFieldProps | TextareaFieldProps) {
  const { label, hint, error, containerClassName } = props;

  if ('as' in props && props.as === 'textarea') {
    const { as, ...textareaProps } = props;
    return (
      <label className={cn('block space-y-1.5', containerClassName)}>
        {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
        <textarea
          {...textareaProps}
          className={cn(
            'input min-h-24 resize-y text-base',
            textareaProps.className,
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
          )}
        />
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
        {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </label>
    );
  }

  const { as, ...inputProps } = props;
  return (
    <label className={cn('block space-y-1.5', containerClassName)}>
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        {...inputProps}
        className={cn(
          'input h-12 text-base',
          inputProps.className,
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '',
        )}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
