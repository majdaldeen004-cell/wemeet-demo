/**
 * web/src/app/terms/page.tsx
 *
 * شروط الخدمة وإخلاء المسؤولية – منصة WeMeet (نسخة مهنية)
 *
 * قراءة قسرية بند بند — التمرير اليدوي معطّل.
 * فقط زر "التالي" يُتيح التقدم. آخر بند: زر "Agree".
 */
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiPost } from '@/lib/api/client';
import {
  Shield, AlertTriangle, Users, Lock,
  Flag, PhoneCall, CheckCircle, XCircle, ChevronDown,
  Scale, Ban, Copyright, RefreshCw, Gavel, Globe2, UserCheck,
} from 'lucide-react';

// ─── 7 أبواب قانونية × أبواب فرعية = 7 بنود رئيسية ─────────────────────────

const CLAUSES = [
  {
    icon: Shield, number: 1,
    title: 'طبيعة الخدمة ونطاقها',
    badge: '⚠️ تنبيه قانوني',
    body: `باستخدامك منصة WeMeet أو أي من خدماتها (التطبيق، الموقع، واجهات البرمجة، أو الخدمات المرتبطة) فإنك تُقرّ وتوافق بشكل صريح وكامل على جميع بنود هذه الاتفاقية. في حال عدم الموافقة، يجب التوقف فوراً عن الاستخدام.

منصة WeMeet هي نظام رقمي يوفّر أدوات تقنية لتمكين المستخدمين من إنشاء وتنظيم الفعاليات والتواصل بينها. لا تقوم المنصة بإنشاء أو إدارة أو الإشراف على أي فعالية يُضيفها المستخدمون، وجميع الفعاليات والمحتوى والتنظيم تتم من قبل المستخدمين أو أطراف مستقلة بالكامل.`,
  },
  {
    icon: UserCheck, number: 2,
    title: 'الحسابات وآلية الدخول والتحقق',
    body: `استخدام المنصة مخصص فقط للأفراد الذين يبلغون 18 عامًا أو أكثر. يمكن التسجيل عبر رقم الهاتف أو خدمات الطرف الثالث كـ Google. يتم استخدام هذه الوسائل لأغراض التحقق التقني ومنع الاستخدام العشوائي فقط، ولا تشكّل تحققًا رسميًا أو قانونيًا من الهوية أو العمر.

يتحمّل المستخدم وحده مسؤولية حماية بيانات حسابه بما في ذلك حسابات Google أو رقم الهاتف المرتبط. أي نشاط يتم من حسابك يُعدّ صادراً منك مباشرةً.`,
  },
  {
    icon: Scale, number: 3,
    title: 'إخلاء المسؤولية وحدود الالتزام القانوني',
    badge: '🔴 حرج',
    body: `جميع التفاعلات بين المستخدمين، سواء داخل التطبيق أو خارجه، تقع مسؤوليتها الكاملة على الأطراف المعنية فقط. المنصة لا تتحمّل أي مسؤولية عن أي ضرر جسدي، نفسي، مادي، أو معنوي قد يحدث أثناء أو بعد حضور أي فعالية.

إلى أقصى حدٍّ يسمح به القانون، تُقدَّم خدمات WeMeet "كما هي" دون أي ضمانات صريحة أو ضمنية. في حال ثبتت أي مسؤولية، فإن إجماليها لن يتجاوز المبلغ الذي دفعه المستخدم للمنصة خلال الأشهر الثلاثة السابقة، إن وُجد. يوافق المستخدم على تعويض WeMeet والدفاع عنها من أي مطالبة تنشأ عن مخالفته لهذه الشروط. أي خرائط أو مواقع مُعروضة داخل التطبيق هي معلومات إرشادية فقط.`,
  },
  {
    icon: Flag, number: 4,
    title: 'نظام السلوك والنقاط الحمراء (Red Flag System)',
    body: `تعتمد المنصة نظام نقاط لضبط السلوك العام داخل المجتمع. يشمل ذلك: السلوك المسيء، الإخلال بشروط الفعاليات، أو عدم الحضور دون إلغاء مسبق خلال 12 ساعة على الأقل قبل موعد الفعالية.

تراكم النقاط السلبية قد يؤدي إلى تقييد الحساب أو حظره بشكل دائم. قرارات الحظر تعتبر نهائية ولا يترتب عليها أي التزام بتعويض أو إعادة تفعيل الحساب. تحتفظ WeMeet بحقها الكامل في مراجعة المحتوى وحذفه وتعليق أي حساب فوراً دون إشعار مسبق.`,
  },
  {
    icon: Lock, number: 5,
    title: 'الرسائل والبيانات والخصوصية',
    body: `غرف المحادثة الخاصة بالفعاليات مؤقتة ويتم حذفها تلقائيًا بعد انتهاء الفعالية. يتحمّل المستخدم كامل المسؤولية عن أي معلومات يشاركها داخل الرسائل الخاصة.

يُحظر تمامًا مشاركة بيانات مالية، معلومات بطاقات ائتمان، أو وثائق هوية رسمية داخل التطبيق. تخضع معالجة بياناتك الشخصية لسياسة الخصوصية المنشورة على المنصة وتُعتبر جزءاً لا يتجزأ من هذه الشروط. عند استخدام تسجيل الدخول عبر Google، قد يتم جمع بيانات أساسية (الاسم، البريد الإلكتروني، الصورة) لإنشاء الحساب فقط. تعتمد المنصة معايير حماية تقنية معقولة دون ضمان حماية مطلقة.`,
  },
  {
    icon: Copyright, number: 6,
    title: 'الملكية الفكرية وخدمات الطرف الثالث',
    body: `جميع حقوق الملكية الفكرية المتعلقة بالعلامة التجارية WeMeet وتصميم التطبيق وشيفرته البرمجية محفوظة بالكامل للمنصة. بنشرك أي محتوى فإنك تمنح WeMeet ترخيصًا غير حصري لاستخدامه لأغراض تشغيل الخدمة مع بقاء ملكيته الفكرية لك، وتقرّ بأنك تملك الحق الكامل في نشره.

تعتمد بعض الميزات على خدمات طرف ثالث (كـ Google، خرائط OpenStreetMap، بوابات الإشعارات). المنصة غير مسؤولة عن أي أعطال أو مشاكل ناتجة عنها. يُحظر تمامًا نشر أي محتوى إباحي أو عنيف أو تمييزي أو مخالف للقانون.`,
  },
  {
    icon: Gavel, number: 7,
    title: 'التعديلات والقانون الحاكم وتنبيه الطوارئ',
    badge: '📋 اقرأ بتمعّن',
    body: `يحق للمنصة تعديل هذه الشروط في أي وقت ويُعد استمرار الاستخدام بعد التعديل موافقة ضمنية. تحتفظ WeMeet بحقها في تعليق أو إنهاء أي حساب في أي وقت دون إبداء أسباب. تخضع هذه الشروط للقوانين المحلية المعمول بها في مكان تشغيل الخدمة، وتُحل النزاعات أمام الجهات القضائية المختصة بعد محاولة تسوية ودية.

⚠️ تنبيه الطوارئ: WeMeet ليست تطبيق طوارئ ولا بديلاً عن جهات الأمن أو الإسعاف. في أي حالة خطر أو جريمة أو طوارئ طبية، تواصل فوراً مع الجهات الرسمية المختصة في بلدك ولا تعتمد على هذا التطبيق.`,
  },
];

