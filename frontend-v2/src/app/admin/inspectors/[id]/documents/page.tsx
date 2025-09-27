/**
 * Document Management Page
 * Manage inspector documents with upload, view, and delete functionality
 * Excludes certificates which have their own dedicated management page
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
  List,
  User,
  CreditCard,
  GraduationCap,
  BookOpen,
  Folder
} from 'lucide-react'
import { fileUploadAPI, DocumentType } from '@/lib/api/admin/files'
import { authService } from '@/lib/auth'
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
import { EnhancedDocumentDeleteDialog } from '@/components/admin/inspectors/enhanced-document-delete-dialog'

// API functions for document management
const api = {
  getDocuments: async (inspectorId: number) => {
    return fileUploadAPI.getInspectorDocuments(inspectorId)
  },

  uploadDocument: async (inspectorId: number, documentType: string, file: File, description?: string) => {
    return fileUploadAPI.uploadDocument(inspectorId, documentType, file, description)
  },

  deleteDocument: async (documentId: number) => {
    return fileUploadAPI.deleteDocument(documentId)
  },

  getDocumentTypes: async () => {
    return fileUploadAPI.getDocumentTypes()
  },

  getDocumentStats: async (inspectorId: number) => {
    // Placeholder for document stats - would typically come from backend API
    return {
      inspector_id: inspectorId,
      total_documents: 0,
      total_size_bytes: 0,
      total_size_mb: 0,
      document_types: {},
      file_types: {},
      average_file_size_mb: 0
    }
  },

  downloadDocument: async (documentId: number) => {
    console.log('downloadDocument called for ID:', documentId);
    // Fetch as blob for proper download handling
    const url = `/api/v1${fileUploadAPI.getDownloadUrl(documentId)}`;
    const token = authService.getToken() || localStorage.getItem('token');
    console.log('Download Debug:', { url, token: token ? 'present' : 'null', documentId });
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    console.log('Download Response:', { status: response.status, ok: response.ok });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    const blob = await response.blob();
    return blob;
  }
}

interface Document {
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

interface DocumentTypeOption {
  value: string
  label: string
  description: string
}

interface DocumentStats {
  inspector_id: number
  total_documents: number
  total_size_bytes: number
  total_size_mb: number
  document_types: { [key: string]: number }
  file_types: { [key: string]: number }
  average_file_size_mb: number
}

// Document type icons mapping
const getDocumentTypeIcon = (type: string) => {
  switch (type) {
    case 'profile_image':
      return <User className="w-4 h-4" />
    case 'id_card':
      return <CreditCard className="w-4 h-4" />
    case 'qualification':
      return <GraduationCap className="w-4 h-4" />
    case 'training_record':
      return <BookOpen className="w-4 h-4" />
    default:
      return <Folder className="w-4 h-4" />
  }
}

export default function DocumentManagementPage() {
  const router = useRouter()
  const params = useParams()
  const inspectorId = params.id as string

  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeOption[]>([])
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin Panel', href: '/admin' },
    { label: 'Inspectors', href: '/admin/inspectors' },
    { label: inspector?.name || `Inspector #${inspectorId}`, href: `/admin/inspectors/${inspectorId}` },
    { label: 'Documents', href: `/admin/inspectors/${inspectorId}/documents`, isActive: true }
  ]

  // Upload form state
  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    description: '',
    document_type: ''
  })

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
      // Sequential loading to reduce concurrent API calls and improve performance
      const [docsData, typesData, statsData] = await Promise.all([
        api.getDocuments(Number(inspectorId)),
        api.getDocumentTypes(),
        api.getDocumentStats(Number(inspectorId)).catch(() => null)
      ])

      setDocuments(docsData)
      console.log('Fetched Documents Debug:', docsData.map(d => ({ id: d.id, mime_type: d.mime_type, original_filename: d.original_filename, download_url: d.download_url, previewUrl: `/api/v1/inspectors/documents/${d.id}/preview` })));
      setDocumentTypes(typesData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load document data:', error)
      toast.error('Failed to load document data')
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

      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.document_type) {
      toast.error('Please select a file and document type')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const result = await api.uploadDocument(
        Number(inspectorId!),
        uploadForm.document_type,
        uploadForm.file,
        uploadForm.description
      )
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success('Document uploaded successfully')
      setUploadDialog(false)
      setUploadForm({
        file: null,
        description: '',
        document_type: ''
      })
      
      await loadData()
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload document')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (documentId: number) => {
    try {
      await api.deleteDocument(documentId)
      toast.success('Document deleted successfully')
      await loadData()
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return
    setIsDeleting(true)
    await handleDelete(selectedDocument.id)
    setDeleteDialogOpen(false)
    setSelectedDocument(null)
    setIsDeleting(false)
  }

  const handleDownload = async (doc: Document) => {
    console.log('handleDownload called for document ID:', doc.id, 'filename:', doc.original_filename);
    try {
      const blob = await api.downloadDocument(doc.id)
      if (blob.size === 0) {
        throw new Error('Empty file received');
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = doc.original_filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Document downloaded')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download document')
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || doc.document_type === selectedType
    return matchesSearch && matchesType
  })

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type)
    return docType?.label || type
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
            <h1 className="text-3xl font-bold">Document Management</h1>
            <p className="text-muted-foreground">
              Manage documents for {inspector?.name || `Inspector #${inspectorId}`} (Certificates managed separately)
            </p>
          </div>
          
          <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Upload a new document for this inspector
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">Document File</Label>
                  <Input
                    id="file"
                    type="file"
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
                  <Label htmlFor="document_type">Document Type</Label>
                  <Select
                    value={uploadForm.document_type}
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, document_type: value }))}
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {getDocumentTypeIcon(type.value)}
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional notes about this document"
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
                  disabled={!uploadForm.file || !uploadForm.document_type || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Document'}
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
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_documents}</div>
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
                <CardTitle className="text-sm font-medium">Document Types</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats.document_types).length}</div>
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
                placeholder="Search documents..."
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
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {getDocumentTypeIcon(type.value)}
                    {type.label}
                  </div>
                </SelectItem>
              ))}
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

        {/* Documents Grid/List */}
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || selectedType !== 'all' 
                  ? 'No documents match your search criteria.'
                  : 'This inspector has no documents uploaded yet.'
                }
              </p>
              {!searchTerm && selectedType === 'all' && (
                <Button onClick={() => setUploadDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredDocuments.map((document) => (
              <Card key={document.id} className={viewMode === 'list' ? 'p-4' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getDocumentTypeIcon(document.document_type)}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium truncate">
                          {document.original_filename}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDate(document.upload_date)} • {formatFileSize(document.file_size)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {getDocumentTypeLabel(document.document_type)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Preview Section */}
                  {(() => {
                    const isImage = document.mime_type?.startsWith('image/');
                    const isPdf = document.mime_type === 'application/pdf';
                    const previewUrl = `/api/v1/inspector/documents/${document.id}/preview`;  // Fixed: Hardcoded to bypass API class issue

                    if (isImage) {
                      return (
                        <div className="flex justify-center p-4 bg-muted rounded-md">
                          <img
                            src={previewUrl}
                            alt={`Preview of ${document.original_filename}`}
                            loading="lazy"
                            className="max-h-48 max-w-full object-contain rounded"
                            onError={(e) => {
                              console.error('Image Preview Failed:', { documentId: document.id, url: previewUrl, error: e });
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden text-muted-foreground text-sm mt-2">
                            <FileText className="h-8 w-8 inline mr-2" />
                            Image preview unavailable
                          </div>
                        </div>
                      );
                    } else if (isPdf) {
                      return (
                        <div className="flex justify-center p-4 bg-muted rounded-md max-h-48 overflow-hidden">
                          <iframe
                            src={previewUrl}
                            title={`Preview of ${document.original_filename}`}
                            loading="lazy"
                            className="w-full h-48 border-0 rounded"
                            onError={(e) => {
                              console.error('PDF Preview Failed:', { documentId: document.id, url: previewUrl, error: e });
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden flex flex-col items-center justify-center p-8 bg-muted rounded-md text-muted-foreground">
                            <FileText className="h-12 w-12 mb-2" />
                            <p className="text-sm text-center">PDF preview unavailable - download to view</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(document)}
                              className="mt-2"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-md text-muted-foreground">
                          <FileText className="h-12 w-12 mb-2" />
                          <p className="text-sm text-center">Download to view {document.original_filename}</p>
                        </div>
                      );
                    }
                  })()}
                  {document.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {document.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    
                    <EnhancedDocumentDeleteDialog
                      document={document}
                      open={deleteDialogOpen && selectedDocument?.id === document.id}
                      onClose={() => {
                        setDeleteDialogOpen(false)
                        setSelectedDocument(null)
                      }}
                      onConfirm={handleDeleteConfirm}
                      isLoading={isDeleting}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDocument(document)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
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