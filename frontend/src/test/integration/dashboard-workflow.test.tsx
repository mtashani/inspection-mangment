import React from 'react'
import { render, screen, fireEvent, waitFor, userEvent } from '@/test/test-utils'
import { MainDashboard } from '@/components/dashboard/main-dashboard'
import { TestDataFactory, mockApiResponse } from '@/test/test-utils'

// Mock API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Dashboard Workflow Integration', () => {
  const mockUser = TestDataFactory.user()
  const mockEquipment = TestDataFactory.equipmentList(10)
  const mockInspections = TestDataFactory.inspectionList(8)
  const mockReports = [
    TestDataFactory.report({ status: 'pending' }),
    TestDataFactory.report({ status: 'approved' }),
    TestDataFactory.report({ status: 'draft' }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/equipment')) {
        return mockApiResponse(mockEquipment)
      }
      if (url.includes('/inspections')) {
        return mockApiResponse(mockInspections)
      }
      if (url.includes('/reports')) {
        return mockApiResponse(mockReports)
      }
      if (url.includes('/user')) {
        return mockApiResponse(mockUser)
      }
      return mockApiResponse({})
    })
  })

  it('loads dashboard with all widgets successfully', async () => {
    render(<MainDashboard />)
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
    
    // Check that main widgets are present
    expect(screen.getByText('Equipment Overview')).toBeInTheDocument()
    expect(screen.getByText('Inspection Summary')).toBeInTheDocument()
    expect(screen.getByText('Recent Reports')).toBeInTheDocument()
    expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument()
  })

  it('displays equipment metrics correctly', async () => {
    render(<MainDashboard />)
    
    await waitFor(() => {
      // Should show total equipment count
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Total Equipment')).toBeInTheDocument()
    })
    
    // Should show operational status
    expect(screen.getByText('Operational')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('shows inspection summary with correct counts', async () => {
    render(<MainDashboard />)
    
    await waitFor(() => {
      // Should show total inspections
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('Total Inspections')).toBeInTheDocument()
    })
    
    // Should show pending inspections
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('displays recent reports list', async () => {
    render(<MainDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Recent Reports')).toBeInTheDocument()
      
      // Should show report statuses
      expect(screen.getByText('pending')).toBeInTheDocument()
      expect(screen.getByText('approved')).toBeInTheDocument()
      expect(screen.getByText('draft')).toBeInTheDocument()
    })
  })

  it('allows widget configuration', async () => {
    const user = userEvent.setup()\n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n    })\n    \n    // Find and click widget menu\n    const menuButton = screen.getByRole('button', { name: /menu/i })\n    await user.click(menuButton)\n    \n    // Should show configuration option\n    expect(screen.getByText('Configure')).toBeInTheDocument()\n    \n    // Click configure\n    await user.click(screen.getByText('Configure'))\n    \n    // Should open configuration dialog\n    await waitFor(() => {\n      expect(screen.getByText('Widget Configuration')).toBeInTheDocument()\n    })\n  })\n\n  it('handles widget refresh functionality', async () => {\n    const user = userEvent.setup()\n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n    })\n    \n    // Find refresh button\n    const refreshButton = screen.getByText('Refresh')\n    await user.click(refreshButton)\n    \n    // Should trigger API call\n    await waitFor(() => {\n      expect(mockFetch).toHaveBeenCalledWith(\n        expect.stringContaining('/equipment'),\n        expect.any(Object)\n      )\n    })\n  })\n\n  it('shows loading states during data fetch', async () => {\n    // Mock delayed response\n    mockFetch.mockImplementation(() => \n      new Promise(resolve => \n        setTimeout(() => resolve(mockApiResponse(mockEquipment)), 1000)\n      )\n    )\n    \n    render(<MainDashboard />)\n    \n    // Should show loading state\n    expect(screen.getByText('Loading...')).toBeInTheDocument()\n    \n    // Wait for data to load\n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n    }, { timeout: 2000 })\n  })\n\n  it('handles API errors gracefully', async () => {\n    // Mock API error\n    mockFetch.mockRejectedValue(new Error('API Error'))\n    \n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Failed to load data')).toBeInTheDocument()\n    })\n    \n    // Should show retry button\n    expect(screen.getByText('Retry')).toBeInTheDocument()\n  })\n\n  it('allows widget removal', async () => {\n    const user = userEvent.setup()\n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n    })\n    \n    // Open widget menu\n    const menuButton = screen.getByRole('button', { name: /menu/i })\n    await user.click(menuButton)\n    \n    // Click remove\n    await user.click(screen.getByText('Remove Widget'))\n    \n    // Widget should be removed\n    await waitFor(() => {\n      expect(screen.queryByText('Equipment Overview')).not.toBeInTheDocument()\n    })\n  })\n\n  it('supports widget drag and drop reordering', async () => {\n    const user = userEvent.setup()\n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n      expect(screen.getByText('Inspection Summary')).toBeInTheDocument()\n    })\n    \n    // Find drag handles\n    const dragHandle = screen.getByRole('button', { name: /drag/i })\n    expect(dragHandle).toBeInTheDocument()\n    \n    // Note: Full drag and drop testing would require more complex setup\n    // This test verifies the drag handle is present\n  })\n\n  it('persists dashboard layout changes', async () => {\n    const user = userEvent.setup()\n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n    })\n    \n    // Make a configuration change\n    const menuButton = screen.getByRole('button', { name: /menu/i })\n    await user.click(menuButton)\n    await user.click(screen.getByText('Configure'))\n    \n    // Change configuration\n    await waitFor(() => {\n      expect(screen.getByText('Widget Configuration')).toBeInTheDocument()\n    })\n    \n    const saveButton = screen.getByText('Save')\n    await user.click(saveButton)\n    \n    // Should save to localStorage\n    expect(localStorage.setItem).toHaveBeenCalledWith(\n      'dashboard-layout',\n      expect.any(String)\n    )\n  })\n\n  it('handles real-time updates', async () => {\n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n    })\n    \n    // Simulate real-time update\n    const updatedEquipment = [\n      ...mockEquipment,\n      TestDataFactory.equipment({ name: 'New Equipment' })\n    ]\n    \n    // Mock updated API response\n    mockFetch.mockImplementation((url: string) => {\n      if (url.includes('/equipment')) {\n        return mockApiResponse(updatedEquipment)\n      }\n      return mockApiResponse({})\n    })\n    \n    // Trigger refresh\n    const refreshButton = screen.getByText('Refresh')\n    fireEvent.click(refreshButton)\n    \n    // Should show updated count\n    await waitFor(() => {\n      expect(screen.getByText('11')).toBeInTheDocument() // Updated count\n    })\n  })\n\n  it('maintains responsive layout on different screen sizes', async () => {\n    // Mock different viewport sizes\n    Object.defineProperty(window, 'innerWidth', {\n      writable: true,\n      configurable: true,\n      value: 768, // Tablet size\n    })\n    \n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Dashboard')).toBeInTheDocument()\n    })\n    \n    // Should adapt layout for smaller screens\n    const dashboard = screen.getByTestId('main-dashboard')\n    expect(dashboard).toHaveClass('responsive-layout')\n  })\n\n  it('shows appropriate alerts and notifications', async () => {\n    // Mock alerts data\n    const mockAlerts = [\n      { id: '1', type: 'warning', message: 'Equipment maintenance due' },\n      { id: '2', type: 'error', message: 'Critical inspection overdue' },\n    ]\n    \n    mockFetch.mockImplementation((url: string) => {\n      if (url.includes('/alerts')) {\n        return mockApiResponse(mockAlerts)\n      }\n      return mockApiResponse({})\n    })\n    \n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument()\n      expect(screen.getByText('Equipment maintenance due')).toBeInTheDocument()\n      expect(screen.getByText('Critical inspection overdue')).toBeInTheDocument()\n    })\n  })\n\n  it('integrates with navigation and routing', async () => {\n    const user = userEvent.setup()\n    render(<MainDashboard />)\n    \n    await waitFor(() => {\n      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()\n    })\n    \n    // Click on equipment link\n    const equipmentLink = screen.getByText('View All Equipment')\n    await user.click(equipmentLink)\n    \n    // Should navigate to equipment page\n    expect(window.location.pathname).toBe('/equipment')\n  })\n})"