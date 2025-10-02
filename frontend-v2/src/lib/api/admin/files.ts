/**
 * File Upload API Client for Inspector Documents and Media
 * Handles API calls for file uploads, document management, and related operations
 */

import { adminApiRequest, adminApiGet, buildQueryParams } from './base'
import { authService } from '@/lib/auth'

// File upload types
export interface DocumentInfo {
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

export interface UploadResponse {
  success: boolean
  message: string
  document: DocumentInfo
}

export interface MultipleUploadResponse {
  success: boolean
  message: string
  uploaded_documents: DocumentInfo[]
  failed_uploads: Array<{
    filename: string
    error: string
  }>
  total_uploaded: number
  total_failed: number
}

export interface UploadConfig {
  max_file_size: number
  max_file_size_mb: number
  allowed_mime_types: Record<string, string[]>
  document_types: string[]
  max_files_per_batch: number
}

export interface DeleteResponse {
  success: boolean
  message: string
}

// Document types enum for better type safety
export enum DocumentType {
  IdCard = 'id_card',
  BirthCertificate = 'birth_certificate',
  MilitaryService = 'military_service',
  Degree = 'degree',
  Other = 'other'
}

export class FileUploadAPI {
  private baseUrl = '/inspectors'
  private documentBaseUrl = '/inspector' // Base URL for document-related endpoints

