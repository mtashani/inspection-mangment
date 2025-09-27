import { Metadata } from 'next'
import { TemplateBuilderContainer } from '@/components/admin/templates/template-builder-container'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export const metadata: Metadata = {
  title: 'Create Template | Admin Panel',
  description: 'Create a new report template with drag-and-drop builder',
}

export default function CreateTemplatePage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '/admin' },
        { label: 'Templates', href: '/admin/templates' },
        { label: 'Create Template', current: true }
      ]}
    >
      <ErrorBoundary>
        <TemplateBuilderContainer />
      </ErrorBoundary>
    </DashboardLayout>
  )
}