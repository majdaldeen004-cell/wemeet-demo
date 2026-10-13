import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink">{label}</label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark placeholder:text-ink-muted',
          'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
          error ? 'border-red-400' : 'border-border-sand',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark placeholder:text-ink-muted resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
          error ? 'border-red-400' : 'border-border-sand',
          className,
        )}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);
TextArea.displayName = 'TextArea';
