import type { ReactNode } from 'react';
import { demoIds } from '@/lib/mock/data';

/**
 * DEMO/STATIC-EXPORT ONLY.
 *
 * `output: 'export'` requires every dynamic segment to be enumerated ahead of
 * time. The interactive page in this folder is a client component (it reads
 * `useParams`), and a client component may not export `generateStaticParams`,
 * so the parameter list lives here instead. It does not wrap or alter the page
 * in any way.
 */
export function generateStaticParams(): { userId: string }[] {
  return demoIds.users.map((userId) => ({ userId }));
}

export const dynamicParams = false;

export default function SegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
