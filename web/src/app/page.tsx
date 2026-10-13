'use client';
/**
 * web/src/app/page.tsx
 *
 * Production redirected on the server via `redirect('/home')`. The demo ships
 * as a fully static export (no Node server), so the same redirect is performed
 * on the client instead.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/Skeletons';

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return <PageLoader label="جارٍ تحميل العرض التجريبي..." />;
}
