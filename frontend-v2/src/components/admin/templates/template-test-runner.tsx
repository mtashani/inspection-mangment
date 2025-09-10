'use client'

import { useState } from 'react'
import { Play, RotateCcw, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TemplateFormData, FieldType } from '@/types/admin'

interface TestResult {
  success: boolean
  renderedTemplate?: string
  errors?: string[]
  performance?: {
    renderTime: number
    fieldCount: number
    sectionCount: number
  }
}

interface TemplateTestRunnerProps {
  templateData: TemplateFormData
  onTest: (sampleData: Record<string, unknown>) => Promise<void>
  testResult: TestResult | null
  isLoading: boolean
}

export function TemplateTestRunner({
  templateData,
  onTest,
  testResult,
  isLoading
}: TemplateTestRunnerProps) {
  const [sampleData, setSampleData] = useState<Record<string, unknown>>({})
  const [testMode, setTestMode] = useState<'manual' | 'auto'>('auto')

  // Generate sample data automatically
  const generateSampleData = () => {
    const data: Record<string, unknown> = {}

    templateData.sections.forEach((section, sectionIndex) => {
      section.fields.forEach((field, fieldIndex) => {
        const fieldKey = `${section.title}_${field.name}`
        
        switch (field.type as FieldType) {
          case 'text':
            data[fieldKey] = `Sample text for ${field.label}`
            break
          case 'textarea':
            data[fieldKey] = `This is a sample multi-line text for ${field.label}.\nIt contains multiple lines to test the textarea field.`
            break
          case 'number':
            data[fieldKey] = Math.floor(Math.random() * 100) + 1
            break
          case 'date':
            data[fieldKey] = new Date().toISOString().split('T')[0]
            break
          case 'select':
            if (field.options && field.options.length > 0) {
              data[fieldKey] = field.options[Math.floor(Math.random() * field.options.length)]
            }
            break
          case 'multiselect':
            if (field.options && field.options.length > 0) {
              const selectedCount = Math.floor(Math.random() * field.options.length) + 1
              data[fieldKey] = field.options.slice(0, selectedCount)
            }
            break
          case 'checkbox':
            data[fieldKey] = Math.random() > 0.5
            break
          case 'file':
            data[fieldKey] = `sample-file-${fieldIndex + 1}.pdf`
            break
          case 'image':
            data[fieldKey] = `sample-image-${fieldIndex + 1}.jpg`
            break
          default:
            data[fieldKey] = `Sample value for ${field.label}`
        }
      })
    })

    setSampleData(data)
  }

  const handleRunTest = async () => {
    const dataToTest = testMode === 'auto' ? (() => {
      generateSampleData()
      return sampleData
    })() : sampleData

    await onTest(dataToTest)
  }

  const resetSampleData = () => {
    setSampleData({})
  }

  const renderSampleDataForm = () => {
    return (
      <div className="space-y-6">
        {templateData.sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field, fieldIndex) => {
                const fieldKey = `${section.title}_${field.name}`
                const fieldValue = sampleData[fieldKey]

                return (
                  <div key={fieldIndex} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    
                    {(() => {
                      switch (field.type as FieldType) {
                        case 'text':
                          return (
                            <Input
                              value={String(fieldValue || '')}
                              onChange={(e) => setSampleData(prev => ({
                                ...prev,
                                [fieldKey]: e.target.value
                              }))}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )
                        
                        case 'textarea':
                          return (
                            <Textarea
                              value={String(fieldValue || '')}
                              onChange={(e) => setSampleData(prev => ({
                                ...prev,
                                [fieldKey]: e.target.value
                              }))}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              rows={3}
                            />
                          )
                        
                        case 'number':
                          return (
                            <Input
                              type="number"
                              value={String(fieldValue || '')}
                              onChange={(e) => setSampleData(prev => ({
                                ...prev,
                                [fieldKey]: Number(e.target.value)
                              }))}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )
                        
                        case 'date':
                          return (
                            <Input
                              type="date"
                              value={String(fieldValue || '')}
                              onChange={(e) => setSampleData(prev => ({
                                ...prev,
                                [fieldKey]: e.target.value
                              }))}
                            />
                          )
                        
                        case 'select':
                          return (
                            <Select
                              value={String(fieldValue || '')}
                              onValueChange={(value) => setSampleData(prev => ({
                                ...prev,
                                [fieldKey]: value
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.options || []).map((option, optionIndex) => (
                                  <SelectItem key={optionIndex} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        
                        case 'checkbox':
                          return (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={Boolean(fieldValue)}
                                onCheckedChange={(checked) => setSampleData(prev => ({
                                  ...prev,
                                  [fieldKey]: checked
                                }))}
                              />
                              <Label className="text-sm">{field.label}</Label>
                            </div>
                          )
                        
                        case 'file':
                        case 'image':
                          return (
                            <Input
                              value={String(fieldValue || '')}
                              onChange={(e) => setSampleData(prev => ({
                                ...prev,
                                [fieldKey]: e.target.value
                              }))}
                              placeholder={`Sample ${field.type} filename`}
                            />
                          )
                        
                        default:
                          return (
                            <Input
                              value={String(fieldValue || '')}
                              onChange={(e) => setSampleData(prev => ({
                                ...prev,
                                [fieldKey]: e.target.value
                              }))}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )
                      }
                    })()}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Template Testing</span>
            <div className="flex items-center gap-2">
              <Select value={testMode} onValueChange={(value: 'manual' | 'auto') => setTestMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Data</SelectItem>
                  <SelectItem value="manual">Manual Data</SelectItem>
                </SelectContent>
              </Select>
              
              {testMode === 'auto' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSampleData}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetSampleData}
              >
                Reset
              </Button>
              
              <Button
                onClick={handleRunTest}
                disabled={isLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                {isLoading ? 'Testing...' : 'Run Test'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {testMode === 'auto' 
              ? 'Automatically generate sample data for all fields and test the template'
              : 'Manually enter sample data to test specific scenarios'
            }
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Sample Data</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-6">
          {testMode === 'manual' ? (
            templateData.sections.length > 0 ? (
              renderSampleDataForm()
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p>No sections available for testing</p>
                    <p className="text-sm">Add sections and fields to enable testing</p>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Auto-Generated Sample Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={generateSampleData} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Generate Sample Data
                  </Button>
                  
                  {Object.keys(sampleData).length > 0 && (
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-xs overflow-auto max-h-64">
                        {JSON.stringify(sampleData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {testResult ? (
            <div className="space-y-4">
              {/* Test Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {testResult.success ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <div className="font-semibold">
                        {testResult.success ? 'Test Passed' : 'Test Failed'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testResult.success 
                          ? 'Template rendered successfully with sample data'
                          : 'Template encountered errors during rendering'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              {testResult.performance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">
                          {testResult.performance.renderTime}ms
                        </div>
                        <div className="text-xs text-muted-foreground">Render Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {testResult.performance.fieldCount}
                        </div>
                        <div className="text-xs text-muted-foreground">Fields Processed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {testResult.performance.sectionCount}
                        </div>
                        <div className="text-xs text-muted-foreground">Sections Processed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Errors */}
              {testResult.errors && testResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-destructive">Test Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {testResult.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rendered Output */}
              {testResult.renderedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rendered Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                        {testResult.renderedTemplate}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="w-12 h-12 mx-auto mb-4" />
                  <p>No test results yet</p>
                  <p className="text-sm">Run a test to see the results here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}