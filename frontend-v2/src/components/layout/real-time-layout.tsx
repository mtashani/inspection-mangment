'use client';

import { useEffect } from 'react';
import { useWebSocketConnection } from '@/hooks/use-websocket-connection';
import { useRealTimeNotifications } from '@/contexts/real-time-notifications';

interface RealTimeLayoutProps {
  children: React.ReactNode;
}

export function RealTimeLayout({ children }: RealTimeLayoutProps) {
  const { connect, isConnected, isConnecting } = useWebSocketConnection({
    autoConnect: true,
    showConnectionStatus: false // Set to true if you want toast notifications for connection status
  });

  // Add visual indicator of connection status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔔 Real-time notifications: ${isConnecting ? 'connecting...' : isConnected ? 'connected' : 'disconnected'}`);
    }
  }, [isConnected, isConnecting]);

  return (
    <>
      {children}
      
      {/* Connection status indicator (optional, for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`
            px-3 py-1 text-xs rounded-full transition-all duration-300
            ${isConnected 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : isConnecting 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }
          `}>
            <div className="flex items-center gap-1">
              <div className={`
                w-2 h-2 rounded-full 
                ${isConnected 
                  ? 'bg-green-500' 
                  : isConnecting 
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-red-500'
                }
              `} />
              <span>
                {isConnecting ? 'Connecting...' : isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}