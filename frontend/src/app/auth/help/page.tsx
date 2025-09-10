'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnhancedFormField, EnhancedInput } from '@/components/ui/enhanced-form-system'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthLayout } from '@/components/auth/auth-layout'
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  User, 
  Building, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  MessageSquare,
  Shield,
  Key,
  UserCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const helpTopics = [
  {
    icon: Key,
    title: 'Password Issues',
    description: 'Forgot password, account locked, or login problems',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    icon: UserCheck,
    title: 'Account Access',
    description: 'Permission issues or role-related problems',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    icon: Shield,
    title: 'Security Concerns',
    description: 'Suspicious activity or security questions',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    icon: MessageSquare,
    title: 'General Support',
    description: 'Other questions or technical issues',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
]

export default function HelpPage() {
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    subject: '',
    message: '',
    urgency: 'normal'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic)
    setFormData(prev => ({ ...prev, subject: topic }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSubmitted(true)
      toast.success('Help request submitted successfully')
    } catch (error) {
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Request Submitted"
        subtitle="Your help request has been sent successfully"
        variant="success"
        showBackButton
        backButtonText="Back to Login"
        backButtonHref="/login"
      >
        <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              We've Got Your Request
            </h3>
            
            <div className="space-y-4 text-left">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  What happens next?
                </h4>
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Our support team will review your request
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    You'll receive a response within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    Check your email for updates
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Request Details
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <div>Subject: <span className="font-medium">{formData.subject}</span></div>
                  <div>Priority: <span className="font-medium capitalize">{formData.urgency}</span></div>
                  <div>Submitted: <span className="font-medium">{new Date().toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Need Help?"
      subtitle="Get assistance with your account and system access"
      showBackButton
      backButtonText="Back to Login"
      backButtonHref="/login"
    >
      <Card className="shadow-2xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold text-gray-900 dark:text-white">
            How can we help you today?
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Contact Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Quick Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Phone className="w-3 h-3" />
                <span>Internal: 1234</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Mail className="w-3 h-3" />
                <span>it-support@company.com</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="w-3 h-3" />
                <span>Mon-Fri: 8AM-6PM</span>
              </div>
            </div>
          </div>

          {/* Help Topics */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Select your issue type:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {helpTopics.map((topic, index) => {
                const Icon = topic.icon
                const isSelected = selectedTopic === topic.title
                
                return (
                  <motion.button
                    key={topic.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleTopicSelect(topic.title)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? `${topic.bgColor} ${topic.borderColor} shadow-md`
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? topic.bgColor : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? topic.color : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <h4 className={`font-medium mb-1 ${
                          isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {topic.title}
                        </h4>
                        <p className={`text-xs ${
                          isSelected ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Contact Form */}
          {selectedTopic && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4 border-t pt-6"
            >
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  For urgent issues, please call the support line directly at extension 1234.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EnhancedFormField
                  label="Full Name"
                  required
                  config={{ variant: 'comfortable', size: 'sm' }}
                >
                  <EnhancedInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    prefix={<User className="h-4 w-4 text-gray-400" />}
                    required
                  />
                </EnhancedFormField>

                <EnhancedFormField
                  label="Employee ID"
                  required
                  config={{ variant: 'comfortable', size: 'sm' }}
                >
                  <EnhancedInput
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="e.g., EMP001"
                    required
                  />
                </EnhancedFormField>
              </div>

              <EnhancedFormField
                label="Email Address"
                required
                config={{ variant: 'comfortable', size: 'sm' }}
              >
                <EnhancedInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@company.com"
                  prefix={<Mail className="h-4 w-4 text-gray-400" />}
                  required
                />
              </EnhancedFormField>

              <EnhancedFormField
                label="Priority Level"
                config={{ variant: 'comfortable', size: 'sm' }}
              >
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - General inquiry</option>
                  <option value="normal">Normal - Standard support</option>
                  <option value="high">High - Urgent issue</option>
                  <option value="critical">Critical - System down</option>
                </select>
              </EnhancedFormField>

              <EnhancedFormField
                label="Describe your issue"
                required
                description="Please provide as much detail as possible"
                config={{ variant: 'comfortable', size: 'sm' }}
              >
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </EnhancedFormField>

              <Button
                type="submit"
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
                    Send Help Request
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}