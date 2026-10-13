/**
 * web/src/app/settings/page.tsx
 *
 * [C-6] Settings page now persists to backend via debounced PATCH calls.
 *       Toggles are no longer UI-only local state.
 */
'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Shield, User, Loader2, CheckCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui';
import { apiGet, apiPatch } from '@/lib/api/client';
import type { NotificationPreferences as NotificationPreferencesDto } from '@wemeet/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationPreferences = Omit<NotificationPreferencesDto, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

const DEFAULTS: NotificationPreferences = {
  eventInvite:    true,
  eventUpdate:    true,
  eventStarting:  true,
  friendRequest:  true,
  friendAccepted: true,
  newMessage:     true,
  redFlag:        true,
  marketing:      false,
};

const PREF_LABELS: { key: keyof NotificationPreferences; label: string; sub: string }[] = [
  { key: 'eventInvite',    label: 'دعوات الفعاليات',        sub: 'عندما يدعوك أحدهم إلى فعالية' },
  { key: 'eventUpdate',    label: 'تحديثات الفعاليات',      sub: 'التغييرات على الفعاليات التي انضممت إليها' },
  { key: 'eventStarting',  label: 'اقتراب موعد الفعالية',   sub: 'ساعة واحدة قبل بدء فعاليتك' },
  { key: 'friendRequest',  label: 'طلبات الصداقة',          sub: 'عندما يرسل إليك أحدهم طلب صداقة' },
  { key: 'friendAccepted', label: 'قبول طلب الصداقة',       sub: 'عندما يقبل أحدهم طلبك' },
  { key: 'newMessage',     label: 'رسائل جديدة',            sub: 'الرسائل المباشرة ودردشة الفعاليات' },
  { key: 'redFlag',        label: 'تنبيهات الإشارة الحمراء', sub: 'تنبيهات الثقة والسلامة المهمة' },
  { key: 'marketing',      label: 'تحديثات المنتج',          sub: 'الميزات الجديدة والإعلانات' },
];

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
        ${on ? 'bg-green-500' : 'bg-slate-200'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${on ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [prefs,     setPrefs]     = useState<NotificationPreferences>(DEFAULTS);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState(false);

  // [C-6] Debounce ref — saves 600ms after last toggle, avoids request flood
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPrefs = useRef<NotificationPreferences>(DEFAULTS);

  // Load preferences on mount
  useEffect(() => {
    apiGet<NotificationPreferences>('/users/me/notification-preferences')
      .then((data) => {
        setPrefs(data);
        latestPrefs.current = data;
      })
      .catch(() => { /* use defaults */ })
      .finally(() => setLoading(false));
  }, []);

  // [C-6] Debounced PATCH — fires 600ms after last toggle
  const scheduleSave = useCallback((updated: NotificationPreferences) => {
    latestPrefs.current = updated;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      setSaved(false);
      try {
        await apiPatch('/users/me/notification-preferences', latestPrefs.current);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 3000);
      } finally {
        setSaving(false);
      }
    }, 600);
  }, []);

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    scheduleSave(updated);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User size={20} /> الإعدادات
          </h1>
          {/* Save indicator */}
          <div className="h-6 flex items-center gap-1.5 text-xs">
            {saving && <Loader2 size={13} className="animate-spin text-slate-400" />}
            {saving && <span className="text-slate-400">جارٍ الحفظ...</span>}
            {!saving && saved && (
              <>
                <CheckCircle size={13} className="text-green-500" />
                <span className="text-green-600 font-medium">تم الحفظ</span>
              </>
            )}
            {!saving && saveError && (
              <span className="text-red-500 font-medium">⚠️ Couldn’t save — check your connection</span>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Bell size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">تفضيلات الإشعارات</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-slate-100 rounded w-36" />
                    <div className="h-3 bg-slate-100 rounded w-52" />
                  </div>
                  <div className="h-6 w-11 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {PREF_LABELS.map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                  </div>
                  <Toggle
                    on={prefs[key]}
                    onChange={(v) => handleToggle(key, v)}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Trust & Safety */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <Shield size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">الثقة والسلامة</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-slate-500">
              تنبيهات الإشارة الحمراء مفعّلة دائماً ولا يمكن إيقافها. تحمي سلامة مجتمع WeMeet.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
