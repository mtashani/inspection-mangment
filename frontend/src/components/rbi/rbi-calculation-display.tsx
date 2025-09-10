'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  CogIcon,
  EyeIcon,
  ArrowPathIcon
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { RBICalculationResult, RiskLevel } from '@/types/equipment'

export interface RBICalculationDisplayProps {
  equipmentId: string
  rbiData?: RBICalculationResult
  onRecalculate: () => void
  onViewHistory: () => void
  onViewConfiguration: () => void
  isLoading?: boolean
  className?: string
}

interface RBIHistoryItem {
  id: string
  calculationDate: string
  calculationLevel: number
  riskLevel: RiskLevel
  pofScore: number
  cofScore: number
  nextInspectionDate: string
  dataQualityScore: number
  confidenceScore: number
}

export function RBICalculationDisplay({
  equipmentId,
  rbiData,
  onRecalculate,
  onViewHistory,
  onViewConfiguration,
  isLoading = false,
  className
}: RBICalculationDisplayProps) {
  const [calculationHistory, setCalculationHistory] = useState<RBIHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('current')

  // Load calculation history
  useEffect(() => {
    if (equipmentId) {
      loadCalculationHistory()
    }
  }, [equipmentId])

  const loadCalculationHistory = async () => {
    try {
      setLoadingHistory(true)
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock history data
      const mockHistory: RBIHistoryItem[] = [
        {
          id: '1',
          calculationDate: '2024-01-20T10:30:00Z',
          calculationLevel: 2,
          riskLevel: 'HIGH',
          pofScore: 7.5,
          cofScore: 7.2,
          nextInspectionDate: '2025-01-15',
          dataQualityScore: 0.80,
          confidenceScore: 0.75
        },
        {
          id: '2',
          calculationDate: '2023-01-15T14:20:00Z',
          calculationLevel: 2,
          riskLevel: 'MEDIUM',
          pofScore: 6.8,
          cofScore: 7.0,
          nextInspectionDate: '2024-01-15',
          dataQualityScore: 0.75,
          confidenceScore: 0.70
        }
      ]
      
      setCalculationHistory(mockHistory)
    } catch (err) {
      console.error('Failed to load calculation history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Get risk level display
  const getRiskDisplay = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircleIcon className="h-4 w-4" />,
          bgColor: 'bg-green-50'
        }
      case 'MEDIUM':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <ExclamationTriangleIcon className="h-4 w-4" />,
          bgColor: 'bg-yellow-50'
        }
      case 'HIGH':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <ExclamationTriangleIcon className="h-4 w-4" />,
          bgColor: 'bg-red-50'
        }
      case 'CRITICAL':
        return {
          color: 'bg-red-200 text-red-900 border-red-300',
          icon: <ExclamationTriangleIcon className="h-4 w-4" />,
          bgColor: 'bg-red-100'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <InformationCircleIcon className="h-4 w-4" />,
          bgColor: 'bg-gray-50'
        }
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format date with time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate trend
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return null
    const change = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      isImprovement: change < 0 // Lower scores are better for risk
    }
  }

  // Get data quality color
  const getDataQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return <RBIDisplaySkeleton />
  }

  if (!rbiData) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <ChartBarIcon className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">No RBI Data Available</h3>
              <p className="text-sm text-muted-foreground">
                Run an RBI calculation to view risk assessment data for this equipment.
              </p>
            </div>
            <Button onClick={onRecalculate}>
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Calculate RBI
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const riskDisplay = getRiskDisplay(rbiData.riskLevel)
  const previousCalculation = calculationHistory.find(h => h.id !== rbiData.equipmentId)
  const pofTrend = previousCalculation ? calculateTrend(rbiData.pofScore, previousCalculation.pofScore) : null
  const avgCofScore = (rbiData.cofScores.safety + rbiData.cofScores.environmental + rbiData.cofScores.economic) / 3
  const cofTrend = previousCalculation ? calculateTrend(avgCofScore, previousCalculation.cofScore) : null

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">RBI Assessment</h2>
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
          <Button onClick={onRecalculate}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
        </div>
      </div>

      {/* Risk Level Overview */}
      <Card className={cn('border-2', riskDisplay.color.split(' ')[2])}>
        <CardContent className={cn('p-6', riskDisplay.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn('p-3 rounded-full', riskDisplay.color.split(' ').slice(0, 2).join(' '))}>
                {riskDisplay.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{rbiData.riskLevel} RISK</h3>
                <p className="text-sm text-muted-foreground">
                  Next inspection due: {formatDate(rbiData.nextInspectionDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Calculation Level</div>
              <div className="text-2xl font-bold">{rbiData.calculationLevel}</div>
              {rbiData.fallbackOccurred && (
                <Badge variant="outline" className="mt-1">
                  Fallback Applied
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {rbiData.fallbackOccurred && (
        <Alert>
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Calculation fallback occurred due to insufficient data. Results may be less accurate.
            Missing data: {rbiData.missingData.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PoF Score */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Probability of Failure</div>
                <div className="text-2xl font-bold">{rbiData.pofScore.toFixed(1)}</div>
                {pofTrend && (
                  <div className={cn('flex items-center space-x-1 text-xs', 
                    pofTrend.isImprovement ? 'text-green-600' : 'text-red-600'
                  )}>
                    {pofTrend.direction === 'up' ? 
                      <ArrowTrendingUpIcon className="h-3 w-3" /> : 
                      <ArrowTrendingDownIcon className="h-3 w-3" />
                    }
                    <span>{pofTrend.percentage.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <Progress value={rbiData.pofScore * 10} className="w-12 h-12 rotate-90" />
            </div>
          </CardContent>
        </Card>

        {/* CoF Scores */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Consequence of Failure</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Safety</span>
                  <span className="font-medium">{rbiData.cofScores.safety.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Environmental</span>
                  <span className="font-medium">{rbiData.cofScores.environmental.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Economic</span>
                  <span className="font-medium">{rbiData.cofScores.economic.toFixed(1)}</span>
                </div>
              </div>
              <div className="text-lg font-bold">
                Avg: {avgCofScore.toFixed(1)}
              </div>
              {cofTrend && (
                <div className={cn('flex items-center space-x-1 text-xs', 
                  cofTrend.isImprovement ? 'text-green-600' : 'text-red-600'
                )}>
                  {cofTrend.direction === 'up' ? 
                    <ArrowTrendingUpIcon className="h-3 w-3" /> : 
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  }
                  <span>{cofTrend.percentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Quality */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Data Quality</div>
              <div className={cn('text-2xl font-bold', getDataQualityColor(rbiData.dataQualityScore))}>
                {(rbiData.dataQualityScore * 100).toFixed(0)}%
              </div>
              <Progress value={rbiData.dataQualityScore * 100} className="h-2" />
              {rbiData.missingData.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {rbiData.missingData.length} missing parameters
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confidence Score */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Confidence</div>
              <div className={cn('text-2xl font-bold', getDataQualityColor(rbiData.confidenceScore))}>
                {(rbiData.confidenceScore * 100).toFixed(0)}%
              </div>
              <Progress value={rbiData.confidenceScore * 100} className="h-2" />
              {rbiData.estimatedParameters.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {rbiData.estimatedParameters.length} estimated parameters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Current Calculation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
        </TabsList>

        {/* Current Calculation Tab */}
        <TabsContent value="current" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Calculation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Requested Level</div>
                    <div className="font-medium">{rbiData.requestedLevel}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Actual Level</div>
                    <div className="font-medium">{rbiData.calculationLevel}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Calculation Date</div>
                    <div className="font-medium">{formatDateTime(rbiData.calculationTimestamp)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Next Inspection</div>
                    <div className="font-medium">{formatDate(rbiData.nextInspectionDate)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Safety CoF</span>
                    <span className="font-medium">{rbiData.cofScores.safety.toFixed(1)}</span>
                  </div>
                  <Progress value={rbiData.cofScores.safety * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Environmental CoF</span>
                    <span className="font-medium">{rbiData.cofScores.environmental.toFixed(1)}</span>
                  </div>
                  <Progress value={rbiData.cofScores.environmental * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Economic CoF</span>
                    <span className="font-medium">{rbiData.cofScores.economic.toFixed(1)}</span>
                  </div>
                  <Progress value={rbiData.cofScores.economic * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Calculation History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="p-6">
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>PoF Score</TableHead>
                      <TableHead>CoF Score</TableHead>
                      <TableHead>Data Quality</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculationHistory.map((calc) => (
                      <TableRow key={calc.id}>
                        <TableCell>{formatDate(calc.calculationDate)}</TableCell>
                        <TableCell>{calc.calculationLevel}</TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', getRiskDisplay(calc.riskLevel).color)}>
                            {calc.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>{calc.pofScore.toFixed(1)}</TableCell>
                        <TableCell>{calc.cofScore.toFixed(1)}</TableCell>
                        <TableCell>
                          <span className={getDataQualityColor(calc.dataQualityScore)}>
                            {(calc.dataQualityScore * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="data-quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Missing Data */}
            {rbiData.missingData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                    <span>Missing Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rbiData.missingData.map((param, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span className="text-sm">{param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estimated Parameters */}
            {rbiData.estimatedParameters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                    <span>Estimated Parameters</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rbiData.estimatedParameters.map((param, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm">{param.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Data Quality Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rbiData.dataQualityScore < 0.7 && (
                  <Alert>
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Data quality is below recommended threshold. Consider collecting missing data to improve calculation accuracy.
                    </AlertDescription>
                  </Alert>
                )}
                {rbiData.confidenceScore < 0.7 && (
                  <Alert>
                    <InformationCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Confidence score is low due to estimated parameters. Verify estimated values with actual measurements.
                    </AlertDescription>
                  </Alert>
                )}
                {rbiData.fallbackOccurred && (
                  <Alert>
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Calculation fallback occurred. Consider upgrading to a higher calculation level when more data becomes available.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Loading Skeleton Component
function RBIDisplaySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Risk Overview Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export type { RBICalculationDisplayProps }