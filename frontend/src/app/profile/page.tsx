'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ChangePassword } from '@/components/profile/change-password'
import { FileUpload } from '@/components/ui/file-upload'
import { 
  User, 
  Mail, 
  IdCard, 
  Calendar, 
  Shield, 
  Award, 
  Edit, 
  Save, 
  X, 
  Upload,
  Phone,
  Building,
  FileText,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { inspector } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'password'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state for editing
  const [formData, setFormData] = useState({
    name: inspector?.name || '',
    email: inspector?.email || '',
    phone: inspector?.phone || '',
    department: inspector?.department || '',
    address: '',
    bio: '',
    emergency_contact: '',
    emergency_phone: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: API call to update profile
      console.log('Updating profile:', formData)
      toast.success('اطلاعات پروفایل با موفقیت به‌روزرسانی شد')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('خطا در به‌روزرسانی اطلاعات')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: inspector?.name || '',
      email: inspector?.email || '',
      phone: inspector?.phone || '',
      department: inspector?.department || '',
      address: '',
      bio: '',
      emergency_contact: '',
      emergency_phone: ''
    })
    setIsEditing(false)
  }

  const handleFileUpload = (files: File[]) => {
    console.log('Uploading files:', files)
    // TODO: API call to upload files
    toast.success(`${files.length} فایل برای آپلود انتخاب شد`)
  }

  if (!inspector) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
          </div>
          
          {activeTab === 'profile' && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm border">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-md transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-3 px-4 rounded-md transition-colors ${
              activeTab === 'documents'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Documents & Files
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 px-4 rounded-md transition-colors ${
              activeTab === 'password'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Security
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {inspector.profile_image_url ? (
                    <img
                      src={inspector.profile_image_url}
                      alt={inspector.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <Button variant="outline" onClick={() => alert('Profile picture upload coming soon')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Change Picture
                </Button>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Full Name</p>
                        <p className="text-gray-900">{inspector.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-gray-900">{inspector.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-gray-900">{inspector.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Building className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Department</p>
                        <p className="text-gray-900">{inspector.department || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <IdCard className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Employee ID</p>
                        <p className="text-gray-900">{inspector.employee_id}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Award className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {inspector.specialties && inspector.specialties.length > 0 ? (
                        inspector.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {specialty}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No specialties assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {inspector.roles && inspector.roles.length > 0 ? (
                        inspector.roles.map((role, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {typeof role === 'string' ? role : role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No roles assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={inspector.active ? "default" : "destructive"}>
                        {inspector.active ? "Active" : "Inactive"}
                      </Badge>
                      {inspector.can_login && (
                        <Badge variant="outline">Login Access</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documents & Certificates
                </CardTitle>
                <CardDescription>
                  Upload and manage your professional documents, certificates, and files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                  multiple={true}
                  maxSize={10}
                  maxFiles={10}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="max-w-2xl">
            <ChangePassword />
          </div>
        )}
      </div>
    </div>
  )
}