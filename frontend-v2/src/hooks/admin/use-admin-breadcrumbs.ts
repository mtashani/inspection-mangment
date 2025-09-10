'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Hook to generate breadcrumbs for admin pages based on the current pathname
 */
export function useAdminBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Admin', href: '/admin' }
    ];

    if (!pathname || pathname === '/admin') {
      return breadcrumbs;
    }

    // Remove /admin prefix and split path
    const pathSegments = pathname.replace('/admin', '').split('/').filter(Boolean);

    // Build breadcrumbs from path segments
    let currentPath = '/admin';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Don't add href for the last segment (current page)
      const isLastSegment = index === pathSegments.length - 1;
      
      breadcrumbs.push({
        label,
        href: isLastSegment ? undefined : currentPath
      });
    });

    return breadcrumbs;
  }, [pathname]);
}