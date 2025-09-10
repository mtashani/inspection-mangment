'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  HelpCircle, 
  Mail, 
  Key, 
  Shield, 
  User, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  Send,
  Phone,
  Building
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// import { toast } from 'sonner' // Commented out as sonner might not be available

interface ModernPasswordHelpProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'help' | 'request' | 'success'

export function ModernPasswordHelp({ isOpen, onClose }: ModernPasswordHelpProps) {
  const [step, setStep] = useState<Step>('help')
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordRequest = async () => {
    if (!employeeId.trim() || !email.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setStep('success')
      console.log('Password reset request sent successfully')
    } catch (error) {
      alert('Failed to send request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('help')
    setEmployeeId('')
    setEmail('')
    onClose()
  }

  const helpContent = (
    <motion.div
      key="help"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Password Assistance</h3>
        <p className="text-gray-600">
          Get help with your account access and password management
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-50/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">First Time Login</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your username and temporary password were provided by your administrator when your account was created. Check your welcome email or contact IT support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-amber-50/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Forgot Password</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Request a password reset from your administrator. You'll receive a new temporary password via email or phone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-green-50/50 hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Change Password</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Once logged in, you can change your password from your profile settings for enhanced security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Contact IT Support</h4>
            <p className="text-sm text-gray-600 mb-2">
              For immediate assistance, contact your IT administrator:
            </p>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3" />
                <span>Internal: 1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3" />
                <span>it-support@company.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={() => setStep('request')}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Send className="w-4 h-4 mr-2" />
          Request Password Reset
        </Button>
        <Button 
          variant="outline"
          onClick={handleClose}
          className="w-full h-11 font-medium"
        >
          Back to Login
        </Button>
      </div>
    </motion.div>
  )

  const requestContent = (
    <motion.div
      key="request"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Password Reset</h3>
        <p className="text-gray-600">
          Provide your details to request a new password
        </p>
      </div>

      <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 font-medium">
          Your request will be sent to the system administrator. You will be contacted with a new password within 24 hours.
        </AlertDescription>
      </Alert>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="employeeId" className="text-sm font-semibold">
            Employee ID <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">Your unique employee identification number</p>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g., EMP001"
              className="pl-10 h-11"
              autoComplete="username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">Your registered email address for verification</p>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@company.com"
              className="pl-10 h-11"
              autoComplete="email"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={handlePasswordRequest}
          disabled={isSubmitting}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Sending Request...
            </div>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Reset Request
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          onClick={() => setStep('help')}
          disabled={isSubmitting}
          className="w-full h-11 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </motion.div>
  )

  const successContent = (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-center"
    >
      <div>
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent Successfully</h3>
        <p className="text-gray-600">
          Your password reset request has been submitted
        </p>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-green-50/50 border-green-200">
        <CardContent className="pt-4">
          <div className="space-y-3 text-left">
            <h4 className="font-semibold text-gray-900">What happens next?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                Your request has been sent to the system administrator
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                You will receive a new password within 24 hours
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                Check your email and phone for updates
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-600 mb-3">
          <strong>Request Details:</strong>
        </p>
        <div className="space-y-1 text-sm text-gray-600">
          <div>Employee ID: <span className="font-medium">{employeeId}</span></div>
          <div>Email: <span className="font-medium">{email}</span></div>
          <div>Submitted: <span className="font-medium">{new Date().toLocaleString()}</span></div>
        </div>
      </div>

      <Button 
        onClick={handleClose}
        className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        Back to Login
      </Button>
    </motion.div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Password Help</DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {step === 'help' && helpContent}
          {step === 'request' && requestContent}
          {step === 'success' && successContent}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}