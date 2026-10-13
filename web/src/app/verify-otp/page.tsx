'use client';
/**
 * web/src/app/verify-otp/page.tsx
 *
 * [V-1] localStorage conflict resolved:
 *   - Removed all localStorage.getItem('wm_terms_v1') calls.
 *   - After successful login, this page always pushes to '/home'.
 *   - The middleware intercepts that navigation and redirects to '/terms'
 *     automatically when the HttpOnly wm_terms_v1 cookie is absent.
 *   - No client-side terms check needed or wanted here.
 *
 * [DEV MODE] Static OTP auto-fill:
 *   - When NODE_ENV === 'development', the 6 digit boxes are pre-filled with
 *     DEV_OTP_CODE ('123456') so you never have to type it manually.
 *   - A highlighted banner and a "⚡ Dev: تأكيد سريع" button appear, letting
 *     you bypass the OTP flow with a single tap.
 *   - Both the banner and the button are completely absent in production builds
 *     because Next.js tree-shakes the IS_DEV branch at compile time.
 */
import { useState, useRef, useEffect } from 'react';
import { useRouter }    from 'next/navigation';
import toast            from 'react-hot-toast';
import { Smartphone }   from 'lucide-react';
import { Button }       from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { authApi }      from '@/lib/api';
import { clsx }         from 'clsx';
import { OTP_CONFIG }   from '@wemeet/shared';

// ─── Dev-mode config ──────────────────────────────────────────────────────────
//
// process.env.NODE_ENV is inlined as a string literal by Next.js at build time.
// In production the entire `if (IS_DEV) { … }` block is dead code and is
// eliminated by the bundler — nothing dev-related ships to users.
//
// Must match the DEV_OTP_CODE constant in:
//   backend/src/modules/auth/service/otp.service.ts
//
const IS_DEV       = process.env.NODE_ENV === 'development';
const DEV_OTP_CODE = '123456';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { pendingPhone, login, setSetupToken } = useAuthStore();

  // ── Pre-fill digits in dev mode ──────────────────────────────────────────
  // In development, digits are initialised with DEV_OTP_CODE so the developer
  // sees the boxes already filled and only needs to press "⚡ Dev: تأكيد سريع".
  const [digits, setDigits]   = useState<string[]>(
    IS_DEV ? DEV_OTP_CODE.split('') : Array(6).fill(''),
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  // Mirrors the server's per-phone resend cooldown (otp.service.ts) — we just
  // triggered a send right before navigating here, so it's already ticking
  // server-side. Re-synced from the server's own secondsLeft whenever we get
  // a fresh OTP_COOLDOWN response, so client/server can't drift out of sync.
  const [cooldown, setCooldown] = useState<number>(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!pendingPhone) router.replace('/login');
    // In dev mode the digits are already filled — no need to focus the first
    // box (which would scroll the page or open an on-screen keyboard on mobile).
    if (!IS_DEV) inputs.current[0]?.focus();
  }, [pendingPhone, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!pendingPhone || cooldown > 0 || resending) return;
    setResending(true);
    try {
      const res = await authApi.sendOtp(pendingPhone);
      setDigits(Array(6).fill(''));
      inputs.current[0]?.focus();
      setCooldown(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
      if (res.devCode) {
        toast.success(`رمز التطوير: ${res.devCode}`, { duration: 12000 });
      } else {
        toast.success('تم إرسال رمز جديد!');
      }
    } catch (err: unknown) {
      const error = (err as { response?: { data?: { error?: {
        message?: string;
        details?: { secondsLeft?: number };
      } } } })?.response?.data?.error;
      // If the server disagrees about how much cooldown is left (e.g. this
      // tab was left open longer than the countdown thinks), resync to its
      // authoritative value instead of leaving a stale "Resend" button.
      if (typeof error?.details?.secondsLeft === 'number') {
        setCooldown(error.details.secondsLeft);
      }
      toast.error(error?.message ?? 'فشل إرسال الرمز');
    } finally {
      setResending(false);
    }
  };

  const handleChange = (i: number, val: string) => {
    const d    = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i]    = d;
    setDigits(next);
    if (d && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((c) => c !== '')) void handleVerify(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      setTimeout(() => void handleVerify(pasted), 50);
    }
  };

  const handleVerify = async (code: string) => {
    if (!pendingPhone) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(pendingPhone, code);

      if (res.isNewUser) {
        setSetupToken(res.setupToken!);
        router.push('/complete-profile');
        return;
      }

      // Hydrate the store — this also writes wm_session + wm_is_admin cookies.
      login(res.tokens!, res.user!);
      toast.success(`Welcome back, ${res.user!.displayName}!`);

      /**
       * Always navigate to /home.
       * The middleware handles the rest:
       *   - wm_terms_v1 absent  → redirect to /terms  (server-set HttpOnly cookie)
       *   - wm_terms_v1 present → pass through to /home
       * No localStorage check here — that was the V-1 conflict.
       */
      router.push('/home');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Invalid or expired code';
      toast.error(msg);
      setDigits(Array(6).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center">
          <div className="text-5xl mb-4 flex justify-center text-green-600">
            <Smartphone size={52} />
          </div>
          <h1 className="text-2xl font-bold text-ink">تحقق من هاتفك</h1>
          <p className="mt-2 text-ink-muted text-sm">
            أرسلنا رمزاً مكوناً من 6 أرقام إلى<br />
            <span className="font-medium text-ink">{pendingPhone}</span>
          </p>
        </div>

        {/* ── DEV MODE banner ──────────────────────────────────────────────
            Visible ONLY when NODE_ENV === 'development'.
            The IS_DEV constant is false at build time in production so the
            entire block is eliminated — zero runtime cost. */}
        {IS_DEV && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            <span className="text-base">🛠</span>
            <span>
              <span className="font-semibold">Dev Mode</span> — الرمز الثابت:{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-bold tracking-widest">
                {DEV_OTP_CODE}
              </code>
            </span>
          </div>
        )}

        <div className="bg-surface rounded-3xl p-6 shadow-card border border-border space-y-6">
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={clsx(
                  'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-sand-dark transition',
                  'focus:outline-none focus:border-brand-green',
                  d ? 'border-brand-green bg-brand-green-light' : 'border-border-sand',
                )}
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
              <span className="w-4 h-4 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
              Verifying...
            </div>
          )}

          {/* ── DEV: Quick verify button ────────────────────────────────────
              Calls handleVerify directly with the static code.
              Styled with dashed amber border to stand out visually but
              clearly not production UI. Stripped entirely in prod build. */}
          {IS_DEV && (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => void handleVerify(DEV_OTP_CODE)}
              disabled={loading}
              className="border border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 font-semibold"
            >
              ⚡ Dev: تأكيد سريع
            </Button>
          )}

          <div className="text-center text-sm">
            {cooldown > 0 ? (
              <span className="text-ink-muted">
                إعادة الإرسال متاحة بعد {cooldown} ثانية
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending}
                className="font-medium text-brand-green hover:underline disabled:opacity-50"
              >
                {resending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
              </button>
            )}
          </div>

          <Button variant="ghost" fullWidth onClick={() => router.push('/login')}>
            ← Change phone number
          </Button>
        </div>

      </div>
    </div>
  );
}
