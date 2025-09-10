'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  EyeIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { RBICalculationResult, RBIConfiguration, Equipment, RiskLevel } from '@/types/equipment'

export interface RBICalculationInterfaceProps {
  equipmentId: string
  onCalculationComplete: (result: RBICalculationResult) => void
  onViewHistory: () => void
  onViewConfiguration: () => void
  className?: string
}

interface CalculationStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  duration?: number
  error?: string
}

interface CalculationProgress {
  currentStep: number
  totalSteps: number
  overallProgress: number
  estimatedTimeRemaining: number
  steps: CalculationStep[]
}

export function RBICalculationInterface({
  equipmentId,
  onCalculationComplete,
  onViewHistory,
  onViewConfiguration,
  className
}: RBICalculationInterfaceProps) {
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [configurations, setConfigurations] = useState<RBIConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<number>(2)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState<CalculationProgress | null>(null)
  const [calculationResult, setCalculationResult] = useState<RBICalculationResult | null>(null)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    loadEquipmentData()
    loadConfigurations()
  }, [equipmentId])

  const loadEquipmentData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock equipment data
      const mockEquipment: Equipment = {
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
        updatedAt: '2024-01-20'
      }
      
      setEquipment(mockEquipment)
    } catch (err) {
      console.error('Failed to load equipment data:', err)
      setError('Failed to load equipment data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadConfigurations = async () => {
    try {
      // Mock configurations data
      const mockConfigurations: RBIConfiguration[] = [
        {
          id: '1',
          name: 'Level 1 - Basic Assessment',
          level: 1,
          isActive: true,
          description: 'Basic RBI assessment using simplified parameters',
          settings: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Level 2 - Intermediate Assessment',
          level: 2,
          isActive: true,
          description: 'Intermediate RBI assessment with equipment-specific data',
          settings: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-20T14:20:00Z'
        },
        {
          id: '3',
          name: 'Level 3 - Advanced Assessment',
          level: 3,
          isActive: true,
          description: 'Advanced RBI assessment with detailed modeling',
          settings: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-10T09:15:00Z'
        }
      ]
      
      setConfigurations(mockConfigurations.filter(c => c.isActive))
      if (mockConfigurations.length > 0) {
        setSelectedConfig(mockConfigurations[1].id) // Default to Level 2
      }
    } catch (err) {
      console.error('Failed to load configurations:', err)
    }
  }

  // Start calculation
  const startCalculation = async () => {
    if (!selectedConfig || !equipment) return

    try {
      setIsCalculating(true)
      setShowProgressDialog(true)
      setCalculationResult(null)
      
      // Initialize progress
      const steps: CalculationStep[] = [
        {
          id: '1',
          name: 'Data Collection',
          description: 'Gathering equipment data and inspection history',
          status: 'pending',
          progress: 0
        },
        {
          id: '2',
          name: 'Parameter Validation',
          description: 'Validating input parameters and data quality',
          status: 'pending',
          progress: 0
        },
        {
          id: '3',
          name: 'PoF Calculation',
          description: 'Calculating Probability of Failure scores',
          status: 'pending',
          progress: 0
        },
        {
          id: '4',
          name: 'CoF Calculation',
          description: 'Calculating Consequence of Failure scores',
          status: 'pending',
          progress: 0
        },
        {
          id: '5',
          name: 'Risk Assessment',
          description: 'Determining overall risk level and inspection interval',
          status: 'pending',
          progress: 0
        },
        {
          id: '6',
          name: 'Report Generation',
          description: 'Generating calculation report and recommendations',
          status: 'pending',
          progress: 0
        }
      ]

      setCalculationProgress({
        currentStep: 0,
        totalSteps: steps.length,
        overallProgress: 0,
        estimatedTimeRemaining: 120, // 2 minutes
        steps
      })

      // Simulate calculation progress
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        
        setCalculationProgress(prev => {
          if (!prev) return null
          
          const updatedSteps = [...prev.steps]
          updatedSteps[i] = {
            ...updatedSteps[i],
            status: 'running',
            progress: 0
          }
          
          return {
            ...prev,
            currentStep: i,
            steps: updatedSteps
          }
        })

        // Simulate step progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200))
          
          setCalculationProgress(prev => {
            if (!prev) return null
            
            const updatedSteps = [...prev.steps]
            updatedSteps[i] = {
              ...updatedSteps[i],
              progress
            }
            
            const overallProgress = ((i * 100) + progress) / steps.length
            const estimatedTimeRemaining = Math.max(0, 120 - (overallProgress / 100) * 120)
            
            return {
              ...prev,
              overallProgress,
              estimatedTimeRemaining,
              steps: updatedSteps
            }
          })
        }

        setCalculationProgress(prev => {
          if (!prev) return null
          
          const updatedSteps = [...prev.steps]
          updatedSteps[i] = {
            ...updatedSteps[i],
            status: 'completed',
            progress: 100,
            duration: 1 + Math.random() * 2
          }
          
          return {
            ...prev,
            steps: updatedSteps
          }
        })
      }

      // Generate mock result
      const mockResult: RBICalculationResult = {
        equipmentId: equipmentId,
        calculationLevel: selectedLevel,
        requestedLevel: selectedLevel,
        fallbackOccurred: Math.random() > 0.7,
        nextInspectionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as RiskLevel,
        pofScore: 3 + Math.random() * 6,
        cofScores: {
          safety: 4 + Math.random() * 5,
          environmental: 3 + Math.random() * 6,
          economic: 5 + Math.random() * 4
        },
        confidenceScore: 0.6 + Math.random() * 0.3,
        dataQualityScore: 0.7 + Math.random() * 0.2,
        calculationTimestamp: new Date().toISOString(),
        inputParameters: {},
        missingData: Math.random() > 0.5 ? ['corrosion_rate_history'] : [],
        estimatedParameters: Math.random() > 0.5 ? ['wall_thickness'] : []
      }

      setCalculationResult(mockResult)
      setShowProgressDialog(false)
      setShowResultDialog(true)
      onCalculationComplete(mockResult)
      
    } catch (err) {
      console.error('Calculation failed:', err)
      setError('Calculation failed. Please try again.')
    } finally {
      setIsCalculating(false)
    }
  }

  // Stop calculation
  const stopCalculation = () => {
    setIsCalculating(false)
    setShowProgressDialog(false)
    setCalculationProgress(null)
  }

  // Get risk level display
  const getRiskDisplay = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="h-4 w-4" /> }
      case 'MEDIUM':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <ExclamationTriangleIcon className="h-4 w-4" /> }
      case 'HIGH':
        return { color: 'bg-red-100 text-red-800', icon: <ExclamationTriangleIcon className="h-4 w-4" /> }
      case 'CRITICAL':
        return { color: 'bg-red-200 text-red-900', icon: <ExclamationTriangleIcon className="h-4 w-4" /> }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <InformationCircleIcon className="h-4 w-4" /> }
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return <RBICalculationSkeleton />
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

  const selectedConfiguration = configurations.find(c => c.id === selectedConfig)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">RBI Calculation</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onViewHistory}>
            <ClockIcon className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={onViewConfiguration}>
            <CogIcon className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Equipment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <InformationCircleIcon className="h-5 w-5" />
            <span>Equipment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Tag Number</div>
              <div className="font-medium">{equipment.tagNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{equipment.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-medium">{equipment.type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Risk</div>
              <Badge className={cn('text-xs', getRiskDisplay(equipment.riskLevel).color)}>
                <div className="flex items-center space-x-1">
                  {getRiskDisplay(equipment.riskLevel).icon}
                  <span>{equipment.riskLevel}</span>
                </div>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration</label>
              <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                <SelectTrigger>
                  <SelectValue placeholder="Select configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configurations.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedConfiguration && (
                <p className="text-xs text-muted-foreground">
                  {selectedConfiguration.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Calculation Level</label>
              <Select value={selectedLevel.toString()} onValueChange={(value) => setSelectedLevel(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 - Basic</SelectItem>
                  <SelectItem value="2">Level 2 - Intermediate</SelectItem>
                  <SelectItem value="3">Level 3 - Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Ready to start RBI calculation for {equipment.tagNumber}
            </div>
            <div className="flex items-center space-x-2">
              {isCalculating ? (
                <Button variant="destructive" onClick={stopCalculation}>
                  <StopIcon className="h-4 w-4 mr-2" />
                  Stop Calculation
                </Button>
              ) : (
                <Button onClick={startCalculation} disabled={!selectedConfig}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Calculation
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ChartBarIcon className="h-5 w-5" />
              <span>RBI Calculation in Progress</span>
            </DialogTitle>
            <DialogDescription>
              Calculating RBI assessment for {equipment.tagNumber}
            </DialogDescription>
          </DialogHeader>
          
          {calculationProgress && (
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(calculationProgress.overallProgress)}%</span>
                </div>
                <Progress value={calculationProgress.overallProgress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Step {calculationProgress.currentStep + 1} of {calculationProgress.totalSteps}</span>
                  <span>Est. {formatTime(Math.round(calculationProgress.estimatedTimeRemaining))} remaining</span>
                </div>
              </div>

              <Separator />

              {/* Step Details */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {calculationProgress.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {step.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : step.status === 'running' ? (
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : step.status === 'failed' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{step.name}</h4>
                        {step.status === 'completed' && step.duration && (
                          <span className="text-xs text-muted-foreground">
                            {step.duration.toFixed(1)}s
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      {step.status === 'running' && (
                        <Progress value={step.progress} className="h-1 mt-1" />
                      )}
                      {step.error && (
                        <p className="text-xs text-red-600 mt-1">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="destructive" onClick={stopCalculation}>
              <StopIcon className="h-4 w-4 mr-2" />
              Stop Calculation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span>Calculation Complete</span>
            </DialogTitle>
            <DialogDescription>
              RBI calculation completed successfully for {equipment.tagNumber}
            </DialogDescription>
          </DialogHeader>
          
          {calculationResult && (
            <div className="space-y-4">
              {/* Risk Level Result */}
              <Card className={cn('border-2', getRiskDisplay(calculationResult.riskLevel).color.split(' ')[2])}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn('p-2 rounded-full', getRiskDisplay(calculationResult.riskLevel).color)}>
                        {getRiskDisplay(calculationResult.riskLevel).icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{calculationResult.riskLevel} RISK</h3>
                        <p className="text-sm text-muted-foreground">
                          Next inspection: {new Date(calculationResult.nextInspectionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <div className="text-xl font-bold">{(calculationResult.confidenceScore * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">PoF Score</div>
                    <div className="text-2xl font-bold">{calculationResult.pofScore.toFixed(1)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Avg CoF Score</div>
                    <div className="text-2xl font-bold">
                      {((calculationResult.cofScores.safety + calculationResult.cofScores.environmental + calculationResult.cofScores.economic) / 3).toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Warnings */}
              {calculationResult.fallbackOccurred && (
                <Alert>
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Calculation fallback occurred due to insufficient data. Results may be less accurate.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowResultDialog(false)
              // Navigate to detailed results view
            }}>
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              View Detailed Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Loading Skeleton Component
function RBICalculationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Equipment Info Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Setup Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export type { RBICalculationInterfaceProps }