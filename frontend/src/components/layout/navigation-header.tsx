'use client'

import React from 'react'
import { 
  Bell, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  Palette,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ModeToggle } from '@/components/mode-toggle'
import { AIChatButton } from './ai-chat-button'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

interface NavigationHeaderProps {
  className?: string
}

export function NavigationHeader({ className }: NavigationHeaderProps) {
  const { inspector, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const handleSettingsClick = () => {
    router.push('/settings')
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* AI Chat Button */}
      <AIChatButton />
      
      {/* Notifications */}
      <NotificationBell />
      
      {/* Theme Toggle */}
      <ModeToggle />
      
      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 px-2 py-1 h-auto"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={inspector?.profile_image_url || undefined}
                alt={inspector?.name || 'User'}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {inspector?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-sm font-medium text-foreground">
                {inspector?.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {inspector?.inspector_type || 'Inspector'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-56"
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={inspector?.profile_image_url || undefined}
                  alt={inspector?.name || 'User'}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {inspector?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">
                  {inspector?.name || 'User'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {inspector?.email || 'user@example.com'}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem 
              onClick={handleProfileClick}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleSettingsClick}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className="text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}