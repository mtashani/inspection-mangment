'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNavigationBreadcrumbs } from '@/hooks/use-navigation';
import { iconMap } from '@/lib/navigation-config';

interface PermissionBreadcrumbsProps {
  showHome?: boolean;
  homeHref?: string;
  className?: string;
}

/**
 * Permission-aware breadcrumb component
 * Shows navigation path while respecting permission boundaries
 */
export function PermissionBreadcrumbs({ 
  showHome = true, 
  homeHref = '/dashboard',
  className 
}: PermissionBreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbs = useNavigationBreadcrumbs(pathname);

  // Don't render if no breadcrumbs or only one item
  if (breadcrumbs.length <= 1 && !showHome) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {showHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={homeHref} className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  <span className="sr-only">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
          </>
        )}
        
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon ? iconMap[item.icon as keyof typeof iconMap] : null;

          return (
            <div key={item.title} className="flex items-center">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {Icon && <Icon className="w-3 h-3" />}
                    {item.title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="flex items-center gap-1">
                      {Icon && <Icon className="w-3 h-3" />}
                      {item.title}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Simple breadcrumb component for custom paths
 */
export function SimpleBreadcrumbs({ 
  items, 
  showHome = true, 
  homeHref = '/dashboard',
  className 
}: {
  items: Array<{ title: string; href?: string }>;
  showHome?: boolean;
  homeHref?: string;
  className?: string;
}) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {showHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={homeHref} className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  <span className="sr-only">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {items.length > 0 && <BreadcrumbSeparator />}
          </>
        )}
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={item.title} className="flex items-center">
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}