  /**
   * Upload profile image for an inspector
   */
  async uploadProfileImage(
    inspectorId: number,
    file: File
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('inspector_id', inspectorId.toString())
    formData.append('file', file)

    const token = authService.getToken()
    
    return adminApiRequest<UploadResponse>(
      `${this.documentBaseUrl}/upload/profile-image`,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type for FormData
        },
        body: formData
      }
    )
  }

  /**
   * Upload a single document for an inspector
   */
  async uploadDocument(
    inspectorId: number,
    documentType: string,
    file: File,
    description?: string
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('inspector_id', inspectorId.toString())
    formData.append('document_type', documentType)
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    const token = authService.getToken()
    
    // Use certificate-specific endpoint for certificates
    const endpoint = documentType === 'certificate'
      ? `${this.documentBaseUrl}/certificates/upload`
      : `${this.documentBaseUrl}/documents/upload`
    
    return adminApiRequest<UploadResponse>(
      endpoint,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData
      }
    )
  }

  /**
   * Upload a certificate for an inspector with additional metadata
   */
  async uploadCertificate(
    inspectorId: number,
    file: File,
    description?: string,
    certificateType?: string,
    certificateNumber?: string,
    issuingOrganization?: string,
    issueDate?: string,
    expiryDate?: string
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('inspector_id', inspectorId.toString())
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    if (certificateType) {
      formData.append('certificate_type', certificateType)
    }
    if (certificateNumber) {
      formData.append('certificate_number', certificateNumber)
    }
    if (issuingOrganization) {
      formData.append('issuing_organization', issuingOrganization)
    }
    if (issueDate) {
      formData.append('issue_date', issueDate)
    }
    if (expiryDate) {
      formData.append('expiry_date', expiryDate)
    }

    const token = authService.getToken()
    
    return adminApiRequest<UploadResponse>(
      `${this.documentBaseUrl}/certificates/upload`,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData
      }
    )
  }

  /**
   * Upload multiple documents for an inspector
   */
  async uploadMultipleDocuments(
    inspectorId: number,
    documentType: string,
    files: File[],
    descriptions?: string[]
  ): Promise<MultipleUploadResponse> {
    const formData = new FormData()
    formData.append('inspector_id', inspectorId.toString())
    formData.append('document_type', documentType)
    
    files.forEach((file) => {
      formData.append('files', file)
    })

    if (descriptions && descriptions.length > 0) {
      descriptions.forEach((desc) => {
        formData.append('descriptions', desc)
      })
    }

    const token = authService.getToken()
    
    const endpoint = documentType === 'certificate'
      ? `${this.documentBaseUrl}/certificates/upload-multiple`
      : `${this.documentBaseUrl}/documents/upload-multiple`
    
    return adminApiRequest<MultipleUploadResponse>(
      endpoint,
      {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData
      }
    )
  }

  /**
   * Get all documents for an inspector
   */
  async getInspectorDocuments(
    inspectorId: number,
    documentType?: string
  ): Promise<DocumentInfo[]> {
    const params: Record<string, string> = {}
    if (documentType) {
      params.document_type = documentType
    }

    const queryString = buildQueryParams(params)
    // Use certificates endpoint for certificate document type
    if (documentType === 'certificate') {
      return adminApiGet<DocumentInfo[]>(
        `${this.documentBaseUrl}/certificates/${inspectorId}${queryString}`
      )
    } else {
      return adminApiGet<DocumentInfo[]>(
        `${this.documentBaseUrl}/documents/${inspectorId}${queryString}`
      )
    }
  }

  /**
   * Get document information by ID
   */
  async getDocumentInfo(documentId: number): Promise<DocumentInfo> {
    return adminApiGet<DocumentInfo>(
      `${this.documentBaseUrl}/documents/${documentId}/info`
    )
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(documentId: number): Promise<DeleteResponse> {
    return adminApiRequest<DeleteResponse>(
      `${this.documentBaseUrl}/documents/${documentId}`,
      { method: 'DELETE' }
    )
  }

  /**
   * Get upload configuration and restrictions
   */
  async getUploadConfig(): Promise<UploadConfig> {
    return adminApiGet<UploadConfig>(`${this.documentBaseUrl}/upload/config`)
  }

  /**
   * Get available document types from backend
   */
  async getDocumentTypes(): Promise<Array<{value: string, label: string, description: string}>> {
    return adminApiGet<Array<{value: string, label: string, description: string}>>(`${this.documentBaseUrl}/documents/types`)
  }

  /**
   * Get download URL for a document
   */
  getDownloadUrl(documentId: number, documentType: string = 'document'): string {
    if (documentType === 'certificate') {
      return `${this.documentBaseUrl}/certificates/${documentId}/download`
    } else {
      return `${this.documentBaseUrl}/documents/${documentId}/download`
    }
 }

  getPreviewUrl(documentId: number, documentType: string = 'document'): string {
    // Use different endpoints based on document type
    if (documentType === 'certificate') {
      return `${this.documentBaseUrl}/certificates/${documentId}/preview`
    } else {
      return `${this.documentBaseUrl}/documents/${documentId}/preview`
    }
  }

  /**
   * Download a file (opens in new tab or triggers download)
   */
 downloadFile(documentId: number, documentType: string = 'document'): void {
    const url = this.getDownloadUrl(documentId, documentType)
    window.open(url, '_blank')
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    documentType: DocumentType,
    config: UploadConfig
  ): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > config.max_file_size) {
      return {
        isValid: false,
        error: `File too large. Maximum size allowed: ${config.max_file_size_mb}MB`
      }
    }

    // Check file type
    const allowedTypes = config.allowed_mime_types[documentType]
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    return { isValid: true }
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file type icon based on mime type
   */
  getFileTypeIcon(mimeType: string | null): string {
    if (!mimeType) return '📄'

    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📕'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType === 'text/plain') return '📄'

    return '📎'
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string | null): boolean {
    if (!mimeType) return false
    return mimeType.startsWith('image/')
 }

  /**
   * Get preview URL for images based on document type
   */
  getPreviewUrlForImage(documentId: number, mimeType: string | null, documentType: string = 'document'): string | null {
    if (!this.isImage(mimeType)) return null
    // For certificates, use the certificate preview endpoint
    if (documentType === 'certificate') {
      return `${this.documentBaseUrl}/certificates/${documentId}/preview`
    } else {
      return `${this.documentBaseUrl}/documents/${documentId}/download`
    }
  }

  /**
   * Get document statistics for an inspector
   */
  async getDocumentStats(inspectorId: number): Promise<DocumentInfo[]> {
    return adminApiGet<DocumentInfo[]>(`${this.documentBaseUrl}/documents/stats/${inspectorId}`)
  }

  /**
   * Get certificate statistics for an inspector
   */
 async getCertificateStats(inspectorId: number): Promise<DocumentInfo[]> {
    return adminApiGet<DocumentInfo[]>(`${this.documentBaseUrl}/certificates/stats/${inspectorId}`)
 }

  /**
   * Get thumbnail URL for documents or certificates
   */
  getThumbnailUrl(documentId: number, documentType: string = 'document'): string {
    if (documentType === 'certificate') {
      return `${this.documentBaseUrl}/certificates/${documentId}/download`
    } else {
      return `${this.documentBaseUrl}/documents/${documentId}/download`
    }
 }

  /**
   * Check if file has preview capability
   */
  hasPreview(mimeType: string | null): boolean {
    if (!mimeType) return false
    return mimeType.startsWith('image/') || mimeType === 'application/pdf'
  }
}

// Export singleton instance
export const fileUploadAPI = new FileUploadAPI()
