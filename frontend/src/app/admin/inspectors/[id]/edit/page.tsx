'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useInspectors } from '@/contexts/inspectors-context'
import { AdminOnly, AccessDenied } from '@/components/auth/permission-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, User, Mail, Phone, Building, Calendar, Shield } from 'lucide-react'
import { Inspector, SpecialtyCode } from '@/types/inspector'
import { toast } from 'sonner'

interface EditInspectorPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditInspectorPage({ params }: EditInspectorPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { inspectors, loading } = useInspectors()
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    email: '',
    phone: '',
    department: '',
    inspector_type: '',
    years_experience: 0,
    date_of_birth: '',
    active: true,
    can_login: false,
    available: true,
    specialties: {
      PSV: false,
      CRANE: false,
      CORROSION: false
    }
  })

  useEffect(() => {
    if (inspectors && resolvedParams.id) {
      const foundInspector = inspectors.find(i => i.id.toString() === resolvedParams.id)
      if (foundInspector) {
        setInspector(foundInspector)
        
        // Populate form with inspector data
        setFormData({
          name: foundInspector.name || '',
          employee_id: foundInspector.employee_id || '',
          email: foundInspector.email || '',
          phone: foundInspector.phone || '',
          department: foundInspector.department || '',
          inspector_type: foundInspector.inspector_type || '',
          years_experience: foundInspector.years_experience || 0,
          date_of_birth: foundInspector.date_of_birth || '',
          active: foundInspector.active,
          can_login: foundInspector.can_login,
          available: foundInspector.available,
          specialties: {
            PSV: foundInspector.specialties?.includes('PSV') || false,
            CRANE: foundInspector.specialties?.includes('CRANE') || false,
            CORROSION: foundInspector.specialties?.includes('CORROSION') || false
          }
        })
      }
    }
  }, [inspectors, resolvedParams.id])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSpecialtyChange = (specialty: SpecialtyCode, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialties: {
        ...prev.specialties,
        [specialty]: checked
      }
    }))
  }

  const handleSave = async () => {
    if (!inspector) return

    // Basic validation
    if (!formData.name.trim() || !formData.employee_id.trim() || !formData.email.trim()) {
      toast.error('لطفاً فیلدهای اجباری را پر کنید')
      return
    }

    setSaving(true)

    try {
      // TODO: API call to update inspector
      console.log('Updating inspector:', {
        id: inspector.id,
        ...formData,
        specialties: Object.entries(formData.specialties)
          .filter(([_, checked]) => checked)
          .map(([specialty, _]) => specialty as SpecialtyCode)
      })

      toast.success('اطلاعات بازرس با موفقیت به‌روزرسانی شد')
      router.push(`/admin/inspectors/${inspector.id}`)

    } catch (error) {
      console.error('Error updating inspector:', error)
      toast.error('خطا در به‌روزرسانی اطلاعات')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/inspectors/${resolvedParams.id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!inspector) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Inspector Not Found
            </h3>
            <p className="text-gray-500 mb-4">
              The inspector with ID {resolvedParams.id} could not be found.
            </p>
            <Button onClick={() => router.push('/admin/inspectors')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Inspectors
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AdminOnly fallback={<AccessDenied />}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Inspector</h1>
              <p className="text-gray-600">Update {inspector.name}&apos;s information</p>
            </div>
          </div>
          
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  placeholder="Enter employee ID"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Enter department"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="mt-1"
                />
              </div>
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
              <div>
                <Label htmlFor="inspector_type">Inspector Type</Label>
                <Select
                  value={formData.inspector_type}
                  onValueChange={(value) => handleInputChange('inspector_type', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select inspector type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Senior Inspector">Senior Inspector</SelectItem>
                    <SelectItem value="Junior Inspector">Junior Inspector</SelectItem>
                    <SelectItem value="Lead Inspector">Lead Inspector</SelectItem>
                    <SelectItem value="Specialist">Specialist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years_experience}
                  onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              {/* Specialties */}
              <div>
                <Label className="text-sm font-medium">Specialties</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="psv"
                      checked={formData.specialties.PSV}
                      onCheckedChange={(checked) => handleSpecialtyChange('PSV', checked as boolean)}
                    />
                    <label htmlFor="psv" className="text-sm font-medium leading-none">
                      PSV Access (Calibration + Excel)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="crane"
                      checked={formData.specialties.CRANE}
                      onCheckedChange={(checked) => handleSpecialtyChange('CRANE', checked as boolean)}
                    />
                    <label htmlFor="crane" className="text-sm font-medium leading-none">
                      Crane Access (Inspection + Excel)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="corrosion"
                      checked={formData.specialties.CORROSION}
                      onCheckedChange={(checked) => handleSpecialtyChange('CORROSION', checked as boolean)}
                    />
                    <label htmlFor="corrosion" className="text-sm font-medium leading-none">
                      Corrosion Access (Analysis + Excel)
                    </label>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Account Settings</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleInputChange('active', checked as boolean)}
                    />
                    <label htmlFor="active" className="text-sm font-medium leading-none">
                      Active Account
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_login"
                      checked={formData.can_login}
                      onCheckedChange={(checked) => handleInputChange('can_login', checked as boolean)}
                    />
                    <label htmlFor="can_login" className="text-sm font-medium leading-none">
                      Can Login to System
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) => handleInputChange('available', checked as boolean)}
                    />
                    <label htmlFor="available" className="text-sm font-medium leading-none">
                      Available for Assignment
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents & Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                Documents & Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Upload Documents</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF, DOC, DOCX, or images up to 10MB</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,image/*"
                      className="hidden"
                      id="documents"
                    />
                    <label htmlFor="documents" className="cursor-pointer">
                      <Button type="button" variant="outline" className="mt-2">
                        Choose Files
                      </Button>
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Current Documents</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">Inspector_Certificate.pdf</span>
                      <Button size="sm" variant="ghost" className="text-red-600">Remove</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">Training_Record.docx</span>
                      <Button size="sm" variant="ghost" className="text-red-600">Remove</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes about this inspector..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminOnly>
  )
}