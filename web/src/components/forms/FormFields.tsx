'use client';
import {
  useFormContext,
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';

// ─── FormField wrapper ────────────────────────────────────────────────────────

export const FormField = ({ label, error, hint, required, children }: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-500">
        <AlertCircle size={11} />
        {error}
      </p>
    )}
    {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
  </div>
);

// ─── Connected Input ──────────────────────────────────────────────────────────

interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  rules?: RegisterOptions<T>;
}

export function FormInput<T extends FieldValues>({
  name, label, hint, required, type = 'text', placeholder,
  autoFocus, autoComplete, disabled, rules,
}: FormInputProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;

  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <input
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        disabled={disabled}
        {...register(name, rules)}
        className={clsx(
          'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark placeholder:text-ink-muted',
          'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-400' : 'border-border-sand',
        )}
      />
    </FormField>
  );
}

// ─── Connected Select ─────────────────────────────────────────────────────────

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  options: { value: string; label: string }[];
  rules?: RegisterOptions<T>;
}

export function FormSelect<T extends FieldValues>({
  name, label, required, disabled, options, rules,
}: FormSelectProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;

  return (
    <FormField label={label} error={error} required={required}>
      <select
        disabled={disabled}
        {...register(name, rules)}
        className={clsx(
          'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark',
          'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
          error ? 'border-red-400' : 'border-border-sand',
        )}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </FormField>
  );
}

// ─── Connected Textarea ───────────────────────────────────────────────────────

interface FormTextareaProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  rules?: RegisterOptions<T>;
}

export function FormTextarea<T extends FieldValues>({
  name, label, hint, required, placeholder, rows = 4, rules,
}: FormTextareaProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;

  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <textarea
        placeholder={placeholder}
        rows={rows}
        {...register(name, rules)}
        className={clsx(
          'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark placeholder:text-ink-muted resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
          error ? 'border-red-400' : 'border-border-sand',
        )}
      />
    </FormField>
  );
}

// ─── Arabic DateTime Picker ────────────────────────────────────────────────────
// Opens the native datetime-local picker on any click in the field.
// Displays the value as DD/MM/YYYY HH:MM in the visible label.

interface FormDateTimeProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  hint?: string;
  required?: boolean;
  rules?: RegisterOptions<T>;
}

export function FormDateTime<T extends FieldValues>({
  name, label, hint, required, rules,
}: FormDateTimeProps<T>) {
  const { register, watch, formState: { errors } } = useFormContext<T>();
  const rawValue = watch(name) as string | undefined;
  const error = errors[name]?.message as string | undefined;

  const displayValue = rawValue
    ? (() => {
        // rawValue is "YYYY-MM-DDTHH:MM" or "YYYY-MM-DD HH:MM"
        const [datePart, timePart] = rawValue.split('T');
        if (!datePart) return rawValue;
        const [y, m, d] = datePart.split('-');
        const time = timePart ? timePart.slice(0, 5) : '';
        return time ? `${d}/${m}/${y} ${time}` : `${d}/${m}/${y}`;
      })()
    : '';

  return (
    <FormField label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {/* Visible display */}
        <div
          className={clsx(
            'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark pointer-events-none select-none',
            'absolute inset-0 flex items-center',
            error ? 'border-red-400' : 'border-border-sand',
          )}
          style={{ zIndex: 1 }}
        >
          <span className={displayValue ? 'text-ink' : 'text-ink-muted'}>
            {displayValue || 'يوم/شهر/سنة ساعة:دقيقة'}
          </span>
        </div>
        {/* Native input — transparent, on top */}
        <input
          type="datetime-local"
          {...register(name, rules)}
          className={clsx(
            'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark',
            'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
            'opacity-0 cursor-pointer relative',
            error ? 'border-red-400' : 'border-border-sand',
          )}
          style={{ zIndex: 2 }}
        />
      </div>
    </FormField>
  );
}
