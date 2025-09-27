/**
 * File Upload Component with Drag and Drop Support
 * Reusable component for uploading files with validation and preview
 */

'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fileUploadAPI, DocumentType, type UploadConfig, type DocumentInfo } from '@/lib/api/admin/files'

interface FileUploadProps {
  inspectorId?: number
  documentType?: DocumentType
  multiple?: boolean
  maxFiles?: number
  accept?: string
  className?: string
  disabled?: boolean
  onUploadStart?: () => void
  onUploadProgress?: (progress: number) => void
  onUploadComplete?: (documents: DocumentInfo[]) => void
  onUploadError?: (error: string) => void
  onFilesSelected?: (files: File[]) => void
}

interface FileWithPreview extends File {
  id: string
  preview?: string
  progress?: number
  error?: string
  uploaded?: boolean
  documentInfo?: DocumentInfo
}

export const FileUpload: React.FC<FileUploadProps> = ({
  inspectorId,
  documentType = DocumentType.Other,
  multiple = false,
  maxFiles = 10,
  accept,
  className,
  disabled = false,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onFilesSelected,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load upload configuration
  React.useEffect(() => {
    fileUploadAPI.getUploadConfig().then(setUploadConfig).catch(console.error)
  }, [])

  // Create preview URLs for images
  const createPreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return undefined
  }, [])

  // Validate file against configuration
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (!uploadConfig) return { isValid: true }
    return fileUploadAPI.validateFile(file, documentType, uploadConfig)
  }, [uploadConfig, documentType])

  // Handle file selection
  const handleFileSelection = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    
    if (!multiple && fileArray.length > 1) {
      onUploadError?.('Only one file allowed')
      return
    }

    if (fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newFiles: FileWithPreview[] = fileArray.map((file) => {
      const validation = validateFile(file)
      return {
        ...file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        preview: createPreview(file),
        error: validation.isValid ? undefined : validation.error,
      }
    })

    setFiles(newFiles)
    onFilesSelected?.(newFiles.filter(f => !f.error))
  }, [multiple, maxFiles, validateFile, createPreview, onUploadError, onFilesSelected])

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const { files: droppedFiles } = e.dataTransfer
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelection(droppedFiles)
    }
  }, [disabled, handleFileSelection])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files)
    }
  }, [handleFileSelection])

  // Remove file from list
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  // Upload files
  const uploadFiles = useCallback(async () => {
    if (!inspectorId || files.length === 0) return

    setIsUploading(true)
    onUploadStart?.()

    const validFiles = files.filter(f => !f.error)
    const uploadedDocuments: DocumentInfo[] = []
    let completed = 0

    try {
      for (const file of validFiles) {
        try {
          // Update file progress
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress: 0 } : f
          ))

          let response
          if (documentType === DocumentType.ProfileImage) {
            response = await fileUploadAPI.uploadProfileImage(inspectorId, file)
          } else if (documentType === DocumentType.Certificate) {
            response = await fileUploadAPI.uploadCertificate(inspectorId, file)
          } else {
            response = await fileUploadAPI.uploadDocument(inspectorId, documentType, file)
          }

          // Mark file as uploaded
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, progress: 100, uploaded: true, documentInfo: response.document }
              : f
          ))

          uploadedDocuments.push(response.document)
          completed++

          // Update overall progress
          const progress = Math.round((completed / validFiles.length) * 100)
          setOverallProgress(progress)
          onUploadProgress?.(progress)

        } catch (error) {
          // Mark file as error
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, error: error instanceof Error ? error.message : 'Upload failed' }
              : f
          ))
        }
      }

      onUploadComplete?.(uploadedDocuments)

    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setOverallProgress(0)
    }
  }, [inspectorId, files, documentType, onUploadStart, onUploadProgress, onUploadComplete, onUploadError])

  // Clear all files
  const clearFiles = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [files])

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver
            ? 'border-primary bg-primary/10'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'Drop files here' : 'Upload files'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop your files here, or click to browse
        </p>
        
        {uploadConfig && (
          <div className="text-xs text-gray-400 space-y-1">
            <p>Max file size: {uploadConfig.max_file_size_mb}MB</p>
            {uploadConfig.allowed_mime_types[documentType] && (
              <p>
                Allowed types: {uploadConfig.allowed_mime_types[documentType].join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Files ({files.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFiles}
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 border rounded-lg"
            >
              {/* File Icon/Preview */}
              <div className="flex-shrink-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <Image className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {fileUploadAPI.formatFileSize(file.size)}
                </p>
                
                {/* Progress Bar */}
                {file.progress !== undefined && !file.error && !file.uploaded && (
                  <Progress value={file.progress} className="mt-1 h-1" />
                )}
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                {file.error ? (
                  <div className="flex items-center text-red-500">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">Error</span>
                  </div>
                ) : file.uploaded ? (
                  <div className="flex items-center text-green-500">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">Uploaded</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Error Messages */}
          {files.some(f => f.error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some files have errors. Please check the file list above.
              </AlertDescription>
            </Alert>
          )}

          {/* Overall Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading files...</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
          )}

          {/* Upload Button */}
          {inspectorId && files.some(f => !f.error && !f.uploaded) && (
            <Button
              onClick={uploadFiles}
              disabled={isUploading || !files.some(f => !f.error && !f.uploaded)}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : `Upload ${files.filter(f => !f.error && !f.uploaded).length} File(s)`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default FileUpload