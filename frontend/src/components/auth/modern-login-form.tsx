'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ModernPasswordHelp } from './modern-password-help'

interface ModernLoginFormProps {
  onSuccess?: () => void
}

export function ModernLoginForm({ onSuccess }: ModernLoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPasswordHelp, setShowPasswordHelp] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    try {
      console.log('🔑 ModernLoginForm: Attempting login for:', username)
      const result = await login(username, password)

      if (result) {
        console.log('🔑 ModernLoginForm: Login successful')
        onSuccess?.()
      } else {
        console.log('🔑 ModernLoginForm: Login failed')
        setIsLoggingIn(false)
      }
    } catch (error) {
      console.error('🔑 ModernLoginForm: Login error:', error)
      setIsLoggingIn(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              Authentication Failed: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Username Field */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-primary" />
            Username or Email
            <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              required
              autoComplete="username"
              autoFocus
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-primary" />
            Password
            <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="pl-10 pr-12 h-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={togglePasswordVisibility}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">
              Remember me
            </span>
          </label>

          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setShowPasswordHelp(true)}
            className="p-0 h-auto text-sm font-semibold"
          >
            Forgot password?
          </Button>
        </div>

        {/* Sign In Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Sign in to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {/* Security Badge */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium text-muted-foreground">
                  Secure Connection
                </span>
              </div>
              <div className="h-1 w-1 bg-border rounded-full" />
              <span className="text-muted-foreground">
                256-bit SSL Encryption
              </span>
              <Shield className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </form>

      <ModernPasswordHelp
        isOpen={showPasswordHelp}
        onClose={() => setShowPasswordHelp(false)}
      />
    </div>
  )
}