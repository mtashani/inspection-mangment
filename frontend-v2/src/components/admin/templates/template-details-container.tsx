'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Settings, 
  BarChart3, 
  Shield, 
  TestTube, 
  History,
  Edit,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useTemplate, useToggleTemplateStatus } from '@/hooks/admin/use-templates'
import { TemplatePreview } from './template-preview'
import { TemplateValidation } from './template-validation'
import { TemplateUsageAnalytics } from './template-usage-analytics'
import { TemplateVersionHistory } from './template-version-history'
import { TemplateDeployment } from './template-deployment'
import { TemplateBackupRestore } from './template-backup-restore'
import { TemplateExportImport } from './template-export-import'
import { AdminErrorBoundary } from '../shared/admin-error-boundary'

interface TemplateDetailsContainerProps {
  templateId: string
}

export function TemplateDetailsContainer({ templateId }: TemplateDetailsContainerProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const { 
    data: template, 
    isLoading, 
    error 
  } = useTemplate(templateId)

  const toggleStatusMutation = useToggleTemplateStatus()

  const handleStatusChange = async (templateId: string, isActive: boolean, reason?: string) => {
    await toggleStatusMutation.mutateAsync({
      id: templateId,
      isActive
    })
  }

  const handleEdit = () => {
    router.push(`/admin/templates/${templateId}/edit`)
  }

  const handleBack = () => {
    router.push('/admin/templates')
  }

  if (isLoading) {
    return <TemplateDetailsSkeleton />
  }

  if (error || !template) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Template not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const templateData = {
    name: template.name,
    description: template.description,
    reportType: template.reportType,
    isActive: template.isActive,
    sections: template.sections
  }

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold">{template.name}</h1>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={template.isActive ? 'default' : 'secondary'}>
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">{template.reportType}</Badge>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Template Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Template Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{template.sections.length}</div>
                <div className="text-sm text-muted-foreground">Sections</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{template.fieldsCount}</div>
                <div className="text-sm text-muted-foreground">Fields</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">v{template.version}</div>
                <div className="text-sm text-muted-foreground">Version</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {template.lastUsedAt ? 'Recent' : 'Never'}
                </div>
                <div className="text-sm text-muted-foreground">Last Used</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">
              <FileText className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="validation">
              <TestTube className="w-4 h-4 mr-2" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="deployment">
              <Settings className="w-4 h-4 mr-2" />
              Deployment
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="versions">
              <History className="w-4 h-4 mr-2" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Shield className="w-4 h-4 mr-2" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="export">
              Export/Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <TemplatePreview templateData={templateData} />
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
            <TemplateValidation templateData={templateData} />
          </TabsContent>

          <TabsContent value="deployment" className="mt-6">
            <TemplateDeployment 
              template={template}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <TemplateUsageAnalytics 
              templateId={template.id}
              templateName={template.name}
            />
          </TabsContent>

          <TabsContent value="versions" className="mt-6">
            <TemplateVersionHistory templateId={template.id} />
          </TabsContent>

          <TabsContent value="backup" className="mt-6">
            <TemplateBackupRestore template={template} />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <TemplateExportImport template={template} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminErrorBoundary>
  )
}

function TemplateDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Overview Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center p-4 bg-muted rounded-lg">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}