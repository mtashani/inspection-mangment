'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Shield,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { PayrollRecord } from '@/types/admin'

interface ApprovalWorkflowStep {
  id: string
  name: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected' | 'not_started'
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  comments?: string
  required: boolean
}

interface PayrollApprovalWorkflowProps {
  record: PayrollRecord
  workflowSteps: ApprovalWorkflowStep[]
  onApprove: (stepId: string, comments?: string) => Promise<void>
  onReject: (stepId: string, reason: string) => Promise<void>
  canApprove: boolean
  currentUserRole: string
}

export function PayrollApprovalWorkflow({
  record,
  workflowSteps,
  onApprove,
  onReject,
  canApprove,
  currentUserRole
}: PayrollApprovalWorkflowProps) {
  const [selectedStep, setSelectedStep] = useState<ApprovalWorkflowStep | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async () => {
    if (!selectedStep || !actionType) return

    setIsProcessing(true)
    try {
      if (actionType === 'approve') {
        await onApprove(selectedStep.id, comments)
      } else {
        await onReject(selectedStep.id, comments)
      }
      setSelectedStep(null)
      setActionType(null)
      setComments('')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStepStatus = (step: ApprovalWorkflowStep) => {
    switch (step.status) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' }
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' }
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' }
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100' }
    }
  }

  const canUserApproveStep = (step: ApprovalWorkflowStep) => {
    return canApprove && 
           step.approverRole === currentUserRole && 
           step.status === 'pending'
  }

  const getOverallStatus = () => {
    const requiredSteps = workflowSteps.filter(step => step.required)
    const approvedRequired = requiredSteps.filter(step => step.status === 'approved')
    const rejectedSteps = workflowSteps.filter(step => step.status === 'rejected')

    if (rejectedSteps.length > 0) {
      return { status: 'rejected', color: 'destructive' }
    }
    if (approvedRequired.length === requiredSteps.length) {
      return { status: 'approved', color: 'secondary' }
    }
    return { status: 'pending', color: 'outline' }
  }

  const overallStatus = getOverallStatus()

  return (
    <div className="space-y-6">
      {/* Payroll Record Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Approval Workflow</CardTitle>
            <Badge variant={overallStatus.color as any}>
              {overallStatus.status.charAt(0).toUpperCase() + overallStatus.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Inspector</p>
              <p className="font-medium">{record.inspector.name}</p>
              <p className="text-sm text-muted-foreground">{record.inspector.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">
                {new Date(record.year, record.month - 1).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Pay</p>
              <p className="font-medium text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(record.netPay)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={record.isPaid ? 'secondary' : 'destructive'}>
                {record.isPaid ? 'Paid' : 'Pending Payment'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Approval Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const statusInfo = getStepStatus(step)
              const StatusIcon = statusInfo.icon
              const canApproveThisStep = canUserApproveStep(step)

              return (
                <div key={step.id} className="relative">
                  {/* Connector Line */}
                  {index < workflowSteps.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
                  )}
                  
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${statusInfo.bg}`}>
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{step.name}</h4>
                        <div className="flex items-center gap-2">
                          {step.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {step.approverRole}
                          </Badge>
                        </div>
                      </div>
                      
                      {step.status === 'approved' && (
                        <div className="text-sm text-green-600 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>Approved by {step.approvedBy}</span>
                            <Calendar className="h-3 w-3 ml-2" />
                            <span>{new Date(step.approvedAt!).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {step.status === 'rejected' && (
                        <div className="text-sm text-red-600 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>Rejected by {step.rejectedBy}</span>
                            <Calendar className="h-3 w-3 ml-2" />
                            <span>{new Date(step.rejectedAt!).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {step.comments && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-3 w-3 mt-0.5" />
                            <span>{step.comments}</span>
                          </div>
                        </div>
                      )}
                      
                      {canApproveThisStep && (
                        <div className="flex gap-2 mt-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedStep(step)
                                  setActionType('approve')
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Payroll Step</DialogTitle>
                              </DialogHeader>
                              <ApprovalDialog
                                step={step}
                                actionType="approve"
                                comments={comments}
                                onCommentsChange={setComments}
                                onConfirm={handleAction}
                                onCancel={() => {
                                  setSelectedStep(null)
                                  setActionType(null)
                                  setComments('')
                                }}
                                isProcessing={isProcessing}
                              />
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  setSelectedStep(step)
                                  setActionType('reject')
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Payroll Step</DialogTitle>
                              </DialogHeader>
                              <ApprovalDialog
                                step={step}
                                actionType="reject"
                                comments={comments}
                                onCommentsChange={setComments}
                                onConfirm={handleAction}
                                onCancel={() => {
                                  setSelectedStep(null)
                                  setActionType(null)
                                  setComments('')
                                }}
                                isProcessing={isProcessing}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Security Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                All payroll approvals are logged and audited. Ensure you have reviewed all calculations 
                and supporting documentation before approving. Once approved, changes require additional 
                authorization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}inte
rface ApprovalDialogProps {
  step: ApprovalWorkflowStep
  actionType: 'approve' | 'reject'
  comments: string
  onCommentsChange: (comments: string) => void
  onConfirm: () => void
  onCancel: () => void
  isProcessing: boolean
}

function ApprovalDialog({
  step,
  actionType,
  comments,
  onCommentsChange,
  onConfirm,
  onCancel,
  isProcessing
}: ApprovalDialogProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">{step.name}</h4>
        <p className="text-sm text-muted-foreground">
          You are about to {actionType} this payroll step. This action will be logged and audited.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">
          {actionType === 'reject' ? 'Rejection Reason (Required)' : 'Comments (Optional)'}
        </Label>
        <Textarea
          id="comments"
          placeholder={
            actionType === 'reject' 
              ? 'Please provide a reason for rejection...' 
              : 'Add any comments or notes...'
          }
          value={comments}
          onChange={(e) => onCommentsChange(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          variant={actionType === 'reject' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={isProcessing || (actionType === 'reject' && !comments.trim())}
        >
          {isProcessing ? 'Processing...' : `${actionType === 'approve' ? 'Approve' : 'Reject'} Step`}
        </Button>
      </div>
    </div>
  )
}