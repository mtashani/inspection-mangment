import { Metadata } from 'next'
import { TemplateBuilderContainer } from '@/components/admin/templates/template-builder-container'
import { AdminErrorBoundary } from '@/components/admin/shared/admin-error-boundary'

export const metadata: Metadata = {
  title: 'Create Template | Admin Panel',
  description: 'Create a new report template with drag-and-drop builder',
}

export default function CreateTemplatePage() {
  return (
    <AdminErrorBoundary>
      <TemplateBuilderContainer />
    </AdminErrorBoundary>
  )
}