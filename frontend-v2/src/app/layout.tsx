import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import { QueryProvider } from '@/components/query-provider';
import { PerformanceMonitor } from '@/components/performance-monitor';
import { ErrorBoundary } from '@/components/error-boundary';
import { DebugTrigger } from '@/components/debug-panel';
import { DevStatusIndicator } from '@/components/ui/dev-status-indicator';
import { MonitoringDebug } from '@/components/dev/monitoring-debug';
import { RealTimeNotificationsProvider } from '@/contexts/real-time-notifications';
import { RealTimeLayout } from '@/components/layout/real-time-layout';

import { Toaster } from 'sonner';
import { URLStateProvider } from '@/components/providers/url-state-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'Inspection Management System',
    template: '%s | Inspection Management System',
  },
  description: 'Professional inspection management platform for industrial equipment',
  keywords: ['inspection', 'management', 'industrial', 'equipment', 'maintenance'],
  authors: [{ name: 'Inspection Management Team' }],
  creator: 'Inspection Management Team',
  publisher: 'Inspection Management System',
  robots: {
    index: false, // Don't index in production without proper SEO setup
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <URLStateProvider debug={process.env.NODE_ENV === 'development'}>
                <AuthProvider>
                  <RealTimeNotificationsProvider>
                    <AuthGuard>
                      <RealTimeLayout>{children}</RealTimeLayout>
                    </AuthGuard>
                  </RealTimeNotificationsProvider>
                </AuthProvider>
              </URLStateProvider>
            </ThemeProvider>
            <PerformanceMonitor />
            <DebugTrigger />
            <DevStatusIndicator />
            <MonitoringDebug />
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              duration={4000}
            />
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
