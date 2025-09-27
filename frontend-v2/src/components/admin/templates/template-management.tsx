'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateList } from './template-list'
import { 
  useAllTemplates,
  useDeleteTemplate,
  useCloneTemplate,
  useToggleTemplateStatus,
  useExportTemplate,
  useImportTemplate
} from '@/hooks/admin/use-templates'
import { ReportTemplate } from '@/types/admin'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export function TemplateManagement() {
  const router = useRouter()
  const [filters, setFilters] = useState({})

  // Queries
  const { 
    data: templates = [], 
    isLoading, 
    error 
  } = useAllTemplates(filters)

  // Mutations
  const deleteTemplateMutation = useDeleteTemplate()
  const cloneTemplateMutation = useCloneTemplate()
  const toggleStatusMutation = useToggleTemplateStatus()
  const exportTemplateMutation = useExportTemplate()
  const importTemplateMutation = useImportTemplate()

  const handleEdit = (template: ReportTemplate) => {
    router.push(`/admin/templates/${template.id}/edit`)
  }

  const handleDelete = async (template: ReportTemplate) => {
    await deleteTemplateMutation.mutateAsync(template.id)
  }

  const handleClone = async (template: ReportTemplate, newName: string) => {
    await cloneTemplateMutation.mutateAsync({
      id: template.id,
      newName
    })
  }

  const handleToggleStatus = async (template: ReportTemplate) => {
    await toggleStatusMutation.mutateAsync({
      id: template.id,
      isActive: !template.isActive
    })
  }

  const handleExport = async (template: ReportTemplate) => {
    await exportTemplateMutation.mutateAsync({
      id: template.id,
      format: 'JSON'
    })
  }

  const handleImport = async (file: File) => {
    await importTemplateMutation.mutateAsync(file)
  }

  const handleViewUsageStats = (template: ReportTemplate) => {
    router.push(`/admin/templates/${template.id}/stats`)
  }

  if (error) {
    throw error // Will be caught by ErrorBoundary
  }

  return (
    <ErrorBoundary>
      <TemplateList
        templates={templates}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClone={handleClone}
        onToggleStatus={handleToggleStatus}
        onExport={handleExport}
        onImport={handleImport}
        onViewUsageStats={handleViewUsageStats}
      />
    </ErrorBoundary>
  )
}