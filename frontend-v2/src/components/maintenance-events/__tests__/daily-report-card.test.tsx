import React from 'react'
import { render, screen } from '@/test-utils'
import { DailyReportCard } from '../daily-report-card'
import { DailyReport } from '@/types/maintenance-events'

const mockDailyReport: DailyReport = {
  id: 1,
  inspection_id: 1,
  report_date: '2024-01-15',
  description: 'Daily inspection completed successfully',
  inspector_ids: [1, 2],
  inspector_names: 'John Doe, Jane Smith',
  findings: 'No issues found during inspection',
  recommendations: 'Continue regular monitoring',
  weather_conditions: 'Clear, 20°C',
  safety_notes: 'All safety protocols followed',
  attachments: ['photo1.jpg', 'report.pdf'],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T14:30:00Z',
}

const mockOnEdit = jest.fn()
const mockOnDelete = jest.fn()

describe('DailyReportCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Compact Mode', () => {
    it('renders compact view correctly', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Daily inspection completed successfully')).toBeInTheDocument()
    })

    it('shows edit and delete buttons in compact mode', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('calls onEdit when edit button is clicked in compact mode', async () => {
      const { user } = render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
    })

    it('calls onDelete when delete button is clicked in compact mode', async () => {
      const { user } = render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })

    it('truncates long descriptions in compact mode', () => {
      const reportWithLongDescription = {
        ...mockDailyReport,
        description: 'This is a very long description that should be truncated in compact mode to maintain proper layout and readability'
      }

      render(
        <DailyReportCard 
          report={reportWithLongDescription} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const descriptionElement = screen.getByText(reportWithLongDescription.description)
      expect(descriptionElement).toHaveClass('line-clamp-1')
    })

    it('handles missing inspector names in compact mode', () => {
      const reportWithoutInspectors = { ...mockDailyReport, inspector_names: undefined }

      render(
        <DailyReportCard 
          report={reportWithoutInspectors} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
      expect(screen.queryByText('John Doe, Jane Smith')).not.toBeInTheDocument()
    })
  })

  describe('Full Mode', () => {
    it('renders full view correctly', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Daily Report - Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('Inspector(s): John Doe, Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Daily inspection completed successfully')).toBeInTheDocument()
      expect(screen.getByText('No issues found during inspection')).toBeInTheDocument()
      expect(screen.getByText('Continue regular monitoring')).toBeInTheDocument()
    })

    it('shows all sections in full mode', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Findings')).toBeInTheDocument()
      expect(screen.getByText('Recommendations')).toBeInTheDocument()
    })

    it('shows created and updated timestamps', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/Created: Jan 15, 2024 10:00/)).toBeInTheDocument()
      expect(screen.getByText(/Updated: Jan 15, 2024 14:30/)).toBeInTheDocument()
    })

    it('hides updated timestamp when same as created', () => {
      const reportNotUpdated = { ...mockDailyReport, updated_at: mockDailyReport.created_at }

      render(
        <DailyReportCard 
          report={reportNotUpdated} 
          compact={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText(/Created: Jan 15, 2024 10:00/)).toBeInTheDocument()
      expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument()
    })

    it('handles missing optional fields gracefully', () => {
      const minimalReport: DailyReport = {
        id: 1,
        inspection_id: 1,
        report_date: '2024-01-15',
        description: 'Basic report',
        inspector_ids: [1],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      render(
        <DailyReportCard 
          report={minimalReport} 
          compact={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      expect(screen.getByText('Basic report')).toBeInTheDocument()
      expect(screen.queryByText('Findings')).not.toBeInTheDocument()
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument()
      expect(screen.queryByText('Inspector(s):')).not.toBeInTheDocument()
    })
  })

  describe('Common Functionality', () => {
    it('handles missing onEdit callback gracefully', async () => {
      const { user } = render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      // Should not throw error
      expect(editButton).toBeInTheDocument()
    })

    it('handles missing onDelete callback gracefully', async () => {
      const { user } = render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Should not throw error
      expect(deleteButton).toBeInTheDocument()
    })

    it('applies hover effects', async () => {
      const { user } = render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const card = screen.getByRole('article')
      await user.hover(card)

      expect(card).toHaveClass('hover:shadow-sm')
    })

    it('shows correct button icons', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editIcon = screen.getByTestId('edit-icon')
      const deleteIcon = screen.getByTestId('trash-icon')

      expect(editIcon).toBeInTheDocument()
      expect(deleteIcon).toBeInTheDocument()
    })

    it('applies destructive styling to delete button', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      expect(deleteButton).toHaveClass('text-destructive', 'hover:text-destructive')
    })

    it('formats dates consistently', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Check that all dates use consistent formatting
      expect(screen.getByText('Daily Report - Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText(/Created: Jan 15, 2024 10:00/)).toBeInTheDocument()
    })

    it('handles keyboard navigation', async () => {
      const { user } = render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      // Tab to edit button
      await user.tab()
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toHaveFocus()

      // Tab to delete button
      await user.tab()
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      expect(deleteButton).toHaveFocus()
    })

    it('shows proper accessibility attributes', () => {
      render(
        <DailyReportCard 
          report={mockDailyReport} 
          compact={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      const deleteButton = screen.getByRole('button', { name: /delete/i })

      expect(editButton).toHaveAttribute('aria-label')
      expect(deleteButton).toHaveAttribute('aria-label')
    })
  })
})