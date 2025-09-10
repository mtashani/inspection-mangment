// Dynamic Report Creation API Functions

import {
  FinalReport,
  Template,
  ReportCreateRequest,
  ReportUpdateRequest,
  ReportStatus,
  ReportSubmissionResult,
  ReportCreationState,
  ReportCreationStep,
  FormValidationResult,
  AutoSource,
  ReportFieldValue,
  FieldType,
  ValueSource
} from '../types/professional-reports'

const API_BASE = '/api/v1/report/dynamic'

// Utility function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Dynamic Report Creation API
export const dynamicReportApi = {
  // Initialize report creation process
  async initializeReportCreation(inspectionId: string): Promise<{
    success: boolean
    session_id: string
    inspection_data: {
      id: string
      title: string
      equipmentTag: string
      status: string
      canCreateReport: boolean
    }
    available_report_types: Array<{
      id: string
      name: string
      description: string
      icon: string
      category: string
      templateCount: number
    }>
    message: string
  }> {
    return apiCall('/initialize', {
      method: 'POST',
      body: JSON.stringify({ inspection_id: inspectionId }),
    })
  },

  // Get available templates for report type
  async getTemplatesForType(
    sessionId: string,
    reportTypeId: string
  ): Promise<{
    success: boolean
    templates: Array<{
      id: string
      name: string
      description: string
      version: number
      fieldCount: number
      sectionCount: number
      estimatedTime: number
      complexity: 'simple' | 'moderate' | 'complex'
      lastUsed?: string
      isRecommended: boolean
    }>
    message: string
  }> {
    return apiCall(`/session/${sessionId}/templates`, {
      method: 'POST',
      body: JSON.stringify({ report_type_id: reportTypeId }),
    })
  },

  // Create report with selected template
  async createReportWithTemplate(
    sessionId: string,
    templateId: string,
    createdBy: string
  ): Promise<{
    success: boolean
    report_id: string
    template: Template
    auto_populated_fields: Record<string, any>
    validation_errors: Record<string, string[]>
    form_structure: {
      sections: Array<{
        id: string
        title: string
        order: number
        subsections: Array<{
          id: string
          title: string
          order: number
          fields: Array<{
            id: string
            label: string
            fieldType: FieldType
            valueSource: ValueSource
            isRequired: boolean
            value?: any
            isAutoFilled: boolean
            validationErrors?: string[]
            options?: string[]
            placeholder?: string
            helpText?: string
          }>
        }>
      }>
    }
    message: string
    created_at: string
  }> {
    return apiCall(`/session/${sessionId}/create`, {
      method: 'POST',\n      body: JSON.stringify({\n        template_id: templateId,\n        created_by: createdBy\n      }),\n    })\n  },\n\n  // Get report form structure with current values\n  async getReportForm(reportId: string): Promise<{\n    success: boolean\n    report: FinalReport\n    template: Template\n    form_structure: {\n      sections: Array<{\n        id: string\n        title: string\n        sectionType: string\n        order: number\n        isRequired: boolean\n        subsections: Array<{\n          id: string\n          title: string\n          order: number\n          isRequired: boolean\n          fields: Array<{\n            id: string\n            label: string\n            fieldType: FieldType\n            valueSource: ValueSource\n            isRequired: boolean\n            currentValue?: any\n            isAutoFilled: boolean\n            validationErrors?: string[]\n            options?: string[]\n            placeholder?: string\n            helpText?: string\n            validationRules?: any\n            row: number\n            col: number\n            rowspan: number\n            colspan: number\n          }>\n        }>\n      }>\n    }\n    completion_status: {\n      percentage: number\n      completedFields: number\n      totalFields: number\n      requiredCompleted: number\n      totalRequired: number\n      canSubmit: boolean\n    }\n    message: string\n  }> {\n    return apiCall(`/reports/${reportId}/form`)\n  },\n\n  // Update single field value\n  async updateFieldValue(\n    reportId: string,\n    fieldId: string,\n    value: any\n  ): Promise<{\n    success: boolean\n    field_id: string\n    old_value: any\n    new_value: any\n    validation_result: {\n      isValid: boolean\n      errors: string[]\n      warnings: string[]\n    }\n    auto_calculated_fields?: Record<string, any>\n    message: string\n    updated_at: string\n  }> {\n    return apiCall(`/reports/${reportId}/fields/${fieldId}`, {\n      method: 'PUT',\n      body: JSON.stringify({ value }),\n    })\n  },\n\n  // Update multiple field values\n  async updateMultipleFields(\n    reportId: string,\n    fieldValues: Record<string, any>\n  ): Promise<{\n    success: boolean\n    updated_fields: Record<string, {\n      old_value: any\n      new_value: any\n      validation_result: {\n        isValid: boolean\n        errors: string[]\n        warnings: string[]\n      }\n    }>\n    auto_calculated_fields?: Record<string, any>\n    overall_validation: FormValidationResult\n    message: string\n    updated_at: string\n  }> {\n    return apiCall(`/reports/${reportId}/fields`, {\n      method: 'PUT',\n      body: JSON.stringify({ field_values: fieldValues }),\n    })\n  },\n\n  // Validate report form\n  async validateReportForm(reportId: string): Promise<{\n    success: boolean\n    validation_result: FormValidationResult\n    completion_status: {\n      percentage: number\n      completedFields: number\n      totalFields: number\n      requiredCompleted: number\n      totalRequired: number\n      canSubmit: boolean\n    }\n    missing_required_fields: Array<{\n      fieldId: string\n      fieldLabel: string\n      sectionTitle: string\n      subsectionTitle: string\n    }>\n    message: string\n  }> {\n    return apiCall(`/reports/${reportId}/validate`)\n  },\n\n  // Save report as draft\n  async saveDraft(\n    reportId: string,\n    autoSave: boolean = false\n  ): Promise<{\n    success: boolean\n    report_id: string\n    status: ReportStatus\n    saved_fields: number\n    validation_warnings: string[]\n    message: string\n    saved_at: string\n  }> {\n    return apiCall(`/reports/${reportId}/save-draft`, {\n      method: 'POST',\n      body: JSON.stringify({ auto_save: autoSave }),\n    })\n  },\n\n  // Submit report for review\n  async submitReport(reportId: string): Promise<ReportSubmissionResult> {\n    return apiCall(`/reports/${reportId}/submit`, {\n      method: 'POST',\n    })\n  },\n\n  // Get auto-populated field values\n  async refreshAutoFields(reportId: string): Promise<{\n    success: boolean\n    refreshed_fields: Record<string, {\n      field_id: string\n      field_label: string\n      old_value: any\n      new_value: any\n      source_key: string\n      last_updated: string\n    }>\n    failed_fields: Array<{\n      field_id: string\n      field_label: string\n      source_key: string\n      error: string\n    }>\n    message: string\n    refreshed_at: string\n  }> {\n    return apiCall(`/reports/${reportId}/refresh-auto-fields`, {\n      method: 'POST',\n    })\n  },\n\n  // Get field auto-population preview\n  async previewAutoFields(\n    templateId: string,\n    inspectionId: string\n  ): Promise<{\n    success: boolean\n    preview_data: Record<string, {\n      field_id: string\n      field_label: string\n      source_key: string\n      preview_value: any\n      data_quality: 'high' | 'medium' | 'low'\n      last_updated: string\n      confidence: number\n    }>\n    missing_sources: Array<{\n      field_id: string\n      field_label: string\n      source_key: string\n      reason: string\n    }>\n    message: string\n  }> {\n    return apiCall('/preview-auto-fields', {\n      method: 'POST',\n      body: JSON.stringify({\n        template_id: templateId,\n        inspection_id: inspectionId\n      }),\n    })\n  },\n\n  // Upload field attachments (images, files)\n  async uploadFieldAttachment(\n    reportId: string,\n    fieldId: string,\n    file: File,\n    attachmentType: 'image' | 'file'\n  ): Promise<{\n    success: boolean\n    field_id: string\n    attachment_url: string\n    attachment_type: string\n    file_size: number\n    file_name: string\n    message: string\n    uploaded_at: string\n  }> {\n    const formData = new FormData()\n    formData.append('file', file)\n    formData.append('attachment_type', attachmentType)\n\n    const response = await fetch(`${API_BASE}/reports/${reportId}/fields/${fieldId}/upload`, {\n      method: 'POST',\n      body: formData,\n    })\n\n    if (!response.ok) {\n      throw new Error(`Failed to upload attachment: ${response.statusText}`)\n    }\n\n    return response.json()\n  },\n\n  // Delete field attachment\n  async deleteFieldAttachment(\n    reportId: string,\n    fieldId: string,\n    attachmentUrl: string\n  ): Promise<{\n    success: boolean\n    field_id: string\n    deleted_attachment: string\n    message: string\n    deleted_at: string\n  }> {\n    return apiCall(`/reports/${reportId}/fields/${fieldId}/attachment`, {\n      method: 'DELETE',\n      body: JSON.stringify({ attachment_url: attachmentUrl }),\n    })\n  },\n\n  // Get report creation history\n  async getCreationHistory(reportId: string): Promise<{\n    success: boolean\n    history: Array<{\n      timestamp: string\n      action: 'created' | 'field_updated' | 'draft_saved' | 'submitted' | 'auto_refresh'\n      details: {\n        field_id?: string\n        field_label?: string\n        old_value?: any\n        new_value?: any\n        user_id?: string\n        auto_save?: boolean\n      }\n      user_id?: string\n    }>\n    message: string\n  }> {\n    return apiCall(`/reports/${reportId}/history`)\n  },\n\n  // Clone report\n  async cloneReport(\n    reportId: string,\n    newInspectionId?: string\n  ): Promise<{\n    success: boolean\n    original_report_id: string\n    cloned_report_id: string\n    cloned_fields: number\n    message: string\n    created_at: string\n  }> {\n    return apiCall(`/reports/${reportId}/clone`, {\n      method: 'POST',\n      body: newInspectionId ? JSON.stringify({ new_inspection_id: newInspectionId }) : undefined,\n    })\n  }\n}\n\n// Auto-field Population API\nexport const autoFieldPopulationApi = {\n  // Get available auto-sources for inspection\n  async getAvailableAutoSources(inspectionId: string): Promise<{\n    success: boolean\n    auto_sources: Array<{\n      key: string\n      label: string\n      description: string\n      category: 'inspection' | 'equipment' | 'user' | 'system'\n      dataType: FieldType\n      availability: 'available' | 'partial' | 'unavailable'\n      lastUpdated?: string\n      dataQuality: 'high' | 'medium' | 'low'\n    }>\n    message: string\n  }> {\n    return apiCall(`/auto-sources/inspection/${inspectionId}`)\n  },\n\n  // Test auto-source value\n  async testAutoSourceValue(\n    sourceKey: string,\n    inspectionId: string\n  ): Promise<{\n    success: boolean\n    source_key: string\n    test_value: any\n    data_type: FieldType\n    data_quality: 'high' | 'medium' | 'low'\n    confidence: number\n    last_updated: string\n    source_path: string\n    message: string\n  }> {\n    return apiCall('/auto-sources/test', {\n      method: 'POST',\n      body: JSON.stringify({\n        source_key: sourceKey,\n        inspection_id: inspectionId\n      }),\n    })\n  },\n\n  // Bulk test auto-sources\n  async bulkTestAutoSources(\n    sourceKeys: string[],\n    inspectionId: string\n  ): Promise<{\n    success: boolean\n    test_results: Record<string, {\n      success: boolean\n      value?: any\n      data_type?: FieldType\n      data_quality?: 'high' | 'medium' | 'low'\n      confidence?: number\n      error?: string\n    }>\n    overall_success_rate: number\n    message: string\n  }> {\n    return apiCall('/auto-sources/bulk-test', {\n      method: 'POST',\n      body: JSON.stringify({\n        source_keys: sourceKeys,\n        inspection_id: inspectionId\n      }),\n    })\n  },\n\n  // Configure auto-field mapping\n  async configureAutoFieldMapping(\n    templateId: string,\n    fieldId: string,\n    sourceKey: string,\n    transformFunction?: string\n  ): Promise<{\n    success: boolean\n    field_id: string\n    source_key: string\n    transform_function?: string\n    test_result: {\n      success: boolean\n      sample_value?: any\n      error?: string\n    }\n    message: string\n    configured_at: string\n  }> {\n    return apiCall('/auto-sources/configure-mapping', {\n      method: 'POST',\n      body: JSON.stringify({\n        template_id: templateId,\n        field_id: fieldId,\n        source_key: sourceKey,\n        transform_function: transformFunction\n      }),\n    })\n  }\n}\n\n// Form Validation API\nexport const formValidationApi = {\n  // Validate single field\n  async validateField(\n    fieldType: FieldType,\n    value: any,\n    validationRules?: any,\n    isRequired?: boolean\n  ): Promise<{\n    success: boolean\n    validation_result: {\n      isValid: boolean\n      errors: string[]\n      warnings: string[]\n      suggestions: string[]\n    }\n    formatted_value?: any\n    message: string\n  }> {\n    return apiCall('/validation/field', {\n      method: 'POST',\n      body: JSON.stringify({\n        field_type: fieldType,\n        value,\n        validation_rules: validationRules,\n        is_required: isRequired\n      }),\n    })\n  },\n\n  // Validate form section\n  async validateSection(\n    sectionId: string,\n    fieldValues: Record<string, any>,\n    templateId: string\n  ): Promise<{\n    success: boolean\n    section_validation: {\n      isValid: boolean\n      field_results: Record<string, {\n        isValid: boolean\n        errors: string[]\n        warnings: string[]\n      }>\n      section_errors: string[]\n      completion_percentage: number\n    }\n    message: string\n  }> {\n    return apiCall('/validation/section', {\n      method: 'POST',\n      body: JSON.stringify({\n        section_id: sectionId,\n        field_values: fieldValues,\n        template_id: templateId\n      }),\n    })\n  },\n\n  // Get validation rules for field type\n  async getValidationRules(fieldType: FieldType): Promise<{\n    success: boolean\n    validation_rules: {\n      available_rules: Array<{\n        rule: string\n        description: string\n        parameters: Array<{\n          name: string\n          type: string\n          required: boolean\n          default?: any\n        }>\n        examples: string[]\n      }>\n      default_rules: any\n    }\n    message: string\n  }> {\n    return apiCall(`/validation/rules/${fieldType}`)\n  }\n}\n\n// Helper functions for dynamic reports\nexport const dynamicReportHelpers = {\n  // Create report creation state\n  createInitialState(inspectionId: string): ReportCreationState {\n    return {\n      inspectionId,\n      currentStep: 'confirmation',\n      formData: {},\n      validationErrors: {},\n      isSubmitting: false\n    }\n  },\n\n  // Validate step transition\n  canProceedToStep(\n    currentStep: ReportCreationStep['step'],\n    nextStep: ReportCreationStep['step'],\n    state: ReportCreationState\n  ): boolean {\n    switch (currentStep) {\n      case 'confirmation':\n        return nextStep === 'type-selection'\n      case 'type-selection':\n        return nextStep === 'template-selection' && !!state.selectedType\n      case 'template-selection':\n        return nextStep === 'form-filling' && !!state.selectedTemplate\n      case 'form-filling':\n        return false // Final step\n      default:\n        return false\n    }\n  },\n\n  // Calculate form progress\n  calculateFormProgress(\n    formData: Record<string, any>,\n    template: Template\n  ): {\n    percentage: number\n    completedFields: number\n    totalFields: number\n    requiredCompleted: number\n    totalRequired: number\n  } {\n    let totalFields = 0\n    let completedFields = 0\n    let totalRequired = 0\n    let requiredCompleted = 0\n\n    template.sections.forEach(section => {\n      section.subsections.forEach(subsection => {\n        subsection.fields.forEach(field => {\n          totalFields++\n          if (field.isRequired) totalRequired++\n\n          const value = formData[field.id]\n          const hasValue = value !== null && value !== undefined && value !== ''\n          \n          if (hasValue) {\n            completedFields++\n            if (field.isRequired) requiredCompleted++\n          }\n        })\n      })\n    })\n\n    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0\n\n    return {\n      percentage,\n      completedFields,\n      totalFields,\n      requiredCompleted,\n      totalRequired\n    }\n  },\n\n  // Format field value for display\n  formatFieldValueForDisplay(fieldType: FieldType, value: any): string {\n    if (value === null || value === undefined || value === '') {\n      return ''\n    }\n\n    switch (fieldType) {\n      case FieldType.DATE:\n        return new Date(value).toLocaleDateString('en-US', {\n          year: 'numeric',\n          month: 'short',\n          day: 'numeric'\n        })\n      \n      case FieldType.CHECKBOX:\n        return value ? 'Yes' : 'No'\n      \n      case FieldType.MULTI_SELECT:\n        return Array.isArray(value) ? value.join(', ') : String(value)\n      \n      case FieldType.NUMBER:\n        return Number(value).toLocaleString()\n      \n      default:\n        return String(value)\n    }\n  },\n\n  // Get field input component type\n  getFieldInputType(fieldType: FieldType): string {\n    switch (fieldType) {\n      case FieldType.TEXT:\n        return 'text'\n      case FieldType.TEXTAREA:\n        return 'textarea'\n      case FieldType.NUMBER:\n        return 'number'\n      case FieldType.DATE:\n        return 'date'\n      case FieldType.CHECKBOX:\n        return 'checkbox'\n      case FieldType.SELECT:\n        return 'select'\n      case FieldType.MULTI_SELECT:\n        return 'multiselect'\n      case FieldType.IMAGE:\n        return 'image-upload'\n      case FieldType.FILE:\n        return 'file-upload'\n      case FieldType.SIGNATURE:\n        return 'signature'\n      default:\n        return 'text'\n    }\n  },\n\n  // Check if field is readonly\n  isFieldReadonly(field: any): boolean {\n    return field.valueSource === ValueSource.AUTO || field.valueSource === ValueSource.CALCULATED\n  },\n\n  // Get auto-field indicator\n  getAutoFieldIndicator(valueSource: ValueSource): {\n    icon: string\n    color: string\n    tooltip: string\n  } {\n    switch (valueSource) {\n      case ValueSource.AUTO:\n        return {\n          icon: '🤖',\n          color: 'green',\n          tooltip: 'Automatically populated from system data'\n        }\n      case ValueSource.CALCULATED:\n        return {\n          icon: '🧮',\n          color: 'purple',\n          tooltip: 'Calculated based on other field values'\n        }\n      case ValueSource.MANUAL:\n      default:\n        return {\n          icon: '✏️',\n          color: 'blue',\n          tooltip: 'Manual input required'\n        }\n    }\n  },\n\n  // Debounce field updates\n  debounceFieldUpdate: (() => {\n    const timeouts = new Map<string, NodeJS.Timeout>()\n    \n    return (fieldId: string, updateFn: () => void, delay: number = 500) => {\n      const existingTimeout = timeouts.get(fieldId)\n      if (existingTimeout) {\n        clearTimeout(existingTimeout)\n      }\n      \n      const newTimeout = setTimeout(() => {\n        updateFn()\n        timeouts.delete(fieldId)\n      }, delay)\n      \n      timeouts.set(fieldId, newTimeout)\n    }\n  })(),\n\n  // Generate field validation summary\n  generateValidationSummary(validationErrors: Record<string, string[]>): {\n    totalErrors: number\n    errorsBySection: Record<string, number>\n    criticalErrors: string[]\n    warnings: string[]\n  } {\n    const totalErrors = Object.values(validationErrors).reduce(\n      (sum, errors) => sum + errors.length,\n      0\n    )\n\n    const errorsBySection: Record<string, number> = {}\n    const criticalErrors: string[] = []\n    const warnings: string[] = []\n\n    Object.entries(validationErrors).forEach(([fieldId, errors]) => {\n      errors.forEach(error => {\n        if (error.includes('required')) {\n          criticalErrors.push(error)\n        } else {\n          warnings.push(error)\n        }\n      })\n    })\n\n    return {\n      totalErrors,\n      errorsBySection,\n      criticalErrors,\n      warnings\n    }\n  }\n}\n\n// Error handling utilities\nexport class DynamicReportApiError extends Error {\n  constructor(\n    message: string,\n    public statusCode?: number,\n    public errorCode?: string,\n    public fieldErrors?: Record<string, string[]>,\n    public validationErrors?: FormValidationResult\n  ) {\n    super(message)\n    this.name = 'DynamicReportApiError'\n  }\n}"