'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { NetworkStatusManager } from '@/lib/utils/error-handling'
import { shouldUseMockData } from '@/lib/utils/development'

interface NetworkStatusProps {
  onRetry?: () => void
  className?: string
}

export function NetworkStatus({ onRetry, className }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isChecking, setIsChecking] = useState(false)
  const useMockData = shouldUseMockData()

  useEffect(() => {
    const networkManager = new NetworkStatusManager()
    
    const unsubscribe = networkManager.addListener((online) => {
      setIsOnline(online)
    })

    return () => {
      unsubscribe()
      networkManager.destroy()
    }
  }, [])

  const handleRetry = async () => {
    if (onRetry) {
      setIsChecking(true)
      try {
        await onRetry()
      } finally {
        setIsChecking(false)
      }
    }
  }

  // In mock mode, don't show offline warnings
  if (useMockData || isOnline) {
    return null
  }

  return (
    <Alert variant="destructive" className={className}>
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>You&apos;re currently offline. Some features may not work properly.</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isChecking}
            className="ml-4"
          >
            {isChecking ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
            {isChecking ? 'Checking...' : 'Retry'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [networkManager] = useState(() => new NetworkStatusManager())
  const useMockData = shouldUseMockData()

  useEffect(() => {
    const unsubscribe = networkManager.addListener(setIsOnline)
    return () => {
      unsubscribe()
    }
  }, [networkManager])

  useEffect(() => {
    return () => {
      networkManager.destroy()
    }
  }, [networkManager])

  return {
    isOnline: useMockData ? true : isOnline, // Always online in mock mode
    checkConnectivity: networkManager.checkConnectivity.bind(networkManager)
  }
}