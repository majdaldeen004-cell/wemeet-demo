'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
// DEMO ONLY — simulated credentials, no SMS/OTP provider is contacted.
import { DEMO_PHONE, DEMO_OTP_CODE, DEMO_MODE_NOTICE } from '@/lib/mock/data';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { authApi } from '@/lib/api';
import { loginSchema, type LoginFormValues } from '@/lib/validation/schemas';
import { PageLoader } from '@/components/ui/Skeletons';
import { FormField } from '@/components/forms/FormFields';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

// Phone input with forced LTR number entry
function PhoneInput() {
  const { register, formState: { errors } } = useFormContext<LoginFormValues>();
  const error = errors.phone?.message as string | undefined;

  return (
    <FormField label="رقم الهاتف" error={error} required>
      <input
        type="tel"
        placeholder={DEMO_PHONE}
        autoFocus
        autoComplete="tel"
        dir="ltr"
        lang="en"
        inputMode="tel"
        {...register('phone')}
        className={clsx(
          'w-full rounded-xl border px-4 py-3 text-sm bg-sand-dark placeholder:text-ink-muted',
          'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition',
          error ? 'border-red-400' : 'border-border-sand',
        )}
        style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
      />
    </FormField>
  );
}

export default function LoginPage() {
  const { isLoading } = useGuestGuard();
  const router = useRouter();
  const { setPendingPhone, login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  if (isLoading) return <PageLoader />;

  const handleSubmit = methods.handleSubmit(async ({ phone }) => {
    setLoading(true);
    try {
      const res = await authApi.sendOtp(phone);
      setPendingPhone(phone);
      if (res.devCode) {
        toast.success(`رمز التطوير: ${res.devCode}`, { duration: 12000 });
      } else {
        toast.success('تم إرسال رمز التحقق!');
      }
      router.push('/verify-otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'فشل إرسال الرمز';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  });


  // DEMO ONLY — one-tap simulated sign-in (no OTP is generated or delivered).
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const phone = methods.getValues('phone') || DEMO_PHONE;
      const res = await authApi.verifyOtp(phone, DEMO_OTP_CODE);
      login(res.tokens!, res.user!);
      toast.success('تم تسجيل الدخول في العرض التجريبي');
      router.push('/home');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'تعذّر الدخول التجريبي';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <span className="text-brand-green">We</span>
            <span className="text-ink">Meet</span>
          </h1>
          <p className="mt-2 text-ink-muted text-sm">تواصل مع أشخاص في فعاليات حقيقية قريبة منك</p>
        </div>

        <div className="bg-surface rounded-3xl p-6 shadow-card border border-border space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">أهلاً بك</h2>
            <p className="text-sm text-ink-muted mt-1">أدخل رقم هاتفك للمتابعة</p>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PhoneInput />
              <Button type="submit" fullWidth size="lg" loading={loading}>
                إرسال رمز التحقق
              </Button>
            </form>
          </FormProvider>


          {/* ── DEMO ONLY ────────────────────────────────────────────────────
              The production screen has no such panel. It exists so a visitor
              can reach the rest of the (fictional) UI without a real phone
              number: authentication here is simulated end-to-end. */}
          <div className="rounded-2xl border border-dashed border-brand-green/50 bg-brand-green-light/40 p-4 space-y-2">
            <p className="text-xs font-bold text-brand-green-dark">وضع العرض التجريبي</p>
            <p className="text-xs text-ink-soft leading-relaxed">{DEMO_MODE_NOTICE}</p>
            <p className="text-xs text-ink-soft">
              استخدم أي رقم هاتف، ورمز التحقق{' '}
              <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono font-bold">{DEMO_OTP_CODE}</code>
            </p>
            <Button variant="secondary" fullWidth type="button" disabled={loading} onClick={handleDemoLogin}>
              دخول تجريبي سريع
            </Button>
          </div>

          <p className="text-xs text-ink-muted text-center">
            يجب أن يكون عمرك 18 سنة أو أكثر. بالمتابعة توافق على شروط الخدمة.
          </p>
        </div>
      </div>
    </div>
  );
}
