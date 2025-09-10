'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getTemplates,
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  cloneTemplate,
  toggleTemplateStatus,
  validateTemplate,
  testTemplate,
  getTemplateUsageStats,
  getTemplateVersions,
  restoreTemplateVersion,
  exportTemplate,
  importTemplate,
  getTemplateStats,
  searchTemplates
} from '@/lib/api/admin/templates'
import {
  ReportTemplate,
  TemplateFormData,
  TemplateFilters,
  AdminPaginatedResponse
} from '@/types/admin'

// Query Keys
export const templateKeys = {
  all: ['admin', 'templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters?: TemplateFilters) => [...templateKeys.lists(), { filters }] as const,
  paginated: (page: number, limit: number, filters?: TemplateFilters) => 
    [...templateKeys.lists(), 'paginated', { page, limit, filters }] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  stats: () => [...templateKeys.all, 'stats'] as const,
  usageStats: (id: string) => [...templateKeys.all, 'usage-stats', id] as const,
  versions: (id: string) => [...templateKeys.all, 'versions', id] as const,
  search: (query: string) => [...templateKeys.all, 'search', query] as const,
}

// Get paginated templates
export function useTemplates(
  page: number = 1,
  limit: number = 20,
  filters?: TemplateFilters
) {
  return useQuery({
    queryKey: templateKeys.paginated(page, limit, filters),
    queryFn: () => getTemplates(page, limit, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get all templates (without pagination)
export function useAllTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: () => getAllTemplates(filters),
    staleTime: 5 * 60 * 1000,
  })
}

// Get template by ID
export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => getTemplateById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Get template statistics
export function useTemplateStats() {
  return useQuery({
    queryKey: templateKeys.stats(),
    queryFn: getTemplateStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get template usage statistics
export function useTemplateUsageStats(id: string) {
  return useQuery({
    queryKey: templateKeys.usageStats(id),
    queryFn: () => getTemplateUsageStats(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Get template versions
export function useTemplateVersions(id: string) {
  return useQuery({
    queryKey: templateKeys.versions(id),
    queryFn: () => getTemplateVersions(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Search templates
export function useTemplateSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: templateKeys.search(query),
    queryFn: () => searchTemplates(query, limit),
    enabled: query.length > 2, // Only search if query is longer than 2 characters
    staleTime: 2 * 60 * 1000,
  })
}

// Create template mutation
export function useCreateTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (newTemplate) => {
      // Invalidate and refetch templates
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      
      toast({
        title: 'Template Created',
        description: `Template "${newTemplate.name}" has been created successfully`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create template',
        variant: 'destructive',
      })
    },
  })
}

// Update template mutation
export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      updateTemplate(id, data),
    onSuccess: (updatedTemplate) => {
      // Update the template in cache
      queryClient.setQueryData(
        templateKeys.detail(updatedTemplate.id),
        updatedTemplate
      )
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() })
      
      toast({
        title: 'Template Updated',
        description: `Template "${updatedTemplate.name}" has been updated successfully`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update template',
        variant: 'destructive',
      })
    },
  })
}

// Delete template mutation
export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: templateKeys.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() })
      
      toast({
        title: 'Template Deleted',
        description: 'Template has been deleted successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive',
      })
    },
  })
}

// Clone template mutation
export function useCloneTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      cloneTemplate(id, newName),
    onSuccess: (clonedTemplate) => {
      // Invalidate lists to show the new template
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() })
      
      toast({
        title: 'Template Cloned',
        description: `Template "${clonedTemplate.name}" has been created successfully`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clone template',
        variant: 'destructive',
      })
    },
  })
}

// Toggle template status mutation
export function useToggleTemplateStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleTemplateStatus(id, isActive),
    onSuccess: (updatedTemplate) => {
      // Update the template in cache
      queryClient.setQueryData(
        templateKeys.detail(updatedTemplate.id),
        updatedTemplate
      )
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() })
      
      toast({
        title: 'Template Updated',
        description: `Template ${updatedTemplate.isActive ? 'activated' : 'deactivated'} successfully`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update template status',
        variant: 'destructive',
      })
    },
  })
}

// Validate template mutation
export function useValidateTemplate() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: validateTemplate,
    onError: (error) => {
      toast({
        title: 'Validation Error',
        description: error instanceof Error ? error.message : 'Failed to validate template',
        variant: 'destructive',
      })
    },
  })
}

// Test template mutation
export function useTestTemplate() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, sampleData }: { id: string; sampleData: Record<string, unknown> }) =>
      testTemplate(id, sampleData),
    onError: (error) => {
      toast({
        title: 'Test Error',
        description: error instanceof Error ? error.message : 'Failed to test template',
        variant: 'destructive',
      })
    },
  })
}

// Restore template version mutation
export function useRestoreTemplateVersion() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      restoreTemplateVersion(id, version),
    onSuccess: (restoredTemplate) => {
      // Update the template in cache
      queryClient.setQueryData(
        templateKeys.detail(restoredTemplate.id),
        restoredTemplate
      )
      
      // Invalidate versions to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: templateKeys.versions(restoredTemplate.id) 
      })
      
      toast({
        title: 'Template Restored',
        description: `Template restored to version ${restoredTemplate.version}`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore template version',
        variant: 'destructive',
      })
    },
  })
}

// Export template mutation
export function useExportTemplate() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, format = 'JSON' }: { id: string; format?: 'JSON' | 'YAML' }) =>
      exportTemplate(id, format),
    onSuccess: (blob, { id, format }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template-${id}.${format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Export Successful',
        description: 'Template has been exported successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Export Error',
        description: error instanceof Error ? error.message : 'Failed to export template',
        variant: 'destructive',
      })
    },
  })
}

// Import template mutation
export function useImportTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: importTemplate,
    onSuccess: (importedTemplate) => {
      // Invalidate lists to show the new template
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.stats() })
      
      toast({
        title: 'Import Successful',
        description: `Template "${importedTemplate.name}" has been imported successfully`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Import Error',
        description: error instanceof Error ? error.message : 'Failed to import template',
        variant: 'destructive',
      })
    },
  })
}

// Utility function to invalidate all template queries
export function useInvalidateTemplates() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: templateKeys.all })
  }
}