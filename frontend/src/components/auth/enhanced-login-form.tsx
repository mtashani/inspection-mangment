'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { VStack, HStack } from '@/components/ui/stack'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  User, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield
} from 'lucide-react'
import { ModernPasswordHelp } from './modern-password-help'

interface EnhancedLoginFormProps {
  onSuccess?: () => void
}

export function EnhancedLoginForm({ onSuccess }: EnhancedLoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPasswordHelp, setShowPasswordHelp] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{username?: string, password?: string}>({})
  const { login, error } = useAuth()

  const validateField = (field: 'username' | 'password', value: string) => {
    const errors = { ...fieldErrors }
    
    if (field === 'username') {
      if (!value.trim()) {
        errors.username = 'Username or email is required'
      } else if (value.length < 3) {
        errors.username = 'Username must be at least 3 characters'
      } else {
        delete errors.username
      }
    }
    
    if (field === 'password') {
      if (!value) {
        errors.password = 'Password is required'
      } else if (value.length < 3) {
        errors.password = 'Password must be at least 3 characters'
      } else {
        delete errors.password
      }
    }
    
    setFieldErrors(errors)
    return !errors[field]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const isUsernameValid = validateField('username', username)
    const isPasswordValid = validateField('password', password)
    
    if (!isUsernameValid || !isPasswordValid) {
      return
    }
    
    setIsLoggingIn(true)

    try {
      console.log('🔑 EnhancedLoginForm: Attempting login for:', username)
      const result = await login(username, password)

      if (result) {
        console.log('🔑 EnhancedLoginForm: Login successful')
        onSuccess?.()
      } else {
        console.log('🔑 EnhancedLoginForm: Login failed')
        setIsLoggingIn(false)
      }
    } catch (error) {
      console.error('🔑 EnhancedLoginForm: Login error:', error)
      setIsLoggingIn(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const getFieldState = (field: 'username' | 'password') => {
    if (fieldErrors[field]) return 'error'
    if (field === 'username' && username && !fieldErrors.username) return 'success'
    if (field === 'password' && password && !fieldErrors.password) return 'success'
    return 'default'
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Error Alert */}
        {error && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Authentication Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Username Field */}
        <VStack gap="sm">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-[var(--color-primary)]" />
            Username or Email
            <span className="text-[var(--color-error)]">*</span>
          </Label>
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-base-content)]/50" />
            <Input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (fieldErrors.username) {
                  validateField('username', e.target.value)
                }
              }}
              onBlur={() => validateField('username', username)}
              placeholder="Enter your username or email"
              required
              autoComplete="username"
              autoFocus
              variant={getFieldState('username') === 'error' ? 'error' : getFieldState('username') === 'success' ? 'success' : 'default'}
              size="lg"
              leftElement={<Mail className="h-4 w-4" />}
              className="h-12"
            />
            
            {getFieldState('username') === 'success' && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-success)]" />
            )}
            {getFieldState('username') === 'error' && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-error)]" />
            )}
            
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-[var(--color-error)] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.username}
              </p>
            )}
          </div>
        </VStack>

        {/* Password Field */}
        <VStack gap="sm">
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-[var(--color-primary)]" />
            Password
            <span className="text-[var(--color-error)]">*</span>
          </Label>
          
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  validateField('password', e.target.value)
                }
              }}
              onBlur={() => validateField('password', password)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              variant={getFieldState('password') === 'error' ? 'error' : getFieldState('password') === 'success' ? 'success' : 'default'}
              size="lg"
              leftElement={<Lock className="h-4 w-4" />}
              rightElement={
                <div className="flex items-center gap-2">
                  {getFieldState('password') === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                  )}
                  {getFieldState('password') === 'error' && (
                    <AlertCircle className="h-4 w-4 text-[var(--color-error)]" />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={togglePasswordVisibility}
                    className="h-8 w-8 p-0"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              }
              className="h-12"
            />
            
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-[var(--color-error)] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.password}
              </p>
            )}
          </div>
        </VStack>

        {/* Remember Me & Forgot Password */}
        <HStack justify="between" align="center" className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded-[var(--radius-selector)] border-[var(--color-base-300)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm font-medium text-[var(--color-base-content)]">
              Remember me
            </span>
          </label>

          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setShowPasswordHelp(true)}
            className="p-0 h-auto text-sm font-semibold text-[var(--color-primary)]"
          >
            Forgot password?
          </Button>
        </HStack>

        {/* Sign In Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoggingIn || !!fieldErrors.username || !!fieldErrors.password}
            className="w-full text-lg font-semibold"
            size="lg"
            loading={isLoggingIn}
            leftIcon={!isLoggingIn ? <Shield className="h-5 w-5" /> : undefined}
            rightIcon={!isLoggingIn ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            {isLoggingIn ? 'Signing in...' : 'Sign in to Dashboard'}
          </Button>
        </div>

        {/* Security Badge */}
        <Card variant="ghost" className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-[var(--color-success)] rounded-full animate-pulse" />
                <span className="font-medium text-[var(--color-base-content)]/70">
                  Secure Connection
                </span>
              </div>
              <div className="h-1 w-1 bg-[var(--color-base-300)] rounded-full" />
              <span className="text-[var(--color-base-content)]/70">
                256-bit SSL Encryption
              </span>
              <Shield className="h-4 w-4 text-[var(--color-success)]" />
            </div>
          </CardContent>
        </Card>
      </form>

      <ModernPasswordHelp
        isOpen={showPasswordHelp}
        onClose={() => setShowPasswordHelp(false)}
      />
    </>
  )
}