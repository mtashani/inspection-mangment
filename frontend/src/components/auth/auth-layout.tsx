'use client'

import { ReactNode } from 'react'
import { Shield, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  variant?: 'default' | 'error' | 'success' | 'warning'
}

const variantStyles = {
  default: {
    gradient: 'from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
    iconGradient: 'from-blue-600 to-blue-700',
    iconColor: 'text-white'
  },
  error: {
    gradient: 'from-slate-50 via-red-50/30 to-orange-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
    iconGradient: 'from-red-500 to-red-600',
    iconColor: 'text-white'
  },
  success: {
    gradient: 'from-slate-50 via-green-50/30 to-emerald-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
    iconGradient: 'from-green-500 to-green-600',
    iconColor: 'text-white'
  },
  warning: {
    gradient: 'from-slate-50 via-amber-50/30 to-yellow-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
    iconGradient: 'from-amber-500 to-amber-600',
    iconColor: 'text-white'
  }
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backButtonText = "Back",
  backButtonHref,
  variant = 'default'
}: AuthLayoutProps) {
  const router = useRouter()
  const styles = variantStyles[variant]

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref)
    } else {
      router.back()
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${styles.gradient} flex items-center justify-center px-6 py-12`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${styles.iconGradient} rounded-2xl flex items-center justify-center shadow-lg`}
          >
            <Shield className={`w-10 h-10 ${styles.iconColor}`} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </motion.div>
        </div>

        {/* Back Button */}
        {showBackButton && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-0 h-auto font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backButtonText}
            </Button>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {children}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Secure</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Reliable</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Professional</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Inspection Management System v2.0
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}