'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, File, Image, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  onFileRemove?: (index: number) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  className?: string
  existingFiles?: Array<{
    name: string
    url: string
    type: string
    size?: number
  }>
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "image/*,.pdf,.doc,.docx",
  multiple = false,
  maxSize = 5, // 5MB default
  maxFiles = 5,
  className,
  existingFiles = []
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxSize}MB.`
    }

    // Check file type if accept is specified
    if (accept && accept !== "*") {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
      const mimeType = file.type

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type
        }
        if (type.includes('/*')) {
          return mimeType.startsWith(type.replace('/*', ''))
        }
        return mimeType === type
      })

      if (!isAccepted) {
        return `File "${file.name}" type is not allowed.`
      }
    }

    return null
  }

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files)
    const totalFiles = selectedFiles.length + existingFiles.length + newFiles.length

    setError('')

    // Check max files limit
    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate each file
    for (const file of newFiles) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    const updatedFiles = multiple ? [...selectedFiles, ...newFiles] : newFiles
    setSelectedFiles(updatedFiles)
    onFileSelect(updatedFiles)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFileSelect(newFiles)
    if (onFileRemove) {
      onFileRemove(index)
    }
  }

  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mimeType = fileType?.toLowerCase()

    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) {
      return <Image className="w-4 h-4" />
    }
    if (extension === 'pdf' || mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />
    }
    if (['doc', 'docx'].includes(extension || '') || mimeType?.includes('word')) {
      return <FileText className="w-4 h-4 text-blue-500" />
    }
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="p-8 text-center">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-700 mb-2">
            Upload Files
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Drag and drop files here, or click to browse
          </div>
          <div className="text-xs text-gray-400">
            Accepted: {accept} • Max size: {maxSize}MB • Max files: {maxFiles}
          </div>
          <Button type="button" variant="outline" className="mt-4">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Files</h4>
          <div className="space-y-2">
            {existingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name, file.type)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    {file.size && (
                      <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove?.(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name, file.type)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}