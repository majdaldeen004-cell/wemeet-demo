'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Trophy, PlusCircle, X, Joystick } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { FormInput, FormTextarea, FormDateTime, FormField } from '@/components/forms/FormFields';
import { apiPost } from '@/lib/api/client';
import { extractApiError } from '@wemeet/shared';
import toast from 'react-hot-toast';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title:            z.string().min(1, 'العنوان مطلوب'),
  game:             z.string().min(1, 'اسم اللعبة مطلوب'),
  description:      z.string().optional(),
  maxParticipants:  z.coerce.number({ invalid_type_error: 'يجب أن يكون رقماً' }).min(2, 'الحد الأدنى مشاركان'),
  prizePool:        z.string().optional(),
  registrationEndsAt: z.string().optional(),
  startsAt:         z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Styled field wrapper (dark gaming theme) ─────────────────────────────────

function GamingInput({ label, required, error, children }: {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: '#c4b5fd' }}>
          {label}
          {required && <span style={{ color: '#f87171' }} className="ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
      )}
    </div>
  );
}

const inputClass = [
  'w-full rounded-xl px-4 py-3 text-sm',
  'focus:outline-none focus:ring-2 transition',
].join(' ');

const inputStyle = {
  background: 'rgba(15,5,35,0.8)',
  border: '1px solid rgba(139,92,246,0.3)',
  color: '#e2d9f3',
};

