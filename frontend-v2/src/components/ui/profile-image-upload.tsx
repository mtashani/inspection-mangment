/**
 * Profile Image Upload Component
 * Specialized component for uploading and managing inspector profile images
 */

'use client'

import React, { useState, useRef } from 'react'
import { Camera, Upload, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fileUploadAPI, DocumentType, type DocumentInfo } from '@/lib/api/admin/files'

interface ProfileImageUploadProps {
  inspectorId?: number
  currentImageUrl?: string
  inspectorName?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  onUploadStart?: () => void
  onUploadComplete?: (document: DocumentInfo) => void
  onUploadError?: (error: string) => void
  showUploadButton?: boolean
  allowEdit?: boolean
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  inspectorId,
  currentImageUrl,
  inspectorName = 'Inspector',
  size = 'lg',
  className,
  disabled = false,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  showUploadButton = true,
  allowEdit = true,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get display image URL
  const displayImageUrl = previewUrl || currentImageUrl

  // Get initials from name for fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Validate image file
  const validateImage = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'Please select an image file' }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { isValid: false, error: 'Image file too large. Maximum size: 10MB' }
    }

    // Check image format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Unsupported image format. Use JPEG, PNG, or WebP' }
    }

    return { isValid: true }
  }

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setError(null)

    // Validate file
    const validation = validateImage(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }

    // Create preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)

    // Upload if inspector ID is provided
    if (inspectorId && allowEdit) {
      await uploadImage(file)
    }
  }

  // Upload image to server
  const uploadImage = async (file: File) => {
    if (!inspectorId) return

    setIsUploading(true)
    onUploadStart?.()

    try {
      const response = await fileUploadAPI.uploadProfileImage(inspectorId, file)
      onUploadComplete?.(response.document)
      
      // Clean up preview URL since we now have the uploaded image
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      onUploadError?.(errorMessage)
      
      // Remove preview on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle click on avatar or upload button
  const handleUploadClick = () => {
    if (disabled || !allowEdit) return
    fileInputRef.current?.click()
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || !allowEdit) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Clear error
  const clearError = () => {
    setError(null)
  }

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Profile Image */}
      <div className="relative group">
        <div
          className={cn(
            'relative overflow-hidden rounded-full border-4 border-white shadow-lg',
            sizeClasses[size],
            allowEdit && !disabled && 'cursor-pointer hover:opacity-75 transition-opacity'
          )}
          onClick={allowEdit ? handleUploadClick : undefined}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Avatar className="w-full h-full">
            <AvatarImage 
              src={displayImageUrl} 
              alt={`${inspectorName}'s profile`}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-medium">
              {displayImageUrl ? null : getInitials(inspectorName)}
            </AvatarFallback>
          </Avatar>

          {/* Upload Overlay */}
          {allowEdit && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || !allowEdit}
        />
      </div>

      {/* Upload Button */}
      {showUploadButton && allowEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={disabled || isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-auto p-0 text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Instructions */}
      {allowEdit && !error && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          {displayImageUrl 
            ? 'Click or drag a new image to replace the current photo'
            : 'Click or drag an image file to upload a profile photo'
          }
        </p>
      )}
    </div>
  )
}

export default ProfileImageUpload