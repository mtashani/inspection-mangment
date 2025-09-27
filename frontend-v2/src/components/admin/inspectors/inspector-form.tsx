"use client"
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Badge, 
  Settings, 
  FileText,
  Upload,
  Save,
  X,
  Loader2,
  Plus,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ProfileImageUpload } from '@/components/ui/profile-image-upload'
import { FileUpload } from '@/components/ui/file-upload'
import { DocumentManager } from '@/components/ui/document-manager'
import { InspectorRoleManagement } from './inspector-role-management'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Inspector, InspectorFormData } from '@/types/admin'
import { inspectorFormSchema } from '@/lib/validation/admin'
import { createInspector, updateInspector } from '@/lib/api/admin/inspectors'
import { fileUploadAPI, DocumentType, type DocumentInfo } from '@/lib/api/admin/files'
import { JalaliDatePicker } from '@/components/ui/dual-calendar-date-picker'

interface InspectorFormProps {
  inspector?: Inspector
  onSuccess?: (inspector: Inspector) => void
  onCancel?: () => void
}



export function InspectorForm({ inspector, onSuccess, onCancel }: InspectorFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImageUploaded, setProfileImageUploaded] = useState<DocumentInfo | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(inspector?.profileImageUrl || null)
  const [documentRefreshTrigger, setDocumentRefreshTrigger] = useState(0)
  const [certificateRefreshTrigger, setCertificateRefreshTrigger] = useState(0)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [createdInspector, setCreatedInspector] = useState<Inspector | null>(null)

  const isEditing = !!inspector
  const inspectorName = inspector ? `${inspector.firstName} ${inspector.lastName}` : 'New Inspector'

  // Initialize profile image URL from existing inspector data
  useEffect(() => {
    if (inspector?.profileImageUrl && !profileImageUrl) {
      setProfileImageUrl(inspector.profileImageUrl)
    }
  }, [inspector?.profileImageUrl, profileImageUrl])

  const form = useForm<InspectorFormData>({
    resolver: zodResolver(inspectorFormSchema),
    defaultValues: {
      firstName: inspector?.firstName || '',
      lastName: inspector?.lastName || '',
      employeeId: inspector?.employeeId || '',
      nationalId: inspector?.nationalId || '',
      email: inspector?.email || '',
      phone: inspector?.phone || '',
      dateOfBirth: inspector?.dateOfBirth || '',
      birthPlace: inspector?.birthPlace || '',
      maritalStatus: inspector?.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | undefined,
      // specialties field removed - no longer used
      // Education
      educationDegree: inspector?.educationDegree || '',
      educationField: inspector?.educationField || '',
      educationInstitute: inspector?.educationInstitute || '',
      graduationYear: inspector?.graduationYear || undefined,
      // Experience
      yearsExperience: inspector?.yearsExperience || 0,
      previousCompanies: inspector?.previousCompanies || [],
      // Status and authentication
      active: inspector?.active ?? true,
      username: inspector?.username || '',
      password: '',
      canLogin: inspector?.canLogin ?? false,
      attendanceTrackingEnabled: inspector?.attendanceTrackingEnabled ?? false,
      workCycleStartDate: '',
      workCycleType: 'full_time',
      // Payroll
      baseHourlyRate: inspector?.baseHourlyRate || undefined,
      overtimeMultiplier: inspector?.overtimeMultiplier || 1.5,
      nightShiftMultiplier: inspector?.nightShiftMultiplier || 1.3,
      onCallMultiplier: inspector?.onCallMultiplier || 2.0
    }
  })

  // Handle profile image upload completion
  const handleProfileImageUpload = (document: DocumentInfo) => {
    setProfileImageUploaded(document)
    setProfileImageUrl(document.download_url) // Update URL for immediate display
    toast.success('Profile image uploaded successfully')
  }

  // Handle document upload completion
  const handleDocumentUpload = (documents: DocumentInfo[]) => {
    setDocumentRefreshTrigger(prev => prev + 1)
    toast.success(`${documents.length} document(s) uploaded successfully`)
  }

  // Handle document deletion
  const handleDocumentDeleted = (document: DocumentInfo) => {
    setDocumentRefreshTrigger(prev => prev + 1)
    toast.success('Document deleted successfully')
  }

  // Refresh documents
  const handleDocumentRefresh = () => {
    setDocumentRefreshTrigger(prev => prev + 1)
  }

  // Handle certificate upload completion
  const handleCertificateUpload = (documents: DocumentInfo[]) => {
    setCertificateRefreshTrigger(prev => prev + 1)
    toast.success(`${documents.length} certificate(s) uploaded successfully`)
  }

  // Handle certificate deletion
  const handleCertificateDeleted = (document: DocumentInfo) => {
    setCertificateRefreshTrigger(prev => prev + 1)
    toast.success('Certificate deleted successfully')
  }

  // Refresh certificates
  const handleCertificateRefresh = () => {
    setCertificateRefreshTrigger(prev => prev + 1)
  }

  const onSubmit = async (data: InspectorFormData) => {
    try {
      setIsSubmitting(true)

      let result: Inspector
      if (isEditing && inspector) {
        result = await updateInspector(inspector.id, data)
        toast.success('Inspector updated successfully')
        onSuccess?.(result)
      } else {
        result = await createInspector(data)
        toast.success('Inspector created successfully')
        
        // For new inspectors, show role assignment modal
        setCreatedInspector(result)
        setShowRoleModal(true)
        return // Don't navigate away yet
      }
      
      if (!onSuccess) {
        router.push('/admin/inspectors')
      }
    } catch (error) {
      console.error('Error saving inspector:', error)
      toast.error(
        isEditing 
          ? 'Failed to update inspector. Please try again.' 
          : 'Failed to create inspector. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  const handleRoleModalComplete = () => {
    setShowRoleModal(false)
    if (createdInspector) {
      onSuccess?.(createdInspector)
      if (!onSuccess) {
        router.push('/admin/inspectors')
      }
    }
  }

  const handleSkipRoles = () => {
    setShowRoleModal(false)
    if (createdInspector) {
      onSuccess?.(createdInspector)
      if (!onSuccess) {
        router.push('/admin/inspectors')
      }
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="documents" disabled={!inspector?.id}>
                Documents {!inspector?.id && '(Save First)'}
              </TabsTrigger>
              <TabsTrigger value="certificates" disabled={!inspector?.id}>
                Certificates {!inspector?.id && '(Save First)'}
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="w-full mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Basic personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image Upload */}
                  <div className="flex items-start gap-6">
                    <ProfileImageUpload
                      inspectorId={inspector?.id}
                      currentImageUrl={profileImageUrl || inspector?.profileImageUrl}
                      inspectorName={inspectorName}
                      size="lg"
                      onUploadComplete={handleProfileImageUpload}
                      onUploadError={(error) => toast.error(error)}
                      allowEdit={true}
                    />

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="EMP-001" {...field} />
                            </FormControl>
                            <FormDescription>
                              Unique identifier for the inspector
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>National ID *</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890" maxLength={10} {...field} />
                            </FormControl>
                            <FormDescription>
                              10-digit Iranian national ID
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="inspector@company.com" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="+98 912 345 6789" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Iranian phone number format
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <JalaliDatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              onDateChange={(date) => {
                                field.onChange(date ? date.toISOString().split('T')[0] : undefined)
                              }}
                              placeholder="انتخاب تاریخ تولد"
                              disableFuture={true}
                              showBothCalendars={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birthPlace"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Place</FormLabel>
                          <FormControl>
                            <Input placeholder="Tehran" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select marital status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SINGLE">Single</SelectItem>
                              <SelectItem value="MARRIED">Married</SelectItem>
                              <SelectItem value="DIVORCED">Divorced</SelectItem>
                              <SelectItem value="WIDOWED">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education" className="w-full mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Educational Background
                  </CardTitle>
                  <CardDescription>
                    Inspector's educational qualifications and academic history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="educationDegree"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education Degree</FormLabel>
                          <FormControl>
                            <Input placeholder="Bachelor's, Master's, PhD, etc." {...field} />
                          </FormControl>
                          <FormDescription>
                            Highest education level achieved
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="educationField"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field of Study</FormLabel>
                          <FormControl>
                            <Input placeholder="Mechanical Engineering, etc." {...field} />
                          </FormControl>
                          <FormDescription>
                            Major or field of specialization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="educationInstitute"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Educational Institute</FormLabel>
                          <FormControl>
                            <Input placeholder="University name" {...field} />
                          </FormControl>
                          <FormDescription>
                            Name of the university or institution
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="graduationYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduation Year</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2020"
                              min="1950"
                              max={new Date().getFullYear()}
                              {...field}
                              value={field.value?.toString() || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value ? parseInt(value, 10) : undefined)
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Year of graduation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="w-full mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className="w-5 h-5" />
                      Professional Experience
                    </CardTitle>
                    <CardDescription>
                      Work experience and professional background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5"
                              min="0"
                              max="50"
                              {...field}
                              value={field.value?.toString() || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value ? parseInt(value, 10) : 0)
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Total years of professional experience in inspection
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previousCompanies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Companies</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List previous companies (one per line)&#10;Company A&#10;Company B&#10;Company C"
                              className="min-h-[100px]"
                              {...field}
                              onChange={(e) => {
                                const companies = e.target.value.split('\n').filter(c => c.trim())
                                field.onChange(companies)
                              }}
                              value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter each company name on a separate line
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Inspector Specialties section removed - no longer required */}
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="w-full mt-6">
              <div className="space-y-6">
                {/* Document Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload Documents
                    </CardTitle>
                    <CardDescription>
                      Upload inspector documents such as ID cards, qualifications, training records, and other relevant files
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inspector?.id ? (
                      <FileUpload
                        inspectorId={inspector.id}
                        documentType={DocumentType.Other}
                        multiple={true}
                        maxFiles={10}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onUploadComplete={handleDocumentUpload}
                        onUploadError={(error) => toast.error(error)}
                        className="w-full"
                      />
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          Save Inspector First
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Please save the inspector's basic information before uploading documents.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Document Management Section */}
                {inspector?.id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Document Management
                      </CardTitle>
                      <CardDescription>
                        View, download, and manage uploaded documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DocumentManager
                        key={documentRefreshTrigger} // Force refresh when documents change
                        inspectorId={inspector.id}
                        allowDelete={true}
                        allowDownload={true}
                        viewMode="grid"
                        onDocumentDeleted={handleDocumentDeleted}
                        onRefresh={handleDocumentRefresh}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Document Type Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Document Categories</CardTitle>
                    <CardDescription>
                      Organize your documents by category for better management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-foreground mb-2">Identity Documents</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• National ID Card</li>
                          <li>• Passport</li>
                          <li>• Birth Certificate</li>
                          <li>• Military Service Record</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-foreground mb-2">Qualifications</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Educational Certificates</li>
                          <li>• Professional Licenses</li>
                          <li>• Training Certificates</li>
                          <li>• Work Experience Letters</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-foreground mb-2">Other Documents</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Medical Records</li>
                          <li>• Insurance Documents</li>
                          <li>• Bank Information</li>
                          <li>• Contract Documents</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="w-full mt-6">
              <div className="space-y-6">
                {/* Certificate Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Upload Certificates
                    </CardTitle>
                    <CardDescription>
                      Upload professional certifications such as API 510, API 570, CSWIP, NACE, ASNT and other inspection certifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inspector?.id ? (
                      <FileUpload
                        inspectorId={inspector.id}
                        documentType={DocumentType.Certificate}
                        multiple={true}
                        maxFiles={10}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onUploadComplete={handleCertificateUpload}
                        onUploadError={(error) => toast.error(error)}
                        className="w-full"
                      />
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          Save Inspector First
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Please save the inspector's basic information before uploading certificates.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Certificate Management Section */}
                {inspector?.id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className="w-5 h-5" />
                        Certificate Management
                      </CardTitle>
                      <CardDescription>
                        View, download, and manage uploaded certificates with expiry tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DocumentManager
                        key={`certificates-${certificateRefreshTrigger}`} // Force refresh when certificates change
                        inspectorId={inspector.id}
                        documentType={DocumentType.Certificate}
                        allowDelete={true}
                        allowDownload={true}
                        viewMode="grid"
                        onDocumentDeleted={handleCertificateDeleted}
                        onRefresh={handleCertificateRefresh}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Certificate Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Certification Guidelines
                    </CardTitle>
                    <CardDescription>
                      Important information about professional certifications and requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Expiry Alert */}
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Please ensure all certificates are valid and not expired. 
                          Upload clear, high-quality scans or photos of your certificates for verification.
                        </AlertDescription>
                      </Alert>

                      {/* Certificate Categories */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <Badge className="w-4 h-4" />
                            API Certifications
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• API 510 - Pressure Vessel Inspector</li>
                            <li>• API 570 - Piping Inspector</li>
                            <li>• API 653 - Above Ground Storage Tank</li>
                            <li>• API 580 - Risk-Based Inspection</li>
                            <li>• API 571 - Corrosion and Materials</li>
                          </ul>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Welding & NDT
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• CSWIP - Welding Inspector</li>
                            <li>• IWI - International Welding Inspector</li>
                            <li>• ASNT - Non-Destructive Testing</li>
                            <li>• PCN - Personnel Certification in NDT</li>
                            <li>• AWS - American Welding Society</li>
                          </ul>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Other Specializations
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• NACE - Corrosion Engineer</li>
                            <li>• LEEA - Lifting Equipment Engineer</li>
                            <li>• NEBOSH - Safety Certification</li>
                            <li>• IOSH - Occupational Safety</li>
                            <li>• ISO Lead Auditor</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Certificate Validity Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Certificate Validity & Renewal
                    </CardTitle>
                    <CardDescription>
                      Track certificate expiry dates and renewal requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Valid Certificates
                          </h4>
                          <p className="text-sm text-green-700">
                            Certificates that are currently valid and accepted for inspection work.
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Expiring Soon
                          </h4>
                          <p className="text-sm text-yellow-700">
                            Certificates expiring within 60 days. Plan renewal to avoid interruption.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">Renewal Reminders</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• API certifications: Renewed every 3 years with required training</li>
                          <li>• CSWIP certifications: Renewed every 5 years with reassessment</li>
                          <li>• NACE certifications: Renewed every 5 years with continuing education</li>
                          <li>• ASNT certifications: Renewed every 5 years with requalification</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="w-full mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Access & Permissions
                    </CardTitle>
                    <CardDescription>
                      Configure inspector access and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Access controls */}
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <FormDescription>
                              Whether the inspector is currently employed
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canLogin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Login Permission</FormLabel>
                            <FormDescription>
                              Allow this inspector to log into the system
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch('canLogin') && (
                      <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                        <h4 className="text-sm font-medium">Login Credentials</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username *</FormLabel>
                                <FormControl>
                                  <Input placeholder="john.doe" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Login username (required when login is enabled)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Enter password" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Password for login (required when login is enabled)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="attendanceTrackingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Attendance Tracking</FormLabel>
                            <FormDescription>
                              Enable attendance tracking for this inspector
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch('attendanceTrackingEnabled') && (
                      <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                        <h4 className="text-sm font-medium">Work Cycle Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="workCycleStartDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Cycle Start Date *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      type="date" 
                                      className="pl-10"
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Start date for the inspector's work cycle
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="workCycleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Schedule Type *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select work schedule" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="full_time">Full Time</SelectItem>
                                    <SelectItem value="part_time">Part Time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                    <SelectItem value="fourteen_fourteen">14/14 Rotation</SelectItem>
                                    <SelectItem value="seven_seven">7/7 Rotation</SelectItem>
                                    <SelectItem value="office">Office Based</SelectItem>
                                    <SelectItem value="guest">Guest</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Type of work schedule for attendance tracking
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {/* Role assignment removed from form - will be handled in post-creation modal */}
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Payroll Settings</CardTitle>
                      <CardDescription>
                        Configure payroll and compensation settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="baseHourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Hourly Rate</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="45.00"
                                {...field}
                                value={field.value?.toString() || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  field.onChange(value ? parseFloat(value) : undefined)
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Base hourly rate in local currency
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="overtimeMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Overtime Multiplier</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="5"
                                  placeholder="1.5"
                                  {...field}
                                  value={field.value?.toString() || ''}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    field.onChange(value ? parseFloat(value) : undefined)
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Overtime rate multiplier
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="nightShiftMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Night Shift Multiplier</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="5"
                                  placeholder="1.3"
                                  {...field}
                                  value={field.value?.toString() || ''}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    field.onChange(value ? parseFloat(value) : undefined)
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Night shift rate multiplier
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="onCallMultiplier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>On-Call Multiplier</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="5"
                                  placeholder="2.0"
                                  {...field}
                                  value={field.value?.toString() || ''}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    field.onChange(value ? parseFloat(value) : undefined)
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                On-call rate multiplier
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Inspector' : 'Create Inspector'}
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Role Assignment Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Assign Roles to {createdInspector ? `${createdInspector.firstName} ${createdInspector.lastName}` : 'Inspector'}
            </DialogTitle>
            <DialogDescription>
              The inspector has been created successfully. You can now assign roles to control their system access.
            </DialogDescription>
          </DialogHeader>
          
          {createdInspector && (
            <InspectorRoleManagement
              inspectorId={createdInspector.id}
              inspectorName={`${createdInspector.firstName} ${createdInspector.lastName}`}
              onRolesChanged={(roles) => {
                console.log('Roles updated:', roles)
              }}
              className="w-full"
            />
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleSkipRoles}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleRoleModalComplete}
            >
              Complete Setup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}