const inputFocusStyle = {
  '--tw-ring-color': 'rgba(139,92,246,0.5)',
} as React.CSSProperties;

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'rgba(15,5,35,0.8)',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ruleInput, setRuleInput] = useState('');
  const [rules, setRules] = useState<string[]>([]);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', game: '', description: '',
      maxParticipants: 8 as unknown as number,
      prizePool: '', registrationEndsAt: '', startsAt: '',
    },
  });

  const { formState: { errors } } = methods;

  const handleAddRule = () => {
    const trimmed = ruleInput.trim();
    if (!trimmed || rules.length >= 10) return;
    setRules((r) => [...r, trimmed]);
    setRuleInput('');
  };

  const handleRemoveRule = (i: number) => setRules((r) => r.filter((_, idx) => idx !== i));

  const handleSubmit = methods.handleSubmit(async (data) => {
    setLoading(true);
    try {
      const payload = {
        title:           data.title,
        game:            data.game,
        description:     data.description || undefined,
        maxParticipants: data.maxParticipants,
        prizePool:       data.prizePool || undefined,
        registrationEndsAt: data.registrationEndsAt
          ? new Date(data.registrationEndsAt).toISOString()
          : undefined,
        startsAt: data.startsAt
          ? new Date(data.startsAt).toISOString()
          : undefined,
        rules: rules.length > 0 ? rules : undefined,
      };

      const result = await apiPost<{ id: string }>('/gaming/tournaments', payload);
      toast.success('تم إنشاء البطولة!');
      router.push(`/gaming/tournaments/${result.id}`);
    } catch (err) {
      toast.error(extractApiError(err, 'فشل إنشاء البطولة'));
    } finally {
      setLoading(false);
    }
  });

  return (
    <AppShell>
      {/* Hero header — matches gaming page theme */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a0a3c 0%, #111828 40%, #0d1f3c 100%)',
          minHeight: 100,
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139,92,246,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#a78bfa',
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 0 16px rgba(124,58,237,0.4)',
              }}
            >
              <Trophy size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">بطولة جديدة</h1>
              <p className="text-[11px]" style={{ color: '#a78bfa' }}>
                <Joystick size={10} className="inline mr-1" />
                Game Hub
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div
        className="max-w-2xl mx-auto px-4 py-5 space-y-4"
        style={{ background: '#111828', minHeight: 'calc(100vh - 100px)' }}
      >
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Basic info */}
            <Section title="معلومات البطولة">
              <GamingInput label="عنوان البطولة" required error={errors.title?.message}>
                <input
                  {...methods.register('title')}
                  placeholder="WeMeet Championship 2025"
                  className={inputClass}
                  style={{ ...inputStyle, ...inputFocusStyle,
                    ...(errors.title ? { border: '1px solid rgba(248,113,113,0.6)' } : {}) }}
                />
              </GamingInput>

              <GamingInput label="اللعبة" required error={errors.game?.message}>
                <input
                  {...methods.register('game')}
                  placeholder="FIFA 25 / Valorant / Chess..."
                  className={inputClass}
                  style={{ ...inputStyle, ...inputFocusStyle,
                    ...(errors.game ? { border: '1px solid rgba(248,113,113,0.6)' } : {}) }}
                />
              </GamingInput>

              <GamingInput label="الوصف (اختياري)" error={errors.description?.message}>
                <textarea
                  {...methods.register('description')}
                  placeholder="أخبر اللاعبين عن البطولة..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                  style={{ ...inputStyle, ...inputFocusStyle }}
                />
              </GamingInput>
            </Section>

            {/* Settings */}
            <Section title="إعدادات البطولة">
              <GamingInput label="الحد الأقصى للمشاركين" required error={errors.maxParticipants?.message}>
                <input
                  {...methods.register('maxParticipants')}
                  type="number"
                  min={2}
                  placeholder="8"
                  className={inputClass}
                  style={{ ...inputStyle, ...inputFocusStyle,
                    ...(errors.maxParticipants ? { border: '1px solid rgba(248,113,113,0.6)' } : {}) }}
                />
              </GamingInput>

              <GamingInput label="جائزة البطولة (اختياري)" error={errors.prizePool?.message}>
                <input
                  {...methods.register('prizePool')}
                  placeholder="10,000 ل.س / كأس / رصيد..."
                  className={inputClass}
                  style={{ ...inputStyle, ...inputFocusStyle }}
                />
              </GamingInput>
            </Section>

            {/* Dates — reuse FormDateTime with a dark override wrapper */}
            <Section title="المواعيد">
              {/*
                FormDateTime uses design-system CSS vars internally.
                We wrap it in a div that overrides --color-sand-dark and borders
                to match the gaming dark theme via inline var injection.
              */}
              <div style={{ '--tw-ring-color': 'rgba(139,92,246,0.5)' } as React.CSSProperties}>
                <GamingInput label="آخر موعد للتسجيل" error={errors.registrationEndsAt?.message}>
                  <div className="[&_input]:bg-[#0f0523] [&_input]:border-[rgba(139,92,246,0.3)] [&_input]:text-[#e2d9f3] [&_div]:bg-[#0f0523] [&_div]:border-[rgba(139,92,246,0.3)] [&_span]:text-[#a78bfa]">
                    <FormDateTime<FormValues> name="registrationEndsAt" />
                  </div>
                </GamingInput>

                <GamingInput label="موعد بدء البطولة" error={errors.startsAt?.message}>
                  <div className="[&_input]:bg-[#0f0523] [&_input]:border-[rgba(139,92,246,0.3)] [&_input]:text-[#e2d9f3] [&_div]:bg-[#0f0523] [&_div]:border-[rgba(139,92,246,0.3)] [&_span]:text-[#a78bfa]">
                    <FormDateTime<FormValues> name="startsAt" />
                  </div>
                </GamingInput>
              </div>
            </Section>

            {/* Rules — dynamic list */}
            <Section title={`القواعد (${rules.length}/10)`}>
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: '#7c3aed' }}>
                    {i + 1}.
                  </span>
                  <span className="text-sm flex-1" style={{ color: '#e2d9f3' }}>{rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(i)}
                    className="flex-shrink-0 transition-colors hover:opacity-80"
                    style={{ color: '#6d28d9' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {rules.length < 10 && (
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:opacity-50"
                    style={{
                      background: 'rgba(15,5,35,0.8)',
                      border: '1px solid rgba(139,92,246,0.25)',
                      color: '#e2d9f3',
                      '--tw-ring-color': 'rgba(139,92,246,0.4)',
                    } as React.CSSProperties}
                    placeholder="أضف قاعدة..."
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule(); } }}
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: 'rgba(124,58,237,0.2)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: '#a78bfa',
                    }}
                  >
                    <PlusCircle size={14} />
                    إضافة
                  </button>
                </div>
              )}
            </Section>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: loading
                  ? 'rgba(124,58,237,0.4)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
                border: '1px solid rgba(167,139,250,0.3)',
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  <Trophy size={17} />
                  إنشاء البطولة
                </>
              )}
            </button>

          </form>
        </FormProvider>
      </div>
    </AppShell>
  );
}
