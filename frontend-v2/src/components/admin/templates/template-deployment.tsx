'use client'

import { useState } from 'react'
import { 
  Rocket, 
  Pause, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Activity,
  Settings
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ReportTemplate } from '@/types/admin'

interface TemplateDeploymentProps {
  template: ReportTemplate
  onStatusChange: (templateId: string, isActive: boolean, reason?: string) => Promise<void>
}

interface DeploymentStatus {
  isActive: boolean
  lastDeployedAt?: string
  deployedBy?: string
  usageCount: number
  activeUsers: number
  lastUsedAt?: string
}

export function TemplateDeployment({ 
  template, 
  onStatusChange 
}: TemplateDeploymentProps) {
  const { toast } = useToast()
  const [showActivationDialog, setShowActivationDialog] = useState(false)
  const [showDeactivationDialog, setShowDeactivationDialog] = useState(false)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock deployment status - in real app this would come from API
  const deploymentStatus: DeploymentStatus = {
    isActive: template.isActive,
    lastDeployedAt: template.updatedAt,
    deployedBy: template.createdBy,
    usageCount: Math.floor(Math.random() * 100) + 10,
    activeUsers: Math.floor(Math.random() * 20) + 1,
    lastUsedAt: template.lastUsedAt
  }

  const handleActivate = async () => {
    setIsLoading(true)
    try {
      await onStatusChange(template.id, true, reason)
      setShowActivationDialog(false)
      setReason('')
      
      toast({
        title: 'Template Activated',
        description: `Template "${template.name}" is now active and available for use`,
      })
    } catch (error) {
      toast({
        title: 'Activation Failed',
        description: error instanceof Error ? error.message : 'Failed to activate template',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async () => {
    setIsLoading(true)
    try {
      await onStatusChange(template.id, false, reason)
      setShowDeactivationDialog(false)
      setReason('')
      
      toast({
        title: 'Template Deactivated',
        description: `Template "${template.name}" has been deactivated`,
      })
    } catch (error) {
      toast({
        title: 'Deactivation Failed',
        description: error instanceof Error ? error.message : 'Failed to deactivate template',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-gray-600'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : Pause
  }

  return (
    <>
      <div className="space-y-6">
        {/* Deployment Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Deployment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current Status */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {(() => {
                    const StatusIcon = getStatusIcon(deploymentStatus.isActive)
                    return <StatusIcon className={`w-8 h-8 ${getStatusColor(deploymentStatus.isActive)}`} />
                  })()}
                </div>
                <div className="font-semibold">
                  {deploymentStatus.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-xs text-muted-foreground">Current Status</div>
              </div>

              {/* Usage Count */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <div className="font-semibold text-blue-600">
                  {deploymentStatus.usageCount}
                </div>
                <div className="text-xs text-muted-foreground">Total Uses</div>
              </div>

              {/* Active Users */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div className="font-semibold text-purple-600">
                  {deploymentStatus.activeUsers}
                </div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>

              {/* Last Used */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <div className="font-semibold text-orange-600 text-xs">
                  {formatDate(deploymentStatus.lastUsedAt)}
                </div>
                <div className="text-xs text-muted-foreground">Last Used</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Deployment Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Status Display */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {(() => {
                  const StatusIcon = getStatusIcon(deploymentStatus.isActive)
                  return <StatusIcon className={`w-6 h-6 ${getStatusColor(deploymentStatus.isActive)}`} />
                })()}
                <div>
                  <div className="font-medium">
                    Template is currently {deploymentStatus.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {deploymentStatus.isActive 
                      ? 'Available for creating new reports'
                      : 'Not available for use'
                    }
                  </div>
                </div>
              </div>
              <Badge variant={deploymentStatus.isActive ? 'default' : 'secondary'}>
                {deploymentStatus.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {deploymentStatus.isActive ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDeactivationDialog(true)}
                  disabled={isLoading}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Deactivate Template
                </Button>
              ) : (
                <Button
                  onClick={() => setShowActivationDialog(true)}
                  disabled={isLoading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Activate Template
                </Button>
              )}
            </div>

            {/* Deployment Information */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Deployment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Last Deployed:</span>
                  <div className="font-medium">{formatDate(deploymentStatus.lastDeployedAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Deployed By:</span>
                  <div className="font-medium">{deploymentStatus.deployedBy || 'Unknown'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Template Version:</span>
                  <div className="font-medium">v{template.version}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Report Type:</span>
                  <div className="font-medium">{template.reportType}</div>
                </div>
              </div>
            </div>

            {/* Usage Warnings */}
            {deploymentStatus.isActive && deploymentStatus.activeUsers > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This template is currently being used by {deploymentStatus.activeUsers} user(s). 
                  Deactivating it may affect their ability to create or complete reports.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activation Dialog */}
      <Dialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-600" />
              Activate Template
            </DialogTitle>
            <DialogDescription>
              Activate "{template.name}" to make it available for creating reports.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">Template will be activated</div>
                  <div className="text-sm text-green-700 mt-1">
                    Users will be able to create new reports using this template
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activation-reason">Activation Reason (Optional)</Label>
              <Textarea
                id="activation-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for activating this template..."
                rows={3}
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Make sure the template has been properly tested before activation.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActivationDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivate}
              disabled={isLoading}
            >
              {isLoading ? 'Activating...' : 'Activate Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation Dialog */}
      <Dialog open={showDeactivationDialog} onOpenChange={setShowDeactivationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-orange-600" />
              Deactivate Template
            </DialogTitle>
            <DialogDescription>
              Deactivate "{template.name}" to prevent it from being used for new reports.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-800">Template will be deactivated</div>
                  <div className="text-sm text-orange-700 mt-1">
                    Users will no longer be able to create new reports using this template
                  </div>
                </div>
              </div>
            </div>

            {deploymentStatus.activeUsers > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> {deploymentStatus.activeUsers} user(s) are currently using this template. 
                  Deactivating may affect their work.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="deactivation-reason">Deactivation Reason (Required)</Label>
              <Textarea
                id="deactivation-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for deactivating this template..."
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivationDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? 'Deactivating...' : 'Deactivate Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}