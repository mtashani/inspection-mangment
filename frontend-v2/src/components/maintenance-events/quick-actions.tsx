'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Calendar, Search, Settings } from 'lucide-react'
import Link from 'next/link'

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const actions = [
    {
      title: 'Create Daily Report',
      description: 'Create a new daily report',
      icon: <Plus className="h-4 w-4" />,
      href: '/daily-reports/create',
      variant: 'default' as const,
    },
    {
      title: 'View All Reports',
      description: 'Browse all daily reports',
      icon: <FileText className="h-4 w-4" />,
      href: '/daily-reports',
      variant: 'outline' as const,
    },
    {
      title: 'Reports Dashboard',
      description: 'View reports analytics',
      icon: <Calendar className="h-4 w-4" />,
      href: '/daily-reports/dashboard',
      variant: 'outline' as const,
    },
    {
      title: 'Maintenance Events',
      description: 'Manage maintenance events',
      icon: <Search className="h-4 w-4" />,
      href: '/maintenance-events',
      variant: 'outline' as const,
    },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start gap-3 h-auto p-4"
            asChild
          >
            <Link href={action.href}>
              <div className="flex items-center gap-3">
                {action.icon}
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}