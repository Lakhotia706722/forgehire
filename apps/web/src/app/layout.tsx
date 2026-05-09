import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/toaster';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuronHire — India\'s AI Talent Marketplace',
  description:
    'Connect with verified AI engineers or find your next AI opportunity. India\'s only AI-exclusive talent and product marketplace.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NeuronHire',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#080B14',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport: Viewport = {
  themeColor: '#080B14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          {/* Google Fonts preconnect */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* PWA icons */}
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </head>
        <body className="font-body antialiased">
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster />
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
