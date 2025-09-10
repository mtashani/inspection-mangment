'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOffline } from '@/hooks/use-offline'

export default function OfflinePage() {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const {
    isOnline,
    offlineActionsCount,
    isSyncing,
    syncOfflineActions
  } = useOffline()

  // Redirect to home when back online
  useEffect(() => {
    if (isOnline) {
      router.push('/')
    }
  }, [isOnline, router])

  // Handle retry connection
  const handleRetry = async () => {
    setIsRetrying(true)
    
    // Simulate checking connection
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (navigator.onLine) {
      // Try to sync offline actions
      try {
        await syncOfflineActions()
      } catch (error) {
        console.error('Sync failed:', error)
      }
      
      router.push('/')
    }
    
    setIsRetrying(false)
  }

  // Available offline features
  const offlineFeatures = [
    {
      icon: ClipboardDocumentListIcon,
      title: 'View Cached Data',
      description: 'Access previously loaded equipment, inspections, and reports',
      available: true
    },
    {
      icon: DocumentTextIcon,
      title: 'Create Reports',
      description: 'Create new reports that will sync when connection is restored',
      available: true
    },
    {
      icon: WrenchScrewdriverIcon,
      title: 'Equipment Management',
      description: 'View and update equipment information offline',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Offline Card */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">You're Offline</CardTitle>
            <p className="text-muted-foreground">
              No internet connection detected. You can still use some features while offline.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <WifiIcon className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">Connection Status</p>
                  <p className="text-sm text-red-600">Disconnected from server</p>
                </div>
              </div>
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                variant="outline"
                size="sm"
              >
                {isRetrying ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            </div>

            {/* Offline Actions Status */}
            {offlineActionsCount > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CloudArrowUpIcon className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Pending Changes</p>
                    <p className="text-sm text-yellow-700">
                      {offlineActionsCount} action{offlineActionsCount !== 1 ? 's' : ''} waiting to sync when connection is restored
                    </p>
                  </div>
                </div>
                {isSyncing && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-yellow-700">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Attempting to sync...</span>
                  </div>
                )}
              </div>
            )}

            {/* Available Features */}
            <div>
              <h3 className="font-medium mb-3">Available Offline Features</h3>
              <div className="space-y-3">
                {offlineFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 border rounded-lg"
                  >
                    <feature.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{feature.title}</h4>
                        <Badge
                          variant={feature.available ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {feature.available ? 'Available' : 'Limited'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/')}
                className="flex-1"
              >
                Continue Offline
              </Button>
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                variant="outline"
                className="flex-1"
              >
                {isRetrying ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Checking Connection...
                  </>
                ) : (
                  <>
                    <WifiIcon className="h-4 w-4 mr-2" />
                    Try to Reconnect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Offline Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span>Your changes are automatically saved and will sync when you're back online</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span>Previously loaded data is available for viewing and editing</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span>Check your network connection and try again</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span>The app will automatically reconnect when internet is available</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}