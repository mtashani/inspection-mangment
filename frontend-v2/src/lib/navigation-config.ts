import {
  Frame,
  Shield,
  BarChart3,
  FileText,
  Wrench,
  Users,
  Calendar,
  AlertTriangle,
  Settings,
  UserCog,
  Database,
  ClipboardList,
  Gauge,
  Zap,
  Hammer,
  Cog,
} from 'lucide-react';
import { NavigationItem } from '@/types/permissions';
import { RESOURCES, ACTIONS } from '@/types/permissions';

/**
 * Navigation configuration with permission-based access control
 * Each navigation item can specify required permissions or roles
 */
export const navigationConfig: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'BarChart3',
    // No permission required - all authenticated users can access dashboard
  },
  {
    title: 'Equipment',
    href: '#',
    icon: 'Settings',
    children: [
      {
        title: 'All Equipment',
        href: '/equipment',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
      },
      {
        title: 'Add Equipment',
        href: '/equipment/add',
        permission: { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE },
      },
      {
        title: 'Maintenance Schedule',
        href: '/equipment/maintenance',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
      },
    ],
  },
  {
    title: 'Maintenance Events',
    href: '/maintenance-events',
    icon: 'Wrench',
    permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
  },
  {
    title: 'Daily Reports',
    href: '#',
    icon: 'FileText',
    children: [
      {
        title: 'Dashboard',
        href: '/daily-reports/dashboard',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
      },
      {
        title: 'All Reports',
        href: '/daily-reports',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
      },
      {
        title: 'Create Report',
        href: '/daily-reports/create',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.CREATE },
      },
    ],
  },
  {
    title: 'Inspections',
    href: '#',
    icon: 'Shield',
    children: [
      {
        title: 'All Inspections',
        href: '/inspections',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
      },
      {
        title: 'New Inspection',
        href: '/inspections/new',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.CREATE },
      },
      {
        title: 'Pending Reviews',
        href: '/inspections/pending',
        permission: { resource: RESOURCES.REPORT, action: ACTIONS.APPROVE },
      },
    ],
  },
  {
    title: 'PSV Reports',
    href: '#',
    icon: 'Gauge',
    children: [
      {
        title: 'All PSV Reports',
        href: '/psv/reports',
        permission: { resource: RESOURCES.PSV, action: ACTIONS.VIEW },
      },
      {
        title: 'Create PSV Report',
        href: '/psv/reports/create',
        permission: { resource: RESOURCES.PSV, action: ACTIONS.CREATE },
      },
      {
        title: 'PSV Calibrations',
        href: '/psv/calibrations',
        permission: { resource: RESOURCES.PSV, action: ACTIONS.VIEW },
      },
      {
        title: 'Test Operations',
        href: '/psv/test-operations',
        permission: { resource: RESOURCES.PSV, action: ACTIONS.EXECUTE_TEST },
      },
    ],
  },
  {
    title: 'NDT Reports',
    href: '#',
    icon: 'Zap',
    children: [
      {
        title: 'All NDT Reports',
        href: '/ndt/reports',
        permission: { resource: RESOURCES.NDT, action: ACTIONS.VIEW },
      },
      {
        title: 'Create NDT Report',
        href: '/ndt/reports/create',
        permission: { resource: RESOURCES.NDT, action: ACTIONS.CREATE },
      },
      {
        title: 'NDT Inspections',
        href: '/ndt/inspections',
        permission: { resource: RESOURCES.NDT, action: ACTIONS.VIEW },
      },
    ],
  },
  {
    title: 'Mechanical Reports',
    href: '#',
    icon: 'Cog',
    children: [
      {
        title: 'All Mechanical Reports',
        href: '/mechanical/reports',
        permission: { resource: RESOURCES.MECHANICAL, action: ACTIONS.VIEW },
      },
      {
        title: 'Create Mechanical Report',
        href: '/mechanical/reports/create',
        permission: { resource: RESOURCES.MECHANICAL, action: ACTIONS.CREATE },
      },
      {
        title: 'Mechanical Inspections',
        href: '/mechanical/inspections',
        permission: { resource: RESOURCES.MECHANICAL, action: ACTIONS.VIEW },
      },
    ],
  },
  {
    title: 'Corrosion Analysis',
    href: '#',
    icon: 'AlertTriangle',
    children: [
      {
        title: 'All Corrosion Reports',
        href: '/corrosion/reports',
        permission: { resource: RESOURCES.CORROSION, action: ACTIONS.VIEW },
      },
      {
        title: 'Create Corrosion Report',
        href: '/corrosion/reports/create',
        permission: { resource: RESOURCES.CORROSION, action: ACTIONS.CREATE },
      },
      {
        title: 'Corrosion Analysis',
        href: '/corrosion/analysis',
        permission: { resource: RESOURCES.CORROSION, action: ACTIONS.VIEW },
      },
    ],
  },
  {
    title: 'Crane Inspections',
    href: '#',
    icon: 'Hammer',
    children: [
      {
        title: 'All Crane Reports',
        href: '/crane/reports',
        permission: { resource: RESOURCES.CRANE, action: ACTIONS.VIEW },
      },
      {
        title: 'Create Crane Report',
        href: '/crane/reports/create',
        permission: { resource: RESOURCES.CRANE, action: ACTIONS.CREATE },
      },
      {
        title: 'Crane Inspections',
        href: '/crane/inspections',
        permission: { resource: RESOURCES.CRANE, action: ACTIONS.VIEW },
      },
    ],
  },
  {
    title: 'Quality Control',
    href: '#',
    icon: 'ClipboardList',
    children: [
      {
        title: 'Quality Dashboard',
        href: '/quality/dashboard',
        permission: { resource: RESOURCES.QUALITY, action: ACTIONS.VIEW },
      },
      {
        title: 'Quality Inspections',
        href: '/quality/inspections',
        permission: { resource: RESOURCES.QUALITY, action: ACTIONS.QUALITY_INSPECT },
      },
      {
        title: 'Quality Approvals',
        href: '/quality/approvals',
        permission: { resource: RESOURCES.QUALITY, action: ACTIONS.QUALITY_APPROVE },
      },
    ],
  },
  {
    title: 'Inspectors',
    href: '#',
    icon: 'Users',
    children: [
      {
        title: 'All Inspectors',
        href: '/inspectors',
        permission: { resource: RESOURCES.INSPECTOR, action: ACTIONS.VIEW },
      },
      {
        title: 'Add Inspector',
        href: '/inspectors/add',
        permission: { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_INSPECTORS },
      },
      {
        title: 'Certifications',
        href: '/inspectors/certifications',
        permission: { resource: RESOURCES.INSPECTOR, action: ACTIONS.VIEW },
      },
    ],
  },
  {
    title: 'Administration',
    href: '#',
    icon: 'UserCog',
    role: 'Global Admin', // Only Global Admins can see admin section
    children: [
      {
        title: 'User Management',
        href: '/admin/users',
        permission: { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_INSPECTORS },
      },
      {
        title: 'Role Management',
        href: '/admin/roles',
        permission: { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_ROLES },
      },
      {
        title: 'Permission Management',
        href: '/admin/permissions',
        permission: { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_PERMISSIONS },
      },
      {
        title: 'System Settings',
        href: '/admin/settings',
        permission: { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE },
      },
      {
        title: 'Audit Logs',
        href: '/admin/audit-logs',
        permission: { resource: RESOURCES.ADMIN, action: ACTIONS.VIEW },
      },
    ],
  },
];

/**
 * Quick access projects with permission-based filtering
 */
export const projectsConfig: NavigationItem[] = [
  {
    title: 'Recent Inspections',
    href: '/inspections/recent',
    icon: 'Frame',
    permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
  },
  {
    title: 'Overdue Items',
    href: '/overdue',
    icon: 'AlertTriangle',
    permission: { resource: RESOURCES.REPORT, action: ACTIONS.VIEW },
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: 'Calendar',
    // No permission required - all users can access calendar
  },
];

/**
 * Icon mapping for string-based icon references
 */
export const iconMap = {
  Frame,
  Shield,
  BarChart3,
  FileText,
  Wrench,
  Users,
  Calendar,
  AlertTriangle,
  Settings,
  UserCog,
  Database,
  ClipboardList,
  Gauge,
  Zap,
  Hammer,
  Cog,
};