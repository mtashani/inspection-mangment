'use client'

import { useState, useEffect } from 'react'
import {
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { RBIConfiguration, ScoringTable, RiskMatrix } from '@/types/equipment'

export interface RBIConfigurationManagementProps {
  className?: string
}

interface ConfigurationFormData {
  name: string
  level: number
  description: string
  isActive: boolean
  settings: Record<string, any>
}

export function RBIConfigurationManagement({ className }: RBIConfigurationManagementProps) {
  const [configurations, setConfigurations] = useState<RBIConfiguration[]>([])
  const [scoringTables, setScoringTables] = useState<ScoringTable[]>([])
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrix | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all')
  const [activeTab, setActiveTab] = useState('configurations')
  
  // Dialog states
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<RBIConfiguration | null>(null)
  const [deletingConfig, setDeleteingConfig] = useState<RBIConfiguration | null>(null)
  const [previewConfig, setPreviewConfig] = useState<RBIConfiguration | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<ConfigurationFormData>({
    name: '',
    level: 1,
    description: '',
    isActive: true,
    settings: {}
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Load data on mount
  useEffect(() => {
    loadConfigurations()
    loadScoringTables()
    loadRiskMatrix()
  }, [])

  const loadConfigurations = async () => {
    try {
      setIsLoading(true)
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      const mockConfigurations: RBIConfiguration[] = [
        {
          id: '1',
          name: 'Level 1 - Basic Assessment',
          level: 1,
          isActive: true,
          description: 'Basic RBI assessment using simplified parameters',
          settings: {
            useGenericData: true,
            fallbackEnabled: true,
            confidenceThreshold: 0.5
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Level 2 - Intermediate Assessment',
          level: 2,
          isActive: true,
          description: 'Intermediate RBI assessment with equipment-specific data',
          settings: {
            useGenericData: false,
            fallbackEnabled: true,
            confidenceThreshold: 0.7,
            requireInspectionHistory: true
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-20T14:20:00Z'
        },
        {
          id: '3',
          name: 'Level 3 - Advanced Assessment',
          level: 3,
          isActive: false,
          description: 'Advanced RBI assessment with detailed modeling',
          settings: {
            useGenericData: false,
            fallbackEnabled: false,
            confidenceThreshold: 0.9,
            requireInspectionHistory: true,
            requireDetailedModeling: true
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-10T09:15:00Z'
        }
      ]
      
      setConfigurations(mockConfigurations)
    } catch (err) {
      console.error('Failed to load configurations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadScoringTables = async () => {
    try {
      // Mock scoring tables data
      const mockScoringTables: ScoringTable[] = [
        {
          parameterName: 'Corrosion Rate',
          scoringRules: {
            'low': 1,
            'medium': 5,
            'high': 9
          },
          weights: {
            'safety': 0.4,
            'environmental': 0.3,
            'economic': 0.3
          },
          description: 'Scoring rules for equipment corrosion rate assessment'
        },
        {
          parameterName: 'Operating Pressure',
          scoringRules: {
            'low': 2,
            'medium': 6,
            'high': 10
          },
          weights: {
            'safety': 0.5,
            'environmental': 0.2,
            'economic': 0.3
          },
          description: 'Scoring rules for operating pressure assessment'
        }
      ]
      
      setScoringTables(mockScoringTables)
    } catch (err) {
      console.error('Failed to load scoring tables:', err)
    }
  }

  const loadRiskMatrix = async () => {
    try {
      // Mock risk matrix data
      const mockRiskMatrix: RiskMatrix = {
        matrix: {
          '1,1': 'LOW', '1,2': 'LOW', '1,3': 'MEDIUM',
          '2,1': 'LOW', '2,2': 'MEDIUM', '2,3': 'HIGH',
          '3,1': 'MEDIUM', '3,2': 'HIGH', '3,3': 'CRITICAL'
        },
        inspectionIntervals: {
          'LOW': 60,
          'MEDIUM': 36,
          'HIGH': 24,
          'CRITICAL': 12
        },
        fallbackSafetyFactors: {
          'dataQuality': 0.8,
          'confidence': 0.7,
          'generic': 0.5
        }
      }
      
      setRiskMatrix(mockRiskMatrix)
    } catch (err) {
      console.error('Failed to load risk matrix:', err)
    }
  }

  // Filter configurations
  const filteredConfigurations = configurations.filter(config => {
    const matchesSearch = !searchQuery || 
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLevel = levelFilter === 'all' || config.level === levelFilter
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && config.isActive) ||
      (statusFilter === 'inactive' && !config.isActive)
    
    return matchesSearch && matchesLevel && matchesStatus
  })

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      const errors: Record<string, string> = {}
      if (!formData.name.trim()) errors.name = 'Name is required'
      if (!formData.description.trim()) errors.description = 'Description is required'
      if (formData.level < 1 || formData.level > 3) errors.level = 'Level must be between 1 and 3'
      
      setFormErrors(errors)
      if (Object.keys(errors).length > 0) return

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (editingConfig) {
        // Update existing configuration
        const updatedConfig: RBIConfiguration = {
          ...editingConfig,
          ...formData,
          updatedAt: new Date().toISOString()
        }
        setConfigurations(prev => prev.map(c => c.id === editingConfig.id ? updatedConfig : c))
      } else {
        // Create new configuration
        const newConfig: RBIConfiguration = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setConfigurations(prev => [...prev, newConfig])
      }
      
      handleCloseDialog()
    } catch (err) {
      console.error('Failed to save configuration:', err)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingConfig) return
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setConfigurations(prev => prev.filter(c => c.id !== deletingConfig.id))
      setShowDeleteDialog(false)
      setDeleteingConfig(null)
    } catch (err) {
      console.error('Failed to delete configuration:', err)
    }
  }

  // Handle clone
  const handleClone = (config: RBIConfiguration) => {
    setFormData({
      name: `${config.name} (Copy)`,
      level: config.level,
      description: config.description,
      isActive: false,
      settings: { ...config.settings }
    })
    setEditingConfig(null)
    setShowConfigDialog(true)
  }

  // Handle dialog close
  const handleCloseDialog = () => {
    setShowConfigDialog(false)
    setEditingConfig(null)
    setFormData({
      name: '',
      level: 1,
      description: '',
      isActive: true,
      settings: {}
    })
    setFormErrors({})
  }

  // Handle edit
  const handleEdit = (config: RBIConfiguration) => {
    setFormData({
      name: config.name,
      level: config.level,
      description: config.description,
      isActive: config.isActive,
      settings: { ...config.settings }
    })
    setEditingConfig(config)
    setShowConfigDialog(true)
  }

  // Handle preview
  const handlePreview = (config: RBIConfiguration) => {
    setPreviewConfig(config)
    setShowPreviewDialog(true)
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
    return <RBIConfigurationSkeleton />
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CogIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">RBI Configuration Management</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowConfigDialog(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Configuration
          </Button>
        </div>
      </div>

      {/* Admin Warning */}
      <Alert>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Administrator Access Required:</strong> RBI configuration changes affect all calculations. 
          Please ensure proper testing before activating new configurations.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="scoring-tables">Scoring Tables</TabsTrigger>
          <TabsTrigger value="risk-matrix">Risk Matrix</TabsTrigger>
        </TabsList>

        {/* Configurations Tab */}
        <TabsContent value="configurations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search configurations..."
                    className="pl-10"
                  />
                </div>
                <Select value={levelFilter.toString()} onValueChange={(value) => setLevelFilter(value === 'all' ? 'all' : Number(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1">Level 1</SelectItem>
                    <SelectItem value="2">Level 2</SelectItem>
                    <SelectItem value="3">Level 3</SelectItem>
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

          {/* Configurations Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigurations.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {config.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'text-xs',
                          config.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        )}>
                          <div className="flex items-center space-x-1">
                            {config.isActive ? 
                              <CheckCircleIcon className="h-3 w-3" /> : 
                              <XCircleIcon className="h-3 w-3" />
                            }
                            <span>{config.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {config.description}
                      </TableCell>
                      <TableCell>{formatDate(config.updatedAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <CogIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(config)}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(config)}>
                              <PencilIcon className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(config)}>
                              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setDeleteingConfig(config)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Tables Tab */}
        <TabsContent value="scoring-tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scoringTables.map((table, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{table.parameterName}</h4>
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{table.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Scoring Rules</h5>
                          <div className="space-y-1">
                            {Object.entries(table.scoringRules).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="capitalize">{key}</span>
                                <span className="font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-2">Weights</h5>
                          <div className="space-y-1">
                            {Object.entries(table.weights).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="capitalize">{key}</span>
                                <span className="font-medium">{(value * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Matrix Tab */}
        <TabsContent value="risk-matrix" className="space-y-4">
          {riskMatrix && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div></div>
                    <div className="text-center font-medium">Low CoF</div>
                    <div className="text-center font-medium">Med CoF</div>
                    <div className="text-center font-medium">High CoF</div>
                    
                    <div className="font-medium">Low PoF</div>
                    <div className="p-2 text-center bg-green-100 text-green-800 rounded">LOW</div>
                    <div className="p-2 text-center bg-green-100 text-green-800 rounded">LOW</div>
                    <div className="p-2 text-center bg-yellow-100 text-yellow-800 rounded">MED</div>
                    
                    <div className="font-medium">Med PoF</div>
                    <div className="p-2 text-center bg-green-100 text-green-800 rounded">LOW</div>
                    <div className="p-2 text-center bg-yellow-100 text-yellow-800 rounded">MED</div>
                    <div className="p-2 text-center bg-red-100 text-red-800 rounded">HIGH</div>
                    
                    <div className="font-medium">High PoF</div>
                    <div className="p-2 text-center bg-yellow-100 text-yellow-800 rounded">MED</div>
                    <div className="p-2 text-center bg-red-100 text-red-800 rounded">HIGH</div>
                    <div className="p-2 text-center bg-red-200 text-red-900 rounded">CRIT</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inspection Intervals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(riskMatrix.inspectionIntervals).map(([risk, months]) => (
                      <div key={risk} className="flex items-center justify-between">
                        <Badge className={cn(
                          'text-xs',
                          risk === 'LOW' ? 'bg-green-100 text-green-800' :
                          risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          risk === 'HIGH' ? 'bg-red-100 text-red-800' :
                          'bg-red-200 text-red-900'
                        )}>
                          {risk}
                        </Badge>
                        <span className="font-medium">{months} months</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Configuration' : 'New Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure RBI calculation parameters and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Configuration name"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select 
                  value={formData.level.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, level: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Basic</SelectItem>
                    <SelectItem value="2">Level 2 - Intermediate</SelectItem>
                    <SelectItem value="3">Level 3 - Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.level && (
                  <p className="text-sm text-red-600">{formErrors.level}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Configuration description"
                rows={3}
              />
              {formErrors.description && (
                <p className="text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active Configuration</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingConfig ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingConfig?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configuration Preview</DialogTitle>
            <DialogDescription>
              Preview of "{previewConfig?.name}" configuration settings.
            </DialogDescription>
          </DialogHeader>
          {previewConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{previewConfig.name}</p>
                </div>
                <div>
                  <Label>Level</Label>
                  <p className="font-medium">Level {previewConfig.level}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={cn(
                    'text-xs',
                    previewConfig.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  )}>
                    {previewConfig.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="font-medium">{formatDate(previewConfig.updatedAt)}</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{previewConfig.description}</p>
              </div>
              <Separator />
              <div>
                <Label>Settings</Label>
                <pre className="text-xs bg-gray-50 p-3 rounded mt-2 overflow-auto">
                  {JSON.stringify(previewConfig.settings, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Loading Skeleton Component
function RBIConfigurationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-36" />
        </div>
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
              <Skeleton className="h-9 w-32" />
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
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export type { RBIConfigurationManagementProps }