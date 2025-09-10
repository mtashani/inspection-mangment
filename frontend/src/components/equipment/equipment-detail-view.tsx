'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CogIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  EquipmentDetail, 
  EquipmentStatus, 
  RiskLevel, 
  InspectionHistoryItem,
  MaintenanceHistoryItem,
  ReportSummary,
  EquipmentSpecification,
  RBICalculationResult
} from '@/types/equipment'

export interface EquipmentDetailViewProps {
  equipmentId: string
  onBack: () => void
  onEdit: () => void
  onViewReport: (reportId: string) => void
  onCreateReport: () => void
  onScheduleInspection: () => void
  onScheduleMaintenance: () => void
  onRecalculateRBI: () => void
  className?: string
}

export function EquipmentDetailView({
  equipmentId,
  onBack,
  onEdit,
  onViewReport,
  onCreateReport,
  onScheduleInspection,
  onScheduleMaintenance,
  onRecalculateRBI,
  className
}: EquipmentDetailViewProps) {
  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Load equipment details
  useEffect(() => {
    loadEquipmentDetails()
  }, [equipmentId])

  const loadEquipmentDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with actual API response
      const mockEquipment: EquipmentDetail = {
        id: equipmentId,
        tagNumber: 'V-101',
        name: 'Main Reactor Vessel',
        location: 'Unit 1 - Reactor Area',
        type: 'Pressure Vessel',
        description: 'Primary reactor vessel for hydrocracking process',
        status: 'ACTIVE',
        installationDate: '2020-01-15',
        designPressure: 150,
        designTemperature: 450,
        material: 'SA-516 Grade 70',
        riskLevel: 'HIGH',
        lastInspectionDate: '2024-01-15',
        nextInspectionDate: '2025-01-15',
        inspectionStatus: 'COMPLETED',
        maintenanceStatus: 'UP_TO_DATE',
        rbiCalculationDate: '2024-01-20',
        criticality: 'Critical',
        unit: 'Unit 1',
        createdAt: '2020-01-01',
        updatedAt: '2024-01-20',
        inspectionHistory: [
          {
            id: '1',
            inspectionNumber: 'INS-2024-001',
            inspectionDate: '2024-01-15',
            inspectorName: 'John Smith',
            status: 'Completed',
            findings: 'Minor surface corrosion detected',
            recommendations: 'Continue monitoring, next inspection in 12 months',
            reportCount: 3
          }
        ],
        maintenanceHistory: [
          {
            id: '1',
            eventNumber: 'MNT-2023-045',
            eventType: 'Preventive',
            scheduledDate: '2023-12-01',
            completedDate: '2023-12-03',
            status: 'Completed',
            description: 'Annual preventive maintenance',
            cost: 15000
          }
        ],
        reports: [
          {
            id: '1',
            templateName: 'Pressure Vessel Inspection',
            createdDate: '2024-01-15',
            status: 'Approved',
            createdBy: 'John Smith'
          }
        ],
        rbiData: {
          equipmentId: equipmentId,
          calculationLevel: 2,
          requestedLevel: 3,
          fallbackOccurred: true,
          nextInspectionDate: '2025-01-15',
          riskLevel: 'HIGH',
          pofScore: 7.5,
          cofScores: {
            safety: 8.0,
            environmental: 6.5,
            economic: 7.0
          },
          confidenceScore: 0.75,
          dataQualityScore: 0.80,
          calculationTimestamp: '2024-01-20T10:30:00Z',
          inputParameters: {},
          missingData: ['corrosion_rate_history'],
          estimatedParameters: ['wall_thickness']
        },
        specifications: [
          {
            id: '1',
            name: 'Design Pressure',
            value: '150',
            unit: 'psig',
            category: 'Design'
          },
          {
            id: '2',
            name: 'Design Temperature',
            value: '450',
            unit: '°F',
            category: 'Design'
          }
        ]
      }
      
      setEquipment(mockEquipment)
    } catch (err) {
      console.error('Failed to load equipment details:', err)
      setError('Failed to load equipment details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get status display
  const getStatusDisplay = (status: EquipmentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircleIcon className="h-4 w-4" />
        }
      case 'INACTIVE':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <XCircleIcon className="h-4 w-4" />
        }
      case 'MAINTENANCE':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <ClockIcon className="h-4 w-4" />
        }
      case 'OUT_OF_SERVICE':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircleIcon className="h-4 w-4" />
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <InformationCircleIcon className="h-4 w-4" />
        }
    }
  }

  // Get risk level display
  const getRiskDisplay = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircleIcon className="h-4 w-4" />
        }
      case 'MEDIUM':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <ExclamationTriangleIcon className="h-4 w-4" />
        }
      case 'HIGH':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <ExclamationTriangleIcon className="h-4 w-4" />
        }
      case 'CRITICAL':
        return {
          color: 'bg-red-200 text-red-900',
          icon: <ExclamationTriangleIcon className="h-4 w-4" />
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <InformationCircleIcon className="h-4 w-4" />
        }
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return <EquipmentDetailSkeleton />
  }

  if (error || !equipment) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            {error || 'Equipment not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay(equipment.status)
  const riskDisplay = getRiskDisplay(equipment.riskLevel)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline">{equipment.tagNumber}</Badge>
              <Badge className={cn('text-xs', statusDisplay.color)}>
                <div className="flex items-center space-x-1">
                  {statusDisplay.icon}
                  <span>{equipment.status.replace('_', ' ')}</span>
                </div>
              </Badge>
              <Badge className={cn('text-xs', riskDisplay.color)}>
                <div className="flex items-center space-x-1">
                  {riskDisplay.icon}
                  <span>{equipment.riskLevel} Risk</span>
                </div>
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCreateReport}>
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Create Report
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{equipment.location}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">{equipment.type}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Last Inspection</div>
                <div className="font-medium">
                  {equipment.lastInspectionDate ? formatDate(equipment.lastInspectionDate) : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Next Inspection</div>
                <div className="font-medium">
                  {equipment.nextInspectionDate ? formatDate(equipment.nextInspectionDate) : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="rbi">RBI Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <InformationCircleIcon className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipment.description && (
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="font-medium">{equipment.description}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Installation Date</div>
                    <div className="font-medium">{formatDate(equipment.installationDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Unit</div>
                    <div className="font-medium">{equipment.unit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Material</div>
                    <div className="font-medium">{equipment.material}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Criticality</div>
                    <div className="font-medium">{equipment.criticality}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CogIcon className="h-5 w-5" />
                  <span>Specifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equipment.specifications.map((spec) => (
                    <div key={spec.id} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{spec.name}</span>
                      <span className="font-medium">
                        {spec.value} {spec.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Inspection History</h3>
            <Button onClick={onScheduleInspection}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Schedule Inspection
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inspection Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.inspectionHistory.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-medium">
                        {inspection.inspectionNumber}
                      </TableCell>
                      <TableCell>{formatDate(inspection.inspectionDate)}</TableCell>
                      <TableCell>{inspection.inspectorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inspection.status}</Badge>
                      </TableCell>
                      <TableCell>{inspection.reportCount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Maintenance History</h3>
            <Button onClick={onScheduleMaintenance}>
              <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.maintenanceHistory.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell className="font-medium">
                        {maintenance.eventNumber}
                      </TableCell>
                      <TableCell>{maintenance.eventType}</TableCell>
                      <TableCell>{formatDate(maintenance.scheduledDate)}</TableCell>
                      <TableCell>
                        {maintenance.completedDate ? formatDate(maintenance.completedDate) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{maintenance.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {maintenance.cost ? formatCurrency(maintenance.cost) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Professional Reports</h3>
            <Button onClick={onCreateReport}>
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.templateName}
                      </TableCell>
                      <TableCell>{formatDate(report.createdDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.status}</Badge>
                      </TableCell>
                      <TableCell>{report.createdBy}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onViewReport(report.id)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RBI Data Tab */}
        <TabsContent value="rbi" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">RBI Calculation Data</h3>
            <Button onClick={onRecalculateRBI}>
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Recalculate RBI
            </Button>
          </div>
          {equipment.rbiData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Risk Level</div>
                      <Badge className={cn('text-xs', getRiskDisplay(equipment.rbiData.riskLevel).color)}>
                        {equipment.rbiData.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">PoF Score</div>
                      <div className="font-medium">{equipment.rbiData.pofScore}</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">CoF Scores</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Safety</span>
                        <span className="font-medium">{equipment.rbiData.cofScores.safety}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Environmental</span>
                        <span className="font-medium">{equipment.rbiData.cofScores.environmental}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Economic</span>
                        <span className="font-medium">{equipment.rbiData.cofScores.economic}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calculation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Calculation Level</div>
                      <div className="font-medium">{equipment.rbiData.calculationLevel}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Confidence Score</div>
                      <div className="font-medium">{(equipment.rbiData.confidenceScore * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Data Quality</div>
                      <div className="font-medium">{(equipment.rbiData.dataQualityScore * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Next Inspection</div>
                      <div className="font-medium">{formatDate(equipment.rbiData.nextInspectionDate)}</div>
                    </div>
                  </div>
                  {equipment.rbiData.fallbackOccurred && (
                    <Alert>
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        Calculation fallback occurred due to insufficient data.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Loading Skeleton Component
function EquipmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-64" />
            <div className="flex items-center space-x-2 mt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Quick Info Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export type { EquipmentDetailViewProps }