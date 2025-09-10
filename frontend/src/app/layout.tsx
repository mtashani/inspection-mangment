'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { InspectorsProvider } from '@/contexts/inspectors-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { SpecialtyProvider } from '@/contexts/specialty-context';
import { ThemeProvider } from '@/components/theme-provider'
import { InspectionSidebar07 } from '@/components/layout/sidebar/inspection-sidebar-07';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';

const inter = Inter({ subsets: ['latin'] });

function MainLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();
  
  // Public routes that don't need authentication
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is on public route (login), show without sidebar/navbar
  if (isPublicRoute) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }
  
  // For protected routes, show full layout with new sidebar
  return (
    <InspectionSidebar07>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-background">
        {children}
      </div>
    </InspectionSidebar07>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <NotificationsProvider>
              <AuthProvider>
                <AuthGuard>
                  <SpecialtyProvider>
                    <InspectorsProvider>
                      <MainLayout>{children}</MainLayout>
                    </InspectorsProvider>
                  </SpecialtyProvider>
                </AuthGuard>
              </AuthProvider>
            </NotificationsProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
