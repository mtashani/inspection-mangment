'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import {
  User,
  Settings,
  LogOut,
  Shield,
  CreditCard,
  Keyboard,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'text-gray-600 dark:text-gray-400';
    
    // Check for highest priority role
    if (roles.includes('admin')) {
      return 'text-red-600 dark:text-red-400';
    } else if (roles.includes('manager')) {
      return 'text-green-600 dark:text-green-400';
    } else if (roles.includes('inspector')) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (roles.includes('viewer')) {
      return 'text-purple-600 dark:text-purple-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPrimaryRole = (roles: string[]) => {
    if (!roles || roles.length === 0) return 'User';
    
    // Return highest priority role with proper formatting
    if (roles.includes('admin')) return 'Administrator';
    if (roles.includes('manager')) return 'Manager';
    if (roles.includes('inspector')) return 'Inspector';
    if (roles.includes('viewer')) return 'Viewer';
    
    // Return first role with proper capitalization if no standard roles found
    return roles[0].charAt(0).toUpperCase() + roles[0].slice(1);
  };

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) || false;
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full transition-all duration-300 hover:ring-2 hover:ring-primary/20"
          title={`${user.name} - ${getPrimaryRole(user.roles)}`}
        >
          <Avatar className="h-8 w-8 transition-all duration-300 hover:scale-105">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex items-center justify-between">
              <p className={`text-xs leading-none ${getRoleColor(user.roles)}`}>
                {getPrimaryRole(user.roles)}
              </p>
              {user.employee_id && (
                <p className="text-xs leading-none text-muted-foreground">
                  ID: {user.employee_id}
                </p>
              )}
            </div>
            {user.department && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.department}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/shortcuts')}>
            <Keyboard className="mr-2 h-4 w-4" />
            <span>Keyboard shortcuts</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/team')}>
            <Users className="mr-2 h-4 w-4" />
            <span>Team</span>
          </DropdownMenuItem>
          {hasRole('admin') && (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          {hasRole('manager') && (
            <DropdownMenuItem onClick={() => router.push('/management')}>
              <Users className="mr-2 h-4 w-4" />
              <span>Management Dashboard</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => router.push('/billing')}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}