'use client'

import React, { useState } from 'react'
import { Plus, X, User, GraduationCap, Briefcase, CheckCircle2, AlertTriangle, Lock, Key } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Inspector, InspectorFormData } from '@/types/admin'
import { createInspector } from '@/lib/api/admin/inspectors'
import { toast } from 'sonner'

export interface CreateInspectorModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSuccess?: () => void
}

interface CreateInspectorFormData {
  firstName: string
  lastName: string
  employeeId: string
  nationalId: string
  email: string
  phone?: string
  dateOfBirth?: string
  birthPlace?: string
  maritalStatus?: string
  educationDegree?: string
  educationField?: string
  educationInstitute?: string
  graduationYear?: number
  yearsExperience: number
  previousCompanies?: string[]
  active: boolean
  canLogin: boolean
  username?: string
  password?: string
}

export function CreateInspectorModal({ open, onOpenChange, trigger, onSuccess }: CreateInspectorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateInspectorFormData>>({
    yearsExperience: 0,
    active: true,
    canLogin: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof CreateInspectorFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.employeeId?.trim()) {
      newErrors.employeeId = 'Employee ID is required'
    }
    if (!formData.nationalId?.trim()) {
      newErrors.nationalId = 'National ID is required'
    } else if (formData.nationalId.length !== 10) {
      newErrors.nationalId = 'National ID must be 10 digits'
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (formData.yearsExperience === undefined || formData.yearsExperience === null) {
      newErrors.yearsExperience = 'Years of experience is required'
    } else if (formData.yearsExperience < 0 || formData.yearsExperience > 50) {
      newErrors.yearsExperience = 'Years of experience must be between 0 and 50'
    }

    // Login credentials validation
    if (formData.canLogin) {
      if (!formData.username?.trim()) {
        newErrors.username = 'Username is required when login is enabled'
      }
      if (!formData.password?.trim()) {
        newErrors.password = 'Password is required when login is enabled'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Transform form data to match the API format
      const inspectorData: InspectorFormData = {
        firstName: formData.firstName!,
        lastName: formData.lastName!,
        employeeId: formData.employeeId!,
        nationalId: formData.nationalId!,
        email: formData.email!,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        birthPlace: formData.birthPlace,
        maritalStatus: formData.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | undefined,
        educationDegree: formData.educationDegree,
        educationField: formData.educationField,
        educationInstitute: formData.educationInstitute,
        graduationYear: formData.graduationYear,
        yearsExperience: formData.yearsExperience!,
        previousCompanies: formData.previousCompanies || [],
        active: formData.active!,
        canLogin: formData.canLogin!,
        attendanceTrackingEnabled: false,
        username: formData.username,
        password: formData.password
      }

      console.log('Creating inspector:', inspectorData)
      
      // Call the actual API
      const result = await createInspector(inspectorData)
      
      // Close modal and reset form
      handleClose()
      onSuccess?.()
      toast.success('Inspector created successfully!')
      
    } catch (error: unknown) {
      console.error('Failed to create inspector:', error instanceof Error ? error.message : String(error))
      const errorMessage = error instanceof Error ? error.message : 'Failed to create inspector. Please try again.'
      setErrors({ submit: errorMessage })
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ 
      yearsExperience: 0,
      active: true,
      canLogin: false
    })
    setErrors({})
    setIsSubmitting(false)
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            Create Inspector
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a new inspector with basic information, education, and work experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={cn("h-9", errors.firstName && "border-destructive")}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={cn("h-9", errors.lastName && "border-destructive")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-sm font-medium">
                    Employee ID *
                  </Label>
                  <Input
                    id="employeeId"
                    placeholder="EMP-001"
                    value={formData.employeeId || ''}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className={cn("h-9", errors.employeeId && "border-destructive")}
                  />
                  {errors.employeeId && (
                    <p className="text-sm text-destructive">{errors.employeeId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalId" className="text-sm font-medium">
                    National ID *
                  </Label>
                  <Input
                    id="nationalId"
                    placeholder="1234567890"
                    maxLength={10}
                    value={formData.nationalId || ''}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    className={cn("h-9", errors.nationalId && "border-destructive")}
                  />
                  {errors.nationalId && (
                    <p className="text-sm text-destructive">{errors.nationalId}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="inspector@company.com"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={cn("h-9", errors.email && "border-destructive")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+98 912 345 6789"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthPlace" className="text-sm font-medium">
                    Birth Place
                  </Label>
                  <Input
                    id="birthPlace"
                    placeholder="Tehran"
                    value={formData.birthPlace || ''}
                    onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus" className="text-sm font-medium">
                    Marital Status
                  </Label>
                  <Select 
                    value={formData.maritalStatus || ''} 
                    onValueChange={(value) => handleInputChange('maritalStatus', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="MARRIED">Married</SelectItem>
                      <SelectItem value="DIVORCED">Divorced</SelectItem>
                      <SelectItem value="WIDOWED">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="educationDegree" className="text-sm font-medium">
                    Education Degree
                  </Label>
                  <Input
                    id="educationDegree"
                    placeholder="Bachelor's, Master's, PhD, etc."
                    value={formData.educationDegree || ''}
                    onChange={(e) => handleInputChange('educationDegree', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educationField" className="text-sm font-medium">
                    Field of Study
                  </Label>
                  <Input
                    id="educationField"
                    placeholder="Mechanical Engineering, etc."
                    value={formData.educationField || ''}
                    onChange={(e) => handleInputChange('educationField', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educationInstitute" className="text-sm font-medium">
                    Educational Institute
                  </Label>
                  <Input
                    id="educationInstitute"
                    placeholder="University name"
                    value={formData.educationInstitute || ''}
                    onChange={(e) => handleInputChange('educationInstitute', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduationYear" className="text-sm font-medium">
                    Graduation Year
                  </Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    placeholder="2020"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={formData.graduationYear || ''}
                    onChange={(e) => handleInputChange('graduationYear', parseInt(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yearsExperience" className="text-sm font-medium">
                  Years of Experience *
                </Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="5"
                  value={formData.yearsExperience || 0}
                  onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value) || 0)}
                  className={cn("h-9", errors.yearsExperience && "border-destructive")}
                />
                <p className="text-sm text-muted-foreground">
                  Total years of inspection experience (required)
                </p>
                {errors.yearsExperience && (
                  <p className="text-sm text-destructive">{errors.yearsExperience}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousCompanies" className="text-sm font-medium">
                  Previous Companies
                </Label>
                <Textarea
                  id="previousCompanies"
                  placeholder="List previous companies (one per line)"
                  value={formData.previousCompanies?.join('\n') || ''}
                  onChange={(e) => handleInputChange('previousCompanies', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Enter each company on a separate line
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Login Permission */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" />
                Login Permission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canLogin"
                  checked={formData.canLogin || false}
                  onCheckedChange={(checked) => handleInputChange('canLogin', checked as boolean)}
                />
                <Label htmlFor="canLogin" className="text-sm font-medium">
                  Enable Login Access
                </Label>
              </div>
              
              {formData.canLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username *
                    </Label>
                    <Input
                      id="username"
                      placeholder="john.smith"
                      value={formData.username || ''}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={cn("h-9", errors.username && "border-destructive")}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={cn("h-9", errors.password && "border-destructive")}
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum 6 characters
                    </p>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[120px] gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create Inspector
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}