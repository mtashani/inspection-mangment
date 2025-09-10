import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { RealTimeNotificationsProvider, useRealTimeNotifications } from '@/contexts/real-time-notifications'

// Mock the WebSocket service
jest.mock('@/lib/services/websocket-service', () => ({
  webSocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getConnectionStatus: jest.fn(() => ({ connected: false, connecting: false })),
    on: jest.fn(),
    off: jest.fn(),
  }
}))

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    token: 'mock_token',
    inspector: { id: 1, name: 'Test Inspector' }
  })
}))

// Test component to access the context
const TestComponent = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    isConnecting,
    markAsRead,
    markAllAsRead,
    removeNotification,
    connectWebSocket
  } = useRealTimeNotifications()

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="connection-status">
        {isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected'}
      </div>
      <button onClick={() => markAsRead('1')} data-testid="mark-read-btn">
        Mark Read
      </button>
      <button onClick={markAllAsRead} data-testid="mark-all-read-btn">
        Mark All Read
      </button>
      <button onClick={() => removeNotification('1')} data-testid="remove-btn">
        Remove
      </button>
      <button onClick={connectWebSocket} data-testid="connect-btn">
        Connect
      </button>
    </div>
  )
}

const renderWithProvider = () => {
  return render(
    <RealTimeNotificationsProvider>
      <TestComponent />
    </RealTimeNotificationsProvider>
  )
}

describe('RealTimeNotificationsProvider', () => {
  let mockWebSocketService: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockWebSocketService = require('@/lib/services/websocket-service').webSocketService
    
    // Reset mock implementations
    mockWebSocketService.getConnectionStatus.mockReturnValue({
      connected: false,
      connecting: false
    })
  })

  describe('Initial State', () => {
    test('should initialize with empty notifications', () => {
      renderWithProvider()
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
    })

    test('should attempt connection on mount', () => {
      renderWithProvider()
      
      expect(mockWebSocketService.connect).toHaveBeenCalledWith('mock_token')
    })
  })

  describe('Connection Management', () => {
    test('should show connecting status', () => {
      mockWebSocketService.getConnectionStatus.mockReturnValue({
        connected: false,
        connecting: true
      })
      
      renderWithProvider()
      
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting')
    })

    test('should show connected status', () => {
      mockWebSocketService.getConnectionStatus.mockReturnValue({
        connected: true,
        connecting: false
      })
      
      renderWithProvider()
      
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
    })

    test('should handle manual reconnection', () => {
      renderWithProvider()
      
      act(() => {
        screen.getByTestId('connect-btn').click()
      })
      
      expect(mockWebSocketService.connect).toHaveBeenCalledTimes(2) // Initial + manual
    })
  })

  describe('Notification Handling', () => {
    test('should add notification when received via WebSocket', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      renderWithProvider()
      
      const testNotification = {
        id: 1,
        title: 'Test Notification',
        message: 'Test message',
        notification_type: 'event_created',
        priority: 'medium',
        created_at: '2024-01-01T10:00:00Z'
      }
      
      act(() => {
        notificationHandler(testNotification)
      })
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')
    })

    test('should show toast for high priority notifications', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      renderWithProvider()
      
      const highPriorityNotification = {
        id: 2,
        title: 'Critical Alert',
        message: 'Something urgent happened',
        notification_type: 'system_alert',
        priority: 'critical',
        created_at: '2024-01-01T10:00:00Z'
      }
      
      act(() => {
        notificationHandler(highPriorityNotification)
      })
      
      expect(toast.error).toHaveBeenCalledWith(
        'Critical Alert',
        expect.objectContaining({
          description: 'Something urgent happened'
        })
      )
    })

    test('should mark notification as read', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      renderWithProvider()
      
      // Add a notification first
      act(() => {
        notificationHandler({
          id: '1',
          title: 'Test',
          message: 'Test message',
          notification_type: 'info',
          priority: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        })
      })
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')
      
      // Mark as read
      act(() => {
        screen.getByTestId('mark-read-btn').click()
      })
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    })

    test('should mark all notifications as read', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      renderWithProvider()
      
      // Add multiple notifications
      act(() => {
        notificationHandler({
          id: '1',
          title: 'Test 1',
          message: 'Test message 1',
          notification_type: 'info',
          priority: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        })
        notificationHandler({
          id: '2',
          title: 'Test 2',
          message: 'Test message 2',
          notification_type: 'info',
          priority: 'medium',
          created_at: '2024-01-01T10:01:00Z'
        })
      })
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2')
      
      // Mark all as read
      act(() => {
        screen.getByTestId('mark-all-read-btn').click()
      })
      
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    })

    test('should remove notification', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      renderWithProvider()
      
      // Add a notification
      act(() => {
        notificationHandler({
          id: '1',
          title: 'Test',
          message: 'Test message',
          notification_type: 'info',
          priority: 'medium',
          created_at: '2024-01-01T10:00:00Z'
        })
      })
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
      
      // Remove notification
      act(() => {
        screen.getByTestId('remove-btn').click()
      })
      
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })
  })

  describe('Toast Notifications', () => {
    test('should show different toast types based on priority', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      renderWithProvider()
      
      const notifications = [
        { priority: 'critical', expectedToast: toast.error },
        { priority: 'high', expectedToast: toast.warning },
        { priority: 'medium', expectedToast: toast.info },
        { priority: 'low', expectedToast: toast.info }
      ]
      
      notifications.forEach(({ priority, expectedToast }, index) => {
        act(() => {
          notificationHandler({
            id: `${index + 1}`,
            title: `Test ${priority}`,
            message: `Test message ${priority}`,
            notification_type: 'info',
            priority,
            created_at: '2024-01-01T10:00:00Z'
          })
        })
        
        expect(expectedToast).toHaveBeenCalledWith(
          `Test ${priority}`,
          expect.objectContaining({
            description: `Test message ${priority}`
          })
        )
      })
    })

    test('should include action button in toast when action_url provided', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      renderWithProvider()
      
      act(() => {
        notificationHandler({
          id: '1',
          title: 'Event Created',
          message: 'New maintenance event created',
          notification_type: 'event_created',
          priority: 'medium',
          action_url: '/events/123',
          created_at: '2024-01-01T10:00:00Z'
        })
      })
      
      expect(toast.info).toHaveBeenCalledWith(
        'Event Created',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'View'
          })
        })
      )
    })
  })

  describe('Error Handling', () => {
    test('should handle WebSocket errors gracefully', () => {
      let errorHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          errorHandler = handler
        }
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      renderWithProvider()
      
      act(() => {
        errorHandler(new Error('WebSocket error'))
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    test('should handle malformed notification data', () => {
      let notificationHandler: any
      
      mockWebSocketService.on.mockImplementation((event: string, handler: any) => {
        if (event === 'notification') {
          notificationHandler = handler
        }
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      renderWithProvider()
      
      // Send malformed notification
      act(() => {
        notificationHandler({
          // Missing required fields
          title: 'Test'
        })
      })
      
      // Should not crash, might log error
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    test('should cleanup WebSocket listeners on unmount', () => {
      const { unmount } = renderWithProvider()
      
      unmount()
      
      expect(mockWebSocketService.off).toHaveBeenCalled()
    })
  })
})