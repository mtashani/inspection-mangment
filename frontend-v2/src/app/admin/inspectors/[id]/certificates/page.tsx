/**
 * Certificate Management Page
 * Manage inspector certificates with upload, view, and delete functionality
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Upload,
  Download,
  Trash2,
  Eye,
  Plus,
  FileText,
  Calendar,
  Building,
  Hash,
  Info,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { fileUploadAPI, DocumentType } from '@/lib/api/admin/files'
import { getInspectorById } from '@/lib/api/admin/inspectors'
import { Inspector } from '@/types/admin'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// API functions for certificate management
const api = {
  getCertificates: async (inspectorId: number) => {
    return fileUploadAPI.getInspectorDocuments(inspectorId, 'certificate')
  },

  uploadCertificate: async (inspectorId: number, file: File, description?: string, certificateType?: string, certificateNumber?: string, issuingOrganization?: string, issueDate?: string, expiryDate?: string) => {
    return fileUploadAPI.uploadCertificate(inspectorId, file, description, certificateType, certificateNumber, issuingOrganization, issueDate, expiryDate)
  },

  deleteCertificate: async (certificateId: number) => {
    return fileUploadAPI.deleteDocument(certificateId)
  },

  getCertificateTypes: async () => {
    // Return common certificate types
    return [
      "API 510 - Pressure Vessel Inspector",
      "API 570 - Piping Inspector", 
      "API 653 - Tank Inspector",
      "API 580 - Risk Based Inspection",
      "API 571 - Damage Mechanisms",
      "ASNT Level II - Magnetic Particle Testing",
      "ASNT Level II - Liquid Penetrant Testing",
      "ASNT Level II - Radiographic Testing",
      "ASNT Level II - Ultrasonic Testing",
      "ASNT Level II - Visual Testing",
      "ASNT Level III - NDT",
      "NACE Level 1 - Coating Inspector",
      "NACE Level 2 - Coating Inspector",
      "NACE Level 3 - Coating Inspector",
      "AWS Certified Welding Inspector",
      "IRATA Rope Access Technician",
      "Confined Space Entry",
      "First Aid/CPR",
      "Safety Training",
      "Forklift Operation",
      "Crane Operation",
      "Other Professional Certification"
    ]
  },

  getCertificateStats: async (inspectorId: number) => {
    return fileUploadAPI.getCertificateStats(inspectorId)
  },

  downloadCertificate: async (certificateId: number) => {
    // Open download URL in new tab
    const url = fileUploadAPI.getDownloadUrl(certificateId, 'certificate')
    window.open(url, '_blank')
    return new Blob()
  },

  previewCertificate: async (certificateId: number) => {
    // Open preview URL in new tab
    const url = fileUploadAPI.getPreviewUrl(certificateId, 'certificate')
    window.open(url, '_blank')
  }
}

interface Certificate {
  id: number
  inspector_id: number
  document_type: string
  filename: string
  original_filename: string
  file_size: number
  file_size_mb: number
  mime_type: string | null
  upload_date: string
  description: string | null
  download_url: string
  exists: boolean
}

interface CertificateStats {
  inspector_id: number
  total_certificates: number
  total_size_bytes: number
  total_size_mb: number
  document_types: { [key: string]: number }
  file_types: { [key: string]: number }
  average_file_size_mb: number
}

export default function CertificateManagementPage() {
  const router = useRouter()
  const params = useParams()
  const inspectorId = params.id as string

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [stats, setStats] = useState<CertificateStats | null>(null)
  const [certificateTypes, setCertificateTypes] = useState<string[]>([])
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedType, setSelectedType] = useState<string>('all')

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin Panel', href: '/admin' },
    { label: 'Inspectors', href: '/admin/inspectors' },
    { label: inspector?.name || `Inspector #${inspectorId}`, href: `/admin/inspectors/${inspectorId}` },
    { label: 'Certificates', href: `/admin/inspectors/${inspectorId}/certificates`, isActive: true }
  ]
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    certificate_type: '',
    certificate_number: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: ''
  })

  // Add missing upload dialog state
  const [uploadDialog, setUploadDialog] = useState(false)

  useEffect(() => {
    if (!inspectorId) {
      toast.error('Inspector ID is required')
      router.push('/admin/inspectors')
      return
    }

    const fetchInspector = async () => {
      try {
        const data = await getInspectorById(Number(inspectorId))
        setInspector(data)
      } catch (err) {
        console.error('Error fetching inspector:', err)
        toast.error('Failed to load inspector data')
      }
    }

    fetchInspector()
    loadData()
  }, [inspectorId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Use React Query or implement basic caching for better performance
      const certsData = await api.getCertificates(Number(inspectorId))
      const typesData = await api.getCertificateTypes()
      const statsData = await api.getCertificateStats(Number(inspectorId)).catch(() => null)

      setCertificates(certsData)
      setCertificateTypes(typesData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load certificate data:', error)
      toast.error('Failed to load certificate data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and image files are allowed')
        return
      }

      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error('Please select a file')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await api.uploadCertificate(
        Number(inspectorId!),
        uploadForm.file,
        uploadForm.description,
        uploadForm.certificate_type,
        uploadForm.certificate_number,
        uploadForm.issuing_organization,
        uploadForm.issue_date,
        uploadForm.expiry_date
      )
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success('Certificate uploaded successfully')
      setUploadDialog(false)
      setUploadForm({
        file: null,
        description: '',
        certificate_type: '',
        certificate_number: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: ''
      })
      
      await loadData()
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload certificate')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (certificateId: number) => {
    try {
      await api.deleteCertificate(certificateId)
      toast.success('Certificate deleted successfully')
      await loadData()
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete certificate')
    }
  }

  const handleDownload = async (certificate: Certificate) => {
    try {
      const blob = await api.downloadCertificate(certificate.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = certificate.original_filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Certificate downloaded')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download certificate')
    }
  }

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || cert.mime_type === selectedType
    return matchesSearch && matchesType
  })

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="text-muted-foreground">
            Manage certificates for {inspector?.name || `Inspector #${inspectorId}`}
          </p>
        </div>
        
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Certificate</DialogTitle>
              <DialogDescription>
                Upload a new certificate for this inspector
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Certificate File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                {uploadForm.file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="certificate_type">Certificate Type</Label>
                <Select
                  value={uploadForm.certificate_type}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, certificate_type: value }))}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certificate type" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificateTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="certificate_number">Certificate Number</Label>
                  <Input
                    id="certificate_number"
                    placeholder="e.g., API-12345"
                    value={uploadForm.certificate_number}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, certificate_number: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issuing_organization">Issuing Organization</Label>
                  <Input
                    id="issuing_organization"
                    placeholder="e.g., API"
                    value={uploadForm.issuing_organization}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, issuing_organization: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={uploadForm.issue_date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={uploadForm.expiry_date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes about this certificate"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={isUploading}
                />
              </div>

              {isUploading && (
                <div className="grid gap-2">
                  <Label>Upload Progress</Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {uploadProgress}% complete
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadDialog(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadForm.file || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Certificate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_certificates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_size_mb} MB</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Size</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_file_size_mb} MB</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">File Types</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.file_types).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="application/pdf">PDF Files</SelectItem>
            <SelectItem value="image/jpeg">JPEG Images</SelectItem>
            <SelectItem value="image/png">PNG Images</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Certificates Grid/List */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Certificates Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedType !== 'all' 
                ? 'No certificates match your search criteria.'
                : 'This inspector has no certificates uploaded yet.'
              }
            </p>
            {!searchTerm && selectedType === 'all' && (
              <Button onClick={() => setUploadDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Certificate
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredCertificates.map((certificate) => (
            <Card key={certificate.id} className={viewMode === 'list' ? 'p-4' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {certificate.original_filename}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {formatDate(certificate.upload_date)} • {formatFileSize(certificate.file_size)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {certificate.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {certificate.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {certificate.description}
                  </p>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => api.previewCertificate(certificate.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(certificate)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Certificate</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{certificate.original_filename}"? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(certificate.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
