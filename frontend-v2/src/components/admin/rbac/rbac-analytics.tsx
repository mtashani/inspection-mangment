'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Shield, 
  Key, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useRBACAnalytics } from '@/hooks/admin/use-rbac-analytics'

export function RBACAnalytics() {
  const { 
    overview, 
    permissionUsage, 
    roleEfficiency, 
    recommendations, 
    isLoading, 
    error, 
    refetch 
  } = useRBACAnalytics()

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load RBAC analytics: {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Analytics Overview Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Detailed Analytics Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-2 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recommendations Loading */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permission Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.permissionUsage.percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {overview?.permissionUsage.active || 0} of {overview?.permissionUsage.total || 0} permissions active
            </p>
            <Progress value={overview?.permissionUsage.percentage || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Distribution</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.roleDistribution.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active roles across system
            </p>
            <div className="flex gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">
                System: {overview?.roleDistribution.system || 0}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Tech: {overview?.roleDistribution.technical || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview?.securityScore.grade || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.securityScore.compliance || 0}% compliance rate
            </p>
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">
                {overview?.securityScore.status === 'excellent' ? 'Excellent' : 
                 overview?.securityScore.status === 'good' ? 'Good' : 'Needs Review'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.optimization.opportunities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Optimization opportunities
            </p>
            <div className="flex items-center gap-1 mt-2">
              {overview?.optimization.status === 'good' ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-yellow-500" />
              )}
              <span className={`text-xs ${
                overview?.optimization.status === 'good' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {overview?.optimization.status === 'good' ? 'Optimal' : 'Review needed'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission Usage Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Permission Usage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {permissionUsage?.permissionUsage.slice(0, 5).map((permission, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{permission.permission}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={permission.usagePercentage} className="w-20" />
                    <span className="text-xs text-muted-foreground">
                      {permission.userCount} users
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-sm text-muted-foreground">
                  No permission usage data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Efficiency Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {roleEfficiency?.roleEfficiency.slice(0, 4).map((role, index) => {
                const bgColor = role.statusColor === 'green' ? 'bg-green-50' : 
                               role.statusColor === 'yellow' ? 'bg-yellow-50' : 
                               role.statusColor === 'blue' ? 'bg-blue-50' : 'bg-gray-50'
                
                const textColor = role.statusColor === 'green' ? 'text-green-800' : 
                                 role.statusColor === 'yellow' ? 'text-yellow-800' : 
                                 role.statusColor === 'blue' ? 'text-blue-800' : 'text-gray-800'
                
                const descColor = role.statusColor === 'green' ? 'text-green-600' : 
                                 role.statusColor === 'yellow' ? 'text-yellow-600' : 
                                 role.statusColor === 'blue' ? 'text-blue-600' : 'text-gray-600'
                
                const IconComponent = role.status === 'optimal' ? CheckCircle : 
                                     role.status === 'over_privileged' ? AlertCircle : 
                                     role.status === 'under_privileged' ? Clock : AlertCircle
                
                const iconColor = role.statusColor === 'green' ? 'text-green-500' : 
                                 role.statusColor === 'yellow' ? 'text-yellow-500' : 
                                 role.statusColor === 'blue' ? 'text-blue-500' : 'text-gray-500'
                
                return (
                  <div key={index} className={`flex items-center justify-between p-3 ${bgColor} rounded-lg`}>
                    <div>
                      <p className={`font-medium ${textColor}`}>{role.displayLabel}</p>
                      <p className={`text-sm ${descColor}`}>{role.message}</p>
                    </div>
                    <IconComponent className={`h-5 w-5 ${iconColor}`} />
                  </div>
                )
              }) || (
                <div className="text-sm text-muted-foreground">
                  No role efficiency data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            RBAC Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations?.recommendations.map((recommendation, index) => {
              const bgColor = recommendation.type === 'success' ? 'bg-green-50 border-green-200' : 
                             recommendation.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 
                             recommendation.type === 'info' ? 'bg-blue-50 border-blue-200' : 
                             'bg-red-50 border-red-200'
              
              const textColor = recommendation.type === 'success' ? 'text-green-800' : 
                               recommendation.type === 'warning' ? 'text-yellow-800' : 
                               recommendation.type === 'info' ? 'text-blue-800' : 
                               'text-red-800'
              
              const descColor = recommendation.type === 'success' ? 'text-green-700' : 
                               recommendation.type === 'warning' ? 'text-yellow-700' : 
                               recommendation.type === 'info' ? 'text-blue-700' : 
                               'text-red-700'
              
              const IconComponent = recommendation.type === 'success' ? CheckCircle : 
                                   recommendation.type === 'warning' ? AlertCircle : 
                                   recommendation.type === 'info' ? Clock : AlertCircle
              
              const iconColor = recommendation.type === 'success' ? 'text-green-500' : 
                               recommendation.type === 'warning' ? 'text-yellow-500' : 
                               recommendation.type === 'info' ? 'text-blue-500' : 
                               'text-red-500'
              
              return (
                <div key={index} className={`flex items-start gap-3 p-3 ${bgColor} border rounded-lg`}>
                  <IconComponent className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className={`font-medium ${textColor}`}>{recommendation.title}</p>
                    <p className={`text-sm ${descColor}`}>
                      {recommendation.description}
                    </p>
                  </div>
                </div>
              )
            }) || (
              <div className="text-sm text-muted-foreground">
                No recommendations available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
