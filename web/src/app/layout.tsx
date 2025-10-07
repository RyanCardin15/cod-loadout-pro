import type { Metadata } from 'next';
import { Inter, Rajdhani, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navigation } from '@/components/ui/Navigation';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | COD Loadout Pro',
    default: 'COD Loadout Pro - Master Your Loadouts',
  },
  description: 'Get expert Call of Duty weapon loadouts, counters, and meta analysis. Build the perfect loadout with real-time stats and personalized recommendations.',
  keywords: ['call of duty', 'COD', 'loadout', 'weapons', 'meta', 'MW3', 'Warzone', 'BO6', 'gaming'],
  authors: [{ name: 'COD Loadout Pro' }],
  creator: 'COD Loadout Pro',
  publisher: 'COD Loadout Pro',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://codloadout.pro',
    title: 'COD Loadout Pro - Master Your Loadouts',
    description: 'Expert Call of Duty weapon loadouts, counters, and meta analysis.',
    siteName: 'COD Loadout Pro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COD Loadout Pro',
    description: 'Expert Call of Duty weapon loadouts and meta analysis',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-cod-black text-white antialiased scan-lines">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-cod-surface bg-cod-gray/50 backdrop-blur-md">
              <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
                <p>© 2025 COD Loadout Pro. Not affiliated with Activision or Call of Duty.</p>
              </div>
            </footer>
          </div>
          <Toaster position="top-right" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