const TOTAL = CLAUSES.length;

export default function TermsPage() {
  const router      = useRouter();
  const { logout }  = useAuthStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs  = useRef<Array<HTMLDivElement | null>>([]);

  const [currentSection, setCurrentSection] = useState(0);
  const [accepting,      setAccepting]      = useState(false);
  const [rejecting,      setRejecting]      = useState(false);
  const [acceptError,    setAcceptError]    = useState<string | null>(null);

  const isLast   = currentSection === TOTAL - 1;
  const progress = ((currentSection + 1) / TOTAL) * 100;

  // ── Advance ────────────────────────────────────────────────────────────────
  const advance = () => {
    if (!isLast) {
      const next = sectionRefs.current[currentSection + 1];
      if (containerRef.current && next) {
        containerRef.current.scrollTo({ top: next.offsetTop - 80, behavior: 'smooth' });
      }
      setCurrentSection((p) => p + 1);
    } else {
      void handleAccept();
    }
  };

  // ── Accept ─────────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);
    try {
      await apiPost('/users/me/accept-terms');
      router.push('/home');
    } catch {
      setAcceptError('تعذّر حفظ موافقتك. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
      setAccepting(false);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = () => {
    setRejecting(true);
    logout();
    try { localStorage.clear(); } catch { /**/ }
    try {
      document.cookie.split(';').forEach((c) => {
        document.cookie =
          c.trim().split('=')[0] +
          '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });
    } catch { /**/ }
    window.location.replace((process.env.NEXT_PUBLIC_BASE_PATH || '') + '/login/');
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4 py-8" dir="rtl">
      <div className="w-full max-w-2xl bg-surface rounded-3xl shadow-card border border-border overflow-hidden">

        {/* ── شريط التقدم ── */}
        <div className="h-1.5 w-full bg-gray-100">
          <div
            className="h-full bg-brand-green transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── الترويسة ── */}
        <div className="bg-brand-green px-4 sm:px-8 py-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={26} />
            <div>
              <h1 className="text-lg font-bold leading-tight">شروط الخدمة وإخلاء المسؤولية</h1>
              <p className="text-white/70 text-xs">منصة WeMeet — يرجى القراءة الكاملة قبل المتابعة</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-white/80 text-sm">
              {isLast
                ? 'البند الأخير — راجع قبل الموافقة'
                : `البند ${currentSection + 1} من ${TOTAL} — اضغط التالي للمتابعة`}
            </p>
            <span className="text-white/60 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full">
              {currentSection + 1}/{TOTAL}
            </span>
          </div>
        </div>

        {/* ── البنود — overflow:hidden يمنع التمرير اليدوي ── */}
        <div
          ref={containerRef}
          className="max-h-[54vh] px-4 sm:px-8 py-5 space-y-5"
          style={{ overflowY: 'hidden', scrollBehavior: 'smooth' }}
        >
          {CLAUSES.map(({ icon: Icon, number, title, badge, body }, idx) => {
            const isPast    = idx < currentSection;
            const isCurrent = idx === currentSection;
            const isUrgent  = !!badge;

            return (
              <div
                key={number}
                ref={(el) => { sectionRefs.current[idx] = el; }}
                className={`flex gap-4 rounded-2xl p-4 border transition-all duration-300 ${
                  isCurrent
                    ? isUrgent
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-brand-green/30 shadow-sm'
                    : isPast
                      ? 'bg-green-50/40 border-green-100'
                      : 'opacity-30 border-transparent'
                }`}
              >
                {/* أيقونة */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 transition-colors duration-300 ${
                  isPast
                    ? 'bg-brand-green'
                    : isCurrent
                      ? isUrgent ? 'bg-amber-100' : 'bg-brand-green-light'
                      : 'bg-gray-100'
                }`}>
                  {isPast
                    ? <CheckCircle size={18} className="text-white" />
                    : <Icon size={18} className={
                        isCurrent
                          ? isUrgent ? 'text-amber-600' : 'text-brand-green-dark'
                          : 'text-gray-300'
                      } />
                  }
                </div>

                {/* النص */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                    <h3 className={`text-sm font-bold ${isCurrent ? 'text-ink' : 'text-ink-soft'}`}>
                      <span className="text-brand-green ml-1">§{number}.</span>
                      {title}
                    </h3>
                    {badge && isCurrent && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── التذييل ── */}
        <div className="border-t border-border bg-sand px-4 sm:px-8 py-5 space-y-3">

          {acceptError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              {acceptError}
            </p>
          )}

          <p className="text-xs text-ink-muted text-center leading-relaxed">
            {isLast
              ? <>بالنقر على <strong className="text-ink">Agree</strong> تؤكد أنك بلغت 18 عامًا وتوافق على جميع البنود والشروط القانونية أعلاه.</>
              : <>اقرأ البند كاملاً ثم اضغط <strong className="text-ink">التالي</strong> للانتقال إلى البند التالي.</>
            }
          </p>

          <div className="flex gap-3">
            {/* رفض */}
            <button
              onClick={handleReject}
              disabled={rejecting || accepting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition disabled:opacity-50"
            >
              {rejecting
                ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                : <XCircle size={16} />
              }
              {rejecting ? 'إنهاء الجلسة...' : 'أرفض'}
            </button>

            {/* التالي / Agree */}
            <button
              onClick={advance}
              disabled={accepting || rejecting}
              className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 ${
                isLast
                  ? 'bg-brand-green text-white hover:bg-brand-green-dark shadow-md'
                  : 'border border-brand-green/40 text-brand-green-dark bg-brand-green/8 hover:bg-brand-green/15'
              }`}
            >
              {accepting
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : isLast
                  ? <CheckCircle size={16} />
                  : <ChevronDown size={16} />
              }
              {accepting ? 'جارٍ المتابعة...' : isLast ? 'Agree' : 'التالي'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
