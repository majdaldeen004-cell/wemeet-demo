import { ReactNode, SelectHTMLAttributes, forwardRef } from 'react';
import NextImage from 'next/image';
import { clsx } from 'clsx';

export { Button } from './Button';
export { Input } from './Input';

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className, onClick }: {
  children: ReactNode; className?: string; onClick?: () => void;
}) => (
  <div
    className={clsx(
      'bg-surface rounded-2xl shadow-card border border-border',
      onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow',
      className,
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name, size = 'md' }: {
  src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  if (src) {
    return <NextImage src={src} alt={name} width={40} height={40} className={clsx('rounded-full object-cover', sizes[size])} />;
  }

  return (
    <div className={clsx(
      'rounded-full bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center text-white font-semibold flex-shrink-0',
      sizes[size],
    )}>
      {initials}
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default' }: {
  children: ReactNode;
  variant?: 'default' | 'green' | 'blue' | 'red' | 'yellow' | 'sand';
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    green:   'bg-brand-green-light text-green-700',
    blue:    'bg-brand-blue-light text-blue-700',
    red:     'bg-red-50 text-red-600',
    yellow:  'bg-yellow-50 text-yellow-700',
    sand:    'bg-sand text-ink-soft',
  };
  return (
    <span className={clsx('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', variants[variant])}>
      {children}
    </span>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={clsx('animate-pulse bg-sand-dark rounded-xl', className)} />
);

export const SkeletonCard = () => (
  <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    <Skeleton className="h-9 w-full" />
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark',
          'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
          error ? 'border-red-400' : 'border-border-sand',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={clsx('border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin', sizes[size], className)} />
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }: {
  icon?: string | ReactNode; title: string; description?: string; action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
    {icon && (
      typeof icon === 'string'
        ? <span className="text-5xl">{icon}</span>
        : <span className="text-ink-muted">{icon}</span>
    )}
    <h3 className="font-semibold text-ink text-lg">{title}</h3>
    {description && <p className="text-ink-muted text-sm max-w-xs">{description}</p>}
    {action}
  </div>
);
