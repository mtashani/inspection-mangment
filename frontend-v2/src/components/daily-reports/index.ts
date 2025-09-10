// Daily Reports Components Export
// Central export file for all Daily Reports components

// Main components
export { DailyReportsContainer } from './daily-reports-container'
export { DailyReportsHeader, CompactDailyReportsHeader, DailyReportsHeaderActions } from './daily-reports-header'
export { DailyReportsErrorBoundary, useErrorHandler } from './daily-reports-error-boundary'

// Data display components
export { SummaryCards, CompactSummaryCards, DetailedSummaryCards, SummaryCardsSkeleton } from './summary-cards'
export { FilterPanel } from './filter-panel'
export { HierarchicalList } from './hierarchical-list'

// Modal components
export { CreateReportModal } from './create-report-modal'
export { EditReportModal } from './edit-report-modal'

// Loading and skeleton components
export {
  DailyReportsPageSkeleton,
  SummaryCardsSkeleton,
  FilterPanelSkeleton,
  HierarchicalListSkeleton,
  MaintenanceEventCardSkeleton,
  InspectionCardSkeleton,
  DailyReportCardSkeleton,
  InlineLoadingSkeleton,
  EmptyStateSkeleton
} from './daily-reports-skeleton'

// Type exports for convenience
export type {
  DailyReportsContainerProps,
  SummaryCardsProps,
  FilterPanelProps,
  HierarchicalListProps,
  CreateReportModalProps,
  EditReportModalProps
} from '@/types/daily-reports'