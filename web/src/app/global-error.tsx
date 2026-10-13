'use client';

// Next.js App Router global error boundary — catches errors that escape every
// nested route's own error.tsx (including the root layout itself), so it must
// render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-sand text-ink antialiased font-sans">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-surface rounded-3xl shadow-card p-8 text-center">
            <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-ink-soft text-sm mb-6">
              نعتذر عن الإزعاج. حاول تحديث الصفحة مرة أخرى.
            </p>
            <button
              onClick={() => reset()}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-3 rounded-2xl transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
