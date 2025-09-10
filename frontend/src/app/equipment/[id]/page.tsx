'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeftIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  TagIcon
} from "@heroicons/react/24/outline"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Equipment {
  id: string
  tag: string
  name: string
  location: string
  type: string
  riskLevel: 'High' | 'Medium' | 'Low'
  status: 'Active' | 'Maintenance' | 'Inactive'
  lastInspection: string | null
  nextInspection: string | null
  priority: 'High' | 'Medium' | 'Low'
  description: string
  manufacturer: string
  model: string
  serialNumber: string
  installationDate: string
  specifications: Record<string, any>
}

interface Inspection {
  id: string
  date: string
  type: string
  inspector: string
  status: 'Completed' | 'In Progress' | 'Scheduled'
  findings: string
  recommendations: string
}

interface MaintenanceEvent {
  id: string
  title: string
  type: string
  scheduledDate: string
  completedDate: string | null
  status: 'Planned' | 'In Progress' | 'Completed' | 'Overdue'
  description: string
  cost: number
}

interface RBIData {
  level: number
  probabilityOfFailure: number
  consequenceOfFailure: number
  riskScore: number
  calculatedDate: string
  nextCalculationDate: string
  recommendations: string[]
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const equipmentId = params.id as string
  
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([])
  const [rbiData, setRBIData] = useState<RBIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadEquipmentData()
  }, [equipmentId])

  const loadEquipmentData = async () => {
    try {
      setLoading(true)
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock equipment data
      const mockEquipment: Equipment = {
        id: equipmentId,
        tag: 'TK-101',
        name: 'Storage Tank 101',
        location: 'Unit-3, Area-A',
        type: 'Pressure Vessel',
        riskLevel: 'High',
        status: 'Active',
        lastInspection: '2024-01-15',
        nextInspection: '2024-07-15',
        priority: 'High',
        description: 'Main storage tank for crude oil processing',
        manufacturer: 'ABC Manufacturing',
        model: 'PV-2000',
        serialNumber: 'SN123456789',
        installationDate: '2020-03-15',
        specifications: {
          capacity: '2000 m³',
          pressure: '15 bar',
          temperature: '150°C',
          material: 'Carbon Steel'
        }
      }
      
      // Mock inspections
      const mockInspections: Inspection[] = [
        {
          id: '1',
          date: '2024-01-15',
          type: 'Visual Inspection',
          inspector: 'John Smith',
          status: 'Completed',
          findings: 'Minor corrosion detected on external surface',
          recommendations: 'Apply protective coating within 3 months'
        },
        {
          id: '2',
          date: '2023-07-10',
          type: 'Ultrasonic Testing',
          inspector: 'Jane Doe',
          status: 'Completed',
          findings: 'Wall thickness within acceptable limits',
          recommendations: 'Continue regular monitoring'
        }
      ]
      
      // Mock maintenance events
      const mockMaintenanceEvents: MaintenanceEvent[] = [
        {
          id: '1',
          title: 'Protective Coating Application',
          type: 'Preventive',
          scheduledDate: '2024-04-15',
          completedDate: null,
          status: 'Planned',
          description: 'Apply protective coating to prevent corrosion',
          cost: 5000
        },
        {
          id: '2',
          title: 'Valve Replacement',
          type: 'Corrective',
          scheduledDate: '2024-02-01',
          completedDate: '2024-02-03',
          status: 'Completed',
          description: 'Replace faulty safety valve',
          cost: 2500
        }
      ]
      
      // Mock RBI data
      const mockRBIData: RBIData = {
        level: 2,
        probabilityOfFailure: 0.3,
        consequenceOfFailure: 0.8,
        riskScore: 0.24,
        calculatedDate: '2024-01-20',
        nextCalculationDate: '2024-07-20',
        recommendations: [
          'Increase inspection frequency',
          'Monitor corrosion rate closely',
          'Consider material upgrade'
        ]
      }
      
      setEquipment(mockEquipment)
      setInspections(mockInspections)
      setMaintenanceEvents(mockMaintenanceEvents)
      setRBIData(mockRBIData)
      
    } catch (error) {
      console.error('Failed to load equipment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Planned': return 'bg-purple-100 text-purple-800'
      case 'Overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Equipment Not Found</AlertTitle>
          <AlertDescription>
            The requested equipment could not be found.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{equipment.tag}</h1>
            <p className="text-muted-foreground">{equipment.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getRiskLevelColor(equipment.riskLevel)}>
            {equipment.riskLevel} Risk
          </Badge>
          <Badge className={getStatusColor(equipment.status)}>
            {equipment.status}
          </Badge>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{equipment.location}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{equipment.type}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Inspection</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {equipment.lastInspection ? 
                new Date(equipment.lastInspection).toLocaleDateString() : 
                'Never'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Inspection</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {equipment.nextInspection ? 
                new Date(equipment.nextInspection).toLocaleDateString() : 
                'Not Scheduled'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="rbi">RBI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                    <p className="text-sm">{equipment.manufacturer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Model</label>
                    <p className="text-sm">{equipment.model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                    <p className="text-sm">{equipment.serialNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Installation Date</label>
                    <p className="text-sm">{new Date(equipment.installationDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{equipment.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(equipment.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection History</CardTitle>
              <CardDescription>
                Complete history of inspections performed on this equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{inspection.type}</h4>
                        <Badge className={getStatusColor(inspection.status)}>
                          {inspection.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(inspection.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Inspector: {inspection.inspector}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium">Findings:</label>
                        <p className="text-sm">{inspection.findings}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Recommendations:</label>
                        <p className="text-sm">{inspection.recommendations}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Events</CardTitle>
              <CardDescription>
                Scheduled and completed maintenance activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                      <span className="text-sm font-medium">${event.cost.toLocaleString()}</span>
                    </div>
                    <p className="text-sm mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Scheduled: {new Date(event.scheduledDate).toLocaleDateString()}</span>
                      {event.completedDate && (
                        <span>Completed: {new Date(event.completedDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rbi" className="space-y-6">
          {rbiData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>RBI Calculation Results</CardTitle>
                  <CardDescription>
                    Latest risk-based inspection analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">RBI Level</label>
                      <p className="text-2xl font-bold">{rbiData.level}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Risk Score</label>
                      <p className="text-2xl font-bold">{rbiData.riskScore.toFixed(3)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Probability of Failure</label>
                      <p className="text-lg font-medium">{(rbiData.probabilityOfFailure * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Consequence of Failure</label>
                      <p className="text-lg font-medium">{(rbiData.consequenceOfFailure * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Calculation Date</label>
                    <p className="text-sm">{new Date(rbiData.calculatedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Next Calculation</label>
                    <p className="text-sm">{new Date(rbiData.nextCalculationDate).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>RBI Recommendations</CardTitle>
                  <CardDescription>
                    Actions recommended based on risk analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {rbiData.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary">•</span>
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}