'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { HelpCircle, Mail, Key, Shield, User, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface PasswordHelpModalProps {
  isOpen?: boolean
  onClose?: () => void
}

export function PasswordHelpModal({ isOpen, onClose }: PasswordHelpModalProps) {
  const [step, setStep] = useState<'help' | 'request'>('help')
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordRequest = async () => {
    if (!employeeId.trim() || !email.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      // In real implementation, this would send a request to admin
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      toast.success('Password reset request sent to administrator')
      setStep('help')
      setEmployeeId('')
      setEmail('')
      onClose?.()
    } catch (error) {
      toast.error('Failed to send request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const helpContent = (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Assistance</h3>
        <p className="text-gray-600 text-sm">
          Your account is managed by the system administrator
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">First Time Login</h4>
                <p className="text-sm text-gray-600">
                  Your username and temporary password were provided by your administrator when your account was created.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Forgot Password</h4>
                <p className="text-sm text-gray-600">
                  If you've forgotten your password, you'll need to request a reset from your administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Change Password</h4>
                <p className="text-sm text-gray-600">
                  Once logged in, you can change your password from your profile settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={() => setStep('request')}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Request Password Reset
        </Button>
        <Button 
          variant="outline"
          onClick={onClose}
          className="w-full"
        >
          Back to Login
        </Button>
      </div>
    </div>
  )

  const requestContent = (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-amber-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Password Reset</h3>
        <p className="text-gray-600 text-sm">
          Please provide your details to request a password reset
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Your request will be sent to the system administrator. You will be contacted with a new password.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="employee-id">Employee ID</Label>
          <Input
            id="employee-id"
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter your employee ID"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={handlePasswordRequest}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Sending Request...
            </div>
          ) : (
            'Send Reset Request'
          )}
        </Button>
        <Button 
          variant="outline"
          onClick={() => setStep('help')}
          disabled={isSubmitting}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Password Help</DialogTitle>
          <DialogDescription>Get help with your password</DialogDescription>
        </DialogHeader>
        {step === 'help' ? helpContent : requestContent}
      </DialogContent>
    </Dialog>
  )
}

export function PasswordHelpButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-auto p-1"
      >
        <HelpCircle className="w-4 h-4 mr-1" />
        Need help with password?
      </Button>
      <PasswordHelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}