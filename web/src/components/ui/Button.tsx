import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary', size = 'md', loading, children,
  className, fullWidth, disabled, ...props
}: ButtonProps) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none';

  const variants = {
    primary:   'bg-brand-green text-white hover:bg-brand-green-dark active:scale-[0.98] focus-visible:ring-brand-green disabled:opacity-50',
    secondary: 'bg-brand-blue text-white hover:bg-brand-blue-dark active:scale-[0.98] focus-visible:ring-brand-blue disabled:opacity-50',
    ghost:     'bg-transparent text-ink hover:bg-sand border border-border-sand active:scale-[0.98]',
    danger:    'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] focus-visible:ring-red-400',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2.5 h-10',
    lg: 'text-base px-6 py-3 h-12',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};
