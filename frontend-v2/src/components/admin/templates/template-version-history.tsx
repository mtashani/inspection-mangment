'use client'

import { useState } from 'react'
import { 
  History, 
  RotateCcw, 
  Eye, 
  Download, 
  GitBranch, 
  Clock, 
  User,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import { 
  useTemplateVersions, 
  useRestoreTemplateVersion 
} from '@/hooks/admin/use-templates'

interface TemplateVersion {
  version: number
  createdAt: string
  createdBy: string
  changes: string[]
}

interface TemplateVersionHistoryProps {
  templateId: string
}

export function TemplateVersionHistory({ templateId }: TemplateVersionHistoryProps) {
  const { toast } = useToast()
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [expandedVersions, setExpandedVersions] = useState<Record<number, boolean>>({})

  const { 
    data: versions = [], 
    isLoading, 
    error 
  } = useTemplateVersions(templateId)

  const restoreVersionMutation = useRestoreTemplateVersion()

  const toggleVersionExpansion = (version: number) => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }))
  }

  const handleRestoreVersion = async () => {
    if (!selectedVersion) return

    try {
      await restoreVersionMutation.mutateAsync({
        id: templateId,
        version: selectedVersion.version
      })
      
      setShowRestoreDialog(false)
      setSelectedVersion(null)
      
      toast({
        title: 'Version Restored',
        description: `Template restored to version ${selectedVersion.version}`,
      })
    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'Failed to restore version',
        variant: 'destructive',
      })
    }
  }

  const handleExportVersion = (version: TemplateVersion) => {
    // This would typically call an API to export the specific version
    toast({
      title: 'Export Started',
      description: `Exporting version ${version.version}...`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getVersionBadgeVariant = (version: number, isLatest: boolean) => {
    if (isLatest) return 'default'
    if (version === 1) return 'secondary'
    return 'outline'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load version history. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
            <Badge variant="secondary">{versions.length} versions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-4" />
              <p>No version history available</p>
              <p className="text-sm">Versions will appear here as you make changes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const isLatest = index === 0
                const isExpanded = expandedVersions[version.version]
                
                return (
                  <Card key={version.version} className="border">
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleVersionExpansion(version.version)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button variant="ghost" size="sm" className="p-0">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    Version {version.version}
                                  </span>
                                  <Badge variant={getVersionBadgeVariant(version.version, isLatest)}>
                                    {isLatest ? 'Current' : `v${version.version}`}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {version.createdBy}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(version.createdAt)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <GitBranch className="w-3 h-3" />
                                    {version.changes.length} changes
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExportVersion(version)
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              
                              {!isLatest && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedVersion(version)
                                    setShowRestoreDialog(true)
                                  }}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Changes in this version:</h4>
                              <div className="space-y-1">
                                {version.changes.map((change, changeIndex) => (
                                  <div 
                                    key={changeIndex}
                                    className="text-sm text-muted-foreground flex items-start gap-2"
                                  >
                                    <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                                    <span>{change}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {!isLatest && (
                              <div className="pt-3 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVersion(version)
                                    setShowRestoreDialog(true)
                                  }}
                                  className="w-full"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Restore to this version
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Restore Template Version
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore the template to version {selectedVersion?.version}?
              This will create a new version with the restored content.
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Version {selectedVersion.version}</span>
                    <Badge variant="outline">
                      {formatDate(selectedVersion.createdAt)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created by {selectedVersion.createdBy}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> Restoring will create a new version with the content from 
                  version {selectedVersion.version}. The current version will be preserved in history.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={restoreVersionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreVersion}
              disabled={restoreVersionMutation.isPending}
            >
              {restoreVersionMutation.isPending ? 'Restoring...' : 'Restore Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}