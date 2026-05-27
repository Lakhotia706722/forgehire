import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/toaster';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { QueryProvider } from '@/components/providers/query-provider';
import { ApiAuthProvider } from '@/components/providers/api-auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuronHire — India\'s AI Talent Marketplace',
  description:
    'Connect with verified AI engineers or find your next AI opportunity. India\'s only AI-exclusive talent and product marketplace.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-96x96.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-72x72.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '180x180', type: 'image/png' }],
  },
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
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up'}
      afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard'}
      afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard'}
    >
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className="font-body antialiased">
          <QueryProvider>
            <ApiAuthProvider>{children}</ApiAuthProvider>
          </QueryProvider>
          <Toaster />
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
