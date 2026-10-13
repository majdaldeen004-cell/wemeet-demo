/**
 * shared/src/utils/api-error.ts
 *
 * Extracts a human-readable error message from an Axios-style API error.
 *
 * Usage:
 *   import { extractApiError } from '@wemeet/shared';
 *   const msg = extractApiError(err, 'فشل تحميل البيانات');
 */

export function extractApiError(
  err: unknown,
  fallback = 'حدث خطأ غير متوقع',
): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { response?: { data?: { error?: { message?: string } } } };
    return e?.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}
