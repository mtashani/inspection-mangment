'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useNavigation } from '@/hooks/use-navigation';
import { iconMap } from '@/lib/navigation-config';
import { NavigationItem } from '@/types/permissions';

interface NavMainProps {
  groupLabel?: string;
}

/**
 * Permission-aware main navigation component
 * Automatically filters navigation items based on user permissions
 */
export function NavMainPermissionAware({ groupLabel = 'Platform' }: NavMainProps) {
  const { navigation, isLoading } = useNavigation();
  const pathname = usePathname();

  // Show loading state
  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  // Don't render if no navigation items are available
  if (navigation.length === 0) {
    return null;
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon ? iconMap[item.icon as keyof typeof iconMap] : null;
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={isActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children?.map(subItem => {
                  const SubIcon = subItem.icon ? iconMap[subItem.icon as keyof typeof iconMap] : null;
                  const isSubActive = pathname === subItem.href;
                  
                  return (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild isActive={isSubActive}>
                        <Link href={subItem.href}>
                          {SubIcon && <SubIcon className="w-3 h-3" />}
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
          <Link href={item.href}>
            {Icon && <Icon className="w-4 h-4" />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {navigation.map(renderNavigationItem)}
      </SidebarMenu>
    </SidebarGroup>
  );
}