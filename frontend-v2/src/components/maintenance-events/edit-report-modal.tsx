'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { useUpdateDailyReport } from '@/hooks/use-maintenance-events'
import { DailyReport, UpdateDailyReportRequest } from '@/types/maintenance-events'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { MultiSelectInspector } from '@/components/ui/multi-select-inspector'
import { Badge } from '@/components/ui/badge'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'

const editReportSchema = z.object({
  report_date: z.date({
    message: 'Report date is required',
  }),
  description: z.string().min(1, 'Description is required'),
  inspector_ids: z.array(z.number()).min(1, 'At least one inspector is required'),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  safety_notes: z.string().optional(),
})

type EditReportFormData = z.infer<typeof editReportSchema>

interface EditReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: DailyReport | null
  onSuccess?: () => void
}

// Mock inspectors data - in real app this would come from API
const mockInspectors = [
  { id: 1, name: 'John Smith' },
  { id: 2, name: 'Sarah Johnson' },
  { id: 3, name: 'Mike Wilson' },
  { id: 4, name: 'Lisa Brown' },
  { id: 5, name: 'David Lee' },
]



export function EditReportModal({
  isOpen,
  onClose,
  report,
  onSuccess
}: EditReportModalProps) {
  const [selectedInspectors, setSelectedInspectors] = useState<number[]>([])
  const updateReportMutation = useUpdateDailyReport()

  const form = useForm<EditReportFormData>({
    resolver: zodResolver(editReportSchema),
    defaultValues: {
      report_date: new Date(),
      description: '',
      inspector_ids: [],
      findings: '',
      recommendations: '',
      safety_notes: '',
    },
  })

  // Update form when report changes
  useEffect(() => {
    if (report && isOpen) {
      const reportDate = parseISO(report.report_date)
      
      form.reset({
        report_date: reportDate,
        description: report.description || '',
        inspector_ids: report.inspector_ids || [],
        findings: report.findings || '',
        recommendations: report.recommendations || '',
        safety_notes: report.safety_notes || '',
      })
      
      setSelectedInspectors(report.inspector_ids || [])
    }
  }, [report, isOpen, form])

  const handleClose = () => {
    form.reset()
    setSelectedInspectors([])
    onClose()
  }

  const handleInspectorSelectionChange = (newSelectedIds: number[]) => {
    setSelectedInspectors(newSelectedIds)
    form.setValue('inspector_ids', newSelectedIds)
  }

  const onSubmit = async (data: EditReportFormData) => {
    if (!report) return

    try {
      const updateData: UpdateDailyReportRequest = {
        report_date: format(data.report_date, 'yyyy-MM-dd'),
        description: data.description,
        inspector_ids: data.inspector_ids,
        findings: data.findings || undefined,
        recommendations: data.recommendations || undefined,
        safety_notes: data.safety_notes || undefined,
      }

      await updateReportMutation.mutateAsync({ id: report.id, data: updateData })
      handleClose()
      onSuccess?.()
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Failed to update report:', error)
    }
  }

  if (!report) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit Daily Report</DialogTitle>
          <DialogDescription>
            Edit the daily report from {format(parseISO(report.report_date), 'MMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Report Date */}
            <FormField
              control={form.control}
              name="report_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder="Select report date"
                      disableFuture={true}
                      inModal={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inspectors */}
            <div className="space-y-3">
              <Label>Inspectors *</Label>
              <MultiSelectInspector
                inspectors={mockInspectors}
                selectedIds={selectedInspectors}
                onSelectionChange={handleInspectorSelectionChange}
                placeholder="Select inspectors from the list"
                inModal={true}
              />
              
              {form.formState.errors.inspector_ids && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.inspector_ids.message}
                </p>
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work performed, observations, and activities..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Findings */}
            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Findings</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Document any findings, issues, or anomalies discovered..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Record any significant findings or observations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recommendations */}
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide recommendations for follow-up actions or improvements..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Suggest actions or improvements based on findings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Safety Notes */}
            <FormField
              control={form.control}
              name="safety_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Safety Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Document any safety concerns, incidents, or precautions taken..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Record safety-related observations or incidents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateReportMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateReportMutation.isPending}
                className="gap-2"
              >
                {updateReportMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}