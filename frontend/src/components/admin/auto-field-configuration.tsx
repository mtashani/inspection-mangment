'use client'

import { useState, useEffect } from 'react'
import {
  CogIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  CodeBracketIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export interface AutoFieldConfigurationProps {
  className?: string
}

type DataSource = 'inspection' | 'equipment' | 'user' | 'system' | 'calculation'

interface AutoFieldRule {
  id: string
  name: string
  description: string
  fieldName: string
  dataSource: DataSource
  sourcePath: string
  transformation?: string
  condition?: string
  fallbackValue?: string
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
  lastTested?: string
  testResult?: 'success' | 'error' | 'warning'
  testMessage?: string
}

interface DataSourceInfo {
  source: DataSource
  label: string
  icon: React.ReactNode
  description: string
  availablePaths: string[]
}

interface TestResult {
  success: boolean
  value?: any
  error?: string
  warnings?: string[]
  executionTime: number
}

export function AutoFieldConfiguration({ className }: AutoFieldConfigurationProps) {
  const [rules, setRules] = useState<AutoFieldRule[]>([])
  const [dataSources, setDataSources] = useState<DataSourceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<DataSource | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all')
  
  // Dialog states
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoFieldRule | null>(null)
  const [testingRule, setTestingRule] = useState<AutoFieldRule | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fieldName: '',
    dataSource: 'inspection' as DataSource,
    sourcePath: '',
    transformation: '',
    condition: '',
    fallbackValue: '',
    isActive: true,
    priority: 1
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Load data on mount
  useEffect(() => {
    loadRules()
    loadDataSources()
  }, [])

  const loadRules = async () => {
    try {
      setIsLoading(true)
      
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock rules data
      const mockRules: AutoFieldRule[] = [
        {
          id: '1',
          name: 'Inspector Name Auto-fill',
          description: 'Automatically fill inspector name from current user',
          fieldName: 'inspector_name',
          dataSource: 'user',
          sourcePath: 'user.fullName',
          isActive: true,
          priority: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          lastTested: '2024-01-20T14:20:00Z',
          testResult: 'success'
        },
        {
          id: '2',
          name: 'Equipment Tag Number',
          description: 'Fill equipment tag from selected equipment',
          fieldName: 'equipment_tag',
          dataSource: 'equipment',
          sourcePath: 'equipment.tagNumber',
          isActive: true,
          priority: 2,
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-18T09:15:00Z',
          lastTested: '2024-01-19T11:30:00Z',
          testResult: 'success'
        },
        {
          id: '3',
          name: 'Inspection Date Default',
          description: 'Set inspection date to current date',
          fieldName: 'inspection_date',
          dataSource: 'system',
          sourcePath: 'system.currentDate',
          transformation: 'formatDate(value, "YYYY-MM-DD")',
          isActive: true,
          priority: 3,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-22T16:45:00Z',
          lastTested: '2024-01-22T16:50:00Z',
          testResult: 'success'
        },
        {
          id: '4',
          name: 'Equipment Location',
          description: 'Auto-fill location from equipment data',
          fieldName: 'location',
          dataSource: 'equipment',
          sourcePath: 'equipment.location',
          condition: 'equipment.id !== null',
          fallbackValue: 'Unknown Location',
          isActive: false,
          priority: 4,
          createdAt: '2024-01-12T00:00:00Z',
          updatedAt: '2024-01-25T12:20:00Z',
          lastTested: '2024-01-25T12:25:00Z',
          testResult: 'warning',
          testMessage: 'Fallback value used in 15% of cases'
        }
      ]
      
      setRules(mockRules)
    } catch (err) {
      console.error('Failed to load auto-field rules:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDataSources = async () => {
    try {
      // Mock data sources
      const mockDataSources: DataSourceInfo[] = [
        {
          source: 'inspection',
          label: 'Inspection Data',
          icon: <CheckCircleIcon className="h-4 w-4" />,
          description: 'Data from the current inspection context',
          availablePaths: [
            'inspection.id',
            'inspection.number',
            'inspection.date',
            'inspection.type',
            'inspection.status'
          ]
        },
        {
          source: 'equipment',
          label: 'Equipment Data',
          icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
          description: 'Data from the selected equipment',
          availablePaths: [
            'equipment.id',
            'equipment.tagNumber',
            'equipment.name',
            'equipment.type',
            'equipment.location',
            'equipment.installationDate',
            'equipment.designPressure',
            'equipment.designTemperature'
          ]
        },
        {
          source: 'user',
          label: 'User Data',
          icon: <UserIcon className="h-4 w-4" />,
          description: 'Data from the current user',
          availablePaths: [
            'user.id',
            'user.fullName',
            'user.email',
            'user.role',
            'user.department',
            'user.certifications'
          ]
        },
        {
          source: 'system',
          label: 'System Data',
          icon: <CogIcon className="h-4 w-4" />,
          description: 'System-generated data and timestamps',
          availablePaths: [
            'system.currentDate',
            'system.currentTime',
            'system.currentUser',
            'system.sessionId',
            'system.version'
          ]
        },
        {
          source: 'calculation',
          label: 'Calculated Values',
          icon: <CodeBracketIcon className="h-4 w-4" />,
          description: 'Values calculated from other fields',
          availablePaths: [
            'calculation.riskScore',
            'calculation.nextInspectionDate',
            'calculation.remainingLife',
            'calculation.corrosionRate'
          ]
        }
      ]
      
      setDataSources(mockDataSources)
    } catch (err) {
      console.error('Failed to load data sources:', err)
    }
  }

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = !searchQuery || 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.fieldName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSource = sourceFilter === 'all' || rule.dataSource === sourceFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && rule.isActive) ||
      (statusFilter === 'inactive' && !rule.isActive)
    
    return matchesSearch && matchesSource && matchesStatus
  })

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      const errors: Record<string, string> = {}
      if (!formData.name.trim()) errors.name = 'Name is required'
      if (!formData.fieldName.trim()) errors.fieldName = 'Field name is required'
      if (!formData.sourcePath.trim()) errors.sourcePath = 'Source path is required'
      
      setFormErrors(errors)
      if (Object.keys(errors).length > 0) return

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (editingRule) {
        // Update existing rule
        const updatedRule: AutoFieldRule = {
          ...editingRule,
          ...formData,
          updatedAt: new Date().toISOString()
        }
        setRules(prev => prev.map(r => r.id === editingRule.id ? updatedRule : r))
      } else {
        // Create new rule
        const newRule: AutoFieldRule = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setRules(prev => [...prev, newRule])
      }
      
      handleCloseDialog()
    } catch (err) {
      console.error('Failed to save auto-field rule:', err)
    }
  }

  // Handle test rule
  const handleTestRule = async (rule: AutoFieldRule) => {
    try {
      setTestingRule(rule)
      setShowTestDialog(true)
      setTestResult(null)
      
      // Mock test execution
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock test result
      const mockResult: TestResult = {
        success: Math.random() > 0.2,
        value: rule.dataSource === 'user' ? 'John Smith' : 
               rule.dataSource === 'equipment' ? 'V-101' :
               rule.dataSource === 'system' ? new Date().toISOString().split('T')[0] :
               'Sample Value',
        executionTime: Math.random() * 100 + 50,
        warnings: Math.random() > 0.7 ? ['Fallback value may be used'] : undefined
      }
      
      if (!mockResult.success) {
        mockResult.error = 'Source path not found or invalid transformation'
      }
      
      setTestResult(mockResult)
      
      // Update rule test result
      const updatedRule = {
        ...rule,
        lastTested: new Date().toISOString(),
        testResult: mockResult.success ? 'success' : 'error',
        testMessage: mockResult.error || (mockResult.warnings?.length ? mockResult.warnings[0] : undefined)
      }
      setRules(prev => prev.map(r => r.id === rule.id ? updatedRule : r))
      
    } catch (err) {
      console.error('Failed to test rule:', err)
      setTestResult({
        success: false,
        error: 'Test execution failed',
        executionTime: 0
      })
    }
  }

  // Handle dialog close
  const handleCloseDialog = () => {
    setShowRuleDialog(false)
    setEditingRule(null)
    setFormData({
      name: '',
      description: '',
      fieldName: '',
      dataSource: 'inspection',
      sourcePath: '',
      transformation: '',
      condition: '',
      fallbackValue: '',
      isActive: true,
      priority: 1
    })
    setFormErrors({})
  }

  // Handle edit
  const handleEdit = (rule: AutoFieldRule) => {
    setFormData({
      name: rule.name,
      description: rule.description,
      fieldName: rule.fieldName,
      dataSource: rule.dataSource,
      sourcePath: rule.sourcePath,
      transformation: rule.transformation || '',
      condition: rule.condition || '',
      fallbackValue: rule.fallbackValue || '',
      isActive: rule.isActive,
      priority: rule.priority
    })
    setEditingRule(rule)
    setShowRuleDialog(true)
  }

  // Handle delete
  const handleDelete = async (ruleId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))
      setRules(prev => prev.filter(r => r.id !== ruleId))
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }

  // Get test result display
  const getTestResultDisplay = (result?: 'success' | 'error' | 'warning') => {
    switch (result) {
      case 'success':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="h-3 w-3" /> }
      case 'error':
        return { color: 'bg-red-100 text-red-800', icon: <ExclamationTriangleIcon className="h-3 w-3" /> }
      case 'warning':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <ExclamationTriangleIcon className="h-3 w-3" /> }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <InformationCircleIcon className="h-3 w-3" /> }
    }
  }

  // Get data source info
  const getDataSourceInfo = (source: DataSource) => {
    return dataSources.find(ds => ds.source === source)
  }

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

  if (isLoading) {
    return <AutoFieldConfigurationSkeleton />
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CogIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Auto-Field Configuration</h1>
        </div>
        <Button onClick={() => setShowRuleDialog(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Auto-Field Rule
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <InformationCircleIcon className="h-4 w-4" />
        <AlertDescription>
          Auto-field rules automatically populate form fields with data from various sources. 
          Configure rules to improve user experience and data consistency.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Auto-Field Rules</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rules..."
                    className="pl-10"
                  />
                </div>
                <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {dataSources.map((source) => (
                      <SelectItem key={source.source} value={source.source}>
                        <div className="flex items-center space-x-2">
                          {source.icon}
                          <span>{source.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Rules Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Data Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Test</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => {
                    const sourceInfo = getDataSourceInfo(rule.dataSource)
                    const testDisplay = getTestResultDisplay(rule.testResult)
                    
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {rule.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {rule.fieldName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {sourceInfo?.icon}
                            <span className="text-sm">{sourceInfo?.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            'text-xs',
                            rule.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          )}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rule.lastTested ? (
                            <div className="flex items-center space-x-2">
                              <Badge className={cn('text-xs', testDisplay.color)}>
                                <div className="flex items-center space-x-1">
                                  {testDisplay.icon}
                                  <span>{rule.testResult}</span>
                                </div>
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(rule.lastTested)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never tested</span>
                          )}
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestRule(rule)}
                            >
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(rule)}
                            >
                              <CogIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSources.map((source) => (
              <Card key={source.source}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    {source.icon}
                    <span>{source.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {source.description}
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Available Paths:</Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {source.availablePaths.map((path) => (
                        <Badge key={path} variant="outline" className="text-xs font-mono block w-fit">
                          {path}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Auto-Field Rule' : 'New Auto-Field Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure automatic field population from data sources.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter rule name"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldName">Target Field Name</Label>
                <Input
                  id="fieldName"
                  value={formData.fieldName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fieldName: e.target.value }))}
                  placeholder="field_name"
                  className="font-mono"
                />
                {formErrors.fieldName && (
                  <p className="text-sm text-red-600">{formErrors.fieldName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this rule does"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source</Label>
                <Select 
                  value={formData.dataSource} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dataSource: value as DataSource, sourcePath: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map((source) => (
                      <SelectItem key={source.source} value={source.source}>
                        <div className="flex items-center space-x-2">
                          {source.icon}
                          <span>{source.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourcePath">Source Path</Label>
                <Select 
                  value={formData.sourcePath} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sourcePath: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select path" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDataSourceInfo(formData.dataSource)?.availablePaths.map((path) => (
                      <SelectItem key={path} value={path}>
                        <span className="font-mono text-sm">{path}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.sourcePath && (
                  <p className="text-sm text-red-600">{formErrors.sourcePath}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transformation">Transformation (Optional)</Label>
              <Input
                id="transformation"
                value={formData.transformation}
                onChange={(e) => setFormData(prev => ({ ...prev, transformation: e.target.value }))}
                placeholder="e.g., formatDate(value, 'YYYY-MM-DD')"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                JavaScript expression to transform the value
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition (Optional)</Label>
              <Input
                id="condition"
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                placeholder="e.g., equipment.id !== null"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Condition that must be true for the rule to execute
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fallbackValue">Fallback Value</Label>
                <Input
                  id="fallbackValue"
                  value={formData.fallbackValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, fallbackValue: e.target.value }))}
                  placeholder="Default value"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingRule ? 'Update' : 'Create'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Auto-Field Rule</DialogTitle>
            <DialogDescription>
              Testing "{testingRule?.name}" rule execution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {testResult ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span className={cn(
                    'font-medium',
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  )}>
                    {testResult.success ? 'Test Passed' : 'Test Failed'}
                  </span>
                </div>
                
                {testResult.success && testResult.value !== undefined && (
                  <div>
                    <Label>Resolved Value:</Label>
                    <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                      {JSON.stringify(testResult.value, null, 2)}
                    </div>
                  </div>
                )}
                
                {testResult.error && (
                  <Alert variant="destructive">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertDescription>{testResult.error}</AlertDescription>
                  </Alert>
                )}
                
                {testResult.warnings && testResult.warnings.length > 0 && (
                  <Alert>
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {testResult.warnings.map((warning, index) => (
                          <div key={index}>{warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="text-sm text-muted-foreground">
                  Execution time: {testResult.executionTime.toFixed(2)}ms
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 py-4">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Testing rule execution...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Close
            </Button>
            {testResult && !testResult.success && (
              <Button onClick={() => handleTestRule(testingRule!)}>
                Retry Test
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Loading Skeleton Component
function AutoFieldConfigurationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Alert Skeleton */}
      <Skeleton className="h-16 w-full" />

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export type { AutoFieldConfigurationProps }