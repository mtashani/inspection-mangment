"use client"

import React, { useState } from 'react'
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
  Plus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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

import { Inspector, InspectorFormData, InspectorType, SpecialtyCode } from '@/types/admin'
import { inspectorFormSchema } from '@/lib/validation/admin'
import { createInspector, updateInspector } from '@/lib/api/admin/inspectors'

interface InspectorFormProps {
  inspector?: Inspector
  onSuccess?: (inspector: Inspector) => void
  onCancel?: () => void
}

const inspectorTypeOptions: { value: InspectorType; label: string; description: string }[] = [
  {
    value: 'mechanical',
    label: 'Mechanical Inspector',
    description: 'Mechanical equipment and systems inspection'
  },
  {
    value: 'corrosion',
    label: 'Corrosion Inspector',
    description: 'Corrosion assessment and monitoring'
  },
  {
    value: 'ndt',
    label: 'NDT Inspector',
    description: 'Non-destructive testing specialist'
  },
  {
    value: 'electrical',
    label: 'Electrical Inspector',
    description: 'Electrical systems and equipment inspection'
  },
  {
    value: 'instrumentation',
    label: 'Instrumentation Inspector',
    description: 'Instrumentation and control systems'
  },
  {
    value: 'civil',
    label: 'Civil Inspector',
    description: 'Civil and structural inspection'
  },
  {
    value: 'general',
    label: 'General Inspector',
    description: 'General purpose inspection'
  },
  {
    value: 'psv_operator',
    label: 'PSV Operator',
    description: 'Pressure safety valve operator'
  },
  {
    value: 'lifting_equipment_operator',
    label: 'Lifting Equipment Operator',
    description: 'Lifting equipment operation and inspection'
  }
]

const departmentOptions = [
  'Mechanical',
  'Electrical',
  'Instrumentation',
  'Civil',
  'NDT',
  'Corrosion',
  'PSV Operations',
  'Lifting Equipment',
  'Quality Control',
  'Safety',
  'Engineering',
  'Maintenance'
]

const specialtyOptions: { value: SpecialtyCode; label: string; description: string }[] = [
  {
    value: 'PSV',
    label: 'PSV (Pressure Safety Valve)',
    description: 'Pressure safety valve inspection and calibration'
  },
  {
    value: 'CRANE',
    label: 'Crane Inspection',
    description: 'Crane and lifting equipment inspection'
  },
  {
    value: 'CORROSION',
    label: 'Corrosion Monitoring',
    description: 'Corrosion assessment and monitoring'
  }
]

export function InspectorForm({ inspector, onSuccess, onCancel }: InspectorFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    inspector?.profileImage || null
  )

  const isEditing = !!inspector

  const form = useForm<InspectorFormData>({
    resolver: zodResolver(inspectorFormSchema),
    defaultValues: {
      firstName: inspector?.firstName || '',
      lastName: inspector?.lastName || '',
      employeeId: inspector?.employeeId || '',
      nationalId: inspector?.nationalId || '',
      email: inspector?.email || '',
      phone: inspector?.phone || '',
      department: inspector?.department || '',
      dateOfBirth: inspector?.dateOfBirth || '',
      birthPlace: inspector?.birthPlace || '',
      maritalStatus: inspector?.maritalStatus || undefined,
      inspectorType: inspector?.inspectorType || 'INTERNAL',
      specialties: inspector?.specialties || [],
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
      onCallMultiplier: inspector?.onCallMultiplier || 2.0,
      notes: inspector?.notes || ''
    }
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be less than 5MB')
        return
      }

      setProfileImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: InspectorFormData) => {
    try {
      setIsSubmitting(true)

      let result: Inspector
      if (isEditing && inspector) {
        result = await updateInspector(inspector.id, data)
        toast.success('Inspector updated successfully')
      } else {
        result = await createInspector(data)
        toast.success('Inspector created successfully')
      }

      onSuccess?.(result)
      
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
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
                    <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                        {profileImagePreview ? (
                          <img
                            src={profileImagePreview}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('profile-image')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                        {profileImagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProfileImageFile(null)
                              setProfileImagePreview(null)
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

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

                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departmentOptions.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Department or division
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inspectorType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inspector Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select inspector type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {inspectorTypeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex flex-col">
                                      <span>{option.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="date" 
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
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className="w-5 h-5" />
                      Inspector Specialties
                    </CardTitle>
                    <CardDescription>
                      Professional specialties and expertise areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="specialties"
                      render={() => (
                        <FormItem>
                          <FormLabel>Specialties *</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {specialtyOptions.map((specialty) => (
                              <FormField
                                key={specialty.value}
                                control={form.control}
                                name="specialties"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={specialty.value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(specialty.value)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, specialty.value])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== specialty.value
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-medium">
                                          {specialty.label}
                                        </FormLabel>
                                        <FormDescription className="text-xs">
                                          {specialty.description}
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormDescription>
                            Select at least one specialty. Inspectors can have multiple specialties.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="w-full mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents
                  </CardTitle>
                  <CardDescription>
                    Upload and manage inspector documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4">
                        <h3 className="text-sm font-medium">Upload Documents</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          ID Card, Qualifications, Training Records, etc.
                        </p>
                      </div>
                      <Button variant="outline" className="mt-4">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Supported formats: PDF, JPG, PNG. Maximum file size: 10MB per file.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="w-full mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className="w-5 h-5" />
                    Professional Certifications
                  </CardTitle>
                  <CardDescription>
                    Manage API 510, API 570, CSWIP, NACE, ASNT and other certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <Badge className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4">
                        <h3 className="text-sm font-medium">Certificate Management</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add certifications: API 510, API 570, API 653, CSWIP, NACE, ASNT, IWI, LEEA
                        </p>
                      </div>
                      <Button variant="outline" className="mt-4" disabled>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Certificate
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Certificate management will be implemented in a future update
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">API Certifications</h4>
                        <ul className="space-y-1">
                          <li>• API 510 - Pressure Vessel Inspector</li>
                          <li>• API 570 - Piping Inspector</li>
                          <li>• API 653 - Above Ground Storage Tank</li>
                          <li>• API 580 - Risk-Based Inspection</li>
                          <li>• API 571 - Corrosion and Materials</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Other Certifications</h4>
                        <ul className="space-y-1">
                          <li>• CSWIP - Welding Inspector</li>
                          <li>• NACE - Corrosion Engineer</li>
                          <li>• ASNT - Non-Destructive Testing</li>
                          <li>• IWI - International Welding Inspector</li>
                          <li>• LEEA - Lifting Equipment Engineer</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Roles & Authorization</CardTitle>
                      <CardDescription>
                        Assign roles for system access control
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <h3 className="text-sm font-medium">Role Management</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Roles control access to PSV calibration, corrosion analysis, and crane inspection features
                          </p>
                        </div>
                        <Button variant="outline" className="mt-4" disabled>
                          <Plus className="w-4 h-4 mr-2" />
                          Assign Roles
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Role management will be implemented in a future update
                        </p>
                      </div>
                    </CardContent>
                  </Card>

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
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
    </div>
  )
}