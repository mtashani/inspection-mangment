'use client'

import { useRouter } from 'next/navigation'
import { TemplateBuilder } from './template-builder'
import { useCreateTemplate, useValidateTemplate } from '@/hooks/admin/use-templates'
import { TemplateFormData } from '@/types/admin'

interface TemplateBuilderContainerProps {
  initialData?: Partial<TemplateFormData>
  templateId?: string
}

export function TemplateBuilderContainer({ 
  initialData, 
  templateId 
}: TemplateBuilderContainerProps) {
  const router = useRouter()
  const createTemplateMutation = useCreateTemplate()
  const validateTemplateMutation = useValidateTemplate()

  const handleSave = async (data: TemplateFormData) => {
    if (templateId) {
      // Update existing template (will be implemented in edit functionality)
      throw new Error('Template editing not yet implemented')
    } else {
      // Create new template
      const result = await createTemplateMutation.mutateAsync(data)
      router.push(`/admin/templates/${result.id}`)
    }
  }

  const handleValidate = async (data: TemplateFormData) => {
    return await validateTemplateMutation.mutateAsync(data)
  }

  return (
    <TemplateBuilder
      initialData={initialData}
      onSave={handleSave}
      onValidate={handleValidate}
      isLoading={createTemplateMutation.isPending || validateTemplateMutation.isPending}
    />
  )
}