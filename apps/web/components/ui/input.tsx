import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

const FIELD =
  'w-full rounded-lg border border-accent/15 bg-white px-3 py-2.5 text-sm text-accent ' +
  'placeholder:text-accent/40 focus:border-primary-ink/50 focus:outline-none focus:ring-2 ' +
  'focus:ring-primary-ink/30 disabled:bg-base disabled:text-accent/50';

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-accent">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-accent">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-accent/60">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(FIELD, error && 'border-accent/40', className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <select ref={ref} id={fieldId} className={cn(FIELD, 'pr-8', className)} {...props}>
        {children}
      </select>
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea ref={ref} id={fieldId} className={cn(FIELD, 'min-h-24', className)} {...props} />
    </FieldShell>
  );
});

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const generated = useId();
  const fieldId = props.id ?? generated;
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="checkbox"
        id={fieldId}
        className={cn(
          'h-4 w-4 rounded border-accent/25 text-primary-ink accent-primary-ink focus:ring-2 focus:ring-primary-ink/40',
          className,
        )}
        {...props}
      />
      <label htmlFor={fieldId} className="cursor-pointer text-sm text-accent">
        {label}
      </label>
    </div>
  );
}
