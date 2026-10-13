'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { FormInput, FormSelect, FormField } from '@/components/forms/FormFields';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { UserCircle2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const completeProfileSchema = z.object({
  displayName: z
    .string().trim().min(2, 'على الأقل حرفان').max(40, 'الحد الأقصى 40 حرفاً'),
  birthDate: z
    .string().min(1, 'مطلوب')
    .refine((val) => {
      const d = new Date(val);
      const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      return age >= 18;
    }, 'يجب أن يكون عمرك 18 سنة على الأقل'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
});

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

// ── Custom Arabic Date Picker (DD/MM/YYYY) ───────────────────────────────────
function ArabicDatePicker({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear() - 20);
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD → display DD/MM/YYYY
  const display = value
    ? (() => {
        const [y, m, d] = value.split('-');
        return `${d}/${m}/${y}`;
      })()
    : '';

  const MONTHS_AR = [
    'يناير','فبراير','مارس','أبريل','مايو','يونيو',
    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
  ];
  const DAYS_AR = ['ح','ن','ث','ر','خ','ج','س'];

  const today = new Date();
  const maxYear = today.getFullYear() - 18;

  // Clamp viewYear so we never show future years (users must be 18+)
  const clampedYear = Math.min(viewYear, maxYear);

  const firstDayOfMonth = new Date(clampedYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(clampedYear, viewMonth + 1, 0).getDate();

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${clampedYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const nextY = viewMonth === 11 ? clampedYear + 1 : clampedYear;
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    if (nextY > maxYear || (nextY === maxYear && nextM > today.getMonth())) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === clampedYear && m === viewMonth + 1 && d === day;
  };

  const isDisabled = (day: number) => {
    const candidate = new Date(clampedYear, viewMonth, day);
    const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return candidate > minAge;
  };

  return (
    <FormField label="تاريخ الميلاد" error={error} required>
      <div ref={ref} className="relative">
        {/* Trigger */}
        <div
          onClick={() => setOpen(o => !o)}
          className="w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark cursor-pointer flex items-center justify-between select-none"
          style={{ borderColor: error ? '#f87171' : '#d6c9b0' }}
        >
          <span className={display ? 'text-ink' : 'text-ink-muted'}>
            {display || 'يوم/شهر/سنة'}
          </span>
          <Calendar size={16} className="text-ink-muted" />
        </div>

        {/* Calendar dropdown */}
        {open && (
          <div
            className="absolute z-50 mt-2 rounded-2xl shadow-xl border border-border overflow-hidden"
            style={{ background: '#fff', width: '100%', minWidth: 280 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: '#f8f5f0', borderBottom: '1px solid #e8e0d4' }}
            >
              <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-sand transition">
                <ChevronRight size={16} className="text-ink-soft" />
              </button>
              <div className="text-center">
                <p className="font-bold text-ink text-sm">{MONTHS_AR[viewMonth]}</p>
                <div className="flex items-center gap-1 justify-center mt-0.5">
                  <button type="button" onClick={() => setViewYear(y => Math.min(y - 1, maxYear))}
                    className="text-[10px] text-ink-muted hover:text-ink transition px-1">▲</button>
                  <span className="text-xs font-semibold text-ink-soft">{clampedYear}</span>
                  <button type="button" onClick={() => setViewYear(y => Math.min(y + 1, maxYear))}
                    className="text-[10px] text-ink-muted hover:text-ink transition px-1">▼</button>
                </div>
              </div>
              <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-sand transition">
                <ChevronLeft size={16} className="text-ink-soft" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-3 pt-2 pb-1">
              {DAYS_AR.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-ink-muted py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const sel = isSelected(day);
                const dis = isDisabled(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={dis}
                    onClick={() => selectDay(day)}
                    className="aspect-square rounded-lg text-xs font-medium transition flex items-center justify-center"
                    style={{
                      background: sel ? '#22c55e' : 'transparent',
                      color: sel ? '#fff' : dis ? '#d1d5db' : '#0f172a',
                      cursor: dis ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!sel && !dis) (e.target as HTMLElement).style.background = '#f0fdf4';
                    }}
                    onMouseLeave={(e) => {
                      if (!sel) (e.target as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}

const GENDER_OPTIONS = [
  { value: 'MALE',            label: 'ذكر' },
  { value: 'FEMALE',          label: 'أنثى' },
  { value: 'OTHER',           label: 'أخرى' },
  { value: 'PREFER_NOT_TO_SAY', label: 'أفضل عدم الإفصاح' },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { setupToken, login } = useAuthStore();

  const methods = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { displayName: '', birthDate: '', gender: 'PREFER_NOT_TO_SAY' },
  });

  useEffect(() => {
    if (!setupToken) router.replace('/login');
  }, [setupToken, router]);

  const handleSubmit = methods.handleSubmit(async (data) => {
    if (!setupToken) return;
    try {
      const res = await authApi.completeProfile(setupToken, {
        displayName: data.displayName,
        birthDate: data.birthDate,
        gender: data.gender,
      });
      login(res.tokens, res.user);
      toast.success(`مرحباً في WeMeet، ${res.user.displayName}!`);
      router.push('/terms');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string; details?: { path: string; message: string }[] } } } };
      const details = apiErr?.response?.data?.error?.details;
      if (details?.length) {
        details.forEach((d) => {
          const field = d.path.split('.').pop() as keyof CompleteProfileFormValues;
          if (field) methods.setError(field, { message: d.message });
        });
      } else {
        toast.error(apiErr?.response?.data?.error?.message ?? 'فشل إنشاء الملف الشخصي');
      }
    }
  });

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-brand-green-light rounded-2xl flex items-center justify-center">
              <UserCircle2 size={36} className="text-brand-green-dark" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-ink">إعداد ملفك الشخصي</h1>
          <p className="text-ink-muted text-sm mt-1">أدخل بيانات حسابك</p>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-card border border-border">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput<CompleteProfileFormValues>
                name="displayName"
                label="الاسم الظاهر"
                placeholder="اسمك"
                required
                autoFocus
              />

              {/* Custom date picker */}
              <Controller
                control={methods.control}
                name="birthDate"
                render={({ field, fieldState }) => (
                  <ArabicDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <FormSelect<CompleteProfileFormValues>
                name="gender"
                label="الجنس"
                options={GENDER_OPTIONS}
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={methods.formState.isSubmitting}
              >
                إنشاء الحساب
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
