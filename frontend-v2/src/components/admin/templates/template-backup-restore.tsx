'use client'

import { useState } from 'react'
import { 
  Shield, 
  Download, 
  Upload, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  Archive
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { ReportTemplate } from '@/types/admin'

interface TemplateBackup {
  id: string
  templateId: string
  templateName: string
  version: number
  createdAt: string
  createdBy: string
  size: number
  description?: string
  isAutomatic: boolean
}

interface TemplateBackupRestoreProps {
  template: ReportTemplate
  onBackupCreated?: (backup: TemplateBackup) => void
  onRestoreCompleted?: (template: ReportTemplate) => void
}

export function TemplateBackupRestore({ 
  template, 
  onBackupCreated,
  onRestoreCompleted 
}: TemplateBackupRestoreProps) {
  const { toast } = useToast()
  const [showCreateBackupDialog, setShowCreateBackupDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showDeleteBackupDialog, setShowDeleteBackupDialog] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<TemplateBackup | null>(null)
  const [backupDescription, setBackupDescription] = useState('')
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)

  // Mock backup data - in real app this would come from API
  const backups: TemplateBackup[] = [
    {
      id: 'backup-1',
      templateId: template.id,
      templateName: template.name,
      version: template.version,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      createdBy: 'System',
      size: 45600,
      description: 'Automatic daily backup',
      isAutomatic: true
    },
    {
      id: 'backup-2',
      templateId: template.id,
      templateName: template.name,
      version: template.version - 1,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      createdBy: 'John Doe',
      size: 43200,
      description: 'Before major field restructuring',
      isAutomatic: false
    },
    {
      id: 'backup-3',
      templateId: template.id,
      templateName: template.name,
      version: template.version - 2,
      createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      createdBy: 'System',
      size: 41800,
      description: 'Weekly automatic backup',
      isAutomatic: true
    }
  ]

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    setBackupProgress(0)

    try {
      // Simulate backup creation progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      clearInterval(progressInterval)
      setBackupProgress(100)

      const newBackup: TemplateBackup = {
        id: `backup-${Date.now()}`,
        templateId: template.id,
        templateName: template.name,
        version: template.version,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
        size: Math.floor(Math.random() * 10000) + 40000,
        description: backupDescription || 'Manual backup',
        isAutomatic: false
      }

      if (onBackupCreated) {
        onBackupCreated(newBackup)
      }

      setShowCreateBackupDialog(false)
      setBackupDescription('')
      
      toast({
        title: 'Backup Created',
        description: 'Template backup has been created successfully',
      })

    } catch (error) {
      toast({
        title: 'Backup Failed',
        description: error instanceof Error ? error.message : 'Failed to create backup',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingBackup(false)
      setTimeout(() => setBackupProgress(0), 2000)
    }
  }

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return

    setIsRestoring(true)

    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 2000))

      if (onRestoreCompleted) {
        // In real app, this would be the restored template from API
        onRestoreCompleted({
          ...template,
          version: selectedBackup.version,
          updatedAt: new Date().toISOString()
        })
      }

      setShowRestoreDialog(false)
      setSelectedBackup(null)
      
      toast({
        title: 'Restore Completed',
        description: `Template restored from backup version ${selectedBackup.version}`,
      })

    } catch (error) {
      toast({
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'Failed to restore from backup',
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setShowDeleteBackupDialog(false)
      setSelectedBackup(null)
      
      toast({
        title: 'Backup Deleted',
        description: 'Backup has been deleted successfully',
      })

    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete backup',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadBackup = (backup: TemplateBackup) => {
    // Simulate backup download
    const blob = new Blob([JSON.stringify({
      backup,
      template,
      exportedAt: new Date().toISOString()
    }, null, 2)], { type: 'application/json' })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template-backup-${backup.id}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: 'Download Started',
      description: 'Backup file download has started',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Backup Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Backup & Restore
              <Badge variant="secondary">{backups.length} backups</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Create and manage template backups for disaster recovery and version control
                </p>
              </div>
              <Button onClick={() => setShowCreateBackupDialog(true)}>
                <Archive className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="w-12 h-12 mx-auto mb-4" />
                <p>No backups available</p>
                <p className="text-sm">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Version {backup.version}</span>
                        <Badge variant={backup.isAutomatic ? 'secondary' : 'outline'}>
                          {backup.isAutomatic ? 'Automatic' : 'Manual'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(backup.createdAt)}
                          </div>
                          <div>Size: {formatFileSize(backup.size)}</div>
                          <div>By: {backup.createdBy}</div>
                        </div>
                        {backup.description && (
                          <div>{backup.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup)
                          setShowRestoreDialog(true)
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      
                      {!backup.isAutomatic && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup)
                            setShowDeleteBackupDialog(true)
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Backup Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Automatic Backups:</strong> Daily backups are created automatically at 2:00 AM. 
                Manual backups can be created anytime and are retained for 90 days.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">Retention Policy</div>
                <div className="text-muted-foreground">90 days</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">Automatic Frequency</div>
                <div className="text-muted-foreground">Daily</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">Max Backups</div>
                <div className="text-muted-foreground">50 per template</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateBackupDialog} onOpenChange={setShowCreateBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Create Template Backup
            </DialogTitle>
            <DialogDescription>
              Create a backup of the current template version
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isCreatingBackup && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} />
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <div className="font-medium">Template: {template.name}</div>
                <div className="text-sm text-muted-foreground">
                  Version: {template.version} • Type: {template.reportType}
                </div>
                <div className="text-sm text-muted-foreground">
                  {template.sections.length} sections, {template.fieldsCount} fields
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-description">Description (Optional)</Label>
              <Textarea
                id="backup-description"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="Enter a description for this backup..."
                rows={3}
                disabled={isCreatingBackup}
              />
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This backup will include the complete template structure, all sections, fields, and settings.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateBackupDialog(false)}
              disabled={isCreatingBackup}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
            >
              {isCreatingBackup ? 'Creating...' : 'Create Backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Restore from Backup
            </DialogTitle>
            <DialogDescription>
              Restore the template from the selected backup
            </DialogDescription>
          </DialogHeader>

          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="font-medium">Backup Version {selectedBackup.version}</div>
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(selectedBackup.createdAt)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    By: {selectedBackup.createdBy}
                  </div>
                  {selectedBackup.description && (
                    <div className="text-sm">{selectedBackup.description}</div>
                  )}
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Restoring will replace the current template with the backup version. 
                  This action cannot be undone. Consider creating a backup of the current version first.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestoreBackup}
              disabled={isRestoring}
            >
              {isRestoring ? 'Restoring...' : 'Restore Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Backup Dialog */}
      <Dialog open={showDeleteBackupDialog} onOpenChange={setShowDeleteBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Backup
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedBackup && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">Version {selectedBackup.version}</div>
                <div className="text-sm text-muted-foreground">
                  Created: {formatDate(selectedBackup.createdAt)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Size: {formatFileSize(selectedBackup.size)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteBackupDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBackup}
            >
              Delete Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}