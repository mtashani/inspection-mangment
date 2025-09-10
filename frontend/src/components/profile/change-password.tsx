'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, Shield, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ChangePasswordProps {
  className?: string
}

export function ChangePassword({ className }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validatePassword = (password: string) => {
    const errors = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors: {[key: string]: string} = {}
    
    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else {
      const passwordErrors = validatePassword(newPassword)
      if (passwordErrors.length > 0) {
        newErrors.newPassword = `Password must have: ${passwordErrors.join(', ')}`
      }
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsChanging(true)
    try {
      // In real implementation, this would call the API
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      if (response.ok) {
        toast.success('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to change password')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password'
      toast.error(errorMessage)
      if (errorMessage.includes('current password')) {
        setErrors({ currentPassword: 'Current password is incorrect' })
      }
    } finally {
      setIsChanging(false)
    }
  }

  const passwordStrength = validatePassword(newPassword)
  const isStrongPassword = passwordStrength.length === 0 && newPassword.length > 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className={`pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className={`pr-10 ${errors.newPassword ? 'border-red-500' : isStrongPassword ? 'border-green-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword ? (
              <p className="text-sm text-red-600">{errors.newPassword}</p>
            ) : newPassword && (
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Password requirements:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number'].map((req, index) => {
                    const satisfied = passwordStrength.length === 0 || !passwordStrength.includes(req)
                    return (
                      <div key={index} className={`flex items-center gap-1 ${satisfied ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3" />
                        {req}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : confirmPassword && newPassword === confirmPassword ? 'border-green-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Security Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Make sure to use a strong password that you haven&apos;t used elsewhere. Your password will be encrypted and stored securely.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isChanging ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Changing Password...
              </div>
            ) : (
              'Change Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}