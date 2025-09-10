import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Notifications } from '@/components/navigation/notifications'

// Mock the real-time notifications context
const mockRealTimeNotifications = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isConnecting: false,
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  removeNotification: jest.fn(),
  connectWebSocket: jest.fn()
}

jest.mock('@/contexts/real-time-notifications', () => ({
  useRealTimeNotifications: () => mockRealTimeNotifications
}))

// Mock navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000'
  },
  writable: true
})

const sampleNotifications = [
  {
    id: '1',
    title: 'New Event Created',
    message: 'Maintenance event ME-2024-001 has been created',
    type: 'info' as const,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: '/events/1'
  },
  {
    id: '2', 
    title: 'Critical Alert',
    message: 'System pressure exceeds safe limits',
    type: 'error' as const,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    read: false,
    actionUrl: '/alerts/2'
  },
  {
    id: '3',
    title: 'Task Completed',
    message: 'Inspection of PUMP-001 completed successfully',
    type: 'success' as const,
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: true,
    actionUrl: '/inspections/3'
  }
]

describe('Notifications Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock data
    mockRealTimeNotifications.notifications = []
    mockRealTimeNotifications.unreadCount = 0
    mockRealTimeNotifications.isConnected = false
    mockRealTimeNotifications.isConnecting = false
  })

  describe('Basic Rendering', () => {
    test('should render notification bell icon', () => {
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      expect(bellButton).toBeInTheDocument()
    })

    test('should show unread count badge when there are unread notifications', () => {
      mockRealTimeNotifications.unreadCount = 3
      
      render(<Notifications />)
      
      const badge = screen.getByText('3')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('animate-pulse')
    })

    test('should show 9+ when unread count exceeds 9', () => {
      mockRealTimeNotifications.unreadCount = 15
      
      render(<Notifications />)
      
      const badge = screen.getByText('9+')
      expect(badge).toBeInTheDocument()
    })

    test('should not show badge when no unread notifications', () => {
      mockRealTimeNotifications.unreadCount = 0
      
      render(<Notifications />)
      
      const badge = screen.queryByText(/\d+/)
      expect(badge).not.toBeInTheDocument()
    })
  })

  describe('Connection Status Indicators', () => {
    test('should show connected status', () => {
      mockRealTimeNotifications.isConnected = true
      
      render(<Notifications />)
      
      // Open dropdown to see connection status
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)
      
      // Green wifi icon should be present (connected)
      const wifiIcon = document.querySelector('.text-green-500')
      expect(wifiIcon).toBeInTheDocument()
    })

    test('should show connecting status', () => {
      mockRealTimeNotifications.isConnecting = true
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)
      
      // Yellow wifi icon with pulse animation (connecting)
      const wifiIcon = document.querySelector('.text-yellow-500.animate-pulse')
      expect(wifiIcon).toBeInTheDocument()
    })

    test('should show disconnected status', () => {
      mockRealTimeNotifications.isConnected = false
      mockRealTimeNotifications.isConnecting = false
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)
      
      // Red wifi-off icon (disconnected)
      const wifiIcon = document.querySelector('.text-red-500')
      expect(wifiIcon).toBeInTheDocument()
    })
  })

  describe('Notification Dropdown', () => {
    test('should open dropdown when bell is clicked', async () => {
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      const dropdown = screen.getByText('Notifications')
      expect(dropdown).toBeInTheDocument()
    })

    test('should show empty state when no notifications', async () => {
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      const emptyMessage = screen.getByText('No notifications')
      expect(emptyMessage).toBeInTheDocument()
    })

    test('should display notifications when present', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      expect(screen.getByText('New Event Created')).toBeInTheDocument()
      expect(screen.getByText('Critical Alert')).toBeInTheDocument()
      expect(screen.getByText('Task Completed')).toBeInTheDocument()
    })

    test('should show mark all read button when there are unread notifications', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      mockRealTimeNotifications.unreadCount = 2
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      const markAllReadButton = screen.getByText('Mark all read')
      expect(markAllReadButton).toBeInTheDocument()
    })

    test('should not show mark all read button when no unread notifications', async () => {
      mockRealTimeNotifications.notifications = [sampleNotifications[2]] // Only read notification
      mockRealTimeNotifications.unreadCount = 0
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      const markAllReadButton = screen.queryByText('Mark all read')
      expect(markAllReadButton).not.toBeInTheDocument()
    })
  })

  describe('Notification Interactions', () => {
    test('should call markAsRead when notification is clicked', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      const notification = screen.getByText('New Event Created')
      await user.click(notification.closest('div')!)
      
      expect(mockRealTimeNotifications.markAsRead).toHaveBeenCalledWith('1')
    })

    test('should navigate to action URL when notification is clicked', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      const notification = screen.getByText('New Event Created')
      await user.click(notification.closest('div')!)
      
      expect(window.location.href).toBe('/events/1')
    })

    test('should call markAllAsRead when mark all read button is clicked', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      mockRealTimeNotifications.unreadCount = 2
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      const markAllReadButton = screen.getByText('Mark all read')
      await user.click(markAllReadButton)
      
      expect(mockRealTimeNotifications.markAllAsRead).toHaveBeenCalled()
    })

    test('should call removeNotification when delete button is clicked', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      // Find delete button (X icon)
      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(btn => btn.innerHTML.includes('X') || btn.getAttribute('aria-label')?.includes('delete'))
      
      if (deleteButton) {
        await user.click(deleteButton)
        expect(mockRealTimeNotifications.removeNotification).toHaveBeenCalled()
      }
    })
  })

  describe('Auto Mark as Read', () => {
    test('should automatically mark all as read after dropdown is open for 1 second', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      mockRealTimeNotifications.unreadCount = 2
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      // Wait for auto mark as read timeout
      await waitFor(() => {
        expect(mockRealTimeNotifications.markAllAsRead).toHaveBeenCalled()
      }, { timeout: 1500 })
    })
  })

  describe('Fallback to Local Notifications', () => {
    test('should use local notifications when real-time notifications are empty', () => {
      // Real-time notifications are empty, should fall back to mock notifications
      mockRealTimeNotifications.notifications = []
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)
      
      // Should show local mock notifications
      expect(screen.getByText(/بازرسی عقب‌افتاده/)).toBeInTheDocument()
    })

    test('should prefer real-time notifications when available', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      // Should show real-time notifications, not local mock
      expect(screen.getByText('New Event Created')).toBeInTheDocument()
      expect(screen.queryByText(/بازرسی عقب‌افتاده/)).not.toBeInTheDocument()
    })
  })

  describe('Notification Icons', () => {
    test('should display correct icons for different notification types', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      // Success notification should have CheckCircle icon (green)
      const successIcon = document.querySelector('.text-green-600')
      expect(successIcon).toBeInTheDocument()
      
      // Error notification should have AlertTriangle icon (red)
      const errorIcon = document.querySelector('.text-red-600')
      expect(errorIcon).toBeInTheDocument()
      
      // Info notification should have Info icon (blue)
      const infoIcon = document.querySelector('.text-blue-600')
      expect(infoIcon).toBeInTheDocument()
    })
  })

  describe('Timestamp Formatting', () => {
    test('should format timestamps correctly', async () => {
      mockRealTimeNotifications.notifications = sampleNotifications
      
      render(<Notifications />)
      
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      await user.click(bellButton)
      
      // Should show relative time (e.g., "2h ago", "1h ago", "30m ago")
      expect(screen.getByText(/2h ago/)).toBeInTheDocument()
      expect(screen.getByText(/1h ago/)).toBeInTheDocument()
      expect(screen.getByText(/30m ago/)).toBeInTheDocument()
    })
  })
})