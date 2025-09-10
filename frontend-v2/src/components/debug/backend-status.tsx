'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Settings, Wifi, WifiOff } from 'lucide-react'
import { useRealTimeNotifications } from '@/contexts/real-time-notifications'

export function BackendStatusIndicator() {
  const { isBackendConnected, isConnected: isWebSocketConnected } = useRealTimeNotifications()

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-64 shadow-lg border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            Backend Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* API Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm">API Server:</span>
            <Badge 
              variant={isBackendConnected ? "default" : "destructive"}
              className="gap-1"
            >
              {isBackendConnected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm">WebSocket:</span>
            <Badge 
              variant={isWebSocketConnected ? "default" : "secondary"}
              className="gap-1"
            >
              {isWebSocketConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
          </div>

          {/* Quick Action */}
          {!isBackendConnected && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Backend not available. Using local mode.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs"
                onClick={() => {
                  window.open('http://localhost:8000', '_blank')
                }}
              >
                Open Backend (Port 8000)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BackendStatusIndicator