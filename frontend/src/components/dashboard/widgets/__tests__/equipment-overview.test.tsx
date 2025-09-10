import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import { EquipmentOverview } from '../equipment-overview'
import { TestDataFactory } from '@/test/test-utils'

// Mock the useWidgetData hook
const mockUseWidgetData = jest.fn()
jest.mock('../dashboard-widget', () => ({
  useWidgetData: mockUseWidgetData,
  DashboardWidget: ({ children, title, isLoading, error, ...props }: any) => (
    <div data-testid="dashboard-widget" data-title={title}>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {!isLoading && !error && children}
    </div>
  ),
}))

// Mock the recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: any) => <div data-testid="pie">{JSON.stringify(data)}</div>,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

describe('EquipmentOverview', () => {
  const defaultProps = {
    title: 'Equipment Overview',
    config: {
      showRiskLevels: true,
      showStatus: true,
      showMaintenance: false,
      chartType: 'pie' as const,
    },
    onConfigChange: jest.fn(),
    onRemove: jest.fn(),
  }

  const mockEquipmentData = [
    TestDataFactory.equipment({ 
      id: 'eq-001', 
      name: 'Pressure Vessel A1', 
      status: 'operational',
      riskLevel: 'low'
    }),
    TestDataFactory.equipment({ 
      id: 'eq-002', 
      name: 'Heat Exchanger B2', 
      status: 'maintenance',
      riskLevel: 'medium'
    }),
    TestDataFactory.equipment({ 
      id: 'eq-003', 
      name: 'Pump C3', 
      status: 'critical',
      riskLevel: 'high'
    }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWidgetData.mockReturnValue({
      data: mockEquipmentData,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: jest.fn(),
    })
  })

  it('renders equipment overview with summary cards', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // Total equipment
      expect(screen.getByText('Total')).toBeInTheDocument()
    })
  })

  it('shows operational equipment count', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Operational count
      expect(screen.getByText('Operational')).toBeInTheDocument()
    })
  })

  it('shows critical equipment count', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Critical count
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })
  })

  it('displays progress indicators', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Operational Status')).toBeInTheDocument()
      expect(screen.getByText('33.3%')).toBeInTheDocument() // 1/3 operational
    })
  })

  it('shows risk level progress when enabled', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('High Risk Equipment')).toBeInTheDocument()
      expect(screen.getByText('1 items')).toBeInTheDocument()
    })
  })

  it('renders pie charts when chart type is pie', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getAllByTestId('pie-chart')).toHaveLength(2) // Status and Risk charts
      expect(screen.getByText('Status Distribution')).toBeInTheDocument()
      expect(screen.getByText('Risk Distribution')).toBeInTheDocument()
    })
  })

  it('renders bar chart when chart type is bar', async () => {
    const props = {
      ...defaultProps,
      config: { ...defaultProps.config, chartType: 'bar' as const }
    }
    
    render(<EquipmentOverview {...props} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      expect(screen.getByText('Equipment Overview')).toBeInTheDocument()
    })
  })

  it('shows maintenance section when enabled', async () => {
    const props = {
      ...defaultProps,
      config: { ...defaultProps.config, showMaintenance: true }
    }
    
    render(<EquipmentOverview {...props} />)
    
    await waitFor(() => {
      expect(screen.getByText('Attention Required')).toBeInTheDocument()
    })
  })

  it('displays equipment requiring attention', async () => {
    const props = {
      ...defaultProps,
      config: { ...defaultProps.config, showMaintenance: true }
    }
    
    render(<EquipmentOverview {...props} />)
    
    await waitFor(() => {
      // Should show critical and high risk equipment
      expect(screen.getByText('Pump C3')).toBeInTheDocument()
      expect(screen.getByText('critical')).toBeInTheDocument()
      expect(screen.getByText('high risk')).toBeInTheDocument()
    })
  })

  it('handles loading state', () => {
    mockUseWidgetData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      lastUpdated: null,
      refresh: jest.fn(),
    })

    render(<EquipmentOverview {...defaultProps} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles error state', () => {
    mockUseWidgetData.mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to load equipment data',
      lastUpdated: null,
      refresh: jest.fn(),
    })

    render(<EquipmentOverview {...defaultProps} />)
    expect(screen.getByText('Error: Failed to load equipment data')).toBeInTheDocument()
  })

  it('calls onConfigChange when configuration changes', () => {
    render(<EquipmentOverview {...defaultProps} />)
    expect(defaultProps.onConfigChange).toBeDefined()
  })

  it('calls onRemove when remove is triggered', () => {
    render(<EquipmentOverview {...defaultProps} />)
    expect(defaultProps.onRemove).toBeDefined()
  })

  it('calculates metrics correctly', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      // Total equipment: 3
      expect(screen.getByText('3')).toBeInTheDocument()
      
      // Operational: 1 out of 3 = 33.3%
      expect(screen.getByText('33.3%')).toBeInTheDocument()
      
      // Critical: 1
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('shows equipment badge with count', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('3 Equipment')).toBeInTheDocument()
    })
  })

  it('handles empty data gracefully', async () => {
    mockUseWidgetData.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      refresh: jest.fn(),
    })

    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('No equipment data available')).toBeInTheDocument()
    })
  })

  it('formats risk level colors correctly', async () => {
    render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      const highRiskElement = screen.getByText('high risk')
      expect(highRiskElement).toHaveClass('text-red-600')
      
      const mediumRiskElement = screen.getByText('medium risk')
      expect(mediumRiskElement).toHaveClass('text-yellow-600')
    })
  })

  it('is accessible with proper ARIA labels', async () => {
    const { container } = render(<EquipmentOverview {...defaultProps} />)
    
    await waitFor(() => {
      const charts = container.querySelectorAll('[role="img"]')
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('aria-label')
      })
    })
  })
})