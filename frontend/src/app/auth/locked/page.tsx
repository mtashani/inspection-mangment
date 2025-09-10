'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/auth-layout'
import { 
  Lock, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle,
  Shield,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function AccountLockedPage() {
  const [timeRemaining, setTimeRemaining] = useState(15 * 60) // 15 minutes in seconds
  const [isRetrying, setIsRetrying] = useState(false)
  const router = useRouter()

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    // Simulate checking if account is unlocked
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRetrying(false)
    
    if (timeRemaining <= 0) {
      router.push('/login')
    }
  }

  const securityTips = [
    {
      icon: Shield,
      title: 'Use Strong Passwords',
      description: 'Create passwords with at least 8 characters, including numbers and symbols'
    },
    {
      icon: CheckCircle,
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account'
    },
    {
      icon: AlertTriangle,
      title: 'Report Suspicious Activity',
      description: 'Contact IT immediately if you notice unusual account activity'
    }
  ]

  return (
    <AuthLayout
      title="Account Temporarily Locked"
      subtitle="Your account has been locked due to multiple failed login attempts"
      variant="warning"
      showBackButton
      backButtonText="Back to Login"
      backButtonHref="/login"
    >
      <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Security Protection Active
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your account will be automatically unlocked in:
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Time Remaining
                </span>
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-2">
                {formatTime(timeRemaining)}
              </div>
              <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                <motion.div
                  className="bg-amber-500 h-2 rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeRemaining / (15 * 60)) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Why was my account locked? */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Why was my account locked?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                Multiple incorrect password attempts were detected
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                This is a security measure to protect your account
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                Your account will unlock automatically after the timer expires
              </li>
            </ul>
          </div>

          {/* Security Tips */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Security Tips
            </h4>
            <div className="space-y-3">
              {securityTips.map((tip, index) => {
                const Icon = tip.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                        {tip.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {tip.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              disabled={isRetrying || timeRemaining > 0}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Checking Account Status...
                </div>
              ) : timeRemaining > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again ({formatTime(timeRemaining)})
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Logging In Again
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/auth/help')}
              className="w-full h-11 font-medium"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Get Help
            </Button>
          </div>

          {/* Emergency Contact */}
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Emergency Access Needed?
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              If you need immediate access for urgent work, contact IT support:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 text-sm">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <Phone className="w-3 h-3" />
                <span>Emergency: 1234</span>
              </div>
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <Mail className="w-3 h-3" />
                <span>urgent@company.com</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}