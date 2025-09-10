'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Shield, Sparkles, CheckCircle, Users, BarChart3, Settings, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import { ModernLoginForm } from './modern-login-form'
import { Button } from '@/components/ui/button'

const colorSchemes = [
  { name: 'Blue', class: 'theme-blue', primary: 'from-blue-600 to-blue-700', bg: 'from-slate-50 via-blue-50/30 to-indigo-50/50' },
  { name: 'Green', class: 'theme-green', primary: 'from-green-600 to-green-700', bg: 'from-slate-50 via-green-50/30 to-emerald-50/50' },
  { name: 'Purple', class: 'theme-purple', primary: 'from-purple-600 to-purple-700', bg: 'from-slate-50 via-purple-50/30 to-violet-50/50' },
  { name: 'Orange', class: 'theme-orange', primary: 'from-orange-600 to-orange-700', bg: 'from-slate-50 via-orange-50/30 to-amber-50/50' },
  { name: 'Red', class: 'theme-red', primary: 'from-red-600 to-red-700', bg: 'from-slate-50 via-red-50/30 to-pink-50/50' },
  { name: 'Teal', class: 'theme-teal', primary: 'from-teal-600 to-teal-700', bg: 'from-slate-50 via-teal-50/30 to-cyan-50/50' },
  { name: 'Indigo', class: 'theme-indigo', primary: 'from-indigo-600 to-indigo-700', bg: 'from-slate-50 via-indigo-50/30 to-blue-50/50' }
]

const features = [
  {
    icon: CheckCircle,
    title: 'Inspection Management',
    description: 'Streamlined inspection workflows and tracking'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Coordinate with inspectors and administrators'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Comprehensive reporting and data insights'
  },
  {
    icon: Settings,
    title: 'System Administration',
    description: 'Manage users, permissions, and configurations'
  }
]

export function ThemedLoginPage() {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [currentTheme, setCurrentTheme] = useState(0)
  const [showThemeSelector, setShowThemeSelector] = useState(false)

  // Rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const body = document.body
    // Remove all theme classes
    colorSchemes.forEach(scheme => {
      body.classList.remove(scheme.class)
    })
    // Add current theme class
    body.classList.add(colorSchemes[currentTheme].class)
    
    return () => {
      // Cleanup on unmount
      colorSchemes.forEach(scheme => {
        body.classList.remove(scheme.class)
      })
    }
  }, [currentTheme])

  const currentScheme = colorSchemes[currentTheme]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentScheme.bg} dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex relative`}>
      {/* Theme Selector */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90"
          >
            <Palette className="w-4 h-4 mr-2" />
            {currentScheme.name}
          </Button>
          
          {showThemeSelector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]"
            >
              <div className="grid grid-cols-2 gap-2">
                {colorSchemes.map((scheme, index) => (
                  <button
                    key={scheme.name}
                    onClick={() => {
                      setCurrentTheme(index)
                      setShowThemeSelector(false)
                    }}
                    className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
                      index === currentTheme
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${scheme.primary}`} />
                    {scheme.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Left Side - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          {/* Logo and Brand */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-12 h-12 bg-gradient-to-br ${currentScheme.primary} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Inspection Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Professional inspection system
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-12">
            <h2 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Welcome to your
              <span className={`bg-gradient-to-r ${currentScheme.primary} bg-clip-text text-transparent block`}>
                inspection workspace
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Manage inspections, track compliance, and collaborate with your team in one comprehensive platform.
            </p>
          </div>

          {/* Animated Features */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Key Features
            </h3>
            
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                const isActive = index === currentFeature
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ 
                      opacity: isActive ? 1 : 0.7, 
                      scale: isActive ? 1 : 0.95,
                      x: isActive ? 8 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/80 dark:bg-slate-800/80 shadow-lg border border-primary/20' 
                        : 'bg-white/40 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-primary/10' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isActive 
                          ? 'text-primary' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isActive 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {feature.title}
                      </h4>
                      <p className={`text-sm ${
                        isActive 
                          ? 'text-gray-600 dark:text-gray-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Progress Indicators */}
            <div className="flex gap-2 mt-6">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentFeature 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-8">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${currentScheme.primary} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Sign in to access your inspection dashboard
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="pb-8">
              <ModernLoginForm />
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-8 space-y-4"
          >
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Secure</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span>Reliable</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <span>Professional</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Inspection Management System v2.0 • Theme: {currentScheme.name}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}