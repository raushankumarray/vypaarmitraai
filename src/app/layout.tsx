import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SyncProvider } from '@/context/SyncContext';

export const metadata: Metadata = {
  title: 'VypaarMitra AI - NPB MEDIA | Smart Business Management',
  description: 'Smart Business Management for Every Business by NPB MEDIA',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <LanguageProvider>
          <SyncProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SyncProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
