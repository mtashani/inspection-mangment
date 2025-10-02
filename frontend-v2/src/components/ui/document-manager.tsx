/**
 * Document Manager Component
 * Displays and manages uploaded documents for an inspector
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  FileText, Image, Download, Trash2, Eye, Calendar, 
  FileX, RefreshCw, Filter, Search, Grid, List 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fileUploadAPI, DocumentType, type DocumentInfo } from '@/lib/api/admin/files'

interface DocumentManagerProps {
  inspectorId: number
  className?: string
  allowDelete?: boolean
  allowDownload?: boolean
  documentType?: DocumentType
  viewMode?: 'grid' | 'list'
  onDocumentDeleted?: (document: DocumentInfo) => void
  onRefresh?: () => void
}

const documentTypeLabels: Record<string, string> = {
  profile_image: 'Profile Image',
  certificate: 'Certificate',
  id_card: 'ID Card',
  qualification: 'Qualification',
  training_record: 'Training Record',
  other: 'Other'
}

const documentTypeColors: Record<string, string> = {
  profile_image: 'bg-blue-100 text-blue-800',
  certificate: 'bg-green-100 text-green-800',
  id_card: 'bg-purple-100 text-purple-800',
  qualification: 'bg-orange-100 text-orange-800',
  training_record: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800'
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  inspectorId,
  className,
  allowDelete = true,
  allowDownload = true,
  documentType,
  viewMode: initialViewMode = 'grid',
  onDocumentDeleted,
  onRefresh,
}) => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [deleteDocumentId, setDeleteDocumentId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load documents
  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const docs = await fileUploadAPI.getInspectorDocuments(inspectorId, documentType)
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadDocuments()
  }, [inspectorId, documentType])

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = filterType === 'all' || doc.document_type === filterType

    return matchesSearch && matchesType
  })

  // Handle document deletion
  const handleDelete = async (documentId: number) => {
    if (!allowDelete) return

    setDeleting(true)
    try {
      await fileUploadAPI.deleteDocument(documentId)
      
      // Remove from local state
      const deletedDoc = documents.find(d => d.id === documentId)
      setDocuments(prev => prev.filter(d => d.id !== documentId))
      
      if (deletedDoc) {
        onDocumentDeleted?.(deletedDoc)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    } finally {
      setDeleting(false)
      setDeleteDocumentId(null)
    }
  }

  // Handle download
  const handleDownload = (document: DocumentInfo) => {
    if (!allowDownload) return
    fileUploadAPI.downloadFile(document.id)
  }

  // Handle refresh
  const handleRefresh = async () => {
    await loadDocuments()
    onRefresh?.()
  }

  // Get file icon
  const getFileIcon = (document: DocumentInfo) => {
    if (fileUploadAPI.isImage(document.mime_type)) {
      return <Image className="w-5 h-5" />
    }
    return <FileText className="w-5 h-5" />
  }

  // Get unique document types for filter
  const uniqueDocumentTypes = Array.from(new Set(documents.map(d => d.document_type)))

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading documents...</span>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Documents</h3>
            <p className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? 's' : ''} total
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {uniqueDocumentTypes.length > 1 && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueDocumentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {documentTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Documents */}
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileX className="w-12 h-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No documents found</h4>
            <p className="text-sm text-gray-500">
              {documents.length === 0
                ? 'No documents have been uploaded yet.'
                : 'No documents match your current filters.'
              }
            </p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'space-y-2'
          )}>
            {filteredDocuments.map((document) => (
              <Card 
                key={document.id} 
                className={cn(
                  'transition-shadow hover:shadow-md',
                  viewMode === 'list' && 'p-0'
                )}
              >
                {viewMode === 'grid' ? (
                  <>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(document)}
                          <CardTitle className="text-sm truncate">
                            {document.original_filename}
                          </CardTitle>
                        </div>
                        
                        <Badge 
                          variant="secondary" 
                          className={documentTypeColors[document.document_type] || documentTypeColors.other}
                        >
                          {documentTypeLabels[document.document_type] || document.document_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Image Preview */}
                      {fileUploadAPI.isImage(document.mime_type) && (
                        <div className="mb-3">
                          <img
                            src={fileUploadAPI.getPreviewUrlForImage(document.id, document.mime_type, document.document_type)!}
                            alt={document.filename}
                            className="w-full h-32 object-cover rounded border"
                          />
                        </div>
                      )}

                      {/* Document Info */}
                      <div className="space-y-2 text-xs text-gray-50">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(document.upload_date)}</span>
                        </div>
                        <div>Size: {document.file_size_mb}MB</div>
                        {document.description && (
                          <div className="text-gray-700">{document.description}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-1 mt-3">
                        {allowDownload && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(document)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                        )}

                        {fileUploadAPI.isImage(document.mime_type) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(document)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View</TooltipContent>
                          </Tooltip>
                        )}

                        {allowDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDocumentId(document.id)}
                                disabled={deleting}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center space-x-4 p-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(document)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium truncate">
                          {document.original_filename}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={documentTypeColors[document.document_type] || documentTypeColors.other}
                        >
                          {documentTypeLabels[document.document_type] || document.document_type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{formatDate(document.upload_date)}</span>
                        <span>{document.file_size_mb}MB</span>
                      </div>
                      {document.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {document.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      {allowDownload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}

                      {allowDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDocumentId(document.id)}
                          disabled={deleting}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog 
          open={deleteDocumentId !== null} 
          onOpenChange={() => setDeleteDocumentId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this document? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDocumentId && handleDelete(deleteDocumentId)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

export default DocumentManager
