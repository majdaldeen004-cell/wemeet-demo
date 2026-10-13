'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, CalendarDays, MessageSquare, Flag, BarChart3,
  ShieldAlert, Ban, ShieldCheck, CheckCircle, XCircle,
  RefreshCw, Search,
} from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  users:    { total: number; newToday: number; newThisWeek: number; newThisMonth: number; banned: number };
  events:   { total: number; active: number; cancelled: number };
  messages: { total: number };
  reports:  { total: number; unresolved: number };
  redFlags: Array<{ reason: string; count: number }>;
}

interface AdminUser {
  id: string; phone: string; displayName: string; avatarUrl: string | null;
  isVerified: boolean; isBanned: boolean; isAdmin: boolean;
  redFlagCount: number; createdAt: string;
  _count: { organizedEvents: number; memberships: number };
}

interface Report {
  id: string; reason: string; description: string | null;
  createdAt: string; resolvedAt: string | null;
  filer:    { id: string; displayName: string };
  reported: { id: string; displayName: string; redFlagCount: number; isBanned: boolean };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon, accent }: {
  label: string; value: number; sub?: string;
  icon: React.ReactNode; accent: string;
}) => (
  <div className="bg-white rounded-2xl border border-stone-200 p-5 flex items-start gap-4 shadow-sm">
    <div className={`p-3 rounded-xl ${accent}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-stone-900">{value.toLocaleString('ar-SY')}</p>
      <p className="text-sm font-medium text-stone-600">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'stats' | 'users' | 'reports' | 'events';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tab,      setTab]      = useState<Tab>('stats');
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [reports,  setReports]  = useState<Report[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [msg,      setMsg]      = useState('');

  // Guard: only admins can access this page
  useEffect(() => {
    if (user && !(user as typeof user & { isAdmin?: boolean }).isAdmin) {
      router.replace('/home');
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const data = await apiGet<Stats>('/admin/stats');
        setStats(data);
      } else if (tab === 'users') {
        const data = await apiGet<{ items: AdminUser[] }>(`/admin/users?q=${search}`);
        setUsers(data.items);
      } else if (tab === 'reports') {
        const data = await apiGet<{ items: Report[] }>('/admin/reports?unresolved=true');
        setReports(data.items);
      }
    } catch { setMsg('فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }, [tab, search]);

  useEffect(() => { void load(); }, [load]);

  const banUser = async (userId: string, banned: boolean) => {
    await apiPatch(`/admin/users/${userId}/ban`, { banned });
    setMsg(banned ? 'تم حظر المستخدم' : 'تم رفع الحظر');
    void load();
  };

  const resolveReport = async (reportId: string) => {
    await apiPatch(`/admin/reports/${reportId}/resolve`, {});
    setMsg('تم إغلاق البلاغ');
    void load();
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'stats',   label: 'الإحصائيات', icon: <BarChart3 size={16} /> },
    { id: 'users',   label: 'المستخدمون', icon: <Users     size={16} /> },
    { id: 'reports', label: 'البلاغات',   icon: <Flag      size={16} /> },
    { id: 'events',  label: 'الفعاليات',  icon: <CalendarDays size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-green-600" />
          <h1 className="text-lg font-bold text-stone-900">لوحة إدارة WeMeet</h1>
        </div>
        <button onClick={() => void load()} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {msg && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-center gap-2">
          <CheckCircle size={14} />{msg}
          <button onClick={() => setMsg('')} className="mr-auto"><XCircle size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <nav className="flex gap-1 px-6 mt-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-green-600 text-white' : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </nav>

      <main className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* STATS TAB */}
        {tab === 'stats' && stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="المستخدمون" value={stats.users.total}
                sub={`+${stats.users.newToday} اليوم`}
                icon={<Users size={20} className="text-blue-600" />}
                accent="bg-blue-50" />
              <StatCard label="الفعاليات النشطة" value={stats.events.active}
                sub={`${stats.events.cancelled} ملغاة`}
                icon={<CalendarDays size={20} className="text-green-600" />}
                accent="bg-green-50" />
              <StatCard label="الرسائل" value={stats.messages.total}
                icon={<MessageSquare size={20} className="text-purple-600" />}
                accent="bg-purple-50" />
              <StatCard label="البلاغات المفتوحة" value={stats.reports.unresolved}
                sub={`${stats.reports.total} إجمالي`}
                icon={<ShieldAlert size={20} className="text-red-600" />}
                accent="bg-red-50" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="مستخدمون محظورون" value={stats.users.banned}
                icon={<Ban size={20} className="text-red-500" />} accent="bg-red-50" />
              <StatCard label="أعضاء جدد هذا الأسبوع" value={stats.users.newThisWeek}
                icon={<Users size={20} className="text-amber-600" />} accent="bg-amber-50" />
              <StatCard label="أعضاء جدد هذا الشهر" value={stats.users.newThisMonth}
                icon={<Users size={20} className="text-indigo-600" />} accent="bg-indigo-50" />
            </div>

            {stats.redFlags.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Flag size={16} className="text-red-500" /> أسباب العلامات الحمراء
                </h2>
                <div className="space-y-2">
                  {stats.redFlags.map((rf) => (
                    <div key={rf.reason} className="flex items-center justify-between text-sm">
                      <span className="text-stone-600">{rf.reason}</span>
                      <span className="font-bold text-stone-900 bg-red-50 px-3 py-0.5 rounded-full text-xs">{rf.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center gap-3">
              <Search size={16} className="text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load()}
                placeholder="بحث بالاسم أو رقم الهاتف..."
                className="flex-1 text-sm outline-none text-stone-800 placeholder:text-stone-400 bg-transparent"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    {['المستخدم', 'الهاتف', 'علامات حمراء', 'الفعاليات', 'الإجراء'].map((h) => (
                      <th key={h} className="text-right px-4 py-3 font-semibold text-stone-500 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.avatarUrl
                            ? <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500">{u.displayName[0]}</div>
                          }
                          <div>
                            <p className="font-medium text-stone-900">{u.displayName}</p>
                            <div className="flex gap-1 mt-0.5">
                              {u.isVerified && <span className="text-xs text-green-600 bg-green-50 px-1.5 rounded">موثّق</span>}
                              {u.isAdmin   && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 rounded">مدير</span>}
                              {u.isBanned  && <span className="text-xs text-red-600 bg-red-50 px-1.5 rounded">محظور</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-500 font-mono text-xs">{u.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${u.redFlagCount > 0 ? 'text-red-600' : 'text-stone-400'}`}>
                          {u.redFlagCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{u._count.organizedEvents}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void banUser(u.id, !u.isBanned)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            u.isBanned
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {u.isBanned ? <><ShieldCheck size={12} />رفع الحظر</> : <><Ban size={12} />حظر</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 && (
              <div className="text-center py-16 text-stone-400">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
                <p className="font-medium">لا توجد بلاغات مفتوحة</p>
              </div>
            )}
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag size={14} className="text-red-500" />
                      <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">{r.reason}</span>
                      <span className="text-xs text-stone-400">· {new Date(r.createdAt).toLocaleDateString('ar-SY')}</span>
                    </div>
                    <p className="text-sm text-stone-600 mb-2">{r.description ?? '—'}</p>
                    <div className="text-xs text-stone-500 space-y-0.5">
                      <p>المُبلِّغ: <span className="font-medium text-stone-700">{r.filer.displayName}</span></p>
                      <p>المُبلَّغ عنه: <span className="font-medium text-stone-700">{r.reported.displayName}</span>
                        {r.reported.isBanned && <span className="mr-2 text-red-500">(محظور)</span>}
                        {r.reported.redFlagCount > 0 && <span className="mr-2 text-amber-600">· {r.reported.redFlagCount} علامات</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void resolveReport(r.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    <CheckCircle size={13} />إغلاق
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
