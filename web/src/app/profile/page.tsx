'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit3, LogOut, Shield, CheckCircle, AlertTriangle, Save, X, Camera, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, Card, Badge, Button } from '@/components/ui';
import { ProfileSkeleton } from '@/components/ui/Skeletons';
import { FormInput } from '@/components/forms/FormFields';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';

// Profile update schema — display name only (gender is immutable after registration)
const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'على الأقل حرفان').max(40, 'الحد الأقصى 40 حرفاً'),
});
type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { user, loading, redFlags, redFlagsLoading, refreshMe, updateProfile, loadRedFlags } = useProfile();
  const [editing, setEditing] = useState(false);

  // ── Avatar upload state ─────────────────────────────────────────────────────
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const methods = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    values: { displayName: user?.displayName ?? '' },
  });

  useEffect(() => { refreshMe(); loadRedFlags(); }, []);

  const handleSave = methods.handleSubmit(async (data) => {
    // gender is immutable — not sent to backend
    const ok = await updateProfile({
      displayName: data.displayName,
      bio: user?.bio ?? undefined,
    });
    if (ok) setEditing(false);
  });

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  // ── Avatar upload handler ───────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarError('يُسمح فقط بصور JPEG أو PNG أو WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('يجب أن تكون الصورة أصغر من 5 ميجابايت.');
      return;
    }

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      await apiClient.post('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshMe();
    } catch {
      setAvatarError('فشل الرفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  if (loading && !user) return <AppShell><div className="max-w-2xl mx-auto px-4 py-6"><ProfileSkeleton /></div></AppShell>;
  if (!user) return null;

  const flagPercent = redFlags ? Math.min((redFlags.total / redFlags.banThreshold) * 100, 100) : 0;
  const flagColor = flagPercent >= 60 ? 'bg-red-400' : flagPercent >= 40 ? 'bg-yellow-400' : 'bg-brand-green';

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">الملف الشخصي</h1>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); methods.reset(); }}>
                  <X size={14} /> إلغاء
                </Button>
                <Button size="sm" loading={methods.formState.isSubmitting} onClick={handleSave}>
                  <Save size={14} /> حفظ
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Edit3 size={14} /> تعديل
              </Button>
            )}
          </div>
        </div>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            {/* ── Avatar with upload overlay ── */}
            <div className="relative flex-shrink-0">
              <Avatar src={user.avatarUrl} name={user.displayName} size="xl" />

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                aria-label="رفع صورة الملف الشخصي"
                onChange={handleAvatarChange}
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 rounded-full bg-brand-green text-white p-1.5 shadow-md
                           hover:bg-brand-green/90 transition disabled:opacity-60"
                aria-label="تغيير صورة الملف الشخصي"
              >
                {avatarUploading
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Camera size={13} />}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              {!editing && (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-ink">{user.displayName}</h2>
                    {user.isVerified && <CheckCircle size={16} className="text-brand-green" />}
                  </div>
                  <p className="text-sm text-ink-muted">{user.phone}</p>
                </>
              )}
            </div>
          </div>

          {/* Avatar error */}
          {avatarError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={12} /> {avatarError}
            </p>
          )}

          {/* Edit form — display name only */}
          {editing && (
            <FormProvider {...methods}>
              <div className="space-y-3">
                <FormInput<UpdateProfileFormValues>
                  name="displayName"
                  label="الاسم الظاهر"
                  required
                />
                {/* gender is immutable after registration */}
                {user.gender && (
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      الجنس
                      <span className="mr-1 text-ink-soft font-normal">— لا يمكن تعديل الجنس</span>
                    </label>
                    <input
                      type="text"
                      value={user.gender}
                      disabled
                      title="الجنس لا يمكن تغييره بعد التسجيل"
                      className="w-full px-3 py-2 rounded-xl border border-sand-dark bg-sand text-ink-muted text-sm cursor-not-allowed opacity-70"
                    />
                  </div>
                )}
              </div>
            </FormProvider>
          )}
        </Card>

        {/* Trust score */}
        {!redFlagsLoading && redFlags && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={18} className={redFlags.total >= redFlags.warnThreshold ? 'text-yellow-500' : 'text-brand-green'} />
              <h3 className="text-sm font-semibold text-ink">درجة الثقة</h3>
              <Badge variant={redFlags.total === 0 ? 'green' : redFlags.total >= redFlags.warnThreshold ? 'red' : 'yellow'}>
                {redFlags.total === 0 ? 'نظيف' : `${redFlags.total} إشارة`}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-sand-dark rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${flagColor}`} style={{ width: `${flagPercent}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-ink-muted">
                <span>0</span>
                <span>{redFlags.warnThreshold} تحذير</span>
                <span>{redFlags.banThreshold} حظر</span>
              </div>
            </div>
            {redFlags.total > 0 && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  {redFlags.banThreshold - redFlags.total} إشارة أخرى حتى الحظر الدائم. احضر الفعاليات كما وعدت واتبع القواعد.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Stats */}
        {user.stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'نظّمت', value: user.stats.eventsOrganized },
              { label: 'انضممت', value: user.stats.eventsJoined },
              { label: 'أصدقاء', value: user.stats.friends },
            ].map(({ label, value }) => (
              <Card key={label} className="p-3 text-center">
                <p className="text-2xl font-bold text-ink">{value}</p>
                <p className="text-xs text-ink-muted">{label}</p>
              </Card>
            ))}
          </div>
        )}

        <Button variant="danger" fullWidth onClick={handleLogout}>
          <LogOut size={16} /> تسجيل الخروج
        </Button>
      </div>
    </AppShell>
  );
}
