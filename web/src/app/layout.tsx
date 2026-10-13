import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/layout/Providers';
import { DemoNotice } from '@/components/layout/DemoNotice';
import './globals.css';

export const metadata: Metadata = {
  title: 'WeMeet — Local Events & Communities',
  description: 'Connect with people at real events near you',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="bg-sand text-ink antialiased font-sans">
        <Providers>
          {children}
        </Providers>
        <DemoNotice />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
