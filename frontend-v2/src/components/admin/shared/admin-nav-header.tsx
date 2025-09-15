'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserNav } from '@/components/navigation/user-nav';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { Notifications } from '@/components/navigation/notifications'; // Add this import

interface AdminNavHeaderProps {
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

export function AdminNavHeader({ breadcrumbs = [] }: AdminNavHeaderProps) {
  // Default admin breadcrumbs
  const defaultBreadcrumbs = [
    { label: 'Admin Panel', href: '/admin' },
    { label: 'Dashboard', current: true },
  ];

  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left Section - Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        {/* Admin Badge */}
        <div className="flex items-center gap-2 mr-2">
          <Shield className="h-4 w-4 text-primary" />
          <Badge variant="secondary" className="text-xs">
            Admin
          </Badge>
        </div>
        
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        <Breadcrumb>
          <BreadcrumbList>
            {displayBreadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.label} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                  {breadcrumb.current ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href || '#'}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Center Section - Empty for now */}
      <div className="flex-1" />

      {/* Right Section - User Actions */}
      <div className="flex items-center gap-1 px-4">
        {/* Notifications */}
        <Notifications />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Separator */}
        <Separator orientation="vertical" className="mx-2 h-4" />

        {/* User Profile */}
        <UserNav />
      </div>
    </header>
  );
}