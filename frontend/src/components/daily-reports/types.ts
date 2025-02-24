import { z } from "zod"

export type InspectionStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface DailyReport {
  id: string
  inspectionId: string
  date: string
  inspectors: string[]
  description: string
  status: InspectionStatus
}

export interface InspectionGroup {
  id: string
  equipmentTag: string
  startDate: string
  status: InspectionStatus
  reports: DailyReport[]
}

export interface NewInspectionFormValues {
  equipmentTag: string
  startDate: string
}

export const inspectionStatuses = [
  { value: "all", label: "All Status" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" }
] as const

export const createReportSchema = (startDate?: string) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  return z.object({
    date: z.string().refine(
      (date) => {
        if (!startDate) return true
        const selectedDate = new Date(date)
        const startDateObj = new Date(startDate)
        return selectedDate >= startDateObj && selectedDate <= today
      },
      { message: "Date must be between inspection start date and today" }
    ),
    inspectors: z.array(z.string()).min(1, "At least one inspector must be selected"),
    description: z.string().min(1, "Description is required")
  })
}

export type ReportFormValues = z.infer<ReturnType<typeof createReportSchema>>

export const newInspectionSchema = z.object({
  equipmentTag: z.string().min(1, "Equipment tag is required"),
  startDate: z.string()
})