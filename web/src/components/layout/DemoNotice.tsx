'use client';
/**
 * web/src/components/layout/DemoNotice.tsx
 *
 * DEMO-ONLY affordance (not part of the production WeMeet UI).
 *
 * It exists so a visitor is never misled into thinking this is the live
 * product: the data is fictional and sign-in is simulated. It is deliberately
 * small, non-blocking and positioned above the mobile bottom navigation.
 */
import { Info } from 'lucide-react';

export const DemoNotice = () => (
  <div
    role="note"
    className="fixed left-3 bottom-20 md:bottom-4 z-[60] max-w-[15rem] rounded-xl border border-brand-green/30 bg-surface/95 px-3 py-2 shadow-card backdrop-blur"
  >
    <p className="flex items-start gap-1.5 text-[10px] leading-snug text-ink-soft">
      <Info size={12} className="mt-0.5 flex-shrink-0 text-brand-green" />
      <span>
        <span className="font-bold text-ink">عرض تجريبي</span> — بيانات وهمية، وتسجيل الدخول محاكى.
      </span>
    </p>
  </div>
);
