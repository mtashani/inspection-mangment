import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test-utils/render'
import { OfflineStatus, OfflineIndicator } from '../offline-status'

// Mock the useOffline hook
vi.mock('@/hooks/use-offline', () => ({
  useOffline: vi.fn(),
}))

const mockUseOffline = vi.fn()
vi.mocked(require('@/hooks/use-offline').useOffline).mockImplementation(mockUseOffline)

const defaultOfflineState = {
  isOnline: true,
  isOffline: false,
  offlineActionsCount: 0,
  isSyncing: false,
  syncOfflineActions: vi.fn(),
  clearOfflineActions: vi.fn(),
  retryFailedActions: vi.fn(),
  getOfflineActions: vi.fn().mockResolvedValue([]),
}

describe('OfflineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when online with no offline actions and showDetails is false', () => {
    mockUseOffline.mockReturnValue(defaultOfflineState)

    const { container } = render(<OfflineStatus />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when showDetails is true even when online', () => {
    mockUseOffline.mockReturnValue(defaultOfflineState)

    render(<OfflineStatus showDetails={true} />)
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('All changes are synced.')).toBeInTheDocument()
  })

  it('renders offline state correctly', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isOnline: false,
      isOffline: true,
    })

    render(<OfflineStatus />)
    
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByText("You're working offline. Changes will be synced when connection is restored.")).toBeInTheDocument()
  })

  it('shows queued actions when offline actions exist', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 5,
    })

    render(<OfflineStatus />)
    
    expect(screen.getByText('5 queued')).toBeInTheDocument()
    expect(screen.getByText('5 offline actions waiting to sync.')).toBeInTheDocument()
  })

  it('shows syncing state', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isSyncing: true,
      offlineActionsCount: 3,
    })

    render(<OfflineStatus />)
    
    expect(screen.getByText('Syncing...')).toBeInTheDocument()
    expect(screen.getByText('Syncing offline changes...')).toBeInTheDocument()
  })

  it('shows failed actions warning', async () => {
    const mockGetOfflineActions = vi.fn().mockResolvedValue([
      { id: 1, retryCount: 1 },
      { id: 2, retryCount: 2 },
      { id: 3, retryCount: 0 },
    ])

    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 3,
      getOfflineActions: mockGetOfflineActions,
    })

    render(<OfflineStatus />)

    await waitFor(() => {
      expect(screen.getByText('2 actions failed to sync')).toBeInTheDocument()
      expect(screen.getByText('These actions have exceeded the maximum retry attempts.')).toBeInTheDocument()
    })
  })

  it('handles sync action', async () => {
    const mockSyncOfflineActions = vi.fn()
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 2,
      syncOfflineActions: mockSyncOfflineActions,
    })

    render(<OfflineStatus showActions={true} />)
    
    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)
    
    expect(mockSyncOfflineActions).toHaveBeenCalledTimes(1)
  })

  it('handles retry failed actions', async () => {
    const mockRetryFailedActions = vi.fn()
    const mockGetOfflineActions = vi.fn().mockResolvedValue([
      { id: 1, retryCount: 3 },
    ])

    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 1,
      retryFailedActions: mockRetryFailedActions,
      getOfflineActions: mockGetOfflineActions,
    })

    render(<OfflineStatus showActions={true} />)

    await waitFor(() => {
      const retryButton = screen.getByText('Retry Failed')
      fireEvent.click(retryButton)
      expect(mockRetryFailedActions).toHaveBeenCalledTimes(1)
    })
  })

  it('handles clear queue action', async () => {
    const mockClearOfflineActions = vi.fn()
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 3,
      clearOfflineActions: mockClearOfflineActions,
    })

    render(<OfflineStatus showActions={true} />)
    
    const clearButton = screen.getByText('Clear Queue')
    fireEvent.click(clearButton)
    
    expect(mockClearOfflineActions).toHaveBeenCalledTimes(1)
  })

  it('shows detailed information when showDetails is true', async () => {
    const mockGetOfflineActions = vi.fn().mockResolvedValue([
      { id: 1, retryCount: 1 },
    ])

    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 5,
      isSyncing: false,
      getOfflineActions: mockGetOfflineActions,
    })

    render(<OfflineStatus showDetails={true} />)

    await waitFor(() => {
      expect(screen.getByText('Status:')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('Queued Actions:')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Failed Actions:')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Sync Status:')).toBeInTheDocument()
      expect(screen.getByText('Idle')).toBeInTheDocument()
    })
  })

  it('disables actions when syncing', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 2,
      isSyncing: true,
    })

    render(<OfflineStatus showActions={true} />)
    
    const syncButton = screen.getByText('Sync Now')
    expect(syncButton).toBeDisabled()
  })

  it('shows correct border color based on status', () => {
    // Online with no actions - green border
    mockUseOffline.mockReturnValue(defaultOfflineState)
    const { rerender } = render(<OfflineStatus showDetails={true} />)
    expect(screen.getByRole('region')).toHaveClass('border-l-green-500')

    // Online with actions - yellow border
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 2,
    })
    rerender(<OfflineStatus showDetails={true} />)
    expect(screen.getByRole('region')).toHaveClass('border-l-yellow-500')

    // Offline - red border
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isOnline: false,
      isOffline: true,
    })
    rerender(<OfflineStatus showDetails={true} />)
    expect(screen.getByRole('region')).toHaveClass('border-l-red-500')
  })
})

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when online with no offline actions', () => {
    mockUseOffline.mockReturnValue(defaultOfflineState)

    const { container } = render(<OfflineIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it('shows offline badge when offline', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isOnline: false,
      isOffline: true,
    })

    render(<OfflineIndicator />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('shows queued actions count', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      offlineActionsCount: 3,
    })

    render(<OfflineIndicator />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows syncing indicator', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isSyncing: true,
    })

    render(<OfflineIndicator />)
    expect(screen.getByText('Syncing')).toBeInTheDocument()
  })

  it('shows both offline and queued actions', () => {
    mockUseOffline.mockReturnValue({
      ...defaultOfflineState,
      isOnline: false,
      isOffline: true,
      offlineActionsCount: 2,
    })

    render(<OfflineIndicator />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})