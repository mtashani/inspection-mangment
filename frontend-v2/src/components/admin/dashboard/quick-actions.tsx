'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  Upload, 
  Settings,
  Plus,
  BarChart3,
  Clock,
  ArrowRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickAction } from '@/types/admin';

interface QuickActionsProps {
  className?: string;
}

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  badge?: string | number;
  disabled?: boolean;
  className?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  href,
  icon: Icon,
  color = 'default',
  badge,
  disabled = false,
  className
}) => {
  const colorStyles = {
    default: {
      card: 'hover:border-primary/50 hover:shadow-md',
      icon: 'text-muted-foreground group-hover:text-primary',
      badge: 'bg-secondary text-secondary-foreground'
    },
    primary: {
      card: 'border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/50',
      icon: 'text-primary',
      badge: 'bg-primary text-primary-foreground'
    },
    secondary: {
      card: 'border-secondary/20 bg-secondary/5 hover:bg-secondary/10 hover:border-secondary/50',
      icon: 'text-secondary',
      badge: 'bg-secondary text-secondary-foreground'
    },
    success: {
      card: 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900',
      icon: 'text-green-600 dark:text-green-400',
      badge: 'bg-green-600 text-white dark:bg-green-400 dark:text-green-900'
    },
    warning: {
      card: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-300 dark:border-yellow-800 dark:bg-yellow-950 dark:hover:bg-yellow-900',
      icon: 'text-yellow-600 dark:text-yellow-400',
      badge: 'bg-yellow-600 text-white dark:bg-yellow-400 dark:text-yellow-900'
    },
    danger: {
      card: 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 dark:border-red-800 dark:bg-red-950 dark:hover:bg-red-900',
      icon: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-600 text-white dark:bg-red-400 dark:text-red-900'
    }
  };

  const styles = colorStyles[color];

  const CardComponent = disabled ? 'div' : Link;
  const cardProps = disabled ? {} : { href };

  return (
    <CardComponent {...cardProps} className={cn('group', className)}>
      <Card className={cn(
        'transition-all duration-200 cursor-pointer h-full',
        styles.card,
        disabled && 'opacity-50 cursor-not-allowed hover:shadow-none'
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Icon className={cn('h-5 w-5 transition-colors', styles.icon)} />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {badge && (
              <Badge className={cn('text-xs', styles.badge)}>
                {badge}
              </Badge>
            )}
            {!disabled && (
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </CardComponent>
  );
};

const quickActions: QuickAction[] = [
  {
    title: 'Manage Inspectors',
    description: 'Add, edit, and manage inspector accounts, specialties, and permissions',
    href: '/admin/inspectors',
    icon: 'Users',
    color: 'primary'
  },
  {
    title: 'Track Attendance',
    description: 'Monitor inspector attendance, work cycles, and generate reports',
    href: '/admin/attendance',
    icon: 'Calendar',
    color: 'success'
  },
  {
    title: 'Manage Templates',
    description: 'Create and edit report templates for different inspection types',
    href: '/admin/templates',
    icon: 'FileText',
    color: 'secondary'
  },
  {
    title: 'Payroll Management',
    description: 'Handle inspector payroll, salary calculations, and compensation',
    href: '/admin/payroll',
    icon: 'DollarSign',
    color: 'warning'
  },
  {
    title: 'Bulk Operations',
    description: 'Import/export data and perform batch operations on system records',
    href: '/admin/bulk-operations',
    icon: 'Upload',
    color: 'danger'
  },
  {
    title: 'System Settings',
    description: 'Configure system settings, permissions, and administrative options',
    href: '/admin/settings',
    icon: 'Settings',
    color: 'default'
  }
];

const iconMap = {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Upload,
  Settings,
  Plus,
  BarChart3,
  Clock,
  Zap
};

export const QuickActions: React.FC<QuickActionsProps> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">
            Common administrative tasks and management functions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const IconComponent = iconMap[action.icon as keyof typeof iconMap];
          return (
            <ActionCard
              key={index}
              title={action.title}
              description={action.description}
              href={action.href}
              icon={IconComponent}
              color={action.color}
            />
          );
        })}
      </div>
    </div>
  );
};

// Additional quick actions for specific workflows
interface WorkflowActionsProps {
  className?: string;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({ className }) => {
  const workflowActions = [
    {
      title: 'Create New Inspector',
      description: 'Add a new inspector to the system',
      href: '/admin/inspectors/create',
      icon: Plus,
      color: 'primary' as const,
      badge: 'New'
    },
    {
      title: 'Generate Reports',
      description: 'Create attendance and payroll reports',
      href: '/admin/reports',
      icon: BarChart3,
      color: 'success' as const
    },
    {
      title: 'Recent Activity',
      description: 'View recent system activity and changes',
      href: '/admin/activity',
      icon: Clock,
      color: 'secondary' as const,
      badge: '12'
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and health',
      href: '/admin/health',
      icon: Zap,
      color: 'warning' as const
    }
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-medium text-foreground">Workflow Shortcuts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowActions.map((action, index) => (
          <ActionCard
            key={index}
            title={action.title}
            description={action.description}
            href={action.href}
            icon={action.icon}
            color={action.color}
            badge={action.badge}
          />
        ))}
      </div>
    </div>
  );
};

// Emergency actions for critical situations
interface EmergencyActionsProps {
  className?: string;
}

export const EmergencyActions: React.FC<EmergencyActionsProps> = ({ className }) => {
  const emergencyActions = [
    {
      title: 'Emergency Contacts',
      description: 'Access emergency contact information',
      href: '/admin/emergency-contacts',
      icon: Users,
      color: 'danger' as const
    },
    {
      title: 'System Backup',
      description: 'Create immediate system backup',
      href: '/admin/backup',
      icon: Upload,
      color: 'warning' as const
    }
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-medium text-foreground text-red-600 dark:text-red-400">
        Emergency Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emergencyActions.map((action, index) => (
          <ActionCard
            key={index}
            title={action.title}
            description={action.description}
            href={action.href}
            icon={action.icon}
            color={action.color}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;